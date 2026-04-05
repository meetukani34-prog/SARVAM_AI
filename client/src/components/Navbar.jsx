import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { formatDate } from '../utils/helpers.js'
import { useSidebar } from '../context/SidebarContext.jsx'

const PAGE_TITLES = {
  '/dashboard': { title: 'SARVAM Dashboard', icon: '🧠' },
  '/resume':    { title: 'Resume Analyzer',   icon: '📄' },
  '/coach':     { title: 'Communication Coach', icon: '💬' },
  '/roadmap':   { title: 'Career Roadmap',    icon: '🎯' },
  '/planner':   { title: 'Daily Planner',     icon: '📅' },
}

export default function Navbar() {
  const location = useLocation()
  const { user } = useAuth()
  const { toggle, isOpen } = useSidebar()
  const page = PAGE_TITLES[location.pathname] || { title: 'SARVAM', icon: '🤖' }

  const isMobile = window.innerWidth <= 1024

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: isOpen && !isMobile ? 'var(--sidebar-w)' : 0,
        right: 0,
        height: 'var(--navbar-h)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 32px',
        zIndex: 90,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Left: Hamburger + Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
        {isMobile && (
          <button 
            onClick={toggle}
            style={{ 
              background: 'none', border: 'none', fontSize: '1.4rem', 
              cursor: 'pointer', padding: '4px', display: 'flex', 
              alignItems: 'center', color: 'var(--text-primary)' 
            }}
          >
            ☰
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: isMobile ? '18px' : '20px' }}>{page.icon}</span>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {page.title}
            </h1>
            {!isMobile && (
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                {formatDate()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Status Indicator */}
        <div
          style={{
            display: isMobile ? 'none' : 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 'var(--r-full)',
            fontSize: '0.75rem',
            color: 'var(--green)',
            fontWeight: '600',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--green)',
              boxShadow: '0 0 8px var(--green)',
              display: 'inline-block',
              animation: 'pulse-ring 2s ease-out infinite',
              color: 'var(--green)',
            }}
          />
          SARVAM Live
        </div>

        {/* User Avatar */}
        {user && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--grad-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '700',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 0 0 2px rgba(139,92,246,0.3)',
              flexShrink: 0,
            }}
            title={user.name}
          >
            {user.avatar_initials || '?'}
          </div>
        )}
      </div>
    </header>
  )
}
