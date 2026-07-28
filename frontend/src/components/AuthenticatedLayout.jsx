import React, { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

const links = [
  { label: 'Workspace', icon: '🏠', to: '/editor' },
  { label: 'History', icon: '🕘', to: '/history' },
  { label: 'Profile', icon: '🧑🏻‍🎤', to: '/profile' },
  { label: 'Connections', icon: '🔌', to: '/connections' },
]

export default function AuthenticatedLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isHistory = location.pathname === '/history'
  const initials = user?.name?.slice(0, 1).toUpperCase() || 'S'

  return <div className="quest-shell min-h-screen bg-[var(--bg)] text-[var(--text)]" style={{ paddingLeft: '320px' }}>
    <aside style={{ width: '320px', transform: 'translateX(0)' }} className="quest-sidebar fixed inset-y-0 left-0 z-40 flex flex-col">
      <div className="sidebar-brand-wrap">
        <Link to="/editor" className="sidebar-brand"><span className="sidebar-logo">ϟ</span><span><b>QueryPulse</b><small>SQL WORKSPACE</small></span></Link>
        <span className="sidebar-cloud cloud-one" aria-hidden="true">☁</span><span className="sidebar-cloud cloud-two" aria-hidden="true">☁</span>
      </div>
      <nav className="sidebar-nav">{links.map((link) => <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}><span className="sidebar-nav-icon" aria-hidden="true">{link.icon}</span><span>{link.label}</span><b aria-hidden="true">›</b></NavLink>)}</nav>
    </aside>
    {open && <button aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/20 lg:hidden" />}
    {!isHistory && <section className="quest-banner">
      <div className="quest-welcome"><span className="quest-avatar">S</span><div><small>Welcome back,</small><strong>{user?.name}!</strong></div></div>
      <div className="quest-tip">Every query you run brings you closer to SQL mastery!</div>
      <div className="quest-robot" aria-hidden="true">QP</div>
      <div className="quest-controls"><button aria-label="Notifications">Bell <b>3</b></button><button><span className="status-dot" />MySQL Local<small>Connected</small></button><button className="quest-profile">{initials}</button></div>
    </section>}
    {!isHistory && <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#dde5fc] bg-white/90 px-5 py-3 backdrop-blur"><button className="lg:hidden" onClick={() => setOpen(true)}>☰</button><span>Welcome back, {user?.name}</span><button onClick={() => { logout(); navigate('/login') }} className="rounded border px-3 py-1 text-sm">Logout</button></header>}
    <main className={isHistory ? '' : 'p-5'}><Outlet /></main>
  </div>
}
