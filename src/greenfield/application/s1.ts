import { getGreenfieldSupabase } from '../adapters/supabase/client'
import { newTraceId } from '../kernel/trace'

export type PresenceMode = 'P0' | 'P1' | 'P2' | 'P3' | 'P4'

export type HelpPossibility = {
  help_id: string
  help_type: string
  title: string
  summary: string
  content: Record<string, unknown>
  duration_minutes: number | null
  energy: string | null
  detail: Record<string, unknown>
}

export type SemanticBlock = Record<string, unknown> & {
  type?: string
  semantic_key?: string
}

export type SceneAction = {
  id: string
  intent: string
  payload?: Record<string, unknown>
}

export type S1Scene = {
  scene_id: string
  scene_version: string
  presence_mode: PresenceMode
  human_intent?: string | null
  episode_id?: string
  moment_id?: string
  decision_run_id?: string
  trace_id?: string
  semantic_blocks?: SemanticBlock[]
  available_actions?: SceneAction[]
  safety?: { state?: string }
  coverage?: { state?: string; reason?: string }
  interpretation?: {
    intent_key?: string | null
    confidence?: number | null
    uncertainty_key?: string | null
  }
}

export type SelectionResult = {
  episode_id: string
  action: 'selected' | 'rejected'
  help: HelpPossibility
  trace_id: string
}

export type OutcomeEffect = 'helped' | 'not_helped' | 'unsure'

export type OutcomeResult = {
  episode_id: string
  effect: OutcomeEffect
  applied: boolean
  trace_id: string
  semantic_key: string
}

function assertRpcData<T>(data: unknown, error: { message: string } | null): T {
  if (error) throw new Error(error.message)
  if (!data || typeof data !== 'object') throw new Error('Invalid S1 response')
  return data as T
}

export async function accompanyMoment(
  expression: string,
  locale = 'es-AR',
  language = 'es',
): Promise<S1Scene> {
  const { data, error } = await getGreenfieldSupabase().rpc('lumen_s1_accompany_moment', {
    p_expression: expression,
    p_locale: locale,
    p_language: language,
    p_surface: 'web',
    p_trace_id: newTraceId(),
  })
  return assertRpcData<S1Scene>(data, error)
}

export async function selectHelp(
  episodeId: string,
  helpId: string,
  action: 'selected' | 'rejected',
): Promise<SelectionResult> {
  const { data, error } = await getGreenfieldSupabase().rpc('lumen_s1_select_help', {
    p_episode_id: episodeId,
    p_help_id: helpId,
    p_action: action,
    p_trace_id: newTraceId(),
  })
  return assertRpcData<SelectionResult>(data, error)
}

export async function recordOutcome(
  episodeId: string,
  helpId: string,
  effect: OutcomeEffect,
): Promise<OutcomeResult> {
  const { data, error } = await getGreenfieldSupabase().rpc('lumen_s1_record_outcome', {
    p_episode_id: episodeId,
    p_help_id: helpId,
    p_effect: effect,
    p_applied: true,
    p_trace_id: newTraceId(),
  })
  return assertRpcData<OutcomeResult>(data, error)
}

export function primaryHelpFromScene(scene: S1Scene): HelpPossibility | null {
  const preview = scene.semantic_blocks?.find((block) => block.type === 'help_preview')
  const primary = preview?.primary
  if (!primary || typeof primary !== 'object') return null
  return primary as HelpPossibility
}
