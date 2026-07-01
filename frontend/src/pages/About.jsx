import React from 'react'

export default function About() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-6 rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] shadow-glow">
        <h2 className="text-2xl font-semibold text-[var(--text)]">About QueryPulse</h2>
        <p className="text-[var(--muted)] mt-4">
          QueryPulse is a lightweight SQL developer dashboard focused on making it easier
          to write, analyze, and optimize SQL queries. This UI is a prototype built with
          React, Vite, and Tailwind CSS.
        </p>

        <section className="mt-6">
          <h3 className="font-semibold text-[var(--text)]">Design</h3>
          <p className="text-[var(--muted)] mt-2">A refined light and dark palette with premium accent tones and soft contrast.</p>
        </section>
      </div>
    </div>
  )
}
