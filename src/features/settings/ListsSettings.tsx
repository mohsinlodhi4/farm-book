import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ActiveToggle } from './UnitsSettings'
import { useCurrentFarm } from '@/app/contexts'
import { Button } from '@/components/ui/button'
import { Badge, Card, Spinner } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/field'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'

type ListTable = 'animal_types' | 'locations' | 'production_sessions' | 'payment_methods' | 'money_categories'

type ListConfig = {
  table: ListTable
  title: string
  description: string
  /** Extra required column chosen from fixed options (e.g. tracking mode). */
  kind?: { column: string; label: string; options: { value: string; label: string }[] }
}

const LISTS: ListConfig[] = [
  {
    table: 'animal_types',
    title: 'Animal types',
    description: 'Track high-value animals one by one, and poultry as flocks or batches.',
    kind: {
      column: 'tracking_mode',
      label: 'Tracking',
      options: [
        { value: 'individual', label: 'Individual' },
        { value: 'batch', label: 'Batch / flock' },
      ],
    },
  },
  {
    table: 'locations',
    title: 'Sheds and groups',
    description: 'Where animals and stock are kept.',
    kind: {
      column: 'kind',
      label: 'Kind',
      options: [
        { value: 'shed', label: 'Shed' },
        { value: 'group', label: 'Group' },
        { value: 'pen', label: 'Pen' },
        { value: 'other', label: 'Other' },
      ],
    },
  },
  { table: 'production_sessions', title: 'Production sessions', description: 'For example morning and evening milking, or egg collection rounds.' },
  {
    table: 'payment_methods',
    title: 'Payment methods',
    description: 'How money is paid and received.',
    kind: {
      column: 'kind',
      label: 'Type',
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'bank', label: 'Bank' },
        { value: 'cheque', label: 'Cheque' },
        { value: 'wallet', label: 'Mobile wallet' },
        { value: 'other', label: 'Other' },
      ],
    },
  },
  {
    table: 'money_categories',
    title: 'Expense and income categories',
    description: 'Used in the money register and reports.',
    kind: {
      column: 'kind',
      label: 'Type',
      options: [
        { value: 'expense', label: 'Expense' },
        { value: 'income', label: 'Income' },
      ],
    },
  },
]

type Row = { id: string; name: string; active: boolean } & Record<string, unknown>

export function ListsSettings() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {LISTS.map((config) => (
        <ListEditor key={config.table} config={config} />
      ))}
    </div>
  )
}

function ListEditor({ config }: { config: ListConfig }) {
  const { farmId } = useCurrentFarm()
  const client = useQueryClient()
  const queryKey = [config.table, farmId]
  const [name, setName] = useState('')
  const [kind, setKind] = useState(config.kind?.options[0].value ?? '')

  // The generated client types each table separately; these five share the columns used here.
  const table = () => supabase.from(config.table as 'locations')

  const list = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await table().select('*').eq('farm_id', farmId).order('name')
      if (error) throw error
      return data as unknown as Row[]
    },
  })

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const row: Record<string, unknown> = { farm_id: farmId, name: name.trim() }
    if (config.kind) row[config.kind.column] = kind
    if (config.table === 'production_sessions') row.sort_order = (list.data?.length ?? 0) + 1
    const { error } = await table().insert(row as { farm_id: string; name: string })
    if (error) return toast.error(error.code === '23505' ? `"${name.trim()}" already exists` : errorMessage(error))
    setName('')
    void client.invalidateQueries({ queryKey })
  }

  const label = (row: Row) =>
    config.kind?.options.find((o) => o.value === row[config.kind!.column])?.label

  return (
    <Card>
      <h2 className="font-semibold">{config.title}</h2>
      <p className="mb-3 text-sm text-stone-600">{config.description}</p>
      {list.isPending ? (
        <Spinner />
      ) : list.isError ? (
        <p className="text-sm text-red-600">{errorMessage(list.error)}</p>
      ) : list.data.length === 0 ? (
        <p className="py-3 text-sm text-stone-500">Nothing added yet.</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {list.data.map((row) => (
            <li key={row.id} className="flex items-center gap-3 py-1.5 text-sm">
              <span className={row.active ? 'flex-1' : 'flex-1 text-stone-400'}>{row.name}</span>
              {config.kind && <Badge>{label(row)}</Badge>}
              <ActiveToggle table={config.table} id={row.id} active={row.active} onSaved={() => void client.invalidateQueries({ queryKey })} />
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
        <Input aria-label={`New ${config.title.toLowerCase()} name`} placeholder="Name" className="min-h-9 flex-1" value={name} onChange={(e) => setName(e.target.value)} />
        {config.kind && (
          <Select aria-label={config.kind.label} className="min-h-9 w-36" value={kind} onChange={(e) => setKind(e.target.value)}>
            {config.kind.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        )}
        <Button size="sm" type="submit" variant="secondary" disabled={!name.trim()}>
          Add
        </Button>
      </form>
    </Card>
  )
}
