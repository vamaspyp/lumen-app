import { useState } from 'react'
import type { ModuleTokens } from '../lib/tokens'
import { Pill } from './Pill'

export function NoteEditor({
  content,
  actions,
  dispatch,
  tokens,
}: {
  content: Record<string, unknown>
  actions: Array<{ label: string; action: string; variant?: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
}) {
  const title = (content.title as string) || 'Recurso'
  const currentNote = (content.current_note as string) || ''
  const currentArea = (content.current_area as string) || ''
  const areaOptions =
    (content.area_options as Array<{ value: string; label: string; hint?: string }>) || []

  const [note, setNote] = useState(currentNote)
  const [area, setArea] = useState(currentArea)

  const handleAction = (actionName: string) => {
    if (actionName === 'save_note') {
      dispatch('save_note', { note, area })
    } else {
      dispatch(actionName)
    }
  }

  return (
    <div style={{ textAlign: 'left' }}>
      <div
        style={{
          fontSize: '0.7rem',
          color: tokens.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '0.5rem',
          fontWeight: 500,
        }}
      >
        Sobre
      </div>
      <h3
        style={{
          fontSize: '1.1rem',
          fontWeight: 500,
          color: tokens.textPrimary,
          margin: '0 0 1.5rem 0',
        }}
      >
        {title}
      </h3>

      <div style={{ marginBottom: '1.5rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.7rem',
            color: tokens.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.5rem',
            fontWeight: 500,
          }}
        >
          Tu nota
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={5}
          placeholder="Una reflexión, una frase, lo que sea..."
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            borderRadius: '12px',
            background: tokens.cardBg,
            border: `1px solid ${tokens.cardBorder}`,
            color: tokens.textPrimary,
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            lineHeight: 1.5,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {areaOptions.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.7rem',
              color: tokens.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.5rem',
              fontWeight: 500,
            }}
          >
            Área (opcional)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {areaOptions.map(opt => {
              const active = area === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setArea(active ? '' : opt.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '999px',
                    background: active ? tokens.accentSoft20 : 'transparent',
                    border: `1px solid ${active ? tokens.accent : tokens.accentSoft30}`,
                    color: tokens.accentDeep,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
        {actions.map((action, idx) => (
          <Pill
            key={`${action.action}-${idx}`}
            label={action.label}
            variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
            onClick={() => handleAction(action.action)}
            tokens={tokens}
          />
        ))}
      </div>
    </div>
  )
}
