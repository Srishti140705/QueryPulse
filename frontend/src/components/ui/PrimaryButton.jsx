import React from 'react'

export default function PrimaryButton({ children, onClick, className = '', disabled = false, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={
        `inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--accent)] text-[var(--accent-text)] shadow-lg shadow-[0_25px_60px_rgba(0,0,0,0.12)] hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`
      }
    >
      {children}
    </button>
  )
}
