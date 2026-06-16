import { useState, useEffect } from 'react'
import type { ModuleTokens } from '../lib/tokens'
import { Pill } from './Pill'
import { LumiOrb } from './LumiOrb'

export function LandingScan({
  scanData,
  tokens,
  onComplete,
  onScanComplete,
}: {
  scanData: Record<string, unknown>
  tokens: ModuleTokens
  onComplete: () => void
  onScanComplete: () => void
}) {
  const [phase, setPhase] = useState<'invite' | 'scanning' | 'done'>('invite')
  const [stepIndex, setStepIndex] = useState(0)

  const message = (scanData.message as string) || ''
  const actions = (scanData.actions as Array<{ label: string; action: string; variant?: string }>) || []
  const content = (scanData.content as Record<string, unknown>) || {}
  const steps = (content.steps as Array<{ text: string; pause_ms: number; breathe?: string }>) || []
  const sourceLabel = (content.source_label as string) || ''

  useEffect(() => {
    if (phase === 'done') onScanComplete()
  }, [phase, onScanComplete])

  useEffect(() => {
    if (phase !== 'scanning' || steps.length === 0) return
    const step = steps[stepIndex]
    const timer = setTimeout(() => {
      if (stepIndex < steps.length - 1) {
        setStepIndex(i => i + 1)
      } else {
        setPhase('done')
      }
    }, step.pause_ms)
    return () => clearTimeout(timer)
  }, [phase, stepIndex, steps])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 'calc(100vh - 70px)',
        paddingTop: '0',
        paddingBottom: '0',
      }}
    >
      {/* SECCIÓN 1: orb */}
      <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LumiOrb tokens={tokens} />
      </div>

      {/* SECCIÓN 2: mensaje */}
      <div
        style={{
          flex: '0 0 auto',
          padding: '0 2rem',
          marginBottom: '2rem',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {phase === 'invite' && (
          <p
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: tokens.textPrimary,
              maxWidth: '32ch',
              margin: 0,
            }}
          >
            {message}
          </p>
        )}
        {phase === 'scanning' && steps.length > 0 && (
          <div style={{ maxWidth: 360 }}>
            {sourceLabel && (
              <p
                style={{
                  fontSize: '0.72rem',
                  fontStyle: 'italic',
                  color: tokens.textMuted,
                  opacity: 0.6,
                  margin: '0 0 1rem',
                }}
              >
                {sourceLabel}
              </p>
            )}
            <p
              key={stepIndex}
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '1.1rem',
                lineHeight: 1.7,
                color: tokens.textPrimary,
                maxWidth: '28ch',
                margin: '0 auto',
                animation: 'lumiAppear 600ms ease-out both',
              }}
            >
              {steps[stepIndex].text}
            </p>
          </div>
        )}
        {phase === 'done' && steps.length > 0 && (
          <p
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: tokens.textPrimary,
              maxWidth: '32ch',
              margin: 0,
            }}
          >
            {steps[steps.length - 1].text}
          </p>
        )}
      </div>

      {/* SECCIÓN 3: pills */}
      <div
        style={{
          flex: '0 0 auto',
          marginBottom: '4rem',
        }}
      >
        {phase === 'invite' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', width: '100%', maxWidth: 320 }}>
            {actions.map((action, idx) => (
              <Pill
                key={idx}
                label={action.label}
                variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
                onClick={() => {
                  if (action.action === 'skip_scan') onComplete()
                  else if (action.action === 'start_scan') setPhase('scanning')
                }}
                tokens={tokens}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
