import { Component, useEffect, useState, useRef, type ReactNode } from 'react'
import { LumiOrb } from './LumiOrb'
import { getModuleTokens } from '../lib/tokens'
import { markLumenIntroSeen } from '../lib/lumenIntro'

type IntroPhase = 'reveal' | 'dissolve' | 'orb' | 'complete'

const DURATIONS = { reveal: 900, dissolve: 550, orb: 700, completeFade: 350 }
const REDUCED_DURATIONS = { reveal: 0, dissolve: 0, orb: 450, completeFade: 150 }

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
  const durations = reduced ? REDUCED_DURATIONS : DURATIONS
  const [phase, setPhase] = useState<IntroPhase>(reduced ? 'orb' : 'reveal')
  const finishedRef = useRef(false)

  const finish = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    markLumenIntroSeen()
    onComplete()
  }

  useEffect(() => {
    let timer: number | undefined

    if (phase === 'reveal') {
      timer = window.setTimeout(() => setPhase('dissolve'), durations.reveal)
    } else if (phase === 'dissolve') {
      timer = window.setTimeout(() => setPhase('orb'), durations.dissolve)
    } else if (phase === 'orb') {
      timer = window.setTimeout(() => setPhase('complete'), durations.orb)
    } else if (phase === 'complete') {
      timer = window.setTimeout(finish, durations.completeFade)
    }

    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

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
        transition: `opacity ${durations.completeFade}ms ease`,
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

      {phase === 'orb' || phase === 'complete' ? (
        <div style={{ animation: reduced ? undefined : 'lumenIntroOrbIn 500ms ease-out both' }}>
          <LumiOrb tokens={tokens} />
        </div>
      ) : (
        <span
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(2.25rem, 8vw, 3.5rem)',
            letterSpacing: '0.12em',
            color: tokens.accentDeep,
            display: 'inline-block',
            // Placeholder tipográfico: pendiente reemplazo por SVG/trazado
            // oficial del isologo (ver spec Módulo C, entrada animada).
            clipPath: phase === 'reveal' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 0)',
            animation: phase === 'reveal' ? `lumenIntroReveal ${durations.reveal}ms ease-out forwards` : undefined,
            opacity: phase === 'dissolve' ? 0 : 1,
            filter: phase === 'dissolve' ? 'blur(6px)' : 'blur(0px)',
            transform: phase === 'dissolve' ? 'scale(0.92)' : 'scale(1)',
            transition:
              phase === 'dissolve'
                ? `opacity ${durations.dissolve}ms ease-in, filter ${durations.dissolve}ms ease-in, transform ${durations.dissolve}ms ease-in`
                : undefined,
          }}
        >
          Lumen
        </span>
      )}

      <style>{`
        @keyframes lumenIntroReveal {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0 0 0); }
        }
        @keyframes lumenIntroOrbIn {
          from { opacity: 0; transform: scale(0.7); }
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
 * Overlay local de entrada (reveal → dissolve → orb → complete). No crea
 * nodos, no llama a Supabase y no participa del dispatcher: solo decide,
 * vía sessionStorage, si corresponde reproducirse una vez por sesión.
 */
export function LumenIntro({ onComplete }: { onComplete: () => void }) {
  return (
    <LumenIntroBoundary onFallback={onComplete}>
      <LumenIntroSequence onComplete={onComplete} />
    </LumenIntroBoundary>
  )
}
