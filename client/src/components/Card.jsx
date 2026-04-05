import React from 'react'

export default function Card({
  children,
  className = '',
  style = {},
  gradient = null,
  glow = false,
  padding = '24px',
  onClick = null,
}) {
  const glowStyle = glow
    ? { boxShadow: '0 0 30px rgba(139,92,246,0.15), 0 8px 32px rgba(0,0,0,0.4)' }
    : {}

  return (
    <div
      className={`glass-card ${className}`}
      onClick={onClick}
      style={{
        padding,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        ...glowStyle,
        ...style,
      }}
    >
      {gradient && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: gradient,
            opacity: 0.04,
            pointerEvents: 'none',
            borderRadius: 'inherit',
          }}
        />
      )}
      {children}
    </div>
  )
}

// ── Stat Card ────────────────────────────────────────────────────
export function StatCard({ icon, label, value, sub, color = 'var(--purple)', trend = null }) {
  return (
    <Card gradient={`linear-gradient(135deg, ${color}, transparent)`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--r-md)',
            background: `${color}22`,
            border: `1px solid ${color}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            marginBottom: '16px',
          }}
        >
          {icon}
        </div>
        {trend !== null && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: trend >= 0 ? 'var(--green)' : 'var(--red)',
              background: trend >= 0 ? 'var(--green-dim)' : 'var(--red-dim)',
              padding: '3px 8px',
              borderRadius: 'var(--r-full)',
            }}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: '2rem',
          fontWeight: '800',
          fontFamily: 'var(--font-display)',
          color: 'var(--text-primary)',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '500' }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          {sub}
        </div>
      )}
    </Card>
  )
}

// ── Score Ring ────────────────────────────────────────────────────
export function ScoreRing({ score, size = 120, label, color = 'var(--purple)' }) {
  const radius = (size - 16) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <div className="score-ring-wrap" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="score-ring-label">
          <div
            style={{
              fontSize: size > 100 ? '1.6rem' : '1.2rem',
              fontWeight: '800',
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            {score}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600' }}>
            / 100
          </div>
        </div>
      </div>
      {label && (
        <span
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
