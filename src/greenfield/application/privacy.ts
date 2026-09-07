import { getGreenfieldSupabase } from '../adapters/supabase/client'
import { newTraceId } from '../kernel/trace'

export type MomentOriginalExport = Readonly<{
  export_version: string
  generated_at: string
  shared_learning_default: boolean
  items: Array<{
    moment_id: string
    expression: string
    retention_policy: string
    received_at: string
    locale: string
    language: string
    surface: string
    interpreter_version: string | null
    intent_key: string | null
    need_keys: string[]
    confidence: number | null
    uncertainty_key: string | null
  }>
}>

export async function exportMomentOriginals(): Promise<MomentOriginalExport> {
  const { data, error } = await getGreenfieldSupabase().rpc('lumen_privacy_export_moment_originals')
  if (error) throw error
  return data as MomentOriginalExport
}

export async function deleteMomentOriginals(): Promise<{ deleted_count: number; trace_id: string }> {
  const { data, error } = await getGreenfieldSupabase().rpc('lumen_privacy_delete_moment_originals', {
    p_trace_id: newTraceId(),
  })
  if (error) throw error
  return data as { deleted_count: number; trace_id: string }
}
