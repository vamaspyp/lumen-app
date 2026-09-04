import { getGreenfieldSupabase } from '../adapters/supabase/client'
import { emitOperationalLog } from '../kernel/observability'
import { newTraceId } from '../kernel/trace'

export const CONSENT_SCOPES = ['proactivity', 'memory', 'evidence_use', 'sharing'] as const
export type ConsentScope = (typeof CONSENT_SCOPES)[number]

export type PrivacyPreferences = Readonly<{
  proactive_allowed: boolean
  memory_allowed: boolean
  evidence_use_allowed: boolean
  sharing_allowed: boolean
  revision: number
}>

export type ConsentGrantState = Readonly<{
  granted: boolean
  terms_version: string
  created_at: string
}>

export type PersonBootstrapState = Readonly<{
  person_id: string
  preferences: PrivacyPreferences
}>

export type ConsentState = Readonly<{
  person_id: string
  preferences: PrivacyPreferences
  grants: Partial<Record<ConsentScope, ConsentGrantState>>
}>

export async function bootstrapPerson(): Promise<PersonBootstrapState> {
  const traceId = newTraceId()
  const { data, error } = await getGreenfieldSupabase().rpc('lumen_bootstrap_person', {
    p_trace_id: traceId,
  })

  if (error) {
    emitOperationalLog('error', 'foundation.person.bootstrap.failed', traceId, { code: error.code })
    throw error
  }

  emitOperationalLog('info', 'foundation.person.bootstrapped', traceId)
  return data as PersonBootstrapState
}

export async function getConsentState(): Promise<ConsentState | null> {
  const traceId = newTraceId()
  const { data, error } = await getGreenfieldSupabase().rpc('lumen_get_consent_state')

  if (error) {
    emitOperationalLog('error', 'foundation.consent.read.failed', traceId, { code: error.code })
    throw error
  }

  emitOperationalLog('info', 'foundation.consent.read', traceId, { found: data !== null })
  return data as ConsentState | null
}

export async function setConsent(
  scope: ConsentScope,
  granted: boolean,
  termsVersion: string,
): Promise<ConsentState> {
  const traceId = newTraceId()
  const normalizedTerms = termsVersion.trim()
  if (!normalizedTerms) throw new Error('termsVersion is required')

  const { data, error } = await getGreenfieldSupabase().rpc('lumen_set_consent', {
    p_scope: scope,
    p_granted: granted,
    p_terms_version: normalizedTerms,
    p_trace_id: traceId,
  })

  if (error) {
    emitOperationalLog('error', 'foundation.consent.write.failed', traceId, {
      scope,
      granted,
      code: error.code,
    })
    throw error
  }

  emitOperationalLog('info', 'foundation.consent.changed', traceId, { scope, granted })
  return data as ConsentState
}
