import { useEffect, useMemo, useState } from 'react'

type Space = 'home' | 'life' | 'explore' | 'sanctuary' | 'tissue' | 'search' | 'notifications' | 'settings'

function clickNav(label: string) {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
  buttons.find((button) => button.textContent?.trim() === label)?.click()
}

function scrollTo(anchor: string) {
  window.setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
}

const CONTEXT: Record<Space, { label:string; title:string; body:string; tip:string }> = {
  home: {
    label:'INICIO',
    title:'Estoy acá.',
    body:'Inicio reúne unas pocas cosas que pueden importarte ahora. No hace falta recorrer todo LUMEN.',
    tip:'Podés partir de lo que está presente o volver a algo que ya venías cuidando.',
  },
  life: {
    label:'MI PROCESO',
    title:'Tu continuidad, sin presión.',
    body:'Acá viven tus Faros, Caminos y recursos propios. Una dirección puede cambiar, pausarse o dejar de importar.',
    tip:'Si querés, puedo acercarte Fuente, Santuario o Tejido alrededor de lo que elegiste cuidar.',
  },
  explore: {
    label:'EXPLORAR',
    title:'Podemos buscar con criterio.',
    body:'Fuente no es un catálogo. Podés explorar desde una Capacidad, tu Faro o simplemente descubrir otras formas.',
    tip:'Lo relacionado con tu Faro aparece cuando existe una relación real y trazable.',
  },
  sanctuary: {
    label:'SANTUARIO',
    title:'Esto es tuyo.',
    body:'Acá guardás significado, no historial. Nada debería reaparecer fuera de contexto sólo porque quedó conservado.',
    tip:'Puedo ayudarte a reencontrar algo propio y conectarlo, si vos querés, con un Faro o Camino.',
  },
  tissue: {
    label:'COMUNIDAD',
    title:'La vida también acompaña a la vida.',
    body:'Acá LUMEN puede acercarte personas, círculos, profesionales, instituciones o acciones humanas cuando tienen sentido.',
    tip:'No hay feed ni popularidad: la relación importa más que el movimiento.',
  },
  search: {
    label:'BUSCAR',
    title:'Encontrar sin perderte.',
    body:'Podés buscar una posibilidad concreta y después volver a tu vida. No hace falta navegar todo el organismo.',
    tip:'Si una búsqueda tiene relación con algo que ya cuidás, esa continuidad puede orientar sin encasillarte.',
  },
  notifications: {
    label:'RETORNOS',
    title:'Continuidad sólo si la elegiste.',
    body:'Acá viven los retornos acordados. Podés cancelarlos; el silencio también puede ser una buena salida.',
    tip:'LUMEN no debería traerte de vuelta por engagement.',
  },
  settings: {
    label:'AJUSTES',
    title:'Tu soberanía también se configura.',
    body:'Memoria, proactividad y permisos existen para que vos decidas cuánto puede usar LUMEN para acompañarte.',
    tip:'Menos acceso sigue siendo una opción válida.',
  },
}

export function LumiPresence() {
  const [open, setOpen] = useState(false)
  const [space, setSpace] = useState<Space>('home')

  useEffect(() => {
    const onSpace = (event: Event) => {
      const next = (event as CustomEvent<{space?:Space}>).detail?.space
      if (next && next in CONTEXT) setSpace(next)
    }
    window.addEventListener('lumen:space', onSpace)
    return () => window.removeEventListener('lumen:space', onSpace)
  }, [])

  const context = CONTEXT[space]
  const actions = useMemo(() => {
    if(space === 'home') return [
      ['Contarme qué está presente','moment'],
      ['Volver a algo mío','Mi proceso'],
      ['Explorar posibilidades','Explorar'],
    ] as const
    if(space === 'life') return [
      ['Explorar algo para mi Faro','Explorar'],
      ['Volver a mi Santuario','Santuario'],
      ['Ver retornos acordados','Notificaciones'],
    ] as const
    if(space === 'explore') return [
      ['Ver lo relacionado con mi Faro','related'],
      ['Volver a mi proceso','Mi proceso'],
      ['Buscar presencia humana','Comunidad'],
    ] as const
    if(space === 'sanctuary') return [
      ['Volver a mi Faro','Mi proceso'],
      ['Explorar posibilidades','Explorar'],
      ['Buscar presencia humana','Comunidad'],
    ] as const
    if(space === 'tissue') return [
      ['Volver a mi Faro','Mi proceso'],
      ['Explorar posibilidades','Explorar'],
      ['Volver a mi Santuario','Santuario'],
    ] as const
    return [
      ['Volver al Inicio','Inicio'],
      ['Volver a mi proceso','Mi proceso'],
      ['Explorar posibilidades','Explorar'],
    ] as const
  }, [space])

  const returnToMoment = () => {
    clickNav('Inicio')
    window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('[aria-label="Lo que te está pasando"]')
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      input?.focus()
    }, 120)
    setOpen(false)
  }

  const act = (target:string) => {
    if(target === 'moment'){returnToMoment();return}
    if(target === 'related'){clickNav('Explorar');scrollTo('related-to-faro');setOpen(false);return}
    clickNav(target)
    setOpen(false)
  }

  return <div className={open ? 'lumi-global open' : 'lumi-global'}>
    {open && <aside className="lumi-panel" aria-label="LUMI">
      <small>LUMI · {context.label}</small>
      <h2>{context.title}</h2>
      <p>{context.body}</p>
      <p><strong>{context.tip}</strong></p>
      <div className="lumi-actions">
        {actions.map(([label,target]) => <button key={label} type="button" onClick={() => act(target)}>{label}</button>)}
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
