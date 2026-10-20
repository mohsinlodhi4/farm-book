import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from './AppShell'
import { RedirectIfSignedIn, RequireAuth, RequireFarm, RequireRole } from './guards'
import { NAV_ITEMS } from './nav'
import { Spinner } from '@/components/ui/card'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ComingSoonPage } from '@/features/placeholder/ComingSoonPage'

// Less-used screens load on demand to keep the first download small on slow connections.
const AccountPage = lazy(() => import('@/features/account/AccountPage').then((m) => ({ default: m.AccountPage })))
const AcceptInvitePage = lazy(() => import('@/features/invitations/AcceptInvitePage').then((m) => ({ default: m.AcceptInvitePage })))
const CreateFarmPage = lazy(() => import('@/features/onboarding/CreateFarmPage').then((m) => ({ default: m.CreateFarmPage })))
const ForgotPasswordPage = lazy(() => import('@/features/auth/PasswordPages').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/features/auth/PasswordPages').then((m) => ({ default: m.ResetPasswordPage })))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })))

const load = (node: ReactNode) => <Suspense fallback={<Spinner />}>{node}</Suspense>

const comingSoon = NAV_ITEMS.filter((item) => item.phase).map((item) => ({
  path: item.to.slice(1),
  element: (
    <RequireRole path={item.to}>
      <ComingSoonPage item={item} />
    </RequireRole>
  ),
}))

export const router = createBrowserRouter([
  { path: '/login', element: <RedirectIfSignedIn><LoginPage /></RedirectIfSignedIn> },
  { path: '/signup', element: <RedirectIfSignedIn><SignupPage /></RedirectIfSignedIn> },
  { path: '/forgot-password', element: load(<ForgotPasswordPage />) },
  {
    element: <RequireAuth />,
    children: [
      { path: '/reset-password', element: load(<ResetPasswordPage />) },
      { path: '/invite/:token', element: load(<AcceptInvitePage />) },
      { path: '/onboarding', element: load(<CreateFarmPage />) },
      {
        element: <RequireFarm />,
        children: [
          {
            path: '/',
            element: <AppShell />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'account', element: load(<AccountPage />) },
              { path: 'settings', element: <RequireRole path="/settings">{load(<SettingsPage />)}</RequireRole> },
              ...comingSoon,
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
