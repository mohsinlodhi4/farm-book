import type { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'
import type { FarmCategory, FarmRole, Tables } from '@/lib/supabase'

export type AuthState = { session: Session | null; loading: boolean }
export const AuthContext = createContext<AuthState>({ session: null, loading: true })
export const useAuth = () => useContext(AuthContext)

export type FarmSummary = Pick<Tables<'farms'>, 'id' | 'name' | 'timezone' | 'currency' | 'settings'> & {
  category: FarmCategory
  role: FarmRole
}

export type FarmState = {
  farms: FarmSummary[]
  current: FarmSummary | null
  role: FarmRole | null
  loading: boolean
  selectFarm: (farmId: string) => void
  refresh: () => Promise<unknown>
}

export const FarmContext = createContext<FarmState | null>(null)

export function useFarm(): FarmState {
  const ctx = useContext(FarmContext)
  if (!ctx) throw new Error('useFarm must be used inside FarmProvider')
  return ctx
}

/** For pages rendered under RequireFarm, where a current farm is guaranteed. */
export function useCurrentFarm(): FarmSummary & { farmId: string } {
  const { current } = useFarm()
  if (!current) throw new Error('No farm selected')
  return { ...current, farmId: current.id }
}
