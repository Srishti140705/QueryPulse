import React from 'react'

export default function Card({ title, children, className = '' }) {
  return (
    <div className={`ide-surface h-full p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/60 ${className}`}>
      {title && <h3 className="font-heading mb-3 text-sm font-semibold text-[var(--text)]">{title}</h3>}
      <div className="text-sm text-[var(--muted)]">{children}</div>
    </div>
  )
}
