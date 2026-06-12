import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLumi } from './lib/useLumi'
import { getModuleTokens, type ModuleTokens } from './lib/tokens'
import {
  youtubeEmbedUrl,
  vimeoEmbedUrl,
  spotifyEmbedUrl,
  soundcloudEmbedUrl,
} from './lib/embedHelpers'
import { AreaIcon } from './lib/areaIcons'


// ════════════════════════════════════════════════════════════════
// LUMEN — App shell + renderers (paleta zen por módulo)
// ════════════════════════════════════════════════════════════════

// ─── Pill ────────────────────────────────────────────────────────
function Pill({
  label,
  hint,
  onClick,
  variant = 'outline',
  tokens,
}: {
  label: string
  hint?: string
  onClick: () => void
  variant?: 'outline' | 'solid' | 'ghost'
  tokens: ModuleTokens
}) {
  const styles: Record<string, React.CSSProperties> = {
    outline: {
      background: tokens.accentSoft20,
      border: `1px solid ${tokens.accentSoft30}`,
      color: tokens.accentDeep,
    },
    solid: {
      background: tokens.accent,
      border: `1px solid ${tokens.accent}`,
      color: '#FFFFFF',
    },
    ghost: {
      background: 'transparent',
      border: '1px solid transparent',
      color: tokens.textSecondary,
      fontSize: '0.85rem',
    },
  }

  return (
    <button
      onClick={onClick}
      style={{
        padding: hint ? '0.75rem 1.25rem' : '0.7rem 1.25rem',
        borderRadius: '999px',
        fontSize: '0.9rem',
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.125rem',
        maxWidth: '100%',
        ...styles[variant],
      }}
    >
      <span>{label}</span>
      {hint && (
        <span style={{ fontSize: '0.7rem', opacity: 0.7, fontStyle: 'italic' }}>{hint}</span>
      )}
    </button>
  )
}


// ─── GenerativeThumbnail ─────────────────────────────────────────
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
function ResourceListCard({
  title,
  subtitle,
  author,
  format,
  durationMin,
  onClick,
  tokens,
}: {
  title: string
  subtitle?: string
  author?: string
  format?: string
  durationMin?: number
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
        {badgeText && (
          <span style={{
            fontSize: '10px', letterSpacing: '0.3px', padding: '2px 7px',
            borderRadius: '999px', width: 'fit-content', marginBottom: '5px',
            background: badgeBg, color: badgeColor, display: 'inline-block', lineHeight: 1.4,
          }}>
            {badgeText}
          </span>
        )}
        <p style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.35, color: tokens.textPrimary, margin: 0 }}>
          {title}
        </p>
        {author && (
          <p style={{ fontSize: '11px', color: tokens.textSecondary, margin: '2px 0 0' }}>
            {author}
          </p>
        )}
      </div>
    </button>
  )
}

// ─── ResourceCard ────────────────────────────────────────────────
function ResourceCard({
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
  const isRepeat = !!(content.is_repeat as boolean)
  const isSaved = !!(content.is_saved as boolean)
  const sourceKind = (content.source_kind as string) || 'external_url'
  const areas = (content.areas as string[]) || []
  const primaryArea = areas[0] || ''

  const formatLabel = [
    format && format.charAt(0).toUpperCase() + format.slice(1),
    durationMin && `${durationMin} min`,
  ].filter(Boolean).join(' · ')


  const handleOpen = () => {
    if (!resourceId) return
    // lumen_practice no tiene URL — el contenido viene en metadata
    if (sourceKind !== 'lumen_practice' && !url) return

    dispatch('resource_viewer_active', {
      source_kind: sourceKind,
      resource_id: resourceId,
      source:      isFrom,
      session_id:  sessionId,
    })
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

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '1.25rem',
          }}
        >
          {primaryArea && <AreaIcon area={primaryArea} size={28} />}
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 500,
              color: tokens.textPrimary,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {title}
          </h2>
        </div>

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

      {/* ── Fuente (respaldo visible — el paso no es de LUMEN, viene de una Fuente) ── */}
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

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(url || sourceKind === 'lumen_practice') && (
          <button
            onClick={handleOpen}
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
            Quiero probarlo
          </button>
        )}
        {resourceId && (
          <button
            onClick={() => dispatch('save_to_sanctuary', { resource_id: resourceId })}
            style={{
              padding: '0.625rem 1.5rem',
              borderRadius: '999px',
              background: 'transparent',
              border: `1px solid ${isSaved ? tokens.accent : tokens.accentSoft30}`,
              color: tokens.accentDeep,
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {isSaved ? '✓ Lo tengo guardado' : 'Quiero volver a esto'}
          </button>
        )}
      </div>

      {isRepeat && (
        <div
          style={{
            marginTop: '1rem',
            fontSize: '0.7rem',
            color: tokens.textMuted,
            fontStyle: 'italic',
          }}
        >
          Ya lo viste antes
        </div>
      )}
      </div>
    </div>
  )
}

// ─── SanctuaryDetail ─────────────────────────────────────────────
function SanctuaryDetail({
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


function NamePrompt({
  actions,
  dispatch,
  tokens,
}: {
  actions: Array<{ label: string; action: string; value?: string; variant?: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
}) {
  const [name, setName] = useState('')
  const handleAction = (actionName: string) => {
    if (actionName === 'submit_name') {
      dispatch('submit_name', { first_name: name.trim() })
    } else {
      dispatch(actionName)
    }
  }
  return (
    <div style={{ textAlign: 'center' }}>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Tu nombre"
        maxLength={40}
        autoFocus
        style={{
          width: '100%',
          maxWidth: '18rem',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          border: `1px solid ${tokens.cardBorder}`,
          background: tokens.cardBg,
          color: tokens.textPrimary,
          fontSize: '1rem',
          fontFamily: 'inherit',
          textAlign: 'center',
          outline: 'none',
          marginBottom: '1.5rem',
        }}
      />
      <div style={{
        display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
        gap: '0.5rem', justifyContent: 'center',
      }}>
        {actions.map((action, idx) => (
          <Pill
            key={`${action.action}-${idx}`}
            label={action.label}
            variant={
              action.action === 'submit_name' && !name.trim()
                ? 'outline'
                : (action.variant as 'solid' | 'outline' | 'ghost') || 'outline'
            }
            onClick={() => handleAction(action.action)}
            tokens={tokens}
          />
        ))}
      </div>
    </div>
  )
}

// ─── NoteEditor ──────────────────────────────────────────────────
function NoteEditor({
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

// ─── ListFilterPanel ─────────────────────────────────────────────
function ListFilterPanel({
  filterOptions,
  currentFilters,
  dispatch,
  action,
  tokens,
}: {
  filterOptions: {
    area?: Array<{ value: string; label: string }>
    format?: Array<{ value: string; label: string }>
    duration?: Array<{ value: string; label: string }>
    has_note?: Array<{ value: string; label: string }>
  }
  currentFilters: {
    area?: string
    format?: string
    duration?: string
    has_note?: string
  }
  dispatch: (action: string, extra?: Record<string, string>) => void
  action: string
  tokens: ModuleTokens
}) {
  const activeCount =
    (currentFilters.area     ? 1 : 0) +
    (currentFilters.format   ? 1 : 0) +
    (currentFilters.duration ? 1 : 0) +
    (currentFilters.has_note ? 1 : 0)

  const [expanded, setExpanded] = useState(activeCount > 0)

  const handleToggle = (
    group: 'area' | 'format' | 'duration' | 'has_note',
    value: string
  ) => {
    const current = currentFilters[group] || ''
    const next = current === value ? '' : value
    const extras: Record<string, string> = {
      filter_area:     group === 'area'     ? next : (currentFilters.area || ''),
      filter_format:   group === 'format'   ? next : (currentFilters.format || ''),
      filter_duration: group === 'duration' ? next : (currentFilters.duration || ''),
      filter_has_note: group === 'has_note' ? next : (currentFilters.has_note || ''),
    }
    dispatch(action, extras)
  }

  const clearAll = () => {
    dispatch(action, {
      filter_area: '',
      filter_format: '',
      filter_duration: '',
      filter_has_note: '',
    })
  }

  const Row = ({
    label,
    options,
    group,
    selected,
  }: {
    label: string
    options: Array<{ value: string; label: string }>
    group: 'area' | 'format' | 'duration' | 'has_note'
    selected: string
  }) => (
    <div style={{ marginBottom: '0.625rem' }}>
      <div
        style={{
          fontSize: '0.65rem',
          color: tokens.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '0.375rem',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        {options.map(opt => {
          const active = selected === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => handleToggle(group, opt.value)}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '999px',
                background: active ? tokens.accentSoft20 : 'transparent',
                border: `1px solid ${active ? tokens.accent : tokens.accentSoft30}`,
                color: active ? tokens.accentDeep : tokens.textSecondary,
                fontSize: '0.75rem',
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
  )

  const hasArea     = filterOptions.area && filterOptions.area.length > 0
  const hasFormat   = filterOptions.format && filterOptions.format.length > 0
  const hasDuration = filterOptions.duration && filterOptions.duration.length > 0
  const hasNote     = filterOptions.has_note && filterOptions.has_note.length > 0
  if (!hasArea && !hasFormat && !hasDuration && !hasNote) return null

  // Resumen compacto de filtros activos para mostrar cuando está colapsado
  const summary = [
    currentFilters.area && (filterOptions.area?.find(o => o.value === currentFilters.area)?.label),
    currentFilters.format && (filterOptions.format?.find(o => o.value === currentFilters.format)?.label),
    currentFilters.duration && (filterOptions.duration?.find(o => o.value === currentFilters.duration)?.label),
    currentFilters.has_note && (filterOptions.has_note?.find(o => o.value === currentFilters.has_note)?.label),
  ].filter(Boolean).join(' · ')

  return (
    <div
      style={{
        background: tokens.accentSoft10,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: '14px',
        marginBottom: '1rem',
        textAlign: 'left',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Header siempre visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          padding: '0.625rem 0.875rem',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: tokens.textSecondary,
          fontSize: '0.78rem',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: tokens.textMuted,
            }}
          >
            Filtros
          </span>
          {activeCount > 0 && (
            <span
              style={{
                background: tokens.accentSoft20,
                color: tokens.accentDeep,
                fontSize: '0.7rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontWeight: 500,
              }}
            >
              {activeCount}
            </span>
          )}
          {!expanded && summary && (
            <span style={{ color: tokens.textSecondary, fontStyle: 'italic' }}>{summary}</span>
          )}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {activeCount > 0 && (
            <span
              onClick={e => { e.stopPropagation(); clearAll() }}
              style={{
                fontSize: '0.7rem',
                color: tokens.textMuted,
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              limpiar
            </span>
          )}
          <span style={{ fontSize: '0.7rem', color: tokens.textMuted }}>
            {expanded ? '▴' : '▾'}
          </span>
        </span>
      </button>

      {/* Cuerpo expandible */}
      {expanded && (
        <div style={{ padding: '0 0.875rem 0.75rem' }}>
          {hasArea     && <Row label="Área"     options={filterOptions.area!}     group="area"     selected={currentFilters.area || ''} />}
          {hasFormat   && <Row label="Formato"  options={filterOptions.format!}   group="format"   selected={currentFilters.format || ''} />}
          {hasDuration && <Row label="Duración" options={filterOptions.duration!} group="duration" selected={currentFilters.duration || ''} />}
          {hasNote     && <Row label="Nota"     options={filterOptions.has_note!} group="has_note" selected={currentFilters.has_note || ''} />}
        </div>
      )}
    </div>
  )
}


// ─── BottomNav: navegación canónica entre módulos ────────────────
// 4 puntos sutiles al pie, uno por módulo, cada uno en su color.
// El módulo actual tiene punto lleno + halo; los demás, borde fino.
function BottomNav({
  currentSource,
  dispatch,
  bgColor,
}: {
  currentSource: string
  dispatch: (action: string, extra?: Record<string, string>) => void
  bgColor: string
}) {
  const modules: Array<{
    key: 'lumi' | 'fuente' | 'sanctuary' | 'circles'
    label: string
    action: string
    disabled?: boolean
  }> = [
    { key: 'lumi',      label: 'LUMI',      action: 'go_home' },
    { key: 'fuente',    label: 'Fuente',    action: 'open_fuente' },
    { key: 'sanctuary', label: 'Santuario', action: 'open_sanctuary' },
    { key: 'circles',   label: 'Círculos',  action: 'open_circulos', disabled: true },
  ]

  // Mapeo de source que viene del backend a la key del nav.
  // HOME viene como '' (sin contentSource) → activamos LUMI.
  const activeKey: typeof modules[number]['key'] =
    currentSource === 'fuente'    ? 'fuente'    :
    currentSource === 'sanctuary' ? 'sanctuary' :
    currentSource === 'circles'   ? 'circles'   :
    'lumi'

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: '0.75rem',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
        display: 'flex',
        justifyContent: 'center',
        gap: '2.5rem',
        pointerEvents: 'none',
        zIndex: 10,
        background: `linear-gradient(to bottom, transparent, ${bgColor} 40%)`,
      }}
    >
      {modules.map(m => {
        const moduleTokens = getModuleTokens(m.key)
        const active = activeKey === m.key
        const disabled = !!m.disabled

        return (
          <button
            key={m.key}
            onClick={() => !disabled && !active && dispatch(m.action)}
            disabled={disabled}
            aria-label={m.label}
            title={disabled ? `${m.label} · próximamente` : m.label}
            style={{
              pointerEvents: 'auto',
              background: 'transparent',
              border: 'none',
              cursor: disabled ? 'not-allowed' : active ? 'default' : 'pointer',
              padding: '0.25rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem',
              fontFamily: 'inherit',
              opacity: disabled ? 0.32 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            <span
              style={{
                width: active ? 10 : 6,
                height: active ? 10 : 6,
                borderRadius: '50%',
                background: active ? moduleTokens.accent : 'transparent',
                border: active ? 'none' : `1.5px solid ${moduleTokens.accent}`,
                boxShadow: active ? `0 0 10px ${moduleTokens.accentSoft30}` : 'none',
                transition: 'all 0.3s ease',
                display: 'block',
              }}
            />
            <span
              style={{
                fontSize: '0.62rem',
                color: active ? moduleTokens.accentDeep : moduleTokens.accent,
                opacity: active ? 1 : 0.5,
                letterSpacing: '0.06em',
                fontWeight: active ? 500 : 400,
                transition: 'all 0.3s ease',
              }}
            >
              {m.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}


// ─── FarosPanel ──────────────────────────────────────────────────
// Las 6 brújulas íntimas. Guardado silencioso al perder foco.
// El componente mantiene state local de los textos para que el
// guardado no cause re-render. El componente se monta una vez por
// visita y se desmonta al cambiar de módulo.
function FarosPanel({
  content,
  dispatch,
  tokens,
}: {
  content: Record<string, unknown>
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
}) {
  const faros = (content.faros as Array<{
    area: string
    label: string
    hint?: string
    faro_text: string
    has_faro: boolean
  }>) || []

  const privacyHint = (content.privacy_hint as string) ||
    'Solo vos podés leer estos textos. LUMI no los usa.'

  // State local: una entrada por área. NO se sincroniza con content
  // después del montaje inicial (uncontrolled-ish pattern).
  const [texts, setTexts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const f of faros) initial[f.area] = f.faro_text || ''
    return initial
  })

  const handleBlur = (area: string) => {
    const text = texts[area] ?? ''
    // Disparar silenciosamente — el backend devuelve {ok:true} sin envelope,
    // entonces el state global no se toca y no hay re-render.
    dispatch('save_faro', { area, faro_text: text })
  }

  return (
    <div style={{ textAlign: 'left' }}>
      <p
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: '0.95rem',
          color: tokens.textSecondary,
          textAlign: 'center',
          margin: '0 0 1.75rem 0',
          maxWidth: '38ch',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        ¿Hacia dónde querés orientar tu energía en cada área?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {faros.map(faro => (
          <div
            key={faro.area}
            style={{
              background: tokens.cardBg,
              border: `1px solid ${tokens.cardBorder}`,
              borderRadius: '14px',
              padding: '1rem 1.125rem',
            }}
          >
            <div
              style={{
                fontSize: '0.7rem',
                color: tokens.accentDeep,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 500,
                marginBottom: '0.5rem',
              }}
            >
              {faro.label}
            </div>
            <textarea
              value={texts[faro.area] ?? ''}
              onChange={e => setTexts(t => ({ ...t, [faro.area]: e.target.value }))}
              onBlur={() => handleBlur(faro.area)}
              rows={2}
              placeholder="Tu orientación para esta área..."
              style={{
                width: '100%',
                padding: '0.5rem 0',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontSize: '1rem',
                color: tokens.textPrimary,
                lineHeight: 1.5,
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
      </div>

      <p
        style={{
          fontSize: '0.72rem',
          color: tokens.textMuted,
          fontStyle: 'italic',
          textAlign: 'center',
          marginTop: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {privacyHint}
      </p>
    </div>
  )
}


// ─── ContributionForm ────────────────────────────────────────────
// Form para proponer un recurso a La Fuente.
function ContributionForm({
  actions,
  dispatch,
  tokens,
}: {
  actions: Array<{ label: string; action: string; variant?: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
}) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [why, setWhy] = useState('')

  const canSubmit = title.trim().length > 0

  const handleAction = (actionName: string) => {
    if (actionName === 'submit_contribution') {
      if (!canSubmit) return
      dispatch('submit_contribution', {
        contribution_title: title.trim(),
        contribution_url:   url.trim(),
        contribution_why:   why.trim(),
      })
    } else {
      dispatch(actionName)
    }
  }

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    rows = 1,
    required = false,
  ) => (
    <div style={{ marginBottom: '1.25rem' }}>
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
        {label} {required && <span style={{ color: tokens.accent }}>·</span>}
      </label>
      {rows > 1 ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '0.75rem 0.875rem',
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
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '0.75rem 0.875rem',
            borderRadius: '12px',
            background: tokens.cardBg,
            border: `1px solid ${tokens.cardBorder}`,
            color: tokens.textPrimary,
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  )

  return (
    <div style={{ textAlign: 'left' }}>
      {field('Título del recurso', title, setTitle, 'Ej: Una guía sobre meditación matinal', 1, true)}
      {field('Enlace (opcional)', url, setUrl, 'https://...', 1)}
      {field('¿Por qué te parece valioso?', why, setWhy, 'Lo que sentís que aporta...', 3)}

      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
        {actions.map((action, idx) => {
          const isSubmit = action.action === 'submit_contribution'
          const disabled = isSubmit && !canSubmit
          return (
            <Pill
              key={`${action.action}-${idx}`}
              label={action.label}
              variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
              onClick={() => !disabled && handleAction(action.action)}
              tokens={tokens}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── ShareText ───────────────────────────────────────────────────
// Texto editable + botón copiar al portapapeles.
function ShareText({
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
  const initialText = (content.text as string) || ''
  const [text, setText] = useState(initialText)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      // Avisar al backend (registra el evento si quiere)
      dispatch('share_text_copied')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback silencioso si clipboard API no disponible
      setCopied(false)
    }
  }

  return (
    <div style={{ textAlign: 'left' }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={6}
        style={{
          width: '100%',
          padding: '1rem 1.125rem',
          borderRadius: '14px',
          background: tokens.cardBg,
          border: `1px solid ${tokens.cardBorder}`,
          color: tokens.textPrimary,
          fontSize: '0.95rem',
          fontFamily: 'inherit',
          resize: 'vertical',
          outline: 'none',
          lineHeight: 1.55,
          boxSizing: 'border-box',
          marginBottom: '1rem',
        }}
      />

      <button
        onClick={handleCopy}
        style={{
          width: '100%',
          padding: '0.75rem 1.25rem',
          borderRadius: '999px',
          background: copied ? tokens.accentSoft20 : tokens.accent,
          border: `1px solid ${tokens.accent}`,
          color: copied ? tokens.accentDeep : '#FFFFFF',
          fontSize: '0.9rem',
          cursor: 'pointer',
          fontWeight: 500,
          fontFamily: 'inherit',
          transition: 'all 0.25s ease',
          marginBottom: '1rem',
        }}
      >
        {copied ? '✓ Copiado al portapapeles' : 'Copiar texto'}
      </button>

      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
        {actions.map((action, idx) => (
          <Pill
            key={`${action.action}-${idx}`}
            label={action.label}
            variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
            onClick={() => dispatch(action.action)}
            tokens={tokens}
          />
        ))}
      </div>
    </div>
  )
}



// ─── Embed components ────────────────────────────────────────────
// Cada uno recibe src ya normalizado (los helpers en embedHelpers.ts
// convierten URLs públicas → URLs de embed).

function YouTubeEmbed({ src, title }: {
  src: string
  title: string
  tokens: ModuleTokens
}) {
  return (
    <div style={{
      position: 'relative',
      paddingBottom: '56.25%',
      height: 0,
      borderRadius: '12px',
      overflow: 'hidden',
      background: '#000',
    }}>
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%',
          height: '100%',
          border: 0,
        }}
      />
    </div>
  )
}

function VimeoEmbed({ src, title }: {
  src: string
  title: string
  tokens: ModuleTokens
}) {
  return (
    <div style={{
      position: 'relative',
      paddingBottom: '56.25%',
      height: 0,
      borderRadius: '12px',
      overflow: 'hidden',
      background: '#000',
    }}>
      <iframe
        src={src}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%',
          height: '100%',
          border: 0,
        }}
      />
    </div>
  )
}

function SpotifyEmbed({ src, title }: {
  src: string
  title: string
  tokens: ModuleTokens
}) {
  return (
    <iframe
      src={src}
      title={title}
      width="100%"
      height="352"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      style={{ borderRadius: '12px', border: 0, display: 'block' }}
    />
  )
}

function SoundCloudEmbed({ src, title }: {
  src: string
  title: string
  tokens: ModuleTokens
}) {
  return (
    <iframe
      src={src}
      title={title}
      width="100%"
      height="166"
      scrolling="no"
      allow="autoplay"
      style={{ borderRadius: '12px', border: 0, display: 'block' }}
    />
  )
}

function PdfEmbed({ src, title }: {
  src: string
  title: string
  tokens: ModuleTokens
}) {
  return (
    <iframe
      src={src}
      title={title}
      style={{
        width: '100%',
        height: '85vh',
        border: 0,
        borderRadius: '12px',
        background: '#FFFFFF',
        display: 'block',
      }}
    />
  )
}

function ImageEmbed({ src, title }: {
  src: string
  title: string
  tokens: ModuleTokens
}) {
  return (
    <img
      src={src}
      alt={title}
      style={{
        width: '100%',
        maxWidth: '64rem',
        maxHeight: '85vh',
        objectFit: 'contain',
        borderRadius: '12px',
        display: 'block',
        margin: '0 auto',
      }}
    />
  )
}

function AudioDirect({ src, title }: {
  src: string
  title: string
  tokens: ModuleTokens
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontStyle: 'italic',
        fontSize: '1.1rem',
        color: '#F4EFE6',
        marginBottom: '1.5rem',
        fontWeight: 400,
      }}>
        {title}
      </h3>
      <audio
        src={src}
        controls
        style={{
          width: '100%',
          maxWidth: '30rem',
        }}
      />
    </div>
  )
}

// ─── GuidedPractice ──────────────────────────────────────────────
function GuidedPractice({
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

// ─── ResourceViewer (full screen overlay) ────────────────────────
// Toma la pantalla completa. LUMI se retira durante el recurso —
// vuelve cuando la persona cierra. Canon: "presencia que se aparta
// para que la práctica ocurra".
function ResourceViewer({
  sourceKind,
  url,
  title,
  content,
  actions,
  dispatch,
  tokens,
}: {
  sourceKind: string
  url: string
  title: string
  content?: Record<string, unknown>
  actions: Array<{ label: string; action: string; variant?: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
}) {
  // Lock del scroll del body mientras el viewer está abierto
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [])

  // ESC cierra el viewer
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch('close_resource_viewer')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [dispatch])

  let embedNode: React.ReactNode = null

  if (sourceKind === 'lumen_practice') {
    embedNode = <GuidedPractice content={content || {}} tokens={tokens} dispatch={dispatch} />
  } else if (sourceKind === 'youtube') {
    const u = youtubeEmbedUrl(url)
    embedNode = u ? <YouTubeEmbed src={u} title={title} tokens={tokens} /> : null
  } else if (sourceKind === 'vimeo') {
    const u = vimeoEmbedUrl(url)
    embedNode = u ? <VimeoEmbed src={u} title={title} tokens={tokens} /> : null
  } else if (sourceKind === 'spotify') {
    const u = spotifyEmbedUrl(url)
    embedNode = u ? <SpotifyEmbed src={u} title={title} tokens={tokens} /> : null
  } else if (sourceKind === 'soundcloud') {
    const u = soundcloudEmbedUrl(url)
    embedNode = u ? <SoundCloudEmbed src={u} title={title} tokens={tokens} /> : null
  } else if (sourceKind === 'pdf') {
    embedNode = url ? <PdfEmbed src={url} title={title} tokens={tokens} /> : null
  } else if (sourceKind === 'image') {
    embedNode = url ? <ImageEmbed src={url} title={title} tokens={tokens} /> : null
  } else if (sourceKind === 'audio_direct') {
    embedNode = url ? <AudioDirect src={url} title={title} tokens={tokens} /> : null
  }

  const shareAction = actions.find(a => a.action === 'share_resource')

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#1A1812',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Barra superior — cerrar + compartir opcional */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          padding: '0.875rem 1rem',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          zIndex: 10,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0))',
          pointerEvents: 'none',
        }}
      >
        {shareAction && (
          <button
            onClick={() => dispatch('share_resource', { title, url })}
            aria-label="Compartir"
            style={{
              pointerEvents: 'auto',
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(10px)',
              color: '#F4EFE6',
              fontSize: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'inherit',
              transition: 'background 0.2s ease',
            }}
          >
            ↗
          </button>
        )}
        <button
          onClick={() => dispatch('close_resource_viewer')}
          aria-label="Cerrar"
          style={{
            pointerEvents: 'auto',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.14)',
            backdropFilter: 'blur(10px)',
            color: '#F4EFE6',
            fontSize: '1.25rem',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'inherit',
            transition: 'background 0.2s ease',
          }}
        >
          ✕
        </button>
      </div>

      {/* Contenido centrado */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 1rem 1.5rem',
          overflow: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: '64rem', margin: '0 auto' }}>
          {embedNode ?? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontSize: '1.05rem',
                  lineHeight: 1.6,
                  margin: '0 auto 2rem',
                  maxWidth: '38ch',
                  color: 'rgba(244, 239, 230, 0.8)',
                }}
              >
                Este recurso vive afuera de LUMEN. Lo abro en otra pestaña — volvés cuando quieras.
              </p>
              {url && (
                <button
                  onClick={() => {
                    window.open(url, '_blank', 'noopener,noreferrer')
                    dispatch('external_open', { url })
                  }}
                  style={{
                    padding: '0.875rem 2.25rem',
                    borderRadius: '999px',
                    background: tokens.accent,
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                  }}
                >
                  Lo abro en otra pestaña
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── ContentArea ─────────────────────────────────────────────────
function ContentArea({
  contentType,
  contentData,
  actions,
  dispatch,
  tokens,
}: {
  contentType: string
  contentData: Record<string, unknown>
  actions: Array<{ label: string; action: string; value?: string; variant?: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
}) {
  // resource_card
  if (contentType === 'resource_card') {
    return (
      <>
        <ResourceCard content={contentData} dispatch={dispatch} tokens={tokens} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {actions.map((action, idx) => (
            <Pill
              key={`${action.action}-${idx}`}
              label={action.label}
              variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
              onClick={() => {
                if (action.action === 'share_resource') {
                  dispatch('share_resource', {
                    title:    (contentData.title as string) || '',
                    format:   (contentData.format as string) || '',
                    duration: (contentData.duration_min as string | number)?.toString() || '',
                    url:      (contentData.url as string) || '',
                  })
                } else {
                  dispatch(action.action)
                }
              }}
              tokens={tokens}
            />
          ))}
        </div>
      </>
    )
  }

  // checkin_options
  if (contentType === 'checkin_options') {
    const step = (contentData.step as string) || ''
    const options =
      (contentData.options as Array<{ value: string; label: string; hint?: string }>) || []
    const actionName = `submit_checkin_${step}`
    const paramKey = `checkin_${step}`

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {options.map(opt => (
          <Pill
            key={opt.value}
            label={opt.label}
            hint={opt.hint}
            onClick={() => dispatch(actionName, { [paramKey]: opt.value })}
            tokens={tokens}
          />
        ))}
      </div>
    )
  }

  // item_list
  if (contentType === 'item_list') {
    const items =
      (contentData.items as Array<{
        id: string
        title: string
        subtitle?: string
        format?: string
        duration_min?: number
        area?: string
        author?: string
        has_note?: boolean
        action: string
        value?: string
      }>) || []

    const filterOptions = contentData.filter_options as
      | { area?: Array<{ value: string; label: string }>
          format?: Array<{ value: string; label: string }>
          duration?: Array<{ value: string; label: string }> }
      | undefined
    const currentFilters = (contentData.current_filters as
      | { area?: string; format?: string; duration?: string }
      | undefined) || {}
    const source = contentData.source as string | undefined

    return (
      <>
        {filterOptions && (
          <ListFilterPanel
            filterOptions={filterOptions}
            currentFilters={currentFilters}
            dispatch={dispatch}
            action={source === 'sanctuary' ? 'open_sanctuary' : 'open_fuente'}
            tokens={tokens}
          />
        )}

        {items.length === 0 ? (
          <div
            style={{
              fontSize: '0.9rem',
              color: tokens.textMuted,
              fontStyle: 'italic',
              padding: '2rem 0',
              textAlign: 'center',
            }}
          >
            Sin resultados.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: actions.length > 0 ? '1.5rem' : 0,
            }}
          >
            {items.map(item => {
              const subtitle =
                item.subtitle ??
                [item.format, item.area && item.area.replace(/_/g, ' ')]
                  .filter(Boolean)
                  .join(' · ')

              const extra: Record<string, string> = {}
              if (item.action === 'open_sanctuary_item') {
                extra.sanctuary_item_id = item.id
              } else {
                extra.resource_id = item.id
                if (item.value) extra.source = item.value
              }

              return (
                <ResourceListCard
                  key={item.id}
                  title={item.title}
                  subtitle={subtitle || undefined}
                  author={item.author}
                  format={item.format}
                  durationMin={item.duration_min}
                  onClick={() => dispatch(item.action, extra)}
                  tokens={tokens}
                />
              )
            })}
          </div>
        )}
        {actions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {actions.map((action, idx) => (
              <Pill
                key={`${action.action}-${idx}`}
                label={action.label}
                variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
                onClick={() => dispatch(action.action)}
                tokens={tokens}
              />
            ))}
          </div>
        )}
      </>
    )
  }

  // sanctuary_detail
  if (contentType === 'sanctuary_detail') {
    return (
      <>
        <SanctuaryDetail content={contentData} tokens={tokens} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {actions.map((action, idx) => (
            <Pill
              key={`${action.action}-${idx}`}
              label={action.label}
              variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
              onClick={() => {
                const extra: Record<string, string> = {}
                if (action.action === 'share_resource') {
                  dispatch('share_resource', {
                    title:    (contentData.title as string) || '',
                    format:   (contentData.format as string) || '',
                    duration: (contentData.duration_min as string) || '',
                    url:      (contentData.url as string) || '',
                  })
                  return
                }
                if (action.value) {
                  if (action.action === 'open_note_editor') {
                    extra.resource_id = action.value
                  } else if (
                    action.action === 'confirm_remove_from_sanctuary' ||
                    action.action === 'remove_from_sanctuary'
                  ) {
                    extra.sanctuary_item_id = action.value
                  }
                }
                dispatch(action.action, Object.keys(extra).length ? extra : undefined)
              }}
              tokens={tokens}
            />
          ))}
        </div>
      </>
    )
  }

  // note_editor
  if (contentType === 'note_editor') {
    return <NoteEditor content={contentData} actions={actions} dispatch={dispatch} tokens={tokens} />
  }

// faros_panel ◀ NUEVO
  if (contentType === 'faros_panel') {
    return (
      <>
        <FarosPanel content={contentData} dispatch={dispatch} tokens={tokens} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {actions.map((action, idx) => (
            <Pill
              key={`${action.action}-${idx}`}
              label={action.label}
              variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
              onClick={() => dispatch(action.action)}
              tokens={tokens}
            />
          ))}
        </div>
      </>
    )
  }


// name_prompt
  if (contentType === 'name_prompt') {
    return <NamePrompt actions={actions} dispatch={dispatch} tokens={tokens} />
  }

// contribution_form
  if (contentType === 'contribution_form') {
    return <ContributionForm actions={actions} dispatch={dispatch} tokens={tokens} />
  }

  // share_text
  if (contentType === 'share_text') {
    return <ShareText content={contentData} actions={actions} dispatch={dispatch} tokens={tokens} />
  }

  // external_fallback + todos los source_kinds embebibles → ResourceViewer
  if (
    contentType === 'external_fallback' ||
    contentType === 'lumen_practice' ||
    contentType === 'youtube' ||
    contentType === 'vimeo' ||
    contentType === 'spotify' ||
    contentType === 'soundcloud' ||
    contentType === 'pdf' ||
    contentType === 'image' ||
    contentType === 'audio_direct'
  ) {
    return (
      <ResourceViewer
        sourceKind={contentType === 'external_fallback' ? 'external_fallback' : contentType}
        url={(contentData.activeUrl as string) || ''}
        title={(contentData.title as string) || ''}
        content={contentData}
        actions={actions}
        dispatch={dispatch}
        tokens={tokens}
      />
    )
  }

  // default (empty_presence, etc.)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {actions.map((action, idx) => (
        <Pill
          key={`${action.action}-${idx}`}
          label={action.label}
          variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
          onClick={() => dispatch(action.action)}
          tokens={tokens}
        />
      ))}
    </div>
  )
}

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// ─── App shell ───────────────────────────────────────────────────
function App() {
  const { state, dispatch } = useLumi()
  const tokens = getModuleTokens(state.contentSource)

  const accentGlowPeak = hexToRgba(tokens.accent, 0.5)

  return (
    <>
      <style>{`
        @keyframes lumi-pulse {
          0%, 100% { transform: scale(1); opacity: 0.85; box-shadow: ${tokens.orbGlow}; }
          50%      { transform: scale(1.12); opacity: 1; box-shadow: 0 0 24px 24px ${accentGlowPeak}; }
        }
        @keyframes lumiAppear {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        body { margin: 0; }
        .lumi-orb {
          transition: background 0.5s ease, box-shadow 0.5s ease;
        }
        .lumi-bg {
          transition: background-color 0.6s ease, color 0.6s ease;
        }
      `}</style>

      <div
        className="lumi-bg"
        style={{
          minHeight: '100vh',
          backgroundColor: tokens.background,
          color: tokens.textPrimary,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '2rem 1.25rem 6rem',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: 560,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* LUMI: orb permanente en el centro, solo cambia de color */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <div
              className="lumi-orb"
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, ${tokens.orbInner}, ${tokens.orbMid} 60%, ${tokens.orbOuter})`,
                animation: 'lumi-pulse 2.5s ease-in-out infinite',
              }}
            />
          </div>

          <div
            key={state.lumiMessage}
            style={{ animation: 'lumiAppear 600ms ease-out both', width: '100%', textAlign: 'center' }}
          >
            {(() => {
              const perla   = (state.lumiContentData?.culture_phrase as string) || ''
              const mensaje = state.lumiMessage || ''
              if (!perla && !mensaje) return null
              return (
                <div
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    lineHeight: 1.5,
                    margin: '0 auto 1.75rem',
                    maxWidth: '38ch',
                  }}
                >
                  {perla && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontStyle: 'italic',
                        color: tokens.textMuted,
                        opacity: 0.75,
                        marginBottom: mensaje ? '0.65rem' : 0,
                        letterSpacing: '0.005em',
                      }}
                    >
                      "{perla}"
                    </span>
                  )}
                  {mensaje && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: '1.05rem',
                        color: tokens.textPrimary,
                      }}
                    >
                      {mensaje}
                    </span>
                  )}
                </div>
              )
            })()}

            <ContentArea
              contentType={state.lumiContentType}
              contentData={state.lumiContentData}
              actions={state.lumiActions}
              dispatch={dispatch}
              tokens={tokens}
            />
          </div>

          <details
            style={{
              marginTop: '3rem',
              width: '100%',
              fontSize: '0.7rem',
              color: tokens.textMuted,
              opacity: 0.6,
            }}
          >
            <summary style={{ cursor: 'pointer' }}>debug</summary>
            <pre
              style={{
                background: 'rgba(0,0,0,0.04)',
                padding: '0.75rem',
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '0.65rem',
              }}
            >
              {JSON.stringify(
                {
                  code: state.lumiCode,
                  content_type: state.lumiContentType,
                  source: state.contentSource,
                  module: tokens.source,
                  session: state.currentSessionId,
                  resource: state.currentResourceId,
                  sanctuary_item: state.currentSanctuaryItemId,
                  checkin: {
                    state: state.checkinState,
                    area: state.checkinArea,
                    time: state.checkinTime,
                  },
                  actions: state.lumiActions.map(a => `${a.label} → ${a.action}`),
                },
                null,
                2
              )}
            </pre>
          </details>
        </div>
      </div>
       <BottomNav currentSource={state.contentSource} dispatch={dispatch} bgColor={tokens.background} />
    </>
  )
}
export default App