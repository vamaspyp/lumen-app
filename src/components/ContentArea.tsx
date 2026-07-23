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
import { FarosPanel } from './FarosPanel'
import { FaroJourneyDetail } from './FaroJourneyDetail'
import { FaroCloseForm } from './FaroCloseForm'

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
  updateShareLightText,
  completeShareLight,
  tokens,
  experienceRunId = '',
  onRegister,
  currentShareToken = '',
}: {
  contentType: string
  contentData: Record<string, unknown>
  actions: Array<{ label: string; action: string; value?: string; variant?: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  updateShareLightText: (params: { share_light_id: string; editable_text: string }) => Promise<Record<string, unknown> | null>
  completeShareLight: (params: {
    share_light_id: string
    channel: string
    surface: string
    result: string
    success: string
    final_text: string
    public_url: string
  }) => Promise<Record<string, unknown> | null>
  tokens: ModuleTokens
  experienceRunId?: string
  onRegister?: (name: string, email: string, password: string) => Promise<{ userId: string; name: string; email: string }>
  currentShareToken?: string
}) {

  if (contentType === 'share_light_editor' || contentData.type === 'share_light_editor') {
    return (
      <ShareLightEditor
        content={contentData}
        actions={actions}
        dispatch={dispatch}
        updateShareLightText={updateShareLightText}
        completeShareLight={completeShareLight}
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
      (contentData.options as Array<{ value: string; label: string; hint?: string; [key: string]: unknown }>) || []
    const actionName = step === 'effect' ? 'submit_feedback_effect' : `submit_checkin_${step}`
    const paramKey   = step === 'effect' ? 'perceived_capability_key' : `checkin_${step}`

    // Reenvía cada campo contextual que la option traiga (p.ej.
    // user_area_faro_id en step=faro) sin asumir cuáles existen — label/hint
    // son solo presentación y no viajan como parámetro de la action.
    const buildOptionParams = (opt: (typeof options)[number]): Record<string, string> => {
      const params: Record<string, string> = {}
      for (const [key, val] of Object.entries(opt)) {
        if (key === 'label' || key === 'hint' || val == null) continue
        params[key] = String(val)
      }
      params[paramKey] = String(opt.value)
      return params
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {options.map(opt => (
          <Pill
            key={opt.value}
            label={opt.label}
            hint={opt.hint}
            onClick={() => dispatch(actionName, buildOptionParams(opt))}
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
        excerpt?: string
        origin_type?: string
        origin_id?: string
        date?: string
        edit_action?: string
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

              const buildExtra = (): Record<string, string> => {
                const extra: Record<string, string> = {
                  source: source || item.source || '',
                  value:  item.value || item.id,
                }
                if (item.resource_id) extra.resource_id = item.resource_id
                if (item.experience_id) extra.experience_id = item.experience_id
                if (item.experience_run_id) extra.experience_run_id = item.experience_run_id
                if (item.sanctuary_item_id) {
                  extra.sanctuary_item_id = item.sanctuary_item_id
                } else if (item.action === 'open_sanctuary_item') {
                  extra.sanctuary_item_id = item.id
                }
                return extra
              }

              // Notas y reflexiones: la nota es el contenido principal, visible
              // desde la lista sin necesidad de abrir el item. Solo para esta
              // fuente — el resto de las listas (Fuente, recorridos, guardados)
              // sigue usando ResourceListCard sin cambios.
              if (source === 'sanctuary_reflections') {
                const noteText = item.note_preview || item.subtitle || item.excerpt || ''
                const originLine = [item.title, item.date].filter(Boolean).join(' · ')
                return (
                  <button
                    key={item.id}
                    onClick={() => dispatch(item.action, buildExtra())}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: tokens.cardBg,
                      border: `0.5px solid ${tokens.cardBorder}`,
                      borderRadius: '12px',
                      padding: '0.875rem 1.125rem',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >
                    {originLine && (
                      <div style={{ fontSize: '0.7rem', color: tokens.textMuted, marginBottom: '0.35rem' }}>
                        {originLine}
                      </div>
                    )}
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.92rem',
                        color: tokens.textPrimary,
                        lineHeight: 1.45,
                        whiteSpace: 'pre-wrap',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {noteText}
                    </p>
                  </button>
                )
              }

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
                  onClick={() => dispatch(item.action, buildExtra())}
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
        onRegister={onRegister || (async () => { throw new Error('No disponible.') })}
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
      const senderName = (contentData.sender_name as string) || ''
      const senderNote = (contentData.sender_note as string) || ''
      return (
        <>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.95rem', color: tokens.textSecondary, margin: 0 }}>
              {senderName ? `${senderName} te compartió esta luz` : 'Alguien te compartió esta luz'}
            </p>
            {senderNote && (
              <p style={{ fontSize: '0.95rem', color: tokens.textPrimary, fontStyle: 'italic', margin: '0.5rem 0 0', lineHeight: 1.5 }}>
                “{senderNote}”
              </p>
            )}
          </div>
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

    if (detailKind === 'faro_journey') {
      return <FaroJourneyDetail content={contentData} actions={actions} dispatch={dispatch} tokens={tokens} />
    }

    if (detailKind === 'faro_close') {
      return <FaroCloseForm content={contentData} actions={actions} dispatch={dispatch} tokens={tokens} />
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
