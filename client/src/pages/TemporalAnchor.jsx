/**
 * TemporalAnchor — Luminous Drifting Timeline
 *
 * Features:
 *  • Glassmorphism cards with spring crystallization animations (Framer Motion)
 *  • Chronological Drift: newer → brighter glow, older → dimmer/faded
 *  • Floating search bar with category filter pills
 *  • Lazy-load windowing via IntersectionObserver sentinel
 *  • Shadow version drawer (audit trail)
 *  • Optimistic UI: pending cards animate until synced
 *  • Immutable: no delete button — only edit (creates shadow version)
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useTemporalAnchor, { getCategoryMeta } from '../hooks/useTemporalAnchor'

// ── Spring config for "crystallizing" card entrance ─────────────────
const SPRING_ENTRY = {
  type: 'spring',
  stiffness: 420,
  damping: 30,
  mass: 0.8,
}

const SPRING_EXIT = {
  type: 'spring',
  stiffness: 300,
  damping: 28,
  mass: 0.6,
}

// ── Category filter pills ───────────────────────────────────────────
const CATEGORIES = [
  { value: 'all',              label: 'All',        icon: '🌐' },
  { value: 'skill_update',     label: 'Skills',     icon: '⚡' },
  { value: 'task_completed',   label: 'Tasks',      icon: '✅' },
  { value: 'roadmap_milestone',label: 'Roadmap',    icon: '🗺️' },
  { value: 'resume_event',     label: 'Resume',     icon: '📄' },
  { value: 'coach_session',    label: 'Coach',      icon: '💬' },
  { value: 'growth_twin',      label: 'Twin',       icon: '🌱' },
  { value: 'medical_update',   label: 'Medical',    icon: '🏥' },
  { value: 'profile_update',   label: 'Profile',    icon: '👤' },
]

// ── Utility: compute glow intensity based on recency ────────────────
function getRecencyGlow(anchored_at, index) {
  const now    = Date.now()
  const age_ms = now - new Date(anchored_at).getTime()
  const hours  = age_ms / (1000 * 60 * 60)
  // Fade from 1.0 (brand-new) → 0.2 (week old)
  const recency = Math.max(0.2, 1 - (hours / 168))
  return recency
}

function formatRelativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatFullDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour:  '2-digit', minute: '2-digit',
  })
}

// ── Shadow Version Drawer ────────────────────────────────────────────
function ShadowDrawer({ versions, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -8 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      style={{
        overflow:      'hidden',
        borderTop:     '1px solid rgba(99,102,241,0.15)',
        marginTop:     16,
        paddingTop:    16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--purple)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          🕰️ Audit Trail ({versions.length} version{versions.length !== 1 ? 's' : ''})
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>✕</button>
      </div>
      {versions.map((v, i) => (
        <div key={v.node_id} style={{
          background:   'rgba(99,102,241,0.04)',
          border:       '1px solid rgba(99,102,241,0.1)',
          borderRadius: 10,
          padding:      '10px 14px',
          marginBottom: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{v.title}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatRelativeTime(v.anchored_at)}</span>
          </div>
          {v.summary && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{v.summary}</p>}
          <div style={{ marginTop: 6 }}>
            <span style={{
              fontFamily:   'monospace',
              fontSize:     '0.65rem',
              color:        'var(--purple)',
              background:   'rgba(99,102,241,0.08)',
              padding:      '2px 6px',
              borderRadius: 4,
            }}>
              #{v.anchor_hash}
            </span>
          </div>
        </div>
      ))}
    </motion.div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────
function EditModal({ node, onSave, onClose }) {
  const [title,   setTitle]   = useState(node.title)
  const [summary, setSummary] = useState(node.summary || '')
  const [saving,  setSaving]  = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave(node.node_id, { title, summary, payload: node.payload, tags: node.tags })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position:        'fixed',
        inset:           0,
        background:      'rgba(0,0,0,0.4)',
        backdropFilter:  'blur(8px)',
        zIndex:          9999,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={SPRING_ENTRY}
        onClick={e => e.stopPropagation()}
        style={{
          background:    'rgba(255,255,255,0.98)',
          backdropFilter:'blur(24px)',
          border:        '1px solid rgba(99,102,241,0.25)',
          borderRadius:  24,
          padding:       32,
          width:         '100%',
          maxWidth:      480,
          boxShadow:     '0 32px 64px rgba(0,0,0,0.15), 0 0 0 1px rgba(99,102,241,0.1)',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
          <span style={{ fontSize:'1.4rem' }}>{getCategoryMeta(node.category).icon}</span>
          <div>
            <h3 style={{ margin:0, fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:700 }}>Edit Entry</h3>
            <p style={{ margin:0, fontSize:'0.75rem', color:'var(--text-muted)' }}>A shadow version will be created — original preserved.</p>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label>Title</label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Summary</label>
            <textarea className="form-input" rows={3} value={summary} onChange={e => setSummary(e.target.value)} />
          </div>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:24 }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? 'Saving…' : '✨ Create Shadow Version'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Single Timeline Card ──────────────────────────────────────────────
function TimelineCard({ node, index, onPin, onEdit }) {
  const [showAudit, setShowAudit]   = useState(false)
  const [showEdit,  setShowEdit]    = useState(false)
  const { icon, color } = getCategoryMeta(node.category)
  const recency = getRecencyGlow(node.anchored_at, index)

  const glowOpacity    = recency          // 0.2..1.0
  const cardOpacity    = Math.max(0.55, recency)  // cards never fully invisible
  const glowBlur       = Math.round(8 + recency * 20) // 8..28px

  const isPending  = node._optimistic && !node._syncFailed
  const isFailed   = node._syncFailed

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: cardOpacity, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.95 }}
        transition={SPRING_ENTRY}
        style={{
          position:      'relative',
          background:    'rgba(255,255,255,0.88)',
          backdropFilter:'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border:        `1px solid ${isFailed ? 'rgba(239,68,68,0.3)' : isPending ? 'rgba(99,102,241,0.2)' : 'rgba(226,232,240,0.8)'}`,
          borderRadius:  20,
          padding:       '18px 20px',
          marginBottom:  14,
          overflow:      'hidden',
          boxShadow:     isFailed
            ? '0 4px 20px rgba(239,68,68,0.15)'
            : isPending
              ? `0 0 ${glowBlur}px ${color.glow.replace('0.4', '0.25')}`
              : `0 4px 16px rgba(0,0,0,0.06), 0 0 ${glowBlur}px ${color.glow.replace('0.4', String(glowOpacity * 0.25))}`,
          transition:    'box-shadow 0.4s ease, opacity 0.4s ease',
        }}
        whileHover={{
          scale:     1.008,
          boxShadow: `0 8px 32px rgba(0,0,0,0.1), 0 0 ${glowBlur + 8}px ${color.glow}`,
          transition: { duration: 0.25 },
        }}
      >
        {/* Luminous left rail */}
        <div style={{
          position:     'absolute',
          left:         0,
          top:          0,
          bottom:       0,
          width:        3,
          background:   color.pill,
          opacity:      glowOpacity,
          borderRadius: '20px 0 0 20px',
          boxShadow:    `0 0 12px ${color.glow}`,
          transition:   'opacity 0.4s ease',
        }} />

        {/* Pending shimmer overlay */}
        {isPending && (
          <div style={{
            position:   'absolute',
            inset:      0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.04) 50%, transparent 100%)',
            animation:  'shimmer 1.8s infinite',
            borderRadius: 20,
            pointerEvents: 'none',
          }} />
        )}

        {/* Header row */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:12, paddingLeft:10 }}>
          {/* Category icon bubble */}
          <div style={{
            width:        38,
            height:       38,
            borderRadius: 12,
            background:   color.bg,
            border:       `1px solid ${color.pill}30`,
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            fontSize:     '1.1rem',
            flexShrink:   0,
            boxShadow:    `0 0 12px ${color.glow.replace('0.4', String(glowOpacity * 0.3))}`,
          }}>
            {icon}
          </div>

          {/* Title + meta */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
              <h4 style={{
                margin:0,
                fontFamily: 'var(--font-display)',
                fontSize:   '0.9rem',
                fontWeight: 700,
                color:      'var(--text-primary)',
                opacity:    cardOpacity,
              }}>
                {node.title}
              </h4>
              {/* Category pill */}
              <span style={{
                background:   color.bg,
                color:        color.pill,
                border:       `1px solid ${color.pill}30`,
                borderRadius: 999,
                padding:      '2px 8px',
                fontSize:     '0.65rem',
                fontWeight:   700,
              }}>
                {node.category.replace(/_/g, ' ')}
              </span>
              {/* Status badges */}
              {isPending && (
                <span style={{ background:'rgba(99,102,241,0.08)', color:'var(--purple)', borderRadius:999, padding:'2px 8px', fontSize:'0.6rem', fontWeight:700, border:'1px solid rgba(99,102,241,0.2)' }}>
                  ⟳ syncing…
                </span>
              )}
              {isFailed && (
                <span style={{ background:'rgba(239,68,68,0.08)', color:'var(--red)', borderRadius:999, padding:'2px 8px', fontSize:'0.6rem', fontWeight:700, border:'1px solid rgba(239,68,68,0.2)' }}>
                  ✗ sync failed
                </span>
              )}
              {node.shadow_count > 0 && (
                <button
                  onClick={() => setShowAudit(v => !v)}
                  style={{ background:'rgba(139,92,246,0.08)', color:'var(--purple)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:999, padding:'2px 8px', fontSize:'0.6rem', fontWeight:700, cursor:'pointer' }}
                >
                  🕰️ {node.shadow_count} version{node.shadow_count !== 1 ? 's' : ''}
                </button>
              )}
            </div>

            {/* Summary */}
            {node.summary && (
              <p style={{ margin:'0 0 8px', fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:1.5, opacity: Math.max(0.55, cardOpacity) }}>
                {node.summary}
              </p>
            )}

            {/* Tags */}
            {node.tags && node.tags.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
                {node.tags.map(tag => (
                  <span key={tag} style={{
                    background:   'rgba(100,116,139,0.08)',
                    color:        'var(--text-muted)',
                    border:       '1px solid rgba(100,116,139,0.15)',
                    borderRadius: 6,
                    padding:      '1px 7px',
                    fontSize:     '0.65rem',
                    fontWeight:   600,
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            {/* Pin */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onPin(node.node_id, node.is_pinned)}
              title={node.is_pinned ? 'Unpin' : 'Pin'}
              style={{
                width:        28,
                height:       28,
                borderRadius: 8,
                border:       'none',
                background:   node.is_pinned ? 'rgba(245,158,11,0.12)' : 'rgba(100,116,139,0.08)',
                color:        node.is_pinned ? '#f59e0b' : 'var(--text-muted)',
                cursor:       'pointer',
                fontSize:     '0.85rem',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                transition:   'all 0.2s',
              }}
            >
              {node.is_pinned ? '📌' : '📎'}
            </motion.button>

            {/* Edit → Shadow version */}
            {!isPending && !isFailed && (
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowEdit(true)}
                title="Edit (creates shadow version)"
                style={{
                  width:        28,
                  height:       28,
                  borderRadius: 8,
                  border:       'none',
                  background:   'rgba(99,102,241,0.08)',
                  color:        'var(--purple)',
                  cursor:       'pointer',
                  fontSize:     '0.85rem',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'center',
                }}
              >
                ✏️
              </motion.button>
            )}
          </div>
        </div>

        {/* Footer: timestamp + anchor hash */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          paddingLeft:  10,
          paddingTop:   10,
          borderTop:    '1px solid rgba(226,232,240,0.5)',
          marginTop:    8,
        }}>
          <span title={formatFullDate(node.anchored_at)} style={{ fontSize:'0.7rem', color:'var(--text-muted)', opacity: Math.max(0.5, cardOpacity) }}>
            🕐 {formatRelativeTime(node.anchored_at)}
          </span>
          <span style={{ fontFamily:'monospace', fontSize:'0.6rem', color:'var(--text-muted)', opacity:0.5, letterSpacing:'0.3px' }}>
            #{node.anchor_hash?.slice(0, 12)}
          </span>
        </div>

        {/* Audit Trail */}
        <AnimatePresence>
          {showAudit && node.shadow_versions?.length > 0 && (
            <ShadowDrawer versions={node.shadow_versions} onClose={() => setShowAudit(false)} />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && (
          <EditModal node={node} onSave={onEdit} onClose={() => setShowEdit(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

// ── Main TemporalAnchor Page ──────────────────────────────────────────
export default function TemporalAnchor() {
  const {
    nodes, total, loading, syncing, stats, error,
    filters, hasMore,
    anchorEvent, editEvent, togglePin, loadMore,
    refresh, updateFilter, clearFilters,
  } = useTemporalAnchor()

  // Intersection observer for infinite scroll
  const sentinelRef = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loading) loadMore() },
      { threshold: 0.2 }
    )
    if (sentinelRef.current) obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loading, loadMore])

  // Quick-anchor demo form
  const [showQuickAnchor, setShowQuickAnchor] = useState(false)
  const [qaForm, setQaForm] = useState({ category: 'skill_update', title: '', summary: '', tags: '' })
  const [qaLoading, setQaLoading] = useState(false)

  const handleQuickAnchor = async () => {
    if (!qaForm.title.trim()) return
    setQaLoading(true)
    await anchorEvent({
      category: qaForm.category,
      title:    qaForm.title,
      summary:  qaForm.summary,
      tags:     qaForm.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setQaForm({ category: 'skill_update', title: '', summary: '', tags: '' })
    setShowQuickAnchor(false)
    setQaLoading(false)
  }

  const hasActiveFilters = filters.search || filters.category !== 'all' || filters.from_date || filters.to_date || filters.pinned_only

  return (
    <div className="page-content" style={{ maxWidth: 820, margin: '0 auto', padding: '24px' }}>

          {/* ── Page Header ─────────────────────────────────────────── */}
          <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, flexWrap:'wrap', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div>
                  <h1 className="page-title" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:2 }}>
                    <span style={{
                      background:    'linear-gradient(135deg, #6366f1, #38bdf8)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor:  'transparent',
                    }}>
                      Temporal Anchor
                    </span>
                    <span style={{ fontSize:'1.5rem' }}>⚓</span>
                  </h1>
                  <p className="page-subtitle">Every action, crystallized. Immutable history. Zero data loss.</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <motion.button
                  whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                  className="btn btn-ghost"
                  onClick={refresh}
                  style={{ gap:6 }}
                  disabled={loading}
                >
                  {loading ? '⟳' : '↺'} Refresh
                </motion.button>
                <motion.button
                  whileHover={{ scale:1.04, boxShadow:'0 8px 24px rgba(99,102,241,0.35)' }}
                  whileTap={{ scale:0.96 }}
                  className="btn btn-primary"
                  onClick={() => setShowQuickAnchor(v => !v)}
                  style={{ gap:6 }}
                >
                  ⚡ Anchor Event
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ── Stats Strip ──────────────────────────────────────────── */}
          {stats && (
            <motion.div
              initial={{ opacity:0, y:8 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.15 }}
              style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}
            >
              {[
                { label:'Total Events', value: stats.total_events, icon:'📊', c:'var(--purple)' },
                { label:'Pinned',       value: stats.pinned,       icon:'📌', c:'var(--orange)' },
                { label:'Categories',  value: Object.keys(stats.by_category||{}).length, icon:'🏷️', c:'var(--cyan)' },
              ].map(s => (
                <div key={s.label} style={{
                  background:   'rgba(255,255,255,0.8)',
                  backdropFilter:'blur(12px)',
                  border:       '1px solid rgba(226,232,240,0.8)',
                  borderRadius: 12,
                  padding:      '10px 18px',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          8,
                  boxShadow:    '0 2px 8px rgba(0,0,0,0.04)',
                  flex: '1 1 150px'
                }}>
                  <span style={{ fontSize:'1.1rem' }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize:'1.1rem', fontWeight:800, color:s.c, lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:600 }}>{s.label}</div>
                  </div>
                </div>
              ))}
              {syncing && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', background:'rgba(99,102,241,0.06)', borderRadius:12, border:'1px solid rgba(99,102,241,0.15)', flex:'1 1 150px' }}>
                  <div className="spinner spinner-sm" />
                  <span style={{ fontSize:'0.75rem', color:'var(--purple)', fontWeight:600 }}>Syncing to ledger…</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Quick Anchor Form ─────────────────────────────────────── */}
          <AnimatePresence>
            {showQuickAnchor && (
              <motion.div
                initial={{ opacity:0, height:0, y:-8 }}
                animate={{ opacity:1, height:'auto', y:0 }}
                exit={{ opacity:0, height:0, y:-8 }}
                transition={{ type:'spring', stiffness:380, damping:30 }}
                style={{
                  overflow: 'hidden',
                  marginBottom: 20,
                }}
              >
                <div style={{
                  background:    'rgba(255,255,255,0.92)',
                  backdropFilter:'blur(20px)',
                  border:        '1px solid rgba(99,102,241,0.2)',
                  borderRadius:  20,
                  padding:       24,
                  boxShadow:     '0 8px 32px rgba(99,102,241,0.1)',
                }}>
                  <h3 style={{ margin:'0 0 16px', fontFamily:'var(--font-display)', fontSize:'0.95rem', fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
                    ⚡ <span style={{ background:'linear-gradient(135deg,#6366f1,#38bdf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>New Temporal Anchor</span>
                  </h3>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    <div className="form-group">
                      <label>Category</label>
                      <select className="form-input" value={qaForm.category} onChange={e => setQaForm(f => ({ ...f, category: e.target.value }))}>
                        {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                          <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Tags (comma-separated)</label>
                      <input className="form-input" placeholder="e.g. ai, health, career" value={qaForm.tags} onChange={e => setQaForm(f => ({ ...f, tags: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom:12 }}>
                    <label>Title *</label>
                    <input className="form-input" placeholder="What happened?" value={qaForm.title} onChange={e => setQaForm(f => ({ ...f, title: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleQuickAnchor()} />
                  </div>
                  <div className="form-group" style={{ marginBottom:16 }}>
                    <label>Summary</label>
                    <textarea className="form-input" rows={2} placeholder="Optional context…" value={qaForm.summary} onChange={e => setQaForm(f => ({ ...f, summary: e.target.value }))} />
                  </div>
                  <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                    <button className="btn btn-ghost" onClick={() => setShowQuickAnchor(false)} disabled={qaLoading}>Cancel</button>
                    <motion.button
                      whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                      className="btn btn-primary"
                      onClick={handleQuickAnchor}
                      disabled={qaLoading || !qaForm.title.trim()}
                    >
                      {qaLoading ? '⟳ Anchoring…' : '⚡ Crystallize'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Floating Search & Filter Bar ─────────────────────────── */}
          <motion.div
            initial={{ opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.2 }}
            style={{
              position:      'sticky',
              top:           20,
              zIndex:        100,
              marginBottom:  20,
              background:    'rgba(248,250,252,0.9)',
              backdropFilter:'blur(20px)',
              border:        `1px solid ${hasActiveFilters ? 'rgba(99,102,241,0.3)' : 'rgba(226,232,240,0.8)'}`,
              borderRadius:  16,
              padding:       '12px 16px',
              boxShadow:     `0 4px 24px rgba(0,0,0,0.06)${hasActiveFilters ? ', 0 0 0 2px rgba(99,102,241,0.1)' : ''}`,
              transition:    'border-color 0.3s, box-shadow 0.3s',
            }}
          >
            {/* Search row */}
            <div style={{ display:'flex', gap:10, marginBottom:10, flexWrap:'wrap' }}>
              <div style={{ flex:1, position:'relative', minWidth: '100%' }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:'0.9rem', pointerEvents:'none' }}>🔍</span>
                <input
                  id="history-search"
                  className="form-input"
                  placeholder="Travel through your history…"
                  value={filters.search}
                  onChange={e => updateFilter('search', e.target.value)}
                  style={{ paddingLeft:36, borderRadius:10, fontSize:'0.85rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <input
                  type="date"
                  className="form-input"
                  title="From date"
                  value={filters.from_date}
                  onChange={e => updateFilter('from_date', e.target.value)}
                  style={{ flex:1, borderRadius:10, fontSize:'0.8rem' }}
                />
                <input
                  type="date"
                  className="form-input"
                  title="To date"
                  value={filters.to_date}
                  onChange={e => updateFilter('to_date', e.target.value)}
                  style={{ flex:1, borderRadius:10, fontSize:'0.8rem' }}
                />
              </div>
              {hasActiveFilters && (
                <button className="btn btn-ghost" onClick={clearFilters} style={{ flex: '1', whiteSpace:'nowrap', fontSize:'0.8rem', padding:'8px 12px' }}>✕ Clear</button>
              )}
            </div>

            {/* Category pills */}
            <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:2 }}>
              {CATEGORIES.map(cat => {
                const active = filters.category === cat.value
                return (
                  <motion.button
                    key={cat.value}
                    whileHover={{ scale:1.05 }}
                    whileTap={{ scale:0.95 }}
                    onClick={() => updateFilter('category', cat.value)}
                    style={{
                      whiteSpace:   'nowrap',
                      padding:      '5px 12px',
                      borderRadius: 999,
                      border:       `1px solid ${active ? 'rgba(99,102,241,0.5)' : 'rgba(226,232,240,0.8)'}`,
                      background:   active ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.7)',
                      color:        active ? 'var(--purple)' : 'var(--text-secondary)',
                      fontSize:     '0.75rem',
                      fontWeight:   active ? 700 : 500,
                      cursor:       'pointer',
                      transition:   'all 0.2s',
                    }}
                  >
                    {cat.icon} {cat.label}
                  </motion.button>
                )
              })}
              <motion.button
                whileHover={{ scale:1.05 }}
                whileTap={{ scale:0.95 }}
                onClick={() => updateFilter('pinned_only', !filters.pinned_only)}
                style={{
                  whiteSpace:   'nowrap',
                  padding:      '5px 12px',
                  borderRadius: 999,
                  border:       `1px solid ${filters.pinned_only ? 'rgba(245,158,11,0.5)' : 'rgba(226,232,240,0.8)'}`,
                  background:   filters.pinned_only ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.7)',
                  color:        filters.pinned_only ? '#f59e0b' : 'var(--text-secondary)',
                  fontSize:     '0.75rem',
                  fontWeight:   filters.pinned_only ? 700 : 500,
                  cursor:       'pointer',
                  transition:   'all 0.2s',
                }}
              >
                📌 Pinned
              </motion.button>
            </div>

            {/* Result count */}
            <div style={{ marginTop:8, fontSize:'0.7rem', color:'var(--text-muted)' }}>
              {loading
                ? 'Traveling through time…'
                : `${total} event${total !== 1 ? 's' : ''} anchored${hasActiveFilters ? ' (filtered)' : ''}`
              }
            </div>
          </motion.div>

          {/* ── Error ───────────────────────────────────────────────── */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom:16 }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Timeline ──────────────────────────────────────────────── */}
          <div style={{ position:'relative' }}>
            {/* Vertical glow rail */}
            <div style={{
              position:   'absolute',
              left:       18,
              top:        0,
              bottom:     0,
              width:      2,
              background: 'linear-gradient(to bottom, rgba(99,102,241,0.35) 0%, rgba(56,189,248,0.1) 60%, transparent 100%)',
              borderRadius: 1,
              pointerEvents:'none',
            }} />

            <AnimatePresence mode="popLayout">
              {nodes.length === 0 && !loading ? (
                <motion.div
                  key="empty"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  className="ghost-pulse"
                  style={{ margin:'48px auto', maxWidth:400, textAlign:'center' }}
                >
                  <div style={{ fontSize:'3rem', marginBottom:16 }}>⚓</div>
                  <h3 style={{ fontFamily:'var(--font-display)', color:'var(--text-secondary)', fontWeight:600, margin:'0 0 8px' }}>
                    No Events Anchored Yet
                  </h3>
                  <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', margin:0 }}>
                    Every action you take in the ecosystem will crystallize here — permanently and beautifully.
                  </p>
                </motion.div>
              ) : (
                nodes.map((node, idx) => (
                  <TimelineCard
                    key={node.node_id}
                    node={node}
                    index={idx}
                    onPin={togglePin}
                    onEdit={editEvent}
                  />
                ))
              )}
            </AnimatePresence>

            {/* Loading skeletons */}
            {loading && nodes.length === 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} className="skeleton" style={{ height:100, borderRadius:20, animationDelay:`${i*0.15}s` }} />
                ))}
              </div>
            )}
          </div>

          {/* ── Infinite scroll sentinel ─────────────────────────────── */}
          <div ref={sentinelRef} style={{ height:40, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {loading && nodes.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--text-muted)', fontSize:'0.8rem' }}>
                <div className="spinner spinner-sm" />
                Loading more events…
              </div>
            )}
            {!hasMore && nodes.length > 0 && (
              <p style={{ color:'var(--text-muted)', fontSize:'0.75rem', margin:0 }}>
                ✦ All {total} event{total !== 1 ? 's' : ''} loaded — the ledger is complete ✦
              </p>
            )}
          </div>

      <div style={{ height: 48 }} />
    </div>
  )
}
