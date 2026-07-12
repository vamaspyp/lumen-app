import type { ReactNode } from 'react'
import type { ModuleTokens } from '../lib/tokens'

// ─── Base visual compartida para fichas de detalle de experiencia ──
// Usada por ExperiencePreview (Fuente / propuesta de Check-in) y
// SanctuaryDetail (Santuario). No decide negocio: solo renderiza lo
// que recibe.

export function ExperienceDetailCard({
  tokens,
  formatLabel,
  secondaryBadgeLabel,
  title,
  objective,
  descriptionShort,
  preText,
  preTextLabel = 'Qué vamos a hacer',
  whenItHelps,
  whyNow,
  minimumStep,
  whatItIsNot,
  postText,
  sourceLabel,
  children,
}: {
  tokens: ModuleTokens
  formatLabel?: string
  secondaryBadgeLabel?: string
  title: string
  objective?: string
  descriptionShort?: string
  preText?: string
  preTextLabel?: string
  whenItHelps?: string
  whyNow?: string
  minimumStep?: string
  whatItIsNot?: string
  postText?: string
  sourceLabel?: string
  children?: ReactNode
}) {
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
      {/* Badges */}
      {(formatLabel || secondaryBadgeLabel) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {formatLabel && (
            <span
              style={{
                display: 'inline-block',
                background: tokens.accentSoft20,
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.7rem',
                color: tokens.accentDeep,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 500,
              }}
            >
              {formatLabel}
            </span>
          )}
          {secondaryBadgeLabel && (
            <span
              style={{
                display: 'inline-block',
                background: tokens.accentSoft10,
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.7rem',
                color: tokens.textMuted,
                letterSpacing: '0.04em',
              }}
            >
              {secondaryBadgeLabel}
            </span>
          )}
        </div>
      )}

      {/* Título */}
      <h2
        style={{
          fontSize: '1.4rem',
          fontWeight: 500,
          color: tokens.textPrimary,
          marginTop: 0,
          marginBottom: '1rem',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h2>

      {/* Objetivo */}
      {objective && (
        <p
          style={{
            fontSize: '0.95rem',
            color: tokens.textSecondary,
            lineHeight: 1.5,
            margin: '0 0 1.25rem 0',
            fontStyle: 'italic',
          }}
        >
          {objective}
        </p>
      )}

      {/* Pre-text */}
      {preText && (
        <div
          style={{
            background: tokens.accentSoft10,
            borderRadius: '12px',
            padding: '0.875rem 1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              color: tokens.accentDeep,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.375rem',
              fontWeight: 600,
            }}
          >
            {preTextLabel}
          </div>
          <p style={{ fontSize: '0.95rem', color: tokens.textPrimary, margin: 0, lineHeight: 1.5 }}>
            {preText}
          </p>
        </div>
      )}

      {/* Descripción breve (si no hay pre_text) */}
      {descriptionShort && !preText && (
        <p
          style={{
            fontSize: '0.95rem',
            color: tokens.textSecondary,
            lineHeight: 1.5,
            margin: '0 0 1.25rem 0',
          }}
        >
          {descriptionShort}
        </p>
      )}

      {/* Cuándo ayuda */}
      {whenItHelps && <Section label="Cuándo ayuda" text={whenItHelps} tokens={tokens} />}

      {/* Por qué ahora */}
      {whyNow && <Section label="Por qué ahora" text={whyNow} tokens={tokens} />}

      {/* Primer paso */}
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

      {/* Cuándo no */}
      {whatItIsNot && <Section label="Cuándo no" text={whatItIsNot} tokens={tokens} muted />}

      {/* Para después */}
      {postText && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              fontSize: '0.7rem',
              color: tokens.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.375rem',
              fontWeight: 500,
            }}
          >
            Para después
          </div>
          <p style={{ fontSize: '0.9rem', color: tokens.textSecondary, margin: 0, lineHeight: 1.5 }}>
            {postText}
          </p>
        </div>
      )}

      {/* Fuente */}
      {sourceLabel && (
        <div
          style={{
            paddingTop: '0.875rem',
            borderTop: `1px solid ${tokens.cardBorder}`,
          }}
        >
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
            Fuente
          </div>
          <p style={{ fontSize: '0.85rem', color: tokens.textSecondary, margin: 0, lineHeight: 1.5 }}>
            {sourceLabel}
          </p>
        </div>
      )}

      {children}
    </div>
  )
}

function Section({
  label,
  text,
  tokens,
  muted = false,
}: {
  label: string
  text: string
  tokens: ModuleTokens
  muted?: boolean
}) {
  return (
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
        {label}
      </div>
      <p style={{
        fontSize: '0.95rem',
        color: muted ? tokens.textSecondary : tokens.textPrimary,
        margin: 0,
        lineHeight: 1.5,
      }}>
        {text}
      </p>
    </div>
  )
}
