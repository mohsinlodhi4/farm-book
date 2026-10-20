import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuth } from '@/app/contexts'
import { Button } from '@/components/ui/button'
import { Card, PageHeader, Spinner } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/field'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'

const schema = z.object({
  full_name: z.string().trim().min(2, 'Enter your name'),
  phone: z.string().trim().max(30),
})
type Values = z.infer<typeof schema>

export function AccountPage() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const userId = session!.user.id
  const client = useQueryClient()
  const navigate = useNavigate()

  const profile = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('full_name, phone').eq('user_id', userId).single()
      if (error) throw error
      return data
    },
  })

  const { register, handleSubmit, reset, formState } = useForm<Values>({ resolver: zodResolver(schema) })
  useEffect(() => {
    if (profile.data) reset({ full_name: profile.data.full_name ?? '', phone: profile.data.phone ?? '' })
  }, [profile.data, reset])

  const onSubmit = handleSubmit(async (values) => {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: values.full_name, phone: values.phone || null })
      .eq('user_id', userId)
    if (error) return toast.error(errorMessage(error))
    toast.success('Profile saved')
    void client.invalidateQueries({ queryKey: ['profile', userId] })
  })

  return (
    <>
      <PageHeader title={t('nav.account')} description={session?.user.email} />
      <Card className="max-w-lg">
        {profile.isPending ? (
          <Spinner />
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="Your name" error={formState.errors.full_name?.message}>
              {(p) => <Input {...p} autoComplete="name" {...register('full_name')} />}
            </Field>
            <Field label="Phone (optional)" error={formState.errors.phone?.message}>
              {(p) => <Input {...p} type="tel" autoComplete="tel" {...register('phone')} />}
            </Field>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </form>
        )}
      </Card>
      <div className="mt-5 flex max-w-lg flex-wrap gap-2">
        <Button variant="secondary" onClick={() => navigate('/onboarding')}>
          Add another farm
        </Button>
        <Button variant="secondary" onClick={() => void supabase.auth.signOut()}>
          {t('common.signOut')}
        </Button>
      </div>
    </>
  )
}
