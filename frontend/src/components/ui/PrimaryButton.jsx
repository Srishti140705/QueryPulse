import React from 'react'

export default function PrimaryButton({ children, onClick, className = '', disabled = false, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={
        `ide-button-primary ${className}`
      }
    >
      {children}
    </button>
  )
}
