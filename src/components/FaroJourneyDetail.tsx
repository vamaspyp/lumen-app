import type { ModuleTokens } from '../lib/tokens'
import { Pill } from './Pill'

interface JourneyEvent {
  id?: string
  date?: string
  title?: string
  selected_capability_key?: string
  expected_capability_key?: string
  perceived_capability_key?: string
  help_signal?: string
  reflection_text?: string
  [key: string]: unknown
}

const HELP_SIGNAL_LABELS: Record<string, string> = {
  'me_sirvio': 'Te sirvió',
  'me_dejo_un_poco_mejor': 'Te dejó un poco mejor',
  'no_era_para_mi': 'No era para vos',
  'guardado': 'Lo guardaste',
}

function formatDate(d?: string): string {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return d
  }
}

// Renderiza exactamente el timeline que Supabase ya preparó: no agrupa
// runs, no cuenta experiencias, no infiere capacidades ni redacta
// síntesis. Cada evento se muestra tal cual llega, tolerando campos
// ausentes.
export function FaroJourneyDetail({
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
  const title = (content.title as string) || ''
  const status = (content.status as string) || ''
  const areaLabel = (content.area_label as string) || ''
  const events = (content.events as JourneyEvent[]) || []

  return (
    <>
      <div
        style={{
          background: tokens.cardBg,
          border: `1px solid ${tokens.cardBorder}`,
          borderRadius: '18px',
          padding: '1.5rem',
          textAlign: 'left',
          marginBottom: '1.5rem',
        }}
      >
        {(areaLabel || status) && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {areaLabel && (
              <span style={{ fontSize: '0.7rem', color: tokens.accentDeep, background: tokens.accentSoft20, padding: '0.2rem 0.65rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {areaLabel}
              </span>
            )}
            {status && (
              <span style={{ fontSize: '0.7rem', color: tokens.textMuted, background: tokens.accentSoft10, padding: '0.2rem 0.65rem', borderRadius: '999px' }}>
                {status}
              </span>
            )}
          </div>
        )}

        {title && (
          <h2 style={{ fontSize: '1.25rem', fontWeight: 500, color: tokens.textPrimary, margin: '0 0 1.25rem 0' }}>{title}</h2>
        )}

        {events.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: tokens.textMuted, fontStyle: 'italic', margin: 0 }}>
            Todavía no hay unidades de acompañamiento registradas en este recorrido.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {events.map((ev, idx) => {
              const capabilityLine = [
                ev.selected_capability_key,
                ev.expected_capability_key && ev.expected_capability_key !== ev.selected_capability_key ? `esperada: ${ev.expected_capability_key}` : '',
                ev.perceived_capability_key ? `percibida: ${ev.perceived_capability_key}` : '',
              ].filter(Boolean).join(' · ')
              const helpSignalLabel = ev.help_signal ? (HELP_SIGNAL_LABELS[ev.help_signal] || ev.help_signal) : ''

              return (
                <div
                  key={ev.id || idx}
                  style={{
                    borderLeft: `2px solid ${tokens.accentSoft30}`,
                    paddingLeft: '0.875rem',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: tokens.textMuted }}>{formatDate(ev.date)}</div>
                  {ev.title && (
                    <div style={{ fontSize: '0.95rem', color: tokens.textPrimary, fontWeight: 500, marginTop: '0.2rem' }}>{ev.title}</div>
                  )}
                  {capabilityLine && (
                    <div style={{ fontSize: '0.78rem', color: tokens.textSecondary, marginTop: '0.2rem' }}>{capabilityLine}</div>
                  )}
                  {helpSignalLabel && (
                    <div style={{ fontSize: '0.75rem', color: tokens.textMuted, marginTop: '0.2rem' }}>{helpSignalLabel}</div>
                  )}
                  {ev.reflection_text && (
                    <p style={{ fontSize: '0.85rem', color: tokens.textSecondary, fontStyle: 'italic', margin: '0.35rem 0 0', lineHeight: 1.45 }}>
                      “{ev.reflection_text}”
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {actions.map((action, idx) => (
          <Pill
            key={`${action.action}-${idx}`}
            label={action.label}
            variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
            onClick={() => dispatch(action.action, action.value ? { value: action.value } : {})}
            tokens={tokens}
          />
        ))}
      </div>
    </>
  )
}
