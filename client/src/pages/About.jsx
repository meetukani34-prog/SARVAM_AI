import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import anjaliImg from '../assets/team/anjali.png'
import meetImg from '../assets/team/meet.png'
import prahladImg from '../assets/team/prahlad.png'

export default function About() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'General Inquiry',
    message: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    alert(`Message sent by ${formData.name}! (Simulated)`)
  }

  const visionaries = [
    {
      name: 'Anjali Gupta',
      role: 'SARVAM OWNER',
      phone: '+91 33333 33333',
      email: 'anjali.gupta@sarvam.ai',
      hours: 'Mon-Sat, 10 AM - 5 PM',
      image: anjaliImg
    },
    {
      name: 'Meet Ukani',
      role: 'SARVAM OWNER',
      phone: '+91 11111 11111',
      email: 'meet.ukani@sarvam.ai',
      hours: 'Mon-Sat, 10 AM - 5 PM',
      image: meetImg
    },
    {
      name: 'Prahlad Bhat',
      role: 'SARVAM OWNER',
      phone: '+91 22222 22222',
      email: 'prahlad.bhat@sarvam.ai',
      hours: 'Mon-Sat, 10 AM - 5 PM',
      image: prahladImg
    }
  ]

  return (
    <div className="bg-mesh bg-grid" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px 0' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost anim-fade"
          style={{ borderRadius: '12px', padding: '10px 20px', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)' }}
        >
          ← Back
        </button>
      </div>

      {/* Hero Section */}
      <div className="hero-responsive" style={{ background: 'linear-gradient(rgba(99,102,241,0.9), rgba(129,140,248,0.9))', padding: '100px 20px', textAlign: 'center', color: 'white' }}>
        <h1 className="anim-fade title-responsive" style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '16px' }}>Get In Touch With Us</h1>
        <p className="anim-fade delay-1" style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
          We're here to help! Reach out to us for any inquiries about our services or just to say hello.
        </p>
      </div>

      <div style={{ maxWidth: '1100px', margin: '-50px auto 100px', padding: '0 20px' }}>
        {/* Visionaries Section */}
        <div className="glass-card anim-scale glass-card-mobile" style={{ padding: '60px', marginBottom: '60px' }}>
          <h2 className="gradient-text-vibrant title-responsive" style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: '800', marginBottom: '48px' }}>
            Meet Our Visionaries
          </h2>
          
          <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {visionaries.map((v, i) => (
              <div key={i} className="glass-card anim-slide flex-stack-mobile" style={{ padding: '30px', display: 'flex', gap: '20px', alignItems: 'center', border: '1px solid rgba(99,102,241,0.2)' }}>
                <img 
                  src={v.image} 
                  alt={v.name} 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 8px 16px rgba(99,102,241,0.3)', border: '2px solid white' }} 
                />
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>{v.name}</h3>
                  <p style={{ color: 'var(--purple)', fontSize: '0.85rem', fontWeight: '700', margin: '4px 0 12px' }}>{v.role}</p>
                  <div className="text-responsive" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>📞 {v.phone}</span>
                    <span>✉️ {v.email}</span>
                    <span>🕒 {v.hours}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="glass-card anim-slide delay-2 glass-card-mobile" style={{ padding: '60px', marginBottom: '60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 className="gradient-text-vibrant title-responsive" style={{ fontSize: '2.5rem', fontWeight: '800' }}>Send Us A Message</h2>
            <p style={{ color: 'var(--text-muted)' }}>Fill out the form below and we'll get back to you as soon as possible.</p>
          </div>

          <form onSubmit={handleSubmit} className="form-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Full Name *</label>
              <input 
                type="text" 
                placeholder="Enter your full name" 
                style={inputStyle} 
                required 
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label style={labelStyle}>Email Address *</label>
              <input 
                type="email" 
                placeholder="your.email@example.com" 
                style={inputStyle} 
                required 
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input 
                type="tel" 
                placeholder="10-digit phone number" 
                style={inputStyle} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Inquiry Type *</label>
              <select style={inputStyle} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option>General Inquiry</option>
                <option>Technical Support</option>
                <option>Partnership</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Your Message *</label>
              <textarea 
                placeholder="Tell us more about your inquiry..." 
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} 
                required
                onChange={e => setFormData({...formData, message: e.target.value})}
              ></textarea>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <button 
                type="submit" 
                className="anim-scale" 
                style={{ 
                  width: '100%', 
                  padding: '18px', 
                  fontSize: '1.1rem', 
                  fontWeight: '800',
                  background: 'var(--grad-primary)', 
                  color: 'white',
                  border: 'none', 
                  borderRadius: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(99,102,241,0.3)',
                  transition: 'transform 0.2s ease'
                }}
              >
                ✈️ Send Message
              </button>
            </div>
          </form>
        </div>

        {/* Urgent Support Section */}
        <div className="anim-slide delay-3" style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '30px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 10px 30px rgba(251,191,36,0.1)' }}>
          <span style={{ fontSize: '2rem', marginBottom: '16px' }}>⚠️</span>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#92400e', marginBottom: '12px' }}>Need Urgent Support?</h2>
          <p style={{ color: '#b45309', maxWidth: '500px', marginBottom: '24px', lineHeight: '1.6' }}>
            For immediate technical assistance or critical platform inquiries, please call our support line directly.
          </p>
          <a href="tel:+914444444444" style={{ background: '#f59e0b', color: 'white', padding: '14px 40px', borderRadius: '16px', fontSize: '1.25rem', fontWeight: '800', textDecoration: 'none', boxShadow: '0 8px 20px rgba(245,158,11,0.3)' }}>
            📞 +91 44444 44444
          </a>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.9rem',
  fontWeight: '700',
  color: 'var(--text-primary)',
  marginBottom: '8px'
}

const inputStyle = {
  width: '100%',
  padding: '14px 18px',
  borderRadius: '12px',
  border: '1px solid rgba(0,0,0,0.1)',
  background: 'rgba(255,255,255,0.8)',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  fontFamily: 'inherit'
}
