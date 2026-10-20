import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const control =
  'block w-full min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-base sm:text-sm ' +
  'placeholder:text-stone-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 ' +
  'aria-[invalid=true]:border-red-500 disabled:bg-stone-100'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, className)} {...props} />
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(control, 'pr-8', className)} {...props} />
}

type FieldProps = {
  label: string
  error?: string
  hint?: string
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode
}

/** Label + control + error/hint, wired up for screen readers. */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId()
  const describedBy = error || hint ? `${id}-desc` : undefined
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': describedBy })}
      {(error || hint) && (
        <p id={describedBy} className={cn('text-sm', error ? 'text-red-600' : 'text-stone-500')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
