import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router'
import { z } from 'zod'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/button'
import { ErrorNote } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/field'
import { supabase } from '@/lib/supabase'
import { errorMessage, safeNext } from '@/lib/utils'

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name'),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
})
type Values = z.infer<typeof schema>

export function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const search = useLocation().search
  const next = safeNext(new URLSearchParams(search).get('next'))
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async ({ fullName, email, password }) => {
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}${next}` },
    })
    if (error) return setError(errorMessage(error))
    // With email confirmation on, there is no session until the link is clicked.
    if (!data.session) setSentTo(email)
  })

  if (sentTo) {
    return (
      <AuthLayout title="Check your email">
        <p className="text-sm text-stone-600">
          We sent a confirmation link to <strong>{sentTo}</strong>. Open it to finish creating your account.
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your account"
      footer={
        <>
          Already have an account? <Link className="font-medium text-brand-700" to={`/login${search}`}>Sign in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Your name" error={formState.errors.fullName?.message}>
          {(p) => <Input {...p} autoComplete="name" {...register('fullName')} />}
        </Field>
        <Field label="Email" error={formState.errors.email?.message}>
          {(p) => <Input {...p} type="email" autoComplete="email" {...register('email')} />}
        </Field>
        <Field label="Password" hint="At least 8 characters" error={formState.errors.password?.message}>
          {(p) => <Input {...p} type="password" autoComplete="new-password" {...register('password')} />}
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
