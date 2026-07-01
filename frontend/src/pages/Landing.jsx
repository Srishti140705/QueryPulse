import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function Landing() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5 sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[var(--accent-text)] shadow-lg shadow-[0_25px_60px_rgba(0,0,0,0.15)]">
              QP
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">QueryPulse</p>
              <p className="text-xs text-[var(--muted)]">SQL developer dashboard</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/" className="text-sm font-medium text-[var(--text)] transition hover:text-[var(--accent-strong)]">Home</Link>
            <Link to="/about" className="text-sm font-medium text-[var(--text)] transition hover:text-[var(--accent-strong)]">About</Link>
            <Link to="/documentation" className="text-sm font-medium text-[var(--text)] transition hover:text-[var(--accent-strong)]">Docs</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="inline-flex items-center justify-center rounded-full btn-accent px-5 py-2.5 text-sm font-semibold transition hover:opacity-95"
            >
              {isAuthenticated ? 'Open dashboard' : 'Start free trial'}
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="hidden rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] md:inline-flex"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <section className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex rounded-full bg-[var(--accent-soft)]/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent)]">
              Built for teams
            </div>
            <div className="space-y-6">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-[var(--text)] sm:text-6xl">
                A premium SQL workspace for developers who ship analytics faster.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted)]">
                QueryPulse brings query editing, analysis, and execution into one polished experience — designed for performance-focused teams and data-driven workflows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="inline-flex items-center justify-center rounded-full btn-accent px-7 py-3 text-sm font-semibold transition hover:opacity-95"
              >
                {isAuthenticated ? 'Continue to workspace' : 'Start a free trial'}
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/90 px-7 py-3 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[var(--panel)]"
              >
                Learn more
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FeatureStat label="Auto-save" value="Real-time" />
              <FeatureStat label="Query history" value="Instant access" />
              <FeatureStat label="Security" value="SSO-ready" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-xl shadow-[0_35px_90px_rgba(0,0,0,0.12)]">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-[var(--accent)]/20 via-[var(--panel)] to-[var(--accent-strong)]/20 blur-3xl" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between rounded-3xl bg-[var(--surface)] px-5 py-4 text-[var(--text)] shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[var(--accent)]/90">Live workspace</p>
                  <p className="mt-2 text-lg font-semibold">Query editor + results</p>
                </div>
                <span className="rounded-2xl bg-[var(--panel)] px-3 py-1 text-xs text-[var(--muted)]">Dark mode</span>
              </div>

              <div className="rounded-[1.8rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-inner">
                <div className="mb-4 flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
                  <span>Query Editor</span>
                  <span>SQL</span>
                </div>
                <pre className="max-h-56 overflow-hidden rounded-3xl bg-[var(--panel)] p-4 text-sm leading-6 text-[var(--text)] shadow-inner">
SELECT id,
       name,
       email
FROM users
WHERE active = 1
ORDER BY last_login DESC
LIMIT 50;
                </pre>
                <div className="mt-4 flex items-center justify-between rounded-3xl border border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 text-sm text-[var(--muted)]">
                  <span>Analysis score</span>
                  <span className="font-semibold text-[var(--text)]">91%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-24 space-y-8">
          <div className="space-y-4 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-[var(--accent)]">Core features</p>
            <h2 className="text-3xl font-semibold text-[var(--text)]">Everything you need for reliable SQL workflows.</h2>
            <p className="mx-auto max-w-2xl text-[var(--muted)]">From query composition to execution insights, QueryPulse gives developers better visibility into performance, data accuracy, and team collaboration.</p>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <FeatureHighlight title="Smart analysis" description="Get warnings, recommendations, and scorecards while you write SQL." />
            <FeatureHighlight title="Rich editor" description="Monaco-based editor with formatting, shortcuts, and live feedback." />
            <FeatureHighlight title="Safe execution" description="Run queries with workload protection and result previews." />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
            <h3 className="text-xl font-semibold text-[var(--text)]">Designed for SQL teams</h3>
            <p className="mt-4 text-[var(--muted)]">Track query history, review analysis results, and manage shared access in one unified dashboard.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Badge label="Shared history" />
              <Badge label="Query snapshots" />
              <Badge label="Security controls" />
              <Badge label="Cross-team access" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-xl shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
            <h3 className="text-xl font-semibold text-[var(--text)]">Preview your workflow</h3>
            <div className="mt-6 space-y-4">
              <PreviewCard label="Query history" value="24 saved" />
              <PreviewCard label="Recent runs" value="6 in the last hour" />
              <PreviewCard label="Warnings fixed" value="12 suggestions" />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function FeatureStat({ label, value }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm text-[var(--text)] shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-xl font-semibold">{value}</p>
    </div>
  )
}

function FeatureHighlight({ title, description }) {
  return (
    <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>
    </div>
  )
}

function Badge({ label }) {
  return <div className="rounded-3xl bg-[var(--panel)] px-4 py-3 text-sm font-semibold text-[var(--text)]">{label}</div>
}

function PreviewCard({ label, value }) {
  return (
    <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text)] shadow-xl shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
      <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  )
}
