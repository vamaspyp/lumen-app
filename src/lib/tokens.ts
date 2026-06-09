// ════════════════════════════════════════════════════════════════
// LUMEN — Sistema de tokens cromáticos por módulo
// Paleta Nordic/zen — arena, tiza, humo, pasteles tierra
// ════════════════════════════════════════════════════════════════

/** Convierte hex (#RRGGBB) a rgba con alfa específico (0–1). */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Paleta canónica por módulo — versión nordic/zen. */
const CANON = {
  lumi: {
    background: '#F4EFE6', // tiza arena cálida
    accent:     '#8FA38C', // salvia silenciosa
    accentDeep: '#5F7A5E', // salvia profunda
    energy:     'presencia · calma',
  },
  fuente: {
    background: '#F0EEE6', // pergamino apagado
    accent:     '#9B7A52', // bronce de libro antiguo
    accentDeep: '#6E5536', // bronce profundo
    energy:     'claridad · sabiduría',
  },
  sanctuary: {
    background: '#F4EEDE', // ámbar lechoso
    accent:     '#A88860', // dorado tierra
    accentDeep: '#7A6240', // dorado profundo
    energy:     'intimidad · memoria',
  },
  circles: {
    background: '#ECEEF1', // humo azul
    accent:     '#7090B5', // azul niebla
    accentDeep: '#4A6A8E', // azul profundo
    energy:     'encuentro · conexión',
  },
} as const

export type ModuleKey = keyof typeof CANON

export interface ModuleTokens {
  background:    string
  cardBg:        string
  cardBorder:    string

  accent:        string
  accentDeep:    string
  accentSoft10:  string
  accentSoft20:  string
  accentSoft30:  string

  textPrimary:   string
  textSecondary: string
  textMuted:     string

  orbInner:      string
  orbMid:        string
  orbOuter:      string
  orbGlow:       string

  energy:        string
  source:        ModuleKey
}

export function getModuleTokens(contentSource: string | undefined | null): ModuleTokens {
  const key: ModuleKey = (
    contentSource === 'fuente'    ? 'fuente'    :
    contentSource === 'sanctuary' ? 'sanctuary' :
    contentSource === 'circles'   ? 'circles'   :
    'lumi'
  )
  const palette = CANON[key]
  const { background, accent, accentDeep, energy } = palette

  return {
    background,
    cardBg:        'rgba(252, 248, 240, 0.72)',
    cardBorder:    withAlpha(accent, 0.15),

    accent,
    accentDeep,
    accentSoft10:  withAlpha(accent, 0.10),
    accentSoft20:  withAlpha(accent, 0.18),
    accentSoft30:  withAlpha(accent, 0.28),

    textPrimary:   '#3A332A',
    textSecondary: '#6E665C',
    textMuted:     '#A89F92',

    orbInner:      lighten(accent, 0.30),
    orbMid:        accent,
    orbOuter:      accentDeep,
    orbGlow:       `0 0 32px ${withAlpha(accent, 0.40)}`,

    energy,
    source:        key,
  }
}

function lighten(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * amount))
  const toHex = (c: number) => c.toString(16).padStart(2, '0')
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`
}