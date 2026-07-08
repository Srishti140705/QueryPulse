import React, { useState } from 'react'

const tabs = [
  { id: 'Profile', label: 'Profile' },
  { id: 'Preferences', label: 'Preferences' },
  { id: 'API Keys', label: 'API Keys' },
  { id: 'Security', label: 'Security' },
]

export default function Profile() {
  const [activeTab, setActiveTab] = useState('Profile')

  return (
    <div className="bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-7xl">
        <div className="ide-card mb-6 p-6 sm:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">User profile</p>
              <h1 className="font-heading mt-3 text-4xl font-semibold">Account dashboard</h1>
              <p className="mt-3 max-w-2xl text-[var(--muted)]">Manage your account details, preferences, API access, and security settings all in one polished place.</p>
            </div>
            <div className="ide-surface px-6 py-5 text-sm text-[var(--text)]">
              Joined
              <div className="mt-2 text-2xl font-semibold text-[var(--text)]">April 12, 2025</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <section className="ide-card space-y-6 p-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] p-1 shadow-inner">
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-[var(--surface)] font-heading text-3xl font-semibold text-[var(--text)]">JS</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-[var(--text)]">Jordan Smith</div>
                <div className="text-sm text-[var(--muted)]">Senior SQL Developer</div>
              </div>
            </div>

            <div className="ide-surface space-y-3 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">About</div>
              <p className="text-sm text-[var(--text)]">I help engineering teams tune queries, improve database reliability, and ship analytics faster with robust SQL tooling.</p>
            </div>

            <div className="space-y-4">
              <DetailRow label="Email" value="jordan.smith@querypulse.dev" />
              <DetailRow label="Role" value="Admin" />
              <DetailRow label="Location" value="Austin, TX" />
            </div>
          </section>

          <section className="ide-card p-6">
            <div className="mb-6 flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-lg shadow-violet-950/30' : 'bg-[var(--surface)]/90 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {activeTab === 'Profile' && <ProfilePanel />}
              {activeTab === 'Preferences' && <PreferencesPanel />}
              {activeTab === 'API Keys' && <ApiKeysPanel />}
              {activeTab === 'Security' && <SecurityPanel />}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="ide-surface flex items-center justify-between px-4 py-3">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text)]">{value}</span>
    </div>
  )
}

function ProfilePanel() {
  return (
    <div className="space-y-6">
      <div className="ide-surface p-5">
        <div className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Bio</div>
        <p className="mt-3 text-[var(--text)] leading-relaxed">Jordan is responsible for building and maintaining core SQL workflows for QueryPulse. They specialize in query optimization, schema review, and delivering actionable analytics to engineering teams.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DetailCard title="Name" value="Jordan Smith" />
        <DetailCard title="Email" value="jordan.smith@querypulse.dev" />
        <DetailCard title="Role" value="Admin" />
        <DetailCard title="Joined" value="April 12, 2025" />
      </div>
    </div>
  )
}

function PreferencesPanel() {
  return (
    <div className="space-y-6">
      <div className="ide-surface p-5">
        <div className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Interface preferences</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatusBadge label="Theme" value="Dark mode" />
          <StatusBadge label="Editor font" value="JetBrains Mono" />
          <StatusBadge label="Notifications" value="Email alerts enabled" />
          <StatusBadge label="Query history" value="Saved automatically" />
        </div>
      </div>

      <div className="ide-surface p-5">
        <div className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Workspace</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatusBadge label="Default database" value="analytics_prod" />
          <StatusBadge label="Auto-save" value="On" />
          <StatusBadge label="Time zone" value="UTC" />
          <StatusBadge label="Language" value="English" />
        </div>
      </div>
    </div>
  )
}

function ApiKeysPanel() {
  return (
    <div className="space-y-6">
      <div className="ide-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Active API keys</div>
            <p className="mt-2 text-[var(--text)] text-sm">Create and manage keys for integrations and CLI access.</p>
          </div>
          <button className="ide-button-primary">Create key</button>
        </div>

        <div className="mt-5 space-y-4">
          <ApiKeyItem name="QueryPulse CLI" created="May 10, 2026" status="Active" />
          <ApiKeyItem name="Analytics service" created="June 1, 2026" status="Revoked" />
        </div>
      </div>
    </div>
  )
}

function SecurityPanel() {
  return (
    <div className="space-y-6">
      <div className="ide-surface p-5">
        <div className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Account security</div>
        <div className="mt-4 space-y-4">
          <StatusBadge label="Two-factor authentication" value="Enabled" />
          <StatusBadge label="Password strength" value="Strong" />
          <StatusBadge label="Recent activity" value="No suspicious logins" />
        </div>
      </div>

      <div className="ide-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Security actions</div>
            <p className="mt-2 text-[var(--text)] text-sm">Review and update your account protections.</p>
          </div>
          <button className="ide-button">Manage settings</button>
        </div>
      </div>
    </div>
  )
}

function DetailCard({ title, value }) {
  return (
    <div className="ide-surface min-h-28 p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">{title}</div>
      <div className="mt-3 text-base font-semibold text-[var(--text)]">{value}</div>
    </div>
  )
}

function StatusBadge({ label, value }) {
  return (
    <div className="ide-surface px-4 py-4">
      <div className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-sm font-medium text-[var(--text)]">{value}</div>
    </div>
  )
}

function ApiKeyItem({ name, created, status }) {
  const statusClass = status === 'Active'
    ? 'bg-[var(--accent-soft)] text-[var(--text)]'
    : 'bg-[var(--panel)] text-[var(--muted)]'

  return (
    <div className="ide-surface flex items-center justify-between gap-4 p-4">
      <div>
        <div className="font-semibold text-[var(--text)]">{name}</div>
        <div className="text-sm text-[var(--muted)]">Created {created}</div>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>{status}</span>
    </div>
  )
}
