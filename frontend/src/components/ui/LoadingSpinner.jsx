import React from 'react'
export default function LoadingSpinner({ label = 'Loading' }) {
  return <div className="flex items-center gap-3 text-sm text-[var(--muted)]" role="status"><span className="h-3 w-3 animate-pulse rounded-full bg-violet-500 shadow-[0_0_0_6px_rgba(118,85,237,.12)]" /><span>{label}</span></div>
}
