import { useState } from 'react'
import type { ModuleTokens } from '../lib/tokens'

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
    <div
      style={{
        background: tokens.cardBg,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: '22px',
        boxShadow: tokens.shadow,
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
        maxWidth: '36rem',
        margin: '0 auto',
      }}
    >
      {sourceLabel && (
        <p
          style={{
            fontSize: '0.75rem',
            fontStyle: 'italic',
            color: tokens.textMuted,
            margin: 0,
            textAlign: 'center',
          }}
        >
          {sourceLabel}
        </p>
      )}

      <p
        key={stepIndex}
        style={{
          fontSize: '1.1rem',
          color: tokens.textPrimary,
          fontFamily: 'Georgia, "Times New Roman", serif',
          lineHeight: 1.7,
          maxWidth: '32ch',
          textAlign: 'center',
          margin: 0,
          animation: 'lumiAppear 400ms ease-out both',
        }}
      >
        {step.text}
      </p>

      {isLast && sourceDetail && (
        <p
          style={{
            fontSize: '0.78rem',
            fontStyle: 'italic',
            color: tokens.textMuted,
            maxWidth: '40ch',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {sourceDetail}
        </p>
      )}

      <button
        onClick={advance}
        style={{
          padding: '0.75rem 2rem',
          borderRadius: '999px',
          border: `1px solid ${tokens.cardBorder}`,
          background: isLast ? tokens.accent : tokens.cardBg,
          color: isLast ? '#FFFFFF' : tokens.accentDeep,
          fontSize: '0.9rem',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: 500,
          boxShadow: isLast ? tokens.shadow : 'none',
          transition: 'background 0.2s ease, transform 0.2s ease',
        }}
      >
        {isLast ? 'Terminar' : 'Siguiente'}
      </button>
    </div>
  )
}