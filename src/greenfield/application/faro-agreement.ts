import { getGreenfieldSupabase } from '../adapters/supabase/client'
import type { SourceItem } from './embryo'

export type FaroPotential = {
  identity_id: string
  concept_id: string | null
  label: string
  definition: string
  contextual_meaning: string
  origin: 'person' | 'lumi'
  status: 'accepted' | 'reformulated' | 'withdrawn'
  source_status?: 'candidate' | 'reviewed' | null
  reason?: string
}
export type FaroAgreement = {
  state: 'validated' | 'unvalidated' | 'stale' | 'without_memory'
  version: number
  original_expression?: string | null
  faro_text?: string
  area_keys?: string[]
  validated_at?: string | null
  items: FaroPotential[]
  history: Array<{version:number;faro_text:string;validated_at:string;items:Array<{label:string;status:string}>}>
}
async function call<T>(name:string,params:Record<string,unknown>):Promise<T> {
  const {data,error}=await getGreenfieldSupabase().rpc(name,params)
  if(error)throw new Error(error.code==='40001'?'Este Faro cambió. Volvé a abrirlo antes de confirmar.':error.message)
  return data as T
}
export const getFaroAgreement=(trajectoryId:string)=>call<FaroAgreement>('lumen_faro_agreement_snapshot',{p_trajectory_id:trajectoryId})
export const proposeFaroPotentials=(expression:string)=>call<{state:string;items:FaroPotential[];message:string}>('lumen_faro_potential_proposal',{p_expression:expression})
export const validateFaroAgreement=(trajectoryId:string,faroText:string,items:FaroPotential[],areaKeys:string[],expectedVersion:number)=>call<FaroAgreement>('lumen_faro_agreement_validate',{p_trajectory_id:trajectoryId,p_faro_text:faroText,p_items:items,p_area_keys:areaKeys,p_expected_version:expectedVersion})
export const composeFaroConstellation=(trajectoryId:string,version:number,minutes:number)=>call<{state:'success'|'no_match'|'agreement_required';items:SourceItem[];message?:string}>('lumen_faro_constellation',{p_trajectory_id:trajectoryId,p_expected_version:version,p_available_minutes:minutes,p_locale:'es-AR'})
