import React from 'react'

export default function Documentation() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="p-6 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
        <h2 className="text-xl font-semibold text-[var(--text)]">Documentation</h2>
        <p className="text-[var(--muted)] mt-2">Documentation for QueryPulse will be available here. This placeholder lists basic integration and usage notes.</p>

        <div className="mt-4 text-[var(--muted)]">
          <h3 className="font-medium">Getting Started</h3>
          <ul className="list-disc list-inside mt-2 text-sm text-[var(--text)]">
            <li>Connect to MySQL using the backend environment variables.</li>
            <li>Use the Query Editor to compose and analyze SQL.</li>
            <li>View analysis results and recommendations in the Analysis panel.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
