import React from 'react'

export default function Badge({ children, color = 'bg-[var(--panel)]', className = '' }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded ${color} text-[var(--text)] ${className}`}>{children}</span>
  )
}
