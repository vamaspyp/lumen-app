import { getModuleTokens } from '../lib/tokens'

export function BottomNav({
  currentSource,
  dispatch,
}: {
  currentSource: string
  dispatch: (action: string, extra?: Record<string, string>) => void
}) {
  const modules: Array<{
    key: 'lumi' | 'fuente' | 'sanctuary'
    label: string
    action: string
    disabled?: boolean
  }> = [
    { key: 'lumi',      label: 'LUMI',      action: 'go_home' },
    { key: 'fuente',    label: 'Fuente',    action: 'open_fuente' },
    { key: 'sanctuary', label: 'Santuario', action: 'open_sanctuary' },
  ]

  const activeKey: typeof modules[number]['key'] =
    currentSource === 'fuente'    ? 'fuente'    :
    currentSource === 'sanctuary' ? 'sanctuary' :
    'lumi'

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: '0.75rem',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
        display: 'flex',
        justifyContent: 'center',
        gap: '2.5rem',
        zIndex: 10,
        background: 'none',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        borderTop: 'none',
      }}
    >
      {modules.map(m => {
        const moduleTokens = getModuleTokens(m.key)
        const active = activeKey === m.key
        const disabled = !!m.disabled

        return (
          <button
            key={m.key}
            onClick={() => !disabled && !active && dispatch(m.action)}
            disabled={disabled}
            aria-label={m.label}
            title={disabled ? `${m.label} · próximamente` : m.label}
            style={{
              pointerEvents: 'auto',
              background: 'transparent',
              border: 'none',
              cursor: disabled ? 'not-allowed' : active ? 'default' : 'pointer',
              padding: '0.25rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem',
              fontFamily: 'inherit',
              opacity: disabled ? 0.32 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            <span
              style={{
                width: active ? 10 : 6,
                height: active ? 10 : 6,
                borderRadius: '50%',
                background: active ? moduleTokens.accent : 'transparent',
                border: active ? 'none' : `1.5px solid ${moduleTokens.accent}`,
                boxShadow: active ? `0 0 10px ${moduleTokens.accentSoft30}` : 'none',
                transition: 'all 0.3s ease',
                display: 'block',
              }}
            />
            <span
              style={{
                fontSize: '0.62rem',
                color: active ? moduleTokens.accentDeep : moduleTokens.accent,
                opacity: active ? 1 : 0.5,
                letterSpacing: '0.06em',
                fontWeight: active ? 500 : 400,
                transition: 'all 0.3s ease',
              }}
            >
              {m.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
