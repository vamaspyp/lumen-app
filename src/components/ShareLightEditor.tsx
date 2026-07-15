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
  shareToken = '',
}: {
  content: Record<string, unknown>
  actions: Array<{ label: string; action: string; variant?: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  callRpc: (rpcName: string, params: Record<string, string>) => Promise<Record<string, unknown> | null>
  tokens: ModuleTokens
  shareToken?: string
}) {
  const shareLightId = (content.share_light_id as string) || ''

  const [editedText, setEditedText] = useState(
    (content.editable_text as string) ||
    (content.share_text as string) ||
    (content.default_text as string) ||
    buildShareLightText(content)
  )
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')

  const editorTitle = (content.editor_title as string) || 'Compartir luz'
  const editorSubtitle = (content.editor_subtitle as string) || ''
  const editorHelper = (content.editor_helper as string) || ''
  const privacyHint = (content.privacy_hint as string) || ''

  // El token del receptor anónimo puede venir en distintas formas según
  // el nodo que lo emitió; el link se arma sólo si no llega ya resuelto.
  const token =
    (content.share_token as string) ||
    (content.shareToken as string) ||
    shareToken ||
    ''

  const shareUrl =
    content.url && String(content.url).trim()
      ? String(content.url).trim()
      : token
        ? `${window.location.origin}${window.location.pathname}?share_light=${encodeURIComponent(token)}`
        : ''

  const shareText =
    editedText ||
    (content.editable_text as string) ||
    (content.share_text as string) ||
    (content.default_text as string) ||
    ''

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const persistEditedText = () =>
    callRpc('lumi_update_share_light_text', {
      share_light_id: shareLightId,
      editable_text: editedText,
    })

  const completeShareLight = (channel: string, result: string, success: boolean) =>
    callRpc('lumi_complete_share_light', {
      share_light_id: shareLightId,
      channel,
      result,
      success: String(success),
      final_text: shareText,
    })

  const runNativeShare = async () => {
    setBusy(true)
    setFeedback('')
    await persistEditedText()

    let success = true
    let result: 'shared' | 'copied' | 'failed' = 'shared'
    const channel = canNativeShare ? 'native_share' : 'clipboard'

    try {
      if (canNativeShare) {
        await navigator.share({
          title: (content.title as string) || 'Una luz de LUMEN',
          text: shareText,
          url: shareUrl || undefined,
        })
        result = 'shared'
        setFeedback('Compartido')
      } else if (shareUrl) {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
        result = 'copied'
        setFeedback('Link copiado')
      } else {
        await navigator.clipboard.writeText(shareText)
        result = 'copied'
        setFeedback('Copiado')
      }
    } catch (err) {
      if (canNativeShare && (err as Error)?.name === 'AbortError') {
        setBusy(false)
        return
      }
      success = false
    }

    await completeShareLight(channel, success ? result : 'failed', success)
    setBusy(false)
  }

  const runCopyLink = async () => {
    if (!shareUrl) {
      setFeedback('No pudimos generar el link todavía.')
      return
    }

    setBusy(true)
    setFeedback('')
    await persistEditedText()

    let success = true
    try {
      await navigator.clipboard.writeText(shareUrl)
      setFeedback('Link copiado')
    } catch {
      success = false
    }

    await completeShareLight('link_copy', success ? 'copied' : 'failed', success)
    setBusy(false)
  }

  const handleAction = (actionName: string) => {
    if (actionName === 'native_share_light') {
      runNativeShare()
    } else if (actionName === 'copy_share_light_link') {
      runCopyLink()
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
        value={editedText}
        onChange={e => setEditedText(e.target.value)}
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

      {feedback && (
        <p
          style={{
            fontSize: '0.8rem',
            color: tokens.accentDeep,
            textAlign: 'center',
            margin: '1rem 0 0 0',
          }}
        >
          {feedback}
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
      </div>
    </div>
  )
}
