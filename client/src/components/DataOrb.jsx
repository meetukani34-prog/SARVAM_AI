import React, { useState, useEffect, useRef } from 'react'

export default function DataOrb({ label, value, sub, color, icon, trend }) {
  const [pulsing, setPulsing] = useState(false)
  const [liveOffset, setLiveOffset] = useState(0)
  const prevValue = useRef(value)

  useEffect(() => {
    if (prevValue.current !== value) {
      setPulsing(true)
      const timer = setTimeout(() => setPulsing(false), 1500)
      prevValue.current = value
      return () => clearTimeout(timer)
    }
  }, [value])

  // Realistic heartbeat oscillation (visual only)
  useEffect(() => {
    const interval = setInterval(() => {
      // Very tiny oscillation (-0.05 to +0.05) to simulate 'live crunching'
      setLiveOffset((Math.random() - 0.5) * 0.1)
    }, 2000 + Math.random() * 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`data-orb ${pulsing ? 'pulse-glow' : ''}`} style={{ '--orb-grad': `radial-gradient(circle at top left, ${color}, transparent)`, '--orb-color': color }}>
      <div style={{ fontSize: '1.6rem', marginBottom: '8px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>{icon}</div>
      <div style={{ fontSize: '2.2rem', fontWeight: '900', fontFamily: 'var(--font-display)', lineHeight: 1.1, letterSpacing: '-0.02em', transition: 'transform 0.3s ease' }}>
        {typeof value === 'number' 
           ? Math.max(0, value + (Number.isInteger(value) ? 0 : liveOffset)).toFixed(Number.isInteger(value) ? 0 : 1)
           : value}
      </div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.2px', marginTop: '6px' }}>
        {label}
      </div>
      {trend > 0 && (
        <div style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '0.6rem', color: 'var(--green)', fontWeight: '800', background: 'rgba(16,185,129,0.12)', padding: '3px 7px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)' }}>
          ↑ {trend}%
        </div>
      )}
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '10px', fontWeight: '600' }}>
        {sub}
      </div>
    </div>
  )
}

export function CloudCard({ children, style, className = "" }) {
  return (
    <div className={`cloud-card ${className}`} style={style}>
      {children}
    </div>
  )
}
