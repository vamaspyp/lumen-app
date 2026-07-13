import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ModuleTokens } from '../lib/tokens'
import {
  youtubeEmbedUrl,
  vimeoEmbedUrl,
  spotifyEmbedUrl,
  soundcloudEmbedUrl,
} from '../lib/embedHelpers'
import { GuidedPractice } from './GuidedPractice'

// ─── Embed components ─────────────────────────────────────────────

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

function AudioDirect({ src, title, tokens }: {
  src: string
  title: string
  tokens: ModuleTokens
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        background: tokens.cardBg,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: '22px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        padding: '2rem 1.5rem',
        maxWidth: '36rem',
        margin: '0 auto',
      }}
    >
      <h3
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: '1.1rem',
          color: tokens.textPrimary,
          marginBottom: '1.5rem',
          fontWeight: 400,
        }}
      >
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

function LumenOwnResource({
  title,
  content,
  tokens,
}: {
  title: string
  content?: Record<string, unknown>
  tokens: ModuleTokens
}) {
  const meta = (content?.metadata as Record<string, unknown>) || {}

  const description =
    (content?.description_short as string) ||
    (content?.description as string) ||
    (meta.description_short as string) ||
    (meta.description as string) ||
    ''

  const body =
    (content?.body as string) ||
    (content?.text as string) ||
    (content?.content as string) ||
    (meta.body as string) ||
    (meta.text as string) ||
    (meta.content as string) ||
    ''

  const sourceLabel =
    (meta.source_label as string) ||
    (content?.provider as string) ||
    (content?.author as string) ||
    'LUMEN'

  return (
    <div
      style={{
        background: tokens.cardBg,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: '22px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        padding: '1.75rem 1.5rem',
        maxWidth: '42rem',
        margin: '0 auto',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          background: tokens.accentSoft20,
          color: tokens.accentDeep,
          borderRadius: '999px',
          padding: '0.25rem 0.75rem',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 500,
          marginBottom: '1rem',
        }}
      >
        Recurso LUMEN
      </div>

      {title && (
        <h2
          style={{
            margin: '0 0 1rem',
            color: tokens.textPrimary,
            fontSize: '1.35rem',
            lineHeight: 1.3,
            fontWeight: 500,
          }}
        >
          {title}
        </h2>
      )}

      {description && (
        <p
          style={{
            margin: '0 0 1.25rem',
            color: tokens.textSecondary,
            fontSize: '0.98rem',
            lineHeight: 1.55,
          }}
        >
          {description}
        </p>
      )}

      {body ? (
        <div
          style={{
            whiteSpace: 'pre-wrap',
            color: tokens.textPrimary,
            fontSize: '1rem',
            lineHeight: 1.7,
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          {body}
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            color: tokens.textMuted,
            fontSize: '0.95rem',
            lineHeight: 1.55,
            fontStyle: 'italic',
          }}
        >
          Este recurso propio todavía no trae contenido visible. La experiencia puede continuar cuando estés listo.
        </p>
      )}

      {sourceLabel && (
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: `1px solid ${tokens.cardBorder}`,
            color: tokens.textMuted,
            fontSize: '0.78rem',
            fontStyle: 'italic',
          }}
        >
          Fuente: {sourceLabel}
        </div>
      )}
    </div>
  )
}

function ExternalResourceCard({
  url,
  dispatch,
  tokens,
}: {
  url: string
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '2rem',
        background: tokens.cardBg,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: '22px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        maxWidth: '36rem',
        margin: '0 auto',
      }}
    >
      <p
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: '1.05rem',
          lineHeight: 1.6,
          margin: '0 auto 2rem',
          maxWidth: '38ch',
          color: tokens.textSecondary,
        }}
      >
        Este recurso vive fuera de LUMEN. Abrilo cuando estés listo; volvés cuando quieras.
      </p>

      {url ? (
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
          Abrir recurso externo
        </button>
      ) : (
        <p
          style={{
            margin: 0,
            color: tokens.textMuted,
            fontSize: '0.95rem',
          }}
        >
          No encontré un enlace disponible para este recurso.
        </p>
      )}
    </div>
  )
}

// ─── ResourceViewer ───────────────────────────────────────────────

export function ResourceViewer({
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
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch('close_resource_viewer')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [dispatch])

  const meta = (content?.metadata as Record<string, unknown>) || {}
  const practiceSteps = (meta.steps as Array<{ text: string }>) || []

  const isOwnLumenResource =
    sourceKind === 'lumen_practice' ||
    sourceKind === 'lumen_origin' ||
    sourceKind === 'lumen_text' ||
    sourceKind === 'text' ||
    sourceKind === 'practica' ||
    sourceKind === 'práctica'

  let embedNode: React.ReactNode = null

  if (sourceKind === 'lumen_practice' && practiceSteps.length > 0) {
    embedNode = <GuidedPractice content={content || {}} tokens={tokens} dispatch={dispatch} />
  } else if (isOwnLumenResource) {
    embedNode = <LumenOwnResource title={title} content={content} tokens={tokens} />
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

  const shareAction = actions.find(a => a.action === 'share_light')

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: tokens.background,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          padding: '0.875rem 1rem',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          zIndex: 10,
          background: `linear-gradient(to bottom, ${tokens.background}, rgba(255,255,255,0))`,
          pointerEvents: 'none',
        }}
      >
        {shareAction && (
          <button
            onClick={() => dispatch('share_light', {
              surface: 'resource_viewer',
              title,
              url,
              source: (content?.source as string) || '',
              resource_id: (content?.resource_id as string) || '',
            })}
            aria-label="Compartir"
            style={{
              pointerEvents: 'auto',
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              background: tokens.cardBg,
              border: `1px solid ${tokens.cardBorder}`,
              color: tokens.textPrimary,
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
            background: tokens.cardBg,
            border: `1px solid ${tokens.cardBorder}`,
            color: tokens.textPrimary,
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
            <ExternalResourceCard
              url={url}
              dispatch={dispatch}
              tokens={tokens}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
