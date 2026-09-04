export type LocaleContext = {
  language: string
  locale: string
  timeZone?: string
  region?: string
  culturalContext?: string[]
  accessibility?: {
    reducedMotion?: boolean
    lowEnergy?: boolean
    textScale?: number
  }
}

export type SurfaceKind = 'web' | 'mobile-web' | 'mobile' | 'voice' | 'messaging' | 'audio' | 'wearable' | 'ambient'

export type SurfaceContext = {
  kind: SurfaceKind
  capabilities: string[]
}

/** Stable semantic action identity. Display labels are localized by surface adapters. */
export type SemanticAction = {
  id: string
  intent: string
  payload?: Record<string, unknown>
}
