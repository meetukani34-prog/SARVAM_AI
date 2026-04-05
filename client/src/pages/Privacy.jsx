import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Privacy() {
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
          <div className="orb" style={{ width: '300px', height: '300px', background: 'rgba(99,102,241,0.1)', top: '-150px', right: '-150px' }} />

          <header style={{ marginBottom: '48px' }}>
            <h1 className="gradient-text-vibrant title-responsive" style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '12px', letterSpacing: '-0.03em' }}>
              Privacy Policy
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '500' }}>
              SARVAM Lifecycle Oversight · Last Updated: April 2026
            </p>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <section className="anim-slide delay-1">
              <div className="flex-stack-mobile" style={sectionHeaderStyle}>
                <span style={iconStyle}>🛡️</span>
                <h2 style={sectionTitleStyle}>1. Information We Collect</h2>
              </div>
              <p className="text-responsive" style={paragraphStyle}>
                SARVAM collects information you provide directly to us when you create an account, upload a resume, or interact with our AI career coach. This includes your name, email, professional history, and skill data.
              </p>
            </section>

            <section className="anim-slide delay-2">
              <div className="flex-stack-mobile" style={sectionHeaderStyle}>
                <span style={iconStyle}>🧠</span>
                <h2 style={sectionTitleStyle}>2. How We Use Your Data</h2>
              </div>
              <p className="text-responsive" style={paragraphStyle}>
                Your data is used exclusively to provide personalized career insights, analyze your resume, and generate development roadmaps. We do not sell your personal information to third parties.
              </p>
            </section>

            <section className="anim-slide delay-3">
              <div className="flex-stack-mobile" style={sectionHeaderStyle}>
                <span style={iconStyle}>🔒</span>
                <h2 style={sectionTitleStyle}>3. Data Security</h2>
              </div>
              <p className="text-responsive" style={paragraphStyle}>
                We implement industry-standard encryption and security measures to protect your data. All communication between your browser and our servers is secured via HTTPS/SSL.
              </p>
            </section>

            <section className="anim-slide delay-4">
              <div className="flex-stack-mobile" style={sectionHeaderStyle}>
                <span style={iconStyle}>✉️</span>
                <h2 style={sectionTitleStyle}>4. Contact Us</h2>
              </div>
              <p className="text-responsive" style={paragraphStyle}>
                If you have any questions about this Privacy Policy, please contact us at <span style={{ color: 'var(--purple)', fontWeight: '700' }}>{import.meta.env.VITE_CONTACT_EMAIL}</span>.
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
