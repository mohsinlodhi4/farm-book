import type { LucideIcon } from 'lucide-react'
import {
  Banknote, BarChart3, Beef, Boxes, LayoutDashboard, Milk, Settings, ShoppingCart, Truck, Users,
} from 'lucide-react'
import type { FarmRole } from '@/lib/supabase'

export type NavItem = {
  to: string
  labelKey: string
  icon: LucideIcon
  roles: readonly FarmRole[]
  /** Phase from IMPLEMENTATION_PLAN.md that delivers the module; undefined once built. */
  phase?: string
}

const ALL: readonly FarmRole[] = ['owner', 'manager', 'accountant', 'worker']
const OFFICE: readonly FarmRole[] = ['owner', 'manager', 'accountant']

// Mirrors docs/permissions.md. The database enforces these rules; the menu only hides what a role can't use.
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, roles: ALL },
  { to: '/production', labelKey: 'nav.production', icon: Milk, roles: ALL, phase: '2a' },
  { to: '/livestock', labelKey: 'nav.livestock', icon: Beef, roles: ALL, phase: '2a' },
  { to: '/sales', labelKey: 'nav.sales', icon: ShoppingCart, roles: OFFICE, phase: '2b' },
  { to: '/purchases', labelKey: 'nav.purchases', icon: Truck, roles: OFFICE, phase: '2c' },
  { to: '/inventory', labelKey: 'nav.inventory', icon: Boxes, roles: OFFICE, phase: '3' },
  { to: '/money', labelKey: 'nav.money', icon: Banknote, roles: ['owner', 'accountant'], phase: '3' },
  { to: '/employees', labelKey: 'nav.employees', icon: Users, roles: OFFICE, phase: '4' },
  { to: '/reports', labelKey: 'nav.reports', icon: BarChart3, roles: OFFICE, phase: '5' },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings, roles: ['owner'] },
]

export function navForRole(role: FarmRole | null): NavItem[] {
  if (!role) return []
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

export function canAccess(path: string, role: FarmRole | null): boolean {
  const item = NAV_ITEMS.find((i) => i.to === path)
  return !!role && !!item && item.roles.includes(role)
}
