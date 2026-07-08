import React from 'react'

export default function History() {
  return (
    <div className="mx-auto max-w-6xl">
      <section className="ide-card ide-fade-in p-6 sm:p-8">
        <p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">History</p>
        <h1 className="font-heading mt-3 text-3xl font-semibold text-[var(--text)]">Query history</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Your recent queries will appear here. This placeholder is styled to match the live history panel in the editor.</p>

        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/60 p-8 text-center text-sm text-[var(--muted)]">
          No history available in this prototype.
        </div>
      </section>
    </div>
  )
}
