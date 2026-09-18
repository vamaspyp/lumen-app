import type { SourceItem, SourceTaxonomy } from '../greenfield/application/embryo'

export type PremiumConstellation = Readonly<{
  key: string
  capacityKey: string | null
  capacityLabel: string
  items: SourceItem[]
}>

function detail(item: SourceItem): Record<string, unknown> { return item.detail || {} }

export function detailString(item: SourceItem, key: string): string | null {
  const value = detail(item)[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function premiumFamily(item: SourceItem): string | null {
  return detailString(item, 'premium_family')
}

export function constellationKey(item: SourceItem): string | null {
  return detailString(item, 'constellation_key') || detailString(item, 'collection')
}

export function constellationRole(item: SourceItem): string | null {
  return detailString(item, 'constellation_role')
}

export function sourceUrl(item: SourceItem): string | null {
  return detailString(item, 'source_url') || detailString(item, 'external_url')
}

export function premiumConstellations(source: SourceItem[], taxonomy: SourceTaxonomy | null): PremiumConstellation[] {
  const grouped = new Map<string, SourceItem[]>()
  for (const item of source) {
    const key = constellationKey(item)
    if (!key || !premiumFamily(item)) continue
    grouped.set(key, [...(grouped.get(key) || []), item])
  }
  return [...grouped.entries()].map(([key, items]) => {
    const capacityKey = items.map((item) => item.capacity_key || item.capacities?.[0] || null).find(Boolean) || null
    const capacityLabel = taxonomy?.capacities?.find((term) => term.key === capacityKey)?.label || capacityKey || 'Constelación'
    return { key, capacityKey, capacityLabel, items }
  })
}

export function premiumFamilyLabel(item: SourceItem): string {
  const family = premiumFamily(item)
  const labels: Record<string,string> = {
    illustrated_guide: 'Guía esencial',
    audio_practice: 'Práctica guiada',
    contemplative_reading_audio: 'Práctica contemplativa',
    classic_reading: 'Lectura profunda',
    video_or_audio_visual_sequence: 'Profundización audiovisual',
    health_reference: 'Comprensión sanitaria',
  }
  return (family && labels[family]) || item.help_type.replaceAll('_',' ')
}
