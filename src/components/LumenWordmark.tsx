import type { ModuleTokens } from '../lib/tokens'

/**
 * ÚNICO punto de reemplazo cuando exista el trazado SVG oficial del isologo
 * LUMEN: hoy aproxima el trazo manuscrito con una línea que se dibuja de
 * izquierda a derecha y la palabra "lumen" (cursiva tipo French Script)
 * revelándose progresivamente sobre ella. LumenIntro solo le pide que
 * ocupe su lugar durante `writingMs`; no conoce cómo se dibuja por dentro,
 * así que esta implementación puede sustituirse por completo (por un
 * SVG path real con stroke-dashoffset, por ejemplo) sin tocar las fases
 * de implosión/flash/orbe.
 */
export function LumenWordmark({ tokens, writingMs }: { tokens: ModuleTokens; writingMs: number }) {
  const textDelayMs = Math.round(writingMs * 0.1)
  const textDurationMs = Math.round(writingMs * 0.75)

  return (
    <div
      style={{
        position: 'relative',
        width: 'min(88vw, 460px)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: '1.5px',
          transform: 'translateY(-50%) scaleX(0)',
          transformOrigin: 'left center',
          background: `linear-gradient(to right, transparent, ${tokens.accentDeep} 18%, ${tokens.accentDeep} 82%, transparent)`,
          animation: `lumenIntroLineDraw ${writingMs}ms cubic-bezier(0.5,0,0.35,1) forwards`,
        }}
      />
      <span
        style={{
          position: 'relative',
          display: 'inline-block',
          fontFamily: "'Segoe Script', 'Lucida Handwriting', 'Brush Script MT', cursive",
          fontSize: 'clamp(2.4rem, 9vw, 3.4rem)',
          color: tokens.accentDeep,
          letterSpacing: '0.01em',
          lineHeight: 1,
          clipPath: 'inset(0 100% 0 0)',
          animation: `lumenIntroTextReveal ${textDurationMs}ms ease-out ${textDelayMs}ms forwards`,
        }}
      >
        lumen
      </span>

      <style>{`
        @keyframes lumenIntroLineDraw {
          from { transform: translateY(-50%) scaleX(0); }
          to   { transform: translateY(-50%) scaleX(1); }
        }
        @keyframes lumenIntroTextReveal {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0% 0 0); }
        }
      `}</style>
    </div>
  )
}
