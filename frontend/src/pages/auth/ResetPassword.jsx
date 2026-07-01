import React from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import PrimaryButton from '../../components/ui/PrimaryButton'

export default function ResetPassword() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  function onSubmit(data) {
    console.log('Reset password', data)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-[var(--panel)] border border-[var(--border)] rounded-3xl p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="text-3xl font-bold text-[var(--text)]">Create a new password</div>
          <p className="text-[var(--muted)] mt-2">Choose a strong password to keep your account secure.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text)]">New password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
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
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            />
            {errors.confirmPassword && <p className="mt-2 text-xs text-red-400">{errors.confirmPassword.message}</p>}
          </div>

          <PrimaryButton type="submit" className="w-full">Reset password</PrimaryButton>
        </form>

        <div className="mt-8 text-center text-[var(--muted)] text-sm">
          Back to <Link to="/login" className="text-[var(--accent)] hover:text-[var(--accent-strong)]">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
