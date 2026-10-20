import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useFarm } from '@/app/contexts'
import { Button } from '@/components/ui/button'
import { ErrorNote } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/field'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { useRequestId } from '@/lib/requestId'
import { supabase, type FarmCategory } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'

const CATEGORIES: FarmCategory[] = ['dairy', 'poultry', 'livestock', 'mixed', 'other']

const schema = z.object({
  name: z.string().trim().min(2, 'Enter the farm name').max(120),
  category: z.enum(CATEGORIES),
})
type Values = z.infer<typeof schema>

export function CreateFarmPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { farms, refresh, selectFarm } = useFarm()
  const { requestId } = useRequestId()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'dairy' },
  })

  const onSubmit = handleSubmit(async ({ name, category }) => {
    setError(null)
    const { data: farmId, error } = await supabase.rpc('create_farm_with_template', {
      p_name: name,
      p_category: category,
      p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi',
      p_client_request_id: requestId,
    })
    if (error) return setError(errorMessage(error))
    selectFarm(farmId)
    await refresh()
    toast.success('Farm created')
    navigate('/', { replace: true })
  })

  return (
    <AuthLayout title={farms.length ? 'Add another farm' : 'Set up your farm'}>
      <p className="text-sm text-stone-600">
        We add common units, sessions, payment methods and animal types for the farm type you choose. You can change
        all of them later in Settings.
      </p>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Farm name" error={formState.errors.name?.message}>
          {(p) => <Input {...p} placeholder="e.g. Green Valley Dairy" {...register('name')} />}
        </Field>
        <Field label="Farm type" error={formState.errors.category?.message}>
          {(p) => (
            <Select {...p} {...register('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`category.${c}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? 'Creating…' : 'Create farm'}
        </Button>
        {farms.length > 0 && (
          <Button variant="ghost" className="w-full" onClick={() => navigate(-1)}>
            {t('common.cancel')}
          </Button>
        )}
      </form>
    </AuthLayout>
  )
}
