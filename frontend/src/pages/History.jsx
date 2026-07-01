import React from 'react'

export default function History() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="p-6 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
        <h2 className="text-xl font-semibold text-[var(--text)]">Query History</h2>
        <p className="text-[var(--muted)] mt-2">Your recent queries will appear here. This is a placeholder for history functionality.</p>

        <div className="mt-4 text-[var(--muted)]">No history available in this prototype.</div>
      </div>
    </div>
  )
}
