import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Cookies() {
  const navigate = useNavigate()
  
  return (
    <div className="bg-mesh bg-grid hero-responsive" style={{ minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <button 
          onClick={() => navigate(-1)} 
          className="btn-ghost anim-fade" 
          style={{ marginBottom: '32px', borderRadius: '12px', padding: '10px 20px' }}
        >
          ← Back
        </button>
        
        <div className="glass-card anim-scale glass-card-mobile" style={{ padding: '60px', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative Orbs */}
          <div className="orb" style={{ width: '300px', height: '300px', background: 'rgba(56,189,248,0.1)', top: '10%', right: '-10%' }} />
          
          <header style={{ marginBottom: '48px' }}>
            <h1 className="gradient-text-vibrant title-responsive" style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '12px', letterSpacing: '-0.03em' }}>
              Cookies & Storage
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '500' }}>
              SARVAM Lifecycle Oversight · Last Updated: April 2026
            </p>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <section className="anim-slide delay-1">
              <div className="flex-stack-mobile" style={sectionHeaderStyle}>
                <span style={iconStyle}>🍪</span>
                <h2 style={sectionTitleStyle}>1. What Are Cookies?</h2>
              </div>
              <p className="text-responsive" style={paragraphStyle}>
                Cookies are small text files that are stored on your device when you visit a website. We also use similar technologies such as LocalStorage and SessionStorage to enhance your experience.
              </p>
            </section>

            <section className="anim-slide delay-2">
              <div className="flex-stack-mobile" style={sectionHeaderStyle}>
                <span style={iconStyle}>🛠️</span>
                <h2 style={sectionTitleStyle}>2. How We Use Them</h2>
              </div>
              <div className="text-responsive" style={paragraphStyle}>
                We use Cookies and LocalStorage primarily for:
                <ul className="text-responsive" style={{ marginTop: '12px', listStyle: 'none', padding: 0 }}>
                  <li style={listItemStyle}><span style={dotStyle}></span> Authentication: Keeping you signed into your SARVAM account.</li>
                  <li style={listItemStyle}><span style={dotStyle}></span> Preferences: Remembering your theme and language settings.</li>
                  <li style={listItemStyle}><span style={dotStyle}></span> Performance: Helping us understand how users interact with our AI coach.</li>
                </ul>
              </div>
            </section>

            <section className="anim-slide delay-3">
              <div className="flex-stack-mobile" style={sectionHeaderStyle}>
                <span style={iconStyle}>⚙️</span>
                <h2 style={sectionTitleStyle}>3. Your Choices</h2>
              </div>
              <p className="text-responsive" style={paragraphStyle}>
                You can choose to disable cookies through your browser settings. However, please note that many features of SARVAM will not work correctly without them.
              </p>
            </section>

            <section className="anim-slide delay-4">
              <div className="flex-stack-mobile" style={sectionHeaderStyle}>
                <span style={iconStyle}>🔍</span>
                <h2 style={sectionTitleStyle}>4. Third-Party</h2>
              </div>
              <p className="text-responsive" style={paragraphStyle}>
                We use Google OAuth for sign-in, which may set its own cookies on your device during the authentication process.
              </p>
            </section>

            <section className="anim-slide delay-5">
              <div className="flex-stack-mobile" style={sectionHeaderStyle}>
                <span style={iconStyle}>✉️</span>
                <h2 style={sectionTitleStyle}>5. Contact Us</h2>
              </div>
              <p className="text-responsive" style={paragraphStyle}>
                If you have any questions about our Cookie policy, please contact us at <span style={{ color: 'var(--purple)', fontWeight: '700' }}>{import.meta.env.VITE_CONTACT_EMAIL}</span>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  marginBottom: '16px'
}

const iconStyle = {
  fontSize: '1.5rem',
  background: 'rgba(56,189,248,0.1)',
  padding: '8px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const sectionTitleStyle = {
  fontSize: '1.5rem',
  fontWeight: '800',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-display)'
}

const paragraphStyle = {
  color: 'var(--text-secondary)',
  lineHeight: '1.8',
  fontSize: '1.05rem',
  marginLeft: '52px'
}

const listItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '8px',
  fontSize: '1.05rem',
  color: 'var(--text-secondary)'
}

const dotStyle = {
  width: '6px',
  height: '6px',
  background: 'var(--cyan)',
  borderRadius: '50%',
  flexShrink: 0
}
