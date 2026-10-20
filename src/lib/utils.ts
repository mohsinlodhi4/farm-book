import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const APP_NAME = 'FarmBook'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Reads a Supabase/Postgres error into a message that is safe to show to the user. */
export function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Something went wrong. Please try again.'
}

/** Only allow same-app relative redirects, never another origin. */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

/** localStorage can throw (private mode, blocked storage); treat failures as "no value". */
export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) localStorage.removeItem(key)
      else localStorage.setItem(key, value)
    } catch {
      // ignore
    }
  },
}
