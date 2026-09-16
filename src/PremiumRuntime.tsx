import { useEffect, useState } from 'react'
import AppPremium from './AppPremium'

export default function PremiumRuntime() {
  const [instance, setInstance] = useState(0)
  const [integrated, setIntegrated] = useState(false)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest('button') as HTMLButtonElement | null
      if (!button) return

      if (button.getAttribute('aria-label') === 'Ahora') {
        setIntegrated(false)
        setInstance((value) => value + 1)
        return
      }

      const text = button.textContent ?? ''
      if (text.includes('Guardar “') && text.includes('repertorio')) {
        window.setTimeout(() => setIntegrated(true), 250)
      }
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return (
    <>
      <AppPremium key={instance} />
      {integrated && <div className="lp-runtime-toast" role="status">Quedó en tu repertorio.</div>}
    </>
  )
}
