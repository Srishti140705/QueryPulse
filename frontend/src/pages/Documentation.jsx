import React from 'react'

export default function Documentation() {
  return (
    <div className="mx-auto max-w-6xl">
      <section className="ide-card ide-fade-in p-6 sm:p-8">
        <p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Documentation</p>
        <h1 className="font-heading mt-3 text-3xl font-semibold text-[var(--text)]">Developer notes</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Documentation for QueryPulse will be available here. This placeholder lists basic integration and usage notes.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {['Connect to MySQL using backend environment variables.', 'Use the Query Editor to compose and analyze SQL.', 'View analysis results and recommendations in the analysis panel.'].map((item) => (
            <div key={item} className="ide-surface min-h-32 p-5 text-sm leading-6 text-[var(--text)]">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
