import type { Circle, ContinuitySnapshot, ProactivitySnapshot, SanctuaryEntry, SourceItem } from '../greenfield/application/embryo'

export type ContextTarget = 'life' | 'explore' | 'sanctuary' | 'tissue' | 'notifications'

export type ContextCue = Readonly<{
  key: string
  origin: 'followup' | 'faro' | 'repertoire' | 'sanctuary' | 'source' | 'tissue'
  title: string
  text: string
  target: ContextTarget
  sourceHelpId?: string
}>

function activeTrajectory(snapshot: ContinuitySnapshot | null) {
  return snapshot?.trajectories?.find((trajectory) => trajectory.status === 'active') ?? snapshot?.trajectories?.[0] ?? null
}

export function activeCapabilityKeys(snapshot: ContinuitySnapshot | null): string[] {
  return activeTrajectory(snapshot)?.capability_keys ?? []
}

function itemCapabilityKeys(item: SourceItem): string[] {
  return [...new Set([...(item.capacities ?? []), ...(item.capacity_key ? [item.capacity_key] : [])])]
}

export function relatedSourceToActiveLife(source: SourceItem[], snapshot: ContinuitySnapshot | null, limit = 4): SourceItem[] {
  const wanted = new Set(activeCapabilityKeys(snapshot))
  if (!wanted.size) return []
  return source
    .filter((item) => itemCapabilityKeys(item).some((key) => wanted.has(key)))
    .sort((a, b) => Number(Boolean(b.from_own_repertoire)) - Number(Boolean(a.from_own_repertoire)) || (b.applicability_confidence ?? 0) - (a.applicability_confidence ?? 0))
    .slice(0, limit)
}

export function relatedSanctuaryToActiveLife(entries: SanctuaryEntry[], source: SourceItem[], snapshot: ContinuitySnapshot | null, limit = 3): SanctuaryEntry[] {
  const relatedHelpIds = new Set(relatedSourceToActiveLife(source, snapshot, source.length).map((item) => item.help_id))
  if (!relatedHelpIds.size) return []
  return entries.filter((entry) => Boolean(entry.source_help_id && relatedHelpIds.has(entry.source_help_id))).slice(0, limit)
}

export function relatedCirclesToActiveLife(circles: Circle[], source: SourceItem[], snapshot: ContinuitySnapshot | null, limit = 3): Circle[] {
  const relatedHelpIds = new Set(relatedSourceToActiveLife(source, snapshot, source.length).map((item) => item.help_id))
  if (!relatedHelpIds.size) return []
  return circles.filter((circle) => circle.contributions.some((contribution) => relatedHelpIds.has(contribution.help_id))).slice(0, limit)
}

function excerpt(value: string, max = 86) {
  const clean = value.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`
}

export function composeHomeCues(input: {
  snapshot: ContinuitySnapshot | null
  source: SourceItem[]
  entries: SanctuaryEntry[]
  circles: Circle[]
  proactivity: ProactivitySnapshot | null
  limit?: number
}): ContextCue[] {
  const { snapshot, source, entries, circles, proactivity, limit = 5 } = input
  const cues: ContextCue[] = []
  const trajectory = activeTrajectory(snapshot)
  const followup = proactivity?.followups?.find((item) => item.status === 'due') ?? proactivity?.followups?.[0]
  const repertoire = snapshot?.repertoire?.[0]
  const sanctuary = relatedSanctuaryToActiveLife(entries, source, snapshot, 1)[0] ?? entries.find((entry) => entry.entry_kind === 'reflection') ?? entries[0]
  const relatedSource = relatedSourceToActiveLife(source, snapshot, 1)[0]
  const relatedCircle = relatedCirclesToActiveLife(circles, source, snapshot, 1)[0] ?? circles[0]

  if (followup) cues.push({
    key: `followup:${followup.followup_id}`,
    origin: 'followup',
    title: 'Un retorno que acordaste',
    text: followup.status === 'due' ? 'Hay algo a lo que elegiste volver.' : 'LUMEN puede volver cuando llegue el momento que elegiste.',
    target: 'notifications',
  })

  if (trajectory) cues.push({
    key: `faro:${trajectory.trajectory_id}`,
    origin: 'faro',
    title: 'Tu Faro sigue disponible',
    text: excerpt(trajectory.faro_text),
    target: 'life',
  })

  if (repertoire) cues.push({
    key: `repertoire:${repertoire.repertoire_id}`,
    origin: 'repertoire',
    title: 'Algo que ya es tuyo',
    text: excerpt(repertoire.title),
    target: 'life',
  })

  if (sanctuary) cues.push({
    key: `sanctuary:${sanctuary.entry_id}`,
    origin: 'sanctuary',
    title: sanctuary.entry_kind === 'reflection' ? 'Una reflexión que guardaste' : 'Algo que elegiste conservar',
    text: excerpt(sanctuary.title || sanctuary.content),
    target: 'sanctuary',
  })

  if (relatedSource) cues.push({
    key: `source:${relatedSource.help_id}`,
    origin: 'source',
    title: 'Relacionado con tu Faro',
    text: excerpt(relatedSource.title),
    target: 'explore',
    sourceHelpId: relatedSource.help_id,
  })

  if (relatedCircle) cues.push({
    key: `tissue:${relatedCircle.space_id}`,
    origin: 'tissue',
    title: 'Una vida con la que ya hay vínculo',
    text: excerpt(relatedCircle.name),
    target: 'tissue',
  })

  return cues.slice(0, Math.max(1, limit))
}
