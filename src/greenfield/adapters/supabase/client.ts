import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type GreenfieldSupabase = SupabaseClient

let singleton: GreenfieldSupabase | null = null

function env(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  const value = import.meta.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

/**
 * Vendor adapter only. Domain/application code must never import @supabase/supabase-js directly.
 * gf_core is the only browser-visible greenfield schema; gf_private/gf_ledger stay server-only.
 */
export function getGreenfieldSupabase(): GreenfieldSupabase {
  if (!singleton) {
    singleton = createClient(env('VITE_SUPABASE_URL'), env('VITE_SUPABASE_ANON_KEY'), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return singleton
}
