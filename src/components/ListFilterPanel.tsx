import { useState } from 'react'
import type { ModuleTokens } from '../lib/tokens'

export function ListFilterPanel({
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
    necesito?: Array<{ value: string; label: string }>
  }
  currentFilters: {
    area?: string
    format?: string
    duration?: string
    has_note?: string
    necesito?: string
  }
  
  dispatch: (action: string, extra?: Record<string, string>) => void
  action: string
  tokens: ModuleTokens
}) {
  const activeCount =
    (currentFilters.area     ? 1 : 0) +
    (currentFilters.format   ? 1 : 0) +
    (currentFilters.duration ? 1 : 0) +
    (currentFilters.has_note ? 1 : 0) +
    (currentFilters.necesito ? 1 : 0)

  const [expanded, setExpanded] = useState(activeCount > 0)

  const handleToggle = (
    group: 'area' | 'format' | 'duration' | 'has_note' | 'necesito',
    value: string
  ) => {
    const current = currentFilters[group] || ''
    const next = current === value ? '' : value
    const extras: Record<string, string> = {
      filter_area:     group === 'area'     ? next : (currentFilters.area || ''),
      filter_format:   group === 'format'   ? next : (currentFilters.format || ''),
      filter_duration: group === 'duration' ? next : (currentFilters.duration || ''),
      filter_has_note: group === 'has_note' ? next : (currentFilters.has_note || ''),
      filter_necesito: group === 'necesito' ? next : (currentFilters.necesito || ''),
    }
    dispatch(action, extras)
  }

  const clearAll = () => {
    dispatch(action, {
      filter_area: '',
      filter_format: '',
      filter_duration: '',
      filter_has_note: '',
      filter_necesito: '',
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
  const hasNecesito = filterOptions.necesito && filterOptions.necesito.length > 0
  if (!hasArea && !hasFormat && !hasDuration && !hasNote && !hasNecesito) return null
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

      {expanded && (
        <div style={{ padding: '0 0.875rem 0.75rem' }}>
         {hasNecesito && <Row label="Necesito" options={filterOptions.necesito!} group="necesito" selected={currentFilters.necesito || ''} />}
          {hasArea     && <Row label="Área"     options={filterOptions.area!}     group="area"     selected={currentFilters.area || ''} />}
          {hasFormat   && <Row label="Formato"  options={filterOptions.format!}   group="format"   selected={currentFilters.format || ''} />}
          {hasDuration && <Row label="Duración" options={filterOptions.duration!} group="duration" selected={currentFilters.duration || ''} />}
          {hasNote     && <Row label="Nota"     options={filterOptions.has_note!} group="has_note" selected={currentFilters.has_note || ''} />}
        </div>
      )}
    </div>
  )
}
