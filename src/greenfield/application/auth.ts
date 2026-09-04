import {
  getGreenfieldSupabase,
  type GreenfieldSession,
  type GreenfieldUser,
} from '../adapters/supabase/client'
import { emitOperationalLog } from '../kernel/observability'
import { newTraceId } from '../kernel/trace'

export type AuthSnapshot = {
  session: GreenfieldSession | null
  user: GreenfieldUser | null
}

export async function getAuthSnapshot(): Promise<AuthSnapshot> {
  const supabase = getGreenfieldSupabase()
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return { session: data.session, user: data.session?.user ?? null }
}

function canonicalAuthRedirect(candidate?: string): string | undefined {
  const value = candidate?.trim()
  if (!value) return undefined

  const url = new URL(value)
  url.pathname = '/'
  url.search = ''
  url.hash = ''
  return url.toString()
}

export async function requestMagicLink(email: string, redirectTo?: string): Promise<void> {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !normalized.includes('@')) throw new Error('A valid email is required')

  const configuredRedirect = import.meta.env.VITE_LUMEN_AUTH_REDIRECT_URL
  const effectiveRedirect = canonicalAuthRedirect(configuredRedirect || redirectTo)
  const traceId = newTraceId()
  const supabase = getGreenfieldSupabase()
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: effectiveRedirect ? { emailRedirectTo: effectiveRedirect } : undefined,
  })

  if (error) {
    emitOperationalLog('error', 'foundation.auth.magic_link.failed', traceId, { code: error.code })
    throw error
  }

  emitOperationalLog('info', 'foundation.auth.magic_link.requested', traceId)
}

export async function signOut(): Promise<void> {
  const traceId = newTraceId()
  const { error } = await getGreenfieldSupabase().auth.signOut()
  if (error) {
    emitOperationalLog('error', 'foundation.auth.signout.failed', traceId, { code: error.code })
    throw error
  }
  emitOperationalLog('info', 'foundation.auth.signed_out', traceId)
}
