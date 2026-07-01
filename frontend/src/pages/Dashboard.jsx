import React from 'react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)]/95 p-8 shadow-glow">
          <div className="grid gap-8 xl:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">Dashboard</p>
                  <h1 className="mt-3 text-4xl font-semibold">Welcome back, Jordan</h1>
                  <p className="mt-3 text-[var(--muted)] max-w-2xl">Your SQL workspace is ready with the latest query history, performance feedback, and saved workflows.</p>
                </div>
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/90 px-5 py-4 text-sm text-[var(--text)]">
                  Active workspace
                  <div className="mt-2 text-2xl font-semibold text-[var(--text)]">analytics_prod</div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Queries" value="128" accent="from-[var(--accent)] to-[var(--accent-strong)]" />
                <MetricCard label="Saved" value="24" accent="from-[var(--accent-soft)] to-[var(--surface)]" />
                <MetricCard label="Alerts" value="3" accent="from-[#F6B37A] to-[#D98C95]" />
                <MetricCard label="Team" value="2 users" accent="from-[var(--accent-strong)] to-[var(--accent)]" />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <InfoCard title="Recent query" value="SELECT name, email FROM users WHERE active = 1" note="Last executed 12 min ago" />
                <InfoCard title="Performance" value="95%" note="Average query success rate" />
                <InfoCard title="Storage" value="18.4 GB" note="Used this month" />
              </div>
            </div>

            <aside className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)]/95 p-6 shadow-xl shadow-[0_25px_80px_rgba(0,0,0,0.12)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">Quick actions</p>
                  <h2 className="mt-3 text-xl font-semibold text-[var(--text)]">Launch workflow</h2>
                </div>
                <div className="rounded-3xl bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text)]">Ready</div>
              </div>

              <div className="mt-8 space-y-4">
                <ActionLink to="/editor" label="Open query editor" />
                <ActionLink to="/history" label="Review history" />
                <ActionLink to="/settings" label="Update workspace" />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, accent }) {
  return (
    <div className={`rounded-3xl border border-[var(--border)] p-6 shadow-sm ${accent ? `bg-gradient-to-br ${accent}` : 'bg-[var(--surface)]/90'}`}>
      <div className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">{label}</div>
      <div className="mt-4 text-4xl font-semibold text-[var(--accent-text)]">{value}</div>
    </div>
  )
}

function InfoCard({ title, value, note }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/95 p-5">
      <div className="text-sm text-[var(--muted)]">{title}</div>
      <div className="mt-3 text-2xl font-semibold text-[var(--text)]">{value}</div>
      <p className="mt-3 text-sm text-[var(--muted)]">{note}</p>
    </div>
  )
}

function ActionLink({ to, label }) {
  return (
    <Link
      to={to}
      className="block rounded-3xl border border-[var(--border)] bg-[var(--surface)]/95 px-5 py-4 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[var(--panel)]"
    >
      {label}
    </Link>
  )
}
