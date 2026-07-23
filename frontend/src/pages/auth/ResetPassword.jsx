import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import PrimaryButton from '../../components/ui/PrimaryButton'
import { resetPassword } from '../../services/authService'

export default function ResetPassword() {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(data) {
    const token = searchParams.get('token')
    if (!token) {
      setMessage({ type: 'error', text: 'Reset token is missing or invalid.' })
      return
    }

    setMessage(null)
    setSubmitting(true)

    try {
      const response = await resetPassword({ token, password: data.password })
      reset()
      setMessage({ type: 'success', text: response.data.message })
    } catch (error) {
      const detail = error.response?.data?.detail
      setMessage({ type: 'error', text: typeof detail === 'string' ? detail : 'Unable to reset your password. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10">
      <div className="ide-card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="font-heading text-3xl font-semibold text-[var(--text)]">Create a new password</div>
          <p className="text-[var(--muted)] mt-2">Choose a strong password to keep your account secure.</p>
        </div>

        {message && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/20 bg-rose-400/10 text-rose-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text)]">New password</label>
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

          <PrimaryButton type="submit" disabled={submitting} className="w-full">{submitting ? 'Resetting...' : 'Reset password'}</PrimaryButton>
        </form>

        <div className="mt-8 text-center text-[var(--muted)] text-sm">
          Back to <Link to="/login" className="text-[var(--accent)] hover:text-[var(--accent-strong)]">Sign in</Link>
        </div>
      </div>
    </div>
  )
}