// ─── Compartir luz (versión mínima) ────────────────────────────────
// Ofrece una experiencia a otra persona. Nunca comparte Santuario
// privado, estado emocional, nota personal, hipótesis interna,
// analytics ni IDs técnicos — solo lo públicamente presentable.

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

export async function shareLight(
  contentData: Record<string, unknown>
): Promise<'shared' | 'copied' | 'failed'> {
  const text = buildShareLightText(contentData)
  if (!text) return 'failed'

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch {
      return 'failed'
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return 'copied'
    } catch {
      return 'failed'
    }
  }

  return 'failed'
}
