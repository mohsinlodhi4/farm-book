import type { Session } from '@supabase/supabase-js'
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { AuthContext, FarmContext, useAuth, type FarmState, type FarmSummary } from './contexts'
import { supabase } from '@/lib/supabase'
import { storage } from '@/lib/utils'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
})

const CURRENT_FARM_KEY = 'farmbook.currentFarm'

function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const client = useQueryClient()

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      // Never show one user's cached farm data to the next user on a shared phone.
      if (event === 'SIGNED_OUT') client.clear()
    })
    return () => data.subscription.unsubscribe()
  }, [client])

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>
}

function FarmProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id
  const [selectedId, setSelectedId] = useState(() => storage.get(CURRENT_FARM_KEY))

  const query = useQuery({
    queryKey: ['my-farms', userId],
    enabled: !!userId,
    queryFn: async (): Promise<FarmSummary[]> => {
      const { data, error } = await supabase
        .from('farm_memberships')
        .select('role, farm:farms(id, name, category, timezone, currency, settings)')
        .eq('user_id', userId!)
        .eq('active', true)
      if (error) throw error
      return data
        .filter((m) => m.farm)
        .map((m) => ({ ...m.farm!, role: m.role }))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
  })

  const value = useMemo<FarmState>(() => {
    const farms = query.data ?? []
    const current = farms.find((f) => f.id === selectedId) ?? farms[0] ?? null
    return {
      farms,
      current,
      role: current?.role ?? null,
      loading: !!userId && query.isPending,
      selectFarm: (farmId) => {
        storage.set(CURRENT_FARM_KEY, farmId)
        setSelectedId(farmId)
      },
      refresh: () => query.refetch(),
    }
  }, [query, selectedId, userId])

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FarmProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </FarmProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
