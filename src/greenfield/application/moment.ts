import { getGreenfieldSupabase } from '../adapters/supabase/client'
import { emitOperationalLog } from '../kernel/observability'
import { newTraceId } from '../kernel/trace'
import type { MomentConstellation } from './embryo'

export async function composeMomentConstellation(
  episodeId: string,
  capacityKeys?: string[] | null,
  locale = 'es-AR',
  limit = 12,
): Promise<MomentConstellation> {
  const traceId = newTraceId()
  const { data, error } = await getGreenfieldSupabase().rpc('lumen_s1_moment_constellation', {
    p_episode_id: episodeId,
    p_locale: locale,
    p_limit: limit,
    p_trace_id: traceId,
    p_capacity_keys: capacityKeys?.length ? capacityKeys : null,
  })
  if (error) {
    emitOperationalLog('error', 'moment.constellation.failed', traceId, { code: error.code })
    throw error
  }
  emitOperationalLog('info', 'moment.constellation.ok', traceId, { item_count: Array.isArray((data as MomentConstellation | null)?.items) ? (data as MomentConstellation).items.length : 0 })
  return data as MomentConstellation
}
