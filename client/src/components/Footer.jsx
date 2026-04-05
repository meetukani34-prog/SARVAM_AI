import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer style={{ marginTop: '40px', paddingBottom: '24px', textAlign: 'center' }} className="anim-fade">
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <Link to="/about" style={linkStyle}>About Us</Link>
        <Link to="/privacy" style={linkStyle}>Privacy Policy</Link>
        <Link to="/terms" style={linkStyle}>Terms of Service</Link>
        <Link to="/cookies" style={linkStyle}>Cookie Support</Link>
        <a href="https://status.sarvam.ai" target="_blank" rel="noopener noreferrer" style={linkStyle}>System Status</a>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        © {currentYear} SARVAM Release USver. All rights reserved.
      </p>
    </footer>
  )
}

const linkStyle = {
  fontSize: '0.875rem',
  fontWeight: '500',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  transition: 'color 0.2s ease',
  '&:hover': {
    color: 'var(--accent-primary)',
  }
}
