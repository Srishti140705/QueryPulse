import React, { useState } from 'react'

export default function QueryEditor() {
  const [sql, setSql] = useState('SELECT id, name, email FROM users WHERE active = 1 ORDER BY last_login DESC;')
  const [message, setMessage] = useState(null)

  function handleRun() {
    setMessage({ type: 'info', text: 'Run query is disabled for this demo.' })
    window.setTimeout(() => setMessage(null), 3000)
  }

  function handleFormat() {
    setMessage({ type: 'success', text: 'Formatted query successfully.' })
    window.setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="max-w-7xl mx-auto grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-glow">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Query editor</p>
              <h1 className="mt-3 text-3xl font-semibold">Write and preview SQL with confidence</h1>
              <p className="mt-2 max-w-2xl text-[var(--muted)]">Compose SQL, run analysis, and inspect results in a polished, developer-friendly interface.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={handleFormat} className="rounded-3xl bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--panel)]">Format</button>
              <button onClick={handleRun} className="rounded-3xl btn-accent px-4 py-2 text-sm font-semibold">Run query</button>
              <button onClick={() => setSql('')} className="rounded-3xl bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--panel)]">Clear</button>
            </div>
          </div>

          <textarea
            value={sql}
            onChange={(event) => setSql(event.target.value)}
            placeholder="Write your SQL here..."
            rows={14}
            className="mt-6 w-full rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 font-mono text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-3xl bg-[var(--surface)]/75 p-4 text-sm text-[var(--muted)]">SQL dialect: MySQL • Safety mode: enabled • Timeout: 30s</div>
            {message && (
              <div className={`rounded-3xl px-4 py-3 text-sm ${message.type === 'success' ? 'bg-[var(--success)]/15 text-[var(--success)]' : 'bg-[var(--surface)] text-[var(--text)]'}`}>
                {message.text}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <PanelCard title="Execution plan" description="A preview of the query plan, warnings, and optimization suggestions." />
          <PanelCard title="Static analysis" description="Score, unused columns, missing indexes, and style recommendations." />
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-glow">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Results preview</p>
          <div className="mt-6 rounded-[1.5rem] bg-[var(--surface)]/85 p-5">
            <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr] gap-4 text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
              <span>Column</span>
              <span>Type</span>
              <span>Status</span>
            </div>
            <div className="mt-4 space-y-3 text-sm text-[var(--text)]">
              <ResultRow column="id" type="INT" status="good" />
              <ResultRow column="name" type="VARCHAR" status="good" />
              <ResultRow column="email" type="VARCHAR" status="review" />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-glow">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">Quick reference</p>
          <div className="mt-5 grid gap-3 text-sm text-[var(--text)]">
            <ReferenceItem label="Run query" value="Ctrl + Enter" />
            <ReferenceItem label="Format SQL" value="Ctrl + Shift + F" />
            <ReferenceItem label="Toggle sidebar" value="Ctrl + B" />
          </div>
        </section>
      </aside>
    </div>
  )
}

function PanelCard({ title, description }) {
  return (
    <div className="rounded-[1.8rem] border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
      <p className="mt-3 text-[var(--muted)] text-sm leading-6">{description}</p>
      <div className="mt-5 rounded-3xl bg-[var(--surface)]/90 p-4 text-sm text-[var(--muted)]">No connected database. Connect your data source to see live results.</div>
    </div>
  )
}

function ResultRow({ column, type, status }) {
  return (
    <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr] gap-4 rounded-3xl bg-[var(--surface)]/85 px-4 py-3">
      <span>{column}</span>
      <span>{type}</span>
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status === 'good' ? 'bg-[var(--success)]/15 text-[var(--success)]' : 'bg-[#F6B37A]/15 text-[#D98C95]'}`}>
        {status}
      </span>
    </div>
  )
}

function ReferenceItem({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-[var(--border)] bg-[var(--surface)]/90 px-4 py-3">
      <span>{label}</span>
      <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">{value}</span>
    </div>
  )
}
