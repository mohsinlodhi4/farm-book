import { useTranslation } from 'react-i18next'
import { Card, PageHeader } from '@/components/ui/card'
import type { NavItem } from '@/app/nav'

export function ComingSoonPage({ item }: { item: NavItem }) {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t(item.labelKey)} />
      <Card className="text-center text-stone-600">
        <item.icon className="mx-auto mb-2 size-8 text-stone-300" />
        This module is planned for phase {item.phase} of the implementation plan.
      </Card>
    </>
  )
}
