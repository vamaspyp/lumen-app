import { useState } from 'react'

function clickNav(label: string) {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
  buttons.find((button) => button.textContent?.trim() === label)?.click()
}

export function LumiPresence() {
  const [open, setOpen] = useState(false)

  const returnToMoment = () => {
    clickNav('Inicio')
    window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('[aria-label="Lo que te está pasando"]')
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      input?.focus()
    }, 120)
    setOpen(false)
  }

  return <div className={open ? 'lumi-global open' : 'lumi-global'}>
    {open && <aside className="lumi-panel" aria-label="LUMI">
      <small>LUMI</small>
      <h2>Estoy acá.</h2>
      <p>No hace falta empezar por una sección. Podemos partir de lo que está presente en tu vida.</p>
      <div className="lumi-actions">
        <button type="button" onClick={returnToMoment}>Contarme qué está presente</button>
        <button type="button" onClick={() => { clickNav('Mi Vida'); setOpen(false) }}>Volver a algo mío</button>
        <button type="button" onClick={() => { clickNav('Explorar'); setOpen(false) }}>Explorar posibilidades</button>
        <button type="button" onClick={() => { clickNav('Tejido'); setOpen(false) }}>Buscar presencia humana</button>
      </div>
      <em>Vos marcás el ritmo.</em>
    </aside>}
    <button className="lumi-orb" type="button" aria-label={open ? 'Cerrar LUMI' : 'Abrir LUMI'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <span className="lumi-glow"/>
      <span className="lumi-spark">✦</span>
    </button>
    <span className="lumi-caption">LUMI<br/><em>siempre con vos</em></span>
  </div>
}
