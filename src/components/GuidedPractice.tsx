import { useState } from 'react'
import type { ModuleTokens } from '../lib/tokens'

export function GuidedPractice({
  content,
  dispatch,
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2.5rem',
        padding: '2rem 1.5rem',
      }}
    >
      {sourceLabel && (
        <p
          style={{
            fontSize: '0.75rem',
            fontStyle: 'italic',
            color: 'rgba(244,239,230,0.5)',
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
          color: '#F4EFE6',
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
            fontSize: '0.7rem',
            fontStyle: 'italic',
            color: 'rgba(244,239,230,0.4)',
            maxWidth: '40ch',
            textAlign: 'center',
            margin: 0,
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
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'transparent',
          color: '#F4EFE6',
          fontSize: '0.9rem',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'background 0.2s ease',
        }}
      >
        {isLast ? 'Terminar' : 'Siguiente'}
      </button>

      {steps.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: i === stepIndex ? '#F4EFE6' : 'rgba(244,239,230,0.25)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
