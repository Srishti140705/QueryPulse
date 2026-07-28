import React from 'react'
import { Link } from 'react-router-dom'

export default function AuthShell({ mode, children }) {
  const login = mode === 'login'
  return <main className="auth-scene">
    <div className="auth-grid" />
    <header className="auth-header">
      <Link to="/" className="auth-brand"><b>QP</b><span><strong>QueryPulse</strong><small>SQL developer IDE</small></span></Link>
      <nav><Link to="/about">About</Link></nav>
      <div className="auth-header-actions"><Link to="/login">Login</Link><Link to="/register">Register <i>+</i></Link></div>
    </header>
    <div className="auth-sql left"><pre><em>SELECT</em> *{`\n`}<span>FROM</span> users{`\n`}<em>WHERE</em> status = <b>'active'</b>{`\n`}<span>ORDER BY</span> created_at{`\n`}<strong>LIMIT</strong> 50;</pre></div>
    <div className="auth-sql right"><pre><b>EXPLAIN</b>{`\n`}<em>SELECT</em> *{`\n`}<span>FROM</span> orders{`\n`}<em>WHERE</em> amount &gt; <strong>100</strong></pre></div>
    <div className="auth-chip sql">SQL</div><div className="auth-chip code">&lt;/&gt;</div>
    <div className="auth-db" /><div className="auth-server one"><i/><i/><i/></div><div className="auth-server two"><i/><i/><i/></div><div className="auth-chart"><i/><i/><i/><i/></div>
    <section className="auth-card-wrap"><div className="auth-card"><div className="auth-card-mark">QP</div><h1>{login ? 'Welcome back' : 'Create account'}</h1><p>{login ? 'Continue optimizing SQL with QueryPulse.' : 'Start optimizing SQL with QueryPulse in seconds.'}</p>{children}</div></section>
  </main>
}
