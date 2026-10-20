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
import { errorMessage } from '@/lib/utils'

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})
type Values = z.infer<typeof schema>

export function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const search = useLocation().search
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword(values)
    if (error) setError(errorMessage(error))
    // On success RedirectIfSignedIn sends the user on.
  })

  return (
    <AuthLayout
      title="Sign in"
      footer={
        <>
          New here? <Link className="font-medium text-brand-700" to={`/signup${search}`}>Create an account</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" error={formState.errors.email?.message}>
          {(p) => <Input {...p} type="email" autoComplete="email" {...register('email')} />}
        </Field>
        <Field label="Password" error={formState.errors.password?.message}>
          {(p) => <Input {...p} type="password" autoComplete="current-password" {...register('password')} />}
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="text-center text-sm">
          <Link className="text-brand-700" to="/forgot-password">Forgot password?</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
