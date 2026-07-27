import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getCurrentUser, updateCurrentUser } from '../services/authService'
import { useAuth } from '../auth/AuthProvider'
import PrimaryButton from '../components/ui/PrimaryButton'

export default function Profile() {
  const { user, login } = useAuth()
  const [profile, setProfile] = useState(user)
  const [message, setMessage] = useState(null)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    getCurrentUser().then(({ data }) => setProfile(data)).catch(() => setMessage({ type: 'error', text: 'Unable to load your profile.' }))
  }, [])

  async function onSubmit(data) {
    setMessage(null)
    const payload = {}
    if (data.username?.trim()) payload.username = data.username.trim()
    if (data.password) payload.password = data.password
    if (!Object.keys(payload).length) return setMessage({ type: 'error', text: 'Enter a username or a new password.' })
    try {
      const { data: updated } = await updateCurrentUser(payload)
      localStorage.setItem('auth_user', JSON.stringify(updated))
      setProfile(updated)
      login(updated)
      reset()
      setMessage({ type: 'success', text: 'Profile updated successfully.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Unable to update your profile.' })
    }
  }

  const joined = profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'
  const initial = profile?.username?.slice(0, 2).toUpperCase() || 'QP'

  return (
    <div className="bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-7xl">
        <div className="ide-card mb-6 p-6 sm:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="font-code text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">User profile</p>
              <h1 className="font-heading mt-3 text-4xl font-semibold">Account dashboard</h1>
              <p className="mt-3 max-w-2xl text-[var(--muted)]">Manage your account details and security settings.</p>
            </div>
            <div className="ide-surface px-6 py-5 text-sm text-[var(--text)]">Joined<div className="mt-2 text-2xl font-semibold">{joined}</div></div>
          </div>
        </div>
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <section className="ide-card space-y-6 p-6">
            <div className="flex items-center gap-4"><div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] font-heading text-2xl font-semibold">{initial}</div><div><div className="text-lg font-semibold">{profile?.username || 'Loading...'}</div><div className="text-sm text-[var(--muted)]">QueryPulse user</div></div></div>
            <div className="space-y-4"><DetailRow label="Email" value={profile?.email || '—'} /><DetailRow label="Verified" value={profile?.email_verified ? 'Verified' : 'Pending verification'} /><DetailRow label="Created" value={joined} /></div>
          </section>
          <section className="ide-card p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Account settings</p>
            <h2 className="mt-3 text-xl font-semibold">Update profile</h2>
            {message && <div className={`mt-5 rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/20 bg-rose-400/10 text-rose-200'}`}>{message.text}</div>}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 max-w-xl space-y-5">
              <div><label className="block text-sm font-medium">Username</label><input defaultValue={profile?.username || ''} {...register('username', { maxLength: { value: 50, message: 'Maximum 50 characters' } })} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none focus:border-[var(--accent)]" />{errors.username && <p className="mt-2 text-xs text-red-400">{errors.username.message}</p>}</div>
              <div><label className="block text-sm font-medium">New password</label><input type="password" {...register('password', { minLength: { value: 8, message: 'Minimum 8 characters' } })} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none focus:border-[var(--accent)]" />{errors.password && <p className="mt-2 text-xs text-red-400">{errors.password.message}</p>}</div>
              <PrimaryButton type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save changes'}</PrimaryButton>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
function DetailRow({ label, value }) { return <div className="ide-surface flex items-center justify-between px-4 py-3"><span className="text-sm text-[var(--muted)]">{label}</span><span className="text-sm font-medium">{value}</span></div> }
