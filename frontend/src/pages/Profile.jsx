import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getCurrentUser, updateCurrentUser } from '../services/authService'
import { useAuth } from '../auth/AuthProvider'

export default function Profile() {
  const { user, login } = useAuth()
  const [profile, setProfile] = useState(user)
  const [message, setMessage] = useState(null)
  const [shown, setShown] = useState({ current: false, password: false, confirm: false })
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm()

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    return () => { window.history.scrollRestoration = previousScrollRestoration }
  }, [])

  useEffect(() => {
    getCurrentUser().then(({ data }) => { setProfile(data); reset({ username: data.username }) }).catch(() => setMessage({ type: 'error', text: 'Unable to load your profile.' }))
  }, [reset])

  async function onSubmit(data) {
    setMessage(null)
    const changingPassword = Boolean(data.password || data.current_password || data.confirm_password)
    if (changingPassword && (!data.current_password || !data.password || !data.confirm_password)) return setMessage({ type: 'error', text: 'Fill in all three password fields to change your password.' })
    const payload = {}
    if (data.username?.trim() && data.username.trim() !== profile?.username) payload.username = data.username.trim()
    if (changingPassword) { payload.password = data.password; payload.current_password = data.current_password }
    if (!Object.keys(payload).length) return setMessage({ type: 'error', text: 'There are no changes to save.' })
    try {
      const { data: updated } = await updateCurrentUser(payload)
      localStorage.setItem('auth_user', JSON.stringify(updated)); setProfile(updated); login(updated)
      reset({ username: updated.username }); setMessage({ type: 'success', text: 'Profile updated successfully.' })
    } catch (error) { setMessage({ type: 'error', text: error.response?.data?.detail || 'Unable to update your profile.' }) }
  }

  const initials = profile?.username?.slice(0, 2).toUpperCase() || 'QP'
  const joined = profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
  return <main className="profile-quest"><section className="profile-quest-hero"><div className="profile-emblem">{initials}</div><div><p className="profile-label">✦ Explorer profile ✦</p><h1>{profile?.username || 'Loading...'}</h1><p>Build better queries. Earn better insights.</p></div><div className="profile-level"><small>✦ SQL level 12 ✦</small><b>Query Explorer ✦</b><div><i /></div><span>820 / 1200 XP</span></div></section>
    <div className="profile-quest-grid"><aside className="profile-quest-card"><p className="profile-label cyan">Account intel</p><Info icon="✉" label="Email" value={profile?.email || '—'} /><Info icon={profile?.email_verified ? '✓' : '!'} label="Verification" value={profile?.email_verified ? 'Verified account' : 'Pending verification'} /><Info icon="◷" label="Joined" value={joined} /></aside>
      <section className="profile-quest-card profile-controls"><p className="profile-label pink">Profile controls</p><h2>Keep your account current</h2><p>Update your account details and keep your credentials secure.</p>{message && <div className={`profile-notice ${message.type}`}>{message.text}</div>}<form onSubmit={handleSubmit(onSubmit)} className="profile-form"><label>Username<div className="password-wrap username-wrap"><input {...register('username', { maxLength: { value: 50, message: 'Maximum 50 characters' } })} /></div>{errors.username && <em>{errors.username.message}</em>}</label><Password label="Current password" name="current_password" shown={shown.current} toggle={() => setShown(s => ({ ...s, current: !s.current }))} register={register} errors={errors} /><Password label="New password" name="password" shown={shown.password} toggle={() => setShown(s => ({ ...s, password: !s.password }))} register={register} rules={{ minLength: { value: 8, message: 'New password must be at least 8 characters' } }} errors={errors} /><Password label="Confirm password" name="confirm_password" shown={shown.confirm} toggle={() => setShown(s => ({ ...s, confirm: !s.confirm }))} register={register} rules={{ validate: value => !value || value === watch('password') || 'Passwords do not match' }} errors={errors} /><button disabled={isSubmitting} type="submit">▣ {isSubmitting ? 'Saving...' : 'Save changes'}</button></form></section></div></main>
}
function Info({ icon, label, value }) { return <div className="profile-info"><i>{icon}</i><div><small>{label}</small><b>{value}</b></div></div> }
function Password({ label, name, shown, toggle, register, rules, errors }) { return <label>{label}<div className="password-wrap"><input type={shown ? 'text' : 'password'} autoComplete={name === 'current_password' ? 'one-time-code' : 'new-password'} {...register(name, rules)} /><button type="button" aria-label={`${shown ? 'Hide' : 'Show'} ${label}`} onClick={toggle}>{shown ? '◉' : '◌'}</button></div>{errors?.[name] && <em>{errors[name].message}</em>}</label> }
