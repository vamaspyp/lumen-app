// ─── Compartir luz — fallback defensivo ────────────────────────────
// Supabase construye el texto de la circulación (lumi_share_light).
// Este helper solo cubre el caso en que content no traiga ningún
// texto preparado — nunca reemplaza el copy de negocio del backend.
//
// Nunca incluye content.url / resource_url: Circular Luz comparte la
// experiencia montada en LUMEN, no el recurso externo. El link público
// de LUMEN se agrega aparte (ver buildSharePayload en ShareLightEditor).

export function buildShareLightText(contentData: Record<string, unknown>): string {
  const title = (contentData.title as string) || ''
  if (!title) return ''

  const descriptionShort = (contentData.description_short as string) || ''

  const intro = `Te comparto una pequeña experiencia de LUMEN que podría ayudarte: ${title}.`

  if (descriptionShort) {
    return [intro, descriptionShort].filter(Boolean).join(' ')
  }
  return intro
}

// Helper defensivo: valida que un link público sea efectivamente un
// link de Circular Luz (LUMEN + share_token), nunca la URL del recurso.
export function isValidShareLightUrl(url?: string): boolean {
  return typeof url === 'string' && url.includes('share_light=')
}
