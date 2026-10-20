import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useCurrentFarm } from '@/app/contexts'
import { Button } from '@/components/ui/button'
import { Card, Spinner } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/field'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'

export type FarmSettingsJson = {
  milk_mode?: 'per_animal' | 'bulk'
  allow_negative_stock?: boolean
  payroll_period?: 'monthly' | 'weekly'
  monthly_salary_uses_attendance?: boolean
  conversions_reviewed?: boolean
}

const schema = z.object({
  name: z.string().trim().min(2, 'Enter the farm name').max(120),
  address: z.string().trim().max(300),
  phone: z.string().trim().max(30),
  timezone: z.string().min(1),
  milk_mode: z.enum(['per_animal', 'bulk']),
  payroll_period: z.enum(['monthly', 'weekly']),
  allow_negative_stock: z.boolean(),
  monthly_salary_uses_attendance: z.boolean(),
})
type Values = z.infer<typeof schema>

const TIMEZONES = ['Asia/Karachi', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Riyadh', 'Europe/London', 'UTC']

export function FarmSettings() {
  const farm = useCurrentFarm()
  const client = useQueryClient()
  const settings = (farm.settings ?? {}) as FarmSettingsJson
  const hasMilk = farm.category === 'dairy' || farm.category === 'mixed'

  const details = useQuery({
    queryKey: ['farm-details', farm.farmId],
    queryFn: async () => {
      const { data, error } = await supabase.from('farms').select('address, phone').eq('id', farm.farmId).single()
      if (error) throw error
      return data
    },
  })

  const { register, handleSubmit, formState, control } = useForm<Values>({
    resolver: zodResolver(schema),
    values: details.data && {
      name: farm.name,
      address: details.data.address ?? '',
      phone: details.data.phone ?? '',
      timezone: farm.timezone,
      milk_mode: settings.milk_mode ?? 'per_animal',
      payroll_period: settings.payroll_period ?? 'monthly',
      allow_negative_stock: settings.allow_negative_stock ?? false,
      monthly_salary_uses_attendance: settings.monthly_salary_uses_attendance ?? false,
    },
    resetOptions: { keepDirtyValues: true },
  })

  const allowNegative = useWatch({ control, name: 'allow_negative_stock' })

  const onSubmit = handleSubmit(async (v) => {
    const { error } = await supabase
      .from('farms')
      .update({
        name: v.name,
        address: v.address || null,
        phone: v.phone || null,
        timezone: v.timezone,
        settings: {
          ...settings,
          milk_mode: v.milk_mode,
          payroll_period: v.payroll_period,
          allow_negative_stock: v.allow_negative_stock,
          monthly_salary_uses_attendance: v.monthly_salary_uses_attendance,
        },
      })
      .eq('id', farm.farmId)
    if (error) return toast.error(errorMessage(error))
    toast.success('Farm settings saved')
    void client.invalidateQueries({ queryKey: ['my-farms'] })
    void client.invalidateQueries({ queryKey: ['farm-details', farm.farmId] })
  })

  if (details.isPending) return <Spinner />

  return (
    <Card className="max-w-2xl">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Farm name" error={formState.errors.name?.message}>
            {(p) => <Input {...p} {...register('name')} />}
          </Field>
          <Field label="Phone">
            {(p) => <Input {...p} type="tel" {...register('phone')} />}
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">{(p) => <Input {...p} {...register('address')} />}</Field>
          </div>
          <Field label="Timezone" hint="Used to decide which day a record belongs to.">
            {(p) => (
              <Select {...p} {...register('timezone')}>
                {[...new Set([farm.timezone, ...TIMEZONES])].map((tz) => (
                  <option key={tz}>{tz}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Currency" hint="Fixed per farm.">
            {(p) => <Input {...p} value={farm.currency} disabled readOnly />}
          </Field>
        </div>

        {hasMilk && (
          <Field
            label="Milk recording"
            hint="Per-animal records each animal's yield. Bulk records one total per session. Only one method counts as production."
          >
            {(p) => (
              <Select {...p} {...register('milk_mode')}>
                <option value="per_animal">Per animal</option>
                <option value="bulk">Bulk total only</option>
              </Select>
            )}
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Payroll period">
            {(p) => (
              <Select {...p} {...register('payroll_period')}>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </Select>
            )}
          </Field>
        </div>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-medium text-stone-700">Rules</legend>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 size-5 accent-brand-700" {...register('monthly_salary_uses_attendance')} />
            <span>Reduce monthly salaries for absent days</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 size-5 accent-brand-700" {...register('allow_negative_stock')} />
            <span>
              Allow stock to go below zero
              {allowNegative && (
                <span className="block text-amber-700">Not recommended: every override is recorded in the audit history.</span>
              )}
            </span>
          </label>
        </fieldset>

        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </Card>
  )
}
