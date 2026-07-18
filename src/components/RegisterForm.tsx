import { useState } from 'react'
import type { ModuleTokens } from '../lib/tokens'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterForm({
  onRegister,
  dispatch,
  tokens,
}: {
  onRegister: (name: string, email: string, password: string) => Promise<{ userId: string; name: string; email: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length >= 6

  const handleSubmit = async () => {
    if (isSubmitting) return

    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedPassword = password.trim()

    // Validación local antes de tocar Auth: nunca se llama a
    // onRegister/linkAccount con nombre, email o clave inválidos.
    if (!normalizedName) {
      setError('Decime cómo querés que te llame.')
      return
    }
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
      const result = await onRegister(normalizedName, normalizedEmail, normalizedPassword)

      // Ningún éxito local ni REGISTRATION_SUCCESS hardcodeado acá:
      // solo Supabase, vía complete_registration, decide si la cuenta
      // quedó consolidada y qué nodo corresponde mostrar.
      dispatch('complete_registration', {
        user_id: result.userId,
        name: result.name,
        email: result.email,
      })
    } catch (err) {
      // Nombre/email/clave quedan cargados a propósito: la persona puede
      // corregir sin volver a escribir todo.
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
          ¿Cómo querés que te llame?
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Tu nombre"
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