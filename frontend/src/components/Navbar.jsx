import React, { Fragment } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Transition } from '@headlessui/react'
import { useAuth } from '../auth/AuthProvider'
import { useTheme } from '../theme/ThemeProvider'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Documentation', to: '/documentation' },
  { label: 'About', to: '/about' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="bg-[var(--panel)] text-[var(--text)] shadow-[0_1px_0_0_rgba(148,163,184,0.08)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[var(--accent-text)] shadow-xl shadow-[0_25px_60px_rgba(0,0,0,0.15)]">
            QP
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">QueryPulse</p>
            <p className="text-xs text-[var(--muted)]">SQL developer dashboard</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} active={location.pathname === item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition hover:border-cyan-400"
          >
            {theme === 'dark' ? '☾' : '☀'}
          </button>

          {!isAuthenticated ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/login"
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text)] transition hover:border-[var(--accent)]"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-2xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-[var(--accent-text)] transition hover:opacity-95"
              >
                Register
              </Link>
            </div>
          ) : (
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface)] ring-1 ring-[var(--border)] hover:ring-cyan-400">
                <span className="text-sm font-semibold text-[var(--text)]">
                  {user?.name?.split(' ').map((part) => part[0]).join('')}
                </span>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-20 mt-3 w-56 origin-top-right rounded-3xl border border-[var(--border)] bg-[var(--panel)]/95 p-2 shadow-2xl backdrop-blur-xl focus:outline-none">
                  <div className="space-y-1">
                    <MenuItem to="/profile">My Profile</MenuItem>
                    <MenuItem to="/history">Query History</MenuItem>
                    <MenuItem to="/settings">Settings</MenuItem>
                    <div className="border-t border-[var(--border)] my-2" />
                    <MenuItem
                      onClick={() => {
                        logout()
                        navigate('/login')
                      }}
                      destructive
                    >
                      Logout
                    </MenuItem>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          )}
        </div>
      </div>
    </header>
  )
}

function NavLink({ to, children, active }) {
  return (
    <Link
      to={to}
      className={`rounded-2xl px-4 py-2 text-sm transition ${
        active
          ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-sm shadow-[0_8px_30px_rgba(0,0,0,0.12)]'
          : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
      }`}
    >
      {children}
    </Link>
  )
}

function MenuItem({ to, onClick, children, destructive }) {
  const base = 'flex w-full items-center rounded-2xl px-4 py-3 text-sm font-medium transition'
  const activeClass = destructive
    ? 'text-rose-300 hover:bg-rose-500/10'
    : 'text-[var(--text)] hover:bg-[var(--surface)]'

  if (to) {
    return (
      <Menu.Item>
        {({ active }) => (
          <Link className={`${base} ${active ? 'bg-[var(--surface)]' : ''} ${activeClass}`} to={to}>
            {children}
          </Link>
        )}
      </Menu.Item>
    )
  }

  return (
    <Menu.Item>
      {({ active }) => (
        <button
          type="button"
          onClick={onClick}
          className={`${base} ${active ? 'bg-[var(--surface)]' : ''} ${activeClass} text-left w-full`}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  )
}
