import React from 'react'

export default function Card({ title, children, className = '' }) {
  return (
    <div className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm ${className}`}>
      {title && <h3 className="text-sm font-semibold mb-2 text-[var(--text)]">{title}</h3>}
      <div className="text-sm text-[var(--muted)]">{children}</div>
    </div>
  )
}
