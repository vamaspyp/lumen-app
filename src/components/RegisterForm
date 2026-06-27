import { useState } from 'react'
import type { ModuleTokens } from '../lib/tokens'

export function RegisterForm({
  onRegister,
  dispatch,
  tokens,
}: {
  onRegister: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = email.trim().length > 0 && password.length >= 6

  const handleSubmit = async () => {
    if (!canSubmit || confirming) return
    setConfirming(true)
    setError('')

    const result = await onRegister(email.trim(), password)

    if (result.ok) {
      dispatch('go_home')
    } else {
      setError(result.error || 'No se pudo crear la cuenta. Intentá de nuevo.')
      setConfirming(false)
    }
  }

  return (
    <div style={{ textAlign: 'left' }}>
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
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com"
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
      </div>

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
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Al menos 6 caracteres"
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
      </div>

      {error && (
        <p style={{
          fontSize: '0.85rem',
          color: '#b03a2e',
          margin: '0 0 1rem 0',
          lineHeight: 1.4,
        }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || confirming}
        style={{
          width: '100%',
          padding: '0.75rem 1.25rem',
          borderRadius: '999px',
          background: canSubmit && !confirming ? tokens.accent : tokens.accentSoft20,
          border: `1px solid ${tokens.accent}`,
          color: canSubmit && !confirming ? '#FFFFFF' : tokens.accentDeep,
          fontSize: '0.9rem',
          cursor: canSubmit && !confirming ? 'pointer' : 'default',
          fontWeight: 500,
          fontFamily: 'inherit',
          transition: 'all 0.25s ease',
          marginBottom: '0.75rem',
        }}
      >
        {confirming ? 'Creando cuenta...' : 'Crear mi cuenta'}
      </button>

      <button
        onClick={() => dispatch('dismiss_registration_prompt')}
        style={{
          width: '100%',
          padding: '0.625rem 1.25rem',
          borderRadius: '999px',
          background: 'transparent',
          border: 'none',
          color: tokens.textMuted,
          fontSize: '0.85rem',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Ahora no
      </button>
    </div>
  )
}