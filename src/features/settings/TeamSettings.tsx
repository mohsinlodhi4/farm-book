import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth, useCurrentFarm } from '@/app/contexts'
import { Button } from '@/components/ui/button'
import { Badge, Card, Spinner } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/field'
import { supabase, type FarmRole } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'

const ROLES: FarmRole[] = ['owner', 'manager', 'accountant', 'worker']

const nowIso = () => new Date().toISOString()

export function TeamSettings() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Members />
      <Invitations />
    </div>
  )
}

function Members() {
  const { t } = useTranslation()
  const { farmId } = useCurrentFarm()
  const { session } = useAuth()
  const client = useQueryClient()
  const queryKey = ['members', farmId]

  const members = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: memberships, error } = await supabase
        .from('farm_memberships')
        .select('id, user_id, role, active')
        .eq('farm_id', farmId)
        .order('created_at')
      if (error) throw error
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', memberships.map((m) => m.user_id))
      if (pError) throw pError
      const byUser = new Map(profiles.map((p) => [p.user_id, p]))
      return memberships.map((m) => ({ ...m, profile: byUser.get(m.user_id) }))
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, ...change }: { id: string; role?: FarmRole; active?: boolean }) => {
      const { error } = await supabase.from('farm_memberships').update(change).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => void client.invalidateQueries({ queryKey }),
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <Card>
      <h2 className="mb-3 font-semibold">Team members</h2>
      {members.isPending ? (
        <Spinner />
      ) : members.isError ? (
        <p className="text-sm text-red-600">{errorMessage(members.error)}</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {members.data.map((m) => {
            const isMe = m.user_id === session?.user.id
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className={m.active ? 'text-sm font-medium' : 'text-sm font-medium text-stone-400'}>
                    {m.profile?.full_name || m.profile?.email || 'Unknown user'} {isMe && <Badge>You</Badge>}
                  </p>
                  <p className="truncate text-xs text-stone-500">{m.profile?.email}</p>
                </div>
                <Select
                  aria-label="Role"
                  className="min-h-9 w-36"
                  value={m.role}
                  disabled={update.isPending}
                  onChange={(e) => update.mutate({ id: m.id, role: e.target.value as FarmRole })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{t(`role.${r}`)}</option>
                  ))}
                </Select>
                {!isMe && (
                  <Button size="sm" variant="ghost" disabled={update.isPending} onClick={() => update.mutate({ id: m.id, active: !m.active })}>
                    {m.active ? 'Remove access' : 'Restore access'}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function Invitations() {
  const { t } = useTranslation()
  const { farmId } = useCurrentFarm()
  const client = useQueryClient()
  const queryKey = ['invitations', farmId]
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<FarmRole>('worker')
  const [link, setLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const pending = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farm_invitations')
        .select('id, email, role, expires_at')
        .eq('farm_id', farmId)
        .is('accepted_at', null)
        .gt('expires_at', nowIso())
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const invite = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return toast.error('Enter a valid email')
    setBusy(true)
    const { data: token, error } = await supabase.rpc('create_invitation', { p_farm: farmId, p_email: email, p_role: role })
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    setLink(`${window.location.origin}/invite/${token}`)
    setEmail('')
    void client.invalidateQueries({ queryKey })
  }

  const revoke = async (id: string) => {
    const { error } = await supabase.from('farm_invitations').delete().eq('id', id)
    if (error) return toast.error(errorMessage(error))
    void client.invalidateQueries({ queryKey })
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link!)
      toast.success('Link copied')
    } catch {
      toast.error('Copy failed. Select the link and copy it manually.')
    }
  }

  return (
    <Card>
      <h2 className="mb-1 font-semibold">Invite someone</h2>
      <p className="mb-4 text-sm text-stone-600">
        Send the invitation link by WhatsApp or SMS. The person signs up with the same email to join. Links expire after 7 days.
      </p>
      <form onSubmit={invite} className="space-y-3" noValidate>
        <Field label="Email">{(p) => <Input {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
        <Field label="Role">
          {(p) => (
            <Select {...p} value={role} onChange={(e) => setRole(e.target.value as FarmRole)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{t(`role.${r}`)}</option>
              ))}
            </Select>
          )}
        </Field>
        <Button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create invitation link'}
        </Button>
      </form>

      {link && (
        <div className="mt-4 rounded-lg bg-brand-50 p-3 text-sm">
          <p className="mb-2 font-medium text-brand-800">Invitation link (shown once)</p>
          <div className="flex gap-2">
            <Input readOnly value={link} onFocus={(e) => e.target.select()} className="min-h-9 font-mono text-xs" aria-label="Invitation link" />
            <Button size="sm" variant="secondary" onClick={copy} aria-label="Copy link">
              <Copy className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {pending.data && pending.data.length > 0 && (
        <>
          <h3 className="mt-5 mb-2 text-sm font-semibold">Pending invitations</h3>
          <ul className="divide-y divide-stone-100">
            {pending.data.map((inv) => (
              <li key={inv.id} className="flex items-center gap-2 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{inv.email}</span>
                <Badge>{t(`role.${inv.role}`)}</Badge>
                <Button size="sm" variant="ghost" onClick={() => void revoke(inv.id)}>
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}
