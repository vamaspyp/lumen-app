import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js'

export type GreenfieldSupabase = SupabaseClient
export type GreenfieldSession = Session
export type GreenfieldUser = User

let singleton: GreenfieldSupabase | null = null

type GreenfieldPublicEnv =
  | 'VITE_LUMEN_SUPABASE_URL'
  | 'VITE_LUMEN_SUPABASE_PUBLISHABLE_KEY'

function env(name: GreenfieldPublicEnv): string {
  const value = import.meta.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

/**
 * Vendor adapter only. Domain/application code must never import @supabase/supabase-js directly.
 * The LUMEN-prefixed public config prevents accidental reuse of legacy VITE_SUPABASE_* values.
 * Browser access is limited to explicit public.lumen_* RPCs; gf_core/gf_private/gf_ledger stay internal.
 */
export function getGreenfieldSupabase(): GreenfieldSupabase {
  if (!singleton) {
    singleton = createClient(
      env('VITE_LUMEN_SUPABASE_URL'),
      env('VITE_LUMEN_SUPABASE_PUBLISHABLE_KEY'),
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    )
  }
  return singleton
}
