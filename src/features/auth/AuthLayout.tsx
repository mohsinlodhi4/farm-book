import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { APP_NAME } from '@/lib/utils'

export function AuthLayout({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-2xl font-semibold text-brand-800">{APP_NAME}</p>
        <Card className="space-y-5">
          <h1 className="text-lg font-semibold">{title}</h1>
          {children}
        </Card>
        {footer && <div className="mt-4 text-center text-sm text-stone-600">{footer}</div>}
      </div>
    </div>
  )
}
