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

export async function requestEmailOtp(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !normalized.includes('@')) throw new Error('A valid email is required')

  const traceId = newTraceId()
  const supabase = getGreenfieldSupabase()
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
  })

  if (error) {
    emitOperationalLog('error', 'foundation.auth.email_otp.failed', traceId, { code: error.code })
    throw error
  }

  emitOperationalLog('info', 'foundation.auth.email_otp.requested', traceId)
}

export async function verifyEmailOtp(email: string, token: string): Promise<AuthSnapshot> {
  const normalized = email.trim().toLowerCase()
  const normalizedToken = token.replace(/\D/g, '')
  if (!normalized || !normalized.includes('@')) throw new Error('A valid email is required')
  if (normalizedToken.length !== 6) throw new Error('A 6 digit code is required')

  const traceId = newTraceId()
  const supabase = getGreenfieldSupabase()
  const { data, error } = await supabase.auth.verifyOtp({
    email: normalized,
    token: normalizedToken,
    type: 'email',
  })

  if (error) {
    emitOperationalLog('error', 'foundation.auth.email_otp.verify_failed', traceId, { code: error.code })
    throw error
  }

  emitOperationalLog('info', 'foundation.auth.email_otp.verified', traceId)
  return { session: data.session, user: data.user }
}

// Compatibility alias while callers migrate. This no longer sends a clickable link.
export async function requestMagicLink(email: string): Promise<void> {
  return requestEmailOtp(email)
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
