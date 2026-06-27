import { useState } from 'react'
import type { ModuleTokens } from '../lib/tokens'
import { Pill } from './Pill'
import { ResourceCard, ResourceListCard } from './ResourceCard'
import { SanctuaryDetail } from './SanctuaryDetail'
import { NoteEditor } from './NoteEditor'
import { NamePrompt } from './NamePrompt'
import { ListFilterPanel } from './ListFilterPanel'
import { ResourceViewer } from './ResourceViewer'
import { ExperiencePreview } from './ExperiencePreview'
import { RegisterForm } from './RegisterForm.tsx'
// ─── FarosPanel ───────────────────────────────────────────────────

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

  const privacyHint = (content.privacy_hint as string) || ''

  const [texts, setTexts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const f of faros) initial[f.area] = f.faro_text || ''
    return initial
  })

  const handleBlur = (area: string) => {
    const text = texts[area] ?? ''
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

      {privacyHint && (
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
      )}
    </div>
  )
}

// ─── ContributionForm ─────────────────────────────────────────────

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

// ─── ShareText ────────────────────────────────────────────────────

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
      dispatch('share_text_copied')
      setTimeout(() => setCopied(false), 2500)
    } catch {
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

// ─── ContentArea ──────────────────────────────────────────────────

export function ContentArea({
  contentType,
  contentData,
  actions,
  dispatch,
  tokens,
  experienceRunId = '',
  onRegister,
}: {
  contentType: string
  contentData: Record<string, unknown>
  actions: Array<{ label: string; action: string; value?: string; variant?: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
  experienceRunId?: string
  onRegister?: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
}) {

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
                } else if (action.action === 'save_to_sanctuary') {
                  dispatch('save_to_sanctuary', {
                    resource_id:       (contentData.resource_id as string) || '',
                    experience_run_id: experienceRunId,
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
            onClick={() => dispatch(actionName, { [paramKey]: opt.value, value: opt.value })}
            tokens={tokens}
          />
        ))}
      </div>
    )
  }

  if (contentType === 'item_list') {
    const items =
      (contentData.items as Array<{
        id: string
        title: string
        subtitle?: string
        format?: string
        duration_min?: number
        author?: string
        has_note?: boolean
        action: string
        value?: string
        experience_id?: string
      }>) || []

    const filterOptions = contentData.filter_options as
      | {
          area?: Array<{ value: string; label: string }>
          format?: Array<{ value: string; label: string }>
          duration?: Array<{ value: string; label: string }>
          has_note?: Array<{ value: string; label: string }>
          necesito?: Array<{ value: string; label: string }>
        }
      | undefined
    const currentFilters = (contentData.current_filters as
      | { area?: string; format?: string; duration?: string; has_note?: string }
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
              // subtitle: preferir el que viene del backend, sino derivar del format
              const subtitle = item.subtitle ?? [item.format].filter(Boolean).join(' · ')

              const extra: Record<string, string> = {}
              if (item.action === 'open_sanctuary_item') {
                extra.sanctuary_item_id = item.id
              } else if (item.experience_id) {
                // Item de La Fuente (modelo nuevo — experience como unidad)
                extra.experience_id = item.experience_id
                extra.resource_id = item.id
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
if (contentType === 'register_form') {
    return (
      <RegisterForm
        onRegister={onRegister || (async () => ({ ok: false, error: 'No disponible' }))}
        dispatch={dispatch}
        tokens={tokens}
      />
    )
  }
if (contentType === 'experience_preview') {
    return (
      <>
        <ExperiencePreview content={contentData} tokens={tokens} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {actions.map((action, idx) => (
            <Pill
              key={`${action.action}-${idx}`}
              label={action.label}
              variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
              onClick={() => {
                if (action.action === 'open_experience') {
                  dispatch('open_experience', {
                    experience_id: (contentData.experience_id as string) || '',
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

  if (contentType === 'sanctuary_detail') {
    return (
      <>
        <SanctuaryDetail content={contentData} dispatch={dispatch} tokens={tokens} />
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

  if (contentType === 'note_editor') {
    return <NoteEditor content={contentData} actions={actions} dispatch={dispatch} tokens={tokens} />
  }

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

  if (contentType === 'name_prompt') {
    return <NamePrompt actions={actions} dispatch={dispatch} tokens={tokens} />
  }

  if (contentType === 'contribution_form') {
    return <ContributionForm actions={actions} dispatch={dispatch} tokens={tokens} />
  }

  if (contentType === 'share_text') {
    return <ShareText content={contentData} actions={actions} dispatch={dispatch} tokens={tokens} />
  }

  // ── Viewer activo en flujo de experiencia ──────────────────────
  if (contentType === 'resource_viewer') {
    return (
      <ResourceViewer
        sourceKind={(contentData.source_kind as string) || 'external_url'}
        url={(contentData.url as string) || ''}
        title={(contentData.title as string) || ''}
        content={contentData}
        actions={actions}
        dispatch={dispatch}
        tokens={tokens}
      />
    )
  }

  // ── Viewers embebibles (Fuente, apertura directa) ──────────────
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

  // ── Default: pills de acción ───────────────────────────────────
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
