import { useState } from 'react'
import type { ModuleTokens } from '../lib/tokens'
import { buildShareLightText } from '../lib/shareLight'
import { Pill } from './Pill'

export function ShareLightEditor({
  content,
  actions,
  dispatch,
  callRpc,
  tokens,
}: {
  content: Record<string, unknown>
  actions: Array<{ label: string; action: string; variant?: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  callRpc: (rpcName: string, params: Record<string, string>) => Promise<Record<string, unknown> | null>
  tokens: ModuleTokens
}) {
  const shareLightId = (content.share_light_id as string) || ''

  const [text, setText] = useState(
    (content.editable_text as string) ||
    (content.share_text as string) ||
    (content.default_text as string) ||
    buildShareLightText(content)
  )
  const [busy, setBusy] = useState(false)

  const editorTitle = (content.editor_title as string) || 'Compartir luz'
  const editorSubtitle = (content.editor_subtitle as string) || ''
  const editorHelper = (content.editor_helper as string) || ''
  const privacyHint = (content.privacy_hint as string) || ''

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  // Copiar/compartir: guarda la edición, ejecuta el efecto de cliente
  // (clipboard o Web Share) y registra el resultado. La respuesta final
  // de lumi_complete_share_light se aplica como cualquier nodo real
  // (SHARE_LIGHT_DONE / SHARE_LIGHT_FAILED) — nunca un estado local.
  const runShareSequence = async (channel: 'clipboard' | 'native_share') => {
    setBusy(true)
    await callRpc('lumi_update_share_light_text', {
      share_light_id: shareLightId,
      editable_text: text,
    })

    let success = true
    try {
      if (channel === 'native_share') {
        await navigator.share({ text })
      } else {
        await navigator.clipboard.writeText(text)
      }
    } catch (err) {
      if (channel === 'native_share' && (err as Error)?.name === 'AbortError') {
        setBusy(false)
        return
      }
      success = false
    }

    await callRpc('lumi_complete_share_light', {
      share_light_id: shareLightId,
      channel,
      result: success ? (channel === 'native_share' ? 'shared' : 'copied') : 'failed',
      success: String(success),
      final_text: text,
    })
    setBusy(false)
  }

  const handleAction = (actionName: string) => {
    if (actionName === 'copy_share_light') {
      runShareSequence('clipboard')
    } else {
      dispatch(actionName)
    }
  }

  return (
    <div style={{ textAlign: 'left' }}>
      <h3
        style={{
          fontSize: '1.1rem',
          fontWeight: 500,
          color: tokens.textPrimary,
          margin: '0 0 0.5rem 0',
        }}
      >
        {editorTitle}
      </h3>

      {editorSubtitle && (
        <p
          style={{
            fontSize: '0.9rem',
            color: tokens.textSecondary,
            margin: '0 0 1.25rem 0',
            lineHeight: 1.5,
          }}
        >
          {editorSubtitle}
        </p>
      )}

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={5}
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

      {editorHelper && (
        <p
          style={{
            fontSize: '0.78rem',
            color: tokens.textMuted,
            fontStyle: 'italic',
            margin: '0.625rem 0 0 0',
          }}
        >
          {editorHelper}
        </p>
      )}

      {privacyHint && (
        <p
          style={{
            fontSize: '0.72rem',
            color: tokens.textMuted,
            fontStyle: 'italic',
            textAlign: 'center',
            margin: '1.25rem 0',
          }}
        >
          {privacyHint}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '0.5rem',
          justifyContent: 'center',
          marginTop: '1.5rem',
        }}
      >
        {actions.map((action, idx) => (
          <Pill
            key={`${action.action}-${idx}`}
            label={action.label}
            variant={(action.variant as 'solid' | 'outline' | 'ghost') || 'outline'}
            onClick={() => !busy && handleAction(action.action)}
            tokens={tokens}
          />
        ))}
        {canShare && (
          <Pill
            label="Compartir"
            variant="outline"
            onClick={() => !busy && runShareSequence('native_share')}
            tokens={tokens}
          />
        )}
      </div>
    </div>
  )
}
