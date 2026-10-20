import { useSearchParams } from 'react-router'
import { FarmSettings } from './FarmSettings'
import { ListsSettings } from './ListsSettings'
import { TeamSettings } from './TeamSettings'
import { UnitsSettings } from './UnitsSettings'
import { PageHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'farm', label: 'Farm', Component: FarmSettings },
  { id: 'units', label: 'Units', Component: UnitsSettings },
  { id: 'lists', label: 'Lists', Component: ListsSettings },
  { id: 'team', label: 'Team', Component: TeamSettings },
] as const

export function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const active = TABS.find((t) => t.id === params.get('tab')) ?? TABS[0]

  return (
    <>
      <PageHeader title="Settings" description="Configure how your farm records work. Changes apply to everyone on this farm." />
      <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto border-b border-stone-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={tab.id === active.id}
            onClick={() => setParams({ tab: tab.id }, { replace: true })}
            className={cn(
              'min-h-11 shrink-0 border-b-2 px-4 text-sm font-medium',
              tab.id === active.id ? 'border-brand-700 text-brand-800' : 'border-transparent text-stone-600 hover:text-stone-900',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <active.Component />
    </>
  )
}
