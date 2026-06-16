import { useState } from 'react'
import type { ModuleTokens } from '../lib/tokens'
import { Pill } from './Pill'

export function NamePrompt({
  actions,
  dispatch,
  tokens,
}: {
  actions: Array<{ label: string; action: string; value?: string; variant?: string }>
  dispatch: (action: string, extra?: Record<string, string>) => void
  tokens: ModuleTokens
}) {
  const [name, setName] = useState('')
  const handleAction = (actionName: string) => {
    if (actionName === 'submit_name') {
      dispatch('submit_name', { first_name: name.trim() })
    } else {
      dispatch(actionName)
    }
  }
  return (
    <div style={{ textAlign: 'center' }}>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Tu nombre"
        maxLength={40}
        autoFocus
        style={{
          width: '100%',
          maxWidth: '18rem',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          border: `1px solid ${tokens.cardBorder}`,
          background: tokens.cardBg,
          color: tokens.textPrimary,
          fontSize: '1rem',
          fontFamily: 'inherit',
          textAlign: 'center',
          outline: 'none',
          marginBottom: '1.5rem',
        }}
      />
      <div style={{
        display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
        gap: '0.5rem', justifyContent: 'center',
      }}>
        {actions.map((action, idx) => (
          <Pill
            key={`${action.action}-${idx}`}
            label={action.label}
            variant={
              action.action === 'submit_name' && !name.trim()
                ? 'outline'
                : (action.variant as 'solid' | 'outline' | 'ghost') || 'outline'
            }
            onClick={() => handleAction(action.action)}
            tokens={tokens}
          />
        ))}
      </div>
    </div>
  )
}
