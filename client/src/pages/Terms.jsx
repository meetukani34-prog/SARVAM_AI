import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Terms() {
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
          <div className="orb" style={{ width: '300px', height: '300px', background: 'rgba(99,102,241,0.1)', bottom: '-150px', left: '-150px' }} />
          
          <header style={{ marginBottom: '48px' }}>
            <h1 className="gradient-text-vibrant title-responsive" style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '12px', letterSpacing: '-0.03em' }}>
              Terms of Service
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '500' }}>
              SARVAM Lifecycle Oversight · Last Updated: April 2026
            </p>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <section className="anim-slide delay-1">
              <div className="flex-stack-mobile" style={sectionHeaderStyle}>
                <span style={iconStyle}>📄</span>
                <h2 style={sectionTitleStyle}>1. Acceptance of Terms</h2>
              </div>
              <p className="text-responsive" style={paragraphStyle}>
                By accessing or using SARVAM, you agree to be bound by these Terms of Service. If you do not agree to all of the terms, you may not use the service.
              </p>
            </section>

            <section className="anim-slide delay-2">
              <div className="flex-stack-mobile" style={sectionHeaderStyle}>
                <span style={iconStyle}>🚀</span>
                <h2 style={sectionTitleStyle}>2. Use of Service</h2>
              </div>
              <p className="text-responsive" style={paragraphStyle}>
                You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your account credentials.
              </p>
            </section>

            <section className="anim-slide delay-3">
              <div className="flex-stack-mobile" style={sectionHeaderStyle}>
                <span style={iconStyle}>⚖️</span>
                <h2 style={sectionTitleStyle}>3. Intellectual Property</h2>
              </div>
              <p className="text-responsive" style={paragraphStyle}>
                All software, designs, and content provided by SARVAM are protected by intellectual property laws. You may not copy, reverse-engineer, or commercially exploit any part of our service.
              </p>
            </section>

            <section className="anim-slide delay-4">
              <div className="flex-stack-mobile" style={sectionHeaderStyle}>
                <span style={iconStyle}>🛑</span>
                <h2 style={sectionTitleStyle}>4. Termination</h2>
              </div>
              <p className="text-responsive" style={paragraphStyle}>
                We reserve the right to suspend or terminate your account at our sole discretion, without notice, if we believe you have violated these terms.
              </p>
            </section>

            <section className="anim-slide delay-5">
              <div className="flex-stack-mobile" style={sectionHeaderStyle}>
                <span style={iconStyle}>✉️</span>
                <h2 style={sectionTitleStyle}>5. Contact Us</h2>
              </div>
              <p className="text-responsive" style={paragraphStyle}>
                If you have any questions about these Terms, please contact us at <span style={{ color: 'var(--purple)', fontWeight: '700' }}>{import.meta.env.VITE_CONTACT_EMAIL}</span>.
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
  background: 'rgba(99,102,241,0.1)',
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
