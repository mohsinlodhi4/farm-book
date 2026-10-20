import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { FarmSettingsJson } from './FarmSettings'
import { useCurrentFarm } from '@/app/contexts'
import { Button } from '@/components/ui/button'
import { Badge, Card, Spinner } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/field'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'

const UNIT_KINDS = ['volume', 'mass', 'count', 'animal', 'other'] as const

export function UnitsSettings() {
  const farm = useCurrentFarm()
  const client = useQueryClient()
  const settings = (farm.settings ?? {}) as FarmSettingsJson

  const units = useQuery({
    queryKey: ['units', farm.farmId],
    queryFn: async () => {
      const { data, error } = await supabase.from('units').select('id, code, name, kind, active').eq('farm_id', farm.farmId).order('kind').order('name')
      if (error) throw error
      return data
    },
  })

  const conversions = useQuery({
    queryKey: ['unit-conversions', farm.farmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unit_conversions')
        .select('id, factor, from_unit_id, to_unit_id')
        .eq('farm_id', farm.farmId)
      if (error) throw error
      return data
    },
  })

  const invalidate = () => {
    void client.invalidateQueries({ queryKey: ['units', farm.farmId] })
    void client.invalidateQueries({ queryKey: ['unit-conversions', farm.farmId] })
  }

  const markReviewed = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('farms')
        .update({ settings: { ...settings, conversions_reviewed: true } })
        .eq('id', farm.farmId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Conversions marked as reviewed')
      void client.invalidateQueries({ queryKey: ['my-farms'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (units.isPending || conversions.isPending) return <Spinner />
  if (units.isError || conversions.isError) return <Card>{errorMessage(units.error ?? conversions.error)}</Card>

  const unitById = new Map(units.data.map((u) => [u.id, u]))

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="mb-1 font-semibold">Conversions</h2>
        <p className="mb-4 text-sm text-stone-600">
          Local measures differ between markets. Check each one matches how your farm buys and sells. A maund is set to 40 kg
          and a tray to 30 eggs by default.
        </p>
        {!settings.conversions_reviewed && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            These conversions have not been reviewed yet.
            <Button size="sm" variant="secondary" disabled={markReviewed.isPending} onClick={() => markReviewed.mutate()}>
              They are correct
            </Button>
          </div>
        )}
        <ul className="divide-y divide-stone-100">
          {conversions.data.map((c) => (
            <ConversionRow
              key={c.id}
              id={c.id}
              factor={c.factor}
              from={unitById.get(c.from_unit_id)?.code ?? '?'}
              to={unitById.get(c.to_unit_id)?.code ?? '?'}
              onSaved={invalidate}
            />
          ))}
        </ul>
        <AddConversion farmId={farm.farmId} units={units.data} onAdded={invalidate} />
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">Units</h2>
        <ul className="divide-y divide-stone-100">
          {units.data.map((u) => (
            <li key={u.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="w-16 font-mono">{u.code}</span>
              <span className="flex-1">{u.name}</span>
              <Badge>{u.kind}</Badge>
              <ActiveToggle table="units" id={u.id} active={u.active} onSaved={invalidate} />
            </li>
          ))}
        </ul>
        <AddUnit farmId={farm.farmId} onAdded={invalidate} />
      </Card>
    </div>
  )
}

function ConversionRow({ id, factor, from, to, onSaved }: { id: string; factor: number; from: string; to: string; onSaved: () => void }) {
  const [value, setValue] = useState(String(factor))
  const dirty = value !== String(factor)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!(Number(value) > 0)) return toast.error('Enter a number greater than zero')
    const { error } = await supabase.from('unit_conversions').update({ factor: Number(value) }).eq('id', id)
    if (error) return toast.error(errorMessage(error))
    toast.success(`Saved: 1 ${from} = ${value} ${to}`)
    onSaved()
  }

  return (
    <li>
      <form onSubmit={save} className="flex items-center gap-2 py-2 text-sm">
        <span className="w-20 shrink-0">1 {from} =</span>
        <Input aria-label={`${to} per ${from}`} inputMode="decimal" className="min-h-9 w-28" value={value} onChange={(e) => setValue(e.target.value)} />
        <span className="flex-1">{to}</span>
        {dirty && (
          <Button size="sm" type="submit">
            Save
          </Button>
        )}
      </form>
    </li>
  )
}

function AddConversion({ farmId, units, onAdded }: { farmId: string; units: { id: string; code: string }[]; onAdded: () => void }) {
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [factor, setFactor] = useState('')

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!fromId || !toId || fromId === toId || !(Number(factor) > 0)) {
      return toast.error('Pick two different units and a factor greater than zero')
    }
    const { error } = await supabase.from('unit_conversions').insert({ farm_id: farmId, from_unit_id: fromId, to_unit_id: toId, factor: Number(factor) })
    if (error) return toast.error(errorMessage(error))
    setFromId('')
    setToId('')
    setFactor('')
    onAdded()
  }

  return (
    <form onSubmit={add} className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4 text-sm">
      <span>1</span>
      <Select aria-label="From unit" className="min-h-9 w-28" value={fromId} onChange={(e) => setFromId(e.target.value)}>
        <option value="">unit</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>{u.code}</option>
        ))}
      </Select>
      <span>=</span>
      <Input aria-label="Factor" inputMode="decimal" className="min-h-9 w-24" value={factor} onChange={(e) => setFactor(e.target.value)} />
      <Select aria-label="To unit" className="min-h-9 w-28" value={toId} onChange={(e) => setToId(e.target.value)}>
        <option value="">unit</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>{u.code}</option>
        ))}
      </Select>
      <Button size="sm" type="submit" variant="secondary">
        Add conversion
      </Button>
    </form>
  )
}

function AddUnit({ farmId, onAdded }: { farmId: string; onAdded: () => void }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [kind, setKind] = useState<(typeof UNIT_KINDS)[number]>('count')

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) return toast.error('Enter a short code and a name')
    const { error } = await supabase.from('units').insert({ farm_id: farmId, code: code.trim(), name: name.trim(), kind })
    if (error) return toast.error(error.code === '23505' ? 'A unit with this code already exists' : errorMessage(error))
    setCode('')
    setName('')
    onAdded()
  }

  return (
    <form onSubmit={add} className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
      <Input aria-label="Unit code" placeholder="Code" className="min-h-9 w-24" value={code} onChange={(e) => setCode(e.target.value)} />
      <Input aria-label="Unit name" placeholder="Name" className="min-h-9 w-40 flex-1" value={name} onChange={(e) => setName(e.target.value)} />
      <Select aria-label="Unit kind" className="min-h-9 w-32" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
        {UNIT_KINDS.map((k) => (
          <option key={k}>{k}</option>
        ))}
      </Select>
      <Button size="sm" type="submit" variant="secondary">
        Add unit
      </Button>
    </form>
  )
}

export function ActiveToggle({
  table,
  id,
  active,
  onSaved,
}: {
  table: 'units' | 'locations' | 'production_sessions' | 'payment_methods' | 'animal_types' | 'money_categories'
  id: string
  active: boolean
  onSaved: () => void
}) {
  const [busy, setBusy] = useState(false)
  const toggle = async () => {
    setBusy(true)
    // Rows are deactivated rather than deleted so historical records keep their references.
    const { error } = await supabase.from(table as 'units').update({ active: !active }).eq('id', id)
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    onSaved()
  }
  return (
    <Button size="sm" variant="ghost" disabled={busy} onClick={toggle} className={active ? 'text-brand-700' : 'text-stone-400'}>
      {active ? 'Active' : 'Inactive'}
    </Button>
  )
}
