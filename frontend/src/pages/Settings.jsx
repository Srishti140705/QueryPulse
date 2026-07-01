import React from 'react'

export default function Settings() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-[2rem] border border-[var(--border)] bg-[var(--panel)]/90 p-8 shadow-glow">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent-soft)]">Settings</p>
              <h1 className="mt-3 text-4xl font-semibold">Workspace preferences</h1>
              <p className="mt-3 max-w-2xl text-[var(--muted)]">Customize your QueryPulse experience with appearance, notifications, account, security, and SQL behavior settings.</p>
            </div>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/80 px-6 py-5 text-sm text-[var(--text)]">
              Dark mode is enabled across the dashboard.
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <main className="space-y-6">
            <Section title="Appearance">
              <div className="grid gap-4 md:grid-cols-2">
                <SettingCard label="Theme" value="Dark" description="A low-light interface optimized for focused SQL work." />
                <SettingCard label="Editor font" value="JetBrains Mono" description="Monospaced font for readable SQL code." />
                <SettingCard label="Layout" value="Compact" description="Optimized for dense dashboards and fast navigation." />
                <SettingCard label="Accent color" value="Cyan" description="Used throughout the interface for actions and highlights." />
              </div>
            </Section>

            <Section title="Notifications">
              <div className="space-y-4">
                <ToggleRow label="Email alerts" value="On" description="Receive important account and query notifications by email." />
                <ToggleRow label="In-app alerts" value="On" description="Show real-time notifications inside the dashboard." />
                <ToggleRow label="Release notes" value="Off" description="Notify me when new QueryPulse updates are available." />
              </div>
            </Section>

            <Section title="Account">
              <div className="space-y-4">
                <SettingCard label="Name" value="Jordan Smith" />
                <SettingCard label="Email" value="jordan.smith@querypulse.dev" />
                <SettingCard label="Role" value="Admin" />
                <SettingCard label="Organization" value="QueryPulse Labs" />
              </div>
            </Section>

            <Section title="Security">
              <div className="space-y-4">
                <ToggleRow label="Two-factor authentication" value="Enabled" description="Protect your account with an extra verification step." />
                <ToggleRow label="Session lock" value="On" description="Require re-authentication after periods of inactivity." />
                <ToggleRow label="Password recovery" value="Email only" description="Use secure channels for account recovery." />
              </div>
            </Section>
          </main>

          <aside className="space-y-6">
            <Section title="Keyboard Shortcuts">
              <div className="grid gap-4">
                <ShortcutItem command="Run query" shortcut="Ctrl + Enter" />
                <ShortcutItem command="Format SQL" shortcut="Ctrl + Shift + F" />
                <ShortcutItem command="Open history" shortcut="Ctrl + H" />
                <ShortcutItem command="Toggle sidebar" shortcut="Ctrl + B" />
              </div>
            </Section>

            <Section title="SQL Preferences">
              <div className="space-y-4">
                <SettingCard label="Auto-format" value="Enabled" description="Format SQL automatically before execution." />
                <SettingCard label="Default dialect" value="MySQL" description="Apply MySQL-compatible parsing and warnings." />
                <SettingCard label="Query timeout" value="30 seconds" description="Limit long-running executions by default." />
                <ToggleRow label="Show line numbers" value="On" description="Display line numbers in the query editor." />
              </div>
            </Section>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)]/90 p-6 shadow-glow">
      <h2 className="text-xl font-semibold text-[var(--text)]">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  )
}

function SettingCard({ label, value, description }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/85 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--muted)]">{label}</p>
          <p className="mt-2 text-base font-semibold text-[var(--text)]">{value}</p>
        </div>
        <span className="rounded-full bg-[var(--panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Set</span>
      </div>
      {description && <p className="mt-3 text-sm text-[var(--muted)]">{description}</p>}
    </div>
  )
}

function ToggleRow({ label, value, description }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/85 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">{label}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
        </div>
        <div className="rounded-full bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--text)]">{value}</div>
      </div>
    </div>
  )
}

function ShortcutItem({ command, shortcut }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/85 p-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-[var(--muted)]">{command}</p>
      </div>
      <div className="rounded-2xl bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-inner">{shortcut}</div>
    </div>
  )
}
