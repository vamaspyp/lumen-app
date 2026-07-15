import type { ModuleTokens } from '../lib/tokens'
import { ExperienceDetailCard } from './ExperienceDetailCard'
import { Pill } from './Pill'

export function SanctuaryDetail({
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
  const title        = (content.title as string) || ''
  const description  = (content.description_short as string) || ''
  const format       = (content.format as string) || ''
  const durationMin  = (content.duration_min as string) || ''
  const url          = (content.url as string) || ''
  const note         = (content.note as string) || ''
  const area         = (content.life_area_key as string) || (content.area as string) || ''
  const hasNote      = !!(content.has_note as boolean)
  const preText      = (content.pre_text as string) || ''
  const postText     = (content.post_text as string) || ''

  const helpSignal   = (content.help_signal as string) || ''

  const formatLabel = [
    format && format !== '—' && format.charAt(0).toUpperCase() + format.slice(1),
    durationMin && durationMin !== '—' && `${durationMin} min`,
  ].filter(Boolean).join(' · ')

  const helpSignalLabel: Record<string, string> = {
    'me_sirvio':                'Te sirvió',
    'me_dejo_un_poco_mejor':    'Te dejó un poco mejor',
    'no_era_para_mi':           'No era para vos',
    'guardado':                 'Lo guardaste',
  }

  // Pills de la experiencia guardada (p.ej. "Volver a vivirla", "Editar
  // nota", "Quitar") vienen del backend en actions_json — Supabase
  // decide, este componente solo renderiza y reenvía el click.
  const renderActionPill = (action: typeof actions[number], key: string) => (
    <Pill
      key={key}
      label={action.label}
      variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
      onClick={() => dispatch(action.action, {
        ...(action.value ? { value: action.value } : {}),
        resource_id:       (content.resource_id as string) || '',
        sanctuary_item_id: (content.sanctuary_item_id as string) || '',
        experience_id:     (content.experience_id as string) || '',
        experience_run_id: (content.experience_run_id as string) || '',
        title:             (content.title as string) || '',
        format:            (content.format as string) || '',
        duration:          String(content.duration_min || ''),
        url:               (content.url as string) || '',
      })}
      tokens={tokens}
    />
  )

  return (
    <>
      <ExperienceDetailCard
        tokens={tokens}
        formatLabel={formatLabel || undefined}
        secondaryBadgeLabel={helpSignal && helpSignalLabel[helpSignal] ? helpSignalLabel[helpSignal] : undefined}
        title={title}
        preText={preText || undefined}
        preTextLabel="Lo que LUMI te propuso"
        descriptionShort={description || undefined}
        postText={postText || undefined}
      >
        {/* Nota personal */}
        {hasNote && note && (
          <div
            style={{
              background: tokens.accentSoft10,
              border: `1px solid ${tokens.accentSoft30}`,
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                fontSize: '0.7rem',
                color: tokens.accentDeep,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.5rem',
                fontWeight: 500,
              }}
            >
              Tu nota
            </div>
            <p
              style={{
                fontSize: '0.95rem',
                color: tokens.textPrimary,
                lineHeight: 1.5,
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {note}
            </p>
          </div>
        )}

        {/* Área */}
        {area && (
          <div style={{ fontSize: '0.75rem', color: tokens.textMuted, marginBottom: '1.25rem' }}>
            {area.replace(/_/g, ' ')}
          </div>
        )}

        {/* Botón abrir recurso — solo si no hay experience_id (legacy) */}
        {url && !content.experience_id && (
          <button
            onClick={() => dispatch('resource_viewer_active', {
              source_kind: (content.source_kind as string) || 'external_url',
              resource_id: (content.resource_id as string) || '',
              source: 'sanctuary',
            })}
            style={{
              padding: '0.625rem 1.5rem',
              borderRadius: '999px',
              background: tokens.accent,
              border: `1px solid ${tokens.accent}`,
              color: '#FFFFFF',
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontWeight: 500,
              fontFamily: 'inherit',
            }}
          >
            {(() => {
              const fmt = format.toLowerCase()
              if (fmt === 'práctica' || fmt === 'practica') return 'Empezar la práctica'
              if (fmt === 'video') return 'Ver el video'
              if (fmt === 'audio') return 'Escuchar ahora'
              if (fmt === 'texto' || fmt === 'lectura') return 'Leer ahora'
              return 'Abrir'
            })()}
          </button>
        )}
      </ExperienceDetailCard>

      {/* Bloque inferior de acciones de la experiencia guardada.
          "Compartir luz" no viene en actions_json de este nodo — es un
          disparador local de la action canónica share_light, ubicado
          entre la primera acción del backend (Volver a vivirla) y el
          resto (Editar nota / Quitar). Nunca dentro de la nota. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {actions.slice(0, 1).map((action, idx) => renderActionPill(action, `${action.action}-${idx}`))}

        <Pill
          label="Compartir luz"
          variant="outline"
          onClick={() => dispatch('share_light')}
          tokens={tokens}
        />

        {actions.slice(1).map((action, idx) => renderActionPill(action, `${action.action}-${idx + 1}`))}
      </div>
    </>
  )
}
