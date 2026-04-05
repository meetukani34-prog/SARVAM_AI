import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useSidebar } from '../context/SidebarContext.jsx'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_ITEMS = [
  { path: '/dashboard',        icon: '🧠', label: 'SARVAM' },
  { path: '/resume',           icon: '📄', label: 'Resume' },
  { path: '/coach',            icon: '💬', label: 'Coach' },
  { path: '/roadmap',          icon: '🎯', label: 'Roadmap' },
  { path: '/planner',          icon: '📅', label: 'Planner' },
  { path: '/code-oracle',      icon: '⚡', label: 'Code Oracle' },
  // { path: '/history',          icon: '⚓', label: 'History', glow: true },
]

const styles = {
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: 'var(--sidebar-w)',
    maxWidth: 'min(85vw, 320px)',
    background: 'var(--bg-elevated)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    padding: '0',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 20px',
    borderBottom: '1px solid var(--border)',
    textDecoration: 'none',
  },
  logoIcon: {
    width: '38px',
    height: '38px',
    background: 'var(--grad-primary)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
    boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: '800',
    background: 'var(--grad-text)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  logoSub: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: window.innerWidth <= 1024 ? '13px 16px' : '11px 14px',
    borderRadius: 'var(--r-md)',
    textDecoration: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all var(--mid)',
    border: '1px solid transparent',
  },
  navLinkActive: {
    color: 'var(--text-primary)',
    background: 'var(--bg-secondary)',
    borderColor: 'var(--border)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  navIcon: {
    fontSize: '16px',
    width: '22px',
    textAlign: 'center',
    flexShrink: 0,
  },
  bottom: {
    padding: '16px 12px',
    borderTop: '1px solid var(--border)',
    background: 'var(--bg-elevated)',
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    borderRadius: 'var(--r-md)',
    background: 'transparent',
    border: '1px solid transparent',
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all var(--mid)',
    textAlign: 'left',
  },
}

export default function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { isOpen, close } = useSidebar()

  const isMobile = window.innerWidth <= 1024

  return (
    <aside 
      style={{
        ...styles.sidebar,
        width: isMobile ? 'min(85vw, 320px)' : 'var(--sidebar-w)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        boxShadow: isOpen && isMobile ? '0 0 40px rgba(0,0,0,0.15), 10px 0 30px rgba(0,0,0,0.05)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 10 }}>
        <Link to="/dashboard" style={styles.logo} onClick={isMobile ? close : undefined}>
          <div style={styles.logoIcon}>🤖</div>
          <div style={{ minWidth: 0 }}>
            <div style={styles.logoText}>SARVAM</div>
            <div style={styles.logoSub}>Neural Engine</div>
          </div>
        </Link>
        {isMobile && (
          <button 
            onClick={close}
            style={{ 
              background: 'rgba(0,0,0,0.03)', border: 'none', fontSize: '1rem', 
              cursor: 'pointer', color: 'var(--text-muted)', padding: '10px',
              borderRadius: '50%', width: '36px', height: '36px', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            ✕
          </button>
        )}
      </div>

      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navLink,
                padding: isMobile ? '13px 16px' : '11px 14px',
                ...(active ? styles.navLinkActive : {}),
              }}
              onClick={isMobile ? close : undefined}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {active && (
                <span
                  style={{
                    marginLeft: 'auto',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--purple)',
                    boxShadow: '0 0 8px var(--purple)',
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      <div style={styles.bottom}>
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              marginBottom: '12px',
              borderRadius: 'var(--r-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8)',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'var(--grad-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '800',
                color: '#fff',
                flexShrink: 0,
                boxShadow: '0 0 0 2px #fff, 0 4px 10px rgba(99,102,241,0.2)',
              }}
            >
              {user.avatar_initials || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                }}
              >
                {user.name}
              </div>
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: '2px',
                }}
              >
                {user.email}
              </div>
            </div>
          </div>
        )}
        <button
          style={styles.logoutBtn}
          onClick={logout}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--red)'
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <span style={{ fontSize: '15px' }}>🚪</span>
          <span style={{ fontWeight: '600' }}>Logout</span>
        </button>
      </div>
    </aside>
  )
}
