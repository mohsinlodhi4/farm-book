import { CircleUser, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router'
import { navForRole, type NavItem } from './nav'
import { useFarm } from './contexts'
import { Select } from '@/components/ui/field'
import { supabase } from '@/lib/supabase'
import { APP_NAME, cn } from '@/lib/utils'

const MOBILE_TABS = 4

export function AppShell() {
  const { t } = useTranslation()
  const { farms, current, role, selectFarm } = useFarm()
  const [moreOpen, setMoreOpen] = useState(false)
  const items = navForRole(role)
  const tabs = items.slice(0, MOBILE_TABS)
  const overflow = items.slice(MOBILE_TABS)

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="no-print hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white lg:flex">
        <div className="px-5 py-4 text-lg font-semibold text-brand-800">{APP_NAME}</div>
        <nav className="flex-1 space-y-0.5 px-3" aria-label="Main">
          {items.map((item) => (
            <SideLink key={item.to} item={item} />
          ))}
        </nav>
        <div className="border-t border-stone-200 p-3">
          <NavLink to="/account" className={sideLinkClass}>
            <CircleUser className="size-5" /> {t('nav.account')}
          </NavLink>
          <button type="button" onClick={() => void supabase.auth.signOut()} className={cn(sideLinkClass({ isActive: false }), 'w-full')}>
            <LogOut className="size-5" /> {t('common.signOut')}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-[env(safe-area-inset-top,0px)] z-20 flex items-center gap-3 border-b border-stone-200 bg-white/95 px-4 py-2.5 backdrop-blur">
          <span className="font-semibold text-brand-800 lg:hidden">{APP_NAME}</span>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            {farms.length > 1 ? (
              <Select
                aria-label="Current farm"
                className="min-h-9 max-w-52 py-1"
                value={current?.id}
                onChange={(e) => selectFarm(e.target.value)}
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </Select>
            ) : (
              <span className="truncate text-sm font-medium">{current?.name}</span>
            )}
            {role && <span className="hidden rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-800 sm:inline">{t(`role.${role}`)}</span>}
            <Link to="/account" className="rounded-full p-1.5 text-stone-600 hover:bg-stone-100 lg:hidden" aria-label={t('nav.account')}>
              <CircleUser className="size-6" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-28 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main"
        className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
      >
        {moreOpen && overflow.length > 0 && (
          <div className="grid grid-cols-2 gap-1 border-b border-stone-200 p-2">
            {overflow.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setMoreOpen(false)} className={sideLinkClass}>
                <item.icon className="size-5" /> {t(item.labelKey)}
              </NavLink>
            ))}
          </div>
        )}
        <div className="flex">
          {tabs.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                cn('flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]', isActive ? 'text-brand-700' : 'text-stone-500')
              }
            >
              <item.icon className="size-5" />
              <span className="max-w-full truncate px-1">{t(item.labelKey)}</span>
            </NavLink>
          ))}
          {overflow.length > 0 && (
            <button
              type="button"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((o) => !o)}
              className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-stone-500"
            >
              {moreOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              {t('nav.more')}
            </button>
          )}
        </div>
      </nav>
    </div>
  )
}

function sideLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium',
    isActive ? 'bg-brand-50 text-brand-800' : 'text-stone-700 hover:bg-stone-100',
  )
}

function SideLink({ item }: { item: NavItem }) {
  const { t } = useTranslation()
  return (
    <NavLink to={item.to} end={item.to === '/'} className={sideLinkClass}>
      <item.icon className="size-5" />
      <span className="flex-1">{t(item.labelKey)}</span>
      {item.phase && <span className="text-[10px] text-stone-400">soon</span>}
    </NavLink>
  )
}
