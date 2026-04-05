import React, { useState, useEffect, useCallback } from 'react'
import Card from '../components/Card.jsx'
import { plannerAPI } from '../services/api.js'
import { categoryIcon, priorityColor, formatDate } from '../utils/helpers.js'
import { motion, AnimatePresence } from 'framer-motion'

const EXPERT_TEMPLATES = [
  { focus: 'Full-Stack Web Dev Mastery', motivation: 'Build robust scalable systems today.', tasks: [
    { title: 'Learn React Hooks deeply', category: 'skill', duration: '60 mins', priority: 'high', description: 'Focus on useEffect and custom hooks', day_of_week: 'Monday' },
    { title: 'Setup Express Backend', category: 'project', duration: '90 mins', priority: 'high', description: 'Initialize boilerplate with Auth routing', day_of_week: 'Tuesday' }
  ]},
  { focus: 'Data Structures & Algorithms', motivation: 'Sharpen logic, ace the interviews.', tasks: [
    { title: 'Solve 3 BFS/DFS problems', category: 'study', duration: '60 mins', priority: 'high', description: 'Use Leetcode medium difficulty', day_of_week: 'Monday' },
    { title: 'Review Dynamic Programming', category: 'study', duration: '45 mins', priority: 'medium', description: 'Knapsack concepts', day_of_week: 'Tuesday' }
  ]},
  { focus: 'Python Data Engineering', motivation: 'Data flows efficiently.', tasks: [
    { title: 'Write ETL pipeline script', category: 'project', duration: '90 mins', priority: 'high', description: 'Pandas & SQLAlchemy basics', day_of_week: 'Wednesday' },
    { title: 'Read Airflow Docs', category: 'study', duration: '30 mins', priority: 'low', description: 'DAG configuration', day_of_week: 'Thursday' }
  ]},
  { focus: 'Cloud Architecture (AWS)', motivation: 'Deploy to the sky.', tasks: [
    { title: 'Configure EC2 and VPC', category: 'skill', duration: '60 mins', priority: 'high', description: 'Secure subnets and gateways', day_of_week: 'Friday' },
    { title: 'Review IAM Policies', category: 'study', duration: '30 mins', priority: 'medium', description: 'Least privilege theory', day_of_week: 'Monday' }
  ]},
  { focus: 'System Design Preparation', motivation: 'Architect internet-scale apps.', tasks: [
    { title: 'Design Twitter Clone', category: 'study', duration: '120 mins', priority: 'high', description: 'Data models & caching', day_of_week: 'Saturday' },
    { title: 'Load Balancer Concepts', category: 'skill', duration: '45 mins', priority: 'medium', description: 'Round robin vs least connection', day_of_week: 'Wednesday' }
  ]},
  { focus: 'Machine Learning Basics', motivation: 'AI models start with data.', tasks: [
    { title: 'Linear Regression Maths', category: 'study', duration: '60 mins', priority: 'high', description: 'Gradient descent partial derivatives', day_of_week: 'Tuesday' },
    { title: 'Train simple Scikit model', category: 'project', duration: '90 mins', priority: 'high', description: 'Predict housing prices', day_of_week: 'Thursday' }
  ]},
  { focus: 'Cybersecurity Fundamentals', motivation: 'Keep the systems safe.', tasks: [
    { title: 'Learn OWASP Top 10', category: 'study', duration: '60 mins', priority: 'high', description: 'Cross-site scripting mitigations', day_of_week: 'Monday' },
    { title: 'Run Nmap scan on local VM', category: 'skill', duration: '45 mins', priority: 'medium', description: 'Port scanning basics', day_of_week: 'Wednesday' }
  ]},
  { focus: 'UI/UX Design Engineering', motivation: 'Aesthetics intersect utility.', tasks: [
    { title: 'Figma Layout Design', category: 'project', duration: '90 mins', priority: 'high', description: 'Create dark-mode glassmorphism mock', day_of_week: 'Thursday' },
    { title: 'Study Color Theory', category: 'study', duration: '30 mins', priority: 'medium', description: 'Complementary palettes', day_of_week: 'Friday' }
  ]},
  { focus: 'DevOps & CI/CD Pipelines', motivation: 'Automate all the things.', tasks: [
    { title: 'Write GitHub Actions YAML', category: 'project', duration: '60 mins', priority: 'high', description: 'Linting & Unit testing workflows', day_of_week: 'Tuesday' },
    { title: 'Docker containerization', category: 'skill', duration: '60 mins', priority: 'high', description: 'Containerize react frontend', day_of_week: 'Sunday' }
  ]},
  { focus: 'Soft Skills & Communication', motivation: 'Clarity is power.', tasks: [
    { title: 'Record mock interview', category: 'communication', duration: '45 mins', priority: 'high', description: 'STAR method responses', day_of_week: 'Saturday' },
    { title: 'Update Resume Impact', category: 'personal', duration: '60 mins', priority: 'medium', description: 'Quantify metrics heavily', day_of_week: 'Sunday' }
  ]},
  { focus: 'Rust Systems Programming', motivation: 'Memory safety without GC.', tasks: [
    { title: 'Memory Ownership Study', category: 'study', duration: '60 mins', priority: 'high', description: 'Borrow checker rules', day_of_week: 'Monday' },
    { title: 'Build CLI tool in Rust', category: 'project', duration: '90 mins', priority: 'high', description: 'Use Clap for arg parsing', day_of_week: 'Wednesday' }
  ]},
  { focus: 'Blockchain Development', motivation: 'Decentralize the future.', tasks: [
    { title: 'Solidity Smart Contracts', category: 'skill', duration: '60 mins', priority: 'high', description: 'ERC-20 token implementation', day_of_week: 'Tuesday' },
    { title: 'Web3.js Integration', category: 'project', duration: '45 mins', priority: 'medium', description: 'Connect Metamask to Frontend', day_of_week: 'Friday' }
  ]}
]

const CAT_COLORS = { study:'var(--purple)', skill:'var(--cyan)', communication:'var(--green)', exercise:'var(--orange)', project:'var(--pink)', personal:'var(--text-muted)' }
const CAT_BG    = { study:'rgba(139,92,246,0.1)', skill:'rgba(6,182,212,0.1)', communication:'rgba(16,185,129,0.1)', exercise:'rgba(245,158,11,0.1)', project:'rgba(236,72,153,0.1)', personal:'rgba(255,255,255,0.05)' }
const WEEKDAYS   = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function Planner() {
  const [mode, setMode]         = useState('daily') // 'daily' | 'weekly'
  const [plan, setPlan]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [regen, setRegen]       = useState(false)
  const [error, setError]       = useState('')
  const [filter, setFilter]     = useState('all')
  const [showAdd, setShowAdd]   = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [showEdit, setShowEdit] = useState(false)
  const [isVoid, setIsVoid]     = useState(false)

  // New Task Form
  const [newTask, setNewTask]   = useState({
    title: '', category: 'study', duration: '30 mins', priority: 'medium', description: '', day_of_week: 'Monday'
  })

  const regenerate = useCallback(async () => {
    setRegen(true)
    const manualTasks = plan?.tasks ? plan.tasks.filter(t => !t.is_ai) : []
    const aiTasks = plan?.tasks ? plan.tasks.filter(t => t.is_ai) : []
    setPlan(prev => ({ ...prev, tasks: manualTasks }))
    aiTasks.forEach(t => plannerAPI.delete(t.id).catch(() => {}))

    setTimeout(() => {
      const template = EXPERT_TEMPLATES[Math.floor(Math.random() * EXPERT_TEMPLATES.length)]
      const generated = template.tasks.map((t, idx) => ({
        id: `gen-${Date.now()}-${idx}`,
        ...t,
        completed: false,
        is_ai: true,
        planner_type: mode,
        date: plan?.date || new Date().toISOString().split('T')[0]
      }))

      setPlan(prev => ({ 
        ...prev, 
        focus_area: template.focus, 
        motivation: template.motivation, 
        tasks: [...manualTasks, ...generated] 
      }))
      setRegen(false)
      setIsVoid(false)
      generated.forEach(t => plannerAPI.add(t).catch(() => {}))
    }, 600)
  }, [mode, plan])

  const toggleTask = async (taskId, currentState) => {
    setPlan(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: !currentState } : t) }))
    try { await plannerAPI.complete(taskId, !currentState) }
    catch { setPlan(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: currentState } : t) })) }
  }

  const deleteTask = async (taskId) => {
    if (!window.confirm("Remove this task?")) return
    setPlan(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }))
    try { await plannerAPI.delete(taskId) } catch { alert("Failed to delete task") }
  }

  const loadPlan = useCallback(() => {
    setLoading(true); setError('')
    const apiCall = mode === 'daily' ? plannerAPI.today() : plannerAPI.week()
    apiCall
      .then(r => {
        const data = r.data
        setPlan(data)
        if (data.tasks && data.tasks.length === 0) {
          setIsVoid(true)
        } else {
          setIsVoid(false)
        }
      })
      .catch((err) => {
        console.error("Failed to load plan:", err)
        setError(`Failed to load ${mode} plan`)
      })
      .finally(() => setLoading(false))
  }, [mode])

  useEffect(() => {
    document.title = `${mode === 'daily' ? 'Daily' : 'Weekly'} Planner | SARVAM`
    loadPlan()
  }, [loadPlan, mode])

  const handleAddTask = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...newTask, planner_type: mode, date: plan.date }
      const res = await plannerAPI.add(payload)
      setPlan(prev => ({ ...prev, tasks: [...prev.tasks, { ...newTask, ...res.data, completed: false, is_ai: false }] }))
      setShowAdd(false)
      setNewTask({ title: '', category: 'study', duration: '30 mins', priority: 'medium', description: '', day_of_week: 'Monday' })
    } catch (err) { 
      const msg = err.response?.data?.detail || "Failed to add task"
      alert(msg) 
    }
  }
  
  const handleEditTask = async (e) => {
    e.preventDefault()
    try {
      const res = await plannerAPI.update(editTask.id, editTask)
      setPlan(prev => ({ 
        ...prev, 
        tasks: prev.tasks.map(t => t.id === editTask.id ? { ...t, ...editTask, ...res.data } : t) 
      }))
      setShowEdit(false)
      setEditTask(null)
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to update task"
      alert(msg)
    }
  }

  const openEdit = (task) => {
    setEditTask(task)
    setShowEdit(true)
  }

  const tasks     = plan?.tasks || []
  const filtered  = filter === 'all' ? tasks : filter === 'done' ? tasks.filter(t => t.completed) : tasks.filter(t => !t.completed && t.category === filter)
  const done      = tasks.filter(t => t.completed).length
  const total     = tasks.length
  const pct       = total ? Math.round((done / total) * 100) : 0
  const cats      = [...new Set(tasks.map(t => t.category))]

  const tasksByDay = WEEKDAYS.reduce((acc, d) => {
    acc[d] = tasks.filter(t => t.day_of_week === d)
    return acc
  }, {})

  return (
    <>
      <div className="page-content anim-fade">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }} className="anim-fade">
          <div>
            <h1 className="page-title">{mode === 'daily' ? '📅 Daily' : '🗓️ Weekly'} <span className="gradient-text">Planner</span></h1>
            <p className="page-subtitle">{mode === 'daily' ? formatDate() : `Strategic Outlook · Week of ${plan?.date || 'Loading...'}`}</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="tab-switcher">
              <button className={mode === 'daily' ? 'active' : ''} onClick={() => setMode('daily')}>Daily</button>
              <button className={mode === 'weekly' ? 'active' : ''} onClick={() => setMode('weekly')}>Weekly</button>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ height: '44px', padding: '0 24px' }}>
              <span style={{ fontSize: '1.2rem', marginRight: '4px' }}>+</span> New Task
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'80px' }}>
            <div className="spinner" style={{ margin:'0 auto 20px' }}/>
            <p style={{ color:'var(--text-muted)' }}>SARVAM is synchronizing your {mode} strategy…</p>
          </div>
        ) : error ? (
           <div className="alert alert-error">{error}</div>
        ) : (
          <>
            {!isVoid && (
              <Card className="anim-slide delay-1" gradient="var(--grad-primary)" style={{ marginBottom:'24px', padding:'16px 24px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
                      <span style={{ fontSize:'1.2rem' }}>🌟</span>
                      <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:'800', textTransform:'uppercase' }}>{plan?.focus_area || (mode === 'daily' ? 'Daily Focus' : 'Weekly Objective')}</span>
                    </div>
                    <p style={{ fontSize:'1rem', fontWeight:'700', color:'var(--text-primary)', maxWidth:'700px' }}>
                      "{plan?.motivation || 'Keep pushing for your career goals!'}"
                    </p>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)' }}>{pct}%</div>
                    <div style={{ fontSize: '0.65rem', color:'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Consistency Score</div>
                  </div>
                </div>
              </Card>
            )}

            {isVoid ? (
              <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Void onStart={regenerate} regen={regen} />
              </div>
            ) : (
              mode === 'daily' ? (
                <div className="anim-fade delay-2">
                  <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
                    {['all', 'done', ...cats].map(f => (
                      <button key={f} onClick={() => setFilter(f)} className={`filter-chip ${filter === f ? 'active' : ''}`}>
                        {f === 'all' ? '📋 All' : f === 'done' ? `✅ Done` : `${categoryIcon(f)} ${f}`}
                      </button>
                    ))}
                    <button className="btn sarvam-refresh-btn" onClick={regenerate} disabled={regen} style={{ marginLeft: 'auto', padding: '8px 20px' }}>
                      {regen ? 'Crystallizing...' : '🔄 Sarvam Refresh'}
                    </button>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:'12px', minHeight: '300px' }}>
                    <AnimatePresence mode="popLayout">
                      {filtered.map((t, idx) => <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} onEdit={openEdit} delay={idx*0.06} />)}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="weekly-grid anim-fade delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {WEEKDAYS.map(day => (
                    <div key={day} className="glass-card" style={{ padding: '20px', height: 'fit-content' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)' }}>{day}</h3>
                        <span className="badge">{tasksByDay[day].length}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <AnimatePresence mode="popLayout">
                          {tasksByDay[day].length === 0 
                            ? <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontSize: '0.75rem', opacity: 0.4, fontStyle: 'italic' }}>Rest or manual work...</motion.p> 
                            : tasksByDay[day].map((t, idx) => <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} onEdit={openEdit} compact={true} delay={idx*0.05} />)
                          }
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="glass-card modal-content anim-scale" onClick={e => e.stopPropagation()} style={{ width: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--purple-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>➕</div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Create Manual Task</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Add your own objectives to the {mode} plan</p>
              </div>
            </div>

            <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label>Task Title</label>
                <input className="form-input" type="text" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="e.g. System Design Mock Interview" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-input" value={newTask.category} onChange={e => setNewTask({...newTask, category: e.target.value})}>
                    {Object.keys(CAT_COLORS).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select className="form-input" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>
              {mode === 'weekly' && (
                <div className="form-group">
                  <label>Day of Week</label>
                  <select className="form-input" value={newTask.day_of_week} onChange={e => setNewTask({...newTask, day_of_week: e.target.value})}>
                    {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea className="form-input" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="Briefly describe the goal..." rows="3" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)} style={{ flex: 1, height: '46px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '46px' }}>Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEdit && editTask && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="glass-card modal-content anim-scale" onClick={e => e.stopPropagation()} style={{ width: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>✏️</div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Edit Task</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Modify your objective details</p>
              </div>
            </div>

            <form onSubmit={handleEditTask} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label>Task Title</label>
                <input className="form-input" type="text" required value={editTask.title} onChange={e => setEditTask({...editTask, title: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-input" value={editTask.category} onChange={e => setEditTask({...editTask, category: e.target.value})}>
                    {Object.keys(CAT_COLORS).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select className="form-input" value={editTask.priority} onChange={e => setEditTask({...editTask, priority: e.target.value})}>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>
              {mode === 'weekly' && (
                <div className="form-group">
                  <label>Day of Week</label>
                  <select className="form-input" value={editTask.day_of_week} onChange={e => setEditTask({...editTask, day_of_week: e.target.value})}>
                    {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea className="form-input" value={editTask.description || ''} onChange={e => setEditTask({...editTask, description: e.target.value})} rows="3" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowEdit(false)} style={{ flex: 1, height: '46px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '46px' }}>Update Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .tab-switcher { display: flex; background: var(--bg-secondary); padding: 4px; border-radius: 12px; border: 1px solid var(--border); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
        .tab-switcher button { border: none; background: none; color: var(--text-muted); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 700; transition: 0.3s; }
        .tab-switcher button.active { background: var(--purple); color: #fff; box-shadow: 0 4px 12px var(--shadow-p); }
        .filter-chip { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border); background: var(--bg-elevated); color: var(--text-muted); cursor: pointer; font-size: 0.75rem; font-weight: 700; transition: 0.3s; }
        .filter-chip.active { border-color: var(--purple); color: var(--purple); background: rgba(139,92,246,0.1); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justifyContent: center; z-index: 1000; }
        .badge { background: var(--bg-elevated); color: var(--text-primary); padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: 800; border: 1px solid var(--border); }
        .task-card { background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(56, 189, 248, 0.12)); border: 1px solid var(--border); border-left: 4px solid transparent; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02); backdrop-filter: blur(10px); }
        .task-card:hover { transform: translateY(-2px) scale(1.01); box-shadow: 0 10px 20px -5px rgba(139, 92, 246, 0.15); background: linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(56, 189, 248, 0.18)); border-color: rgba(139, 92, 246, 0.3); }
        .ai-glow { border: 1px solid transparent; position: relative; background-clip: padding-box; }
        .ai-glow::after { content: ''; position: absolute; inset: -1px; background: linear-gradient(45deg, var(--purple), var(--cyan)); z-index: -1; border-radius: inherit; opacity: 0.15; }
        .manual-shadow { box-shadow: 6px 10px 24px rgba(0,0,0,0.08), inset 0 2px 4px rgba(255,255,255,1) !important; background: #ffffff !important; border-left-width: 6px !important; }
        .delete-btn, .edit-btn { opacity: 0.6; transition: 0.2s; background: #ffffff; border: 1px solid var(--border); border-radius: 6px; padding: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .edit-btn { margin-left: 8px; }
        .task-card:hover .delete-btn, .task-card:hover .edit-btn { opacity: 0.9; }
        .delete-btn:hover { opacity: 1 !important; transform: scale(1.1); border-color: rgba(239,68,68,0.4); }
        .edit-btn:hover { opacity: 1 !important; transform: scale(1.1); border-color: rgba(56,189,248,0.4); }
      `}} />
    </>
  )
}

function TaskCard({ task, onToggle, onDelete, onEdit, compact, delay }) {
  const catColor = CAT_COLORS[task.category] || 'var(--purple)'
  const catBg    = CAT_BG[task.category]    || 'rgba(139,92,246,0.1)'
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 450, damping: 25, delay: delay || 0 }}
      className={`task-card crystallize-item ${task.is_ai ? 'ai-glow' : ''} ${!task.is_ai ? 'manual-shadow' : ''}`}
      style={{
        padding: compact ? '12px' : '16px 20px',
        borderRadius: 'var(--r-md)',
        display: 'flex', alignItems: 'center', gap: '12px',
        opacity: task.completed ? 0.5 : 1,
        borderLeftColor: task.completed ? 'var(--green)' : catColor
      }}
    >
      <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id, task.completed)} className="custom-check" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: compact ? '0.78rem' : '0.88rem', fontWeight: '700', textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
            {categoryIcon(task.category)} {task.title}
          </h4>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {!compact && <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', background: catBg, color: catColor }}>{task.category}</span>}
            <button className="edit-btn" onClick={() => onEdit(task)}>✏️</button>
            <button className="delete-btn" onClick={() => onDelete(task.id)}>🗑️</button>
          </div>
        </div>
        {!compact && task.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{task.description}</p>}
      </div>
    </motion.div>
  )
}

function Void({ onStart, regen }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="ghost-pulse"
      style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }} 
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgb(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}
      >
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--cyan)', opacity: 0.4, filter: 'blur(10px)' }} />
      </motion.div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '12px' }}>Zen Void</h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '40px', textAlign: 'center', maxWidth: '340px', lineHeight: '1.6' }}>
        The data lake is weightless. Trigger a quantum synchronization to initialize expert career templates.
      </p>
      <button 
        className="btn sarvam-refresh-btn" 
        onClick={onStart} 
        disabled={regen}
        style={{ padding: '16px 48px', height: 'auto', fontSize: '1rem', background: 'var(--cyan)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800' }}
      >
        {regen ? 'Crystallizing...' : 'Sarvam Refresh'}
      </button>
    </motion.div>
  )
}
