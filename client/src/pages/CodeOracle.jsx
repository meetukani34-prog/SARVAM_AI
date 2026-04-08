import React, { useState, useRef, useCallback, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Navbar from '../components/Navbar.jsx'

// ── Language Detection ────────────────────────────────────────────────────────
const LANG_SIGNATURES = [
  { lang: 'Python',     color: '#3b82f6', glow: 'rgba(59,130,246,0.25)',  icon: '🐍', patterns: [/def\s+\w+\s*\(/,/import\s+\w+/,/print\s*\(/,/:$/m,/elif\s/] },
  { lang: 'JavaScript', color: '#f59e0b', glow: 'rgba(245,158,11,0.25)',  icon: '⚡', patterns: [/const\s|let\s|var\s/,/=>/,/console\.log/,/function\s*\(/] },
  { lang: 'TypeScript', color: '#6366f1', glow: 'rgba(99,102,241,0.25)', icon: '🔷', patterns: [/:\s*(string|number|boolean|any)\b/,/interface\s+\w+/,/type\s+\w+\s*=/] },
  { lang: 'Java',       color: '#f97316', glow: 'rgba(249,115,22,0.25)',  icon: '☕', patterns: [/public\s+class/,/public\s+static\s+void\s+main/,/System\.out\.print/] },
  { lang: 'C++',        color: '#10b981', glow: 'rgba(16,185,129,0.25)',  icon: '⚙️', patterns: [/#include\s*</,/std::/,/cout\s*<</,/int\s+main\s*\(/] },
  { lang: 'C',          color: '#94a3b8', glow: 'rgba(148,163,184,0.25)', icon: '🔩', patterns: [/#include\s*<stdio\.h>/,/printf\s*\(/,/int\s+main\s*\(/] },
  { lang: 'Go',         color: '#06b6d4', glow: 'rgba(6,182,212,0.25)',   icon: '🐹', patterns: [/^package\s+\w+/m,/func\s+\w+\s*\(/,/fmt\.Print/,/:=\s/] },
  { lang: 'Rust',       color: '#f43f5e', glow: 'rgba(244,63,94,0.25)',   icon: '🦀', patterns: [/fn\s+\w+\s*\(/,/let\s+mut\s/,/println!\s*\(/,/impl\s+\w+/] },
  { lang: 'SQL',        color: '#8b5cf6', glow: 'rgba(139,92,246,0.25)',  icon: '🗄️', patterns: [/SELECT\s+.+FROM/i,/INSERT\s+INTO/i,/CREATE\s+TABLE/i] },
  { lang: 'Ruby',       color: '#ec4899', glow: 'rgba(236,72,153,0.25)',  icon: '💎', patterns: [/def\s+\w+/,/puts\s/,/end$/m,/\.each\s+do\s+\|/] },
  { lang: 'PHP',        color: '#a78bfa', glow: 'rgba(167,139,250,0.25)', icon: '🐘', patterns: [/<\?php/,/echo\s/,/\$\w+\s*=/] },
  { lang: 'Kotlin',     color: '#f472b6', glow: 'rgba(244,114,182,0.25)', icon: '🎯', patterns: [/fun\s+\w+\s*\(/,/val\s+\w+/,/var\s+\w+:\s*\w+/] },
  { lang: 'DSA',        color: '#34d399', glow: 'rgba(52,211,153,0.25)',  icon: '🌲', patterns: [/class\s+(Node|Tree|Stack|Queue|Graph)\b/,/BFS|DFS|Dijkstra/] },
]

function detectLanguage(code) {
  if (!code?.trim()) return null
  let best = null, bestScore = 0
  for (const lang of LANG_SIGNATURES) {
    const score = lang.patterns.filter(p => p.test(code)).length
    if (score > bestScore) { bestScore = score; best = lang }
  }
  return bestScore > 0 ? best : { lang: 'Code', color: '#94a3b8', glow: 'rgba(148,163,184,0.2)', icon: '📝' }
}

// ── Backend Proxy Streaming API ───────────────────────────────────────────────
async function* streamCodeFix(code, language, signal) {
  const token = localStorage.getItem('ai_twin_token')

  const response = await fetch('/api/ai/oracle/refine', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ code, language }),
  })

  if (!response.ok) {
    const err = await response.text()
    let msg = `Server error ${response.status}`
    try { msg = JSON.parse(err).detail || msg } catch {}
    throw new Error(msg)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    
    // Split on any combination of newlines (CRLF/LF)
    const lines = chunk.split(/\r?\n/).filter(l => l.trim().startsWith('data:'))
    for (const line of lines) {
      if (line.includes('[DONE]')) continue
      try {
        const jsonStr = line.replace(/^data:\s*/, '').trim()
        if (!jsonStr) continue
        const parsed = JSON.parse(jsonStr)
        if (parsed.error) throw new Error(parsed.error)
        let delta = parsed?.choices?.[0]?.delta?.content
        if (delta) {
          // Ignore heartbeat leading dot if it's the very first content
          if (delta === '. ') continue
          yield delta
        }
      } catch (e) {
        console.warn('SSE Parse Error:', e, line)
      }
    }
  }
}

// ── Typing Cursor Component ────────────────────────────────────────────────────
function TypingCursor() {
  return <span className="oracle-cursor" />
}

// ── Code Display with Tooltip ─────────────────────────────────────────────────
function LuminousCodeBlock({ code, explanations, onCopy, copied }) {
  const lines = code.split('\n')
  return (
    <div className="oracle-luminous-block">
      <div className="luminous-header">
        <span className="luminous-label">✦ Refined Code</span>
        <button className="oracle-copy-btn" onClick={onCopy}>
          {copied ? '✓ Copied!' : '⎘ Teleport to Clipboard'}
        </button>
      </div>
      <div className="luminous-code">
        {lines.map((line, i) => {
          const lineNum = i + 1
          const tip = explanations.find(e => e.line === lineNum)
          return (
            <div key={i} className={`luminous-line ${tip ? 'has-tip' : ''}`} data-tip={tip?.text}>
              <span className="luminous-ln">{lineNum}</span>
              <span className="luminous-text">{line || ' '}</span>
              {tip && <span className="luminous-tip-icon">◆</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Parse streaming output ─────────────────────────────────────────────────────
function parseOracleOutput(raw) {
  if (!raw) return { code: '', explanations: [] }
  
  // Strip common markdown code block markers if present
  let cleanRaw = raw.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '')
  
  const [codePart, ...rest] = cleanRaw.split('--- EXPLANATIONS ---')
  const explanations = []
  if (rest.length > 0) {
    const expText = rest.join('')
    const lineRegex = /[•\-*]\s*Line\s+(\d+):\s*(.+)/gi
    let m
    while ((m = lineRegex.exec(expText)) !== null) {
      explanations.push({ line: parseInt(m[1]), text: m[2].trim() })
    }
  }

  // If codePart is empty but raw has content, the AI might have flipped the structure
  const cleanStripped = cleanRaw.replace(/^(Here is|Sure|I can help|Absolutely).+:\s*/i, '').trim()
  const finalCode = codePart.trim() || cleanStripped
  return { code: finalCode, explanations }
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CodeOracle() {
  const [input, setInput]         = useState('')
  const [rawOutput, setRawOutput] = useState('')
  const [bytesReceived, setBytesReceived] = useState(0)
  const [streaming, setStreaming] = useState(false)
  const [phase, setPhase]         = useState('idle') // idle | detecting | streaming | done | error
  const [error, setError]         = useState('')
  const [detectedLang, setDetectedLang] = useState(null)
  const [copied, setCopied]       = useState(false)
  const abortRef  = useRef(null)
  const inputRef  = useRef(null)
  const outputRef = useRef(null)

  // Live language detection
  useEffect(() => {
    const lang = detectLanguage(input)
    setDetectedLang(lang)
  }, [input])

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [rawOutput])

  // Page title
  useEffect(() => {
    document.title = 'Code Oracle | SARVAM'
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || streaming) return

    setRawOutput('')
    setBytesReceived(0)
    setError('')
    setPhase('detecting')
    setStreaming(true)
    setCopied(false)

    abortRef.current = new AbortController()
    const lang = detectedLang?.lang || 'Code'

    try {
      await new Promise(r => setTimeout(r, 600)) // detecting phase pause
      setPhase('streaming')

      for await (const chunk of streamCodeFix(input, lang, abortRef.current.signal)) {
        setRawOutput(prev => prev + chunk)
        setBytesReceived(prev => prev + chunk.length)
      }

      setPhase('done')
    } catch (e) {
      if (e.name === 'AbortError') {
        setPhase('idle')
      } else {
        setError(e.message || 'Oracle connection failed. Check your API key.')
        setPhase('error')
      }
    } finally {
      setStreaming(false)
    }
  }, [input, streaming, detectedLang])

  const handleStop = () => {
    abortRef.current?.abort()
    setStreaming(false)
    setPhase(rawOutput ? 'done' : 'idle')
  }

  const handleCopy = async () => {
    const { code } = parseOracleOutput(rawOutput)
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setInput('')
    setRawOutput('')
    setPhase('idle')
    setError('')
    setDetectedLang(null)
    inputRef.current?.focus()
  }

  const { code: parsedCode, explanations } = rawOutput
    ? parseOracleOutput(rawOutput)
    : { code: '', explanations: [] }

  const langInfo = detectedLang
  const glowStyle = langInfo
    ? { '--oracle-glow': langInfo.glow, '--oracle-accent': langInfo.color }
    : {}

  return (
    <div className="app-shell bg-mesh">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-content oracle-page" style={glowStyle}>

          {/* Header */}
          <div className="oracle-header anim-fade">
            <div className="oracle-header-left">
              <div className="oracle-badge">⚡ SARVAM ENGINE</div>
              <h1 className="oracle-title">
                <span className="gradient-text">Cognitive</span> Code Oracle
              </h1>
              <p className="oracle-subtitle">
                Drop your broken code. The Oracle detects, refines, and explains — in any language.
              </p>
            </div>
            <div className="oracle-header-right">
              {langInfo && (
                <div className="lang-detector-pill oracle-bounce" style={{ '--pill-color': langInfo.color, '--pill-glow': langInfo.glow }}>
                  <span className="lang-icon">{langInfo.icon}</span>
                  <span className="lang-name">{langInfo.lang}</span>
                  <span className="lang-status">detected</span>
                </div>
              )}
            </div>
          </div>

          {/* Editor Layout */}
          <div className={`oracle-layout ${phase !== 'idle' ? 'has-output' : ''} anim-slide`}>

            {/* INPUT PANEL – The Void */}
            <div className="oracle-panel input-panel" style={{ '--glow': langInfo?.glow || 'rgba(124,58,237,0.15)' }}>
              <div className="panel-header">
                <div className="panel-dots">
                  <span style={{ background: '#f87171' }} />
                  <span style={{ background: '#facc15' }} />
                  <span style={{ background: '#4ade80' }} />
                </div>
                <span className="panel-title">
                  {langInfo ? `${langInfo.icon} ${langInfo.lang}` : '📂 Paste Your Code'}
                </span>
                <span className="panel-badge void">● Void</span>
              </div>
              <textarea
                ref={inputRef}
                className="oracle-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`// Paste your broken code here...\n// The Oracle will detect the language automatically.\n\n// Supports: Python, JavaScript, TypeScript, Java,\n// C, C++, Go, Rust, SQL, Ruby, PHP, Kotlin, DSA...`}
                spellCheck={false}
                autoCorrect="off"
                disabled={streaming}
                onKeyDown={e => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />
              <div className="panel-footer">
                <span className="panel-hint">
                  {input ? `${input.split('\n').length} lines` : 'Ctrl+Enter to refine'}
                </span>
                <div className="panel-actions">
                  {input && !streaming && (
                    <button className="oracle-btn ghost" onClick={handleReset}>Clear</button>
                  )}
                  {streaming ? (
                    <button className="oracle-btn stop" onClick={handleStop}>
                      ⬜ Stop Oracle
                    </button>
                  ) : (
                    <button
                      className="oracle-btn primary"
                      onClick={handleSubmit}
                      disabled={!input.trim()}
                    >
                      ✦ Refine Code
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* OUTPUT PANEL – The Refinement */}
            {phase !== 'idle' && (
              <div className="oracle-panel output-panel oracle-ascend">
                <div className="panel-header">
                  <div className="panel-dots">
                    <span style={{ background: '#4ade80' }} />
                    <span style={{ background: '#4ade80' }} />
                    <span style={{ background: '#4ade80' }} />
                  </div>
                  <span className="panel-title">
                    {phase === 'detecting'  && '🔍 Detecting language...'}
                    {phase === 'streaming'  && `${langInfo?.icon || '🤖'} Oracle Writing...`}
                    {phase === 'done'       && `✦ Refinement Complete`}
                    {phase === 'streaming'  && (
                      <span className="streaming-badge">
                        ✦ Computing: {bytesReceived} bytes received
                      </span>
                    )}
                    {phase === 'error'      && '⚠️ Oracle Error'}
                  </span>
                  <span className={`panel-badge ${phase}`}>
                    {phase === 'detecting' && '◌ analyzing'}
                    {phase === 'streaming' && '● live'}
                    {phase === 'done'      && '✓ done'}
                    {phase === 'error'     && '✕ error'}
                  </span>
                </div>

                <div className="oracle-output-body" ref={outputRef}>
                  {/* Detecting Phase */}
                  {phase === 'detecting' && (
                    <div className="oracle-detecting">
                      <div className="detect-orbs">
                        <div className="detect-orb" />
                        <div className="detect-orb" />
                        <div className="detect-orb" />
                      </div>
                      <p>Analyzing code signature...</p>
                    </div>
                  )}

                  {/* Streaming or Done Content */}
                  {(phase === 'streaming' || phase === 'done') && (rawOutput || parsedCode) && (
                    <>
                      {parsedCode ? (
                        <LuminousCodeBlock
                          code={parsedCode}
                          explanations={explanations}
                          onCopy={handleCopy}
                          copied={copied}
                        />
                      ) : (
                        <div className="oracle-raw-stream">
                          <pre>{rawOutput}</pre>
                        </div>
                      )}
                      {phase === 'streaming' && <TypingCursor />}
                    </>
                  )}

                  {/* Still streaming raw before parse boundary */}
                  {phase === 'streaming' && !parsedCode && rawOutput && (
                    <div className="oracle-raw-stream">
                      <pre>{rawOutput}</pre>
                      <TypingCursor />
                    </div>
                  )}

                  {/* Explanations Panel */}
                  {phase === 'done' && explanations.length > 0 && (
                    <div className="oracle-explanations oracle-rise">
                      <div className="exp-header">◆ Oracle Annotations</div>
                      {explanations.map((e, i) => (
                        <div key={i} className="exp-item">
                          <span className="exp-line">Line {e.line}</span>
                          <span className="exp-text">{e.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error Modal (Matching Photo 2) */}
                {phase === 'error' && (
                  <div className="oracle-modal-overlay">
                    <div className="oracle-error-modal oracle-pulse-in">
                      <div className="modal-header">
                        <span className="modal-dots">
                          <span style={{ background: '#ef4444' }} />
                          <span style={{ background: '#f59e0b' }} />
                        </span>
                        <span className="modal-title">Oracle Error</span>
                        <button className="modal-close" onClick={() => { setPhase('idle'); setError('') }}>×</button>
                      </div>
                      <div className="modal-body">
                        <div className="err-icon">⚠️</div>
                        <h2 className="err-title">{error || 'Method Not Allowed'}</h2>
                        <div className="err-hint">
                          Make sure your <b>NVIDIA_MLAT</b> key is valid and the endpoint is available.
                        </div>
                        <button className="oracle-btn primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => { setPhase('idle'); setError('') }}>
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Language Grid */}
          <div className="oracle-lang-grid anim-fade">
            {LANG_SIGNATURES.map(l => (
              <div
                key={l.lang}
                className={`oracle-lang-chip ${detectedLang?.lang === l.lang ? 'active' : ''}`}
                style={{ '--chip-color': l.color }}
              >
                <span>{l.icon}</span>
                <span>{l.lang}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Inline Styles */}
      <style>{`
        /* ── Oracle Page Layout ── */
        .oracle-page {
          --oracle-glow: rgba(124,58,237,0.15);
          --oracle-accent: var(--purple);
          position: relative;
        }
        .oracle-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse 60% 40% at 50% 0%, var(--oracle-glow), transparent 70%);
          pointer-events: none;
          z-index: 0;
          transition: background 1s ease;
        }
        .oracle-page > * { position: relative; z-index: 1; }

        /* ── Header ── */
        .oracle-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .oracle-badge {
          display: inline-block;
          background: rgba(124,58,237,0.1);
          border: 1px solid rgba(124,58,237,0.2);
          color: var(--purple);
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 10px;
        }
        .oracle-title { font-size: 2rem; font-weight: 800; margin-bottom: 8px; line-height: 1.1; }
        .oracle-subtitle { color: var(--text-secondary); font-size: 0.9rem; }

        /* ── Language Detector Pill ── */
        .lang-detector-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: var(--pill-glow, rgba(124,58,237,0.1));
          border: 1.5px solid var(--pill-color, var(--purple));
          border-radius: 30px;
          box-shadow: 0 0 20px var(--pill-glow, rgba(124,58,237,0.15));
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .lang-icon { font-size: 1.2rem; }
        .lang-name { font-weight: 800; font-size: 0.9rem; color: var(--pill-color); }
        .lang-status { font-size: 0.65rem; color: var(--text-muted); background: var(--bg-secondary); padding: 2px 8px; border-radius: 10px; }

        /* ── Layout ── */
        .oracle-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-bottom: 24px;
          transition: all 0.5s ease;
        }
        .oracle-layout.has-output {
          grid-template-columns: 1fr 1fr;
        }

        /* ── Panels ── */
        .oracle-panel {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 480px;
          transition: border-color 0.4s ease, box-shadow 0.4s ease;
        }
        .input-panel {
          box-shadow: 0 0 40px var(--glow, rgba(124,58,237,0.1));
          border-color: color-mix(in srgb, var(--oracle-accent) 30%, var(--border));
        }
        .panel-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .panel-dots { display: flex; gap: 6px; }
        .panel-dots span { width: 10px; height: 10px; border-radius: 50%; }
        .panel-title { flex: 1; font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); text-align: center; }
        .panel-badge {
          font-size: 0.65rem; font-weight: 800; letter-spacing: 0.5px;
          padding: 2px 8px; border-radius: 10px;
        }
        .panel-badge.void       { background: rgba(124,58,237,0.1); color: var(--purple); }
        .panel-badge.detecting  { background: rgba(245,158,11,0.1); color: #f59e0b; }
        .panel-badge.streaming  { background: rgba(16,185,129,0.1); color: #10b981; animation: pulse-badge 1s infinite; }
        .panel-badge.done       { background: rgba(16,185,129,0.1); color: #10b981; }
        .panel-badge.error      { background: rgba(239,68,68,0.1); color: var(--red); }
        @keyframes pulse-badge { 0%,100%{opacity:1} 50%{opacity:0.5} }

        /* ── Code Input ── */
        .oracle-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          padding: 20px;
          font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
          font-size: 0.82rem;
          line-height: 1.8;
          color: var(--text-primary);
          width: 100%;
          box-sizing: border-box;
          letter-spacing: 0.02em;
        }
        .oracle-input::placeholder { color: var(--text-muted); line-height: 1.8; }
        .oracle-input:disabled { opacity: 0.6; }

        /* ── Panel Footer ── */
        .panel-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-top: 1px solid var(--border);
          background: var(--bg-secondary);
          flex-shrink: 0;
        }
        .panel-hint { font-size: 0.72rem; color: var(--text-muted); }
        .panel-actions { display: flex; gap: 8px; }

        /* ── Buttons ── */
        .oracle-btn {
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
        .oracle-btn.primary {
          background: linear-gradient(135deg, var(--purple), var(--cyan));
          color: #fff;
          box-shadow: 0 4px 16px rgba(124,58,237,0.3);
        }
        .oracle-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,0.4); }
        .oracle-btn.primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .oracle-btn.ghost {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
        }
        .oracle-btn.ghost:hover { border-color: var(--text-secondary); color: var(--text-primary); }
        .oracle-btn.stop {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #f87171;
        }
        .oracle-btn.stop:hover { background: rgba(239,68,68,0.2); }

        /* ── Output Body ── */
        .oracle-output-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── Typing Cursor ── */
        .oracle-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: var(--oracle-accent, var(--purple));
          margin-left: 2px;
          animation: cursor-blink 0.7s step-end infinite;
          vertical-align: middle;
          border-radius: 1px;
        }
        @keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }

        /* ── Detecting ── */
        .oracle-detecting {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex: 1;
          padding: 60px;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        .detect-orbs { display: flex; gap: 12px; }
        .detect-orb {
          width: 12px; height: 12px;
          border-radius: 50%;
          background: var(--purple);
          animation: float-orb 1.2s infinite ease-in-out;
        }
        .detect-orb:nth-child(2) { background: var(--cyan); animation-delay: 0.2s; }
        .detect-orb:nth-child(3) { background: var(--green); animation-delay: 0.4s; }
        @keyframes float-orb { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-10px);opacity:1} }

        /* ── Luminous Code Block ── */
        .oracle-luminous-block {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(124,58,237,0.2);
          background: #0d1117;
          box-shadow: 0 0 30px rgba(124,58,237,0.1);
        }
        .luminous-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .luminous-label { font-size: 0.7rem; font-weight: 800; color: var(--cyan); letter-spacing: 0.5px; }
        .oracle-copy-btn {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .oracle-copy-btn:hover { background: rgba(6,182,212,0.2); transform: scale(1.02); }
        .oracle-output-body {
          flex: 1;
          overflow-y: auto;
          background: #f1f5f9; /* SOLID LIGHT GREY FORCED */
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        .luminous-code { padding: 12px 0; overflow-x: auto; }
        .luminous-line {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 2px 16px;
          position: relative;
          cursor: default;
          transition: background 0.15s;
        }
        .luminous-line:hover { background: rgba(6,182,212,0.06); }
        .luminous-line.has-tip { border-left: 2px solid var(--cyan); }
        .luminous-line.has-tip::after {
          content: attr(data-tip);
          display: none;
          position: absolute;
          left: 40px;
          top: -36px;
          background: rgba(15,23,42,0.95);
          border: 1px solid var(--cyan);
          color: #e2e8f0;
          font-size: 0.72rem;
          padding: 6px 12px;
          border-radius: 8px;
          white-space: nowrap;
          z-index: 10;
          max-width: 400px;
          white-space: normal;
          pointer-events: none;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .luminous-line.has-tip:hover::after { display: block; }
        .luminous-ln { color: #94a3b8; opacity: 0.8; font-size: 0.72rem; min-width: 24px; text-align: right; user-select: none; font-family: monospace; }
        .luminous-text { 
           color: #ffffff !important; /* FORCED WHITE FOR VISIBILITY */
           font-family: 'JetBrains Mono', 'Fira Code', monospace; 
           font-size: 0.82rem; 
           font-weight: 600;
           line-height: 1.8; 
           white-space: pre; 
        }
        .luminous-text * { color: inherit !important; }
        .luminous-tip-icon { color: var(--cyan); font-size: 0.6rem; margin-left: 4px; }

        /* ── Raw Stream ── */
        .oracle-raw-stream pre {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.78rem;
          color: var(--text-primary);
          white-space: pre-wrap;
          line-height: 1.7;
          margin: 0;
        }

        /* ── Explanations ── */
        .oracle-explanations {
          border-radius: 12px;
          border: 1px solid rgba(6,182,212,0.2);
          background: rgba(6,182,212,0.03);
          overflow: hidden;
        }
        .exp-header {
          padding: 10px 16px;
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--cyan);
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(6,182,212,0.12);
          background: rgba(6,182,212,0.05);
        }
        .exp-item {
          display: flex;
          gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          align-items: flex-start;
        }
        .exp-item:last-child { border-bottom: none; }
        .exp-line {
          background: rgba(124,58,237,0.1);
          border: 1px solid rgba(124,58,237,0.2);
          color: var(--purple);
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 10px;
          white-space: nowrap;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .exp-text { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; }

        /* ── Error Modal (Photo 2 Alignment) ── */
        .oracle-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: modal-fade-in 0.3s ease;
        }
        .oracle-error-modal {
          background: var(--bg-elevated);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 24px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3), 0 0 30px rgba(239,115,22,0.15);
          overflow: hidden;
        }
        .oracle-error-modal .modal-header {
          padding: 14px 20px;
          background: rgba(239,68,68,0.05);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .modal-dots { display: flex; gap: 6px; }
        .modal-dots span { width: 10px; height: 10px; border-radius: 50%; }
        .modal-title { font-size: 0.8rem; font-weight: 800; color: var(--text-secondary); }
        .modal-close { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; line-height: 1; }
        
        .oracle-error-modal .modal-body {
          padding: 32px 24px;
          text-align: center;
        }
        .oracle-error-modal .err-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          animation: shake 0.5s ease-in-out;
        }
        .oracle-error-modal .err-title {
          font-size: 1.25rem;
          font-weight: 800;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        .oracle-error-modal .err-hint {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .oracle-error-modal b { color: var(--orange); }

        @keyframes modal-fade-in { from{opacity:0} to{opacity:1} }
        @keyframes oracle-pulse-in { from{transform:scale(0.9);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        /* ── Language Grid ── */
        .oracle-lang-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 8px;
        }
        .oracle-lang-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid var(--border);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--bg-elevated);
          transition: all 0.2s;
          cursor: default;
        }
        .oracle-lang-chip.active {
          background: color-mix(in srgb, var(--chip-color) 12%, transparent);
          border-color: var(--chip-color);
          color: var(--chip-color);
          box-shadow: 0 0 12px color-mix(in srgb, var(--chip-color) 20%, transparent);
        }

        /* ── Animations ── */
        @keyframes oracle-ascend {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .oracle-ascend { animation: oracle-ascend 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

        @keyframes oracle-rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .oracle-rise { animation: oracle-rise 0.4s ease both; }

        @keyframes oracle-bounce {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.06); }
          100% { transform: scale(1); opacity: 1; }
        }
        .oracle-bounce { animation: oracle-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .oracle-layout.has-output { grid-template-columns: 1fr; }
          .oracle-header { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}
