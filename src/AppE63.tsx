import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './experience-field.css'
import { ExperienceSurface, PossibilityPreview } from './ExperienceField'
import { getAuthSnapshot, requestMagicLink, signOut } from './greenfield/application/auth'
import { bootstrapPerson } from './greenfield/application/consent'
import { deleteMomentOriginals, exportMomentOriginals } from './greenfield/application/privacy'
import {
  addPathItem,
  cancelFollowup,
  createCircle,
  createCircleInvite,
  createTrajectory,
  deleteSanctuary,
  discoverConstellation,
  discoverSource,
  exportSanctuary,
  getContinuitySnapshot,
  getEmbryoHealth,
  getProactivitySnapshot,
  getSourceTaxonomy,
  getTissueSnapshot,
  integrateHelp,
  joinCircle,
  leaveCircle,
  listSanctuary,
  recordLongitudinalSignal,
  reportCircle,
  reuseRepertoire,
  saveSanctuary,
  scheduleCultivationFollowup,
  scheduleFollowup,
  setMemory,
  setProactivity,
  shareHelp,
  updateSanctuary,
  updateTrajectory,
  type Circle,
  type ContinuitySnapshot,
  type CultivationMove,
  type CultivationScene,
  type EmbryoHealth,
  type LongitudinalSignal,
  type ProactivitySnapshot,
  type SanctuaryEntry,
  type SourceItem,
  type SourceTaxonomy,
} from './greenfield/application/embryo'
import {
  accompanyMoment,
  primaryHelpFromScene,
  recordOutcome,
  selectHelp,
  type HelpPossibility,
  type OutcomeEffect,
  type S1Scene,
} from './greenfield/application/s1'

type Space = 'now' | 'source' | 'territory' | 'sanctuary' | 'tissue'
type Stage = 'home' | 'auth' | 'scene' | 'experience' | 'outcome' | 'closed'

function languageContext() {
  const locale = navigator.language || 'es-AR'
  return { locale, language: locale.split('-')[0] || 'es' }
}

function downloadJson(payload: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function semanticCopy(scene: S1Scene): string {
  if (scene.scene_id === 'moment.clarify') return 'No estoy seguro de haber entendido bien. Contame un poco más sólo si cambia lo que necesitás ahora.'
  if (scene.scene_id === 'moment.no_match') return 'Para esto no tengo algo suficientemente pertinente. Prefiero decírtelo antes que acercarte una ayuda floja.'
  if (scene.scene_id === 'moment.safety_referral') return 'Esto merece apoyo humano inmediato. LUMEN no debería intentar resolverlo solo desde acá.'
  if (scene.continuity?.own_repertoire_reused) return 'Esto ya había tenido valor para vos. Antes de sumar algo nuevo, quizá alcance con volver a algo que ya es parte de tu repertorio.'
  return 'Con lo que entendí hasta ahora, esto podría ayudarte. Si no te representa, no hace falta forzarlo.'
}

function FieldChrome({ authenticated, onHome, onSignOut }: { authenticated: boolean; onHome: () => void; onSignOut: () => void }) {
  return <header className="field-chrome"><button className="field-brand" type="button" onClick={onHome}>LUMEN</button><span /><button className="field-auth" type="button" onClick={authenticated ? onSignOut : onHome}>{authenticated ? 'salir' : 'presencia'}</button></header>
}

function MovementLinks({ go }: { go: (space: Space) => void }) {
  return <div className="entry-links" aria-label="Moverme por LUMEN"><button type="button" onClick={() => go('source')}>explorar Fuente</button><button type="button" onClick={() => go('territory')}>mi cielo</button><button type="button" onClick={() => go('tissue')}>Tejido</button></div>
}

function PremiumNav({ space, go }: { space: Space; go: (space: Space) => void }) {
  const items: Array<{ id: Space; label: string; icon: 'home' | 'compass' | 'sprout' | 'people' | 'book' }> = [
    { id: 'now', label: 'Inicio', icon: 'home' },
    { id: 'source', label: 'Explorar', icon: 'compass' },
    { id: 'territory', label: 'Mi proceso', icon: 'sprout' },
    { id: 'tissue', label: 'Tejido', icon: 'people' },
    { id: 'sanctuary', label: 'Santuario', icon: 'book' },
  ]
  const icon = (name: typeof items[number]['icon']) => {
    if (name === 'home') return <svg viewBox="0 0 24 24" aria-hidden="true"><path className="nav-fill" d="M4 10.5 12 4l8 6.5v8.2a1.3 1.3 0 0 1-1.3 1.3H5.3A1.3 1.3 0 0 1 4 18.7Z"/><path d="M9.5 20v-6h5v6"/></svg>
    if (name === 'compass') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path className="nav-fill" d="m14.7 9.3-2 5.4-3.4-3.4 5.4-2Z"/></svg>
    if (name === 'sprout') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V9"/><path className="nav-fill" d="M12 11C8 11 5.5 8.8 5.2 5.2 9 5.4 11.4 7.2 12 11Z"/><path className="nav-fill" d="M12 13c4 0 6.5-2.2 6.8-5.8-3.8.2-6.2 2-6.8 5.8Z"/></svg>
    if (name === 'people') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.3"/><path d="M3.5 19c.5-3.4 2.5-5.2 5.5-5.2s5 1.8 5.5 5.2"/><path d="M14.8 14.6c2.9-.3 4.9 1.2 5.7 4.4"/></svg>
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path className="nav-fill" d="M4 5.2c3.1-.8 5.8-.2 8 1.7v13c-2.2-1.9-4.9-2.5-8-1.7Z"/><path className="nav-fill" d="M20 5.2c-3.1-.8-5.8-.2-8 1.7v13c2.2-1.9 4.9-2.5 8-1.7Z"/></svg>
  }
  return <nav className="premium-nav" aria-label="Navegación principal de LUMEN">{items.map((item) => <button key={item.id} type="button" className={space === item.id ? 'active' : ''} onClick={() => go(item.id)}>{icon(item.icon)}<span>{item.label}</span></button>)}</nav>
}

function PrivateGate({ name, go }: { name: string; go: (space: Space) => void }) {
  return <section className="field-scene narrow"><div className="presence-orb small" aria-hidden="true"/><p className="field-eyebrow">{name} · espacio personal</p><h1>Necesito saber que sos vos.</h1><p className="field-copy">Este espacio puede contener memoria, vínculos o continuidad. LUMEN no mezcla vidas.</p><button className="field-primary" type="button" onClick={() => go('now')}>Volver a Ahora para entrar</button></section>
}

function SourceField({ authenticated, go }: { authenticated: boolean; go: (space: Space) => void }) {
  const [items, setItems] = useState<SourceItem[]>([])
  const [taxonomy, setTaxonomy] = useState<SourceTaxonomy | null>(null)
  const [health, setHealth] = useState<EmbryoHealth | null>(null)
  const [area, setArea] = useState('')
  const [capacity, setCapacity] = useState('')
  const [type, setType] = useState('')
  const [selected, setSelected] = useState<SourceItem | null>(null)
  const [memoryAllowed, setMemoryAllowed] = useState(false)
  const [saved, setSaved] = useState<Set<string>>(() => new Set())
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setBusy(true)
    const locale = navigator.language || 'es-AR'
    const sourcePromise = capacity && !type ? discoverConstellation(capacity, area || null, locale, 40) : discoverSource(area || null, capacity || null, type || null, locale, 40)
    Promise.all([sourcePromise, getSourceTaxonomy(), getEmbryoHealth(), authenticated ? getContinuitySnapshot() : Promise.resolve(null)])
      .then(([nextItems, nextTaxonomy, nextHealth, continuity]) => {
        if (cancelled) return
        setItems(nextItems); setTaxonomy(nextTaxonomy); setHealth(nextHealth); setMemoryAllowed(Boolean(continuity?.memory_allowed))
      })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'No pude abrir Fuente.') })
      .finally(() => { if (!cancelled) setBusy(false) })
    return () => { cancelled = true }
  }, [area, capacity, type, authenticated])

  const save = async (item: SourceItem) => {
    if (!authenticated) { go('now'); return }
    setBusy(true); setError(''); setMessage('')
    try {
      if (!memoryAllowed) { await setMemory(true); setMemoryAllowed(true) }
      await saveSanctuary('treasure', item.title, item.summary, item.help_id)
      setSaved((current) => new Set(current).add(item.help_id))
      setMessage(`Guardé “${item.title}” en tu Santuario. No entra automáticamente en tu Repertorio.`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pude guardarlo.') }
    finally { setBusy(false) }
  }

  return <>
    <section className="field-scene">
      <div className="source-intro"><div><p className="field-eyebrow">FUENTE · reservorio vivo</p><h1>Sabiduría en muchas formas.</h1><p className="field-copy">No es un catálogo para consumir. Es un reservorio que puede abrir perspectivas, prácticas, obras, personas, lugares, acciones, ayuda concreta o quietud.</p></div><div className="source-controls"><label>Área<select value={area} onChange={(event) => setArea(event.target.value)}><option value="">todas</option>{taxonomy?.areas.map((term) => <option key={term.key} value={term.key}>{term.label}</option>)}</select></label><label>Capacidad<select value={capacity} onChange={(event) => { setCapacity(event.target.value); setType('') }}><option value="">todas</option>{taxonomy?.capacities.map((term) => <option key={term.key} value={term.key}>{term.label}</option>)}</select></label><label>Forma<select value={type} onChange={(event) => setType(event.target.value)}><option value="">todas</option>{taxonomy?.help_types?.map((term) => <option key={term.key} value={term.key}>{term.label}</option>)}</select></label></div></div>
      {capacity && !type && <p className="constellation-note">Estás viendo una constelación abierta: distintas maneras de acercarte a esta capacidad. No hay orden obligatorio ni programa.</p>}
      {health && <p className="source-state">{health.source.active_possibilities} posibilidades activas · {health.source.semantic_types} formas semánticas · cobertura honesta y todavía limitada.</p>}
      {message && <p className="success-field">{message}</p>}{error && <p className="error-field" role="alert">{error}</p>}{busy && <p className="muted">Abriendo lo que puede tener sentido…</p>}
      <div className="possibility-grid">{items.map((item) => <div key={item.help_id} style={{gridColumn:'span 6'}}><PossibilityPreview help={item} onOpen={() => setSelected(item)} /><div style={{display:'flex',justifyContent:'flex-end'}}><button className="field-link" type="button" disabled={busy || saved.has(item.help_id)} onClick={() => void save(item)}>{saved.has(item.help_id) ? 'guardado' : authenticated ? 'guardar para volver' : 'entrar para guardar'}</button></div></div>)}</div>
      {!busy && items.length === 0 && <p className="muted">No encontré algo suficientemente pertinente con esta combinación. Fuente conserva NO_MATCH.</p>}
      <MovementLinks go={go}/>
    </section>
    {selected && <ExperienceSurface help={selected} onExit={() => setSelected(null)} />}
  </>
}

function TerritoryField({ go }: { go: (space: Space) => void }) {
  const [snapshot, setSnapshot] = useState<ContinuitySnapshot | null>(null)
  const [proactivity, setProactivitySnapshot] = useState<ProactivitySnapshot | null>(null)
  const [faro, setFaro] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [cultivation, setCultivation] = useState<CultivationScene | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const refresh = async () => {
    const [continuity, proactive] = await Promise.all([getContinuitySnapshot(), getProactivitySnapshot()])
    setSnapshot(continuity); setProactivitySnapshot(proactive)
  }
  useEffect(() => { setBusy(true); refresh().catch((cause) => setError(cause instanceof Error ? cause.message : 'No pude abrir tu cielo.')).finally(() => setBusy(false)) }, [])
  const act = async (operation: () => Promise<unknown>) => { setBusy(true); setError(''); try { await operation(); await refresh() } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pude guardar ese gesto.') } finally { setBusy(false) } }
  const createFaro = (event: FormEvent) => { event.preventDefault(); if (!faro.trim()) return; void act(async () => { await createTrajectory(faro.trim()); setFaro('') }) }
  const cultivate = async (repertoireId: string, move: Exclude<CultivationMove,'CONTINUE_PATH'>) => { setBusy(true); setError(''); setMessage(''); try { const next = await reuseRepertoire(repertoireId, move); setCultivation(next); setFeedbackOpen(false) } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pude volver a esa experiencia.') } finally { setBusy(false) } }
  const signal = async (kind: LongitudinalSignal) => { if (!cultivation) return; setBusy(true); try { const result = await recordLongitudinalSignal(cultivation.episode_id, kind); setMessage(result.decision_kind === 'WITHDRAW' ? 'Entendido. LUMI se corre un poco más: no hace falta sumar novedad.' : 'Lo tomo como una señal contextual, no como una etiqueta sobre vos.'); setCultivation(null); setFeedbackOpen(false); await refresh() } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pude guardar esa señal.') } finally { setBusy(false) } }
  const active = snapshot?.trajectories.find((item) => item.status === 'active') ?? null

  return <>
    <section className="field-scene"><div className="territory-layout"><aside className="territory-side"><p className="field-eyebrow">MI CIELO · territorio propio</p><h1>Dirección sin convertir la vida en un plan.</h1><p className="field-copy">Faros, Camino, Repertorio y pausas. Nada de streaks, niveles ni deuda.</p><form className="stack" onSubmit={createFaro}><input className="field-input" value={faro} onChange={(event) => setFaro(event.target.value)} maxLength={280} placeholder="Un Faro que hoy te importe…"/><button className="field-primary" disabled={busy || !faro.trim()} type="submit">Encender un Faro</button></form>{error && <p className="error-field">{error}</p>}{message && <p className="success-field">{message}</p>}</aside><div><div className="sky">{snapshot?.trajectories.length ? snapshot.trajectories.map((trajectory) => <article className="faro" key={trajectory.trajectory_id}><p className="field-eyebrow">FARO · {trajectory.status}</p><h3>{trajectory.faro_text}</h3><div className="path-line">{trajectory.path.length ? trajectory.path.map((item) => <span key={item.path_item_id}>{item.label}</span>) : <span>camino abierto</span>}</div><div className="panel-actions"><button className="field-link" type="button" onClick={() => void act(() => updateTrajectory(trajectory.trajectory_id, trajectory.faro_text, trajectory.status === 'paused' ? 'active' : 'paused'))}>{trajectory.status === 'paused' ? 'retomar' : 'pausar'}</button></div></article>) : <p className="muted">No hace falta tener un Faro. Este cielo también puede quedar abierto.</p>}</div><h2 className="section-title">Repertorio propio</h2><div className="repertoire-grid">{snapshot?.repertoire.map((item) => <article className="repertoire-item" key={item.repertoire_id}><strong>{item.title}</strong><span>{item.summary}</span><span>{item.times_reused ? `volviste ${item.times_reused} vez${item.times_reused === 1 ? '' : 'es'}` : 'todavía no necesitaste volver'}</span><div className="repertoire-actions"><button type="button" disabled={busy} onClick={() => void cultivate(item.repertoire_id,'REUSE_REPERTOIRE')}>volver</button><button type="button" disabled={busy} onClick={() => void cultivate(item.repertoire_id,'VARY')}>variar</button><button type="button" disabled={busy} onClick={() => void cultivate(item.repertoire_id,'APPLY_IN_CONTEXT')}>llevar a otra situación</button>{active && <button type="button" disabled={busy} onClick={() => void act(() => addPathItem(active.trajectory_id,item.help_id,item.title))}>sumar al Camino</button>}</div></article>)}{!snapshot?.repertoire.length && <p className="muted">Nada entra acá automáticamente. Repertorio empieza cuando reconocés algo como propio o utilizable.</p>}</div><h2 className="section-title">Continuidad consentida</h2><div className="field-panel"><p>{proactivity?.proactive_allowed ? 'LUMEN puede volver por razones acordadas.' : 'LUMEN no te llama de vuelta.'}</p><div className="panel-actions"><button className="field-ghost" type="button" disabled={busy || proactivity?.settings.custody_blocked} onClick={() => void act(() => setProactivity(!proactivity?.proactive_allowed))}>{proactivity?.proactive_allowed ? 'apagar continuidad' : 'permitir continuidad'}</button>{proactivity?.proactive_allowed && <button className="field-link" type="button" onClick={() => void act(() => scheduleFollowup('self_chosen',new Date(Date.now()+86400000).toISOString(),active?.trajectory_id ?? null,null))}>recordarme volver mañana</button>}</div>{proactivity?.followups.map((followup) => <div className="path-line" key={followup.followup_id}><span>{new Date(followup.due_at).toLocaleString()}</span><button className="field-link" type="button" onClick={() => void act(() => cancelFollowup(followup.followup_id))}>cancelar</button></div>)}</div></div></div><MovementLinks go={go}/></section>
    {cultivation && !feedbackOpen && <ExperienceSurface help={cultivation.help} onExit={() => setFeedbackOpen(true)} />}
    {cultivation && feedbackOpen && <section className="experience-fullscreen"><div className="practice-field"><p className="field-eyebrow">VOLVER · CULTIVAR · HACER PROPIO</p><h1>¿Qué pasó al volver?</h1><p className="field-copy">No estamos midiendo progreso. Sólo diferenciando qué clase de experiencia ocurrió.</p><div className="outcome-actions"><button onClick={() => void signal('REUSED')}>volvió a servir</button><button onClick={() => void signal('ADAPTED')}>lo adapté</button><button onClick={() => void signal('RECOGNIZED_AS_OWN')}>ya es bastante mío</button><button onClick={() => void signal('NO_REMINDER_NEEDED')}>ya no necesito recordatorio</button><button onClick={() => void signal('STOPPED_HELPING')}>dejó de servirme</button></div></div></section>}
  </>
}

function SanctuaryField({ go }: { go: (space: Space) => void }) {
  const [entries, setEntries] = useState<SanctuaryEntry[]>([])
  const [snapshot, setSnapshot] = useState<ContinuitySnapshot | null>(null)
  const [title,setTitle] = useState(''); const [content,setContent] = useState(''); const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [message,setMessage] = useState('')
  const refresh = async () => { const [c,e] = await Promise.all([getContinuitySnapshot(),listSanctuary()]); setSnapshot(c); setEntries(e) }
  useEffect(() => { setBusy(true); refresh().catch((cause)=>setError(cause instanceof Error?cause.message:'No pude abrir Santuario.')).finally(()=>setBusy(false)) },[])
  const act = async (operation:()=>Promise<unknown>) => { setBusy(true); setError(''); try{await operation();await refresh()}catch(cause){setError(cause instanceof Error?cause.message:'No pude completar ese gesto.')}finally{setBusy(false)} }
  const save = (event:FormEvent)=>{event.preventDefault();if(!content.trim())return;void act(async()=>{await saveSanctuary('reflection',title.trim(),content.trim());setTitle('');setContent('')})}
  const exportAll=async()=>{setBusy(true);try{downloadJson(await exportSanctuary(),`lumen-santuario-${new Date().toISOString().slice(0,10)}.json`)}finally{setBusy(false)}}
  const exportOriginals=async()=>{setBusy(true);try{downloadJson(await exportMomentOriginals(),`lumen-momentos-${new Date().toISOString().slice(0,10)}.json`);setMessage('Preparé una copia de tus expresiones originales.')}finally{setBusy(false)}}
  const deleteOriginals=async()=>{if(!window.confirm('¿Borrar definitivamente tus expresiones originales?'))return;setBusy(true);try{const result=await deleteMomentOriginals();setMessage(`Borradas ${result.deleted_count} expresiones originales.`)}finally{setBusy(false)}}
  return <section className="field-scene"><p className="field-eyebrow">SANTUARIO · intimidad soberana</p><h1>Lo que es tuyo sigue siendo tuyo.</h1><p className="field-copy">Guardar, corregir, exportar o borrar. La memoria no es una excusa para vigilarte.</p><div className="field-panel"><p>{snapshot?.memory_allowed?'Guardar está permitido.':'Guardar está apagado.'}</p><div className="panel-actions"><button className="field-ghost" onClick={()=>void act(()=>setMemory(!snapshot?.memory_allowed))}>{snapshot?.memory_allowed?'dejar de guardar':'permitir guardar'}</button><button className="field-link" onClick={()=>void exportAll()}>exportar Santuario</button><button className="field-link" onClick={()=>void exportOriginals()}>exportar expresiones originales</button><button className="field-link" onClick={()=>void deleteOriginals()}>borrar expresiones originales</button></div></div>{snapshot?.memory_allowed&&<form className="field-panel stack" onSubmit={save} style={{marginTop:16}}><input className="field-input" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Título opcional"/><textarea className="field-input" value={content} onChange={(e)=>setContent(e.target.value)} rows={5} placeholder="Algo que quieras conservar…"/><button className="field-primary" disabled={busy||!content.trim()}>guardar</button></form>}{message&&<p className="success-field">{message}</p>}{error&&<p className="error-field">{error}</p>}<div className="two-col" style={{marginTop:24}}>{entries.map((entry)=><article className="sanctuary-card" key={entry.entry_id}><p className="field-eyebrow">{entry.entry_kind}</p><h3>{entry.title||'Sin título'}</h3><p>{entry.content}</p><div className="panel-actions"><button className="field-link" onClick={()=>{const next=window.prompt('Editar',entry.content);if(next!==null&&next.trim())void act(()=>updateSanctuary(entry.entry_id,entry.title||'',next.trim()))}}>editar</button><button className="field-link" onClick={()=>void act(()=>deleteSanctuary(entry.entry_id))}>borrar</button></div></article>)}</div><MovementLinks go={go}/></section>
}

function TissueField({ go }: { go:(space:Space)=>void }) {
  const [circles,setCircles]=useState<Circle[]>([]);const[source,setSource]=useState<SourceItem[]>([]);const[name,setName]=useState('');const[purpose,setPurpose]=useState('');const[invite,setInvite]=useState('');const[lastInvite,setLastInvite]=useState('');const[share,setShare]=useState<Record<string,string>>({});const[busy,setBusy]=useState(false);const[error,setError]=useState('')
  const refresh=async()=>{const[c,s]=await Promise.all([getTissueSnapshot(),discoverSource(null,null,null,navigator.language||'es-AR',20)]);setCircles(c);setSource(s)}
  useEffect(()=>{setBusy(true);refresh().catch((cause)=>setError(cause instanceof Error?cause.message:'No pude abrir Tejido.')).finally(()=>setBusy(false))},[])
  const act=async(operation:()=>Promise<unknown>)=>{setBusy(true);setError('');try{await operation();await refresh()}catch(cause){setError(cause instanceof Error?cause.message:'No pude completar ese gesto.')}finally{setBusy(false)}}
  const create=(e:FormEvent)=>{e.preventDefault();if(!name.trim()||!purpose.trim())return;void act(async()=>{await createCircle(name.trim(),purpose.trim());setName('');setPurpose('')})}
  const join=(e:FormEvent)=>{e.preventDefault();if(!invite.trim())return;void act(async()=>{await joinCircle(invite.trim());setInvite('')})}
  return <section className="field-scene"><p className="field-eyebrow">TEJIDO · vida acompañando vida</p><h1>Cuando otra persona es mejor ayuda.</h1><p className="field-copy">Sin feed público, likes, seguidores ni ranking. El Embrión empieza con vínculos deliberados y Círculos privados.</p><div className="two-col"><form className="field-panel stack" onSubmit={create}><h3>Crear un Círculo</h3><input className="field-input" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Nombre"/><input className="field-input" value={purpose} onChange={(e)=>setPurpose(e.target.value)} placeholder="Para qué existe"/><button className="field-primary" disabled={busy||!name.trim()||!purpose.trim()}>crear</button></form><form className="field-panel stack" onSubmit={join}><h3>Entrar por invitación</h3><input className="field-input" value={invite} onChange={(e)=>setInvite(e.target.value)} placeholder="Código privado"/><button className="field-ghost" disabled={busy||!invite.trim()}>entrar</button></form></div>{lastInvite&&<p className="success-field">Invitación privada: {lastInvite}</p>}{error&&<p className="error-field">{error}</p>}<div className="tissue-grid" style={{marginTop:24}}>{circles.map((circle)=><article className="circle" key={circle.space_id}><p className="field-eyebrow">CÍRCULO · {circle.role} · {circle.member_count}</p><h3>{circle.name}</h3><p>{circle.purpose}</p>{circle.role==='host'&&<button className="field-link" onClick={()=>void act(async()=>{const result=await createCircleInvite(circle.space_id);setLastInvite(result.invite_token)})}>crear invitación</button>}<div className="panel-actions"><select className="field-input" value={share[circle.space_id]||''} onChange={(e)=>setShare((current)=>({...current,[circle.space_id]:e.target.value}))}><option value="">algo de Fuente…</option>{source.map((item)=><option key={item.help_id} value={item.help_id}>{item.title}</option>)}</select><button className="field-ghost" disabled={!share[circle.space_id]||busy} onClick={()=>void act(()=>shareHelp(circle.space_id,share[circle.space_id]))}>hacer circular</button></div>{circle.contributions.map((contribution)=><div className="contribution" key={contribution.contribution_id}><strong>{contribution.title}</strong><p>{contribution.summary}</p><small>{contribution.from_me?'compartido por vos':'compartido por otra vida'}</small></div>)}<div className="panel-actions"><button className="field-link" onClick={()=>void act(()=>reportCircle(circle.space_id,'boundary'))}>marcar un límite</button><button className="field-link" onClick={()=>void act(()=>leaveCircle(circle.space_id))}>salir</button></div></article>)}</div><MovementLinks go={go}/></section>
}

export default function AppE63() {
  const [authenticated,setAuthenticated]=useState(false);const[authChecked,setAuthChecked]=useState(false);const[space,setSpace]=useState<Space>('now');const[stage,setStage]=useState<Stage>('home');const[expression,setExpression]=useState('');const[clarification,setClarification]=useState('');const[email,setEmail]=useState('');const[magicLinkSent,setMagicLinkSent]=useState(false);const[scene,setScene]=useState<S1Scene|null>(null);const[selectedHelp,setSelectedHelp]=useState<HelpPossibility|null>(null);const[lastOutcome,setLastOutcome]=useState<OutcomeEffect|null>(null);const[integrated,setIntegrated]=useState(false);const[busy,setBusy]=useState(false);const[error,setError]=useState('');const[closing,setClosing]=useState('')
  useEffect(()=>{getAuthSnapshot().then(async({user})=>{setAuthenticated(Boolean(user));if(user)await bootstrapPerson()}).catch(()=>setAuthenticated(false)).finally(()=>setAuthChecked(true))},[])
  const primaryHelp=useMemo(()=>scene?primaryHelpFromScene(scene):null,[scene])
  const go=(next:Space)=>{setSpace(next);setError('');if(next==='now'&&stage==='closed')resetHome()}
  const resetHome=(message='')=>{setScene(null);setSelectedHelp(null);setLastOutcome(null);setIntegrated(false);setClarification('');setExpression('');setError('');setClosing(message);setMagicLinkSent(false);setStage(message?'closed':'home')}
  const submitMoment=async(value:string)=>{const clean=value.trim();if(!clean)return;if(!authenticated){setStage('auth');return}setBusy(true);setError('');try{const{locale,language}=languageContext();const next=await accompanyMoment(clean,locale,language);setScene(next);setStage('scene')}catch(cause){setError(cause instanceof Error?cause.message:'No pude continuar este encuentro.')}finally{setBusy(false)}}
  const sendMagic=async(e:FormEvent)=>{e.preventDefault();setBusy(true);try{await requestMagicLink(email,window.location.origin);setMagicLinkSent(true)}catch(cause){setError(cause instanceof Error?cause.message:'No pude enviar el acceso.')}finally{setBusy(false)}}
  const choose=async(action:'selected'|'rejected')=>{if(!scene?.episode_id||!primaryHelp?.help_id)return;setBusy(true);try{const result=await selectHelp(scene.episode_id,primaryHelp.help_id,action);if(action==='selected'){setSelectedHelp(result.help);setStage('experience')}else resetHome('Está bien. No hace falta insistir con una propuesta que no te representa.')}catch(cause){setError(cause instanceof Error?cause.message:'No pude registrar tu elección.')}finally{setBusy(false)}}
  const finish=async(effect:OutcomeEffect)=>{if(!scene?.episode_id||!selectedHelp)return;setBusy(true);try{const result=await recordOutcome(scene.episode_id,effect);setLastOutcome(effect);if(result.signal_kind==='REUSED'){setIntegrated(true);setClosing('Volvió a ayudarte. No hace falta agregar algo nuevo.')}else setClosing('Con esto alcanza por ahora.');setStage('closed')}catch(cause){setError(cause instanceof Error?cause.message:'No pude registrar el retorno.')}finally{setBusy(false)}}
  const integrate=async()=>{if(!selectedHelp?.help_id)return;setBusy(true);try{await integrateHelp(selectedHelp.help_id);setIntegrated(true)}catch(cause){setError(cause instanceof Error?cause.message:'No pude integrarlo a tu repertorio.')}finally{setBusy(false)}}
  const logout=async()=>{setBusy(true);try{await signOut();setAuthenticated(false);setSpace('now');resetHome()}finally{setBusy(false)}}

  return <main className="lumen-field"><FieldChrome authenticated={authChecked&&authenticated} onHome={()=>go('now')} onSignOut={()=>void logout()}/>
    {space==='source'&&<SourceField authenticated={authenticated} go={go}/>} {space==='territory'&&(authenticated?<TerritoryField go={go}/>:<PrivateGate name="Mi cielo" go={go}/>)} {space==='sanctuary'&&(authenticated?<SanctuaryField go={go}/>:<PrivateGate name="Santuario" go={go}/>)} {space==='tissue'&&(authenticated?<TissueField go={go}/>:<PrivateGate name="Tejido" go={go}/>)}
    {space==='now'&&<section className={`field-scene narrow now-scene now-${stage}`} aria-live="polite"><div className="presence-orb" aria-hidden="true"/>
      {(stage==='home'||stage==='auth')&&<><p className="field-eyebrow">LUMI · presencia</p><h1>Estoy acá.</h1><p className="field-copy">Podés contarme lo que está pasando, como te salga. No hace falta elegir una categoría.</p><form className="moment-box" onSubmit={(e)=>{e.preventDefault();void submitMoment(expression)}}><textarea value={expression} onChange={(e)=>setExpression(e.target.value)} maxLength={4000} disabled={busy||stage==='auth'} placeholder="Lo que te está pasando…"/><div className="moment-actions">{stage==='home'&&<button className="field-primary" disabled={busy||!expression.trim()}>ver qué podría ayudar</button>}</div></form>{stage==='home'&&<><MovementLinks go={go}/><p className="privacy-soft">Tu expresión original se conserva en privado para que LUMEN pueda reinterpretarla mejor cuando aprenda. No se copia al Ledger ni se usa como aprendizaje compartido por defecto.</p></>}{stage==='auth'&&<div className="field-panel auth-panel"><h2>Antes de seguir</h2><p>Para sostener este encuentro sin mezclar vidas, necesito que entres con un correo. Si preferís no hacerlo, Fuente sigue abierta sin identificarte.</p>{magicLinkSent?<p className="success-field">Te envié un enlace de acceso.</p>:<form onSubmit={sendMagic}><input className="field-input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required placeholder="tu correo"/><button className="field-primary" disabled={busy}>enviarme un enlace</button><button className="field-ghost" type="button" onClick={()=>{resetHome();setSpace('source')}}>ahora no · explorar Fuente</button></form>}</div>}</>}
      {stage==='scene'&&scene&&<><p className="field-eyebrow">LUMI · {scene.presence_mode}</p><h1>{scene.scene_id==='moment.help'?(primaryHelp?.from_own_repertoire?'Tal vez no haga falta algo nuevo.':'Quizá podamos empezar por acá.'):scene.scene_id==='moment.clarify'?'Quiero entender un poco mejor.':'Prefiero ser claro con esto.'}</h1><p className="field-copy">{semanticCopy(scene)}</p>{scene.scene_id==='moment.help'&&primaryHelp&&<div style={{width:'min(560px,100%)'}}><PossibilityPreview help={primaryHelp} onOpen={()=>void choose('selected')}/><div className="panel-actions"><button className="field-primary" disabled={busy} onClick={()=>void choose('selected')}>{primaryHelp.from_own_repertoire?'volver a esto':'quiero vivirlo'}</button><button className="field-ghost" disabled={busy} onClick={()=>void choose('rejected')}>no es esto</button></div></div>}{scene.scene_id==='moment.clarify'&&<form className="moment-box" onSubmit={(e)=>{e.preventDefault();const extra=clarification.trim();if(extra)void submitMoment(`${expression.trim()}\n${extra}`)}}><textarea value={clarification} onChange={(e)=>setClarification(e.target.value)} placeholder="Sólo algo que cambie la ayuda…"/><div className="moment-actions"><button className="field-primary" disabled={busy||!clarification.trim()}>contarte un poco más</button><button className="field-ghost" type="button" onClick={()=>resetHome()}>cerrar</button></div></form>}{scene.scene_id==='moment.no_match'&&<div className="panel-actions"><button className="field-primary" onClick={()=>resetHome()}>contarlo de otra manera</button><button className="field-ghost" onClick={()=>resetHome('Con esto alcanza por ahora.')}>cerrar</button></div>}{scene.scene_id==='moment.safety_referral'&&<div className="safety-panel"><p>Buscá ahora a una persona de confianza, un profesional o un servicio de emergencia de tu zona. Si hay peligro inmediato, priorizá la ayuda humana presencial.</p><button className="field-primary" onClick={()=>resetHome('Ojalá puedas acercarte a alguien ahora. LUMEN queda acá, sin reemplazar esa ayuda.')}>entendido</button></div>}</>}
      {stage==='outcome'&&selectedHelp&&<div className="outcome-field"><p className="field-eyebrow">VOLVER</p><h1>¿Te ayudó algo de esto?</h1><p className="field-copy">Una señal breve alcanza. Missing sigue siendo missing; no hace falta responder.</p><div className="outcome-actions"><button disabled={busy} onClick={()=>void finish('helped')}>sí, un poco</button><button disabled={busy} onClick={()=>void finish('not_helped')}>no era para mí</button><button disabled={busy} onClick={()=>void finish('unsure')}>no sé todavía</button></div></div>}
      {stage==='closed'&&<div className="outcome-field"><p className="field-eyebrow">LUMI · integrar o soltar</p><h1>{closing}</h1><p className="field-copy">Podés volver a tu vida. Si algo merece continuidad, sólo vos decidís qué conservar.</p>{lastOutcome==='helped'&&selectedHelp&&!integrated&&<button className="field-ghost" disabled={busy} onClick={()=>void integrate()}>hacerlo parte de mi Repertorio</button>}{integrated&&<p className="success-field">Quedó en tu Repertorio. LUMEN puede devolvértelo antes de sumar novedad.</p>}<MovementLinks go={go}/><button className="field-primary" onClick={()=>resetHome()}>volver a Ahora</button></div>}
      {error&&<p className="error-field" role="alert">{error}</p>}</section>}
    {stage==='experience'&&selectedHelp&&<ExperienceSurface help={selectedHelp} onExit={()=>setStage('outcome')}/>}
    <PremiumNav space={space} go={go}/>
  </main>
}
