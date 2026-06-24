import { useState } from 'react'
import { useLumi } from './lib/useLumi'
import { getModuleTokens, type ModuleTokens } from './lib/tokens'
import {
  youtubeEmbedUrl,
  vimeoEmbedUrl,
  spotifyEmbedUrl,
  soundcloudEmbedUrl,
} from './lib/embedHelpers'

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
      background: 'transparent',
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
      border: 'none',
      color: tokens.textSecondary,
    },
  }

  return (
    <button
      onClick={onClick}
      style={{
        ...styles[variant],
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
        width: '100%',
      }}
    >
      <span>{label}</span>
      {hint && (
        <span style={{ fontSize: '0.7rem', opacity: 0.7, fontStyle: 'italic' }}>{hint}</span>
      )}
    </button>
  )
}

// ─── ItemRow ─────────────────────────────────────────────────────
function ItemRow({
  title,
  subtitle,
  onClick,
  tokens,
}: {
  title: string
  subtitle?: string
  onClick: () => void
  tokens: ModuleTokens
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: tokens.cardBg,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: '12px',
        padding: '0.875rem 1.125rem',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        width: '100%',
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{ fontSize: '0.95rem', color: tokens.textPrimary, fontWeight: 500 }}>
        {title}
      </span>
      {subtitle && (
        <span style={{ fontSize: '0.78rem', color: tokens.textSecondary }}>{subtitle}</span>
      )}
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
  const provider = (content.provider as string) || ''
  const whyNow = (content.why_now as string) || ''
  const minimumStep = (content.minimum_step as string) || ''
  const whatItIsNot = (content.what_it_is_not as string) || ''
  const url = (content.url as string) || ''
  const resourceId = (content.resource_id as string) || ''
  const isFrom = (content.is_from as string) || 'lumi'
  const sessionId = (content.session_id as string) || ''
  const flags = (content.flags as Record<string, boolean>) || {}
  const isRepeat = !!flags.is_repeat
  const isSaved = !!flags.is_saved

  const formatLabel = [
    format && format.charAt(0).toUpperCase() + format.slice(1),
    durationMin && `${durationMin} min`,
  ].filter(Boolean).join(' · ')

  // Source kinds que tienen viewer interno funcionando
  const EMBEDDABLE_KINDS = new Set([
    'youtube', 'vimeo', 'spotify', 'soundcloud', 'pdf', 'image', 'audio_direct'
  ])

  const handleOpen = () => {
    if (!url) return

    const sourceKind = (content.source_kind as string) || 'external_url'

    if (EMBEDDABLE_KINDS.has(sourceKind)) {
      if (resourceId) {
        dispatch('resource_viewer_active', {
          source_kind:        sourceKind,
          resource_id:        resourceId,
          source:             isFrom,
          session_id:         sessionId,
          experience_run_id:  (content.run_id as string) || '',
        })
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
      if (resourceId) {
        dispatch('open_resource', {
          resource_id:       resourceId,
          source:            isFrom,
          session_id:        sessionId,
          experience_run_id: (content.run_id as string) || '',
        })
      }
    }
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
          marginBottom: '1.25rem',
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

      {provider && (
        <div style={{ fontSize: '0.75rem', color: tokens.textMuted, marginBottom: '1.25rem' }}>
          por {provider}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {url && (
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
            Empezar ahora
          </button>
        )}
        {resourceId && (
          <button
            onClick={() => dispatch('save_to_sanctuary', { resource_id: resourceId, experience_run_id: (content.run_id as string) || '' })}
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
            {isSaved ? '✓ Guardado para volver' : 'Guardar para volver'}
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

// ─── NoteEditor ──────────────────────────────────────────────────
function NoteEditor({
  content,
  actions,
  dispatch,
  tokens,
}: {
  content: Record<string, unknown>
  actions: Array<{ label: string; action: string }>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {actions.map((action, idx) => (
          <Pill
            key={`${action.action}-${idx}`}
            label={action.label}
            variant={action.action === 'save_note' ? 'solid' : 'outline'}
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
}: {
  currentSource: string
  dispatch: (action: string, extra?: Record<string, string>) => void
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
  actions: Array<{ label: string; action: string }>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '1.5rem' }}>
        {actions.map((action, idx) => {
          const isSubmit = action.action === 'submit_contribution'
          const disabled = isSubmit && !canSubmit
          return (
            <Pill
              key={`${action.action}-${idx}`}
              label={action.label}
              variant={isSubmit ? 'solid' : 'outline'}
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
  actions: Array<{ label: string; action: string }>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {actions.map((action, idx) => (
          <Pill
            key={`${action.action}-${idx}`}
            label={action.label}
            onClick={() => dispatch(action.action)}
            tokens={tokens}
          />
        ))}
      </div>
    </div>
  )
}

// ─── ExternalFallback ────────────────────────────────────────────
// Pantalla intermedia cuando se "entra" en un recurso externo.
// LUMI no suelta al usuario sin avisar.
function ExternalFallback({
  actions,
  dispatch,
  tokens,
  activeUrl,
}: {
  actions: Array<{ label: string; action: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
  activeUrl: string
}) {
  const handleOpen = () => {
    if (!activeUrl) return
    window.open(activeUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: '0.95rem',
          color: tokens.textSecondary,
          lineHeight: 1.6,
          margin: '0 auto 1.75rem',
          maxWidth: '38ch',
        }}
      >
        Este recurso vive afuera de LUMEN. Voy a abrirlo en otra pestaña — vos volvés cuando quieras.
      </p>

      {activeUrl && (
        <button
          onClick={handleOpen}
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '999px',
            background: tokens.accent,
            border: `1px solid ${tokens.accent}`,
            color: '#FFFFFF',
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontWeight: 500,
            fontFamily: 'inherit',
            marginBottom: '1.5rem',
          }}
        >
          Abrir en pestaña nueva
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {actions.map((action, idx) => (
          <Pill
            key={`${action.action}-${idx}`}
            label={action.label}
            onClick={() => dispatch(action.action)}
            tokens={tokens}
          />
        ))}
      </div>
    </div>
  )
}



// ─── ResourceViewer (despachador por source_kind) ────────────────
// Mira state.resourceSourceKind y renderiza el embed apropiado.
// Si no sabe rendear, cae a external_fallback (botón "Abrir en pestaña").
function ResourceViewer({
  sourceKind,
  url,
  title,
  actions,
  dispatch,
  tokens,
}: {
  sourceKind: string
  url: string
  title: string
  actions: Array<{ label: string; action: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
}) {
  let embedNode: React.ReactNode = null
  let resolved = sourceKind

  // Decidir qué renderer usar
  if (sourceKind === 'youtube') {
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

  // Si no se pudo resolver, caer a external_fallback
  if (!embedNode) {
    resolved = 'external_fallback'
  }

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Título del recurso (sutil, arriba del viewer) */}
      <h2
        style={{
          fontSize: '1.05rem',
          fontWeight: 500,
          color: tokens.textPrimary,
          margin: '0 0 1rem 0',
          lineHeight: 1.4,
        }}
      >
        {title}
      </h2>

      {/* Embed (o fallback) */}
      {embedNode ?? (
        <ExternalFallback
          actions={[]}
          dispatch={dispatch}
          tokens={tokens}
          activeUrl={url}
        />
      )}

      {/* Acciones del nodo (típicamente "Volver", "Me sirvió", etc.) */}
      {actions.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          marginTop: '1.5rem',
        }}>
          {actions.map((action, idx) => (
            <Pill
              key={`${action.action}-${idx}`}
              label={action.label}
              onClick={() => dispatch(action.action)}
              tokens={tokens}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sub-renderers ───────────────────────────────────────────────

function YouTubeEmbed({ src, title, tokens }: { src: string; title: string; tokens: ModuleTokens }) {
  return (
    <div style={{
      position: 'relative',
      paddingBottom: '56.25%', // 16:9
      height: 0,
      overflow: 'hidden',
      borderRadius: '14px',
      background: '#000',
      border: `1px solid ${tokens.cardBorder}`,
    }}>
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          border: 'none',
        }}
      />
    </div>
  )
}

function VimeoEmbed({ src, title, tokens }: { src: string; title: string; tokens: ModuleTokens }) {
  return (
    <div style={{
      position: 'relative',
      paddingBottom: '56.25%',
      height: 0,
      overflow: 'hidden',
      borderRadius: '14px',
      background: '#000',
      border: `1px solid ${tokens.cardBorder}`,
    }}>
      <iframe
        src={src}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          border: 'none',
        }}
      />
    </div>
  )
}

function SpotifyEmbed({ src, title, tokens }: { src: string; title: string; tokens: ModuleTokens }) {
  return (
    <iframe
      src={src}
      title={title}
      allow="encrypted-media"
      style={{
        width: '100%',
        height: 232,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: '14px',
      }}
    />
  )
}

function SoundCloudEmbed({ src, title, tokens }: { src: string; title: string; tokens: ModuleTokens }) {
  return (
    <iframe
      src={src}
      title={title}
      style={{
        width: '100%',
        height: 166,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: '14px',
      }}
    />
  )
}

function PdfEmbed({ src, title, tokens }: { src: string; title: string; tokens: ModuleTokens }) {
  return (
    <iframe
      src={src}
      title={title}
      style={{
        width: '100%',
        height: '70vh',
        minHeight: 400,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: '14px',
        background: tokens.cardBg,
      }}
    />
  )
}

function ImageEmbed({ src, title, tokens }: { src: string; title: string; tokens: ModuleTokens }) {
  return (
    <img
      src={src}
      alt={title}
      style={{
        display: 'block',
        width: '100%',
        height: 'auto',
        borderRadius: '14px',
        border: `1px solid ${tokens.cardBorder}`,
      }}
    />
  )
}

function AudioDirect({ src, title, tokens }: { src: string; title: string; tokens: ModuleTokens }) {
  return (
    <div style={{
      background: tokens.cardBg,
      border: `1px solid ${tokens.cardBorder}`,
      borderRadius: '14px',
      padding: '1.25rem',
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontStyle: 'italic',
        fontSize: '0.95rem',
        color: tokens.textSecondary,
        margin: '0 0 1rem 0',
      }}>
        {title}
      </p>
      <audio
        controls
        src={src}
        style={{ width: '100%' }}
      >
        Tu navegador no soporta audio embebido.
      </audio>
    </div>
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
  actions: Array<{ label: string; action: string; value?: string }>
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
        area?: string
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
              gap: '0.5rem',
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
                <ItemRow
                  key={item.id}
                  title={item.title}
                  subtitle={subtitle || undefined}
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
              onClick={() => dispatch(action.action)}
              tokens={tokens}
            />
          ))}
        </div>
      </>
    )
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
    contentType === 'youtube' ||
    contentType === 'vimeo' ||
    contentType === 'spotify' ||
    contentType === 'soundcloud' ||
    contentType === 'pdf' ||
    contentType === 'image' ||
    contentType === 'audio_direct'
  ) {
    // Necesito acceso al state — vamos a pasarlo como prop a ContentArea
    return (
      <ResourceViewer
        sourceKind={contentType === 'external_fallback' ? 'external_fallback' : contentType}
        url={(contentData.activeUrl as string) || ''}
        title={(contentData.title as string) || ''}
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
          onClick={() => dispatch(action.action)}
          tokens={tokens}
        />
      ))}
    </div>
  )
}

// ─── App shell ───────────────────────────────────────────────────
function App() {
  const { state, dispatch } = useLumi()
  const tokens = getModuleTokens(state.contentSource)

  // Track del módulo actual para forzar re-render del contenido en transición
  const moduleKey = tokens.source

  return (
    <>
      <style>{`
        @keyframes lumi-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50%      { transform: scale(1.06); opacity: 1; }
        }
        @keyframes content-enter {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes message-enter {
          0%   { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        body { margin: 0; }
        .lumi-orb {
          transition: background 0.5s ease, box-shadow 0.5s ease;
        }
        .lumi-bg {
          transition: background-color 0.6s ease, color 0.6s ease;
        }
        .lumi-content {
          animation: content-enter 0.45s ease both;
        }
        .lumi-message {
          animation: message-enter 0.6s ease both;
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
                boxShadow: tokens.orbGlow,
                animation: 'lumi-pulse 3.5s ease-in-out infinite',
              }}
            />
          </div>

{/* Mensaje cultural (solo aparece cuando el envelope lo trae) */}
          {(() => {
            const mensaje = (state.lumiContentData?.culture_phrase as string) || ''
            if (!mensaje) return null
            return (
              <p
                key={`mensaje-${mensaje.slice(0, 20)}`}
                className="lumi-message"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontSize: '0.85rem',
                  color: tokens.textMuted,
                  textAlign: 'center',
                  lineHeight: 1.5,
                  margin: '0 0 1rem 0',
                  maxWidth: '34ch',
                  opacity: 0.85,
                  letterSpacing: '0.005em',
                }}
              >
                "{mensaje}"
              </p>
            )
          })()}

          {/* Mensaje: re-renderiza con fade en cambio de módulo */}
          {state.lumiMessage && (
            <p
              key={`msg-${moduleKey}-${state.lumiCode}`}
              className="lumi-message"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontSize: '1.05rem',
                color: tokens.textPrimary,
                textAlign: 'center',
                lineHeight: 1.5,
                margin: '0 0 1.75rem 0',
                maxWidth: '38ch',
              }}
            >
              {state.lumiMessage}
            </p>
          )}

          {/* Contenido: re-renderiza con fade en cambio de módulo */}
          <div
            key={`content-${moduleKey}-${state.lumiCode}`}
            className="lumi-content"
            style={{ width: '100%' }}
          >
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
       <BottomNav currentSource={state.contentSource} dispatch={dispatch} />
    </>
  )
}
export default App