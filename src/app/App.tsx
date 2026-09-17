import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { getAuthSnapshot, requestEmailOtp, signOut, verifyEmailOtp } from '../greenfield/application/auth'
import { bootstrapPerson } from '../greenfield/application/consent'
import {
  createCircle,
  createTrajectory,
  deleteSanctuary,
  discoverSource,
  exportSanctuary,
  getContinuitySnapshot,
  getSourceTaxonomy,
  getTissueSnapshot,
  integrateHelp,
  listSanctuary,
  saveSanctuary,
  setMemory,
  type Circle,
  type ContinuitySnapshot,
  type SanctuaryEntry,
  type SourceItem,
  type SourceTaxonomy,
} from '../greenfield/application/embryo'
import {
  accompanyMoment,
  primaryHelpFromScene,
  recordOutcome,
  selectHelp,
  type HelpPossibility,
  type S1Scene,
} from '../greenfield/application/s1'
import { Experience } from './Experience'

type Space = 'home' | 'life' | 'explore' | 'sanctuary' | 'tissue'
type MomentStage = 'idle' | 'auth' | 'scene' | 'experience' | 'outcome' | 'closed'

const IMG = {
  hero: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&q=92',
  calm: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd4297?auto=format&fit=crop&w=1000&q=88',
  practice: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=88',
  journal: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=88',
  meeting: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=88',
  walk: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=88',
  portrait: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=88',
  man: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=88',
  portrait2: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=88',
  sleep: 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?auto=format&fit=crop&w=900&q=88',
  sunrise: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=88',
}

function Icon({ name }: { name: 'home'|'life'|'explore'|'heart'|'people'|'search'|'bell'|'settings'|'leaf'|'arrow'|'book'|'sun'|'play'|'close'|'download'|'trash' }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  const p: Record<string, JSX.Element> = {
    home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5h5v5"/></>,
    life: <><circle cx="12" cy="8" r="3"/><path d="M5.5 20c.8-4.2 3-6.3 6.5-6.3s5.7 2.1 6.5 6.3"/></>,
    explore: <><circle cx="12" cy="12" r="8"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z"/></>,
    heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.2A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>,
    people: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M3.5 20c.7-4 2.7-6 5.5-6s4.8 2 5.5 6"/><path d="M14 15c3.5-.6 5.6 1.1 6.5 4"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></>,
    bell: <><path d="M6 16h12c-1.2-1.3-1.5-2.6-1.5-5A4.5 4.5 0 0 0 12 6.5 4.5 4.5 0 0 0 7.5 11c0 2.4-.3 3.7-1.5 5Z"/><path d="M10 19h4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/></>,
    leaf: <><path d="M19 5C11 5 6 9 6 15c4 1 10-1 13-10Z"/><path d="M6 19c1-5 4-8 9-10"/></>,
    arrow: <><path d="M5 12h13"/><path d="m14 8 4 4-4 4"/></>,
    book: <><path d="M4 5.5c4-1.3 6 .3 8 2v11c-2-1.7-4-3.3-8-2V5.5Z"/><path d="M20 5.5c-4-1.3-6 .3-8 2v11c2-1.7 4-3.3 8-2V5.5Z"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></>,
    play: <path d="m9 7 8 5-8 5V7Z"/>,
    close: <><path d="m6 6 12 12"/><path d="M18 6 6 18"/></>,
    download: <><path d="M12 3v11"/><path d="m8 10 4 4 4-4"/><path d="M5 20h14"/></>,
    trash: <><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="m7 7 1 13h8l1-13"/></>,
  }
  return <svg {...common}>{p[name]}</svg>
}

function Logo() {
  return <div className="brand"><span>LUMEN</span><small>SABERES APLICADOS<br/>PARA MEJORAR VIDAS</small></div>
}

function Sidebar({ active, go, authenticated, onSignOut }: { active: Space; go: (space: Space) => void; authenticated: boolean; onSignOut: () => void }) {
  const links: Array<[Space, string, Parameters<typeof Icon>[0]['name']]> = [
    ['home', 'Inicio', 'home'], ['life', 'Mi Vida', 'life'], ['explore', 'Explorar', 'explore'], ['sanctuary', 'Santuario', 'heart'], ['tissue', 'Tejido', 'people'],
  ]
  return <aside className="sidebar">
    <button className="brand-button" onClick={() => go('home')} type="button"><Logo /></button>
    <nav className="nav-main" aria-label="Espacios de LUMEN">
      {links.map(([space, label, icon]) => <button key={space} type="button" className={active === space ? 'active' : ''} onClick={() => go(space)}><Icon name={icon}/><span>{label}</span></button>)}
    </nav>
    <div className="nav-separator" />
    <nav className="nav-minor" aria-label="Utilidades">
      <button type="button"><Icon name="search"/><span>Buscar</span></button>
      <button type="button"><Icon name="bell"/><span>Notificaciones</span></button>
      <button type="button"><Icon name="settings"/><span>Ajustes</span></button>
    </nav>
    <blockquote>Una vida<br/>más consciente<br/>también es una<br/>vida más libre.</blockquote>
    {authenticated && <button className="text-action signout" onClick={onSignOut} type="button">Cerrar sesión</button>}
  </aside>
}

function Profile({ authenticated }: { authenticated: boolean }) {
  return <div className="profile"><img src={IMG.portrait} alt=""/><span><b>{authenticated ? 'Tu espacio' : 'LUMEN'}</b><small>{authenticated ? 'Una vida en proceso' : 'Entrá cuando quieras'}</small></span><span>⌄</span></div>
}

function HomeHero({ expression, setExpression, submit, busy, go, authenticated }: { expression: string; setExpression: (value: string) => void; submit: () => void; busy: boolean; go: (space: Space) => void; authenticated: boolean }) {
  const chips = ['Necesito calma', 'Quiero claridad', 'Me siento abrumada', 'Quiero explorar', 'Solo quiero estar']
  return <section className="hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(255,252,247,.18),rgba(255,252,247,.02)),url(${IMG.hero})` }}>
    <Profile authenticated={authenticated}/>
    <div className="hero-copy">
      <p>Hola.</p>
      <h1>¿Cómo estás hoy?</h1>
      <h2>Un lugar para pausar, comprender<br/>y encontrar lo que puede ayudarte ahora.</h2>
      <form className="moment-bar" onSubmit={(event) => { event.preventDefault(); submit() }}>
        <span className="moment-leaf"><Icon name="leaf"/></span>
        <input aria-label="Lo que te está pasando" value={expression} onChange={(event) => setExpression(event.target.value)} placeholder="Contame qué está presente en tu vida..."/>
        <button type="submit" disabled={busy || !expression.trim()} aria-label="Continuar"><Icon name="arrow"/></button>
      </form>
      <div className="moment-chips">{chips.map((chip) => <button type="button" key={chip} onClick={() => setExpression(chip)}>{chip}</button>)}</div>
    </div>
    <aside className="hero-note"><em>“No estás sola.<br/>Estás en camino.”</em><span>LUMEN</span></aside>
    <div className="hero-shortcuts">
      <Shortcut image={IMG.calm} title="Vivir con más calma" text="Tu camino sigue vivo" onClick={() => go('life')}/>
      <Shortcut image={IMG.practice} title="Una práctica para hoy" text="Respirar en 3 minutos" onClick={() => setExpression('Necesito bajar un poco la intensidad')}/>
      <Shortcut image={IMG.journal} title="Lo que guardaste" text="Tu Santuario" onClick={() => go('sanctuary')}/>
      <Shortcut image={IMG.meeting} title="Un encuentro" text="Tejido y otras vidas" onClick={() => go('tissue')}/>
    </div>
  </section>
}

function Shortcut({ image, title, text, onClick }: { image: string; title: string; text: string; onClick: () => void }) {
  return <button className="shortcut" onClick={onClick} type="button"><img src={image} alt=""/><span><b>{title}</b><small>{text}</small></span><Icon name="arrow"/></button>
}

function PreviewHeader({ icon, title, subtitle, onClick }: { icon: Parameters<typeof Icon>[0]['name']; title: string; subtitle: string; onClick: () => void }) {
  return <button className="preview-head" onClick={onClick} type="button"><span><Icon name={icon}/><b>{title}</b></span><small>{subtitle}</small><Icon name="arrow"/></button>
}

function HomePreviews({ go, snapshot, source, entries, circles }: { go: (space: Space) => void; snapshot: ContinuitySnapshot | null; source: SourceItem[]; entries: SanctuaryEntry[]; circles: Circle[] }) {
  const path = snapshot?.trajectories?.[0]
  const repertoire = snapshot?.repertoire?.slice(0, 3) ?? []
  return <section className="preview-grid">
    <article className="preview-panel life-panel">
      <PreviewHeader icon="life" title="MI VIDA" subtitle="Tu territorio. Lo que está vivo, importa." onClick={() => go('life')}/>
      <div className="panel-inner">
        <div className="mini-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(255,252,245,.92),rgba(255,252,245,.14)),url(${IMG.calm})` }}><b>Tu vida, aquí y ahora</b><em>“Pequeños pasos también crean grandes caminos.”</em></div>
        <div className="mini-section"><span>Lo que está vivo hoy</span><b>{path?.faro_text || 'Integrar la calma en mi rutina'}</b></div>
        <div className="mini-list"><span>Mis caminos</span>{snapshot?.trajectories?.slice(0, 2).map((trajectory) => <button key={trajectory.trajectory_id} type="button"><span><b>{trajectory.faro_text}</b><small>{trajectory.status === 'active' ? 'En camino' : trajectory.status}</small></span><Icon name="arrow"/></button>) || <button type="button"><span><b>Vivir con más calma</b><small>Regulación · En camino</small></span><Icon name="arrow"/></button>}</div>
        <div className="repertoire-strip"><span>Mi repertorio</span><div>{repertoire.length ? repertoire.map((item) => <figure key={item.repertoire_id}><img src={IMG.practice} alt=""/><figcaption>{item.title}</figcaption></figure>) : <><figure><img src={IMG.practice} alt=""/><figcaption>Respiración 3 min</figcaption></figure><figure><img src={IMG.journal} alt=""/><figcaption>Notas que me inspiran</figcaption></figure><figure><img src={IMG.meeting} alt=""/><figcaption>Una charla que sumó</figcaption></figure></>}</div></div>
      </div>
    </article>
    <article className="preview-panel explore-panel">
      <PreviewHeader icon="explore" title="EXPLORAR" subtitle="Un mundo de posibilidades, con sentido." onClick={() => go('explore')}/>
      <div className="panel-inner">
        <div className="explore-intro"><span>Todo lo que puede ayudarte<br/>a vivir una vida más plena.</span><div className="search-shell"><Icon name="search"/>Buscar por tema, capacidad o palabra...</div><div className="tiny-chips"><span>Todos</span><span>Calma</span><span>Sentido</span><span>Vínculos</span><span>Energía</span></div></div>
        <h4>Faros</h4><div className="faro-row"><Faro icon="◎" title="Calma" text="Vivir con más presencia"/><Faro icon="◌" title="Sentido" text="Encontrar dirección"/><Faro icon="♡" title="Vínculos" text="Relacionarme mejor"/></div>
        <h4>Constelaciones destacadas</h4><div className="constellation-row">{(source.length ? source.slice(0, 3) : [null, null, null]).map((item, index) => <figure key={item?.help_id || index}><img src={[IMG.sunrise, IMG.sleep, IMG.walk][index]} alt=""/><figcaption><b>{item?.title || ['Regular el estrés en la vida diaria','Dormir mejor para vivir mejor','Cultivar la auto-compasión'][index]}</b><small>{item?.help_type || 'Práctica · Audio · Aplicación'}</small></figcaption></figure>)}</div>
      </div>
    </article>
    <article className="preview-panel sanctuary-panel">
      <PreviewHeader icon="heart" title="SANTUARIO" subtitle="Tu espacio íntimo. Lo que te nutre, te acompaña." onClick={() => go('sanctuary')}/>
      <div className="panel-inner"><div className="sanctuary-intro">Aquí vive lo que te importa.</div><div className="tiny-chips"><span>Todo</span><span>Reflexiones</span><span>Prácticas</span><span>Notas</span><span>Personas</span></div><div className="sanctuary-feature"><article style={{ backgroundImage: `linear-gradient(0deg,rgba(27,35,25,.55),transparent),url(${IMG.calm})` }}><q>La calma no es la ausencia de movimiento, sino la presencia de lo que importa.</q></article><article className="note-card"><b>{entries[0]?.title || 'Mi nota personal'}</b><p>{entries[0]?.content || 'Hoy entendí que no tengo que resolver todo. Puedo hacer una cosa a la vez.'}</p></article></div><div className="sanctuary-items"><button type="button"><span className="round-play"><Icon name="play"/></span><span><b>Respiración consciente</b><small>Audio · 3 min</small></span><Icon name="arrow"/></button><button type="button"><img src={IMG.meeting} alt=""/><span><b>Una conversación que me marcó</b><small>Personas · Reflexión</small></span><Icon name="arrow"/></button></div><blockquote>“Un lugar para volver a vos.”<small>LUMEN</small></blockquote></div>
    </article>
    <article className="preview-panel tissue-panel">
      <PreviewHeader icon="people" title="TEJIDO" subtitle="Otras vidas, más posibilidades." onClick={() => go('tissue')}/>
      <div className="panel-inner"><div className="tissue-intro">La vida también se vive con otros.</div><div className="tiny-chips"><span>Personas</span><span>Círculos</span><span>Profesionales</span><span>Instituciones</span></div><h4>Personas para acompañarte</h4><div className="people-row"><Person image={IMG.portrait} name="Mariana" role="Psicóloga"/><Person image={IMG.man} name="Diego" role="Facilitador"/><Person image={IMG.portrait2} name="Laura" role="Mentora"/></div><h4>Círculos y encuentros</h4><div className="circle-row">{(circles.length ? circles.slice(0, 3) : [null, null, null]).map((circle, index) => <figure key={circle?.space_id || index}><img src={[IMG.meeting, IMG.journal, IMG.walk][index]} alt=""/><figcaption><b>{circle?.name || ['Círculo de presencia','Lecturas que transforman','Caminatas conscientes'][index]}</b><small>{circle?.purpose || ['Un espacio para compartir y practicar','Dialogar, aprender, integrar','Naturaleza · Conversación · Presencia'][index]}</small></figcaption></figure>)}</div><blockquote>“Otras vidas también iluminan el camino.”</blockquote></div>
    </article>
  </section>
}

function Faro({ icon, title, text }: { icon: string; title: string; text: string }) { return <div className="faro-card"><span>{icon}</span><b>{title}</b><small>{text}</small></div> }
function Person({ image, name, role }: { image: string; name: string; role: string }) { return <div className="person-card"><img src={image} alt=""/><span><b>{name}</b><small>{role}</small></span><button type="button">Conectar</button></div> }

function StartWays({ go, setExpression }: { go: (space: Space) => void; setExpression: (value: string) => void }) {
  const items: Array<{ image: string; title: string; quote: string; action: () => void }> = [
    { image: IMG.practice, title: '1. Llego con un momento', quote: '“Estoy muy estresada...”', action: () => setExpression('Estoy muy estresada') },
    { image: IMG.journal, title: '2. Retomo algo propio', quote: '“Quiero hacer la práctica de respiración.”', action: () => go('life') },
    { image: IMG.walk, title: '3. Exploro', quote: '“Quiero ver qué hay sobre el sentido de la vida.”', action: () => go('explore') },
    { image: IMG.meeting, title: '4. Busco un encuentro', quote: '“Me gustaría hablar con otras personas sobre esto.”', action: () => go('tissue') },
    { image: IMG.calm, title: '5. Integro en mi vida', quote: '“Probé lo de ayer y me sirvió...”', action: () => go('life') },
    { image: IMG.sunrise, title: '6. Vuelvo al camino', quote: '“Quiero seguir trabajando en mi calma.”', action: () => go('life') },
  ]
  return <section className="start-ways"><div className="start-copy"><b>ALGUNAS FORMAS<br/>DE COMENZAR</b><p>Diferentes entradas,<br/>un mismo lugar.</p></div>{items.map((item) => <button className="start-card" key={item.title} type="button" onClick={item.action} style={{ backgroundImage: `linear-gradient(0deg,rgba(16,20,17,.72),rgba(16,20,17,.03)),url(${item.image})` }}><b>{item.title}</b><small>{item.quote}</small></button>)}<div className="start-end"><em>Diferentes caminos.<br/>Una misma intención.<br/>Vidas más plenas.</em><span>—</span><b>LUMEN</b></div></section>
}

function PrivateGate({ name, email, setEmail, goHome, goExplore }: { name: string; email: string; setEmail: (value: string) => void; goHome: () => void; goExplore: () => void }) {
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const normalizedCode = code.replace(/\D/g, '')
  const codeLooksValid = normalizedCode.length >= 6 && normalizedCode.length <= 10

  const sendCode = async () => {
    if (!email.trim()) return
    setBusy(true)
    setMessage('')
    try {
      await requestEmailOtp(email)
      setCodeSent(true)
      setMessage('Te envié un código de acceso. Revisá tu correo.')
    } catch (error) {
      const authError = error as { code?: string; status?: number }
      setMessage(authError.code === 'over_email_send_rate_limit' || authError.status === 429
        ? 'Pediste varios códigos en poco tiempo. Esperá un momento e intentá otra vez.'
        : 'No pude enviar el código. Revisá el correo e intentá otra vez.')
    } finally {
      setBusy(false)
    }
  }

  const verifyCode = async () => {
    if (!codeLooksValid) return
    setBusy(true)
    setMessage('')
    try {
      await verifyEmailOtp(email, normalizedCode)
      setMessage('Listo. Entrando a tu espacio...')
      window.location.reload()
    } catch {
      setMessage('Ese código no es válido o venció. Pedí uno nuevo e intentá otra vez.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="gate-page"><div className="gate-card"><span className="orb"/><p>{name.toUpperCase()}</p><h1>Este espacio se construye alrededor de tu vida.</h1><p className="gate-copy">Entrá para conservar continuidad, memoria soberana y aquello que decidís hacer propio. También podés seguir explorando LUMEN sin identificarte.</p>{!codeSent ? <div className="gate-form"><input aria-label="Correo" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com"/><button onClick={() => void sendCode()} disabled={busy || !email.trim()} type="button">Enviarme un código</button></div> : <><div className="gate-form"><input aria-label="Código de acceso" inputMode="numeric" autoComplete="one-time-code" maxLength={10} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Código recibido"/><button onClick={() => void verifyCode()} disabled={busy || !codeLooksValid} type="button">Entrar</button></div><button className="text-action" type="button" disabled={busy} onClick={() => { setCode(''); setCodeSent(false); setMessage('') }}>Usar otro correo</button></>}{message && <small className="status-message">{message}</small>}<div className="gate-links"><button onClick={goExplore} type="button">Seguir explorando</button><button onClick={goHome} type="button">Volver al inicio</button></div></div></section>
}

function MomentFlow({ stage, scene, help, busy, onTry, onExperienceExit, onOutcome, onIntegrate, onClose, integrated }: { stage: MomentStage; scene: S1Scene | null; help: HelpPossibility | null; busy: boolean; onTry: () => void; onExperienceExit: () => void; onOutcome: (effect: 'helped'|'not_helped'|'unsure') => void; onIntegrate: () => void; onClose: () => void; integrated: boolean }) {
  const noMatch = scene?.coverage?.state === 'NO_MATCH' || !help
  if (stage === 'experience' && help) return <Experience help={help} onExit={onExperienceExit}/>
  return <section className="moment-page"><div className="moment-dialogue"><span className="orb small"/><button className="dialogue-close" type="button" onClick={onClose}><Icon name="close"/></button>{stage === 'scene' && <>{noMatch ? <><p className="eyebrow">LUMEN · PRESENCIA</p><h1>No quiero inventarte una respuesta.</h1><p>No encontré una posibilidad suficientemente confiable para esto ahora. Podemos aclarar un poco más, explorar otra puerta o simplemente dejarlo acá.</p><div className="button-row"><button className="primary" type="button" onClick={onClose}>Volver</button></div></> : <><p className="eyebrow">UNA POSIBILIDAD PARA AHORA</p><h1>{help?.title}</h1><p>{help?.summary}</p><div className="help-meta"><span>{help?.help_type}</span>{help?.duration_minutes && <span>{help.duration_minutes} min</span>}</div><div className="button-row"><button className="primary" type="button" onClick={onTry} disabled={busy}>Vivir esta posibilidad</button><button className="ghost" type="button" onClick={onClose}>Ahora no</button></div></>}</>}{stage === 'outcome' && <><p className="eyebrow">RETORNO</p><h1>¿Cómo fue para vos?</h1><p>No hace falta explicar demasiado. Sólo nos ayuda a saber si tuvo sentido en tu vida real.</p><div className="outcome-row"><button type="button" onClick={() => onOutcome('helped')}>Me ayudó</button><button type="button" onClick={() => onOutcome('unsure')}>No estoy segura</button><button type="button" onClick={() => onOutcome('not_helped')}>No me ayudó</button></div></>}{stage === 'closed' && <><p className="eyebrow">COSECHA</p><h1>Gracias. Con esto alcanza por ahora.</h1><p>{integrated ? 'Quedó en tu repertorio.' : 'Si querés, podés conservar esta posibilidad como algo que ya sabés que podés volver a usar.'}</p><div className="button-row">{!integrated && help && <button className="primary" type="button" onClick={onIntegrate} disabled={busy}>Guardar “{help.title}” en mi repertorio</button>}<button className="ghost" type="button" onClick={onClose}>Volver a mi vida</button></div></>}</div></section>
}

function LifeView({ snapshot, refresh }: { snapshot: ContinuitySnapshot | null; refresh: () => Promise<void> }) {
  const [newFaro, setNewFaro] = useState('')
  const [busy, setBusy] = useState(false)
  const create = async (event: FormEvent) => { event.preventDefault(); if (!newFaro.trim()) return; setBusy(true); try { await createTrajectory(newFaro.trim()); setNewFaro(''); await refresh() } finally { setBusy(false) } }
  const memory = snapshot?.memory_allowed ?? false
  return <section className="space-page life-view"><SpaceHero kicker="MI VIDA" title="Tu vida, aquí y ahora" text="Lo que está vivo, lo que elegiste cuidar y aquello que ya hiciste propio." image={IMG.calm}/><div className="space-content"><div className="life-columns"><section><p className="section-label">LO QUE ESTÁ VIVO HOY</p><h2>{snapshot?.trajectories?.[0]?.faro_text || 'Un lugar para reconocer dónde estás.'}</h2><p>El presente tiene prioridad. Tus caminos siguen disponibles sin convertirse en presión.</p></section><aside className="soft-control"><span>Memoria elegida por vos</span><button type="button" className={memory ? 'switch on' : 'switch'} onClick={async () => { await setMemory(!memory); await refresh() }}><i/></button></aside></div><div className="section-heading"><h2>Mis caminos</h2><p>Direcciones vivas, no programas.</p></div><div className="path-grid">{snapshot?.trajectories?.length ? snapshot.trajectories.map((trajectory) => <article key={trajectory.trajectory_id}><span className="path-dot"/><div><b>{trajectory.faro_text}</b><small>{trajectory.status === 'active' ? 'En camino' : trajectory.status}</small><p>{trajectory.path.length ? trajectory.path[0].label : 'Abierto a lo que la vida vaya mostrando.'}</p></div></article>) : <article><span className="path-dot"/><div><b>Tu primer Faro puede nacer acá.</b><small>Elegido por vos</small><p>Una dirección que quieras cuidar sin convertirla en meta ni score.</p></div></article>}</div><form className="inline-create" onSubmit={create}><input value={newFaro} onChange={(event) => setNewFaro(event.target.value)} placeholder="Algo que quiero cuidar en mi vida..."/><button disabled={busy || !newFaro.trim()}>Abrir un camino</button></form><div className="section-heading"><h2>Mi repertorio</h2><p>Lo que ya reconociste como útil para volver a usar.</p></div><div className="repertoire-grid">{snapshot?.repertoire?.length ? snapshot.repertoire.map((item) => <article key={item.repertoire_id}><img src={IMG.practice} alt=""/><span><b>{item.title}</b><small>{item.times_reused ? `${item.times_reused} retornos` : 'Disponible para vos'}</small><p>{item.summary}</p></span></article>) : <div className="empty-state">Todavía no hay nada en tu repertorio. LUMEN no lo llena por vos.</div>}</div></div></section>
}

function SpaceHero({ kicker, title, text, image }: { kicker: string; title: string; text: string; image: string }) { return <header className="space-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(255,252,247,.98),rgba(255,252,247,.40)),url(${image})` }}><div><p>{kicker}</p><h1>{title}</h1><span>{text}</span></div></header> }

function ExploreView({ source, taxonomy, refreshSource, authenticated, onOpen, onSave }: { source: SourceItem[]; taxonomy: SourceTaxonomy | null; refreshSource: (capacity?: string | null) => Promise<void>; authenticated: boolean; onOpen: (item: SourceItem) => void; onSave: (item: SourceItem) => Promise<void> }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => source.filter((item) => `${item.title} ${item.summary}`.toLowerCase().includes(query.toLowerCase())), [source, query])
  return <section className="space-page explore-view"><SpaceHero kicker="EXPLORAR" title="Todo lo que puede ayudarte a vivir una vida más plena." text="Descubrimiento con criterio. Posibilidades distintas, una misma intención: ayudar a vivir." image={IMG.sunrise}/><div className="space-content"><div className="explore-toolbar"><div className="search-large"><Icon name="search"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por tema, capacidad o palabra..."/></div><div className="filter-chips"><button className="active" type="button" onClick={() => void refreshSource(null)}>Todo</button>{taxonomy?.capacities?.slice(0, 8).map((term) => <button key={term.key} type="button" onClick={() => void refreshSource(term.key)}>{term.label}</button>)}</div></div><div className="section-heading"><h2>Faros para explorar</h2><p>Entrá por lo que hoy te despierta curiosidad.</p></div><div className="faro-large-grid">{(taxonomy?.capacities?.slice(0, 6) || []).map((term, index) => <button key={term.key} type="button" onClick={() => void refreshSource(term.key)}><span>{['◎','◌','♡','◍','◇','◉'][index]}</span><b>{term.label}</b><small>Explorar posibilidades</small></button>)}</div><div className="section-heading"><h2>Posibilidades</h2><p>No es un catálogo: cada pieza conserva su naturaleza, origen y propósito.</p></div><div className="source-grid">{filtered.map((item, index) => <article key={item.help_id}><img src={[IMG.calm, IMG.practice, IMG.journal, IMG.meeting, IMG.walk, IMG.sleep][index % 6]} alt=""/><div><p className="eyebrow">{item.help_type.replaceAll('_',' ')}</p><h3>{item.title}</h3><p>{item.summary}</p><div className="source-meta"><span>{item.provider?.name}</span>{item.duration_minutes && <span>{item.duration_minutes} min</span>}</div><div className="card-actions"><button className="primary small" type="button" onClick={() => onOpen(item)}>Vivir esta posibilidad</button>{authenticated && <button className="ghost small" type="button" onClick={() => void onSave(item)}>Conservar para mí</button>}</div></div></article>)}</div></div></section>
}

function SanctuaryView({ entries, refresh }: { entries: SanctuaryEntry[]; refresh: () => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)
  const save = async (event: FormEvent) => { event.preventDefault(); if (!content.trim()) return; setBusy(true); try { await saveSanctuary('note', title.trim(), content.trim()); setTitle(''); setContent(''); await refresh() } finally { setBusy(false) } }
  const download = async () => { const data = await exportSanctuary(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'mi-santuario-lumen.json'; anchor.click(); URL.revokeObjectURL(url) }
  return <section className="space-page sanctuary-view"><SpaceHero kicker="SANTUARIO" title="Aquí vive lo que importa." text="Un espacio íntimo para conservar significado, no una carpeta de favoritos." image={IMG.journal}/><div className="space-content"><div className="sanctuary-toolbar"><div className="filter-chips"><button className="active" type="button">Todo</button><button type="button">Reflexiones</button><button type="button">Prácticas</button><button type="button">Notas</button><button type="button">Personas</button></div><button className="text-action" onClick={() => void download()} type="button"><Icon name="download"/>Exportar lo mío</button></div><div className="sanctuary-grid-large">{entries.length ? entries.map((entry, index) => <article key={entry.entry_id} className={index === 0 ? 'feature' : ''}><div className="entry-visual" style={{ backgroundImage: `linear-gradient(0deg,rgba(28,31,24,.50),rgba(28,31,24,.06)),url(${[IMG.calm, IMG.journal, IMG.meeting, IMG.walk][index % 4]})` }}/><div className="entry-copy"><small>{entry.entry_kind}</small><h3>{entry.title || 'Algo que elegiste conservar'}</h3><p>{entry.content}</p><button className="icon-action" type="button" onClick={async () => { await deleteSanctuary(entry.entry_id); await refresh() }} aria-label="Eliminar"><Icon name="trash"/></button></div></article>) : <article className="empty-sanctuary"><span className="orb small"/><h3>Tu Santuario empieza cuando algo importa para vos.</h3><p>No se llena automáticamente. Nada entra sin tu decisión.</p></article>}</div><form className="sanctuary-compose" onSubmit={save}><p className="section-label">UNA NOTA PARA VOS</p><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título (opcional)"/><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Algo que quieras conservar..."/><button className="primary" disabled={busy || !content.trim()}>Conservar en mi Santuario</button></form></div></section>
}

function TissueView({ circles, refresh }: { circles: Circle[]; refresh: () => Promise<void> }) {
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [busy, setBusy] = useState(false)
  const create = async (event: FormEvent) => { event.preventDefault(); if (!name.trim() || !purpose.trim()) return; setBusy(true); try { await createCircle(name.trim(), purpose.trim()); setName(''); setPurpose(''); await refresh() } finally { setBusy(false) } }
  return <section className="space-page tissue-view"><SpaceHero kicker="TEJIDO" title="La vida también se vive con otros." text="Personas, pares, profesionales, círculos, instituciones y experiencias reales cuando la presencia humana tiene sentido." image={IMG.meeting}/><div className="space-content"><div className="filter-chips tissue-filters"><button className="active" type="button">Personas</button><button type="button">Círculos</button><button type="button">Profesionales</button><button type="button">Instituciones</button><button type="button">Actividades</button></div><div className="section-heading"><h2>Personas para acompañarte</h2><p>Presencia humana con rol, límites y contexto visibles.</p></div><div className="people-large"><Person image={IMG.portrait} name="Mariana" role="Psicóloga · Ansiedad y regulación"/><Person image={IMG.man} name="Diego" role="Facilitador · Transiciones y propósito"/><Person image={IMG.portrait2} name="Laura" role="Mentora · Hábitos y bienestar"/></div><div className="section-heading"><h2>Círculos y encuentros</h2><p>Cuando otras vidas pueden aportar algo que LUMI no debe sustituir.</p></div><div className="circle-large">{(circles.length ? circles : [null, null, null]).map((circle, index) => <article key={circle?.space_id || index}><img src={[IMG.meeting, IMG.journal, IMG.walk][index % 3]} alt=""/><div><h3>{circle?.name || ['Círculo de presencia','Lecturas que transforman','Caminatas conscientes'][index]}</h3><p>{circle?.purpose || ['Un espacio para compartir y practicar.','Dialogar, aprender e integrar.','Naturaleza, conversación y presencia.'][index]}</p><small>{circle ? `${circle.member_count} vidas · ${circle.role}` : index === 2 ? 'Presencial' : 'Online'}</small></div></article>)}</div><form className="circle-create" onSubmit={create}><div><p className="section-label">ABRIR UN CÍRCULO</p><h2>Crear un espacio con propósito.</h2><p>LUMEN sostiene los bordes; las personas ocupan el centro.</p></div><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre del círculo"/><input value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Para qué existe"/><button className="primary" disabled={busy || !name.trim() || !purpose.trim()}>Crear círculo</button></form></div></section>
}

export default function App() {
  const [space, setSpace] = useState<Space>('home')
  const [authenticated, setAuthenticated] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [email, setEmail] = useState('')
  const [expression, setExpression] = useState('')
  const [stage, setStage] = useState<MomentStage>('idle')
  const [scene, setScene] = useState<S1Scene | null>(null)
  const [help, setHelp] = useState<HelpPossibility | null>(null)
  const [sourceExperience, setSourceExperience] = useState<SourceItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [integrated, setIntegrated] = useState(false)
  const [snapshot, setSnapshot] = useState<ContinuitySnapshot | null>(null)
  const [source, setSource] = useState<SourceItem[]>([])
  const [taxonomy, setTaxonomy] = useState<SourceTaxonomy | null>(null)
  const [entries, setEntries] = useState<SanctuaryEntry[]>([])
  const [circles, setCircles] = useState<Circle[]>([])

  const refreshPrivate = useCallback(async () => {
    if (!authenticated) { setSnapshot(null); setEntries([]); setCircles([]); return }
    const [nextSnapshot, nextEntries, nextCircles] = await Promise.all([getContinuitySnapshot(), listSanctuary(), getTissueSnapshot()])
    setSnapshot(nextSnapshot); setEntries(nextEntries); setCircles(nextCircles)
  }, [authenticated])

  const refreshSource = useCallback(async (capacity?: string | null) => {
    const items = await discoverSource(null, capacity ?? null, null, navigator.language || 'es-AR', 24)
    setSource(items)
  }, [])

  useEffect(() => { let live = true; void getAuthSnapshot().then(async (auth) => { if (!live) return; const yes = Boolean(auth.session); setAuthenticated(yes); if (yes) await bootstrapPerson(); setAuthReady(true) }).catch(() => setAuthReady(true)); return () => { live = false } }, [])
  useEffect(() => { void Promise.all([refreshSource(), getSourceTaxonomy().then(setTaxonomy).catch(() => null)]) }, [refreshSource])
  useEffect(() => { if (authReady) void refreshPrivate() }, [authReady, authenticated, refreshPrivate])

  const go = (next: Space) => { setSourceExperience(null); setSpace(next); setStage('idle'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const runMoment = async () => { if (!expression.trim()) return; if (!authenticated) { setStage('auth'); return } setBusy(true); try { const nextScene = await accompanyMoment(expression.trim(), navigator.language || 'es-AR', (navigator.language || 'es').split('-')[0]); setScene(nextScene); setHelp(primaryHelpFromScene(nextScene)); setStage('scene') } finally { setBusy(false) } }
  const chooseHelp = async () => { if (!scene?.episode_id || !help) return; setBusy(true); try { await selectHelp(scene.episode_id, help.help_id, 'selected'); setStage('experience') } finally { setBusy(false) } }
  const outcome = async (effect: 'helped'|'not_helped'|'unsure') => { if (!scene?.episode_id) return; setBusy(true); try { await recordOutcome(scene.episode_id, effect); setStage('closed') } finally { setBusy(false) } }
  const integrate = async () => { if (!help) return; setBusy(true); try { await integrateHelp(help.help_id); setIntegrated(true); await refreshPrivate() } finally { setBusy(false) } }
  const logout = async () => { await signOut(); setAuthenticated(false); setSpace('home'); setStage('idle'); setIntegrated(false) }
  const saveFromSource = async (item: SourceItem) => { await saveSanctuary('treasure', item.title, item.summary, item.help_id); await refreshPrivate() }
  const closeMoment = () => { setStage('idle'); setExpression(''); setScene(null); setHelp(null); setIntegrated(false) }
  const privateName = space === 'life' ? 'Mi Vida' : space === 'sanctuary' ? 'Santuario' : 'Tejido'

  return <div className="app-shell"><Sidebar active={space} go={go} authenticated={authenticated} onSignOut={() => void logout()}/><main className="main-field">
    {space === 'home' && stage === 'idle' && <><HomeHero expression={expression} setExpression={setExpression} submit={() => void runMoment()} busy={busy} go={go} authenticated={authenticated}/><HomePreviews go={go} snapshot={snapshot} source={source} entries={entries} circles={circles}/><StartWays go={go} setExpression={(value) => { setExpression(value); window.scrollTo({ top: 0, behavior: 'smooth' }) }}/><footer>CONOCIMIENTO · EXPERIENCIA · PERSONAS · VIDA REAL<br/><span>CIRCULANDO JUNTAS PARA UN MUNDO CON MÁS VIDAS PLENAS</span></footer></>}
    {space === 'home' && stage === 'auth' && <PrivateGate name="Tu continuidad" email={email} setEmail={setEmail} goHome={() => setStage('idle')} goExplore={() => { setStage('idle'); setSpace('explore') }}/>} 
    {space === 'home' && stage !== 'idle' && stage !== 'auth' && <MomentFlow stage={stage} scene={scene} help={help} busy={busy} onTry={() => void chooseHelp()} onExperienceExit={() => setStage('outcome')} onOutcome={(effect) => void outcome(effect)} onIntegrate={() => void integrate()} onClose={closeMoment} integrated={integrated}/>} 
    {space === 'explore' && !sourceExperience && <ExploreView source={source} taxonomy={taxonomy} refreshSource={refreshSource} authenticated={authenticated} onOpen={setSourceExperience} onSave={saveFromSource}/>} 
    {space === 'explore' && sourceExperience && <Experience help={sourceExperience} onExit={() => setSourceExperience(null)}/>} 
    {space === 'life' && (authenticated ? <LifeView snapshot={snapshot} refresh={refreshPrivate}/> : <PrivateGate name={privateName} email={email} setEmail={setEmail} goHome={() => setSpace('home')} goExplore={() => setSpace('explore')}/>)}
    {space === 'sanctuary' && (authenticated ? <SanctuaryView entries={entries} refresh={refreshPrivate}/> : <PrivateGate name={privateName} email={email} setEmail={setEmail} goHome={() => setSpace('home')} goExplore={() => setSpace('explore')}/>)}
    {space === 'tissue' && (authenticated ? <TissueView circles={circles} refresh={refreshPrivate}/> : <PrivateGate name={privateName} email={email} setEmail={setEmail} goHome={() => setSpace('home')} goExplore={() => setSpace('explore')}/>)}
  </main></div>
}
