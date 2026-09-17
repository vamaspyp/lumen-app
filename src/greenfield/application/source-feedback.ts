import { getGreenfieldSupabase } from '../adapters/supabase/client'
import { newTraceId } from '../kernel/trace'

export type DirectSourceExperience = {
  episode_id: string
  moment_id: string
  decision_run_id: string
  selection_id: string
  help_id: string
  help_version_id: string
  trace_id: string
}

export async function beginDirectSourceExperience(
  helpId: string,
  locale = 'es-AR',
  language = 'es',
): Promise<DirectSourceExperience> {
  const { data, error } = await getGreenfieldSupabase().rpc('lumen_source_begin_experience', {
    p_help_id: helpId,
    p_locale: locale,
    p_language: language,
    p_trace_id: newTraceId(),
  })
  if (error) throw new Error(error.message)
  if (!data || typeof data !== 'object') throw new Error('Invalid direct Source experience response')
  return data as DirectSourceExperience
}