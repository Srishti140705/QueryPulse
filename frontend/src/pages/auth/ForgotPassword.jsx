import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import PrimaryButton from '../../components/ui/PrimaryButton'
import { forgotPassword } from '../../services/authService'

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [message, setMessage] = useState(null)
  const [resetToken, setResetToken] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(data) {
    setMessage(null)
    setResetToken(null)
    setSubmitting(true)

    try {
      const response = await forgotPassword(data)
      setMessage({ type: 'success', text: response.data.message })
      setResetToken(response.data.reset_token || null)
    } catch (error) {
      const detail = error.response?.data?.detail
      setMessage({ type: 'error', text: typeof detail === 'string' ? detail : 'Unable to create a reset request. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10 text-[var(--text)]">
      <div className="ide-card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="font-heading text-3xl font-semibold text-[var(--text)]">Reset your password</div>
          <p className="text-[var(--muted)] mt-2">Enter your email and we’ll send you instructions to reset your password.</p>
        </div>

        {message && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/20 bg-rose-400/10 text-rose-200'}`}>
            {message.text}
            {resetToken && <Link to={`/reset-password?token=${encodeURIComponent(resetToken)}`} className="mt-2 block font-medium text-[var(--accent-strong)] hover:text-[var(--accent)]">Continue to reset password</Link>}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text)]">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required', pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Enter a valid email address' } })}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] outline-none transition duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
            {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <PrimaryButton type="submit" disabled={submitting} className="w-full">{submitting ? 'Sending...' : 'Send reset link'}</PrimaryButton>
        </form>

        <div className="mt-8 text-center text-[var(--muted)] text-sm">
          Remembered your password? <Link to="/login" className="text-[var(--accent)] hover:text-[var(--accent-strong)]">Sign in</Link>
        </div>
      </div>
    </div>
  )
}