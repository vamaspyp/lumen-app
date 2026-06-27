import type { ModuleTokens } from '../lib/tokens'

export function SanctuaryDetail({
  content,
  dispatch,
  tokens,
}: {
  content: Record<string, unknown>
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
    'me_sirvio':      'Te sirvió',
    'no_era_para_mi': 'No era para vos',
    'guardado':       'Lo guardaste',
  }

  return (
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
      {/* Badge formato + señal de ayuda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {formatLabel && (
          <div
            style={{
              display: 'inline-block',
              background: tokens.accentSoft20,
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.7rem',
              color: tokens.accentDeep,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 500,
            }}
          >
            {formatLabel}
          </div>
        )}
        {helpSignal && helpSignalLabel[helpSignal] && (
          <div
            style={{
              display: 'inline-block',
              background: tokens.accentSoft10,
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.7rem',
              color: tokens.textMuted,
              letterSpacing: '0.04em',
            }}
          >
            {helpSignalLabel[helpSignal]}
          </div>
        )}
      </div>

      {/* Título */}
      <h2
        style={{
          fontSize: '1.4rem',
          fontWeight: 500,
          color: tokens.textPrimary,
          marginTop: 0,
          marginBottom: '1rem',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h2>

      {/* Pre-text de la experiencia */}
      {preText && (
        <div
          style={{
            background: tokens.accentSoft10,
            borderRadius: '12px',
            padding: '0.875rem 1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              color: tokens.accentDeep,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.375rem',
              fontWeight: 600,
            }}
          >
            Lo que LUMI te propuso
          </div>
          <p style={{ fontSize: '0.95rem', color: tokens.textPrimary, margin: 0, lineHeight: 1.5 }}>
            {preText}
          </p>
        </div>
      )}

      {/* Descripción del recurso */}
      {description && !preText && (
        <p
          style={{
            fontSize: '0.95rem',
            color: tokens.textSecondary,
            lineHeight: 1.5,
            margin: '0 0 1.25rem 0',
          }}
        >
          {description}
        </p>
      )}

      {/* Post-text */}
      {postText && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              fontSize: '0.7rem',
              color: tokens.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.375rem',
              fontWeight: 500,
            }}
          >
            Para después
          </div>
          <p style={{ fontSize: '0.9rem', color: tokens.textSecondary, margin: 0, lineHeight: 1.5 }}>
            {postText}
          </p>
        </div>
      )}

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
    </div>
  )
}