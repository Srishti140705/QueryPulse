import React from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import PrimaryButton from '../../components/ui/PrimaryButton'

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm()

  function onSubmit(data) {
    console.log('Forgot password', data)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-[var(--panel)] border border-[var(--border)] rounded-3xl p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="text-3xl font-bold text-[var(--text)]">Reset your password</div>
          <p className="text-[var(--muted)] mt-2">Enter your email and we’ll send you instructions to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text)]">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
            />
            {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <PrimaryButton type="submit" className="w-full">Send reset link</PrimaryButton>
        </form>

        <div className="mt-8 text-center text-[var(--muted)] text-sm">
          Remembered your password? <Link to="/login" className="text-[var(--accent)] hover:text-[var(--accent-strong)]">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
