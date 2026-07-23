import { useState } from 'react'
import type { ModuleTokens } from '../lib/tokens'
import { Pill } from './Pill'

interface Option {
  value: string
  label: string
  hint?: string
}

// Formulario acotado de cierre de Faro: valoración, capitalización y
// reflexión opcional — sobrio y conversacional, no administrativo. Las
// opciones vienen siempre del contrato (sentiment_options/value_options);
// no se hardcodean acá. El envío final adjunta user_area_faro_id de forma
// explícita sobre la action 'close_faro' declarada por Supabase.
export function FaroCloseForm({
  content,
  actions,
  dispatch,
  tokens,
}: {
  content: Record<string, unknown>
  actions: Array<{ label: string; action: string; value?: string; variant?: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
}) {
  const userAreaFaroId = (content.user_area_faro_id as string) || ''
  const title = (content.title as string) || (content.faro_label as string) || ''
  const areaLabel = (content.area_label as string) || ''
  const sentimentOptions = (content.sentiment_options as Option[]) || []
  const valueOptions = (content.value_options as Option[]) || []
  const reflectionOptional = content.reflection_optional !== false

  const [sentiment, setSentiment] = useState('')
  const [valueKey, setValueKey] = useState('')
  const [reflection, setReflection] = useState('')

  const canConfirm = sentiment.length > 0

  const handleAction = (action: typeof actions[number]) => {
    if (action.action === 'close_faro') {
      if (!canConfirm) return
      dispatch('close_faro', {
        ...(userAreaFaroId ? { user_area_faro_id: userAreaFaroId } : {}),
        ...(action.value ? { value: action.value } : userAreaFaroId ? { value: userAreaFaroId } : {}),
        close_reason: sentiment,
        close_value_key: valueKey,
        close_reflection: reflection.trim(),
      })
    } else {
      dispatch(action.action, action.value ? { value: action.value } : {})
    }
  }

  const OptionRow = ({
    options,
    selected,
    onSelect,
  }: {
    options: Option[]
    selected: string
    onSelect: (v: string) => void
  }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {options.map(opt => {
        const active = selected === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '999px',
              background: active ? tokens.accentSoft20 : 'transparent',
              border: `1px solid ${active ? tokens.accent : tokens.accentSoft30}`,
              color: tokens.accentDeep,
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )

  return (
    <div style={{ textAlign: 'left' }}>
      {(areaLabel || title) && (
        <div style={{ marginBottom: '1.25rem' }}>
          {areaLabel && (
            <div style={{ fontSize: '0.7rem', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
              {areaLabel}
            </div>
          )}
          {title && <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: tokens.textPrimary, margin: 0 }}>{title}</h3>}
        </div>
      )}

      {sentimentOptions.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            ¿Cómo lo sentís?
          </label>
          <OptionRow options={sentimentOptions} selected={sentiment} onSelect={setSentiment} />
        </div>
      )}

      {valueOptions.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            ¿Qué te llevás de este tramo?
          </label>
          <OptionRow options={valueOptions} selected={valueKey} onSelect={setValueKey} />
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.7rem', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
          Reflexión {reflectionOptional && <span style={{ opacity: 0.6 }}>(opcional)</span>}
        </label>
        <textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          rows={3}
          placeholder="Lo que quieras dejar registrado de este tramo..."
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

      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
        {actions.map((action, idx) => {
          const isConfirm = action.action === 'close_faro'
          return (
            <Pill
              key={`${action.action}-${idx}`}
              label={action.label}
              variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
              onClick={() => (!isConfirm || canConfirm) && handleAction(action)}
              tokens={tokens}
            />
          )
        })}
      </div>
    </div>
  )
}
