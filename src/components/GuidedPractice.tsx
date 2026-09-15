import { useState } from 'react'
import type { ModuleTokens } from '../lib/tokens'
import { LumiOrb } from './LumiOrb'

export function GuidedPractice({
  content,
  dispatch,
  tokens,
}: {
  content: Record<string, unknown>
  tokens: ModuleTokens
  dispatch: (action: string, extra?: Record<string, string>) => void
}) {
  const meta = (content.metadata as Record<string, unknown>) || {}
  const steps = (meta.steps as Array<{ text: string }>) || []
  const sourceLabel = (meta.source_label as string) || ''
  const sourceDetail = (meta.source_detail as string) || ''

  const [stepIndex, setStepIndex] = useState(0)

  if (steps.length === 0) return null

  const isLast = stepIndex === steps.length - 1
  const step = steps[stepIndex]

  const advance = () => {
    if (isLast) {
      dispatch('close_resource_viewer')
      return
    }
    setStepIndex(i => i + 1)
  }

  return (
    <>
      <style>{`
        @keyframes lumenExperienceEnter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lumen-experience-step { animation: none !important; }
        }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: '40rem',
          minHeight: 'min(72vh, 42rem)',
          margin: '0 auto',
          padding: '2.5rem 1.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem',
          textAlign: 'center',
          borderRadius: '28px',
          background: `radial-gradient(circle at 50% 34%, ${tokens.accentSoft20}, transparent 34%), linear-gradient(180deg, ${tokens.cardBg}, ${tokens.background})`,
          border: `1px solid ${tokens.cardBorder}`,
          boxShadow: tokens.shadow,
        }}
      >
        <div
          style={{
            minHeight: '7rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.92,
            transform: 'scale(0.72)',
          }}
          aria-hidden="true"
        >
          <LumiOrb tokens={tokens} />
        </div>

        <div
          style={{
            flex: 1,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            key={stepIndex}
            className="lumen-experience-step"
            aria-live="polite"
            style={{
              fontSize: 'clamp(1.2rem, 2.8vw, 1.55rem)',
              color: tokens.textPrimary,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              lineHeight: 1.65,
              maxWidth: '28ch',
              margin: 0,
              animation: 'lumenExperienceEnter 500ms ease-out both',
            }}
          >
            {step.text}
          </p>
        </div>

        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div
            aria-label={`Paso ${stepIndex + 1} de ${steps.length}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              minHeight: '0.6rem',
            }}
          >
            {steps.map((_, index) => (
              <span
                key={index}
                aria-hidden="true"
                style={{
                  width: index === stepIndex ? '1.35rem' : '0.38rem',
                  height: '0.38rem',
                  borderRadius: '999px',
                  background: index <= stepIndex ? tokens.accent : tokens.cardBorder,
                  opacity: index === stepIndex ? 1 : 0.72,
                  transition: 'width 220ms ease, background 220ms ease, opacity 220ms ease',
                }}
              />
            ))}
          </div>

          {isLast && (
            <div
              style={{
                maxWidth: '38ch',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: tokens.textSecondary,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontSize: '0.98rem',
                  lineHeight: 1.6,
                }}
              >
                Quedate un instante con lo que cambió, aunque sea pequeño.
              </p>
              {sourceLabel && (
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.72rem',
                    color: tokens.textMuted,
                    lineHeight: 1.45,
                  }}
                >
                  {sourceLabel}
                </p>
              )}
              {sourceDetail && (
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.7rem',
                    fontStyle: 'italic',
                    color: tokens.textMuted,
                    lineHeight: 1.45,
                  }}
                >
                  {sourceDetail}
                </p>
              )}
            </div>
          )}

          <button
            onClick={advance}
            style={{
              minWidth: '8.5rem',
              minHeight: '2.85rem',
              padding: '0.75rem 2rem',
              borderRadius: '999px',
              border: `1px solid ${isLast ? tokens.accent : tokens.cardBorder}`,
              background: isLast ? tokens.accent : 'transparent',
              color: isLast ? '#FFFFFF' : tokens.accentDeep,
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 500,
              boxShadow: isLast ? tokens.shadow : 'none',
              transition: 'background 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
            }}
          >
            {isLast ? 'Terminar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </>
  )
}
