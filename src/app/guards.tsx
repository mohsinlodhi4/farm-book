import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router'
import { canAccess } from './nav'
import { useAuth, useFarm } from './contexts'
import { Card, Spinner } from '@/components/ui/card'
import { safeNext } from '@/lib/utils'

export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return <Outlet />
}

export function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const params = new URLSearchParams(useLocation().search)
  if (loading) return <Spinner />
  if (session) return <Navigate to={safeNext(params.get('next'))} replace />
  return children
}

/** Sends users without any farm to onboarding. */
export function RequireFarm() {
  const { current, loading } = useFarm()
  if (loading) return <Spinner />
  if (!current) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

export function RequireRole({ path, children }: { path: string; children: ReactNode }) {
  const { role } = useFarm()
  const { t } = useTranslation()
  if (!canAccess(path, role)) {
    return <Card className="text-center text-stone-600">{t('common.noAccess')}</Card>
  }
  return children
}
