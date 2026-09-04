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

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !normalized.includes('@')) throw new Error('A valid email is required')
  return normalized
}

export async function getAuthSnapshot(): Promise<AuthSnapshot> {
  const supabase = getGreenfieldSupabase()
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return { session: data.session, user: data.session?.user ?? null }
}

export async function requestEmailCode(email: string): Promise<void> {
  const normalized = normalizeEmail(email)
  const traceId = newTraceId()
  const { error } = await getGreenfieldSupabase().auth.signInWithOtp({ email: normalized })

  if (error) {
    emitOperationalLog('error', 'foundation.auth.email_otp.failed', traceId, { code: error.code })
    throw error
  }

  emitOperationalLog('info', 'foundation.auth.email_otp.requested', traceId)
}

export async function verifyEmailCode(email: string, token: string): Promise<void> {
  const normalized = normalizeEmail(email)
  const cleanToken = token.trim()
  if (!/^\d{6}$/.test(cleanToken)) throw new Error('El código debe tener 6 dígitos')

  const traceId = newTraceId()
  const { data, error } = await getGreenfieldSupabase().auth.verifyOtp({
    email: normalized,
    token: cleanToken,
    type: 'email',
  })

  if (error) {
    emitOperationalLog('error', 'foundation.auth.email_otp.verify_failed', traceId, { code: error.code })
    throw error
  }
  if (!data.session || !data.user) throw new Error('No se pudo abrir una sesión con ese código')

  emitOperationalLog('info', 'foundation.auth.email_otp.verified', traceId)
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
