import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useAuth, useFarm } from '@/app/contexts'
import { Button } from '@/components/ui/button'
import { ErrorNote, Spinner } from '@/components/ui/card'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'

export function AcceptInvitePage() {
  const { token = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { refresh, selectFarm } = useFarm()

  const invite = useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_invitation', { p_token: token })
      if (error) throw error
      return data[0] ?? null
    },
  })

  const accept = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('accept_invitation', { p_token: token })
      if (error) throw error
      return data
    },
    onSuccess: async (farmId) => {
      selectFarm(farmId)
      await refresh()
      toast.success('You have joined the farm')
      navigate('/', { replace: true })
    },
  })

  if (invite.isPending) return <Spinner />

  const inv = invite.data
  const myEmail = session?.user.email?.toLowerCase()
  let problem: string | null = null
  if (invite.isError) problem = errorMessage(invite.error)
  else if (!inv) problem = 'This invitation link is not valid.'
  else if (inv.accepted) problem = 'This invitation has already been used.'
  else if (inv.expired) problem = 'This invitation has expired. Ask the farm owner to send a new one.'
  else if (inv.email !== myEmail)
    problem = `This invitation was sent to ${inv.email}, but you are signed in as ${myEmail}. Sign in with the invited email.`

  return (
    <AuthLayout title="Farm invitation">
      {problem ? (
        <>
          <ErrorNote>{problem}</ErrorNote>
          <Button variant="secondary" className="w-full" onClick={() => void supabase.auth.signOut()}>
            {t('common.signOut')}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-stone-700">
            You have been invited to join <strong>{inv!.farm_name}</strong> as <strong>{t(`role.${inv!.role}`)}</strong>.
          </p>
          {accept.isError && <ErrorNote>{errorMessage(accept.error)}</ErrorNote>}
          <Button className="w-full" disabled={accept.isPending} onClick={() => accept.mutate()}>
            {accept.isPending ? 'Joining…' : 'Accept invitation'}
          </Button>
        </>
      )}
    </AuthLayout>
  )
}
