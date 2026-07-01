import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[var(--surface)] rounded-lg shadow">
          <h2 className="text-lg font-semibold text-[var(--text)]">Run Ad-hoc Queries</h2>
          <p className="text-[var(--muted)] mt-2">Execute SQL and explore results with a minimalist editor and results panel.</p>
        </div>

        <div className="p-6 bg-[var(--surface)] rounded-lg shadow">
          <h2 className="text-lg font-semibold text-[var(--text)]">Analyze</h2>
          <p className="text-[var(--muted)] mt-2">Static analysis and recommendations for query performance and complexity.</p>
        </div>

        <div className="p-6 bg-[var(--surface)] rounded-lg shadow">
          <h2 className="text-lg font-semibold text-[var(--text)]">Integrations</h2>
          <p className="text-[var(--muted)] mt-2">Connect to MySQL to run queries and persist results (coming soon).</p>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[var(--text)]">Quick Actions</h3>
          <Link to="/query" className="px-4 py-2 rounded bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-strong)]">Open Query Editor</Link>
        </div>

        <div className="mt-4 p-6 bg-[var(--surface)] rounded-lg shadow">
          <p className="text-[var(--muted)]">Welcome to QueryPulse — craft SQL, get analysis, and optimize your queries.</p>
        </div>
      </section>
    </div>
  )
}
