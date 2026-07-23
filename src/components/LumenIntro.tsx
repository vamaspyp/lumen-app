import { Component, useEffect, useState, useRef, type ReactNode, type CSSProperties } from 'react'
import { LumiOrb } from './LumiOrb'
import { LumenWordmark } from './LumenWordmark'
import { getModuleTokens } from '../lib/tokens'
import { markLumenIntroSeen } from '../lib/lumenIntro'

// Secuencia: trazo previo → escritura cursiva de "Lumen" → trazo posterior
// (las tres cosas son UN solo path, ver LumenWordmark) → concentración/
// implosión → nace LumiOrb → fin de intro.
type IntroPhase = 'writing' | 'implode' | 'orb' | 'complete'

const DURATIONS = {
  writing: 6000,
  implode: 650,
  orb: 900,
  completeFade: 350,
}

// Movimiento reducido: no se ejecuta la escritura. El wordmark aparece ya
// trazado y cruza a LumiOrb en una transición breve (~280ms), sin
// implosión ni efectos de escala/blur.
const REDUCED_DURATIONS = {
  crossfade: 280,
  completeFade: 150,
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function LumenIntroSequence({ onComplete }: { onComplete: () => void }) {
  const tokens = getModuleTokens('lumi')
  const [reduced] = useState(prefersReducedMotion)
  const [phase, setPhase] = useState<IntroPhase>('writing')
  const finishedRef = useRef(false)

  const finish = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    markLumenIntroSeen()
    onComplete()
  }

  useEffect(() => {
    let timer: number | undefined

    if (reduced) {
      if (phase === 'writing') {
        // Nada que escribir: pasa directo al cruce hacia el orbe.
        timer = window.setTimeout(() => setPhase('orb'), 0)
      } else if (phase === 'orb') {
        timer = window.setTimeout(() => setPhase('complete'), REDUCED_DURATIONS.crossfade)
      } else if (phase === 'complete') {
        timer = window.setTimeout(finish, REDUCED_DURATIONS.completeFade)
      }
    } else {
      if (phase === 'writing') {
        timer = window.setTimeout(() => setPhase('implode'), DURATIONS.writing)
      } else if (phase === 'implode') {
        timer = window.setTimeout(() => setPhase('orb'), DURATIONS.implode)
      } else if (phase === 'orb') {
        timer = window.setTimeout(() => setPhase('complete'), DURATIONS.orb)
      } else if (phase === 'complete') {
        timer = window.setTimeout(finish, DURATIONS.completeFade)
      }
    }

    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduced])

  const completeFadeMs = reduced ? REDUCED_DURATIONS.completeFade : DURATIONS.completeFade

  const isImploding = !reduced && phase === 'implode'
  const showWordmark = phase === 'writing' || phase === 'implode' || (reduced && phase === 'orb')
  const showOrb = phase === 'orb' || phase === 'complete'

  // Implosión: el trazo recogido pierde extensión horizontal, se concentra
  // hacia el centro, reduce escala y suma blur/opacidad — nunca un fade simple.
  const wordmarkWrapperStyle: CSSProperties = isImploding
    ? {
        transform: 'scale(0.05, 0.5)',
        transformOrigin: 'center',
        filter: 'blur(9px)',
        opacity: 0,
        transition:
          'transform 650ms cubic-bezier(0.6,0,0.85,0.35), filter 650ms ease-in, opacity 650ms ease-in 200ms',
      }
    : reduced && phase === 'orb'
      ? { opacity: 0, transition: `opacity ${REDUCED_DURATIONS.crossfade}ms ease` }
      : { transform: 'scale(1,1)', opacity: 1 }

  const orbWrapperStyle: CSSProperties =
    reduced
      ? {
          opacity: phase === 'orb' || phase === 'complete' ? 1 : 0,
          transform: phase === 'orb' || phase === 'complete' ? 'scale(1)' : 'scale(0.92)',
          transition: `opacity ${REDUCED_DURATIONS.crossfade}ms ease, transform ${REDUCED_DURATIONS.crossfade}ms ease`,
        }
      : {
          animation: 'lumenIntroOrbBirth 900ms cubic-bezier(0.25,0.85,0.35,1) both',
        }

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: tokens.background,
        opacity: phase === 'complete' ? 0 : 1,
        transition: `opacity ${completeFadeMs}ms ease`,
      }}
    >
      <button
        type="button"
        onClick={finish}
        style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.25rem',
          background: 'transparent',
          border: 'none',
          color: tokens.textSecondary,
          fontSize: '0.85rem',
          letterSpacing: '0.04em',
          cursor: 'pointer',
          padding: '0.5rem 0.75rem',
          zIndex: 1,
        }}
      >
        Omitir
      </button>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {showWordmark && (
          <div style={wordmarkWrapperStyle}>
            <LumenWordmark tokens={tokens} writingMs={DURATIONS.writing} reduced={reduced} />
          </div>
        )}

        {showOrb && (
          <div style={{ ...orbWrapperStyle, position: showWordmark ? 'absolute' : 'static' }}>
            <LumiOrb tokens={tokens} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes lumenIntroOrbBirth {
          0%   { transform: scale(0.12); opacity: 0; }
          55%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

class LumenIntroBoundary extends Component<{ children: ReactNode; onFallback: () => void }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {
    // Ante cualquier error de la intro (p.ej. el asset del trazo), no
    // reintenta: cae directo a LumiOrb (la vista normal de App ya lo
    // renderiza por debajo de este overlay).
    markLumenIntroSeen()
    this.props.onFallback()
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

/**
 * Overlay local de entrada (escritura → implosión → nace el orbe →
 * completo). No crea nodos, no llama a Supabase y no participa del
 * dispatcher: solo decide, vía sessionStorage, si corresponde reproducirse
 * una vez por sesión.
 */
export function LumenIntro({ onComplete }: { onComplete: () => void }) {
  return (
    <LumenIntroBoundary onFallback={onComplete}>
      <LumenIntroSequence onComplete={onComplete} />
    </LumenIntroBoundary>
  )
}
