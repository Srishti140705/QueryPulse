import React from 'react'
import { File } from 'lucide-react'

export default function EmptyState({ title = 'No data', description = '', action }) {
  return (
    <div className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-sm">
      <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-[var(--panel)] mb-4">
        <File size={32} className="text-[var(--muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
      {description && <p className="text-[var(--muted)] mt-2">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
