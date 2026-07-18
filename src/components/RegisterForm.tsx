import { useState } from 'react'
import type { ModuleTokens } from '../lib/tokens'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Traduce errores técnicos de Supabase Auth a copy sobrio y accionable.
// Solo mapea texto de error a texto de error — no decide flujo ni nodo.
function mapRegisterError(message?: string): string {
  if (!message) return 'No pudimos crear la cuenta ahora. Probá nuevamente.'

  if (message.includes('New password should be different from the old password')) {
    return 'Esa clave parece coincidir con una anterior. Probá con otra.'
  }

  if (message.includes('Email address') || message.trim() === '') {
    return 'Revisá el email antes de continuar.'
  }

  return 'No pudimos crear la cuenta ahora. Probá nuevamente.'
}

export function RegisterForm({
  onRegister,
  dispatch,
  tokens,
}: {
  onRegister: (email: string, password: string) => Promise<{ ok: boolean; error?: string; userId?: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = email.trim().length > 0 && password.trim().length >= 6

  const handleSubmit = async () => {
    if (isSubmitting) return

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedPassword = password.trim()

    // Validación local antes de tocar Auth: nunca se llama a
    // onRegister/linkAccount con email o clave inválidos.
    if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
      setError('Revisá el email antes de continuar.')
      return
    }
    if (!normalizedPassword || normalizedPassword.length < 6) {
      setError('La clave necesita al menos 6 caracteres.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const result = await onRegister(normalizedEmail, normalizedPassword)

      if (result.ok) {
        // Cuenta creada: el éxito lo confirma Supabase (REGISTRATION_SUCCESS),
        // nunca un copy local. Se pasa user_id explícito porque, si la
        // identidad anónima técnica recién se creó en este mismo submit,
        // el estado del hook todavía no lo refleja en este render.
        dispatch('complete_registration', result.userId ? { user_id: result.userId } : {})
        return
      }

      // Email queda cargado a propósito: la persona puede corregir sin
      // volver a escribir todo.
      setError(mapRegisterError(result.error))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos crear la cuenta ahora. Probá nuevamente.')
    } finally {
      setIsSubmitting(false)
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
        disabled={!canSubmit || isSubmitting}
        style={{
          width: '100%',
          padding: '0.75rem 1.25rem',
          borderRadius: '999px',
          background: canSubmit && !isSubmitting ? tokens.accent : tokens.accentSoft20,
          border: `1px solid ${tokens.accent}`,
          color: canSubmit && !isSubmitting ? '#FFFFFF' : tokens.accentDeep,
          fontSize: '0.9rem',
          cursor: canSubmit && !isSubmitting ? 'pointer' : 'default',
          fontWeight: 500,
          fontFamily: 'inherit',
          transition: 'all 0.25s ease',
          marginBottom: '0.75rem',
        }}
      >
        {isSubmitting ? 'Creando cuenta...' : 'Crear mi cuenta'}
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