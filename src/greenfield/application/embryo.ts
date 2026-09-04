import { getGreenfieldSupabase } from '../adapters/supabase/client'
import { emitOperationalLog } from '../kernel/observability'
import { newTraceId } from '../kernel/trace'

export type PathItem = Readonly<{
  path_item_id: string
  help_id: string | null
  label: string
  position: number
  status: 'planned' | 'done' | 'skipped'
}>

export type Trajectory = Readonly<{
  trajectory_id: string
  faro_text: string
  status: 'active' | 'paused' | 'closed'
  path: PathItem[]
}>

export type RepertoireItem = Readonly<{
  repertoire_id: string
  help_id: string
  title: string
  summary: string
  times_reused: number
}>

export type ContinuitySnapshot = Readonly<{
  memory_allowed: boolean
  trajectories: Trajectory[]
  repertoire: RepertoireItem[]
  sanctuary_count: number
}>

export type SanctuaryEntry = Readonly<{
  entry_id: string
  entry_kind: 'treasure' | 'reflection' | 'note'
  title: string | null
  content: string
  source_help_id: string | null
  created_at: string
}>

export type SourceItem = Readonly<{
  help_id: string
  canonical_code: string
  help_type: string
  lifecycle: 'active_limited' | 'active'
  risk_class: string
  evidence_class: string
  title: string
  summary: string
  content: Record<string, unknown>
  duration_minutes: number | null
  energy: string | null
  provider: {
    name: string
    kind: string
    provenance?: Record<string, unknown>
    rights?: Record<string, unknown>
  }
  needs: string[]
  localization_provenance?: Record<string, unknown>
}>

export type CircleContribution = Readonly<{
  contribution_id: string
  help_id: string
  title: string
  summary: string
  from_me: boolean
}>

export type Circle = Readonly<{
  space_id: string
  name: string
  purpose: string
  role: 'host' | 'member'
  member_count: number
  contributions: CircleContribution[]
}>

export type Followup = Readonly<{
  followup_id: string
  reason_code: 'trajectory_checkin' | 'practice_return' | 'circle_return' | 'self_chosen'
  due_at: string
  status: 'scheduled' | 'due'
  channel: 'in_app'
  related_trajectory_id: string | null
  related_help_id: string | null
}>

export type ProactivitySnapshot = Readonly<{
  proactive_allowed: boolean
  settings: {
    quiet_start_hour: number
    quiet_end_hour: number
    timezone: string
    custody_blocked: boolean
  }
  followups: Followup[]
}>

export type EmbryoHealth = Readonly<{
  state: 'forming' | 'operational'
  slices: Record<string, string>
  source: {
    active_possibilities: number
    coverage_cells: number
    semantic_types: number
  }
  evolution: { source_policy_version: number }
  operations: { providers_ready: number }
  prelaunch_reset_required: boolean
}>

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const traceId = newTraceId()
  const { data, error } = await getGreenfieldSupabase().rpc(name, args)
  if (error) {
    emitOperationalLog('error', `embryo.rpc.${name}.failed`, traceId, { code: error.code })
    throw error
  }
  emitOperationalLog('info', `embryo.rpc.${name}.ok`, traceId)
  return data as T
}

export function getContinuitySnapshot(): Promise<ContinuitySnapshot> {
  return rpc('lumen_s2_snapshot')
}

export function setMemory(enabled: boolean): Promise<{ memory_allowed: boolean }> {
  return rpc('lumen_s2_set_memory', { p_enabled: enabled, p_trace_id: newTraceId() })
}

export function listSanctuary(): Promise<SanctuaryEntry[]> {
  return rpc('lumen_s2_list_sanctuary')
}

export function saveSanctuary(entryKind: SanctuaryEntry['entry_kind'], title: string, content: string, sourceHelpId?: string | null) {
  return rpc<{ entry_id: string }>('lumen_s2_save_sanctuary', {
    p_entry_kind: entryKind,
    p_title: title || null,
    p_content: content,
    p_source_help_id: sourceHelpId ?? null,
    p_trace_id: newTraceId(),
  })
}

export function deleteSanctuary(entryId: string) {
  return rpc('lumen_s2_delete_sanctuary', { p_entry_id: entryId, p_trace_id: newTraceId() })
}

export function createTrajectory(faroText: string) {
  return rpc<{ trajectory_id: string }>('lumen_s2_create_trajectory', { p_faro_text: faroText, p_trace_id: newTraceId() })
}

export function updateTrajectory(trajectoryId: string, faroText: string, status: Trajectory['status']) {
  return rpc('lumen_s2_update_trajectory', {
    p_trajectory_id: trajectoryId,
    p_faro_text: faroText,
    p_status: status,
    p_trace_id: newTraceId(),
  })
}

export function integrateHelp(helpId: string) {
  return rpc('lumen_s2_add_repertoire', { p_help_id: helpId, p_trace_id: newTraceId() })
}

export function addPathItem(trajectoryId: string, helpId: string | null, label: string) {
  return rpc('lumen_s2_add_path_item', {
    p_trajectory_id: trajectoryId,
    p_help_id: helpId,
    p_label: label,
    p_trace_id: newTraceId(),
  })
}

export function discoverSource(needKey?: string | null, helpType?: string | null, locale = 'es-AR', limit = 40): Promise<SourceItem[]> {
  return rpc('lumen_source_discover', {
    p_need_key: needKey ?? null,
    p_help_type: helpType ?? null,
    p_locale: locale,
    p_limit: limit,
  })
}

export function getTissueSnapshot(): Promise<Circle[]> {
  return rpc('lumen_s5_snapshot')
}

export function createCircle(name: string, purpose: string) {
  return rpc<{ space_id: string }>('lumen_s5_create_circle', { p_name: name, p_purpose: purpose, p_trace_id: newTraceId() })
}

export function createCircleInvite(spaceId: string) {
  return rpc<{ invite_token: string }>('lumen_s5_create_invite', { p_space_id: spaceId, p_trace_id: newTraceId() })
}

export function joinCircle(inviteToken: string) {
  return rpc('lumen_s5_join_circle', { p_invite_token: inviteToken, p_trace_id: newTraceId() })
}

export function shareHelp(spaceId: string, helpId: string) {
  return rpc('lumen_s5_share_help', { p_space_id: spaceId, p_help_id: helpId, p_trace_id: newTraceId() })
}

export function leaveCircle(spaceId: string) {
  return rpc('lumen_s5_leave_circle', { p_space_id: spaceId, p_trace_id: newTraceId() })
}

export function reportCircle(spaceId: string, reasonCode: 'unsafe' | 'spam' | 'boundary' | 'other') {
  return rpc('lumen_s5_report_circle', { p_space_id: spaceId, p_reason_code: reasonCode, p_trace_id: newTraceId() })
}

export function getProactivitySnapshot(): Promise<ProactivitySnapshot> {
  return rpc('lumen_s6_snapshot')
}

export function setProactivity(enabled: boolean) {
  return rpc('lumen_s6_set_proactivity', { p_enabled: enabled, p_trace_id: newTraceId() })
}

export function scheduleFollowup(reasonCode: Followup['reason_code'], dueAt: string, trajectoryId?: string | null, helpId?: string | null) {
  return rpc<{ followup_id: string }>('lumen_s6_schedule_followup', {
    p_reason_code: reasonCode,
    p_due_at: dueAt,
    p_trajectory_id: trajectoryId ?? null,
    p_help_id: helpId ?? null,
    p_trace_id: newTraceId(),
  })
}

export function cancelFollowup(followupId: string) {
  return rpc('lumen_s6_cancel_followup', { p_followup_id: followupId, p_trace_id: newTraceId() })
}

export function getEmbryoHealth(): Promise<EmbryoHealth> {
  return rpc('lumen_embryo_health')
}
