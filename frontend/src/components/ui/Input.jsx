import React from 'react'

export default function Input({ label, value, onChange, placeholder = '', type = 'text', className = '' }) {
  return (
    <label className="flex flex-col text-sm">
      {label && <span className="text-[var(--muted)] text-xs mb-1">{label}</span>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`px-3 py-2 rounded bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${className}`}
      />
    </label>
  )
}
