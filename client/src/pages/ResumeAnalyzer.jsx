import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import Sidebar from '../components/Sidebar.jsx'
import Navbar from '../components/Navbar.jsx'
import Card, { ScoreRing } from '../components/Card.jsx'
import { resumeAPI } from '../services/api.js'

export default function ResumeAnalyzer() {
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')
  const [history, setHistory] = useState([])
  const [preview, setPreview] = useState(null)

  const fetchHistory = useCallback(async () => {
    try {
      const r = await resumeAPI.getHistory()
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
    document.title = 'Resume Analyzer | SARVAM'
    fetchHistory()
  }, [fetchHistory])

  const deleteAnalysis = async (id, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this analysis?')) return
    try {
      await resumeAPI.delete(id)
      setHistory(prev => prev.filter(h => h.id !== id))
      if (result?.id === id) setResult(null)
    } catch {
      alert('Failed to delete history item.')
    }
  }

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) {
      const selected = accepted[0]
      setFile(selected)
      setResult(null)
      setError('')
      
      if (selected.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target.result)
        reader.readAsDataURL(selected)
      } else {
        setPreview(null)
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
  })

  const analyze = async () => {
    if (!file) return

    // ── If already analyzed, just show the existing result ──────────────────
    const existing = history.find(h => h.filename === file.name)
    if (existing) {
      setResult(existing.result)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    try {
      const r = await resumeAPI.analyze(file)
      const record = r.data
      const analysisResult = record.result || record
      setResult(analysisResult)
      setHistory(prev => {
        const already = prev.find(h => h.id === record.id || h.filename === record.filename)
        if (already) return prev.map(h => (h.id === record.id || h.filename === record.filename) ? { ...h, result: analysisResult } : h)
        return [{ id: record.id, filename: record.filename, created_at: record.created_at, result: analysisResult }, ...prev]
      })
    } catch (e) {
      setError(e.response?.data?.detail || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }




  const scoreColor = (s) => s >= 80 ? 'var(--green)' : s >= 60 ? 'var(--orange)' : 'var(--red)'

  return (
    <div className="page-content anim-fade" style={{ maxWidth: '1600px' }}>
      <div className="page-header">
        <h1 className="page-title">📄 Resume <span className="gradient-text">Analyzer</span></h1>
        <p className="page-subtitle">Premium SARVAM-powered diagnostics for your technical career.</p>
      </div>

      <div className={`responsive-grid ${result ? 'cols-3-special' : 'cols-sidebar'}`} style={{ 
        transition: 'all 0.5s var(--ease)' 
      }}>

        {/* Left Column: Fixed History Sidebar */}
        <div className="anim-left delay-1" style={{ position: 'sticky', top: '24px' }}>
          <div className="glass-card" style={{ padding: '24px', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                🕒 SCANS
              </h3>
              <span className="badge badge-purple">{history.length}</span>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                  <span style={{ fontSize: '2rem' }}>📭</span>
                  <p style={{ fontSize: '0.75rem', marginTop: '8px' }}>No history yet.</p>
                </div>
              ) : (
                history.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setResult(item.result)}
                    className={`history-item-mini ${result?.id === item.id ? 'active' : ''}`}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--r-md)',
                      background: result?.id === item.id ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${result?.id === item.id ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.05)'}`,
                      cursor: 'pointer',
                      transition: '0.2s',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginBottom: '4px' }}>
                      {item.filename}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '900', color: scoreColor(item.result.overall_score), marginLeft: '8px' }}>{item.result.overall_score}%</span>
                      </div>
                      <button 
                        onClick={(e) => deleteAnalysis(item.id, e)}
                        className="delete-btn-mini"
                        style={{ background:'#ffffff', border:'1px solid var(--border)', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', padding:'4px', width:'24px', height:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', cursor:'pointer', fontSize:'12px', flexShrink:0 }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Upload & Live Preview */}
        <div className="anim-slide delay-2">
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', marginBottom: '20px', fontSize: '1rem' }}>
              TARGET DOCUMENT
            </h3>

            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? 'var(--purple)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 'var(--r-lg)',
                padding: preview ? '16px' : '60px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragActive ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.3s',
                marginBottom: '24px',
              }}
            >
              <input {...getInputProps()} />
              
              {preview ? (
                <div className="preview-container anim-scale">
                  <img src={preview} alt="Resume" style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '8px' }} />
                  <div className="overlay-msg">Replace Document</div>
                </div>
              ) : (
                <div style={{ padding: '20px' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '16px', filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.3))' }}>
                    {isDragActive ? '✨' : '📄'}
                  </div>
                  <p style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '8px' }}>
                    {isDragActive ? 'Ready to Analysis!' : 'Drop Resume Here'}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Supports PDF, JPG, PNG up to 10MB
                  </p>
                </div>
              )}
            </div>

            {file && (
              <div className="file-chip anim-fade">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{file.name}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{(file.size / 1024).toFixed(0)} KB</div>
                </div>
                <button className="btn-icon" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>✕</button>
              </div>
            )}

            {error && <div className="alert alert-error anim-shake" style={{ marginBottom: '20px' }}>{error}</div>}

            <button
              className={`btn btn-primary ${loading ? 'loading' : ''}`}
              style={{ width: '100%', height: '54px', fontSize: '1rem' }}
              onClick={analyze}
              disabled={!file || loading}
            >
              {loading ? (
                <><span className="spinner spinner-sm" /> SYNCHRONIZING…</>
              ) : '🚀 START SARVAM DIAGNOSTIC'}
            </button>
          </div>
        </div>

        {/* Right Column: AI Analysis Result Dashboard */}
        {result && (
          <div className="anim-left delay-3" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Score Rings Dashboard */}
            <div className="cloud-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-around', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <ScoreRing score={result.overall_score || 0} size={150} label="OVERALL" strokeWidth={12} color="var(--purple)" />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(result.skill_categories || {}).map(([key, val]) => (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ textTransform: 'uppercase', fontWeight: '800', opacity: 0.7 }}>{key.replace('_', ' ')}</span>
                      <span style={{ fontWeight: '900', color: scoreColor(val) }}>{val}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: '6px' }}>
                      <div className="progress-fill" style={{ width: `${val}%`, background: scoreColor(val) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Distribution */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '16px', color: 'var(--cyan)' }}>SKILLS DISTILLED</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {result.skills.map(s => (
                  <div key={s.name} className="skill-chip">
                    {s.name} <span style={{ opacity: 0.5, fontWeight: '800' }}>{s.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Gaps & Roadmap */}
            <div className="grid-2" style={{ gap: '20px' }}>
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: '800', marginBottom: '12px', color: 'var(--red)' }}>GROWTH GAPS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {result.missing_skills.map(skill => (
                    <div key={skill} style={{ fontSize: '0.8rem', color: 'rgba(239,68,68,0.8)', paddingLeft: '12px', borderLeft: '2px solid var(--red)' }}>
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: '800', marginBottom: '12px', color: 'var(--green)' }}>SUGGESTIONS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {result.career_suggestions.slice(0, 3).map(s => (
                    <div key={s} style={{ fontSize: '0.75rem', opacity: 0.8 }}>🎯 {s}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actionable Tips */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '16px' }}>ACTIONABLE IMPROVEMENTS</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.improvement_tips.map((tip, i) => (
                  <div key={i} className="tip-card">
                    <span style={{ fontSize: '1.2rem' }}>💡</span>
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .history-item-mini { transition: all 0.2s; position: relative; }
        .history-item-mini:hover { border-color: rgba(139,92,246,0.6) !important; transform: translateX(4px); background: var(--bg-secondary); }
        .history-item-mini .delete-btn-mini { opacity: 0.5 !important; transition: 0.2s; }
        .history-item-mini:hover .delete-btn-mini { opacity: 1 !important; transform: scale(1.1); border-color: rgba(239,68,68,0.4) !important; }
        .preview-container { position: relative; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
        .overlay-msg { position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; align-items: center; justifyContent: center; opacity: 0; transition: 0.3s; color: var(--text-primary); font-weight: 800; backdrop-filter: blur(4px); }
        .preview-container:hover .overlay-msg { opacity: 1; }
        .file-chip { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.2); border-radius: var(--r-md); margin-bottom: 20px; }
        .btn-icon { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; font-size: 16px; transition: 0.2s; }
        .btn-icon:hover { color: var(--red); transform: scale(1.1); }
        .tip-card { display: flex; gap: 14px; padding: 14px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--r-md); transition: 0.3s; }
        .tip-card:hover { background: var(--bg-elevated); border-color: rgba(16,185,129,0.4); box-shadow: 0 2px 8px rgba(16,185,129,0.1); }
        ::-webkit-scrollbar { width: 4px; }
      `}} />
    </div>
  )
}
