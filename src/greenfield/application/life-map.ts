import { getGreenfieldSupabase } from '../adapters/supabase/client'
export type LifeMapSnapshot = {
 memory_allowed: boolean
 direction: Array<{faro_id: string; text: string; status: string}>
 potential: Array<{resource_id: string; help_id: string; user_confirmed: boolean}>
 conditions: Array<{features: Record<string, unknown>; confidence: number | null}>
 realization: Array<{outcome_id: string; help_id: string; effect: string; applied: boolean; signal_kind?: string; lived_at?: string}>
 epistemic_note: string
}
export async function getLifeMap(): Promise<LifeMapSnapshot>{
 const {data,error}=await getGreenfieldSupabase().rpc('lumen_living_map_snapshot')
 if(error) throw error
 return data
}
