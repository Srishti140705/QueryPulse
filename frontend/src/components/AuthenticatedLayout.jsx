import React, { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useTheme } from '../theme/ThemeProvider'

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Query Editor', to: '/editor' },
  { label: 'History', to: '/history' },
  { label: 'Profile', to: '/profile' },
  { label: 'Settings', to: '/settings' },
]

export default function AuthenticatedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean)
    return [
      { label: 'Home', to: '/dashboard' },
      ...segments.map((segment, index) => ({
        label: segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
        to: '/' + segments.slice(0, index + 1).join('/'),
      })),
    ]
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="lg:flex lg:min-h-screen">
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-[var(--border)] bg-[var(--panel)] p-6 transition duration-300 ease-out lg:relative lg:translate-x-0 lg:block ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between lg:block">
            <Link to="/dashboard" className="flex items-center gap-3 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-sky-500 font-bold text-slate-950">QP</div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent-soft)]">QueryPulse</p>
                <p className="text-sm text-[var(--muted)]">Developer suite</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--panel)] lg:hidden"
            >
              ✕
            </button>
          </div>

          <div className="mt-8 space-y-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-3xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-sm shadow-[0_8px_30px_rgba(0,0,0,0.12)]' : 'text-[var(--muted)] hover:bg-[var(--surface)]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Account</p>
            <p className="mt-3 text-base font-semibold text-[var(--text)]">{user?.name}</p>
            <p className="text-sm text-[var(--muted)]">{user?.email}</p>
          </div>
        </aside>

        <div className="flex-1 lg:pl-72">
          <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-cyan-400 lg:hidden"
                >
                  ☰
                </button>
                <div>
                  <p className="text-sm text-[var(--muted)]">Welcome back,</p>
                  <p className="text-lg font-semibold text-[var(--text)]">{user?.name}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] hover:border-cyan-400"
                >
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
                <button className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--text)] hover:border-cyan-400">
                  🔔 Notifications
                </button>
                <div className="inline-flex items-center gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-[var(--accent-text)]" style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)' }}>{user?.name?.split(' ').map((part) => part[0]).join('')}</div>
                  <div className="hidden flex-col text-right sm:flex">
                    <span className="text-sm font-medium text-[var(--text)]">{user?.name}</span>
                    <span className="text-xs text-[var(--muted)]">{user?.role}</span>
                  </div>
                </div>
              </div>
            </div>

            <nav className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
              {breadcrumbs.map((item, index) => (
                <span key={item.to} className="inline-flex items-center gap-2">
                  {index > 0 && <span className="text-[var(--border)]">/</span>}
                  <Link to={item.to} className="hover:text-cyan-300">
                    {item.label}
                  </Link>
                </span>
              ))}
            </nav>
          </div>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-[var(--surface)]/70 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
