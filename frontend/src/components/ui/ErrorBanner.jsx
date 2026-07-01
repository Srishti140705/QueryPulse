import React from 'react'
import { XCircle } from 'lucide-react'

export default function ErrorBanner({ message, onClose }) {
  return (
    <div className="w-full bg-red-600 text-white rounded-md p-3 flex items-start gap-3">
      <div className="mt-0.5"><XCircle size={20} /></div>
      <div className="flex-1 text-sm">{message}</div>
      {onClose && (
        <button onClick={onClose} className="text-white/80 hover:text-white">Close</button>
      )}
    </div>
  )
}
