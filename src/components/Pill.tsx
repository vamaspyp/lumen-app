import type { ModuleTokens } from '../lib/tokens'

export function Pill({
  label,
  hint,
  onClick,
  variant = 'outline',
  tokens,
}: {
  label: string
  hint?: string
  onClick: () => void
  variant?: 'outline' | 'solid' | 'ghost'
  tokens: ModuleTokens
}) {
  const styles: Record<string, React.CSSProperties> = {
    outline: {
      background: tokens.accentSoft20,
      border: `1px solid ${tokens.accentSoft30}`,
      color: tokens.accentDeep,
    },
    solid: {
      background: tokens.accent,
      border: `1px solid ${tokens.accent}`,
      color: '#FFFFFF',
    },
    ghost: {
      background: 'transparent',
      border: '1px solid transparent',
      color: tokens.textSecondary,
      fontSize: '0.85rem',
    },
  }

  return (
    <button
      onClick={onClick}
      style={{
        padding: hint ? '0.75rem 1.25rem' : '0.7rem 1.25rem',
        borderRadius: '999px',
        fontSize: '0.9rem',
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.125rem',
        maxWidth: '100%',
        ...styles[variant],
      }}
    >
      <span>{label}</span>
      {hint && (
        <span style={{ fontSize: '0.7rem', opacity: 0.7, fontStyle: 'italic' }}>{hint}</span>
      )}
    </button>
  )
}
