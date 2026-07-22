import { Component, useEffect, useState, useRef, type ReactNode, type CSSProperties } from 'react'
import { LumiOrb } from './LumiOrb'
import { LumenWordmark } from './LumenWordmark'
import { getModuleTokens } from '../lib/tokens'
import { markLumenIntroSeen } from '../lib/lumenIntro'

// Fases plenas: la palabra se escribe, se sostiene un instante, colapsa
// hacia el centro, estalla en un destello breve y de ese destello nace el
// orbe de LUMI, que late dos veces antes del crossfade final.
type IntroPhase = 'writing' | 'settle' | 'implode' | 'flash' | 'orb' | 'complete'

const DURATIONS = {
  writing: 6000,
  settle: 450,
  implode: 700,
  flash: 320,
  orb: 1650,
  completeFade: 400,
}

// Movimiento reducido: sin escritura larga ni implosión. Aparición breve
// de la palabra (el mismo LumenWordmark, comprimido a este tiempo) y
// transición rápida y sin latidos hacia el orbe.
const REDUCED_DURATIONS = {
  settle: 350,
  orb: 450,
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
  const [phase, setPhase] = useState<IntroPhase>(reduced ? 'settle' : 'writing')
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
      if (phase === 'settle') {
        timer = window.setTimeout(() => setPhase('orb'), REDUCED_DURATIONS.settle)
      } else if (phase === 'orb') {
        timer = window.setTimeout(() => setPhase('complete'), REDUCED_DURATIONS.orb)
      } else if (phase === 'complete') {
        timer = window.setTimeout(finish, REDUCED_DURATIONS.completeFade)
      }
    } else {
      if (phase === 'writing') {
        timer = window.setTimeout(() => setPhase('settle'), DURATIONS.writing)
      } else if (phase === 'settle') {
        timer = window.setTimeout(() => setPhase('implode'), DURATIONS.settle)
      } else if (phase === 'implode') {
        timer = window.setTimeout(() => setPhase('flash'), DURATIONS.implode)
      } else if (phase === 'flash') {
        timer = window.setTimeout(() => setPhase('orb'), DURATIONS.flash)
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
  const isFlashing = !reduced && phase === 'flash'
  const reducedFadeOut = reduced && phase === 'orb'

  const showWordmark =
    phase === 'writing' || phase === 'settle' || phase === 'implode' || reducedFadeOut
  const showBurst = isImploding || isFlashing
  const showOrb = phase === 'orb' || phase === 'complete'

  const wordmarkWrapperStyle: CSSProperties = isImploding
    ? {
        transform: 'scale(0.08, 0.85)',
        transformOrigin: 'center',
        filter: 'blur(10px)',
        opacity: 0,
        transition:
          'transform 700ms cubic-bezier(0.6,0,0.85,0.35), filter 700ms ease-in, opacity 700ms ease-in 260ms',
      }
    : reducedFadeOut
      ? { opacity: 0, transition: 'opacity 200ms ease' }
      : { transform: 'scale(1, 1)', opacity: 1 }

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
        }}
      >
        Omitir
      </button>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {showWordmark && (
          <div style={wordmarkWrapperStyle}>
            <LumenWordmark tokens={tokens} writingMs={reducedFadeOut ? REDUCED_DURATIONS.settle : DURATIONS.writing} />
          </div>
        )}

        {showBurst && (
          <div
            style={{
              position: 'absolute',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              pointerEvents: 'none',
              background: `radial-gradient(circle, rgba(255,255,255,0.9) 0%, ${tokens.accent} 45%, transparent 72%)`,
              opacity: isImploding ? 0.55 : undefined,
              transform: isImploding ? 'scale(0.9)' : undefined,
              transition: isImploding ? 'opacity 700ms ease-in, transform 700ms ease-in' : undefined,
              animation: isFlashing ? `lumenIntroFlash ${DURATIONS.flash}ms ease-out forwards` : undefined,
            }}
          />
        )}

        {showOrb && (
          <div
            style={{
              animation: !reduced
                ? 'lumenIntroPulseTwice 1300ms ease-in-out both'
                : 'lumenIntroOrbFadeIn 250ms ease-out both',
            }}
          >
            <LumiOrb tokens={tokens} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes lumenIntroFlash {
          0%   { opacity: 0.55; transform: scale(0.9); }
          40%  { opacity: 0.9; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.3); }
        }
        @keyframes lumenIntroPulseTwice {
          0%   { transform: scale(0.75); opacity: 0; }
          12%  { opacity: 1; }
          26%  { transform: scale(1.15); }
          42%  { transform: scale(0.98); }
          58%  { transform: scale(1.12); }
          74%  { transform: scale(1); }
          100% { transform: scale(1); }
        }
        @keyframes lumenIntroOrbFadeIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
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
    // Ante cualquier error de la intro, no reintenta: cae directo a LumiOrb
    // (la vista normal de App ya lo renderiza por debajo de este overlay).
    markLumenIntroSeen()
    this.props.onFallback()
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

/**
 * Overlay local de entrada (writing → settle → implode → flash → orb →
 * complete). No crea nodos, no llama a Supabase y no participa del
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
