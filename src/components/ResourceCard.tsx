import type { ModuleTokens } from '../lib/tokens'

// ─── helpers ─────────────────────────────────────────────────────

function titleHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff
  return h
}

function GenerativeThumbnail({ format, title }: { format: string; title: string }) {
  const h = titleHash(title || '')
  const v = (i: number, mod: number) => (h * (i * 7 + 3) + i * 13) % mod

  const fmt = (format || '').toLowerCase()
  let bg1: string, bg2: string, gradAngle = '160deg'
  let pattern: React.ReactNode

  if (fmt === 'practica' || fmt === 'práctica') {
    bg1 = '#E8F0E7'; bg2 = '#C5D9C0'
    const cx = 10 + v(2, 52)
    const cy = 10 + v(3, 60)
    pattern = (
      <>
        <circle cx={cx} cy={cy} r={30} fill="#8FA38C" fillOpacity={0.10} />
        <circle cx={cx} cy={cy} r={20} fill="#8FA38C" fillOpacity={0.15} />
        <circle cx={cx} cy={cy} r={12} fill="#8FA38C" fillOpacity={0.22} />
        <circle cx={cx + v(10, 30) - 15} cy={cy + v(11, 30) - 15} r={6 + v(12, 5)} fill="#8FA38C" fillOpacity={0.08} />
        <circle cx={cx - v(13, 20) + 5} cy={cy + v(14, 20)} r={5 + v(15, 4)} fill="#8FA38C" fillOpacity={0.08} />
      </>
    )
  } else if (fmt === 'video') {
    bg1 = '#EBE7DF'; bg2 = '#D0C7B5'
    const ya = 12 + v(1, 25)
    const yb = 35 + v(7, 20)
    const yc = 55 + v(13, 18)
    pattern = (
      <>
        <path
          d={`M 0 ${ya} C ${18 + v(2, 20)} ${ya - 12 + v(3, 24)}, ${42 + v(4, 22)} ${ya + 14 + v(5, 18)}, 72 ${ya + 5 + v(6, 22)}`}
          stroke="#9B7A52" strokeWidth={1.8} strokeOpacity={0.18} fill="none"
        />
        <path
          d={`M 0 ${yb} C ${14 + v(8, 24)} ${yb + 10 + v(9, 22)}, ${48 + v(10, 18)} ${yb - 8 + v(11, 20)}, 72 ${yb + 6 + v(12, 18)}`}
          stroke="#9B7A52" strokeWidth={1.2} strokeOpacity={0.12} fill="none"
        />
        <path
          d={`M 0 ${yc} C ${25 + v(14, 22)} ${yc - 10 + v(15, 20)}, ${44 + v(16, 20)} ${yc + 8 + v(17, 16)}, 72 ${yc + 3 + v(18, 14)}`}
          stroke="#9B7A52" strokeWidth={2} strokeOpacity={0.08} fill="none"
        />
      </>
    )
  } else if (fmt === 'audio') {
    bg1 = '#E8EBF0'; bg2 = '#C5CDD9'; gradAngle = '145deg'
    const cx = 26 + v(2, 20)
    pattern = (
      <>
        <circle cx={cx} cy={40} r={28} stroke="#7090B5" strokeWidth={1} strokeOpacity={0.12} fill="none" />
        <circle cx={cx} cy={40} r={18} stroke="#7090B5" strokeWidth={0.8} strokeOpacity={0.16} fill="none" />
        <circle cx={cx} cy={40} r={10} stroke="#7090B5" strokeWidth={0.6} strokeOpacity={0.20} fill="none" />
        <circle cx={cx} cy={40} r={4} fill="#7090B5" fillOpacity={0.18} />
      </>
    )
  } else {
    bg1 = '#EDE9E0'; bg2 = '#D5CFC3'
    pattern = (
      <>
        {Array.from({ length: 10 }, (_, i) => (
          <circle key={i} cx={3 + v(i * 2 + 1, 66)} cy={3 + v(i * 2 + 2, 74)}
            r={2 + v(i + 3, 3)} fill="#8FA38C" fillOpacity={0.08 + v(i + 4, 8) / 100} />
        ))}
      </>
    )
  }

  return (
    <div style={{
      width: '72px', minWidth: '72px', flexShrink: 0,
      overflow: 'hidden',
      borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(${gradAngle}, ${bg1}, ${bg2})`,
    }}>
      <svg width="72" height="80" viewBox="0 0 72 80" style={{ display: 'block', flexShrink: 0 }}>
        {pattern}
      </svg>
    </div>
  )
}

// ─── ResourceListCard ─────────────────────────────────────────────

const helpSignalLabel: Record<string, string> = {
  'me_sirvio':             'Te sirvió',
  'me_dejo_un_poco_mejor': 'Te dejó un poco mejor',
  'no_era_para_mi':        'No era para vos',
  'guardado':              'Lo guardaste',
}

export function ResourceListCard({
  title,
  subtitle,
  author,
  format,
  durationMin,
  whyNow,
  minimumStep,
  capabilityLabel,
  helpSignal,
  hasNote,
  onClick,
  tokens,
}: {
  title: string
  subtitle?: string
  author?: string
  format?: string
  durationMin?: number
  whyNow?: string
  minimumStep?: string
  capabilityLabel?: string
  helpSignal?: string
  hasNote?: boolean
  onClick: () => void
  tokens: ModuleTokens
}) {
  const derivedFormat = format || (() => {
    const sub = (subtitle || '').toLowerCase()
    if (sub.startsWith('práctica') || sub.startsWith('practica')) return 'practica'
    if (sub.startsWith('video')) return 'video'
    if (sub.startsWith('audio')) return 'audio'
    return 'texto'
  })()
  const fmt = derivedFormat.toLowerCase()
  const badgeBg = fmt === 'practica' || fmt === 'práctica' ? '#E8F0E7'
    : fmt === 'video' ? '#EDE9E0'
    : fmt === 'audio' ? '#E8EBF0'
    : '#EDE9E0'
  const badgeColor = fmt === 'practica' || fmt === 'práctica' ? '#5F7A5E'
    : fmt === 'video' ? '#6E5536'
    : fmt === 'audio' ? '#4A6A8E'
    : '#6E665C'
  const formatDisplay = derivedFormat.charAt(0).toUpperCase() + derivedFormat.slice(1)
  const badgeText = [formatDisplay, durationMin != null ? `${durationMin} min` : ''].filter(Boolean).join(' · ')
  const helpSignalText = helpSignal && helpSignalLabel[helpSignal] ? helpSignalLabel[helpSignal] : ''

  return (
    <button
      onClick={onClick}
      style={{
        background: tokens.cardBg,
        border: `0.5px solid ${tokens.cardBorder}`,
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        padding: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        minHeight: '80px',
        transition: 'all 0.2s ease',
      }}
    >
      <GenerativeThumbnail format={derivedFormat} title={title} />
      <div style={{ padding: '10px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
        {(badgeText || capabilityLabel || helpSignalText || hasNote) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '5px' }}>
            {badgeText && (
              <span style={{
                fontSize: '10px', letterSpacing: '0.3px', padding: '2px 7px',
                borderRadius: '999px', width: 'fit-content',
                background: badgeBg, color: badgeColor, display: 'inline-block', lineHeight: 1.4,
              }}>
                {badgeText}
              </span>
            )}
            {capabilityLabel && (
              <span style={{
                fontSize: '10px', letterSpacing: '0.3px', padding: '2px 7px',
                borderRadius: '999px', width: 'fit-content',
                background: tokens.accentSoft10, color: tokens.textMuted, display: 'inline-block', lineHeight: 1.4,
              }}>
                {capabilityLabel}
              </span>
            )}
            {helpSignalText && (
              <span style={{
                fontSize: '10px', letterSpacing: '0.3px', padding: '2px 7px',
                borderRadius: '999px', width: 'fit-content',
                background: tokens.accentSoft10, color: tokens.textMuted, display: 'inline-block', lineHeight: 1.4,
              }}>
                {helpSignalText}
              </span>
            )}
            {hasNote && (
              <span style={{
                fontSize: '10px', letterSpacing: '0.3px', padding: '2px 7px',
                borderRadius: '999px', width: 'fit-content',
                background: tokens.accentSoft10, color: tokens.textMuted, display: 'inline-block', lineHeight: 1.4,
              }}>
                Con nota
              </span>
            )}
          </div>
        )}
        <p style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.35, color: tokens.textPrimary, margin: 0 }}>
          {title}
        </p>
        {author && (
          <p style={{ fontSize: '11px', color: tokens.textSecondary, margin: '2px 0 0' }}>
            {author}
          </p>
        )}
        {whyNow && (
          <p
            style={{
              fontSize: '11px',
              color: tokens.textMuted,
              margin: '4px 0 0',
              lineHeight: 1.35,
              fontStyle: 'italic',
            }}
          >
            {whyNow}
          </p>
        )}
        {minimumStep && !whyNow && (
          <p
            style={{
              fontSize: '11px',
              color: tokens.textMuted,
              margin: '4px 0 0',
              lineHeight: 1.35,
              fontStyle: 'italic',
            }}
          >
            {minimumStep}
          </p>
        )}
      </div>
    </button>
  )
}

// ─── ResourceCard ─────────────────────────────────────────────────

export function ResourceCard({
  content,
  dispatch,
  tokens,
}: {
  content: Record<string, unknown>
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
}) {
  const title = (content.title as string) || ''
  const format = (content.format as string) || ''
  const durationMin = content.duration_min as number | undefined
  const whyNow = (content.why_now as string) || ''
  const minimumStep = (content.minimum_step as string) || ''
  const whatItIsNot = (content.what_it_is_not as string) || ''
  const sourceName = (content.source_name as string) || ''
  const sourceBasis = (content.source_basis as string) || ''
  const url = (content.url as string) || ''
  const resourceId = (content.resource_id as string) || ''
  const isFrom = (content.is_from as string) || 'lumi'
  const sessionId = (content.session_id as string) || ''
  const sourceKind = (content.source_kind as string) || 'external_url'

  const formatLabel = [
    format && format.charAt(0).toUpperCase() + format.slice(1),
    durationMin && `${durationMin} min`,
  ].filter(Boolean).join(' · ')

  const handleOpen = () => {
    if (!resourceId) return
    if (sourceKind !== 'lumen_practice' && !url) return

    const extra: Record<string, string> = {
      source_kind: sourceKind,
      resource_id: resourceId,
      source:      isFrom,
      session_id:  sessionId,
    }
    const runId = (content.run_id as string) || ''
    if (runId) extra.experience_run_id = runId

    dispatch('open_resource_viewer', extra)
  }

  return (
    <div
      style={{
        background: tokens.cardBg,
        border: `0.5px solid ${tokens.cardBorder}`,
        borderRadius: '12px',
        overflow: 'hidden',
        textAlign: 'left',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
      }}
    >
      <GenerativeThumbnail format={format} title={title} />
      <div style={{ flex: 1, padding: '1.5rem', minWidth: 0 }}>
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
            margin: '0 0 1.25rem 0',
            lineHeight: 1.3,
          }}
        >
          {title}
        </h2>

        {whyNow && (
        <div style={{ marginBottom: '1rem' }}>
          <div
            style={{
              fontSize: '0.7rem',
              color: tokens.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.25rem',
              fontWeight: 500,
            }}
          >
            Por qué ahora
          </div>
          <p style={{ fontSize: '0.95rem', color: tokens.textPrimary, margin: 0, lineHeight: 1.5 }}>
            {whyNow}
          </p>
        </div>
      )}

      {minimumStep && (
        <div
          style={{
            marginBottom: '1.25rem',
            background: tokens.accentSoft20,
            borderRadius: '12px',
            padding: '0.875rem 1rem',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              color: tokens.accentDeep,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.25rem',
              fontWeight: 600,
            }}
          >
            Por dónde empezar
          </div>
          <p style={{ fontSize: '0.95rem', color: tokens.textPrimary, margin: 0, lineHeight: 1.5 }}>
            {minimumStep}
          </p>
        </div>
      )}

      {whatItIsNot && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              fontSize: '0.7rem',
              color: tokens.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.25rem',
              fontWeight: 500,
            }}
          >
            Cuándo no
          </div>
          <p style={{ fontSize: '0.95rem', color: tokens.textSecondary, margin: 0, lineHeight: 1.5 }}>
            {whatItIsNot}
          </p>
        </div>
      )}

      {sourceName && (
        <div
          style={{
            marginBottom: '1.25rem',
            paddingTop: '0.875rem',
            borderTop: `1px solid ${tokens.cardBorder}`,
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              color: tokens.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.25rem',
              fontWeight: 500,
            }}
          >
            Fuente
          </div>
          <p style={{ fontSize: '0.85rem', color: tokens.textSecondary, margin: 0, lineHeight: 1.5 }}>
            {sourceName}{sourceBasis ? ` — ${sourceBasis}` : ''}
          </p>
        </div>
      )}

      {(url || sourceKind === 'lumen_practice') && (
        <button
          onClick={handleOpen}
          style={{
            marginTop: '1.25rem',
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
            const fmt = (format || '').toLowerCase()
            if (fmt === 'práctica' || fmt === 'practica') return 'Empezar la práctica'
            if (fmt === 'video') return 'Ver el video'
            if (fmt === 'audio') return 'Escuchar ahora'
            if (fmt === 'texto' || fmt === 'lectura') return 'Leer ahora'
            if (fmt === 'podcast') return 'Escuchar el episodio'
            return 'Quiero probarlo'
          })()}
        </button>
      )}
      </div>
    </div>
  )
}
