import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Navbar from '../components/Navbar.jsx'
import Card from '../components/Card.jsx'
import { roadmapAPI } from '../services/api.js'

const PRESET_GOALS = [
  { label: 'Full Stack Developer', icon: '🌐' },
  { label: 'Data Scientist', icon: '📊' },
  { label: 'DevOps Engineer', icon: '🔧' },
  { label: 'Mobile Developer', icon: '📱' },
  { label: 'AI/ML Engineer', icon: '🧠' },
  { label: 'Cloud Architect', icon: '☁️' },
]

const PHASE_COLORS = ['var(--purple)', 'var(--cyan)', 'var(--green)', 'var(--orange)', 'var(--pink)', 'var(--red)', 'var(--purple)']

export default function CareerRoadmap() {
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [roadmap, setRoadmap] = useState(null)
  const [error, setError] = useState('')
  const [savedMaps, setSavedMaps] = useState([])

  useEffect(() => {
    document.title = 'Career Roadmap | SARVAM'
    roadmapAPI.getMy()
      .then(r => {
        const maps = Array.isArray(r.data) ? r.data : []
        setSavedMaps(maps)
        // Auto-select the most recently generated roadmap
        if (maps.length > 0 && !roadmap) setRoadmap(maps[0])
      })
      .catch(() => { })
  }, [])

  const generate = async (e) => {
    e?.preventDefault()
    if (!goal.trim()) return

    // ── If we already have this roadmap, just open it — no AI call ──────────────
    const goalLower = goal.trim().toLowerCase()
    const alreadySaved = savedMaps.find(m => m.goal.toLowerCase() === goalLower)
    if (alreadySaved) {
      setRoadmap(alreadySaved)
      return
    }

    setLoading(true); setError('')
    try {
      const r = await roadmapAPI.generate(goal.trim())
      const newMap = r.data  // { id, goal, phases, estimated_duration }
      setRoadmap(newMap)
      setSavedMaps(prev => {
        const exists = prev.find(m => m.id === newMap.id || m.goal.toLowerCase() === newMap.goal.toLowerCase())
        if (exists) return prev.map(m => (m.id === newMap.id || m.goal.toLowerCase() === newMap.goal.toLowerCase()) ? newMap : m)
        return [newMap, ...prev]
      })
    } catch (e) { setError(e.response?.data?.detail || 'Generation failed.') }
    finally { setLoading(false) }
  }

  const togglePhase = async (phaseId, completed) => {
    if (!roadmap?.id) return

    // Optimistic update — UI responds instantly
    const updatePhases = (phases) => phases.map(p => p.id === phaseId ? { ...p, completed } : p)
    const prevRoadmap = roadmap

    setRoadmap(prev => ({ ...prev, phases: updatePhases(prev.phases) }))
    setSavedMaps(prev => prev.map(m =>
      m.id === roadmap.id ? { ...m, phases: updatePhases(m.phases || []) } : m
    ))

    try {
      await roadmapAPI.updateProgress(roadmap.id, phaseId, completed)
    } catch (e) {
      // Rollback on failure
      setRoadmap(prevRoadmap)
      setSavedMaps(prev => prev.map(m => m.id === roadmap.id ? prevRoadmap : m))
      alert('Failed to save progress. Please try again.')
    }
  }


  const deleteRoadmap = async (id, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this roadmap?')) return
    try {
      await roadmapAPI.delete(id)
      setSavedMaps(prev => prev.filter(m => m.id !== id))
      if (roadmap?.id === id) setRoadmap(null)
    } catch {
      alert('Failed to delete roadmap.')
    }
  }

  const completedCount = (roadmap?.phases || []).filter(p => p.completed).length
  const totalCount = (roadmap?.phases || []).length
  const progressPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="page-content anim-fade">
      <div className="page-header">
        <h1 className="page-title">🗺️ Career <span className="gradient-text">Roadmap</span></h1>
        <p className="page-subtitle">Expert-level skill mapping and career trajectory planning powered by SARVAM.</p>
      </div>

      <Card className="anim-slide delay-1" style={{ marginBottom:'24px' }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontWeight:'700', fontSize:'1rem', marginBottom:'16px' }}>
          🎯 What's your target role?
        </h3>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'16px' }}>
          {PRESET_GOALS.map(g => (
            <button key={g.label} onClick={() => setGoal(g.label)}
              style={{
                padding:'8px 16px', borderRadius:'var(--r-full)', border:'1px solid',
                borderColor: goal === g.label ? 'var(--purple)' : 'var(--border)',
                background:  goal === g.label ? 'rgba(139,92,246,0.12)' : 'transparent',
                color:       goal === g.label ? 'var(--purple)' : 'var(--text-secondary)',
                fontSize:'0.82rem', fontWeight:'600', cursor:'pointer',
                fontFamily:'var(--font-sans)', transition:'all var(--fast)',
                display:'flex', alignItems:'center', gap:'6px'
              }}>
              {g.icon} {g.label}
            </button>
          ))}
        </div>
        <form onSubmit={generate} style={{ display:'flex', gap:'12px' }}>
          <input id="goal-input" className="input" placeholder="Or type a custom role (e.g. 'Blockchain Developer')…" value={goal} onChange={e => setGoal(e.target.value)} style={{ flex:1 }}/>
          <button id="generate-roadmap-btn" type="submit" className="btn btn-primary" disabled={!goal.trim()||loading} style={{ whiteSpace:'nowrap', padding:'12px 24px' }}>
            {loading ? <><span className="spinner spinner-sm"/> Generating…</> : '✨ Generate Roadmap'}
          </button>
        </form>
        {error && <div className="alert alert-error anim-fade" style={{ marginTop:'14px' }}>⚠️ {error}</div>}
      </Card>

      <div className="responsive-grid cols-sidebar" style={{ gridTemplateColumns: savedMaps.length > 0 ? '300px 1fr' : '1fr' }}>
        
        {/* Left Column: Saved Roadmaps */}
        {savedMaps.length > 0 && (
          <div className="anim-fade">
             <Card>
                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:'700', fontSize:'0.9rem', marginBottom:'14px' }}>📁 My Roadmaps</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px', maxHeight:'600px', overflowY:'auto' }}>
                  {savedMaps.map((m) => {
                    const done = (m.phases||[]).filter(v=>v.completed).length
                    const tot  = (m.phases||[]).length
                    const pct  = tot ? Math.round((done/tot)*100) : 0
                    const isActive = roadmap?.id === m.id
                    return (
                      <div key={m.id} onClick={() => setRoadmap(m)}
                        style={{
                          padding:'12px 14px', borderRadius:'var(--r-md)', cursor:'pointer',
                          background: isActive ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
                          border:`1px solid ${isActive ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`,
                          transition:'0.2s', position:'relative',
                        }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'6px' }}>
                          <div style={{ fontWeight:'600', fontSize:'0.82rem', color:'var(--text-primary)', paddingRight:'20px' }}>{m.goal}</div>
                          <button onClick={(e) => deleteRoadmap(m.id, e)} style={{ background:'#ffffff', border:'1px solid var(--border)', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', padding:'4px', width:'24px', height:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', cursor:'pointer', fontSize:'14px', flexShrink:0 }}>🗑️</button>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:'6px' }}>
                          <span>{done}/{tot} phases</span><span style={{ color:'var(--purple)' }}>{pct}%</span>
                        </div>
                        <div className="progress-bar" style={{ height:'4px' }}>
                          <div className="progress-fill" style={{ width:`${pct}%` }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
             </Card>
          </div>
        )}

        {/* Right Column: Active Roadmap / Timeline */}
        <div className="anim-fade delay-3">
           {loading && (
             <Card>
               <div style={{ textAlign:'center', padding:'60px 20px' }}>
                 <div className="spinner" style={{ margin:'0 auto 20px' }}/>
                 <p style={{ color:'var(--text-muted)' }}>SARVAM is calculating the optimal path for {goal}…</p>
                 <p style={{ color:'var(--text-muted)', fontSize:'0.75rem', opacity:0.7, marginTop:'8px' }}>This may take 15-30 seconds</p>
               </div>
             </Card>
           )}

           {roadmap && !loading && (
             <div className="anim-scale">
                {/* Header Stats */}
                <Card style={{ marginBottom:'20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                    <div>
                      <h2 style={{ fontFamily:'var(--font-display)', fontWeight:'800', fontSize:'1.2rem' }}>{roadmap.goal}</h2>
                      <p style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>⏱ {roadmap.estimated_duration}</p>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:'900', background:'var(--grad-text)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                        {progressPct}%
                      </div>
                      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>Complete</div>
                    </div>
                  </div>
                  <div className="progress-bar" style={{ height:'10px' }}>
                    <div className="progress-fill" style={{ width:`${progressPct}%` }}/>
                  </div>
                </Card>

                {/* Vertical Timeline */}
                <div style={{ position:'relative' }}>
                  <div style={{ position:'absolute', left:'22px', top:'28px', bottom:'28px', width:'2px', background:'linear-gradient(180deg, var(--purple), var(--cyan))', opacity:0.3 }}/>
                  
                  <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                    {(roadmap.phases||[]).map((phase, idx) => {
                      const color = PHASE_COLORS[idx % PHASE_COLORS.length]
                      return (
                        <div key={phase.id} className="anim-fade" style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>
                          <div style={{
                            width:'46px', height:'46px', borderRadius:'50%', flexShrink:0,
                            background: phase.completed ? 'var(--grad-success)' : `${color}22`,
                            border:`2px solid ${phase.completed ? 'var(--green)' : color}`,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:'16px', zIndex:1, cursor:'pointer',
                            transition:'all var(--mid)',
                            boxShadow: phase.completed ? '0 0 16px rgba(16,185,129,0.4)' : 'none',
                          }}
                            onClick={() => togglePhase(phase.id, !phase.completed)}
                          >
                            {phase.completed ? '✅' : idx+1}
                          </div>

                          <Card style={{ flex:1, padding:'20px', borderLeft:`3px solid ${phase.completed ? 'var(--green)' : color}`, opacity: phase.completed ? 0.8 : 1 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px', flexWrap:'wrap', gap:'8px' }}>
                              <div>
                                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:'700', fontSize:'0.95rem', marginBottom:'2px', textDecoration: phase.completed ? 'line-through' : 'none', color: phase.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                  {phase.title}
                                </h3>
                                <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>⏱ {phase.duration}</span>
                              </div>
                              <button onClick={() => togglePhase(phase.id, !phase.completed)}
                                style={{ padding:'5px 12px', borderRadius:'var(--r-full)', border:`1px solid ${phase.completed ? 'rgba(239,68,68,0.3)' : `${color}44`}`, background: phase.completed ? 'rgba(239,68,68,0.08)' : `${color}11`, color: phase.completed ? 'var(--red)' : color, fontSize:'0.72rem', fontWeight:'600', cursor:'pointer', fontFamily:'var(--font-sans)', whiteSpace:'nowrap' }}>
                                {phase.completed ? '↩ Undo' : '✓ Done'}
                              </button>
                            </div>
                            <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:'12px', lineHeight:'1.5' }}>{phase.description}</p>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                              {(phase.skills||[]).map(s => <span key={s} className="skill-chip" style={{ fontSize:'0.72rem' }}>⚡ {s}</span>)}
                            </div>
                          </Card>
                        </div>
                      )
                    })}
                  </div>
                </div>
             </div>
           )}

           {!roadmap && !loading && (
             <Card style={{ textAlign:'center', padding:'80px 24px' }}>
               <div style={{ fontSize:'4rem', marginBottom:'16px' }}>🗺️</div>
               <h3 style={{ fontFamily:'var(--font-display)', fontWeight:'700', fontSize:'1.2rem', marginBottom:'8px' }}>No Roadmap Yet</h3>
               <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Select a goal above and generate your personalized AI career roadmap.</p>
             </Card>
           )}
        </div>
      </div>
    </div>
  )
}

