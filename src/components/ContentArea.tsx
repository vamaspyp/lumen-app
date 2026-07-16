import { useState } from 'react'
import type { ModuleTokens } from '../lib/tokens'
import { Pill } from './Pill'
import { ResourceCard, ResourceListCard } from './ResourceCard'
import { SanctuaryDetail } from './SanctuaryDetail'
import { ExperienceDetailCard } from './ExperienceDetailCard'
import { NoteEditor } from './NoteEditor'
import { NamePrompt } from './NamePrompt'
import { ListFilterPanel } from './ListFilterPanel'
import { ResourceViewer } from './ResourceViewer'
import { ExperiencePreview } from './ExperiencePreview'
import { RegisterForm } from './RegisterForm.tsx'
import { ShareLightEditor } from './ShareLightEditor'
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

// ─── ContentArea ──────────────────────────────────────────────────

export function ContentArea({
  contentType,
  contentData,
  actions,
  dispatch,
  callRpc,
  tokens,
  experienceRunId = '',
  onRegister,
  currentShareToken = '',
}: {
  contentType: string
  contentData: Record<string, unknown>
  actions: Array<{ label: string; action: string; value?: string; variant?: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  callRpc: (rpcName: string, params: Record<string, string>) => Promise<Record<string, unknown> | null>
  tokens: ModuleTokens
  experienceRunId?: string
  onRegister?: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  currentShareToken?: string
}) {

  if (contentType === 'share_light_editor' || contentData.type === 'share_light_editor') {
    return (
      <ShareLightEditor
        content={contentData}
        actions={actions}
        dispatch={dispatch}
        callRpc={callRpc}
        tokens={tokens}
        currentShareToken={currentShareToken}
      />
    )
  }

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
              onClick={() => dispatch(action.action, {
                ...(action.value ? { value: action.value } : {}),
                resource_id:       (contentData.resource_id as string) || '',
                session_id:        (contentData.session_id as string) || '',
                title:             (contentData.title as string) || '',
                format:            (contentData.format as string) || '',
                duration:          String(contentData.duration_min || ''),
                url:               (contentData.url as string) || '',
                ...(experienceRunId ? { experience_run_id: experienceRunId } : {}),
              })}
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
    const actionName = step === 'effect' ? 'submit_feedback_effect' : `submit_checkin_${step}`
    const paramKey   = step === 'effect' ? 'perceived_capability_key' : `checkin_${step}`

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
        life_area_key?: string
        has_note?: boolean
        note_preview?: string
        action: string
        value?: string
        source?: string
        experience_id?: string
        experience_run_id?: string
        resource_id?: string
        sanctuary_item_id?: string
        why_now?: string
        minimum_step?: string
        capability_key?: string
        capability_label?: string
        help_signal?: string
        editorial_status?: string
        source_control?: string
      }>) || []

    const rawFilterOptions = contentData.filter_options as
      | {
          area?: Array<{ value: string; label: string }>
          format?: Array<{ value: string; label: string }>
          formato?: Array<{ value: string; label: string }>
          duration?: Array<{ value: string; label: string }>
          duracion?: Array<{ value: string; label: string }>
          has_note?: Array<{ value: string; label: string }>
          necesito?: Array<{ value: string; label: string }>
        }
      | undefined

    // Compat: backend puede devolver format/duration en español (formato/duracion)
    const filterOptions = rawFilterOptions
      ? {
          ...rawFilterOptions,
          format: rawFilterOptions.format || rawFilterOptions.formato,
          duration: rawFilterOptions.duration || rawFilterOptions.duracion,
        }
      : undefined

    const rawCurrentFilters = (contentData.current_filters as
      | {
          area?: string
          format?: string
          formato?: string
          duration?: string
          duracion?: string
          has_note?: string
          necesito?: string
        }
      | undefined) || {}

    const currentFilters = {
      ...rawCurrentFilters,
      format: rawCurrentFilters.format || rawCurrentFilters.formato,
      duration: rawCurrentFilters.duration || rawCurrentFilters.duracion,
    }

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
              const subtitle = item.subtitle ?? [item.format].filter(Boolean).join(' · ')

              return (
                <ResourceListCard
                  key={item.id}
                  title={item.title}
                  subtitle={subtitle || undefined}
                  author={item.author}
                  format={item.format}
                  durationMin={item.duration_min}
                  whyNow={item.why_now}
                  minimumStep={item.minimum_step}
                  capabilityLabel={item.capability_label}
                  helpSignal={item.help_signal}
                  hasNote={item.has_note}
                  onClick={() => {
                    const extra: Record<string, string> = {
                      source: source || item.source || '',
                      value:  item.value || item.id,
                    }

                    if (item.resource_id) {
                      extra.resource_id = item.resource_id
                    }

                    if (item.experience_id) {
                      extra.experience_id = item.experience_id
                    }

                    if (item.experience_run_id) {
                      extra.experience_run_id = item.experience_run_id
                    }

                    if (item.sanctuary_item_id) {
                      extra.sanctuary_item_id = item.sanctuary_item_id
                    } else if (item.action === 'open_sanctuary_item') {
                      extra.sanctuary_item_id = item.id
                    }

                    dispatch(item.action, extra)
                  }}
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
if (contentType === 'activity_detail') {
    const detailKind =
      (contentData.detail_kind as string) ||
      (contentData.source as string) ||
      ''

    if (detailKind === 'sanctuary') {
      return (
        <SanctuaryDetail content={contentData} actions={actions} dispatch={dispatch} tokens={tokens} />
      )
    }

    if (detailKind === 'shared_light_entry') {
      return (
        <>
          <ExperienceDetailCard
            tokens={tokens}
            title={(contentData.title as string) || ''}
            objective={(contentData.privacy_hint as string) || undefined}
            descriptionShort={(contentData.description_short as string) || undefined}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {actions.map((action, idx) => (
              <Pill
                key={`${action.action}-${idx}`}
                label={action.label}
                variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
                onClick={() => dispatch(action.action, {
                  ...(action.value ? { value: action.value } : {}),
                })}
                tokens={tokens}
              />
            ))}
          </div>
        </>
      )
    }

    if (detailKind === 'experience_preview') {
      return (
        <>
          <ExperiencePreview content={contentData} tokens={tokens} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {actions.map((action, idx) => (
              <Pill
                key={`${action.action}-${idx}`}
                label={action.label}
                variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
                onClick={() => dispatch(action.action, {
                  ...(action.value ? { value: action.value } : {}),
                  ...(contentData.experience_id ? { experience_id: contentData.experience_id as string } : {}),
                })}
                tokens={tokens}
              />
            ))}
          </div>
        </>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {actions.map((action, idx) => (
          <Pill
            key={`${action.action}-${idx}`}
            label={action.label}
            variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
            onClick={() => dispatch(action.action, {
              ...(action.value ? { value: action.value } : {}),
            })}
            tokens={tokens}
          />
        ))}
      </div>
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

  if (contentType === 'contribution_form') {
    const formKind =
      (contentData.form_kind as string) ||
      (contentData.source as string) ||
      ''

    if (formKind === 'name_prompt') {
      return <NamePrompt actions={actions} dispatch={dispatch} tokens={tokens} />
    }

    return <ContributionForm actions={actions} dispatch={dispatch} tokens={tokens} />
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

  // ── Default: pills de acción ───────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {actions.map((action, idx) => (
        <Pill
          key={`${action.action}-${idx}`}
          label={action.label}
          variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
          onClick={() => dispatch(action.action, {
            ...(action.value ? { value: action.value } : {}),
            ...(experienceRunId ? { experience_run_id: experienceRunId } : {}),
          })}
          tokens={tokens}
        />
      ))}
    </div>
  )
}
