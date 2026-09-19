export type Space = 'home' | 'life' | 'explore' | 'sanctuary' | 'tissue'
export type Utility = 'none' | 'notifications' | 'settings'
export type MomentStage = 'idle' | 'auth' | 'scene' | 'experience' | 'outcome' | 'closed'

export const IMG = {
  hero: '/images/hero-presence.webp',
  calm: '/images/landscape-path.webp',
  practice: '/images/practice-hand.webp',
  journal: '/images/practice-hand.webp',
  meeting: '/images/hero-presence.webp',
  walk: '/images/landscape-path.webp',
  portrait: '/images/hero-presence.webp',
  man: '/images/hero-presence.webp',
  portrait2: '/images/hero-presence.webp',
  sleep: '/images/landscape-path.webp',
  sunrise: '/images/landscape-path.webp',
} as const
