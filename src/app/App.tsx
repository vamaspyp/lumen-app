import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { getAuthSnapshot, requestEmailOtp, signOut, verifyEmailOtp } from '../greenfield/application/auth'
import { bootstrapPerson } from '../greenfield/application/consent'
import {
  addPathItem,
  cancelFollowup,
  createCircle,
  createTrajectory,
  deleteSanctuary,
  discoverConstellation,
  discoverSource,
  exportSanctuary,
  getContinuitySnapshot,
  getProactivitySnapshot,
  getSourceTaxonomy,
  getTissueSnapshot,
  integrateHelp,
  listSanctuary,
  recordLongitudinalSignal,
  reuseRepertoire,
  saveSanctuary,
  setMemory,
  setProactivity,
  updateTrajectory,
  type Circle,
  type ContinuitySnapshot,
  type CultivationMove,
  type ProactivitySnapshot,
  type SanctuaryEntry,
  type SourceItem,
  type SourceTaxonomy,
  type Trajectory,
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

type Space = 'home' | 'life' | 'explore' | 'sanctuary' | 'tissue' | 'search' | 'notifications' | 'settings'
type MomentStage = 'idle' | 'auth' | 'scene' | 'experience' | 'outcome' | 'closed'
type TissueKind = 'circles' | 'professionals' | 'institutions' | 'actions'

const IMG = {
  hero: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&q=92',
  calm: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd4297?auto=format&fit=crop&w=1000&q=88',
  practice: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=88',
  journal: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=88',
  meeting: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=88',
  walk: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=88',
  portrait: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=88',
  sleep: 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?auto=format&fit=crop&w=900&q=88',
  sunrise: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=88',
}

const ROLE_LABEL: Record<string, string> = {
  UNDERSTAND: 'Comprender', PRACTICE: 'Practicar', APPLY: 'Aplicar', VARY: 'Variar', REFLECT: 'Reflexionar',
  INTEGRATE: 'Integrar', CONNECT: 'Conectar', SUSTAIN: 'Sostener',
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

function Logo() { return <div className="brand"><span>LUMEN</span><small>SABERES APLICADOS<br/>PARA MEJORAR VIDAS</small></div> }

function Sidebar({ active, go, authenticated, onSignOut }: { active: Space; go: (space: Space) => void; authenticated: boolean; onSignOut: () => void }) {
  const links: Array<[Space, string, Parameters<typeof Icon>[0]['name']]> = [
    ['home', 'Inicio', 'home'], ['life', 'Mi Vida', 'life'], ['explore', 'Explorar', 'explore'], ['sanctuary', 'Santuario', 'heart'], ['tissue', 'Tejido', 'people'],
  ]
  const utilities: Array<[Space, string, Parameters<typeof Icon>[0]['name']]> = [
    ['search', 'Buscar', 'search'], ['notifications', 'Notificaciones', 'bell'], ['settings', 'Ajustes', 'settings'],
  ]
  return <aside className="sidebar">
    <button className="brand-button" onClick={() => go('home')} type="button"><Logo /></button>
    <nav className="nav-main" aria-label="Espacios de LUMEN">
      {links.map(([space, label, icon]) => <button key={space} type="button" className={active === space ? 'active' : ''} onClick={() => go(space)}><Icon name={icon}/><span>{label}</span></button>)}
    </nav>
    <div className="nav-separator" />
    <nav className="nav-minor" aria-label="Utilidades">
      {utilities.map(([space, label, icon]) => <button key={space} type="button" className={active === space ? 'active' : ''} onClick={() => go(space)}><Icon name={icon}/><span>{label}</span></button>)}
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
      <p>Hola.</p><h1>¿Cómo estás hoy?</h1><h2>Un lugar para pausar, comprender<br/>y encontrar lo que puede ayudarte ahora.</h2>
      <form className="moment-bar" onSubmit={(event) => { event.preventDefault(); submit() }}><span className="moment-leaf"><Icon name="leaf"/></span><input aria-label="Lo que te está pasando" value={expression} onChange={(event) => setExpression(event.target.value)} placeholder="Contame qué está presente en tu vida..."/><button type="submit" disabled={busy || !expression.trim()} aria-label="Continuar"><Icon name="arrow"/></button></form>
      <div className="moment-chips">{chips.map((chip) => <button type="button" key={chip} onClick={() => setExpression(chip)}>{chip}</button>)}</div>
    </div>
    <aside className="hero-note"><em>“No estás sola.<br/>Estás en camino.”</em><span>LUMEN</span></aside>
    <div className="hero-shortcuts"><Shortcut image={IMG.calm} title="Vivir con más calma" text="Tu camino sigue vivo" onClick={() => go('life')}/><Shortcut image={IMG.practice} title="Una práctica para hoy" text="Abrir un Momento" onClick={() => setExpression('Necesito bajar un poco la intensidad')}/><Shortcut image={IMG.journal} title="Lo que guardaste" text="Tu Santuario" onClick={() => go('sanctuary')}/><Shortcut image={IMG.meeting} title="Un encuentro" text="Tejido y otras vidas" onClick={() => go('tissue')}/></div>
  </section>
}

function Shortcut({ image, title, text, onClick }: { image: string; title: string; text: string; onClick: () => void }) { return <button className="shortcut" onClick={onClick} type="button"><img src={image} alt=""/><span><b>{title}</b><small>{text}</small></span><Icon name="arrow"/></button> }
function PreviewHeader({ icon, title, subtitle, onClick }: { icon: Parameters<typeof Icon>[0]['name']; title: string; subtitle: string; onClick: () => void }) { return <button className="preview-head" onClick={onClick} type="button"><span><Icon name={icon}/><b>{title}</b></span><small>{subtitle}</small><Icon name="arrow"/></button> }

function HomePreviews({ go, snapshot, source, taxonomy, constellation, entries, circles }: { go: (space: Space) => void; snapshot: ContinuitySnapshot | null; source: SourceItem[]; taxonomy: SourceTaxonomy | null; constellation: SourceItem[]; entries: SanctuaryEntry[]; circles: Circle[] }) {
  const path = snapshot?.trajectories?.[0]
  const repertoire = snapshot?.repertoire?.slice(0, 3) ?? []
  const capabilities = taxonomy?.capacities?.slice(0, 3) ?? []
  return <section className="preview-grid">
    <article className="preview-panel life-panel"><PreviewHeader icon="life" title="MI VIDA" subtitle="Tu territorio. Lo que está vivo, importa." onClick={() => go('life')}/><div className="panel-inner"><div className="mini-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(255,252,245,.92),rgba(255,252,245,.14)),url(${IMG.calm})` }}><b>Tu vida, aquí y ahora</b><em>{path ? '“Tu dirección sigue disponible, sin convertirse en presión.”' : '“Tu primer camino aparece cuando vos elegís abrirlo.”'}</em></div><div className="mini-section"><span>Lo que está vivo hoy</span><b>{path?.faro_text || 'Todavía no abriste un Faro.'}</b></div><div className="mini-list"><span>Mis caminos</span>{snapshot?.trajectories?.slice(0, 2).map((trajectory) => <button key={trajectory.trajectory_id} type="button" onClick={() => go('life')}><span><b>{trajectory.faro_text}</b><small>{trajectory.status === 'active' ? 'En camino' : trajectory.status}</small></span><Icon name="arrow"/></button>)}{!snapshot?.trajectories?.length && <p className="empty-state">Nada se crea por vos. Podés abrir una dirección cuando tenga sentido.</p>}</div><div className="repertoire-strip"><span>Mi repertorio</span><div>{repertoire.map((item) => <figure key={item.repertoire_id}><img src={IMG.practice} alt=""/><figcaption>{item.title}</figcaption></figure>)}{!repertoire.length && <p className="empty-state">Todavía no hiciste propia ninguna posibilidad.</p>}</div></div></div></article>
    <article className="preview-panel explore-panel"><PreviewHeader icon="explore" title="EXPLORAR" subtitle="Un mundo de posibilidades, con sentido." onClick={() => go('explore')}/><div className="panel-inner"><div className="explore-intro"><span>Todo lo que puede ayudarte<br/>a vivir una vida más plena.</span><button className="search-shell" type="button" onClick={() => go('search')}><Icon name="search"/>Buscar por tema, capacidad o palabra...</button></div><h4>Capacidades</h4><div className="faro-row">{capabilities.map((term, index) => <Faro key={term.key} icon={['◎','◌','♡'][index] || '◇'} title={term.label} text="Explorar sin scores"/>)}{!capabilities.length && <p className="empty-state">Cargando capacidades de Fuente…</p>}</div><h4>Constelación viva</h4><div className="constellation-row">{constellation.slice(0, 3).map((item, index) => <figure key={item.help_id}><img src={[IMG.sunrise, IMG.sleep, IMG.walk][index % 3]} alt=""/><figcaption><b>{item.title}</b><small>{(item.cultivation_roles || []).map((role) => ROLE_LABEL[role] || role).join(' · ') || item.help_type}</small></figcaption></figure>)}{!constellation.length && <p className="empty-state">La constelación se compone desde Fuente cuando elegís una capacidad.</p>}</div></div></article>
    <article className="preview-panel sanctuary-panel"><PreviewHeader icon="heart" title="SANTUARIO" subtitle="Tu espacio íntimo. Lo que te nutre, te acompaña." onClick={() => go('sanctuary')}/><div className="panel-inner"><div className="sanctuary-intro">Aquí vive sólo lo que vos decidiste conservar.</div><div className="sanctuary-feature">{entries.slice(0, 2).map((entry, index) => index === 0 ? <article key={entry.entry_id} style={{ backgroundImage: `linear-gradient(0deg,rgba(27,35,25,.55),transparent),url(${IMG.calm})` }}><q>{entry.content}</q></article> : <article key={entry.entry_id} className="note-card"><b>{entry.title || 'Algo que elegiste conservar'}</b><p>{entry.content}</p></article>)}{!entries.length && <article className="note-card"><b>Tu Santuario está vacío.</b><p>Nada entra automáticamente. Eso también es parte de tu soberanía.</p></article>}</div><blockquote>“Un lugar para volver a vos.”<small>LUMEN</small></blockquote></div></article>
    <article className="preview-panel tissue-panel"><PreviewHeader icon="people" title="TEJIDO" subtitle="Otras vidas, más posibilidades." onClick={() => go('tissue')}/><div className="panel-inner"><div className="tissue-intro">La vida también se vive con otros.</div><h4>Círculos reales</h4><div className="circle-row">{circles.slice(0, 3).map((circle, index) => <figure key={circle.space_id}><img src={[IMG.meeting, IMG.journal, IMG.walk][index % 3]} alt=""/><figcaption><b>{circle.name}</b><small>{circle.purpose}</small></figcaption></figure>)}{!circles.length && <p className="empty-state">Todavía no participás de ningún círculo.</p>}</div><h4>Ayuda humana disponible</h4><p>{source.filter((item) => ['professional_support','institutional_service','human_action','conversation'].includes(item.help_type)).length} posibilidades activas en Fuente.</p><blockquote>“Otras vidas también pueden acompañar.”</blockquote></div></article>
  </section>
}

function Faro({ icon, title, text }: { icon: string; title: string; text: string }) { return <div className="faro-card"><span>{icon}</span><b>{title}</b><small>{text}</small></div> }

function StartWays({ go, setExpression }: { go: (space: Space) => void; setExpression: (value: string) => void }) {
  const items: Array<{ image: string; title: string; quote: string; action: () => void }> = [
    { image: IMG.practice, title: '1. Llego con un momento', quote: '“Estoy muy estresada...”', action: () => setExpression('Estoy muy estresada') },
    { image: IMG.journal, title: '2. Retomo algo propio', quote: '“Quiero volver a algo que ya me sirve.”', action: () => go('life') },
    { image: IMG.walk, title: '3. Exploro', quote: '“Quiero ver distintas maneras de acercarme a esto.”', action: () => go('explore') },
    { image: IMG.meeting, title: '4. Busco un encuentro', quote: '“Me gustaría que otra vida pueda acompañar.”', action: () => go('tissue') },
    { image: IMG.calm, title: '5. Integro en mi vida', quote: '“Esto me sirvió y quiero conservarlo.”', action: () => go('life') },
    { image: IMG.sunrise, title: '6. Vuelvo al camino', quote: '“Quiero retomar una dirección que elegí.”', action: () => go('life') },
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
  const sendCode = async () => { if (!email.trim()) return; setBusy(true); setMessage(''); try { await requestEmailOtp(email); setCodeSent(true); setMessage('Te envié un código de acceso. Revisá tu correo.') } catch (error) { const authError = error as { code?: string; status?: number }; setMessage(authError.code === 'over_email_send_rate_limit' || authError.status === 429 ? 'Pediste varios códigos en poco tiempo. Esperá un momento e intentá otra vez.' : 'No pude enviar el código. Revisá el correo e intentá otra vez.') } finally { setBusy(false) } }
  const verifyCode = async () => { if (!codeLooksValid) return; setBusy(true); setMessage(''); try { await verifyEmailOtp(email, normalizedCode); setMessage('Listo. Entrando a tu espacio...'); window.location.reload() } catch { setMessage('Ese código no es válido o venció. Pedí uno nuevo e intentá otra vez.') } finally { setBusy(false) } }
  return <section className="gate-page"><div className="gate-card"><span className="orb"/><p>{name.toUpperCase()}</p><h1>Este espacio se construye alrededor de tu vida.</h1><p className="gate-copy">Entrá para conservar continuidad, memoria soberana y aquello que decidís hacer propio. También podés seguir explorando LUMEN sin identificarte.</p>{!codeSent ? <div className="gate-form"><input aria-label="Correo" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com"/><button onClick={() => void sendCode()} disabled={busy || !email.trim()} type="button">Enviarme un código</button></div> : <><div className="gate-form"><input aria-label="Código de acceso" inputMode="numeric" autoComplete="one-time-code" maxLength={10} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Código recibido"/><button onClick={() => void verifyCode()} disabled={busy || !codeLooksValid} type="button">Entrar</button></div><button className="text-action" type="button" disabled={busy} onClick={() => { setCode(''); setCodeSent(false); setMessage('') }}>Usar otro correo</button></>}{message && <small className="status-message">{message}</small>}<div className="gate-links"><button onClick={goExplore} type="button">Seguir explorando</button><button onClick={goHome} type="button">Volver al inicio</button></div></div></section>
}

function MomentFlow({ stage, scene, help, busy, onTry, onExperienceExit, onOutcome, onIntegrate, onClose, onClarify, integrated }: { stage: MomentStage; scene: S1Scene | null; help: HelpPossibility | null; busy: boolean; onTry: () => void; onExperienceExit: () => void; onOutcome: (effect: 'helped'|'not_helped'|'unsure') => void; onIntegrate: () => void; onClose: () => void; onClarify: () => void; integrated: boolean }) {
  const noMatch = scene?.coverage?.state === 'NO_MATCH' || !help
  if (stage === 'experience' && help) return <Experience help={help} onExit={onExperienceExit}/>
  return <section className="moment-page"><div className="moment-dialogue"><span className="orb small"/><button className="dialogue-close" type="button" onClick={onClose}><Icon name="close"/></button>{stage === 'scene' && <>{noMatch ? <><p className="eyebrow">LUMEN · PRESENCIA</p><h1>No quiero inventarte una respuesta.</h1><p>No encontré una posibilidad suficientemente confiable para esto ahora. Podemos aclarar un poco más o dejarlo acá.</p><div className="button-row"><button className="primary" type="button" onClick={onClarify}>Aclarar un poco más</button><button className="ghost" type="button" onClick={onClose}>Dejarlo acá</button></div></> : <><p className="eyebrow">UNA POSIBILIDAD PARA AHORA</p><h1>{help?.title}</h1><p>{help?.summary}</p><div className="help-meta"><span>{help?.help_type}</span>{help?.duration_minutes && <span>{help.duration_minutes} min</span>}</div><div className="button-row"><button className="primary" type="button" onClick={onTry} disabled={busy}>Vivir esta posibilidad</button><button className="ghost" type="button" onClick={onClose}>Ahora no</button></div></>}</>}{stage === 'outcome' && <><p className="eyebrow">RETORNO</p><h1>¿Cómo fue para vos?</h1><p>No hace falta explicar demasiado. Sólo nos ayuda a saber si tuvo sentido en tu vida real.</p><div className="outcome-row"><button type="button" onClick={() => onOutcome('helped')}>Me ayudó</button><button type="button" onClick={() => onOutcome('unsure')}>No estoy segura</button><button type="button" onClick={() => onOutcome('not_helped')}>No me ayudó</button></div></>}{stage === 'closed' && <><p className="eyebrow">COSECHA</p><h1>Gracias. Con esto alcanza por ahora.</h1><p>{integrated ? 'Quedó en tu repertorio porque vos lo elegiste.' : 'Si querés, podés conservar esta posibilidad como algo a lo que volver.'}</p><div className="button-row">{!integrated && help && <button className="primary" type="button" onClick={onIntegrate} disabled={busy}>Guardar “{help.title}” en mi repertorio</button>}<button className="ghost" type="button" onClick={onClose}>Volver a mi vida</button></div></>}</div></section>
}

function TrajectoryCard({ trajectory, refresh }: { trajectory: Trajectory; refresh: () => Promise<void> }) {
  const [nextItem, setNextItem] = useState('')
  const [busy, setBusy] = useState(false)
  const toggle = async () => { setBusy(true); try { await updateTrajectory(trajectory.trajectory_id, trajectory.faro_text, trajectory.status === 'active' ? 'paused' : 'active'); await refresh() } finally { setBusy(false) } }
  const add = async (event: FormEvent) => { event.preventDefault(); if (!nextItem.trim()) return; setBusy(true); try { await addPathItem(trajectory.trajectory_id, null, nextItem.trim()); setNextItem(''); await refresh() } finally { setBusy(false) } }
  return <article><span className="path-dot"/><div><b>{trajectory.faro_text}</b><small>{trajectory.status === 'active' ? 'En camino' : trajectory.status === 'paused' ? 'En pausa' : 'Cerrado'}</small><p>{trajectory.path.length ? trajectory.path.map((item) => item.label).join(' · ') : 'Abierto a lo que la vida vaya mostrando.'}</p><div className="card-actions"><button className="ghost small" type="button" disabled={busy || trajectory.status === 'closed'} onClick={() => void toggle()}>{trajectory.status === 'active' ? 'Pausar' : 'Retomar'}</button></div><form className="inline-create" onSubmit={add}><input value={nextItem} onChange={(event) => setNextItem(event.target.value)} placeholder="Algo que quiero sostener en este camino..."/><button disabled={busy || !nextItem.trim()}>Agregar al camino</button></form></div></article>
}

function LifeView({ snapshot, proactivity, refresh }: { snapshot: ContinuitySnapshot | null; proactivity: ProactivitySnapshot | null; refresh: () => Promise<void> }) {
  const [newFaro, setNewFaro] = useState('')
  const [busy, setBusy] = useState(false)
  const [cultivation, setCultivation] = useState<{ help: HelpPossibility; episodeId: string; move: Exclude<CultivationMove, 'CONTINUE_PATH'> } | null>(null)
  const [status, setStatus] = useState('')
  const create = async (event: FormEvent) => { event.preventDefault(); if (!newFaro.trim()) return; setBusy(true); try { await createTrajectory(newFaro.trim()); setNewFaro(''); await refresh() } finally { setBusy(false) } }
  const cultivate = async (repertoireId: string, move: Exclude<CultivationMove, 'CONTINUE_PATH'>) => { setBusy(true); setStatus(''); try { const scene = await reuseRepertoire(repertoireId, move); setCultivation({ help: scene.help as HelpPossibility, episodeId: scene.episode_id, move }) } catch { setStatus('No pude abrir esta continuidad ahora. Podés volver a intentarlo cuando quieras.') } finally { setBusy(false) } }
  const closeCultivation = async () => { if (!cultivation) return; const signal = cultivation.move === 'REPEAT' ? 'REPEATED' : cultivation.move === 'VARY' ? 'VARIED' : cultivation.move === 'APPLY_IN_CONTEXT' ? 'APPLIED_OTHER_CONTEXT' : 'REUSED'; try { await recordLongitudinalSignal(cultivation.episodeId, signal); await refresh() } finally { setCultivation(null) } }
  if (cultivation) return <Experience help={cultivation.help} onExit={() => void closeCultivation()}/>
  const memory = snapshot?.memory_allowed ?? false
  return <section className="space-page life-view"><SpaceHero kicker="MI VIDA" title="Tu vida, aquí y ahora" text="Lo que está vivo, lo que elegiste cuidar y aquello que ya hiciste propio." image={IMG.calm}/><div className="space-content"><div className="life-columns"><section><p className="section-label">LO QUE ESTÁ VIVO HOY</p><h2>{snapshot?.trajectories?.[0]?.faro_text || 'Un lugar para reconocer dónde estás.'}</h2><p>El presente tiene prioridad. Tus caminos siguen disponibles sin convertirse en presión.</p></section><aside className="soft-control"><span>Memoria elegida por vos</span><button aria-label="Memoria" type="button" className={memory ? 'switch on' : 'switch'} onClick={async () => { await setMemory(!memory); await refresh() }}><i/></button></aside></div><div className="section-heading"><h2>Mis caminos</h2><p>Direcciones vivas, no programas.</p></div><div className="path-grid">{snapshot?.trajectories?.length ? snapshot.trajectories.map((trajectory) => <TrajectoryCard key={trajectory.trajectory_id} trajectory={trajectory} refresh={refresh}/>) : <article><span className="path-dot"/><div><b>Tu primer Faro puede nacer acá.</b><small>Elegido por vos</small><p>Una dirección que quieras cuidar sin convertirla en meta ni score.</p></div></article>}</div><form className="inline-create" onSubmit={create}><input value={newFaro} onChange={(event) => setNewFaro(event.target.value)} placeholder="Algo que quiero cuidar en mi vida..."/><button disabled={busy || !newFaro.trim()}>Abrir un camino</button></form><div className="section-heading"><h2>Mi repertorio</h2><p>Lo que ya reconociste como útil para volver a usar. Repetir, variar o aplicar son decisiones tuyas.</p></div><div className="repertoire-grid">{snapshot?.repertoire?.length ? snapshot.repertoire.map((item) => <article key={item.repertoire_id}><img src={IMG.practice} alt=""/><span><b>{item.title}</b><small>{item.times_reused ? `${item.times_reused} retornos` : 'Disponible para vos'}</small><p>{item.summary}</p><div className="card-actions"><button className="ghost small" type="button" disabled={busy} onClick={() => void cultivate(item.repertoire_id, 'REPEAT')}>Repetir</button><button className="ghost small" type="button" disabled={busy} onClick={() => void cultivate(item.repertoire_id, 'VARY')}>Variar</button><button className="ghost small" type="button" disabled={busy} onClick={() => void cultivate(item.repertoire_id, 'APPLY_IN_CONTEXT')}>Aplicar</button></div></span></article>) : <div className="empty-state">Todavía no hay nada en tu repertorio. LUMEN no lo llena por vos.</div>}</div>{status && <p className="status-message">{status}</p>}<div className="section-heading"><h2>Continuidad elegida</h2><p>LUMEN sólo vuelve si vos lo permitís.</p></div><aside className="soft-control"><span>Proactividad {proactivity?.proactive_allowed ? 'activada' : 'desactivada'}</span><button aria-label="Proactividad" type="button" className={proactivity?.proactive_allowed ? 'switch on' : 'switch'} onClick={async () => { await setProactivity(!(proactivity?.proactive_allowed ?? false)); await refresh() }}><i/></button></aside></div></section>
}

function SpaceHero({ kicker, title, text, image }: { kicker: string; title: string; text: string; image: string }) { return <header className="space-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(255,252,247,.98),rgba(255,252,247,.40)),url(${image})` }}><div><p>{kicker}</p><h1>{title}</h1><span>{text}</span></div></header> }
function SourceCard({ item, index, authenticated, onOpen, onSave }: { item: SourceItem; index: number; authenticated: boolean; onOpen: (item: SourceItem) => void; onSave: (item: SourceItem) => Promise<void> }) { return <article><img src={[IMG.calm, IMG.practice, IMG.journal, IMG.meeting, IMG.walk, IMG.sleep][index % 6]} alt=""/><div><p className="eyebrow">{item.help_type.replaceAll('_',' ')}</p><h3>{item.title}</h3><p>{item.summary}</p><div className="source-meta"><span>{item.provider?.name}</span>{item.duration_minutes && <span>{item.duration_minutes} min</span>}</div>{item.cultivation_roles?.length ? <div className="tiny-chips">{item.cultivation_roles.map((role) => <span key={role}>{ROLE_LABEL[role] || role}</span>)}</div> : null}<div className="card-actions"><button className="primary small" type="button" onClick={() => onOpen(item)}>Vivir esta posibilidad</button>{authenticated && <button className="ghost small" type="button" onClick={() => void onSave(item)}>Conservar para mí</button>}</div></div></article> }

function ExploreView({ source, taxonomy, authenticated, onOpen, onSave }: { source: SourceItem[]; taxonomy: SourceTaxonomy | null; authenticated: boolean; onOpen: (item: SourceItem) => void; onSave: (item: SourceItem) => Promise<void> }) {
  const [query, setQuery] = useState('')
  const [selectedCapacity, setSelectedCapacity] = useState<string | null>(null)
  const [constellation, setConstellation] = useState<SourceItem[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const filtered = useMemo(() => source.filter((item) => `${item.title} ${item.summary} ${(item.capacities || []).join(' ')}`.toLowerCase().includes(query.toLowerCase())).slice(0, 24), [source, query])
  const selectedLabel = taxonomy?.capacities?.find((term) => term.key === selectedCapacity)?.label || selectedCapacity
  const groups = useMemo(() => { const grouped = new Map<string, SourceItem[]>(); constellation.forEach((item) => { const role = item.cultivation_roles?.[0] || 'OTHER'; grouped.set(role, [...(grouped.get(role) || []), item]) }); return [...grouped.entries()] }, [constellation])
  const openCapacity = async (key: string) => { setSelectedCapacity(key); setLoading(true); setMessage(''); try { const items = await discoverConstellation(key, null, navigator.language || 'es-AR', 16); setConstellation(items); if (!items.length) setMessage('No encontré una constelación suficientemente diversa para esta capacidad ahora.') } catch { setConstellation([]); setMessage('No pude componer esta constelación ahora.') } finally { setLoading(false) } }
  return <section className="space-page explore-view"><SpaceHero kicker="EXPLORAR" title="Todo lo que puede ayudarte a vivir una vida más plena." text="Descubrimiento con criterio. Posibilidades distintas, una misma intención: ayudar a vivir." image={IMG.sunrise}/><div className="space-content"><div className="explore-toolbar"><div className="search-large"><Icon name="search"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por tema, capacidad o palabra..."/></div></div><div className="section-heading"><h2>Capacidades</h2><p>Son lentes para orientar posibilidades, no niveles ni scores sobre tu vida.</p></div><div className="faro-large-grid">{(taxonomy?.capacities || []).map((term, index) => <button key={term.key} className={selectedCapacity === term.key ? 'active' : ''} type="button" onClick={() => void openCapacity(term.key)}><span>{['◎','◌','♡','◍','◇','◉','◈','○','◐','✦'][index % 10]}</span><b>{term.label}</b><small>Componer constelación</small></button>)}</div>{selectedCapacity ? <><div className="section-heading"><h2>Constelación para {selectedLabel}</h2><p>Una composición dinámica de formas complementarias. No es un programa ni una secuencia obligatoria.</p></div>{loading && <div className="empty-state">Componiendo desde Fuente…</div>}{message && <div className="empty-state">{message}</div>}{groups.map(([role, items]) => <section key={role}><div className="section-heading"><h2>{ROLE_LABEL[role] || 'Otras maneras de acercarte'}</h2><p>{items.length} {items.length === 1 ? 'posibilidad' : 'posibilidades'} en esta función de cultivo.</p></div><div className="source-grid">{items.map((item, index) => <SourceCard key={item.help_id} item={item} index={index} authenticated={authenticated} onOpen={onOpen} onSave={onSave}/>)}</div></section>)}<button className="ghost" type="button" onClick={() => { setSelectedCapacity(null); setConstellation([]); setMessage('') }}>Volver a todas las posibilidades</button></> : <><div className="section-heading"><h2>Posibilidades</h2><p>Browse general de Fuente. Cada pieza conserva su naturaleza, origen y propósito.</p></div><div className="source-grid">{filtered.map((item, index) => <SourceCard key={item.help_id} item={item} index={index} authenticated={authenticated} onOpen={onOpen} onSave={onSave}/>)}</div></>}</div></section>
}

function SanctuaryView({ entries, refresh }: { entries: SanctuaryEntry[]; refresh: () => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [filter, setFilter] = useState<'all'|'treasure'|'reflection'|'note'>('all')
  const [busy, setBusy] = useState(false)
  const visible = filter === 'all' ? entries : entries.filter((entry) => entry.entry_kind === filter)
  const save = async (event: FormEvent) => { event.preventDefault(); if (!content.trim()) return; setBusy(true); try { await saveSanctuary('note', title.trim(), content.trim()); setTitle(''); setContent(''); await refresh() } finally { setBusy(false) } }
  const download = async () => { const data = await exportSanctuary(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'mi-santuario-lumen.json'; anchor.click(); URL.revokeObjectURL(url) }
  const filters: Array<[typeof filter, string]> = [['all','Todo'],['treasure','Tesoros'],['reflection','Reflexiones'],['note','Notas']]
  return <section className="space-page sanctuary-view"><SpaceHero kicker="SANTUARIO" title="Aquí vive lo que importa." text="Un espacio íntimo para conservar significado, no una carpeta de favoritos." image={IMG.journal}/><div className="space-content"><div className="sanctuary-toolbar"><div className="filter-chips">{filters.map(([key,label]) => <button key={key} className={filter === key ? 'active' : ''} type="button" onClick={() => setFilter(key)}>{label}</button>)}</div><button className="text-action" onClick={() => void download()} type="button"><Icon name="download"/>Exportar lo mío</button></div><div className="sanctuary-grid-large">{visible.length ? visible.map((entry, index) => <article key={entry.entry_id} className={index === 0 ? 'feature' : ''}><div className="entry-visual" style={{ backgroundImage: `linear-gradient(0deg,rgba(28,31,24,.50),rgba(28,31,24,.06)),url(${[IMG.calm, IMG.journal, IMG.meeting, IMG.walk][index % 4]})` }}/><div className="entry-copy"><small>{entry.entry_kind}</small><h3>{entry.title || 'Algo que elegiste conservar'}</h3><p>{entry.content}</p><button className="icon-action" type="button" onClick={async () => { await deleteSanctuary(entry.entry_id); await refresh() }} aria-label="Eliminar"><Icon name="trash"/></button></div></article>) : <article className="empty-sanctuary"><span className="orb small"/><h3>{entries.length ? 'No hay elementos de este tipo.' : 'Tu Santuario empieza cuando algo importa para vos.'}</h3><p>Nada entra sin tu decisión.</p></article>}</div><form className="sanctuary-compose" onSubmit={save}><p className="section-label">UNA NOTA PARA VOS</p><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título (opcional)"/><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Algo que quieras conservar..."/><button className="primary" disabled={busy || !content.trim()}>Conservar en mi Santuario</button></form></div></section>
}

function TissueSource({ items, onOpen }: { items: SourceItem[]; onOpen: (item: SourceItem) => void }) { return <div className="source-grid">{items.length ? items.map((item, index) => <SourceCard key={item.help_id} item={item} index={index} authenticated={false} onOpen={onOpen} onSave={async () => undefined}/>) : <div className="empty-state">No hay posibilidades activas de este tipo en Fuente ahora. LUMEN no inventa personas ni servicios.</div>}</div> }

function TissueView({ circles, source, refresh, onOpen }: { circles: Circle[]; source: SourceItem[]; refresh: () => Promise<void>; onOpen: (item: SourceItem) => void }) {
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [kind, setKind] = useState<TissueKind>('circles')
  const [busy, setBusy] = useState(false)
  const create = async (event: FormEvent) => { event.preventDefault(); if (!name.trim() || !purpose.trim()) return; setBusy(true); try { await createCircle(name.trim(), purpose.trim()); setName(''); setPurpose(''); await refresh() } finally { setBusy(false) } }
  const professional = source.filter((item) => item.help_type === 'professional_support')
  const institutions = source.filter((item) => item.help_type === 'institutional_service')
  const actions = source.filter((item) => ['human_action','conversation'].includes(item.help_type))
  const tabs: Array<[TissueKind,string]> = [['circles','Círculos'],['professionals','Apoyo profesional'],['institutions','Instituciones'],['actions','Acciones humanas']]
  return <section className="space-page tissue-view"><SpaceHero kicker="TEJIDO" title="La vida también se vive con otros." text="Personas, pares, profesionales, círculos e instituciones cuando la presencia humana tiene sentido." image={IMG.meeting}/><div className="space-content"><div className="filter-chips tissue-filters">{tabs.map(([key,label]) => <button key={key} className={kind === key ? 'active' : ''} type="button" onClick={() => setKind(key)}>{label}</button>)}</div>{kind === 'circles' && <><div className="section-heading"><h2>Mis círculos y encuentros</h2><p>Espacios reales con propósito. Sin feed, likes ni ranking.</p></div><div className="circle-large">{circles.map((circle, index) => <article key={circle.space_id}><img src={[IMG.meeting, IMG.journal, IMG.walk][index % 3]} alt=""/><div><h3>{circle.name}</h3><p>{circle.purpose}</p><small>{circle.member_count} vidas · {circle.role}</small></div></article>)}{!circles.length && <div className="empty-state">Todavía no participás de ningún círculo.</div>}</div><form className="circle-create" onSubmit={create}><div><p className="section-label">ABRIR UN CÍRCULO</p><h2>Crear un espacio con propósito.</h2><p>LUMEN sostiene los bordes; las personas ocupan el centro.</p></div><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre del círculo"/><input value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Para qué existe"/><button className="primary" disabled={busy || !name.trim() || !purpose.trim()}>Crear círculo</button></form></>}{kind === 'professionals' && <><div className="section-heading"><h2>Apoyo profesional</h2><p>Opciones activas y trazables desde Fuente.</p></div><TissueSource items={professional} onOpen={onOpen}/></>}{kind === 'institutions' && <><div className="section-heading"><h2>Instituciones y servicios</h2><p>Acceso, ayuda pública o institucional cuando corresponde.</p></div><TissueSource items={institutions} onOpen={onOpen}/></>}{kind === 'actions' && <><div className="section-heading"><h2>Acciones y conversaciones</h2><p>Formas de llevar la vida hacia otras vidas fuera de la pantalla.</p></div><TissueSource items={actions} onOpen={onOpen}/></>}</div></section>
}

function SearchView({ source, onOpen }: { source: SourceItem[]; onOpen: (item: SourceItem) => void }) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => { const q = query.trim().toLowerCase(); if (!q) return []; return source.filter((item) => `${item.title} ${item.summary} ${(item.areas || []).join(' ')} ${(item.capacities || []).join(' ')} ${item.provider?.name || ''}`.toLowerCase().includes(q)) }, [query, source])
  return <section className="space-page explore-view"><SpaceHero kicker="BUSCAR" title="Encontrar sin perderte en un catálogo." text="Buscá en la Fuente activa por tema, capacidad, procedencia o palabra." image={IMG.sunrise}/><div className="space-content"><div className="search-large"><Icon name="search"/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="¿Qué estás buscando?"/></div>{query.trim() ? <><div className="section-heading"><h2>{results.length} resultados</h2><p>La búsqueda no modifica tu vida ni tu memoria.</p></div><TissueSource items={results} onOpen={onOpen}/></> : <div className="empty-state">Escribí algo para buscar en Fuente.</div>}</div></section>
}

function NotificationsView({ proactivity, refresh }: { proactivity: ProactivitySnapshot | null; refresh: () => Promise<void> }) {
  const followups = proactivity?.followups || []
  return <section className="space-page life-view"><SpaceHero kicker="NOTIFICACIONES" title="Continuidad sin perseguirte." text="Sólo aparecen retornos con razón y consentimiento." image={IMG.calm}/><div className="space-content"><div className="life-columns"><section><p className="section-label">PROACTIVIDAD</p><h2>{proactivity?.proactive_allowed ? 'Está activada por vos.' : 'Está desactivada.'}</h2><p>No se agenda nada sólo porque estuviste inactiva.</p></section><aside className="soft-control"><span>{proactivity?.proactive_allowed ? 'Permitida' : 'No permitida'}</span><button aria-label="Proactividad" type="button" className={proactivity?.proactive_allowed ? 'switch on' : 'switch'} onClick={async () => { await setProactivity(!(proactivity?.proactive_allowed ?? false)); await refresh() }}><i/></button></aside></div><div className="section-heading"><h2>Retornos acordados</h2><p>Podés cancelarlos en cualquier momento.</p></div><div className="path-grid">{followups.map((item) => <article key={item.followup_id}><span className="path-dot"/><div><b>{item.reason_code.replaceAll('_',' ')}</b><small>{new Date(item.due_at).toLocaleString()}</small><p>{item.cultivation_move ? `Movimiento: ${item.cultivation_move}` : 'Continuidad elegida'}</p><button className="ghost small" type="button" onClick={async () => { await cancelFollowup(item.followup_id); await refresh() }}>Cancelar</button></div></article>)}{!followups.length && <div className="empty-state">No hay retornos pendientes.</div>}</div></div></section>
}

function SettingsView({ snapshot, proactivity, refresh }: { snapshot: ContinuitySnapshot | null; proactivity: ProactivitySnapshot | null; refresh: () => Promise<void> }) {
  return <section className="space-page sanctuary-view"><SpaceHero kicker="AJUSTES" title="Tu soberanía también se configura." text="Memoria y proactividad permanecen bajo tu control." image={IMG.journal}/><div className="space-content"><div className="life-columns"><section><p className="section-label">MEMORIA</p><h2>Recordar sólo con permiso.</h2><p>Podés apagar la memoria elegida sin perder tu derecho a seguir usando LUMEN.</p></section><aside className="soft-control"><span>{snapshot?.memory_allowed ? 'Activada' : 'Desactivada'}</span><button aria-label="Memoria" type="button" className={snapshot?.memory_allowed ? 'switch on' : 'switch'} onClick={async () => { await setMemory(!(snapshot?.memory_allowed ?? false)); await refresh() }}><i/></button></aside></div><div className="life-columns"><section><p className="section-label">PROACTIVIDAD</p><h2>Volver sólo cuando lo elegís.</h2><p>Ningún contacto por engagement. Los retornos necesitan razón y consentimiento.</p></section><aside className="soft-control"><span>{proactivity?.proactive_allowed ? 'Activada' : 'Desactivada'}</span><button aria-label="Proactividad" type="button" className={proactivity?.proactive_allowed ? 'switch on' : 'switch'} onClick={async () => { await setProactivity(!(proactivity?.proactive_allowed ?? false)); await refresh() }}><i/></button></aside></div></div></section>
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
  const [proactivity, setProactivitySnapshot] = useState<ProactivitySnapshot | null>(null)
  const [source, setSource] = useState<SourceItem[]>([])
  const [featuredConstellation, setFeaturedConstellation] = useState<SourceItem[]>([])
  const [taxonomy, setTaxonomy] = useState<SourceTaxonomy | null>(null)
  const [entries, setEntries] = useState<SanctuaryEntry[]>([])
  const [circles, setCircles] = useState<Circle[]>([])

  const refreshPrivate = useCallback(async () => {
    if (!authenticated) { setSnapshot(null); setProactivitySnapshot(null); setEntries([]); setCircles([]); return }
    const [nextSnapshot, nextEntries, nextCircles, nextProactivity] = await Promise.all([getContinuitySnapshot(), listSanctuary(), getTissueSnapshot(), getProactivitySnapshot()])
    setSnapshot(nextSnapshot); setEntries(nextEntries); setCircles(nextCircles); setProactivitySnapshot(nextProactivity)
  }, [authenticated])

  const refreshSource = useCallback(async () => { const items = await discoverSource(null, null, null, navigator.language || 'es-AR', 100); setSource(items) }, [])

  useEffect(() => { let live = true; void getAuthSnapshot().then(async (auth) => { if (!live) return; const yes = Boolean(auth.session); setAuthenticated(yes); if (yes) await bootstrapPerson(); setAuthReady(true) }).catch(() => setAuthReady(true)); return () => { live = false } }, [])
  useEffect(() => { void Promise.all([refreshSource(), getSourceTaxonomy().then(setTaxonomy).catch(() => null)]) }, [refreshSource])
  useEffect(() => { if (!taxonomy?.capacities?.length) return; const target = taxonomy.capacities.find((term) => term.key === 'regulation') || taxonomy.capacities[0]; void discoverConstellation(target.key, null, navigator.language || 'es-AR', 12).then(setFeaturedConstellation).catch(() => setFeaturedConstellation([])) }, [taxonomy])
  useEffect(() => { if (authReady) void refreshPrivate() }, [authReady, authenticated, refreshPrivate])

  const go = (next: Space) => { setSourceExperience(null); setSpace(next); setStage('idle'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const runMoment = async () => { if (!expression.trim()) return; if (!authenticated) { setStage('auth'); return } setBusy(true); try { const nextScene = await accompanyMoment(expression.trim(), navigator.language || 'es-AR', (navigator.language || 'es').split('-')[0]); setScene(nextScene); setHelp(primaryHelpFromScene(nextScene)); setStage('scene') } finally { setBusy(false) } }
  const chooseHelp = async () => { if (!scene?.episode_id || !help) return; setBusy(true); try { await selectHelp(scene.episode_id, help.help_id, 'selected'); setStage('experience') } finally { setBusy(false) } }
  const outcome = async (effect: 'helped'|'not_helped'|'unsure') => { if (!scene?.episode_id) return; setBusy(true); try { await recordOutcome(scene.episode_id, effect); setStage('closed') } finally { setBusy(false) } }
  const integrate = async () => { if (!help) return; setBusy(true); try { await integrateHelp(help.help_id); setIntegrated(true); await refreshPrivate() } finally { setBusy(false) } }
  const logout = async () => { await signOut(); setAuthenticated(false); setSnapshot(null); setProactivitySnapshot(null); setEntries([]); setCircles([]); setSpace('home'); setStage('idle'); setIntegrated(false) }
  const saveFromSource = async (item: SourceItem) => { await saveSanctuary('treasure', item.title, item.summary, item.help_id); await refreshPrivate() }
  const closeMoment = () => { setStage('idle'); setExpression(''); setScene(null); setHelp(null); setIntegrated(false) }
  const clarifyMoment = () => { setStage('idle'); setScene(null); setHelp(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const privateName = space === 'life' ? 'Mi Vida' : space === 'sanctuary' ? 'Santuario' : space === 'tissue' ? 'Tejido' : space === 'notifications' ? 'Notificaciones' : 'Ajustes'
  const needsAuth = ['life','sanctuary','tissue','notifications','settings'].includes(space)

  const content = sourceExperience ? <Experience help={sourceExperience} onExit={() => setSourceExperience(null)}/> : <>
    {space === 'home' && stage === 'idle' && <><HomeHero expression={expression} setExpression={setExpression} submit={() => void runMoment()} busy={busy} go={go} authenticated={authenticated}/><HomePreviews go={go} snapshot={snapshot} source={source} taxonomy={taxonomy} constellation={featuredConstellation} entries={entries} circles={circles}/><StartWays go={go} setExpression={(value) => { setExpression(value); window.scrollTo({ top: 0, behavior: 'smooth' }) }}/><footer>CONOCIMIENTO · EXPERIENCIA · PERSONAS · VIDA REAL<br/><span>CIRCULANDO JUNTAS PARA UN MUNDO CON MÁS VIDAS PLENAS</span></footer></>}
    {space === 'home' && stage === 'auth' && <PrivateGate name="Tu continuidad" email={email} setEmail={setEmail} goHome={() => setStage('idle')} goExplore={() => { setStage('idle'); setSpace('explore') }}/>} 
    {space === 'home' && stage !== 'idle' && stage !== 'auth' && <MomentFlow stage={stage} scene={scene} help={help} busy={busy} onTry={() => void chooseHelp()} onExperienceExit={() => setStage('outcome')} onOutcome={(effect) => void outcome(effect)} onIntegrate={() => void integrate()} onClose={closeMoment} onClarify={clarifyMoment} integrated={integrated}/>} 
    {space === 'explore' && <ExploreView source={source} taxonomy={taxonomy} authenticated={authenticated} onOpen={setSourceExperience} onSave={saveFromSource}/>} 
    {space === 'search' && <SearchView source={source} onOpen={setSourceExperience}/>} 
    {space === 'life' && authenticated && <LifeView snapshot={snapshot} proactivity={proactivity} refresh={refreshPrivate}/>} 
    {space === 'sanctuary' && authenticated && <SanctuaryView entries={entries} refresh={refreshPrivate}/>} 
    {space === 'tissue' && authenticated && <TissueView circles={circles} source={source} refresh={refreshPrivate} onOpen={setSourceExperience}/>} 
    {space === 'notifications' && authenticated && <NotificationsView proactivity={proactivity} refresh={refreshPrivate}/>} 
    {space === 'settings' && authenticated && <SettingsView snapshot={snapshot} proactivity={proactivity} refresh={refreshPrivate}/>} 
    {needsAuth && !authenticated && <PrivateGate name={privateName} email={email} setEmail={setEmail} goHome={() => setSpace('home')} goExplore={() => setSpace('explore')}/>}
  </>

  return <div className="app-shell"><Sidebar active={space} go={go} authenticated={authenticated} onSignOut={() => void logout()}/><main className="main-field">{content}</main></div>
}
