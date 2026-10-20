import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/button'
import { ErrorNote } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/field'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'

const emailSchema = z.object({ email: z.email('Enter a valid email') })

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema) })

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setError(errorMessage(error))
    else setSent(true)
  })

  return (
    <AuthLayout title="Reset your password" footer={<Link className="text-brand-700" to="/login">Back to sign in</Link>}>
      {sent ? (
        <p className="text-sm text-stone-600">If an account exists for that email, a reset link is on its way.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Email" error={formState.errors.email?.message}>
            {(p) => <Input {...p} type="email" autoComplete="email" {...register('email')} />}
          </Field>
          {error && <ErrorNote>{error}</ErrorNote>}
          <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}

const passwordSchema = z.object({ password: z.string().min(8, 'Use at least 8 characters') })

/** Opened from the reset email; Supabase signs the user in from the link before this renders. */
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  })

  const onSubmit = handleSubmit(async ({ password }) => {
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return setError(errorMessage(error))
    toast.success('Password updated')
    navigate('/', { replace: true })
  })

  return (
    <AuthLayout title="Choose a new password">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="New password" error={formState.errors.password?.message}>
          {(p) => <Input {...p} type="password" autoComplete="new-password" {...register('password')} />}
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  )
}
