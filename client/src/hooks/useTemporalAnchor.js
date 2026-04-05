/**
 * useTemporalAnchor — Optimistic History Management Hook
 * 
 * Architecture:
 *  1. User action → instant optimistic insert into local state (zero-latency UI)
 *  2. Background fetch to /api/history/anchor (persists to DB)
 *  3. On success: replaces temp node with real server node (with anchor_hash)
 *  4. On failure: marks node as "sync_failed" for retry UI
 *
 * Shadow Versioning:
 *  editEvent() → calls /api/history/shadow, never overwrites existing anchored node.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import api from '../services/api'

const CATEGORY_ICONS = {
  skill_update:       '⚡',
  task_completed:     '✅',
  roadmap_milestone:  '🗺️',
  resume_event:       '📄',
  coach_session:      '💬',
  profile_update:     '👤',
  medical_update:     '🏥',
  system_event:       '⚙️',
  growth_twin:        '🌱',
}

const CATEGORY_COLORS = {
  skill_update:       { glow: 'rgba(99,102,241,0.4)',  pill: '#6366f1', bg: 'rgba(99,102,241,0.08)'  },
  task_completed:     { glow: 'rgba(16,185,129,0.4)',  pill: '#10b981', bg: 'rgba(16,185,129,0.08)'  },
  roadmap_milestone:  { glow: 'rgba(245,158,11,0.4)',  pill: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
  resume_event:       { glow: 'rgba(56,189,248,0.4)',  pill: '#38bdf8', bg: 'rgba(56,189,248,0.08)'  },
  coach_session:      { glow: 'rgba(236,72,153,0.4)',  pill: '#ec4899', bg: 'rgba(236,72,153,0.08)'  },
  profile_update:     { glow: 'rgba(139,92,246,0.4)',  pill: '#8b5cf6', bg: 'rgba(139,92,246,0.08)'  },
  medical_update:     { glow: 'rgba(239,68,68,0.4)',   pill: '#ef4444', bg: 'rgba(239,68,68,0.08)'   },
  system_event:       { glow: 'rgba(100,116,139,0.4)', pill: '#64748b', bg: 'rgba(100,116,139,0.08)' },
  growth_twin:        { glow: 'rgba(20,184,166,0.4)',  pill: '#14b8a6', bg: 'rgba(20,184,166,0.08)'  },
}

function genClientRef() {
  return `opt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function getCategoryMeta(category) {
  return {
    icon:  CATEGORY_ICONS[category]  ?? '📌',
    color: CATEGORY_COLORS[category] ?? { glow: 'rgba(99,102,241,0.4)', pill: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
  }
}

export default function useTemporalAnchor() {
  const [nodes,     setNodes]     = useState([])
  const [total,     setTotal]     = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [syncing,   setSyncing]   = useState(false)
  const [stats,     setStats]     = useState(null)
  const [error,     setError]     = useState(null)

  // Search / filter state
  const [filters, setFilters] = useState({
    search:     '',
    category:   'all',
    from_date:  '',
    to_date:    '',
    pinned_only: false,
  })
  const [offset, setOffset] = useState(0)
  const LIMIT = 30

  const retryQueueRef = useRef([])   // Failed optimistic saves to retry
  const debounceRef   = useRef(null)

  // ── Fetch Timeline ────────────────────────────────────────────────
  const fetchTimeline = useCallback(async (overrideOffset = 0, replace = true) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        limit:  LIMIT,
        offset: overrideOffset,
      })
      if (filters.category && filters.category !== 'all') params.set('category', filters.category)
      if (filters.search)     params.set('search',     filters.search)
      if (filters.from_date)  params.set('from_date',  filters.from_date)
      if (filters.to_date)    params.set('to_date',    filters.to_date)
      if (filters.pinned_only) params.set('pinned_only', 'true')

      const res = await api.get(`/history/timeline?${params}`)
      const data = res.data

      setTotal(data.total)
      setNodes(prev => replace ? data.nodes : [...prev, ...data.nodes])
      setOffset(overrideOffset)
    } catch (err) {
      setError(err?.response?.data?.detail ?? 'Failed to load history.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Debounced re-fetch on filter change
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchTimeline(0, true), 300)
    return () => clearTimeout(debounceRef.current)
  }, [filters, fetchTimeline])

  // ── Fetch Stats ───────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/history/stats')
      setStats(res.data)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  // ── Load More (Windowing) ─────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (nodes.length < total && !loading) {
      fetchTimeline(offset + LIMIT, false)
    }
  }, [nodes.length, total, loading, offset, fetchTimeline])

  // ── Anchor Event (Optimistic) ─────────────────────────────────────
  const anchorEvent = useCallback(async ({
    category, title, summary = '', payload = {}, tags = []
  }) => {
    const clientRef = genClientRef()
    const now       = new Date().toISOString()

    // 1. Optimistic insert — instant UI
    const optimisticNode = {
      id:          clientRef,
      node_id:     clientRef,
      category,
      title,
      summary,
      payload,
      tags,
      anchor_hash: 'pending…',
      status:      'anchored',
      anchored_at: now,
      client_ts:   now,
      is_pinned:   false,
      shadow_count: 0,
      shadow_versions: [],
      _optimistic: true,   // Flag for UI differentiation
    }
    setNodes(prev => [optimisticNode, ...prev])
    setTotal(prev => prev + 1)

    // 2. Background sync
    setSyncing(true)
    try {
      const res = await api.post('/history/anchor', {
        client_ref_id:    clientRef,
        category,
        title,
        summary,
        payload,
        tags,
        client_ts:        now,
        timezone_offset:  -new Date().getTimezoneOffset(),
      })
      const realNode = res.data.node

      // 3. Replace optimistic node with real server node
      setNodes(prev => prev.map(n => n.node_id === clientRef ? { ...realNode, _optimistic: false } : n))
      fetchStats()
    } catch (err) {
      // 4. Mark as failed
      setNodes(prev => prev.map(n =>
        n.node_id === clientRef ? { ...n, _syncFailed: true, anchor_hash: '❌ sync failed' } : n
      ))
      retryQueueRef.current.push({ clientRef, category, title, summary, payload, tags })
    } finally {
      setSyncing(false)
    }
  }, [fetchStats])

  // ── Edit → Shadow Version ─────────────────────────────────────────
  const editEvent = useCallback(async (parentNodeId, { title, summary, payload, tags }) => {
    setSyncing(true)
    try {
      const res = await api.post('/history/shadow', {
        client_ref_id:  genClientRef(),
        parent_node_id: parentNodeId,
        title,
        summary,
        payload,
        tags,
      })
      const newNode = res.data.node
      // Replace superseded node with the new shadow version
      setNodes(prev => prev.map(n =>
        n.node_id === parentNodeId ? { ...newNode, _optimistic: false } : n
      ))
    } catch (err) {
      setError('Edit failed — the original entry is preserved.')
    } finally {
      setSyncing(false)
    }
  }, [])

  // ── Pin Toggle ────────────────────────────────────────────────────
  const togglePin = useCallback(async (nodeId, currentlyPinned) => {
    // Optimistic
    setNodes(prev => prev.map(n =>
      n.node_id === nodeId ? { ...n, is_pinned: !currentlyPinned } : n
    ))
    try {
      await api.patch('/history/pin', { node_id: nodeId, is_pinned: !currentlyPinned })
    } catch {
      // Revert
      setNodes(prev => prev.map(n =>
        n.node_id === nodeId ? { ...n, is_pinned: currentlyPinned } : n
      ))
    }
  }, [])

  // ── Filter Helpers ────────────────────────────────────────────────
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({ search: '', category: 'all', from_date: '', to_date: '', pinned_only: false })
  }, [])

  return {
    nodes,
    total,
    loading,
    syncing,
    stats,
    error,
    filters,
    hasMore:      nodes.length < total,
    anchorEvent,
    editEvent,
    togglePin,
    loadMore,
    refresh:      () => fetchTimeline(0, true),
    updateFilter,
    clearFilters,
    getCategoryMeta,
  }
}
