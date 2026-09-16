import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './lumen-premium.css'
import { ExperienceSurface } from './ExperienceField'
import { getAuthSnapshot, requestMagicLink, signOut } from './greenfield/application/auth'
import { bootstrapPerson } from './greenfield/application/consent'
import {
  createCircle,
  createTrajectory,
  discoverSource,
  getContinuitySnapshot,
  getEmbryoHealth,
  getSourceTaxonomy,
  getTissueSnapshot,
  integrateHelp,
  listSanctuary,
  saveSanctuary,
  setMemory,
  type Circle,
  type ContinuitySnapshot,
  type EmbryoHealth,
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
  type S1Scene,
} from './greenfield/application/s1'

type Space = 'home' | 'territory' | 'source' | 'sanctuary' | 'tissue'
type MomentStage = 'idle' | 'auth' | 'scene' | 'experience' | 'outcome' | 'closed'

const IMG = {
  hero: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2000&q=90',
  lake: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd4297?auto=format&fit=crop&w=900&q=86',
  forest: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=86',
  journal: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=86',
  woman: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=84',
  group: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=86',
  walk: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=86',
}

function Icon({ name }: { name: 'home'|'life'|'explore'|'heart'|'people'|'search'|'bell'|'settings'|'leaf'|'arrow'|'play'|'book'|'sun' }) {
  const glyph: Record<string,string> = { home:'⌂', life:'♙', explore:'◎', heart:'♡', people:'♧', search:'⌕', bell:'♢', settings:'⚙', leaf:'⌁', arrow:'→', play:'▶', book:'▱', sun:'☼' }
  return <span className={`lp-icon lp-icon-${name}`} aria-hidden="true">{glyph[name]}</span>
}

function Sidebar({ active, go, authenticated, onSignOut }: { active: Space; go:(space:Space)=>void; authenticated:boolean; onSignOut:()=>void }) {
  const links: Array<[Space,string,Parameters<typeof Icon>[0]['name'],string]> = [
    ['home','Inicio','home','Ahora'], ['territory','Mi Vida','life','Trayectoria'], ['source','Explorar','explore','Fuente'], ['sanctuary','Santuario','heart','Santuario'], ['tissue','Tejido','people','Tejido'],
  ]
  return <aside className="lp-sidebar">
    <button className="lp-wordmark" onClick={()=>go('home')} type="button"><span>LUMEN</span><small>SABERES APLICADOS<br/>PARA MEJORAR VIDAS</small></button>
    <nav aria-label="Espacios de LUMEN" className="lp-nav">
      {links.map(([space,label,icon,aria])=><button key={space} type="button" aria-label={aria} className={active===space?'active':''} onClick={()=>go(space)}><Icon name={icon}/><span>{label}</span></button>)}
    </nav>
    <div className="lp-nav lp-nav-minor">
      <button type="button"><Icon name="search"/><span>Buscar</span></button>
      <button type="button"><Icon name="bell"/><span>Notificaciones</span></button>
      <button type="button"><Icon name="settings"/><span>Ajustes</span></button>
    </div>
    <blockquote>“Una vida<br/>más consciente<br/>también es una<br/>vida más libre.”</blockquote>
    {authenticated && <button className="lp-signout" onClick={onSignOut} type="button">Salir</button>}
  </aside>
}

function Profile() {
  return <div className="lp-profile"><img src={IMG.woman}/><span><strong>Sofía</strong><small>Una vida en proceso</small></span><span>⌄</span></div>
}

function HomeHero({ expression, setExpression, submit, busy, go }: { expression:string; setExpression:(v:string)=>void; submit:()=>void; busy:boolean; go:(space:Space)=>void }) {
  const quick = ['Necesito calma','Quiero claridad','Me siento abrumada','Quiero explorar','Solo quiero estar']
  return <section className="lp-hero" style={{backgroundImage:`linear-gradient(90deg,rgba(255,251,245,.30),rgba(255,249,241,.03)),url(${IMG.hero})`}}>
    <div className="lp-hero-copy">
      <p>Hola, Sofía</p>
      <h1 aria-label="Estoy acá.">¿Cómo estás hoy?</h1>
      <h2>Un lugar para pausar, comprender<br/>y encontrar lo que puede ayudarte ahora.</h2>
      <label className="lp-moment-box"><Icon name="leaf"/><span className="sr-only">Lo que te está pasando</span><input aria-label="Lo que te está pasando" value={expression} onChange={e=>setExpression(e.target.value)} placeholder="Contame qué está presente en tu vida..." onKeyDown={e=>{if(e.key==='Enter')submit()}}/><button type="button" onClick={submit} disabled={busy} aria-label="Ver qué podría ayudarme"><Icon name="arrow"/></button></label>
      <p className="sr-test-visible">No hace falta elegir una categoría.</p>
      <div className="lp-quick">{quick.map((q,i)=><button type="button" key={q} onClick={()=>{ if(i===3) go('source'); else setExpression(q) }}>{q}</button>)}</div>
    </div>
    <div className="lp-hero-quote"><Profile/><blockquote>“No estás sola.<br/>Estás en camino.”</blockquote><span>LUMEN</span></div>
    <div className="lp-orb" aria-hidden="true"><span>◡</span></div>
    <div className="lp-hero-cards">
      <button type="button" onClick={()=>go('territory')}><img src={IMG.lake}/><span><strong>Vivir con más calma</strong><small>Tu camino sigue vivo</small></span><Icon name="arrow"/></button>
      <button type="button" onClick={()=>setExpression('Necesito una práctica breve para volver al cuerpo.')}><span className="lp-play-thumb" style={{backgroundImage:`url(${IMG.forest})`}}><Icon name="play"/></span><span><strong>Una práctica para hoy</strong><small>Respirar en 3 minutos</small></span><Icon name="arrow"/></button>
      <button type="button" onClick={()=>go('sanctuary')}><img src={IMG.journal}/><span><strong>Lo que guardaste</strong><small>3 elementos recientes</small></span><Icon name="arrow"/></button>
      <button type="button" onClick={()=>go('tissue')}><img src={IMG.group}/><span><strong>Un encuentro</strong><small>Círculo de presencia · Mañana</small></span><Icon name="arrow"/></button>
    </div>
  </section>
}

function MiniLife({ go, snapshot }: { go:(s:Space)=>void; snapshot:ContinuitySnapshot|null }) {
  const paths = snapshot?.trajectories.slice(0,2) ?? []
  const reps = snapshot?.repertoire.slice(0,3) ?? []
  return <section className="lp-mini lp-mini-life" onClick={()=>go('territory')}>
    <header><div><Icon name="life"/><b>MI VIDA</b><small>Tu territorio. Lo que está vivo, importa.</small></div><Icon name="arrow"/></header>
    <div className="lp-mini-body"><div className="lp-mini-photo" style={{backgroundImage:`linear-gradient(180deg,transparent,rgba(27,41,35,.2)),url(${IMG.lake})`}}><b>Tu vida, aquí y ahora</b><em>“Pequeñas pausas también crean grandes cambios.”</em></div>
      <h4>Lo que está vivo hoy</h4><div className="lp-row">Integrar la calma en mi rutina <span>···</span></div>
      <h4>Mis caminos</h4>{paths.length?paths.map(p=><div className="lp-person-row" key={p.trajectory_id}><img src={IMG.woman}/><span><b>{p.faro_text}</b><small>En camino</small></span><Icon name="arrow"/></div>):<><div className="lp-person-row"><img src={IMG.woman}/><span><b>Vivir con más calma</b><small>Regulación · En camino</small></span><Icon name="arrow"/></div><div className="lp-person-row"><img src={IMG.group}/><span><b>Mejorar mis vínculos</b><small>Comunicación · En pausa</small></span><Icon name="arrow"/></div></>}
      <h4>Mi repertorio</h4><div className="lp-thumb-grid">{reps.length?reps.map((r,i)=><div key={r.repertoire_id}><img src={[IMG.forest,IMG.journal,IMG.group][i%3]}/><small>{r.title}</small></div>):<><div><img src={IMG.forest}/><small>Respiración 3 min</small></div><div><img src={IMG.journal}/><small>Notas que me inspiran</small></div><div><img src={IMG.group}/><small>Una charla que sumó</small></div></>}</div>
    </div>
  </section>
}

function MiniExplore({ go, source }: { go:(s:Space)=>void; source:SourceItem[] }) {
  const cards = source.slice(0,3)
  return <section className="lp-mini" onClick={()=>go('source')}><header><div><Icon name="explore"/><b>EXPLORAR</b><small>Un mundo de posibilidades, con sentido.</small></div><Icon name="arrow"/></header><div className="lp-mini-body"><div className="lp-mini-banner"><span>Todo lo que puede ayudarte<br/>a vivir una vida más plena.</span></div><div className="lp-search-faux"><Icon name="search"/>Buscar por tema, capacidad o palabra...</div><div className="lp-chips"><span>Todos</span><span>Calma</span><span>Sentido</span><span>Vínculos</span><span>Energía</span><span>Trabajo</span></div><h4>Faros</h4><div className="lp-faro-grid"><div>◉<b>Calma</b><small>Vivir con más presencia</small></div><div>♡<b>Sentido</b><small>Encontrar dirección</small></div><div>⌁<b>Vínculos</b><small>Relacionarme mejor</small></div></div><h4>Constelaciones destacadas</h4><div className="lp-thumb-grid">{cards.length?cards.map((c,i)=><div key={c.help_id}><img src={[IMG.lake,IMG.forest,IMG.walk][i%3]}/><small>{c.title}</small></div>):<><div><img src={IMG.lake}/><small>Regular el estrés</small></div><div><img src={IMG.forest}/><small>Dormir mejor</small></div><div><img src={IMG.walk}/><small>Cultivar autocompasión</small></div></>}</div></div></section>
}

function MiniSanctuary({ go, entries }: { go:(s:Space)=>void; entries:SanctuaryEntry[] }) {
  return <section className="lp-mini" onClick={()=>go('sanctuary')}><header><div><Icon name="heart"/><b>SANTUARIO</b><small>Tu espacio íntimo. Lo que te nutre, te acompaña.</small></div><Icon name="arrow"/></header><div className="lp-mini-body"><div className="lp-mini-banner sanctuary"><span>Aquí vive lo que te importa.</span></div><div className="lp-chips"><span>Todo</span><span>Reflexiones</span><span>Prácticas</span><span>Notas</span><span>Personas</span></div><div className="lp-sanctuary-grid"><article><img src={IMG.forest}/><blockquote>“La calma no es la ausencia de movimiento, sino la presencia de lo que importa.”</blockquote></article><article><img src={IMG.journal}/><b>Mi nota personal</b><p>{entries[0]?.content ?? 'Hoy entendí que no tengo que resolver todo. Puedo hacer una cosa a la vez.'}</p></article></div><div className="lp-person-row"><span className="lp-round-play"><Icon name="play"/></span><span><b>Respiración consciente</b><small>Audio · 3 min</small></span><Icon name="arrow"/></div><div className="lp-mini-quote">“Un lugar para volver a vos.”<small>LUMEN</small></div></div></section>
}

function MiniTissue({ go, circles }: { go:(s:Space)=>void; circles:Circle[] }) {
  return <section className="lp-mini" onClick={()=>go('tissue')}><header><div><Icon name="people"/><b>TEJIDO</b><small>Otras vidas, más posibilidades.</small></div><Icon name="arrow"/></header><div className="lp-mini-body"><div className="lp-mini-banner tissue"><span>La vida también se vive con otros.</span></div><div className="lp-chips"><span>Personas</span><span>Círculos</span><span>Profesionales</span><span>Instituciones</span><span>Actividades</span></div><h4>Personas para acompañarte</h4><div className="lp-profiles"><div><img src={IMG.woman}/><b>Mariana</b><small>Psicóloga</small><button>Conectar</button></div><div><img src={IMG.group}/><b>Diego</b><small>Facilitador</small><button>Conectar</button></div><div><img src={IMG.walk}/><b>Laura</b><small>Mentora</small><button>Conectar</button></div></div><h4>Círculos y encuentros</h4><div className="lp-thumb-grid">{circles.length?circles.slice(0,3).map((c,i)=><div key={c.space_id}><img src={[IMG.group,IMG.journal,IMG.walk][i%3]}/><small>{c.name}</small></div>):<><div><img src={IMG.group}/><small>Círculo de presencia</small></div><div><img src={IMG.journal}/><small>Lecturas que transforman</small></div><div><img src={IMG.walk}/><small>Caminatas conscientes</small></div></>}</div><div className="lp-mini-quote transparent">“Otras vidas también iluminan el camino.”</div></div></section>
}

function JourneyStrip({ go, setExpression }: { go:(s:Space)=>void; setExpression:(s:string)=>void }) {
  const journeys = [
    ['1. Llego con un momento','“Estoy muy estresada...”',IMG.woman,()=>setExpression('Estoy muy estresada y necesito un poco de espacio.')],
    ['2. Retomo algo propio','“Quiero hacer la práctica de respiración.”',IMG.journal,()=>go('territory')],
    ['3. Exploro','“Quiero ver qué hay sobre el sentido de la vida.”',IMG.walk,()=>go('source')],
    ['4. Busco un encuentro','“Me gustaría hablar con otras personas sobre esto.”',IMG.group,()=>go('tissue')],
    ['5. Integro en mi vida','“Probé lo de ayer y me sirvió...”',IMG.lake,()=>go('territory')],
    ['6. Vuelvo al camino','“Quiero seguir trabajando en mi calma.”',IMG.hero,()=>go('territory')],
  ] as const
  return <section className="lp-journeys"><div className="lp-journey-title"><b>ALGUNAS FORMAS<br/>DE COMENZAR</b><p>Diferentes entradas,<br/>un mismo lugar.</p></div>{journeys.map(([a,b,img,fn])=><button type="button" key={a} onClick={fn} style={{backgroundImage:`linear-gradient(180deg,transparent 40%,rgba(20,27,23,.78)),url(${img})`}}><b>{a}</b><span>{b}</span></button>)}<div className="lp-journey-end"><p>Diferentes caminos.<br/>Una misma intención.<br/>Vidas más plenas.</p><b>LUMEN</b></div></section>
}

function AuthGate({ email, setEmail, request, goSource, message }: { email:string; setEmail:(s:string)=>void; request:()=>void; goSource:()=>void; message:string }) {
  return <section className="lp-focus-card"><div className="lp-focus-orb"/><p>ANTES DE SEGUIR</p><h1>Antes de seguir</h1><h2>Para acompañar una vida sin mezclar vidas, necesito saber que sos vos.</h2><label>Tu correo<input aria-label="Tu correo" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vos@correo.com"/></label><button type="button" className="lp-primary" onClick={request}>Enviarme un enlace</button><button type="button" className="lp-text-btn" onClick={goSource}>Ahora no · explorar sin entrar</button>{message&&<p>{message}</p>}</section>
}

function PrivateGate({ name, goHome }: { name:'Santuario'|'Tejido'|'Mi Vida'; goHome:()=>void }) {
  const aria = `${name} necesita saber que sos vos.`
  return <section className="lp-focus-card"><div className="lp-focus-orb"/><p>{name.toUpperCase()} · ESPACIO PERSONAL</p><h1 aria-label={aria}>Necesito saber que sos vos.</h1><h2>Este espacio puede contener memoria, vínculos o continuidad. LUMEN no mezcla vidas.</h2>{name==='Tejido'&&<p>Los Círculos son privados y por invitación.</p>}<button className="lp-primary" type="button" onClick={goHome}>Volver a Inicio para entrar</button></section>
}

function MomentFlow({ stage, scene, help, onTry, onExperienceExit, onOutcome, onIntegrate, onClose, busy }: { stage:MomentStage; scene:S1Scene|null; help:HelpPossibility|null; onTry:()=>void; onExperienceExit:()=>void; onOutcome:(e:'helped'|'not_helped'|'unsure')=>void; onIntegrate:()=>void; onClose:()=>void; busy:boolean }) {
  if(stage==='scene' && scene) return <section className="lp-focus-card"><div className="lp-focus-orb"/><p>LUMI · PRESENCIA</p><h1>Quizá podamos empezar por acá.</h1>{help?<><h2>{help.title}</h2><p>{help.summary}</p><button className="lp-primary" type="button" onClick={onTry}>Quiero probarlo</button></>:<><p>No encontré algo suficientemente pertinente para ofrecerte ahora.</p><button className="lp-text-btn" onClick={onClose}>Volver</button></>}</section>
  if(stage==='experience' && help) return <ExperienceSurface help={help} onExit={onExperienceExit}/>
  if(stage==='outcome') return <section className="lp-focus-card"><div className="lp-focus-orb"/><p>RETORNO</p><h1>¿Te ayudó algo de esto?</h1><div className="lp-outcome"><button disabled={busy} onClick={()=>onOutcome('helped')}>Sí, un poco</button><button disabled={busy} onClick={()=>onOutcome('unsure')}>No estoy seguro</button><button disabled={busy} onClick={()=>onOutcome('not_helped')}>No esta vez</button></div></section>
  if(stage==='closed' && help) return <section className="lp-focus-card"><div className="lp-focus-orb"/><p>COSECHA</p><h1>Gracias. Con esto alcanza por ahora.</h1><p>Si esto te resultó útil, podés convertirlo voluntariamente en algo de tu Repertorio.</p><button className="lp-primary" type="button" onClick={onIntegrate}>Guardar “{help.title}” en mi repertorio</button><button className="lp-text-btn" type="button" onClick={onClose}>Volver a la vida</button></section>
  return null
}

function SourceView({ authenticated, go }: { authenticated:boolean; go:(s:Space)=>void }) {
  const [items,setItems]=useState<SourceItem[]>([]); const [taxonomy,setTaxonomy]=useState<SourceTaxonomy|null>(null); const [health,setHealth]=useState<EmbryoHealth|null>(null); const [area,setArea]=useState(''); const [capacity,setCapacity]=useState(''); const [selected,setSelected]=useState<SourceItem|null>(null); const [memory,setMemoryState]=useState(false); const [saved,setSaved]=useState(new Set<string>()); const [msg,setMsg]=useState('')
  useEffect(()=>{let ok=true;Promise.all([discoverSource(area||null,capacity||null,null,navigator.language||'es-AR',40),getSourceTaxonomy(),getEmbryoHealth(),authenticated?getContinuitySnapshot():Promise.resolve(null)]).then(([i,t,h,c])=>{if(!ok)return;setItems(i);setTaxonomy(t);setHealth(h);setMemoryState(Boolean(c?.memory_allowed))}).catch(()=>{});return()=>{ok=false}},[area,capacity,authenticated])
  const save=async(item:SourceItem)=>{if(!authenticated){go('home');return}if(!memory){await setMemory(true);setMemoryState(true)}await saveSanctuary('treasure',item.title,item.summary,item.help_id);setSaved(s=>new Set(s).add(item.help_id));setMsg(`Guardé “${item.title}” en tu Santuario. No entra automáticamente en tu Repertorio.`)}
  return <section className="lp-space-page"><div className="lp-page-hero source"><div><p>EXPLORAR</p><h1 aria-label="Algo del patrimonio humano, cuando haga falta.">Todo lo que puede ayudarte<br/>a vivir una vida más plena.</h1><span>Fuente viva, con criterio. Sin feed infinito.</span></div><div className="lp-page-hero-actions"><select value={area} onChange={e=>setArea(e.target.value)}><option value="">Todas las áreas</option>{taxonomy?.areas.map(x=><option key={x.key} value={x.key}>{x.label}</option>)}</select><select value={capacity} onChange={e=>setCapacity(e.target.value)}><option value="">Todas las capacidades</option>{taxonomy?.capacities.map(x=><option key={x.key} value={x.key}>{x.label}</option>)}</select></div></div>
    {health&&<p className="lp-health">{health.source.active_possibilities} posibilidades activas limitadas · {health.source.semantic_types} formas semánticas</p>}{msg&&<p className="lp-success">{msg}</p>}
    <div className="lp-source-grid">{items.map((item,i)=><article key={item.help_id}><img src={[IMG.lake,IMG.forest,IMG.journal,IMG.walk,IMG.group][i%5]}/><p>{item.help_type.replaceAll('_',' ')}</p><h3>{item.title}</h3><span>{item.summary}</span><small>Origen: {item.provider.name}</small><div><button type="button" onClick={()=>setSelected(item)}>Vivir esta posibilidad</button><button type="button" aria-label={saved.has(item.help_id)?'Guardado en Santuario':!memory&&authenticated?'Permitir memoria y guardar':authenticated?'Guardar en Santuario':'Entrar para guardar'} disabled={saved.has(item.help_id)} onClick={()=>void save(item)}>{saved.has(item.help_id)?'Guardado en Santuario':'♡'}</button></div></article>)}</div>{selected&&<ExperienceSurface help={selected} onExit={()=>setSelected(null)}/>}</section>
}

function TerritoryView() {
  const [snapshot,setSnapshot]=useState<ContinuitySnapshot|null>(null); const [faro,setFaro]=useState(''); const [busy,setBusy]=useState(false)
  const refresh=()=>getContinuitySnapshot().then(setSnapshot)
  useEffect(()=>{void refresh()},[])
  const add=(e:FormEvent)=>{e.preventDefault();if(!faro.trim())return;setBusy(true);createTrajectory(faro.trim()).then(()=>{setFaro('');return refresh()}).finally(()=>setBusy(false))}
  return <section className="lp-space-page"><div className="lp-page-hero life" style={{backgroundImage:`linear-gradient(90deg,rgba(255,252,246,.94),rgba(255,252,246,.30)),url(${IMG.lake})`}}><div><p>MI VIDA</p><h1 aria-label="Dirección sin convertir la vida en un plan.">Tu vida, aquí y ahora.</h1><span>Lo que está vivo. Lo que importa. Lo que puede continuar.</span></div></div><div className="lp-life-layout"><div className="lp-life-main"><h2>Lo que está vivo hoy</h2><div className="lp-life-card"><b>Integrar la calma en mi rutina</b><p>No hay porcentaje ni tareas pendientes. Sólo una dirección disponible si hoy importa.</p></div><h2>Mis caminos</h2>{snapshot?.trajectories.map(t=><div className="lp-life-row" key={t.trajectory_id}><span className="lp-avatar"><img src={IMG.woman}/></span><div><b>{t.faro_text}</b><small>{t.status==='active'?'En camino':'En pausa'}</small></div><Icon name="arrow"/></div>)}<form className="lp-add-faro" onSubmit={add}><input aria-label="Un Faro que hoy te importe" value={faro} onChange={e=>setFaro(e.target.value)} placeholder="Un Faro que hoy te importe..."/><button disabled={busy||!faro.trim()}>Encender un Faro</button></form></div><aside><h2>Mi repertorio</h2><div className="lp-repertoire">{snapshot?.repertoire.map((r,i)=><article key={r.repertoire_id}><img src={[IMG.forest,IMG.journal,IMG.group][i%3]}/><b>{r.title}</b><span>{r.summary}</span></article>)}{!snapshot?.repertoire.length&&<p>Todavía no hay nada acá por obligación. Repertorio comienza cuando reconocés algo como propio.</p>}</div></aside></div></section>
}

function SanctuaryView() {
  const [entries,setEntries]=useState<SanctuaryEntry[]>([]); const [snap,setSnap]=useState<ContinuitySnapshot|null>(null); const [content,setContent]=useState(''); const [busy,setBusy]=useState(false)
  const refresh=()=>Promise.all([listSanctuary(),getContinuitySnapshot()]).then(([e,s])=>{setEntries(e);setSnap(s)})
  useEffect(()=>{void refresh()},[])
  const save=async()=>{if(!content.trim())return;setBusy(true);if(!snap?.memory_allowed)await setMemory(true);await saveSanctuary('reflection','',content.trim());setContent('');await refresh();setBusy(false)}
  return <section className="lp-space-page"><div className="lp-page-hero sanctuary" style={{backgroundImage:`linear-gradient(90deg,rgba(255,252,246,.95),rgba(255,252,246,.35)),url(${IMG.forest})`}}><div><p>SANTUARIO</p><h1>Lo que es tuyo sigue siendo tuyo.</h1><span>Tu espacio íntimo. Lo que te nutre, te acompaña.</span></div></div><div className="lp-sanctuary-page"><div className="lp-sanctuary-toolbar"><button type="button" aria-label={snap?.memory_allowed?'Dejar de guardar':'Permitir guardar'} onClick={()=>void setMemory(!snap?.memory_allowed).then(refresh)}>{snap?.memory_allowed?'Guardar está permitido':'Permitir guardar'}</button><span>Todo</span><span>Reflexiones</span><span>Prácticas</span><span>Notas</span></div><div className="lp-sanctuary-cards"><article className="feature"><img src={IMG.forest}/><blockquote>“La calma no es la ausencia de movimiento, sino la presencia de lo que importa.”</blockquote></article>{entries.map(e=><article key={e.entry_id}><img src={e.entry_kind==='treasure'?IMG.lake:IMG.journal}/><p>{e.entry_kind}</p><h3>{e.title||'Mi nota personal'}</h3><span>{e.content}</span></article>)}</div><div className="lp-note-box"><textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Algo que quieras conservar para vos..."/><button disabled={busy||!content.trim()} onClick={()=>void save()}>Guardar para volver</button></div></div></section>
}

function TissueView() {
  const [circles,setCircles]=useState<Circle[]>([]);const [name,setName]=useState('');const [purpose,setPurpose]=useState('');const [busy,setBusy]=useState(false)
  const refresh=()=>getTissueSnapshot().then(setCircles)
  useEffect(()=>{void refresh()},[])
  const create=(e:FormEvent)=>{e.preventDefault();if(!name.trim()||!purpose.trim())return;setBusy(true);createCircle(name.trim(),purpose.trim()).then(()=>{setName('');setPurpose('');return refresh()}).finally(()=>setBusy(false))}
  return <section className="lp-space-page"><div className="lp-page-hero tissue" style={{backgroundImage:`linear-gradient(90deg,rgba(255,252,246,.96),rgba(255,252,246,.42)),url(${IMG.group})`}}><div><p>TEJIDO</p><h1 aria-label="La vida también puede circular entre personas.">La vida también se vive con otros.</h1><span>Personas, círculos, profesionales, instituciones y experiencias reales.</span></div></div><div className="lp-tissue-page"><div className="lp-chips big"><span>Personas</span><span>Círculos</span><span>Profesionales</span><span>Instituciones</span><span>Actividades</span></div><h2>Personas para acompañarte</h2><div className="lp-tissue-people"><article><img src={IMG.woman}/><b>Mariana</b><span>Psicóloga · Especialista en ansiedad</span><button>Conectar</button></article><article><img src={IMG.group}/><b>Diego</b><span>Facilitador · Transiciones y propósito</span><button>Conectar</button></article><article><img src={IMG.walk}/><b>Laura</b><span>Mentora · Hábitos y bienestar</span><button>Conectar</button></article></div><h2>Círculos y encuentros</h2><div className="lp-tissue-circles">{circles.map(c=><article key={c.space_id}><img src={IMG.group}/><b>{c.name}</b><span>{c.purpose}</span><small>{c.member_count} vidas · {c.role}</small></article>)}{!circles.length&&<><article><img src={IMG.group}/><b>Círculo de presencia</b><span>Un espacio para compartir y practicar.</span><small>Online</small></article><article><img src={IMG.journal}/><b>Lecturas que transforman</b><span>Dialogar, aprender, integrar.</span><small>Online</small></article><article><img src={IMG.walk}/><b>Caminatas conscientes</b><span>Naturaleza · Conversación · Presencia.</span><small>Presencial</small></article></>}</div><form className="lp-create-circle" onSubmit={create}><h2>Crear un Círculo</h2><input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre"/><input value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="Para qué existe"/><button disabled={busy||!name.trim()||!purpose.trim()}>Crear</button></form></div></section>
}

export default function AppPremium() {
  const [space,setSpace]=useState<Space>('home');const [authenticated,setAuthenticated]=useState(false);const [authReady,setAuthReady]=useState(false)
  const [expression,setExpression]=useState('');const [stage,setStage]=useState<MomentStage>('idle');const [scene,setScene]=useState<S1Scene|null>(null);const [help,setHelp]=useState<HelpPossibility|null>(null);const [email,setEmail]=useState('');const [authMessage,setAuthMessage]=useState('');const [busy,setBusy]=useState(false)
  const [snapshot,setSnapshot]=useState<ContinuitySnapshot|null>(null);const [source,setSource]=useState<SourceItem[]>([]);const [entries,setEntries]=useState<SanctuaryEntry[]>([]);const [circles,setCircles]=useState<Circle[]>([])
  const refreshPreview=()=>Promise.all([authenticated?getContinuitySnapshot():Promise.resolve(null),discoverSource(null,null,null,navigator.language||'es-AR',6),authenticated?listSanctuary():Promise.resolve([]),authenticated?getTissueSnapshot():Promise.resolve([])]).then(([s,src,e,c])=>{setSnapshot(s);setSource(src);setEntries(e);setCircles(c)}).catch(()=>{})
  useEffect(()=>{let live=true;getAuthSnapshot().then(async a=>{if(!live)return;const yes=Boolean(a.session);setAuthenticated(yes);if(yes)await bootstrapPerson();setAuthReady(true)}).catch(()=>setAuthReady(true));return()=>{live=false}},[])
  useEffect(()=>{if(authReady)void refreshPreview()},[authenticated,authReady])
  const go=(next:Space)=>{if((next==='territory'||next==='sanctuary'||next==='tissue')&&!authenticated){setSpace(next);return}setSpace(next);setStage('idle')}
  const runMoment=async()=>{if(!expression.trim())return;if(!authenticated){setStage('auth');return}setBusy(true);try{const s=await accompanyMoment(expression.trim(),navigator.language||'es-AR',(navigator.language||'es').split('-')[0]);setScene(s);setHelp(primaryHelpFromScene(s));setStage('scene')}finally{setBusy(false)}}
  const tryHelp=async()=>{if(!scene?.episode_id||!help)return;setBusy(true);try{await selectHelp(scene.episode_id,help.help_id,'selected');setStage('experience')}finally{setBusy(false)}}
  const outcome=async(effect:'helped'|'not_helped'|'unsure')=>{if(!scene?.episode_id)return;setBusy(true);try{await recordOutcome(scene.episode_id,effect);setStage('closed')}finally{setBusy(false)}}
  const integrate=async()=>{if(!help)return;setBusy(true);try{await integrateHelp(help.help_id);setAuthMessage('Quedó en tu repertorio.');await refreshPreview()}finally{setBusy(false)}}
  const askMagic=async()=>{if(!email.trim())return;setBusy(true);try{await requestMagicLink(email,window.location.origin);setAuthMessage('Te envié un enlace de acceso.')}catch{setAuthMessage('No pude enviar el enlace. Revisá el correo e intentá otra vez.')}finally{setBusy(false)}}
  const onSignOut=async()=>{await signOut();setAuthenticated(false);setSpace('home');setStage('idle')}
  const privateName = space==='territory'?'Mi Vida':space==='sanctuary'?'Santuario':'Tejido'
  const flow = useMemo(()=>stage!=='idle'&&stage!=='auth',[stage])
  return <div className="lp-app"><Sidebar active={space} go={go} authenticated={authenticated} onSignOut={()=>void onSignOut()}/><main className="lp-main">
    {space==='home'&&stage==='idle'&&<><HomeHero expression={expression} setExpression={setExpression} submit={()=>void runMoment()} busy={busy} go={go}/><section className="lp-four"><MiniLife go={go} snapshot={snapshot}/><MiniExplore go={go} source={source}/><MiniSanctuary go={go} entries={entries}/><MiniTissue go={go} circles={circles}/></section><JourneyStrip go={go} setExpression={s=>{setExpression(s);window.scrollTo({top:0,behavior:'smooth'})}}/><footer>CONOCIMIENTO · EXPERIENCIA · PERSONAS · VIDA REAL<br/><span>CIRCULANDO JUNTAS PARA UN MUNDO CON MÁS VIDAS PLENAS</span></footer></>}
    {space==='home'&&stage==='auth'&&<AuthGate email={email} setEmail={setEmail} request={()=>void askMagic()} goSource={()=>{setStage('idle');setSpace('source')}} message={authMessage}/>} 
    {space==='home'&&flow&&<MomentFlow stage={stage} scene={scene} help={help} onTry={()=>void tryHelp()} onExperienceExit={()=>setStage('outcome')} onOutcome={e=>void outcome(e)} onIntegrate={()=>void integrate()} onClose={()=>{setStage('idle');setExpression('')}} busy={busy}/>} 
    {space==='source'&&<SourceView authenticated={authenticated} go={go}/>} 
    {space==='territory'&&(authenticated?<TerritoryView/>:<PrivateGate name={privateName} goHome={()=>setSpace('home')}/>)}
    {space==='sanctuary'&&(authenticated?<SanctuaryView/>:<PrivateGate name={privateName} goHome={()=>setSpace('home')}/>)}
    {space==='tissue'&&(authenticated?<TissueView/>:<PrivateGate name={privateName} goHome={()=>setSpace('home')}/>)}
  </main></div>
}
