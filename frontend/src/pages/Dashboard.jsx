import React from 'react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <section className="ide-card ide-fade-in p-6 sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_360px]">
          <div className="space-y-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Dashboard</p>
                <h1 className="font-heading mt-3 text-4xl font-semibold tracking-normal text-[var(--text)]">Developer SQL command center</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Monitor query activity, saved workflows, and execution health from a dense workspace built for daily database work.</p>
              </div>
              <div className="ide-surface min-w-56 px-5 py-4">
                <p className="font-code text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Active workspace</p>
                <div className="font-code mt-3 truncate text-xl font-semibold text-[var(--text)]">analytics_prod</div>
              </div>
            </div>

            <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Queries" value="128" />
              <MetricCard label="Saved" value="24" />
              <MetricCard label="Alerts" value="3" />
              <MetricCard label="Team" value="2 users" />
            </div>

            <div className="grid items-stretch gap-4 lg:grid-cols-3">
              <InfoCard title="Recent query" value="SELECT name, email FROM users WHERE active = 1" note="Last executed 12 min ago" />
              <InfoCard title="Performance" value="95%" note="Average query success rate" />
              <InfoCard title="Storage" value="18.4 GB" note="Used this month" />
            </div>
          </div>

          <aside className="ide-surface flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-code text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Quick actions</p>
                <h2 className="font-heading mt-3 text-xl font-semibold text-[var(--text)]">Launch workflow</h2>
              </div>
              <span className="rounded-lg bg-emerald-400/10 px-3 py-1 font-code text-xs text-emerald-200">Ready</span>
            </div>

            <div className="mt-8 grid flex-1 content-start gap-3">
              <ActionLink to="/editor" label="Open query editor" />
              <ActionLink to="/history" label="Review history" />
              <ActionLink to="/settings" label="Update workspace" />
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="ide-surface flex min-h-32 flex-col justify-between p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/60">
      <div className="font-code text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</div>
      <div className="font-code mt-5 text-3xl font-semibold text-[var(--text)]">{value}</div>
    </div>
  )
}

function InfoCard({ title, value, note }) {
  return (
    <div className="ide-surface flex min-h-40 flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/60">
      <div className="text-sm text-[var(--muted)]">{title}</div>
      <div className="font-code mt-3 line-clamp-2 text-xl font-semibold text-[var(--text)]">{value}</div>
      <p className="mt-auto pt-4 text-sm text-[var(--muted)]">{note}</p>
    </div>
  )
}

function ActionLink({ to, label }) {
  return (
    <Link to={to} className="ide-button justify-between">
      {label}
      <span className="font-code text-[var(--muted)]">enter</span>
    </Link>
  )
}
