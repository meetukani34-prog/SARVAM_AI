import { Link, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer.jsx'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="nav-logo">SARVAM</div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#methodology">Methodology</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="login-link">Login</Link>
          <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ background: 'var(--cyan)', color: '#fff', borderRadius: '20px' }}>Sign Up</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-banner">
          <span className="sparkle">✨</span> Setting a higher standard. <a href="#">Read the manifesto ↗</a>
        </div>
        <h1 className="hero-title">
          Your Career,<br/>Transformed<br/>by Your SARVAM
        </h1>
        <p className="hero-subtitle">
          The ultimate AI-driven career engine and personal mentor for technical and soft skill mastery.
        </p>
        <div className="hero-cta">
          <button onClick={() => navigate('/login')} className="btn" style={{ background: 'var(--cyan)', color: '#fff', borderRadius: '24px', padding: '14px 28px', fontSize: '1rem' }}>Get Started</button>
          <button className="btn" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '24px', padding: '14px 28px', fontSize: '1rem', color: 'var(--text-primary)' }}>
            <span style={{ marginRight: '8px' }}>▶</span> Watch Demo
          </button>
        </div>

        {/* Realistic Glowing Neural Graphic */}
        <div className="hero-graphic">
          <div className="hero-graphic-inner" style={{ position: 'relative' }}>
            <img 
              src="/hero_neural_nexus.png" 
              alt="SARVAM Neural Core" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, opacity: 0.85, mixBlendMode: 'screen' }} 
            />
            <div className="floating-card c-1">
              <div className="shimmer"></div>
              <div style={{ padding: '12px', color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--cyan)', display: 'block', marginBottom: '4px' }}>⟳ Sync Mode</span>
                Optimal
              </div>
            </div>
            <div className="floating-card c-2">
              <div className="shimmer"></div>
              <div style={{ padding: '12px', color: '#fff', fontSize: '0.7rem' }}>
                <span style={{ color: 'var(--purple)', display: 'block', marginBottom: '8px', fontWeight: 700 }}>Deep Learning</span>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: '74%', background: 'var(--purple)', borderRadius: '2px' }}></div>
                </div>
              </div>
            </div>
            <div className="floating-card c-3">
              <div className="shimmer"></div>
              <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></span>
                Active Nodes: 4,092
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Onboarding */}
      <section className="onboarding-section">
        <div className="onboarding-header">
          <div>
            <h2>The Smart Onboarding</h2>
            <p>Three stages to architect your digital reflection. Your SARVAM learns from your history to predict your future.</p>
          </div>
          <div className="watermark">01-03</div>
        </div>
        
        <div className="onboarding-grid">
          <div className="onboard-card">
            <img src="/img_neural_sync.png" alt="Neural Synchronization" className="ob-img" />
            <h3>Neural Synchronization</h3>
            <p>Connect your LinkedIn, Github, and Portfolio. Our engine parses the metadata of your career trajectory.</p>
          </div>
          <div className="onboard-card">
            <img src="/img_tone_calibration.png" alt="Tone Calibration" className="ob-img" />
            <h3>Tone Calibration</h3>
            <p>Engage in a 5-minute diagnostic chat, let AI study your written nuance, humor, and professional stance.</p>
          </div>
          <div className="onboard-card">
            <img src="/img_goal_rendering.png" alt="Goal Rendering" className="ob-img" />
            <h3>Goal Rendering</h3>
            <p>Define your North Star. Your SARVAM maps the roadmap, identifies skill gaps, and prepares the strategy.</p>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="methodology" className="methodology-section">
        <div className="section-header">
          <div className="cc-badge">SYSTEM ARCHITECTURE</div>
          <h2>Our Core Methodology</h2>
          <p>Behind every roadmap is a deep-learning engine designed to decode your professional nuance.</p>
        </div>

        <div className="methodology-box">
          <div className="m-step">
            <div className="m-number">01</div>
            <h3>Ingestion & Encryption</h3>
            <p>Metadata parsing of LinkedIn, GitHub, and your professional archive. We treat your data with military-grade encryption.</p>
          </div>
          
          <div className="neural-flow">
            <div className="flow-dot"></div>
            <div className="flow-dot"></div>
            <div className="flow-dot"></div>
          </div>

          <div className="m-step active">
            <div className="m-number highlight">02</div>
            <h3>Neural Mapping</h3>
            <p>Constructing a multi-dimensional skill vector. Your SARVAM learns your unique professional "DNA".</p>
          </div>

          <div className="neural-flow">
            <div className="flow-dot"></div>
            <div className="flow-dot"></div>
            <div className="flow-dot"></div>
          </div>

          <div className="m-step">
            <div className="m-number">03</div>
            <h3>Predictive Execution</h3>
            <p>Generating optimal career pivots and autonomous roadmaps that adapt as you grow.</p>
          </div>
        </div>
      </section>

      {/* Neural Command Center */}
      <section className="command-center-section">
        <div className="cc-badge">AI POWERED INTERFACE</div>
        <div className="cc-layout">
          <div className="cc-left">
            <h2>The Neural Command<br/>Center</h2>
            <p className="cc-desc">Your career dashboard designed for both art and action. It's a multi-modal career laboratory that executes complex flows in real time.</p>
            
            <div className="cc-feature-list">
              <div className="cc-feature">
                <div className="cc-icon">✍️</div>
                <div>
                  <h4>Improve Message</h4>
                  <p>Draft winning statements & team messages with perfect social cadence.</p>
                </div>
              </div>
              <div className="cc-feature active">
                <div className="cc-icon highlight">👥</div>
                <div>
                  <h4>Simulate Feedback</h4>
                  <p>Invert POV. Run a real critique of your resume/documents against specific job descriptions.</p>
                </div>
              </div>
              <div className="cc-feature">
                <div className="cc-icon">💡</div>
                <div>
                  <h4>Career Advice</h4>
                  <p>Strategic live mentor on every negotiation, promotion cycles, and industry pivots.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="cc-right">
            <div className="mock-chat-ui">
              <div className="chat-header">
                <div className="bot-avatar"></div>
                <div className="bot-info">
                  <strong>SARVAM</strong>
                  <span>AI Thinking...</span>
                </div>
              </div>
              <div className="chat-body">
                <div className="user-msg">
                  I'm applying to the UX/UI Intern role at Meta. My total years of design base Experience is little sparse but my systematic design tends to excel over uncoordinated assets.
                </div>
                <div className="sys-msg">
                  Can you rewrite this message so it's less textually heavy and more structured as bullet points?
                </div>
                <div className="chat-actions">
                  <button>Draft Rewrite</button>
                  <button>Apply to Resume</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Autonomous Career Engine */}
      <section className="autonomous-section">
        <h2>Autonomous Career Engine</h2>
        <p className="section-sub">Dynamic roadmap generation that adjusts every time you complete a task or learn a skill.</p>

        <div className="bento-grid">
          <div className="bento-card b-wide">
            <div className="bento-content">
              <h3>Dynamic Roadmap</h3>
              <p>Real-time skill acquisition visualization.</p>
              <div className="progress-track">
                <div className="progress-fill"></div>
              </div>
              <div className="progress-points"><span>Learn</span><span>Apply</span><span>Mastery</span></div>
            </div>
            <div className="bento-visual viz-roadmap"><span>84%</span></div>
          </div>

          <div className="bento-card b-square">
            <div className="bento-content centered">
              <div className="icon-circle">🔍</div>
              <h3>Deep Parsing</h3>
              <p>Our engine doesn't just read words, it understands the semantics around your achievements.</p>
            </div>
          </div>

          <div className="bento-card b-rect">
            <div className="bento-content">
              <h3>Opportunity Radar</h3>
              <div className="radar-list">
                <div className="radar-item"><span>Meta, IL</span><span className="match">94% Match</span></div>
                <div className="radar-item"><span>Stripe, NYC</span><span className="match">89% Match</span></div>
              </div>
            </div>
          </div>

          <div className="bento-card b-dark">
            <div className="dark-viz"></div>
            <div className="bento-content">
              <h3>Gap Closure Strategy</h3>
              <p>We directly interface the details that stand between you and a jump in your professional band.</p>
              <a href="#">See a Gap Analysis →</a>
            </div>
          </div>
        </div>
      </section>

      {/* AI Code Bot Section */}
      <section className="codebot-section">
        <div className="codebot-layout">
          <div className="codebot-content">
            <div className="cc-badge" style={{ marginLeft: 0 }}>AI CODE INTELLIGENCE</div>
            <h2>Your AI Code<br/>Reviewer</h2>
            <p>Paste any code snippet and get instant corrections, refactors, and explanations in <strong>any language</strong> — Python, JavaScript, Java, C++, and more.</p>
            <ul className="check-list" style={{ marginBottom: '32px' }}>
              <li>✅ <strong>Bug Detection:</strong> Catch runtime errors and logic flaws before they hit production.</li>
              <li>✅ <strong>Code Quality:</strong> Automated refactor suggestions and best practice enforcement.</li>
              <li>✅ <strong>Multi-language:</strong> Supports 30+ languages including TypeScript, Go, Rust, and SQL.</li>
              <li>✅ <strong>Explanation Mode:</strong> Get plain-English explanations for any code block.</li>
            </ul>
            <div className="lang-pills">
              {['Python', 'JS', 'TypeScript', 'Java', 'C++', 'Go', 'Rust', 'SQL', 'PHP', 'Ruby'].map(lang => (
                <span key={lang} className="lang-pill">{lang}</span>
              ))}
            </div>
          </div>

          <div className="codebot-mock">
            <div className="cb-window">
              <div className="cb-header">
                <div className="cb-dots"><span></span><span></span><span></span></div>
                <div className="cb-title">🤖 SARVAM</div>
                <div className="cb-status"><span className="status-dot"></span>Active</div>
              </div>
              <div className="cb-body">
                <div className="cb-lang-tag">Python · 8 issues found</div>
                <div className="cb-code-block">
                  <div className="code-line error">
                    <span className="line-num">1</span>
                    <span className="line-code"><span className="kw">def</span> calculate_avg<span className="err">(lst)</span>:</span>
                  </div>
                  <div className="code-line">
                    <span className="line-num">2</span>
                    <span className="line-code">&nbsp;&nbsp;total <span className="op">=</span> <span className="num">0</span></span>
                  </div>
                  <div className="code-line error">
                    <span className="line-num">3</span>
                    <span className="line-code">&nbsp;&nbsp;<span className="kw">for</span> i <span className="kw">in</span> lst: total <span className="op">+=</span> i</span>
                  </div>
                  <div className="code-line error">
                    <span className="line-num">4</span>
                    <span className="line-code">&nbsp;&nbsp;<span className="kw">return</span> total <span className="op">/</span> <span className="err">len(lst)</span></span>
                  </div>
                </div>

                <div className="cb-divider">✦ AI Suggestion</div>

                <div className="cb-code-block fixed">
                  <div className="code-line ok">
                    <span className="line-num">1</span>
                    <span className="line-code"><span className="kw">def</span> calculate_avg<span className="fn">(lst: list[float]) -&gt; float</span>:</span>
                  </div>
                  <div className="code-line ok">
                    <span className="line-num">2</span>
                    <span className="line-code">&nbsp;&nbsp;<span className="kw">if not</span> lst: <span className="kw">raise</span> <span className="fn">ValueError</span>(<span className="str">"Empty list"</span>)</span>
                  </div>
                  <div className="code-line ok">
                    <span className="line-num">3</span>
                    <span className="line-code">&nbsp;&nbsp;<span className="kw">return</span> <span className="fn">sum</span>(lst) <span className="op">/</span> <span className="fn">len</span>(lst)</span>
                  </div>
                </div>

                <div className="cb-feedback">
                  <div className="cb-tag fix">✓ Type hints added</div>
                  <div className="cb-tag fix">✓ Edge case handled</div>
                  <div className="cb-tag fix">✓ Pythonic refactor</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Communication Coach */}
      <section className="coach-section">
        <div className="coach-layout">
          <div className="coach-mock">
            <div className="mock-window">
              <div className="mock-dots"><span></span><span></span><span></span></div>
              <div className="mock-split">
                <div className="mock-left">
                  <span className="m-label">YOUR INPUT</span>
                  <p>"I think this is extremely flawed because I am so unhappy that you felt that this issue was mine."</p>
                </div>
                <div className="mock-right">
                  <span className="m-label" style={{color: 'var(--cyan)'}}>SARVAM SUGGESTION</span>
                  <p>"Based on my analysis of the UX effects of cross functional and external reviews, my API networks assume some extraneous variables fall from outside of my personal output."</p>
                  <div className="m-bar">
                    <span>Professionalism</span>
                    <span>82%</span>
                  </div>
                  <div className="m-bar-bg"><div className="m-bar-fill"></div></div>
                </div>
              </div>
              <div className="mock-footer">
                <div className="m-stat"><span>Subtlety</span><strong>94/100</strong></div>
                <div className="m-stat"><span>High</span><strong>Audit 3</strong></div>
                <div className="m-stat"><span className="purple">Optimal</span><span>Iterate</span></div>
              </div>
            </div>
          </div>
          <div className="coach-content">
            <h2>Communication Coach</h2>
            <p>Real-time uplift - tone analysis and micro indications. Never send a poorly-timed message again.</p>
            <ul className="check-list">
              <li>✅ <strong>Sentiment Analysis:</strong> Understand the emotional impact before you send.</li>
              <li>✅ <strong>Conflict Interception:</strong> De-escalate with finesse that protects your professional relationships.</li>
              <li>✅ <strong>Outer Adjustment:</strong> One-click tone drift: Sales, Email, and Slack.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="pricing-header">
          <div className="cc-badge">INVEST IN YOUR FUTURE</div>
          <h2>Designed for Every Trajectory</h2>
          <p>Choose the neural tier that matches your career velocity. All plans include 24/7 SARVAM availability.</p>
        </div>

        <div className="pricing-grid">
          {/* Starter */}
          <div className="pricing-card anim-fade delay-1">
            <div className="p-tier">STARTER</div>
            <div className="p-price">₹0<span>/ forever</span></div>
            <p className="p-desc">Basic neural engine for professionals starting their career journey.</p>
            <ul className="p-features">
              <li>Neural Resume Scan (3/mo)</li>
              <li>Basic Roadmap Generation</li>
              <li>Community Support</li>
              <li>5 AI Chat Credits/day</li>
            </ul>
            <button onClick={() => navigate('/login')} className="btn btn-ghost" style={{ width: '100%', marginTop: 'auto' }}>Get Started</button>
          </div>

          {/* Professional */}
          <div className="pricing-card featured anim-fade delay-2">
            <div className="p-badge">MOST POPULAR</div>
            <div className="p-tier">PROFESSIONAL</div>
            <div className="p-price">₹99<span>/ month</span></div>
            <p className="p-desc">Full autonomous career engine for serious professionals.</p>
            <ul className="p-features">
              <li>Unlimited Neural Scans</li>
              <li>Autonomous Roadmap Gen</li>
              <li>Deep Skill Gap Analysis</li>
              <li>Unlimited Chat Coach</li>
            </ul>
            <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: '100%', marginTop: 'auto', background: 'var(--cyan)' }}>Upgrade to Pro</button>
          </div>

          {/* Infinite */}
          <div className="pricing-card anim-fade delay-3">
            <div className="p-tier">INFINITE</div>
            <div className="p-price">₹599<span>/ year</span></div>
            <p className="p-desc">Executive-level support with dedicated neural bandwidth.</p>
            <ul className="p-features">
              <li>Priority Neural Nodes</li>
              <li>Custom Career Rendering</li>
              <li>24/7 Expert Bypass</li>
              <li>Lifetime Memory Access</li>
            </ul>
            <button onClick={() => navigate('/login')} className="btn btn-ghost" style={{ width: '100%', marginTop: 'auto' }}>Go Infinite</button>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="cta-section">
        <div className="cta-box">
          <h2>Ready to sync with your<br/>future?</h2>
          <p>Join 50,000+ professionals who are navigating their career at the actual UI advantage.</p>
          <div className="cta-buttons">
            <button onClick={() => navigate('/login')} className="btn" style={{ background: 'var(--cyan)', color: '#fff', borderRadius: '24px', padding: '14px 28px' }}>Get Started for free</button>
            <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '24px', padding: '14px 28px', color: 'var(--text-primary)' }}>View Enterprise Pricing</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        .landing-page {
          background: #fafafa;
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
        }

        /* Nav */
        .landing-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 60px;
          background: #ffffff;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .nav-logo { font-size: 1.4rem; font-weight: 900; letter-spacing: -0.5px; color: var(--cyan); }
        .nav-links { display: flex; gap: 30px; }
        .nav-links a { text-decoration: none; color: var(--text-secondary); font-size: 0.9rem; font-weight: 500; transition: 0.2s; }
        .nav-links a:hover { color: var(--text-primary); }
        .nav-actions { display: flex; gap: 20px; align-items: center; }
        .login-link { text-decoration: none; color: var(--text-primary); font-size: 0.9rem; font-weight: 600; }

        /* Hero */
        .hero-section {
          text-align: center;
          padding: 80px 20px 40px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .hero-banner {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 30px;
        }
        .hero-banner a { color: var(--text-primary); text-decoration: none; font-weight: 600; }
        .hero-title {
          font-size: 4.5rem;
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: -1px;
          margin-bottom: 24px;
        }
        .hero-subtitle {
          font-size: 1.1rem;
          color: var(--text-secondary);
          max-width: 500px;
          margin: 0 auto 40px;
          line-height: 1.5;
        }
        .hero-cta { display: flex; justify-content: center; gap: 16px; margin-bottom: 60px; }

        .hero-graphic {
          background: #ffffff;
          border-radius: 24px;
          padding: 10px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.05);
          position: relative;
        }
        .hero-graphic-inner {
          background: #0f172a;
          border-radius: 16px;
          height: 400px;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .neural-core {
          width: 300px; height: 300px;
          background: radial-gradient(circle, var(--cyan) 0%, transparent 60%);
          opacity: 0.3;
          filter: blur(40px);
          animation: pulse 4s infinite alternate;
        }
        .floating-card {
          position: absolute;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
          border-radius: 8px;
        }
        .c-1 { width: 140px; height: 80px; top: 40px; left: 80px; }
        .c-2 { width: 100px; height: 120px; bottom: 60px; left: 40px; }
        .c-3 { width: 160px; height: 60px; top: 60px; right: 100px; }
        
        /* Onboarding */
        .onboarding-section { padding: 80px 60px; max-width: 1200px; margin: 0 auto; }
        .onboarding-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 60px; }
        .onboarding-header h2 { font-size: 2.2rem; font-weight: 800; margin-bottom: 12px; }
        .onboarding-header p { color: var(--text-secondary); max-width: 400px; }
        .watermark { font-size: 5rem; font-weight: 900; color: rgba(15,23,42,0.03); line-height: 0.8; }
        .onboarding-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        .onboard-card { display: flex; flex-direction: column; }
        .ob-img { width: 100%; height: 260px; object-fit: cover; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .gradient-1 { background: linear-gradient(135deg, #1e1b4b, #7c3aed); }
        .gradient-2 { background: linear-gradient(135deg, #0f172a, #0ea5e9); }
        .gradient-3 { background: linear-gradient(135deg, #4c1d95, #f43f5e); }
        .onboard-card h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 10px; }
        .onboard-card p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; }

        /* Command Center */
        .command-center-section { padding: 80px 60px; background: #ffffff; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .cc-badge { display: inline-block; padding: 4px 12px; background: rgba(14, 165, 233, 0.1); color: var(--cyan); border-radius: 20px; font-size: 0.75rem; font-weight: 800; margin-bottom: 24px; margin-left: max(0px, calc(50% - 600px)); }
        .cc-layout { max-width: 1200px; margin: 0 auto; display: flex; gap: 60px; align-items: center; }
        .cc-left { flex: 1; }
        .cc-right { flex: 1; border-radius: 20px; background: #fafafa; padding: 40px; display: flex; justify-content: center; }
        .cc-left h2 { font-size: 2.2rem; font-weight: 800; margin-bottom: 16px; }
        .cc-desc { color: var(--text-secondary); margin-bottom: 40px; font-size: 1.05rem; }
        .cc-feature-list { display: flex; flex-direction: column; gap: 20px; position: relative; }
        .cc-feature-list::before { content: ''; position: absolute; left: 19px; top: 20px; bottom: 20px; width: 2px; background: var(--border); }
        .cc-feature { display: flex; gap: 20px; padding: 16px; border-radius: 12px; transition: 0.3s; position: relative; z-index: 1; }
        .cc-feature.active { background: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .cc-icon { width: 40px; height: 40px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .cc-icon.highlight { border-color: var(--cyan); background: rgba(14,165,233,0.1); }
        .cc-feature h4 { font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; }
        .cc-feature p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; }

        /* Mock Chat UI */
        .mock-chat-ui { width: 100%; max-width: 400px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid var(--border); }
        .chat-header { display: flex; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid var(--border); }
        .bot-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--purple), var(--cyan)); }
        .bot-info { display: flex; flex-direction: column; }
        .bot-info strong { font-size: 0.85rem; }
        .bot-info span { font-size: 0.7rem; color: var(--cyan); }
        .chat-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; background: #fafafa; }
        .user-msg { background: #ffffff; border: 1px solid var(--border); padding: 12px; border-radius: 12px; border-top-right-radius: 0; font-size: 0.8rem; color: var(--text-secondary); align-self: flex-end; width: 85%; }
        .sys-msg { background: rgba(14,165,233,0.05); border: 1px solid rgba(14,165,233,0.2); padding: 12px; border-radius: 12px; border-top-left-radius: 0; font-size: 0.8rem; color: var(--cyan); align-self: flex-start; width: 85%; }
        .chat-actions { display: flex; gap: 8px; justify-content: center; margin-top: 10px; }
        .chat-actions button { background: #ffffff; border: 1px solid var(--border); padding: 6px 12px; font-size: 0.7rem; border-radius: 20px; font-weight: 600; cursor: pointer; }

        /* Autonomous */
        .autonomous-section { padding: 80px 60px; max-width: 1200px; margin: 0 auto; text-align: center; }
        .autonomous-section h2 { font-size: 2.2rem; font-weight: 800; margin-bottom: 16px; }
        .section-sub { color: var(--text-secondary); max-width: 600px; margin: 0 auto 60px; }
        .bento-grid { display: grid; grid-template-columns: 2fr 1fr; grid-template-rows: auto auto; gap: 20px; text-align: left; }
        .bento-card { background: #ffffff; border: 1px solid var(--border); border-radius: 20px; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); display: flex; position: relative; overflow: hidden; }
        .b-wide { grid-column: 1; grid-row: 1; display: flex; justify-content: space-between; }
        .b-square { grid-column: 2; grid-row: 1; }
        .b-rect { grid-column: 1; grid-row: 2; }
        .b-dark { grid-column: 2; grid-row: 2; background: #0f172a; color: #fff; }
        .bento-content h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 10px; }
        .bento-content p { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 20px; width: 80%; }
        .b-dark .bento-content p { color: rgba(255,255,255,0.7); }
        .b-dark a { color: var(--cyan); font-size: 0.85rem; font-weight: 600; text-decoration: none; }
        .viz-roadmap { width: 200px; background: linear-gradient(90deg, transparent, rgba(14,165,233,0.1)); border-radius: 12px; display: flex; align-items: center; justify-content: flex-end; padding: 20px; font-size: 2rem; font-weight: 900; color: var(--cyan); }
        .progress-track { margin-top: 40px; height: 6px; background: #e2e8f0; border-radius: 3px; position: relative; width: 100%; max-width: 340px; }
        .progress-fill { position: absolute; left: 0; top: 0; width: 84%; height: 100%; background: linear-gradient(90deg, #38bdf8, #818cf8); border-radius: 3px; box-shadow: 0 0 12px rgba(56, 189, 248, 0.4); }
        .progress-points { display: flex; justify-content: space-between; margin-top: 14px; font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; width: 100%; max-width: 340px; }
        .progress-points span { position: relative; }
        .progress-points span::before { content: ''; position: absolute; top: -16px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background: #cbd5e1; border-radius: 50%; }
        .progress-points span:first-child::before { background: #38bdf8; }
        .progress-points span:nth-child(2)::before { background: #38bdf8; }
        .icon-circle { width: 48px; height: 48px; border-radius: 50%; background: rgba(14,165,233,0.1); border: 1px solid rgba(14,165,233,0.3); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 20px; }
        .radar-list { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 300px; }
        .radar-item { display: flex; justify-content: space-between; padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; font-size: 0.85rem; font-weight: 600; }
        .match { color: var(--cyan); background: rgba(14,165,233,0.1); padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; }
        
        /* Coach */
        .coach-section { padding: 80px 60px; background: var(--bg-secondary); }
        .coach-layout { max-width: 1000px; margin: 0 auto; display: flex; gap: 60px; align-items: center; }
        .coach-mock { flex: 1; }
        .coach-content { flex: 1; }
        .mock-window { background: #ffffff; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.05); padding: 20px; }
        .mock-dots { display: flex; gap: 6px; margin-bottom: 20px; }
        .mock-dots span { width: 10px; height: 10px; border-radius: 50%; background: #e2e8f0; }
        .mock-split { display: flex; gap: 20px; margin-bottom: 20px; }
        .mock-left, .mock-right { flex: 1; }
        .m-label { font-size: 0.6rem; font-weight: 800; letter-spacing: 1px; color: var(--text-muted); display: block; margin-bottom: 8px; }
        .mock-left p, .mock-right p { font-size: 0.8rem; line-height: 1.5; color: var(--text-secondary); margin-bottom: 16px; }
        .m-bar { display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 700; margin-bottom: 6px; }
        .m-bar-bg { height: 6px; background: #e2e8f0; border-radius: 3px; }
        .m-bar-fill { width: 82%; height: 100%; background: var(--cyan); border-radius: 3px; }
        .mock-footer { display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 16px; }
        .m-stat { display: flex; flex-direction: column; align-items: center; font-size: 0.7rem; }
        .m-stat span { color: var(--text-muted); margin-bottom: 4px; }
        .m-stat strong { font-size: 0.85rem; font-weight: 800; }
        .m-stat .purple { color: var(--purple); font-weight: 800; }
        
        .coach-content h2 { font-size: 2.2rem; font-weight: 800; margin-bottom: 16px; }
        .coach-content p { color: var(--text-secondary); margin-bottom: 30px; line-height: 1.6; }
        .check-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 16px; }
        .check-list li { font-size: 0.9rem; color: var(--text-secondary); display: flex; gap: 12px; align-items: center; }
        .check-list strong { color: var(--text-primary); }

        /* CTA */
        .cta-section { padding: 100px 20px; text-align: center; }
        .cta-box { background: #fafafa; border: 1px solid var(--border); max-width: 800px; margin: 0 auto; padding: 60px 20px; border-radius: 24px; }
        .cta-box h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 16px; line-height: 1.1; }
        .cta-box p { color: var(--text-secondary); margin-bottom: 40px; font-size: 1.1rem; }
        .cta-buttons { display: flex; gap: 16px; justify-content: center; }

        /* Footer */
        .landing-footer { display: flex; justify-content: space-between; align-items: center; padding: 40px 60px; border-top: 1px solid var(--border); background: #ffffff; }
        .f-logo { font-size: 1.2rem; font-weight: 900; color: var(--cyan); }
        .f-links { display: flex; gap: 20px; }
        .f-links a { color: var(--text-muted); text-decoration: none; font-size: 0.8rem; }
        .f-copyright { font-size: 0.8rem; color: var(--text-muted); }

        /* Pricing Section Styles */
        .pricing-section { padding: 100px 60px; max-width: 1200px; margin: 0 auto; text-align: center; }
        .pricing-header { margin-bottom: 60px; }
        .pricing-header h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 16px; }
        .pricing-header p { color: var(--text-secondary); max-width: 500px; margin: 0 auto; }
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        .pricing-card {
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          transition: all var(--mid);
          position: relative;
        }
        .pricing-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); border-color: var(--cyan); }
        .pricing-card.featured { border-color: var(--cyan); border-width: 2px; box-shadow: 0 10px 30px rgba(14, 165, 233, 0.1); }
        .p-badge { position: absolute; top: 16px; right: 16px; background: var(--cyan); color: #fff; font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; }
        .p-tier { font-size: 0.75rem; font-weight: 800; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 12px; }
        .p-price { font-size: 2.5rem; font-weight: 900; margin-bottom: 12px; font-family: var(--font-display); }
        .p-price span { font-size: 0.9rem; color: var(--text-muted); font-weight: 500; margin-left: 4px; }
        .p-desc { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 24px; line-height: 1.5; }
        .p-features { list-style: none; padding: 0; margin: 0 0 32px 0; display: flex; flex-direction: column; gap: 12px; }
        .p-features li { font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px; }
        .p-features li::before { content: '✓'; color: var(--cyan); font-weight: 900; }

        /* Methodology Dashboard Styles */
        .methodology-section { padding: 100px 60px; max-width: 1200px; margin: 0 auto; text-align: center; background: #ffffff; border-radius: 40px; box-shadow: 0 40px 100px rgba(0,0,0,0.03); margin-bottom: 80px; border: 1px solid var(--border); }

        /* AI Code Bot Section */
        .codebot-section { padding: 80px 60px; background: #0f172a; color: #e2e8f0; }
        .codebot-layout { max-width: 1200px; margin: 0 auto; display: flex; gap: 60px; align-items: center; }
        .codebot-content { flex: 1; }
        .codebot-content h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 16px; color: #ffffff; }
        .codebot-content p { color: rgba(255,255,255,0.6); margin-bottom: 30px; line-height: 1.6; }
        .codebot-content .check-list li { color: rgba(255,255,255,0.7); }
        .codebot-content .check-list strong { color: #fff; }
        .lang-pills { display: flex; flex-wrap: wrap; gap: 10px; }
        .lang-pill { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); padding: 5px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: rgba(255,255,255,0.7); transition: 0.2s; cursor: default; }
        .lang-pill:hover { background: rgba(14, 165, 233, 0.2); border-color: var(--cyan); color: var(--cyan); }

        /* Code Window */
        .codebot-mock { flex: 1; }
        .cb-window { background: #1e293b; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.4); }
        .cb-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #0f172a; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .cb-dots { display: flex; gap: 6px; }
        .cb-dots span { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.1); }
        .cb-dots span:nth-child(1) { background: #f87171; }
        .cb-dots span:nth-child(2) { background: #facc15; }
        .cb-dots span:nth-child(3) { background: #4ade80; }
        .cb-title { flex: 1; text-align: center; font-size: 0.78rem; font-weight: 700; color: rgba(255,255,255,0.5); }
        .cb-status { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: #4ade80; font-weight: 700; }
        .status-dot { width: 6px; height: 6px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 8px #4ade80; animation: blink 1.5s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .cb-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .cb-lang-tag { font-size: 0.7rem; font-weight: 800; color: rgba(255,255,255,0.4); letter-spacing: 1px; }
        .cb-code-block { background: rgba(0,0,0,0.3); border-radius: 10px; padding: 14px; border: 1px solid rgba(255,255,255,0.05); }
        .cb-code-block.fixed { border-color: rgba(74, 222, 128, 0.25); background: rgba(74,222,128,0.04); }
        .code-line { display: flex; gap: 12px; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.75rem; line-height: 1.9; }
        .code-line.error { background: rgba(248,113,113,0.07); margin: 0 -14px; padding: 0 14px; border-left: 2px solid #f87171; }
        .code-line.ok { background: rgba(74,222,128,0.04); margin: 0 -14px; padding: 0 14px; border-left: 2px solid #4ade80; }
        .line-num { color: rgba(255,255,255,0.2); min-width: 16px; text-align: right; user-select: none; }
        .line-code { color: #cbd5e1; }
        .kw { color: #c084fc; } .fn { color: #60a5fa; } .str { color: #86efac; } .num { color: #fb923c; } .op { color: #94a3b8; } .err { text-decoration: underline; text-decoration-color: #f87171; }
        .cb-divider { font-size: 0.7rem; color: var(--cyan); font-weight: 800; text-align: center; padding: 4px 0; }
        .cb-feedback { display: flex; gap: 8px; flex-wrap: wrap; }
        .cb-tag { font-size: 0.68rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
        .cb-tag.fix { background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.3); color: #4ade80; }

        .section-header { margin-bottom: 60px; }
        .section-header h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 16px; }
        .methodology-box { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 40px; position: relative; }
        .m-step { flex: 1; padding: 30px; border-radius: 24px; background: #fafafa; border: 1px solid var(--border); text-align: left; transition: 0.4s; }
        .m-step.active { background: #ffffff; border-color: var(--cyan); box-shadow: 0 20px 40px rgba(14, 165, 233, 0.08); transform: scale(1.05); z-index: 2; }
        .m-number { font-size: 0.8rem; font-weight: 900; color: var(--text-muted); margin-bottom: 16px; background: #e2e8f0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
        .m-number.highlight { background: var(--cyan); color: #fff; box-shadow: 0 0 15px rgba(14, 165, 233, 0.4); }
        .m-step h3 { font-size: 1.2rem; font-weight: 800; margin-bottom: 12px; }
        .m-step p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; }

        /* Neural Flow Animation */
        .neural-flow { display: flex; gap: 8px; justify-content: center; flex: 0.2; }
        .flow-dot { width: 8px; height: 8px; background: var(--cyan); border-radius: 50%; opacity: 0.2; animation: flow 1.5s infinite; }
        .flow-dot:nth-child(2) { animation-delay: 0.2s; }
        .flow-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes flow {
          0% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.5); opacity: 1; box-shadow: 0 0 10px var(--cyan); }
          100% { transform: scale(1); opacity: 0.2; }
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.2; }
          100% { transform: scale(1.1); opacity: 0.4; }
        }

        @media (max-width: 1024px) {
          .nav-links, .nav-actions { display: none; }
          .landing-nav { padding: 15px 20px; }
          .hero-title { font-size: 3.2rem; }
          .onboarding-section { padding: 60px 20px; }
          .onboarding-grid { grid-template-columns: 1fr; }
          .cc-layout, .coach-layout, .codebot-layout { flex-direction: column; text-align: center; gap: 40px; }
          .cc-feature-list::before { display: none; }
          .cc-feature { flex-direction: column; align-items: center; text-align: center; }
          .bento-grid { grid-template-columns: 1fr; }
          .b-wide, .b-square, .b-rect, .b-dark { grid-column: 1; grid-row: auto; }
          .landing-footer { flex-direction: column; gap: 20px; text-align: center; }
          .methodology-box { flex-direction: column; padding: 20px; }
          .neural-flow { transform: rotate(90deg); margin: 20px 0; }
          .pricing-grid { grid-template-columns: 1fr; }
          .methodology-section, .codebot-section, .pricing-section, .command-center-section { padding: 60px 20px; }
          
          /* Bento Roadmap Fix */
          .b-wide { flex-direction: column; align-items: center; gap: 20px; }
          .viz-roadmap { width: 100%; justify-content: center; background: rgba(14,165,233,0.05); }
          .progress-track, .progress-points { max-width: 100%; }
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 2.5rem; }
          .hero-subtitle { font-size: 1rem; padding: 0 10px; }
          .hero-cta, .cta-buttons { flex-direction: column; align-items: center; gap: 16px; }
          .hero-cta .btn, .cta-buttons .btn { width: 100%; max-width: 320px; }
          .cta-box { padding: 40px 20px; border-radius: 20px; }
          .cta-box h2 { font-size: 1.8rem; }
          .watermark { display: none; }
          .onboarding-header { flex-direction: column; align-items: center; text-align: center; }
          .section-header h2, .cc-left h2, .coach-content h2, .pricing-header h2, .codebot-content h2 { font-size: 1.8rem; }
          .hero-graphic-inner { height: 300px; }
          .c-1, .c-2, .c-3 { transform: scale(0.8); }
          .c-1 { left: 10px; top: 10px; }
          .c-3 { right: 10px; top: 10px; }
          
          /* Code Bot Fix */
          .cb-code-block { font-size: 0.65rem; }
          .cb-tag { font-size: 0.6rem; }
          
          /* Coach Fix */
          .mock-split { flex-direction: column; }
          .m-stat strong { font-size: 0.75rem; }
        }
      `}} />
    </div>
  )
}
