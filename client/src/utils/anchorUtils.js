/**
 * anchorUtils.js — Fire-and-forget helpers for automatic history anchoring.
 *
 * Usage in any page/component:
 *   import { fireAnchor } from '../utils/anchorUtils'
 *
 *   // After task completion:
 *   fireAnchor({ category: 'task_completed', title: 'Completed: Build Portfolio', tags: ['study'] })
 *
 *   // After resume upload:
 *   fireAnchor({ category: 'resume_event', title: 'Resume analyzed', summary: result.score })
 */

import api from '../services/api'

function genClientRef() {
  return `auto_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Fire-and-forget event anchor.
 * Does NOT block the calling component — pure background write.
 * On failure, silently queues to localStorage for retry on next session.
 *
 * @param {object} params
 * @param {string} params.category   - Must match EVENT_CATEGORIES in temporal_anchor.py
 * @param {string} params.title      - Short description of the event
 * @param {string} [params.summary]  - Optional longer description
 * @param {object} [params.payload]  - Optional structured data blob
 * @param {string[]} [params.tags]   - Optional tag array
 */
export async function fireAnchor({ category, title, summary = '', payload = {}, tags = [] }) {
  const now         = new Date().toISOString()
  const clientRef   = genClientRef()
  const tzOffset    = -new Date().getTimezoneOffset()

  try {
    await api.post('/history/anchor', {
      client_ref_id:  clientRef,
      category,
      title,
      summary,
      payload,
      tags,
      client_ts:      now,
      timezone_offset: tzOffset,
    })
  } catch (err) {
    // Silently persist to localStorage retry queue
    try {
      const queue = JSON.parse(localStorage.getItem('anchor_retry_queue') || '[]')
      queue.push({ clientRef, category, title, summary, payload, tags, ts: now })
      // Cap at 50 retries to avoid bloat
      localStorage.setItem('anchor_retry_queue', JSON.stringify(queue.slice(-50)))
    } catch { /* storage full — ignore */ }
  }
}

/**
 * Drain the localStorage retry queue on login/session-start.
 * Call this once in the authenticated root layout.
 */
export async function drainRetryQueue() {
  try {
    const raw = localStorage.getItem('anchor_retry_queue')
    if (!raw) return
    const queue = JSON.parse(raw)
    if (!queue.length) return

    const results = await Promise.allSettled(
      queue.map(item =>
        api.post('/history/anchor', {
          client_ref_id:   item.clientRef,
          category:        item.category,
          title:           item.title,
          summary:         item.summary || '',
          payload:         item.payload || {},
          tags:            item.tags || [],
          client_ts:       item.ts,
          timezone_offset: -new Date().getTimezoneOffset(),
        })
      )
    )

    // Remove only successfully retried items
    const failed = queue.filter((_, i) => results[i].status === 'rejected')
    localStorage.setItem('anchor_retry_queue', JSON.stringify(failed))
  } catch { /* ignore */ }
}

/** Category presets for common platform events */
export const ANCHOR_PRESETS = {
  TASK_DONE:        (title, tags = []) => ({ category: 'task_completed',    title, tags }),
  SKILL_UPDATED:    (skill, score)     => ({ category: 'skill_update',      title: `Skill updated: ${skill}`, summary: `New score: ${score}`, tags: [skill] }),
  ROADMAP_STEP:     (step)             => ({ category: 'roadmap_milestone', title: `Milestone reached: ${step}`, tags: ['roadmap'] }),
  RESUME_ANALYZED:  (filename)         => ({ category: 'resume_event',      title: `Resume analyzed: ${filename}`, tags: ['resume'] }),
  COACH_SESSION:    (topic)            => ({ category: 'coach_session',      title: `Coach session: ${topic}`, tags: ['coaching'] }),
  PROFILE_UPDATED:  ()                 => ({ category: 'profile_update',     title: 'Profile updated', tags: ['profile'] }),
  CODE_ORACLE:      (lang, lines)      => ({ category: 'growth_twin',        title: `Code session: ${lang} (${lines} lines)`, tags: ['code', lang] }),
}
