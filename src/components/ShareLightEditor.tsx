import { useState } from 'react'
import type { ModuleTokens } from '../lib/tokens'
import { buildShareLightText } from '../lib/shareLight'
import { Pill } from './Pill'

// Nombres de action que resuelven al mismo handler técnico de compartir.
// copy_share_light / copy_share_light_link son alias defensivos de
// nodos viejos: mismo comportamiento, sin agregar botones ni labels
// propios — la pill y su texto siguen viniendo de Supabase.
const SHARE_ACTION_ALIASES = new Set(['native_share_light', 'copy_share_light', 'copy_share_light_link'])

// Helper puro: arma el link público y el texto final a partir del
// content que devuelve Supabase + el texto editado en pantalla.
// No decide flujo de negocio, solo compone strings.
function buildSharePayload(
  content: Record<string, unknown>,
  editedText: string
): { publicUrl: string; finalShareText: string } {
  const publicUrl =
    (content.public_url as string) ||
    (content.share_url as string) ||
    (content.share_path ? `${window.location.origin}${content.share_path as string}` : '') ||
    (content.share_token ? `${window.location.origin}/?share_light=${content.share_token as string}` : '')

  if (!publicUrl && import.meta.env.DEV) {
    console.warn('[ShareLightEditor] sin link público disponible en content — se comparte sin link', content)
  }

  const trimmedText = editedText.trim()
  const finalShareText = publicUrl ? `${trimmedText}\n\n${publicUrl}` : trimmedText

  return { publicUrl, finalShareText }
}

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

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const completeShareLight = (channel: string, result: string, success: boolean, finalText: string) =>
    callRpc('lumi_complete_share_light', {
      share_light_id: shareLightId,
      channel,
      surface: 'share_light_editor',
      result,
      success: String(success),
      final_text: finalText,
    })

  const copyToClipboardFallback = async (finalShareText: string) => {
    let success = true
    try {
      await navigator.clipboard.writeText(finalShareText)
      setFeedback('Link copiado')
    } catch {
      success = false
      setFeedback('No pudimos copiar el link.')
    }

    await completeShareLight('clipboard', success ? 'copied' : 'failed', success, finalShareText)
  }

  const runShareLight = async () => {
    setBusy(true)
    setFeedback('')

    await callRpc('lumi_update_share_light_text', {
      share_light_id: shareLightId,
      editable_text: editedText,
    })

    const { publicUrl, finalShareText } = buildSharePayload(content, editedText)

    if (canNativeShare) {
      try {
        await navigator.share({
          title: (content.title as string) || 'Una luz de LUMEN',
          text: finalShareText,
          url: publicUrl || undefined,
        })
        setFeedback('Compartido')
        await completeShareLight('native_share', 'shared', true, finalShareText)
      } catch (err) {
        // Cancelación del usuario: no hay evento que registrar dos veces
        // ni fallback — simplemente no se completó el acto de compartir.
        if ((err as Error)?.name === 'AbortError') {
          setBusy(false)
          return
        }
        await copyToClipboardFallback(finalShareText)
      }
    } else {
      await copyToClipboardFallback(finalShareText)
    }

    setBusy(false)
  }

  const handleAction = (actionName: string) => {
    if (SHARE_ACTION_ALIASES.has(actionName)) {
      runShareLight()
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
