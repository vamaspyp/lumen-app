import type { ModuleTokens } from '../lib/tokens'

export function SanctuaryDetail({
  content,
  tokens,
}: {
  content: Record<string, unknown>
  tokens: ModuleTokens
}) {
  const title = (content.title as string) || ''
  const description = (content.description_short as string) || ''
  const format = (content.format as string) || ''
  const durationMin = (content.duration_min as string) || ''
  const url = (content.url as string) || ''
  const note = (content.note as string) || ''
  const area = (content.area as string) || ''
  const hasNote = !!(content.has_note as boolean)

  const formatLabel = [
    format && format !== '—' && format.charAt(0).toUpperCase() + format.slice(1),
    durationMin && durationMin !== '—' && `${durationMin} min`,
  ].filter(Boolean).join(' · ')

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
      {formatLabel && (
        <div
          style={{
            display: 'inline-block',
            background: tokens.accentSoft20,
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.7rem',
            color: tokens.accentDeep,
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 500,
          }}
        >
          {formatLabel}
        </div>
      )}

      <h2
        style={{
          fontSize: '1.4rem',
          fontWeight: 500,
          color: tokens.textPrimary,
          marginTop: 0,
          marginBottom: description ? '0.75rem' : '1.25rem',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h2>

      {description && (
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

      {area && (
        <div style={{ fontSize: '0.75rem', color: tokens.textMuted, marginBottom: '1.25rem' }}>
          Área: {area.replace(/_/g, ' ')}
        </div>
      )}

      {url && (
        <button
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
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
          Abrir
        </button>
      )}
    </div>
  )
}
