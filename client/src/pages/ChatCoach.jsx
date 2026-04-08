import React, { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Navbar from '../components/Navbar.jsx'
import Card from '../components/Card.jsx'
import { chatAPI } from '../services/api.js'
import { toneColor } from '../utils/helpers.js'

const TONE_ICONS = { professional:'🎩', friendly:'😊', assertive:'💪', polite:'🤝', formal:'📋', casual:'😎', passive:'🌿', aggressive:'🔥', rude:'⚡', anxious:'😰' }
const EXAMPLES = ["I need this done NOW or I'll escalate it.", "Hi, could you please send the report when you get a chance?", "Your idea is wrong. My approach is clearly better.", "I think maybe we could perhaps consider this option?"]

export default function ChatCoach() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError]     = useState('')

  const fetchHistory = React.useCallback(async () => {
    try {
      const r = await chatAPI.getHistory()
      if (r.data && Array.isArray(r.data)) {
        setHistory(r.data)
      } else {
        setHistory([])
      }
    } catch { 
      setHistory([])
    }
  }, [])

  useEffect(() => {
    document.title = 'Communication Coach | SARVAM'
    fetchHistory()
  }, [fetchHistory])

  const deleteSession = async (id, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm('Delete this coaching session?')) return
    try {
      await chatAPI.deleteAnalysis(id)
      setHistory(prev => prev.filter(h => h.id !== id))
      if (result?.id === id) setResult(null)
    } catch { alert('Failed to delete') }
  }

  const analyze = async (e) => {
    e.preventDefault()
    if (!message.trim() || loading) return
    setLoading(true); setError('')
    const userMsg = message.trim()
    try {
      const r = await chatAPI.analyze(userMsg)
      const session = r.data   // { id, content, created_at, result }
      setResult(session.result)
      setHistory(prev => [session, ...prev])  // Instant prepend — no re-fetch needed
      setMessage('')
    } catch(e) { setError(e.response?.data?.detail || 'Analysis failed.') }
    finally { setLoading(false) }
  }

  const handleKeyDown = (e) => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); analyze(e) } }
  const scoreCol = (s) => s >= 70 ? 'var(--green)' : s >= 50 ? 'var(--orange)' : 'var(--red)'
  // Normalize: AI sometimes returns 0-1 decimal for old saved sessions
  const norm = (s) => (s <= 1 ? Math.round(s * 100) : Math.round(s))


  return (
    <div className="page-content anim-fade">
      <div className="page-header">
        <h1 className="page-title">💬 Communication <span className="gradient-text">Coach</span></h1>
        <p className="page-subtitle">Type any message — SARVAM analyzes tone, confidence, and suggests improvements.</p>
      </div>

      <div className="responsive-grid cols-2">
        {/* Left: Input */}
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
          <Card className="anim-slide delay-1">
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:'700', fontSize:'1rem', marginBottom:'16px' }}>✍️ Your Message</h3>
            <div style={{ marginBottom:'14px' }}>
              <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'8px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' }}>Try an example:</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {EXAMPLES.map((ex,i) => (
                  <button key={i} onClick={() => setMessage(ex)}
                    style={{ padding:'4px 12px', background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.15)', borderRadius:'var(--r-full)', color:'var(--purple)', fontSize:'0.72rem', cursor:'pointer', fontFamily:'var(--font-sans)' }}>
                    {ex.length>32 ? ex.slice(0,32)+'…' : ex}
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={analyze}>
              <textarea id="message-input" className="input" placeholder="Type message… (Enter to analyze, Shift+Enter for new line)" value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={handleKeyDown} rows={5} style={{ resize:'vertical', minHeight:'120px', fontFamily:'var(--font-sans)', borderRadius: 'var(--r-md)' }} />
              <div style={{ 
                display:'flex', 
                flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                justifyContent:'space-between', 
                alignItems: window.innerWidth <= 768 ? 'stretch' : 'center', 
                marginTop:'12px',
                gap: '12px'
              }}>
                <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', textAlign: window.innerWidth <= 768 ? 'right' : 'left' }}>{message.length}/2000</span>
                <button id="analyze-msg-btn" type="submit" className="btn btn-primary" disabled={!message.trim()||loading} style={{ height: '48px' }}>
                  {loading ? <><span className="spinner spinner-sm"/> Analyzing…</> : '🧠 Analyze Message'}
                </button>
              </div>
            </form>
            {error && <div className="alert alert-error anim-fade" style={{ marginTop:'12px' }}>⚠️ {error}</div>}
          </Card>

          {history.length > 0 && (
            <Card className="anim-fade">
              <h3 style={{ fontFamily:'var(--font-display)', fontWeight:'700', fontSize:'0.95rem', marginBottom:'14px' }}>📋 Session History ({history.length})</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px', maxHeight:'400px', overflowY:'auto' }}>
                {history.map((h,i) => (
                  <div key={h.id || i} onClick={() => setResult(h.result)}
                    style={{ padding:'12px 14px', background:result?.id === h.id ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)', border:`1px solid ${result?.id === h.id ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`, borderLeft:`4px solid ${toneColor(h.result.tone)}`, borderRadius:'var(--r-md)', cursor:'pointer', position:'relative', transition:'0.2s' }}>
                    <div style={{ fontSize:'0.82rem', color:'var(--text-primary)', fontWeight:'600', marginBottom:'4px', paddingRight:'24px' }}>
                      {TONE_ICONS[h.result.tone]} {h.result.tone}
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:'6px' }}>
                      "{h.content}"
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>{new Date(h.created_at).toLocaleDateString()} · {norm(h.result.confidence_score)}%</span>
                      <button onClick={(e) => deleteSession(h.id, e)} style={{ background:'#ffffff', border:'1px solid var(--border)', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', padding:'4px', width:'26px', height:'26px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', cursor:'pointer', fontSize:'14px' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Result */}
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
          {loading && (
            <Card className="anim-scale">
              <div style={{ textAlign:'center', padding:'50px 20px' }}>
                <div className="spinner" style={{ margin:'0 auto 20px' }}/>
                <p style={{ color:'var(--text-muted)' }}>Analyzing your communication…</p>
              </div>
            </Card>
          )}

          {result && !loading && (
            <>
              <Card className="anim-scale" gradient="var(--grad-primary)">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px' }}>
                  <div>
                    <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px' }}>Detected Tone</p>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ fontSize:'2rem' }}>{TONE_ICONS[result.tone]||'💬'}</span>
                      <div>
                        <div style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', fontWeight:'800', color:toneColor(result.tone), textTransform:'capitalize' }}>{result.tone}</div>
                        <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{result.tone_description}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:'2.5rem', fontWeight:'900', color:scoreCol(norm(result.confidence_score)) }}>{norm(result.confidence_score)}</div>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:'600' }}>CONFIDENCE</div>
                  </div>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width:`${norm(result.confidence_score)}%` }}/></div>
              </Card>

              <Card>
                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:'700', fontSize:'0.95rem', marginBottom:'12px', color:'var(--green)' }}>✨ Improved Version</h3>
                <div style={{ padding:'16px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'var(--r-md)', fontSize:'0.875rem', color:'var(--text-primary)', lineHeight:'1.7', fontStyle:'italic' }}>
                  "{result.improved_version}"
                </div>
                <button onClick={() => navigator.clipboard.writeText(result.improved_version)} className="btn btn-ghost" style={{ marginTop:'10px', padding:'7px 16px', fontSize:'0.78rem' }}>📋 Copy</button>
              </Card>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                <Card padding="16px">
                  <h4 style={{ fontSize:'0.82rem', fontWeight:'700', color:'var(--red)', marginBottom:'10px' }}>⚠️ Issues</h4>
                  {(result.issues||[]).map((s,i) => <div key={i} style={{ fontSize:'0.78rem', color:'var(--text-secondary)', padding:'4px 0', borderBottom:i<result.issues.length-1?'1px solid var(--border)':'none' }}>• {s}</div>)}
                </Card>
                <Card padding="16px">
                  <h4 style={{ fontSize:'0.82rem', fontWeight:'700', color:'var(--green)', marginBottom:'10px' }}>✅ Strengths</h4>
                  {(result.strengths||[]).map((s,i) => <div key={i} style={{ fontSize:'0.78rem', color:'var(--text-secondary)', padding:'4px 0', borderBottom:i<result.strengths.length-1?'1px solid var(--border)':'none' }}>• {s}</div>)}
                </Card>
              </div>

              <Card>
                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:'700', fontSize:'0.95rem', marginBottom:'12px', color:'var(--cyan)' }}>💡 Tips to Improve</h3>
                {(result.tips||[]).map((t,i) => (
                  <div key={i} style={{ display:'flex', gap:'10px', padding:'8px 0', borderBottom:i<result.tips.length-1?'1px solid var(--border)':'none' }}>
                    <span style={{ color:'var(--cyan)', fontWeight:'700', flexShrink:0 }}>{i+1}.</span>
                    <span style={{ fontSize:'0.83rem', color:'var(--text-secondary)' }}>{t}</span>
                  </div>
                ))}
              </Card>
            </>
          )}

          {!result && !loading && (
            <Card className="anim-fade" style={{ textAlign:'center', padding:'60px 24px' }}>
              <div style={{ fontSize:'4rem', marginBottom:'16px' }}>💬</div>
              <h3 style={{ fontFamily:'var(--font-display)', fontWeight:'700', marginBottom:'8px' }}>SARVAM Awaiting Your Message</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Type something and click Analyze to get instant communication feedback.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
