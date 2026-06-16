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
