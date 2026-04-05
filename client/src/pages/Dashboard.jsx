import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Navbar from '../components/Navbar.jsx'
import { dashboardAPI } from '../services/api.js'
import { useAuth } from '../hooks/useAuth.js'

/* ── Radial Gauge — works on light bg ───────────────────────────────────── */
function RadialGauge({ score = 0, color = '#6366f1', label, icon, size = 140 }) {
  const r = 44, cx = 60, cy = 60
  const circ = 2 * Math.PI * r
  const pct  = Math.min(100, Math.max(0, score))
  const dash = (pct / 100) * circ
  const trackColor = 'rgba(0,0,0,0.06)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth="10" />
        {/* Progress */}
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          strokeDashoffset={circ / 4}
          style={{ transition: 'stroke-dasharray 1.2s ease', filter: `drop-shadow(0 0 5px ${color}66)` }}
        />
        {/* Score */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-primary)" fontSize="22" fontWeight="800">{pct}</text>
        <text x={cx} y={cy + 13} textAnchor="middle" fill="var(--text-muted)" fontSize="9">/ 100</text>
        <text x={cx} y={cy + 27} textAnchor="middle" fontSize="11">{icon}</text>
      </svg>
      <span style={{
        fontSize: '0.68rem', fontWeight: 700,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        textAlign: 'center'
      }}>{label}</span>
    </div>
  )
}

/* ── Multi-line chart — light-safe ───────────────────────────────────────── */
function WeeklyChart({ data = [] }) {
  const vw = 480, vh = 180
  const pad = { t: 16, b: 28, l: 28, r: 12 }
  const W = vw - pad.l - pad.r
  const H = vh - pad.t - pad.b
  const keys   = ['Overall', 'Communication', 'Planner']
  const colors = ['#6366f1', '#06b6d4', '#f59e0b']

  if (!data.length) return (
    <div style={{ height: vh, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-muted)', fontSize: 13 }}>No weekly data yet</div>
  )

  const xStep = W / Math.max(data.length - 1, 1)
  const toX = i => pad.l + i * xStep
  const toY = v  => pad.t + H - (Math.min(100, Math.max(0, v)) / 100) * H

  const linePath = key =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)},${toY(d[key] || 0)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} style={{ width: '100%', height: vh }}>
      {/* Grid */}
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1={pad.l} y1={toY(v)} x2={pad.l + W} y2={toY(v)} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
          <text x={pad.l - 4} y={toY(v) + 4} textAnchor="end" fill="var(--text-muted)" fontSize="8">{v}</text>
        </g>
      ))}
      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={toX(i)} y={vh - 4} textAnchor="middle" fill="var(--text-muted)" fontSize="9">{d.day}</text>
      ))}
      {/* Lines */}
      {keys.map((key, ki) => (
        <path key={key} d={linePath(key)} fill="none" stroke={colors[ki]} strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 1px 3px ${colors[ki]}55)` }} />
      ))}
      {/* End dots */}
      {keys.map((key, ki) => {
        const last = data[data.length - 1]
        return (
          <circle key={key}
            cx={toX(data.length - 1)} cy={toY(last[key] || 0)}
            r="4" fill={colors[ki]} stroke="#fff" strokeWidth="2" />
        )
      })}
    </svg>
  )
}

/* ── Horizontal bar — light themed ──────────────────────────────────────── */
function HBar({ name, score, color }) {
  const pct = Math.min(100, Math.max(0, score || 0))
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{name}</span>
        <span style={{ fontSize: '0.78rem', color, fontWeight: 800 }}>{pct}%</span>
      </div>
      <div style={{ height: 7, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color,
          transition: 'width 1.2s ease' }} />
      </div>
    </div>
  )
}

/* ── Module Score Card ───────────────────────────────────────────────────── */
function ModuleCard({ icon, label, score, color, sublabel, path }) {
  const [hov, setHov] = useState(false)
  return (
    <Link to={path} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          padding: '18px 16px', borderRadius: 14,
          background: hov ? `${color}0f` : 'var(--bg-secondary)',
          border: `1px solid ${hov ? color + '55' : 'var(--border)'}`,
          cursor: 'pointer', transition: 'all 0.22s',
          transform: hov ? 'translateY(-2px)' : 'none',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.4rem' }}>{icon}</span>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, color }}>{score}%</span>
        </div>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
          <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 2 }}>{sublabel}</div>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: 'var(--border)' }}>
          <div style={{ height: '100%', width: `${Math.min(100, score || 0)}%`, borderRadius: 99,
            background: color, transition: 'width 1.2s ease' }} />
        </div>
      </div>
    </Link>
  )
}

/* ── Roadmap Progress ────────────────────────────────────────────────────── */
function RoadmapProgressCard({ roadmaps = [] }) {
  if (!roadmaps.length) return (
    <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: 13 }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>🗺️</div>
      No roadmaps yet — <Link to="/roadmap" style={{ color: '#6366f1' }}>create one</Link>
    </div>
  )
  const COLORS = ['#6366f1','#10b981','#06b6d4','#f59e0b']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {roadmaps.map((rm, i) => {
        const color = COLORS[i % 4]
        return (
          <div key={i} style={{ padding: '12px 14px', borderRadius: 10,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)',
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                🗺️ {rm.goal}
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color, flexShrink: 0, marginLeft: 8 }}>{rm.pct}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 99, background: 'var(--border)' }}>
              <div style={{ height: '100%', width: `${rm.pct}%`, borderRadius: 99,
                background: color, transition: 'width 1.2s ease' }} />
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {rm.done} / {rm.total} phases complete
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Legend ──────────────────────────────────────────────────────────────── */
function Legend({ items }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
      {items.map(({ label, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Stat Pill ───────────────────────────────────────────────────────────── */
function StatPill({ icon, label, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '16px 18px', borderRadius: 14,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ width: 42, height: 42, borderRadius: 11,
        background: `${color}15`, border: `1px solid ${color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.15rem', fontWeight: 900, color }}>{value}</div>
        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  )
}

/* ── Card wrapper ────────────────────────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      padding: '24px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function CardTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)',
        fontFamily: 'var(--font-display)' }}>{children}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const { user } = useAuth()
  const socketRef = useRef(null)

  useEffect(() => {
    document.title = 'Dashboard | SARVAM'
    dashboardAPI.get()
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user?.id) return
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//localhost:8000/ws/analytics/${user.id}`)
    ws.onmessage = e => { try { setData(prev => ({ ...prev, ...JSON.parse(e.data) })) } catch {} }
    socketRef.current = ws
    return () => ws.close()
  }, [user?.id])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading SARVAM Dashboard…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="alert alert-error">{error}</div>
  )

  const d = data || {}

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">
          Welcome back,{' '}
          <span className="gradient-text-purple">{d.user_name?.split(' ')[0] || 'User'}</span> 👋
        </h1>
        <p className="page-subtitle">Your SARVAM career intelligence — live and synchronized.</p>
      </div>

      {/* ── Row 1: 5 Gauges ────────────────────────────────────────── */}
      <Card style={{ marginBottom: 24 }}>
        <CardTitle sub="Weighted aggregate across Resume · Coach · Planner · Roadmap">
          🎯 Overall Performance
        </CardTitle>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 20 }}>
          <RadialGauge score={d.overall_score        || 0} color="#6366f1" label="Overall"   icon="🏆" size={130} />
          <RadialGauge score={d.resume_score         || 0} color="#8b5cf6" label="Resume"    icon="📄" size={130} />
          <RadialGauge score={d.communication_score  || 0} color="#06b6d4" label="Coach IQ"  icon="💬" size={130} />
          <RadialGauge score={d.planner_score        || 0} color="#f59e0b" label="Planner"   icon="📅" size={130} />
          <RadialGauge score={d.roadmap_score        || 0} color="#10b981" label="Roadmap"   icon="🗺️" size={130} />
        </div>
      </Card>

      {/* ── Row 2: Line Chart + Module Cards ───────────────────────── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <Card>
          <CardTitle>📈 Weekly Progress</CardTitle>
          <Legend items={[
            { label: 'Overall',       color: '#6366f1' },
            { label: 'Communication', color: '#06b6d4' },
            { label: 'Planner',       color: '#f59e0b' },
          ]} />
          <WeeklyChart data={d.weekly_data || []} />
        </Card>

        <Card>
          <CardTitle sub="Click any card to open that module">⚡ Module Scores</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <ModuleCard icon="📄" label="Resume"   score={d.resume_score        || 0} color="#8b5cf6" sublabel="Latest scan score"    path="/resume" />
            <ModuleCard icon="💬" label="Coach IQ" score={d.communication_score  || 0} color="#06b6d4" sublabel="Avg confidence"       path="/coach" />
            <ModuleCard icon="📅" label="Planner"  score={d.planner_score        || 0} color="#f59e0b" sublabel="Tasks completed"      path="/planner" />
            <ModuleCard icon="🗺️" label="Roadmap" score={d.roadmap_score        || 0} color="#10b981" sublabel="Phases completed"     path="/roadmap" />
          </div>
        </Card>
      </div>

      {/* ── Row 3: Skills + Roadmap ─────────────────────────────────── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <Card>
          <CardTitle sub="Skills detected in your latest resume scan">🧠 Skills Breakdown</CardTitle>
          {(d.skill_scores || []).length > 0 ? (
            (d.skill_scores || []).slice(0, 8).map((s, i) => (
              <HBar
                key={s.name}
                name={typeof s === 'string' ? s : s.name}
                score={typeof s === 'string' ? 70 : s.score}
                color={['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#14b8a6'][i % 8]}
              />
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📄</div>
              Upload a resume to see skill scores
            </div>
          )}
        </Card>

        <Card>
          <CardTitle sub="Phase completion across all your goals">🗺️ Roadmap Progress</CardTitle>
          <RoadmapProgressCard roadmaps={d.roadmap_progress || []} />
        </Card>
      </div>

      {/* ── Row 4: Stat Pills ──────────────────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatPill icon="✅" label="Tasks Today"   value={`${d.tasks_completed_today || 0}/${d.total_tasks_today || 0}`} color="#10b981" />
        <StatPill icon="🔥" label="Day Streak"    value={`${d.streak_days || 0} days`}                                 color="#f59e0b" />
        <StatPill icon="💬" label="Overall Score" value={`${d.overall_score || 0}%`}                                  color="#6366f1" />
        <StatPill icon="📄" label="Resume Score"  value={`${d.resume_score || 0}%`}                                   color="#8b5cf6" />
      </div>

      {/* ── Quick Actions ───────────────────────────────────────────── */}
      <Card>
        <CardTitle>⚡ Quick Actions</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { icon: '📄', label: 'Analyze Resume', path: '/resume',      color: '#8b5cf6' },
            { icon: '💬', label: 'Practice Coach', path: '/coach',       color: '#06b6d4' },
            { icon: '🗺️', label: 'View Roadmap',  path: '/roadmap',     color: '#10b981' },
            { icon: '📅', label: 'Daily Planner',  path: '/planner',     color: '#f59e0b' },
            { icon: '⚡', label: 'Code Oracle',    path: '/code-oracle', color: '#ec4899' },
          ].map(a => (
            <Link key={a.path} to={a.path} style={{ textDecoration: 'none' }}>
              <div
                style={{ padding: '16px 10px', borderRadius: 12,
                  background: `${a.color}0d`, border: `1px solid ${a.color}33`,
                  textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${a.color}1c`; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = `${a.color}0d`; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{a.icon}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{a.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </>
  )
}
