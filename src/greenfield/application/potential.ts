import { getGreenfieldSupabase } from '../adapters/supabase/client'

/** A63 / V53: open, person-correctable manifestations; never a scored capability taxonomy. */
export type PotentialManifestation = {
  id: string
  text: string
  status: 'candidate' | 'confirmed'
  source_kind: string
  revision: number
  updated_at: string
}

export type PotentialSnapshot = {
  memory_allowed: boolean
  potential: string | null
  manifestations: PotentialManifestation[]
}

export async function getPotentialSnapshot(): Promise<PotentialSnapshot> {
  const { data, error } = await getGreenfieldSupabase().rpc('lumen_potential_snapshot')
  if (error) throw error
  return data as PotentialSnapshot
}

export async function savePotentialManifestation(
  text: string,
  inferenceId?: string | null,
): Promise<{ state: 'success'; id: string; status: 'confirmed' }> {
  const { data, error } = await getGreenfieldSupabase().rpc('lumen_potential_manifestation_set', {
    p_text: text,
    p_inference_id: inferenceId ?? null,
    p_reject: false,
  })
  if (error) throw error
  return data as { state: 'success'; id: string; status: 'confirmed' }
}

export async function rejectPotentialManifestation(
  inferenceId: string,
): Promise<{ state: 'success'; id: string; status: 'rejected' }> {
  const { data, error } = await getGreenfieldSupabase().rpc('lumen_potential_manifestation_set', {
    p_text: '',
    p_inference_id: inferenceId,
    p_reject: true,
  })
  if (error) throw error
  return data as { state: 'success'; id: string; status: 'rejected' }
}
