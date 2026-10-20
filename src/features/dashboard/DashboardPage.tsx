import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Circle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentFarm } from '@/app/contexts'
import { Badge, Card, PageHeader } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

// Quick actions from PRD §9. Each one becomes a link when its module ships.
const QUICK_ACTIONS = [
  { label: 'Add animal', phase: '2a' },
  { label: 'Record production', phase: '2a' },
  { label: 'New sale', phase: '2b' },
  { label: 'New purchase', phase: '2c' },
  { label: 'Record expense', phase: '3' },
  { label: 'Mark attendance', phase: '4' },
]

export function DashboardPage() {
  const { t } = useTranslation()
  const farm = useCurrentFarm()
  const isOwner = farm.role === 'owner'
  const settings = (farm.settings ?? {}) as { conversions_reviewed?: boolean }

  const teamSize = useQuery({
    queryKey: ['team-size', farm.farmId],
    enabled: isOwner,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('farm_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('farm_id', farm.farmId)
        .eq('active', true)
      if (error) throw error
      return count ?? 0
    },
  })

  const checklist = [
    { done: true, label: 'Create your farm', to: '/settings' },
    { done: !!settings.conversions_reviewed, label: 'Review units and local conversions (maund, tray, bag)', to: '/settings?tab=units' },
    { done: (teamSize.data ?? 0) > 1, label: 'Invite your manager or workers', to: '/settings?tab=team' },
  ]

  return (
    <>
      <PageHeader title={farm.name} description={`${t(`category.${farm.category}`)} · ${t(`role.${farm.role}`)}`} />

      {isOwner && checklist.some((c) => !c.done) && (
        <Card className="mb-5">
          <h2 className="mb-3 font-semibold">Get started</h2>
          <ul className="space-y-2">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="flex items-center gap-2 text-sm hover:underline">
                  {item.done ? (
                    <CheckCircle2 className="size-5 text-brand-600" />
                  ) : (
                    <Circle className="size-5 text-stone-300" />
                  )}
                  <span className={item.done ? 'text-stone-500 line-through' : ''}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <h2 className="mb-3 font-semibold">Quick actions</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {QUICK_ACTIONS.map((a) => (
          <Card key={a.label} className="flex min-h-20 flex-col justify-between gap-2 text-stone-400" aria-disabled>
            <span className="font-medium">{a.label}</span>
            <Badge className="self-start">Phase {a.phase}</Badge>
          </Card>
        ))}
      </div>
    </>
  )
}
