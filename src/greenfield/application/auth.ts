import {
  getGreenfieldSupabase,
  type GreenfieldSession,
  type GreenfieldUser,
} from '../adapters/supabase/client'

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

export async function requestMagicLink(email: string, redirectTo?: string): Promise<void> {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !normalized.includes('@')) throw new Error('A valid email is required')

  const supabase = getGreenfieldSupabase()
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
  })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const { error } = await getGreenfieldSupabase().auth.signOut()
  if (error) throw error
}
