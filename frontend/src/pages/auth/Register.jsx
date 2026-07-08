import React from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import PrimaryButton from '../../components/ui/PrimaryButton'
import { useAuth } from '../../auth/AuthProvider'

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const navigate = useNavigate()
  const { login } = useAuth()

  function onSubmit(data) {
    login({ email: data.email })
    navigate('/dashboard')
  }

  function handleOAuth(provider) {
    console.log(`OAuth provider: ${provider}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10">
      <div className="ide-card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="font-heading text-3xl font-semibold text-[var(--text)]">Create account</div>
          <p className="text-[var(--muted)] mt-2">Start optimizing SQL with QueryPulse in seconds.</p>
        </div>

        <div className="space-y-3 mb-6">
          <OAuthButton
            label="Continue with Google"
            color="bg-[var(--surface)] text-[var(--text)]"
            icon={<GoogleIcon />}
            onClick={() => handleOAuth('Google')}
          />
          <OAuthButton
            label="Continue with GitHub"
            color="bg-[var(--surface)] text-[var(--text)]"
            icon={<GitHubIcon />}
            onClick={() => handleOAuth('GitHub')}
          />
          <OAuthButton
            label="Continue with Microsoft"
            color="bg-[var(--surface)] text-[var(--text)]"
            icon={<MicrosoftIcon />}
            onClick={() => handleOAuth('Microsoft')}
          />
        </div>

        <div className="flex items-center gap-3 text-[var(--muted)] mb-6">
          <span className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-sm">Or register with email</span>
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text)]">Full name</label>
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] outline-none transition duration-200 placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
            {errors.name && <p className="mt-2 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)]">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] outline-none transition duration-200 placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
            {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)]">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] outline-none transition duration-200 placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
            {errors.password && <p className="mt-2 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)]">Confirm password</label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Confirm password is required',
                validate: (value) => value === watch('password') || 'Passwords must match',
              })}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] outline-none transition duration-200 placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
            {errors.confirmPassword && <p className="mt-2 text-xs text-red-400">{errors.confirmPassword.message}</p>}
          </div>

          <PrimaryButton type="submit" className="w-full">Create account</PrimaryButton>
        </form>

        <div className="mt-8 text-center text-[var(--muted)] text-sm">
          Already have an account? <Link to="/login" className="text-[var(--accent)] hover:text-[var(--accent-strong)]">Sign in</Link>
        </div>
      </div>
    </div>
  )
}

function OAuthButton({ label, color, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ide-button w-full ${color}`}
    >
      {icon}
      {label}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M44.5 20H24v8.5h11.9c-1.05 3-3.65 5.6-7.15 6.85v5.7h11.55C41.8 36.8 45 29.75 45 24c0-1.6-.15-3.15-.43-4.65z" fill="#4285F4"/>
      <path d="M24 44.99c6.05 0 11.1-2.05 14.8-5.55l-7.05-5.7c-2 1.35-4.55 2.15-7.75 2.15-5.95 0-11-4.05-12.8-9.5H3.4v5.95C7.9 39.9 15.45 44.99 24 44.99z" fill="#34A853"/>
      <path d="M11.2 27.4c-.45-1.35-.7-2.8-.7-4.4s.25-3.05.7-4.4V12.1H3.4C1.2 15.6 0 19.7 0 24s1.2 8.4 3.4 11.9l7.8-5.5z" fill="#FBBC05"/>
      <path d="M24 9.02c3.6 0 6.85 1.25 9.4 3.7l7.05-7.05C35.1 1.6 30.05 0 24 0 15.45 0 7.9 5.1 3.4 12.1l7.8 5.95C13 13.07 18.05 9.02 24 9.02z" fill="#EA4335"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.045-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.744.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.435.375.81 1.096.81 2.21 0 1.596-.015 2.88-.015 3.27 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="8" height="8" fill="#F35325"/>
      <rect x="13" y="3" width="8" height="8" fill="#81BC06"/>
      <rect x="3" y="13" width="8" height="8" fill="#05A6F0"/>
      <rect x="13" y="13" width="8" height="8" fill="#FFBA08"/>
    </svg>
  )
}
