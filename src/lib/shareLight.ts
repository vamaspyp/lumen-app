// ─── Compartir luz — fallback defensivo ────────────────────────────
// Supabase construye el texto de la circulación (lumi_share_light).
// Este helper solo cubre el caso en que content no traiga ningún
// texto preparado — nunca reemplaza el copy de negocio del backend.

export function buildShareLightText(contentData: Record<string, unknown>): string {
  const title = (contentData.title as string) || ''
  if (!title) return ''

  const descriptionShort = (contentData.description_short as string) || ''
  const url = (contentData.url as string) || (contentData.resource_url as string) || ''

  const intro = `Te comparto una pequeña experiencia de LUMEN que podría ayudarte: ${title}.`

  if (descriptionShort) {
    return [intro, descriptionShort, url].filter(Boolean).join(' ')
  }
  if (url) {
    return `${intro} ${url}`
  }
  return intro
}
