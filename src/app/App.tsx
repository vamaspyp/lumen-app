import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { getAuthSnapshot, requestEmailOtp, signOut, verifyEmailOtp } from '../greenfield/application/auth'
import { bootstrapPerson } from '../greenfield/application/consent'
import {
  addPathReference,
  cancelFollowup,
  createCircle,
  createCircleInvite,
  createTrajectory,
  createTrajectoryFromMoment,
  deleteSanctuary,
  discoverConstellation,
  discoverSource,
  exportSanctuary,
  getContinuitySnapshot,
  getProactivitySnapshot,
  getSourceTaxonomy,
  getTissueSnapshot,
  integrateHelp,
  joinCircle,
  leaveCircle,
  listSanctuary,
  recordLongitudinalSignal,
  removePathItem,
  reorderPathItem,
  reportCircle,
  reuseRepertoire,
  saveConstellationToPath,
  saveSanctuary,
  scheduleCultivationFollowup,
  setMemory,
  setProactivity,
  setTrajectoryCapabilities,
  shareHelp,
  updateSanctuary,
  updateTrajectory,
  type Circle,
  type ContinuitySnapshot,
  type CultivationMove,
  type LongitudinalSignal,
  type ProactivitySnapshot,
  type RepertoireItem,
  type SanctuaryEntry,
  type SourceItem,
  type SourceTaxonomy,
  type Trajectory,
} from '../greenfield/application/embryo'
import { composeMomentConstellation } from '../greenfield/application/moment'
import {
  accompanyMoment,
  primaryHelpFromScene,
  recordOutcome,
  selectHelp,
  type HelpPossibility,
  type OutcomeEffect,
  type S1Scene,
} from '../greenfield/application/s1'
import { Experience } from './Experience'
import { relatedSanctuaryToActiveLife, relatedSourceToActiveLife } from './contextual-orchestration'
import { constellationKey, premiumConstellations, premiumFamily, premiumFamilyLabel } from './premium-source'

type Space = 'home' | 'life' | 'explore' | 'sanctuary' | 'tissue' | 'search' | 'notifications' | 'settings'
type MomentStage = 'idle' | 'auth' | 'scene' | 'experience' | 'outcome' | 'closed'
type TissueKind = 'circles' | 'professionals' | 'institutions' | 'actions'
type ExperienceHelp = HelpPossibility | SourceItem
type DurationFilter = 'all' | 'quick' | 'medium' | 'long' | 'unspecified'
type ViewerProfile = Readonly<{ name:string; email:string|null; avatarUrl:string|null; initials:string }>

type SourceFiltersState = Readonly<{
  duration: DurationFilter
  format: string
  energy: string
  accessibilityOnly: boolean
}>

const EMPTY_SOURCE_FILTERS: SourceFiltersState = {
  duration: 'all',
  format: '',
  energy: '',
  accessibilityOnly: false,
}

const IMG = {
  hero: '/images/hero-presence.webp',
  calm: '/images/landscape-path.webp',
  practice: '/images/practice-hand.webp',
  journal: '/images/practice-hand.webp',
  meeting: '/images/hero-presence.webp',
  walk: '/images/landscape-path.webp',
  portrait: '/images/hero-presence.webp',
  sleep: '/images/landscape-path.webp',
  sunrise: '/images/landscape-path.webp',
}

const RESOURCE_IMAGES = [IMG.calm, IMG.practice, IMG.journal, IMG.meeting, IMG.walk, IMG.sleep]

function resourceImage(item: ExperienceHelp,index:number) {
  if (isSourceItem(item)) {
    const family=premiumFamily(item)
    const byFamily:Record<string,string> = {
      illustrated_guide: IMG.sunrise,
      audio_practice: IMG.calm,
      contemplative_reading_audio: IMG.practice,
      classic_reading: IMG.journal,
      video_or_audio_visual_sequence: IMG.walk,
      health_reference: IMG.calm,
    }
    if(family&&byFamily[family])return byFamily[family]
  }
  return RESOURCE_IMAGES[index % RESOURCE_IMAGES.length]
}

function viewerProfile(user: { email?:string|null; user_metadata?:Record<string,unknown> } | null): ViewerProfile {
  const email=user?.email||null
  const meta=user?.user_metadata||{}
  const name=[meta.full_name,meta.name,meta.display_name].find((value)=>typeof value==='string'&&value.trim()) as string|undefined
  const avatar=[meta.avatar_url,meta.picture].find((value)=>typeof value==='string'&&/^https?:\/\//.test(value)) as string|undefined
  const label=name?.trim()||email?.split('@')[0]||'Tu espacio'
  const initials=label.split(/[\s._-]+/).filter(Boolean).slice(0,2).map((part)=>part[0]?.toUpperCase()).join('')||'L'
  return {name:label,email,avatarUrl:avatar||null,initials}
}

const ROLE_LABEL: Record<string, string> = {
  UNDERSTAND: 'Comprender',
  PRACTICE: 'Practicar',
  APPLY: 'Aplicar',
  VARY: 'Variar',
  REFLECT: 'Reflexionar',
  INTEGRATE: 'Integrar',
  CONNECT: 'Conectar',
  SUSTAIN: 'Sostener',
}

function Icon({ name }: { name: 'home'|'life'|'explore'|'heart'|'people'|'search'|'bell'|'settings'|'leaf'|'arrow'|'book'|'sun'|'play'|'close'|'download'|'trash' }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  const p: Record<string, ReactNode> = {
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
    ['home','Inicio','home'],['explore','Explorar','explore'],['life','Mi proceso','life'],['tissue','Comunidad','people'],['sanctuary','Santuario','heart'],
  ]
  const utilities: Array<[Space, string, Parameters<typeof Icon>[0]['name']]> = [
    ['search','Buscar','search'],['notifications','Notificaciones','bell'],['settings','Ajustes','settings'],
  ]
  return <aside className="sidebar">
    <button className="brand-button" onClick={() => go('home')} type="button"><Logo/></button>
    <nav className="nav-main" aria-label="Espacios de LUMEN">
      {links.map(([space,label,icon]) => <button key={space} type="button" className={active === space ? 'active' : ''} onClick={() => go(space)}><Icon name={icon}/><span>{label}</span></button>)}
    </nav>
    <div className="nav-separator"/>
    <nav className="nav-minor" aria-label="Utilidades">
      {utilities.map(([space,label,icon]) => <button key={space} type="button" className={active === space ? 'active' : ''} onClick={() => go(space)}><Icon name={icon}/><span>{label}</span></button>)}
    </nav>
    <blockquote>Una vida<br/>más consciente<br/>también es una<br/>vida más libre.</blockquote>
    {authenticated && <button className="text-action signout" onClick={onSignOut} type="button">Cerrar sesión</button>}
  </aside>
}

function Topbar({ authenticated,profile,go,onSignOut }: { authenticated:boolean; profile:ViewerProfile|null; go:(space:Space)=>void; onSignOut:()=>void }) {
  const [open,setOpen]=useState(false)
  const navigate=(space:Space)=>{setOpen(false);go(space)}
  return <header className="parity-topbar">
    <button className="parity-brand" type="button" onClick={()=>navigate('home')} aria-label="Ir al inicio">
      <b>LUMEN</b><span>Saberes aplicados<br/>para mejorar vidas</span>
    </button>
    <p>Más presencia. Una vida más tuya.</p>
    <div className="parity-profile-wrap">
      <button className="parity-profile" type="button" aria-label="Abrir menú personal" aria-expanded={open} onClick={()=>setOpen((value)=>!value)}>
        {authenticated&&profile?.avatarUrl?<img src={profile.avatarUrl} alt=""/>:<span>{authenticated?profile?.initials||'T':'L'}</span>}
        <i aria-hidden="true">⌄</i>
      </button>
      {open&&<div className="parity-profile-menu">
        {authenticated&&<small>{profile?.name||'Tu espacio'}</small>}
        <button type="button" onClick={()=>navigate('search')}>Buscar</button>
        <button type="button" onClick={()=>navigate('notifications')}>Notificaciones</button>
        <button type="button" onClick={()=>navigate('settings')}>Ajustes</button>
        {authenticated?<button type="button" onClick={()=>{setOpen(false);onSignOut()}}>Cerrar sesión</button>:<button type="button" onClick={()=>navigate('life')}>Entrar</button>}
      </div>}
    </div>
  </header>
}

function PremiumHome({ expression,setExpression,submit,startPath,busy,source,taxonomy,authenticated,onOpen,onSave,go }: { expression:string; setExpression:(value:string)=>void; submit:()=>void; startPath:()=>void; busy:boolean; source:SourceItem[]; taxonomy:SourceTaxonomy|null; authenticated:boolean; onOpen:(item:SourceItem)=>void; onSave:(item:SourceItem)=>Promise<void>; go:(space:Space)=>void }) {
  const featured=source.slice(0,3)
  return <div className="parity-home">
    <section className="parity-home-hero" style={{backgroundImage:`url(${IMG.hero})`}}>
      <div className="parity-home-copy">
        <p>TU ESPACIO DE HOY</p>
        <h1>Recuperar<br/>mi espacio</h1>
        <h2>Cuando afuera parece urgente, volver a vos también puede ser una forma de avanzar.</h2>
        <button className="parity-hero-action" type="button" disabled={busy} onClick={startPath}>Comenzar el camino <Icon name="arrow"/></button>
      </div>
      <aside className="parity-hero-note"><em>“No todo lo urgente merece tu energía.”</em><span>Una pausa también es movimiento.</span></aside>
    </section>
    <section className="parity-lumi-card">
      <span className="parity-lumi-mark">✦</span>
      <div className="parity-lumi-copy"><small>LUMI · PRESENCIA</small><h2>Estoy acá.</h2><p>Podemos empezar por lo que hoy necesita un poco de espacio. No hace falta tenerlo claro.</p></div>
      <form className="parity-moment-form" onSubmit={(event)=>{event.preventDefault();submit()}}>
        <input aria-label="Lo que te está pasando" value={expression} onChange={(event)=>setExpression(event.target.value)} placeholder="Contame qué está presente..."/>
        <button type="submit" disabled={busy||!expression.trim()} aria-label="Continuar"><Icon name="arrow"/></button>
      </form>
    </section>
    <section className="parity-today">
      <div className="parity-section-heading"><div><p>PARA EMPEZAR HOY</p><h2>Pequeñas puertas.<br/>Un espacio más tuyo.</h2></div><button type="button" onClick={()=>go('explore')}>Ver todas las posibilidades <Icon name="arrow"/></button></div>
      <div className="parity-resource-grid">
        {featured.map((item,index)=><ResourceCard key={item.help_id} item={item} index={index} authenticated={authenticated} onOpen={(resource)=>onOpen(resource as SourceItem)} onSave={onSave} taxonomy={taxonomy}/>) }
        {!featured.length&&[0,1,2].map((item)=><div className="parity-resource-skeleton" key={item} aria-hidden="true"/>)}
      </div>
    </section>
    <blockquote className="parity-home-quote">“Volver a vos no es detenerte.<br/>Es recordar desde dónde querés vivir.”<small>LUMEN</small></blockquote>
  </div>
}

function PrivateGate({ name,email,setEmail,goHome,goExplore }: { name:string; email:string; setEmail:(value:string)=>void; goHome:()=>void; goExplore:()=>void }) {
  return <section className="private-gate"><span className="orb"/><p className="eyebrow">{name}</p><h1>Este espacio se vuelve tuyo cuando elegís continuidad.</h1><p>Podés explorar Fuente sin identificarte. Para memoria, Santuario, Mi Vida y Tejido necesitamos una cuenta mínima.</p><input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="tu@email.com"/><div className="button-row"><button className="primary" type="button" onClick={goHome}>Entrar con email</button><button className="ghost" type="button" onClick={goExplore}>Seguir explorando</button></div></section>
}

function AuthFlow({ email,setEmail,otp,setOtp,otpSent,busy,error,onSend,onVerify,onCancel }: { email:string; setEmail:(value:string)=>void; otp:string; setOtp:(value:string)=>void; otpSent:boolean; busy:boolean; error:string; onSend:()=>void; onVerify:()=>void; onCancel:()=>void }) {
  return <section className="private-gate"><span className="orb"/><p className="eyebrow">CONTINUIDAD</p><h1>Entrá a tu espacio.</h1><p>Usamos un código por email. Sin contraseña, sin pedirte más de lo necesario.</p><input aria-label="Email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="tu@email.com"/>{otpSent&&<input aria-label="Código" inputMode="numeric" value={otp} onChange={(e)=>setOtp(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="Código recibido"/>}{error&&<p className="status-message">{error}</p>}<div className="button-row">{!otpSent?<button className="primary" type="button" disabled={busy||!email.includes('@')} onClick={onSend}>Enviar código</button>:<button className="primary" type="button" disabled={busy||otp.length<6} onClick={onVerify}>Verificar</button>}<button className="ghost" type="button" disabled={busy} onClick={onCancel}>Ahora no</button></div></section>
}

function CapabilityPicker({ taxonomy,selected,onChange,disabled=false }: { taxonomy:SourceTaxonomy|null; selected:string[]; onChange:(keys:string[])=>void; disabled?:boolean }) {
  return <div className="capability-picker">{(taxonomy?.capacities||[]).map((term)=><button key={term.key} type="button" disabled={disabled} className={selected.includes(term.key)?'active':''} onClick={()=>onChange(selected.includes(term.key)?selected.filter((key)=>key!==term.key):[...selected,term.key])}>{term.label}</button>)}</div>
}

function isSourceItem(item: ExperienceHelp): item is SourceItem {
  return 'canonical_code' in item && 'provider' in item
}

function resourceRoles(item: ExperienceHelp): string[] {
  return isSourceItem(item) ? (item.cultivation_roles || []) : []
}

function resourceProvider(item: ExperienceHelp): string | null {
  return isSourceItem(item) ? item.provider?.name || null : null
}

function resourceCapabilityLabels(item: ExperienceHelp, taxonomy: SourceTaxonomy | null): string[] {
  if (!isSourceItem(item)) return []
  const keys = Array.from(new Set([...(item.capacities || []), ...(item.capacity_key ? [item.capacity_key] : [])].filter(Boolean)))
  return keys.map((key)=>taxonomy?.capacities?.find((term)=>term.key===key)?.label || key.replaceAll('_',' '))
}

function ResourceCard({ item,index,authenticated,onOpen,onSave,taxonomy,contextLabel,extraAction,openLabel='Vivir esta posibilidad' }: { item:ExperienceHelp; index:number; authenticated:boolean; onOpen:(item:ExperienceHelp)=>void; onSave?:(item:SourceItem)=>Promise<void>; taxonomy?:SourceTaxonomy|null; contextLabel?:string; extraAction?:ReactNode; openLabel?:string }) {
  const roles = resourceRoles(item)
  const provider = resourceProvider(item)
  const familyLabel = isSourceItem(item)&&premiumFamily(item) ? premiumFamilyLabel(item) : item.help_type.replaceAll('_',' ')
  const eyebrow = [familyLabel, item.duration_minutes ? `${item.duration_minutes} MIN` : null].filter(Boolean).join(' · ')
  const capabilities = resourceCapabilityLabels(item,taxonomy||null)
  const secondary = Array.from(new Set([...roles.map((role)=>ROLE_LABEL[role]||role), ...(item.energy?[item.energy.replaceAll('_',' ')]:[])])).slice(0,2)
  return <article className={`source-card premium-card${isSourceItem(item)&&premiumFamily(item)?' premium-source-card':''}`}>
    <img src={resourceImage(item,index)} alt=""/>
    <div className="source-card-copy">
      <p className="eyebrow">{eyebrow}</p>
      {provider&&<small className="source-provider">{provider}</small>}
      <h3>{item.title}</h3>
      <p className="source-summary">{item.summary}</p>
      <div className="resource-tags">
        {capabilities.slice(0,3).map((label)=><span className="capacity-tag" key={label}>{label}</span>)}
        {secondary.map((tag)=><span key={tag}>{tag}</span>)}
      </div>
      {contextLabel&&<small className="card-context">{contextLabel}</small>}
      {extraAction&&<div className="card-extra">{extraAction}</div>}
    </div>
    <div className="card-edge-actions">
      <button className="card-open" type="button" onClick={()=>onOpen(item)} aria-label={openLabel}><Icon name="arrow"/></button>
      {authenticated&&onSave&&isSourceItem(item)&&<button className="card-save" type="button" onClick={()=>void onSave(item)} aria-label="Conservar para mí"><Icon name="heart"/></button>}
    </div>
  </article>
}

function SourceCard({ item,index,authenticated,onOpen,onSave,taxonomy }: { item:SourceItem; index:number; authenticated:boolean; onOpen:(item:SourceItem)=>void; onSave:(item:SourceItem)=>Promise<void>; taxonomy?:SourceTaxonomy|null }) {
  return <ResourceCard item={item} index={index} authenticated={authenticated} onOpen={(resource)=>onOpen(resource as SourceItem)} onSave={onSave} taxonomy={taxonomy}/>
}

function matchesSourceFilters(item: SourceItem, filters: SourceFiltersState) {
  if (filters.format && item.help_type !== filters.format) return false
  if (filters.energy && item.energy !== filters.energy) return false
  if (filters.accessibilityOnly && (!item.accessibility || Object.keys(item.accessibility).length === 0)) return false
  const minutes = item.duration_minutes
  if (filters.duration === 'quick' && !(minutes !== null && minutes <= 5)) return false
  if (filters.duration === 'medium' && !(minutes !== null && minutes > 5 && minutes <= 15)) return false
  if (filters.duration === 'long' && !(minutes !== null && minutes > 15)) return false
  if (filters.duration === 'unspecified' && minutes !== null) return false
  return true
}

function SourceFilters({ items,open,setOpen,filters,setFilters }: { items:SourceItem[]; open:boolean; setOpen:(open:boolean)=>void; filters:SourceFiltersState; setFilters:(filters:SourceFiltersState)=>void }) {
  const formats = useMemo(()=>Array.from(new Set(items.map((item)=>item.help_type).filter(Boolean))).sort(),[items])
  const energies = useMemo(()=>Array.from(new Set(items.map((item)=>item.energy).filter((value): value is string => Boolean(value)))).sort(),[items])
  const activeCount = [filters.duration !== 'all', Boolean(filters.format), Boolean(filters.energy), filters.accessibilityOnly].filter(Boolean).length
  return <div className="source-filter-control">
    <button className={open?'filter-toggle active':'filter-toggle'} type="button" aria-expanded={open} onClick={()=>setOpen(!open)}>Filtros{activeCount?` · ${activeCount}`:''}</button>
    {open&&<div className="source-filter-panel" aria-label="Filtros de Fuente">
      <label><span>Duración</span><select aria-label="Duración" value={filters.duration} onChange={(e)=>setFilters({...filters,duration:e.target.value as DurationFilter})}><option value="all">Cualquier duración</option><option value="quick">Hasta 5 min</option><option value="medium">6–15 min</option><option value="long">Más de 15 min</option><option value="unspecified">Sin duración indicada</option></select></label>
      <label><span>Formato</span><select aria-label="Formato" value={filters.format} onChange={(e)=>setFilters({...filters,format:e.target.value})}><option value="">Cualquier formato</option>{formats.map((format)=><option key={format} value={format}>{format.replaceAll('_',' ')}</option>)}</select></label>
      <label><span>Energía</span><select aria-label="Energía" value={filters.energy} onChange={(e)=>setFilters({...filters,energy:e.target.value})}><option value="">Cualquier energía</option>{energies.map((energy)=><option key={energy} value={energy}>{energy}</option>)}</select></label>
      <label className="filter-check"><input type="checkbox" checked={filters.accessibilityOnly} onChange={(e)=>setFilters({...filters,accessibilityOnly:e.target.checked})}/><span>Con información de accesibilidad</span></label>
      {activeCount>0&&<button className="text-action" type="button" onClick={()=>setFilters(EMPTY_SOURCE_FILTERS)}>Limpiar filtros</button>}
    </div>}
  </div>
}

function MomentFlow({ stage,scene,help,constellation,capacityKeys,taxonomy,expression,busy,selectedPathIds,createdTrajectoryId,onSelect,onExperienceExit,onOutcome,onIntegrate,onClose,onClarify,onReexpress,onCapacityChange,onTogglePath,onCreateFaro,onSavePath,onOpenPath,integrated }: { stage:MomentStage; scene:S1Scene|null; help:ExperienceHelp|null; constellation:SourceItem[]; capacityKeys:string[]; taxonomy:SourceTaxonomy|null; expression:string; busy:boolean; selectedPathIds:string[]; createdTrajectoryId:string|null; onSelect:(item:ExperienceHelp)=>void; onExperienceExit:()=>void; onOutcome:(effect:'helped'|'not_helped'|'unsure')=>void; onIntegrate:()=>void; onClose:()=>void; onClarify:()=>void; onReexpress:(text:string)=>void; onCapacityChange:(keys:string[])=>void; onTogglePath:(helpId:string)=>void; onCreateFaro:(text:string)=>void; onSavePath:()=>void; onOpenPath:()=>void; integrated:boolean }) {
  const [faroText,setFaroText]=useState(expression.slice(0,280))
  const [reExpression,setReExpression]=useState(expression)
  useEffect(()=>{setFaroText(expression.slice(0,280));setReExpression(expression)},[expression])
  const noMatch=scene?.scene_id==='moment.no_match'||scene?.scene_id==='moment.safety_referral'||(!help&&!constellation.length)
  const primary=(constellation.find((item)=>item.primary_now)||constellation[0]||help) as ExperienceHelp|null
  const rest=constellation.filter((item)=>item.help_id!==primary?.help_id)
  if(stage==='experience'&&help)return <Experience help={help} onExit={onExperienceExit}/>
  return <section className="moment-page"><div className="moment-dialogue moment-dialogue-wide">
    <div className="lumi-presence"><span className="orb small"/><div><small>LUMI · {scene?.presence_mode||'P2'}</small><p>{stage==='scene'?'Estoy acá. No hace falta reducir lo que te pasa a una sola respuesta.':stage==='outcome'?'Volvamos apenas a lo vivido. Vos decidís qué quedó.':'Si algo vale la pena conservar, puede quedar disponible sin convertirse en obligación.'}</p></div></div>
    <button className="dialogue-close" type="button" onClick={onClose}><Icon name="close"/></button>
    {stage==='scene'&&<>{noMatch?<><p className="eyebrow">PRESENCIA ANTES QUE RESPUESTA</p><h1>No quiero inventarte una respuesta.</h1><p>No encontré una posibilidad suficientemente confiable para esto ahora. Podemos aclarar un poco más o dejarlo acá.</p><div className="button-row"><button className="primary" type="button" onClick={onClarify}>Aclarar un poco más</button><button className="ghost" type="button" onClick={onClose}>Dejarlo acá</button></div></>:<>
      <section className="moment-interpretation">
        <p className="eyebrow">LO QUE ESCUCHÉ</p>
        <blockquote>“{expression}”</blockquote>
        <div className="interpretation-capabilities">
          <small>Lo estoy leyendo, provisoriamente, desde estas capacidades:</small>
          <CapabilityPicker taxonomy={taxonomy} selected={capacityKeys} onChange={onCapacityChange} disabled={busy||Boolean(createdTrajectoryId)}/>
        </div>
        {!createdTrajectoryId&&<details><summary>Reexpresar o ajustar mi lectura</summary><div className="reexpression-editor"><textarea value={reExpression} onChange={(e)=>setReExpression(e.target.value.slice(0,1200))}/><p>Podés cambiar tus palabras y también elegir o quitar capacidades. La lectura de LUMEN es una propuesta; tu criterio manda.</p><button className="ghost" type="button" disabled={busy||!reExpression.trim()||reExpression.trim()===expression.trim()} onClick={()=>onReexpress(reExpression.trim())}>Volver a interpretar desde mis palabras</button></div></details>}
      </section>
      <div className="constellation-hero" style={{backgroundImage:`linear-gradient(90deg,rgba(18,24,18,.72),rgba(18,24,18,.18)),url(${IMG.calm})`}}><div><p className="eyebrow">UNA CONSTELACIÓN PARA ESTE MOMENTO · ABIERTA Y EDITABLE</p><h1>Algunas formas de acompañar lo que está vivo.</h1><p>Está compuesta desde las capacidades que ves arriba. Podés quitar o sumar piezas antes de hacerla parte de un Camino.</p></div></div>
      {primary&&<><div className="section-heading moment-section-heading"><h2>Para ahora</h2><p>Una primera ayuda posible, de baja fricción y pertinente a este momento.</p></div><div className="source-grid moment-source-grid"><ResourceCard item={primary} index={0} authenticated={false} onOpen={onSelect} taxonomy={taxonomy} contextLabel="PARA AHORA · UNA PRIMERA AYUDA POSIBLE" extraAction={<button className={selectedPathIds.includes(primary.help_id)?'ghost small active':'ghost small'} type="button" onClick={()=>onTogglePath(primary.help_id)}>{selectedPathIds.includes(primary.help_id)?'✓ En mi posible Camino':'+ Sumar al Camino'}</button>}/></div></>}
      {rest.length>0&&<div className="moment-constellation"><div className="section-heading"><h2>Otras maneras de acercarte</h2><p>Comprender, practicar, aplicar, conversar, integrar. Sin un orden obligatorio.</p></div><div className="source-grid moment-source-grid">{rest.map((item,index)=><ResourceCard key={item.help_id} item={item} index={index+1} authenticated={false} onOpen={onSelect} taxonomy={taxonomy} extraAction={<button className={selectedPathIds.includes(item.help_id)?'ghost small active':'ghost small'} type="button" onClick={()=>onTogglePath(item.help_id)}>{selectedPathIds.includes(item.help_id)?'✓ En mi posible Camino':'+ Sumar al Camino'}</button>}/>)}</div></div>}
      <section className="faro-proposal"><p className="eyebrow">SI ESTO MERECE CONTINUIDAD</p><h2>Convertirlo en un Faro propio.</h2><p>Podés reexpresar la dirección, confirmar las capacidades y elegir qué piezas de esta constelación querés llevar a tu Camino. Nada queda fijado para siempre.</p><input value={faroText} onChange={(e)=>setFaroText(e.target.value.slice(0,280))} placeholder="Una dirección que quiero cuidar..."/><CapabilityPicker taxonomy={taxonomy} selected={capacityKeys} onChange={onCapacityChange} disabled={busy||Boolean(createdTrajectoryId)}/><div className="faro-selection-summary"><span>{selectedPathIds.length} {selectedPathIds.length===1?'pieza elegida':'piezas elegidas'} para el Camino</span><small>Podés sumar o quitar piezas desde las tarjetas de la constelación.</small></div>{!createdTrajectoryId?<button className="primary" type="button" disabled={busy||!faroText.trim()||!capacityKeys.length} onClick={()=>onCreateFaro(faroText.trim())}>Conservar como Faro</button>:<div className="faro-saved"><b>Faro y Camino creados.</b><p>Quedaron vinculados a estas capacidades y a las piezas que elegiste. Desde Mi Vida podés sumar, quitar y ordenar elementos de Fuente, Santuario, Tejido, Repertorio o algo propio.</p><div className="button-row"><button className="primary" type="button" onClick={onOpenPath}>Abrir mi Camino y ajustarlo</button><button className="ghost" type="button" disabled={busy||!selectedPathIds.length} onClick={onSavePath}>Conservar selección como mi Camino</button></div></div>}</section>
    </>}</>}
    {stage==='outcome'&&<><p className="eyebrow">RETORNO</p><h1>¿Cómo fue para vos?</h1><p>No hace falta explicar demasiado. Sólo nos ayuda a saber si tuvo sentido en tu vida real.</p><div className="outcome-row"><button type="button" onClick={()=>onOutcome('helped')}>Me ayudó</button><button type="button" onClick={()=>onOutcome('unsure')}>No estoy segura</button><button type="button" onClick={()=>onOutcome('not_helped')}>No me ayudó</button></div></>}
    {stage==='closed'&&<><p className="eyebrow">COSECHA</p><h1>Gracias. Con esto alcanza por ahora.</h1><p>{integrated?'Quedó en tu repertorio porque vos lo elegiste.':'Si querés, podés conservar esta posibilidad como algo a lo que volver.'}</p><div className="button-row">{!integrated&&help&&<button className="primary" type="button" onClick={onIntegrate} disabled={busy}>Guardar “{help.title}” en mi repertorio</button>}<button className="ghost" type="button" onClick={onClose}>Volver a mi vida</button></div></>}
  </div></section>
}

function PathComposer({ trajectory,source,repertoire,entries,circles,refresh }: { trajectory:Trajectory; source:SourceItem[]; repertoire:RepertoireItem[]; entries:SanctuaryEntry[]; circles:Circle[]; refresh:()=>Promise<void> }) {
  const [sourceId,setSourceId]=useState('')
  const [repId,setRepId]=useState('')
  const [entryId,setEntryId]=useState('')
  const [circleId,setCircleId]=useState('')
  const [custom,setCustom]=useState('')
  const [busy,setBusy]=useState(false)
  const act=async(fn:()=>Promise<unknown>)=>{setBusy(true);try{await fn();await refresh()}finally{setBusy(false)}}
  const path=trajectory.path||[]
  const addSource=()=>{const item=source.find((x)=>x.help_id===sourceId);if(item)void act(()=>addPathReference(trajectory.trajectory_id,'source',item.help_id,item.help_id,item.title,'CONTINUE_PATH'))}
  const addRep=()=>{const item=repertoire.find((x)=>x.repertoire_id===repId);if(item)void act(()=>addPathReference(trajectory.trajectory_id,'repertoire',item.repertoire_id,item.help_id,item.title,'REUSE_REPERTOIRE'))}
  const addEntry=()=>{const item=entries.find((x)=>x.entry_id===entryId);if(item)void act(()=>addPathReference(trajectory.trajectory_id,'sanctuary',item.entry_id,item.source_help_id,item.title||'Algo de mi Santuario','REFLECT'))}
  const addCircle=()=>{const item=circles.find((x)=>x.space_id===circleId);if(item)void act(()=>addPathReference(trajectory.trajectory_id,'tissue',item.space_id,null,item.name,'CONNECT_HUMAN'))}
  const addCustom=()=>{if(custom.trim())void act(async()=>{await addPathReference(trajectory.trajectory_id,'custom',null,null,custom.trim(),null);setCustom('')})}
  return <div className="path-composer"><div className="path-items">{path.map((item,index)=><div className="path-item-row" key={item.path_item_id}><span><small>{item.source_kind||'source'}</small><b>{item.label}</b></span><div><button type="button" disabled={busy||index===0} onClick={()=>void act(()=>reorderPathItem(item.path_item_id,Math.max(1,item.position-1)))}>↑</button><button type="button" disabled={busy||index===path.length-1} onClick={()=>void act(()=>reorderPathItem(item.path_item_id,item.position+1))}>↓</button><button type="button" disabled={busy} onClick={()=>void act(()=>removePathItem(item.path_item_id))}>Quitar</button></div></div>)}</div><details><summary>Ajustar mi Camino</summary><div className="path-source-grid"><label>Fuente<select value={sourceId} onChange={(e)=>setSourceId(e.target.value)}><option value="">Elegir posibilidad…</option>{source.slice(0,80).map((item)=><option key={item.help_id} value={item.help_id}>{item.title}</option>)}</select><button type="button" disabled={!sourceId||busy} onClick={addSource}>Agregar</button></label><label>Repertorio<select value={repId} onChange={(e)=>setRepId(e.target.value)}><option value="">Elegir recurso propio…</option>{repertoire.map((item)=><option key={item.repertoire_id} value={item.repertoire_id}>{item.title}</option>)}</select><button type="button" disabled={!repId||busy} onClick={addRep}>Agregar</button></label><label>Santuario<select value={entryId} onChange={(e)=>setEntryId(e.target.value)}><option value="">Elegir algo conservado…</option>{entries.map((item)=><option key={item.entry_id} value={item.entry_id}>{item.title||item.content.slice(0,50)}</option>)}</select><button type="button" disabled={!entryId||busy} onClick={addEntry}>Agregar</button></label><label>Tejido<select value={circleId} onChange={(e)=>setCircleId(e.target.value)}><option value="">Elegir vínculo o círculo…</option>{circles.map((item)=><option key={item.space_id} value={item.space_id}>{item.name}</option>)}</select><button type="button" disabled={!circleId||busy} onClick={addCircle}>Agregar</button></label><label>Algo propio<input value={custom} onChange={(e)=>setCustom(e.target.value)} placeholder="Una práctica, persona, lugar o recordatorio propio"/><button type="button" disabled={!custom.trim()||busy} onClick={addCustom}>Agregar</button></label></div></details></div>
}

function TrajectoryCard({ trajectory,taxonomy,source,repertoire,entries,circles,refresh }: { trajectory:Trajectory; taxonomy:SourceTaxonomy|null; source:SourceItem[]; repertoire:RepertoireItem[]; entries:SanctuaryEntry[]; circles:Circle[]; refresh:()=>Promise<void> }) {
  const [editing,setEditing]=useState(false)
  const [text,setText]=useState(trajectory.faro_text)
  const [caps,setCaps]=useState(trajectory.capability_keys||[])
  const [busy,setBusy]=useState(false)
  useEffect(()=>{setText(trajectory.faro_text);setCaps(trajectory.capability_keys||[])},[trajectory.faro_text,trajectory.capability_keys])
  const save=async()=>{setBusy(true);try{await updateTrajectory(trajectory.trajectory_id,text.trim()||trajectory.faro_text,trajectory.status);await setTrajectoryCapabilities(trajectory.trajectory_id,caps);setEditing(false);await refresh()}finally{setBusy(false)}}
  const toggleStatus=async()=>{setBusy(true);try{await updateTrajectory(trajectory.trajectory_id,trajectory.faro_text,trajectory.status==='active'?'paused':'active');await refresh()}finally{setBusy(false)}}
  return <article className="trajectory-card"><span className="path-dot"/><div>{editing?<><input value={text} onChange={(e)=>setText(e.target.value)}/><CapabilityPicker taxonomy={taxonomy} selected={caps} onChange={setCaps} disabled={busy}/><div className="card-actions"><button className="primary small" disabled={busy||!text.trim()} type="button" onClick={()=>void save()}>Guardar</button><button className="ghost small" type="button" onClick={()=>setEditing(false)}>Cancelar</button></div></>:<><b>{trajectory.faro_text}</b><small>{trajectory.status==='active'?'En camino':trajectory.status}</small><p>{trajectory.capability_keys?.length?`Capacidades: ${trajectory.capability_keys.map((key)=>taxonomy?.capacities?.find((term)=>term.key===key)?.label||key).join(' · ')}`:'Sin capacidades fijadas'}</p><div className="card-actions"><button className="ghost small" type="button" onClick={()=>setEditing(true)}>Ajustar Faro y capacidades</button><button className="ghost small" type="button" disabled={busy} onClick={()=>void toggleStatus()}>{trajectory.status==='active'?'Pausar':'Retomar'}</button></div></>}<PathComposer trajectory={trajectory} source={source} repertoire={repertoire} entries={entries} circles={circles} refresh={refresh}/></div></article>
}

function signalForReturn(move: Exclude<CultivationMove,'CONTINUE_PATH'>, effect: OutcomeEffect): LongitudinalSignal {
  if(effect==='not_helped')return 'STOPPED_HELPING'
  if(effect==='unsure')return 'UNKNOWN'
  if(move==='REPEAT')return 'REPEATED'
  if(move==='VARY')return 'VARIED'
  if(move==='APPLY_IN_CONTEXT')return 'APPLIED_OTHER_CONTEXT'
  return 'REUSED'
}

function LifeView({ snapshot,proactivity,taxonomy,source,entries,circles,refresh,onOpenSource,go }: { snapshot:ContinuitySnapshot|null; proactivity:ProactivitySnapshot|null; taxonomy:SourceTaxonomy|null; source:SourceItem[]; entries:SanctuaryEntry[]; circles:Circle[]; refresh:()=>Promise<void>; onOpenSource:(item:SourceItem)=>void; go:(space:Space)=>void }) {
  const [newFaro,setNewFaro]=useState('')
  const [busy,setBusy]=useState(false)
  const [cultivation,setCultivation]=useState<{help:HelpPossibility;episodeId:string;move:Exclude<CultivationMove,'CONTINUE_PATH'>}|null>(null)
  const [status,setStatus]=useState('')
  const [reminderRepertoireId,setReminderRepertoireId]=useState('')
  const [reminderAt,setReminderAt]=useState('')
  const create=async(e:FormEvent)=>{e.preventDefault();if(!newFaro.trim())return;setBusy(true);try{await createTrajectory(newFaro.trim());setNewFaro('');await refresh()}finally{setBusy(false)}}
  const cultivate=async(repertoireId:string,move:Exclude<CultivationMove,'CONTINUE_PATH'>)=>{setBusy(true);setStatus('');try{const scene=await reuseRepertoire(repertoireId,move);setCultivation({help:scene.help as HelpPossibility,episodeId:scene.episode_id,move})}catch{setStatus('No pude abrir esta continuidad ahora. Podés volver a intentarlo cuando quieras.')}finally{setBusy(false)}}
  const longitudinalFeedback=async(effect:OutcomeEffect)=>{if(!cultivation)return;const signal=signalForReturn(cultivation.move,effect);await recordLongitudinalSignal(cultivation.episodeId,signal);setStatus(effect==='not_helped'?'Lo retiré de tu repertorio. Si alguna vez vuelve a tener sentido, puede nacer de nuevo desde tu vida.':effect==='unsure'?'Queda como algo todavía abierto. LUMEN no va a completar lo que no sabemos.':'Gracias. Esta experiencia quedó diferenciada de la primera vez que te ayudó.');setCultivation(null);await refresh()}
  const explicitSignal=async(item:RepertoireItem,signal:Extract<LongitudinalSignal,'RECOGNIZED_AS_OWN'|'NO_REMINDER_NEEDED'|'STOPPED_HELPING'>)=>{setBusy(true);setStatus('');try{const scene=await reuseRepertoire(item.repertoire_id,'INTEGRATE');const result=await recordLongitudinalSignal(scene.episode_id,signal);if(signal==='RECOGNIZED_AS_OWN')setStatus('Quedó registrado porque vos lo reconocés como propio.');if(signal==='NO_REMINDER_NEEDED')setStatus(result.decision_kind==='WITHDRAW'?'Esto ya puede seguir con menos LUMI. No agregaremos recordatorios ni novedad innecesaria.':'Quedó registrado que no necesitás recordatorios.');if(signal==='STOPPED_HELPING')setStatus('Lo retiré de tu repertorio porque dejó de servirte.');await refresh()}catch{setStatus('No pude registrar ese cambio ahora. Nada se modificó.')}finally{setBusy(false)}}
  const scheduleReminder=async(e:FormEvent)=>{e.preventDefault();if(!reminderRepertoireId||!reminderAt)return;const item=snapshot?.repertoire?.find((x)=>x.repertoire_id===reminderRepertoireId);if(!item)return;setBusy(true);setStatus('');try{if(!(proactivity?.proactive_allowed??false)){setStatus('Activá primero la proactividad si querés que LUMEN vuelva por iniciativa acordada.');return}const due=new Date(reminderAt);if(Number.isNaN(due.getTime())||due.getTime()<=Date.now()){setStatus('Elegí un momento futuro para volver.');return}await scheduleCultivationFollowup('self_chosen',due.toISOString(),'REPEAT',{repertoireId:item.repertoire_id,helpId:item.help_id,capacityKey:item.capability_keys?.[0]??null});setReminderRepertoireId('');setReminderAt('');setStatus('Retorno acordado. Podés cancelarlo cuando quieras desde Notificaciones.');await refresh()}catch{setStatus('No pude acordar ese retorno. Revisá la fecha o la proactividad.')}finally{setBusy(false)}}
  if(cultivation)return <Experience help={cultivation.help} onExit={()=>setCultivation(null)} onFeedback={(effect)=>longitudinalFeedback(effect)}/>
  const memory=snapshot?.memory_allowed??false
  return <section className="space-page life-view"><SpaceHero kicker="MI PROCESO" title="Un camino hacia una vida más mía." text="Pequeños pasos, decisiones más conscientes y un espacio cada vez más habitable." image={IMG.calm}/><div className="space-content"><div className="life-columns"><section><p className="section-label">LO QUE ESTÁ VIVO HOY</p><h2>{snapshot?.trajectories?.[0]?.faro_text||'Un lugar para reconocer dónde estás.'}</h2><p>El presente tiene prioridad. Tus caminos siguen disponibles sin convertirse en presión.</p></section><aside className="soft-control"><span>Memoria elegida por vos</span><button aria-label="Memoria" type="button" className={memory?'switch on':'switch'} onClick={async()=>{await setMemory(!memory);await refresh()}}><i/></button></aside></div><div className="section-heading"><h2>Mis Faros y Caminos</h2><p>Direcciones vivas. Capacidades editables. Caminos que podés armar y desarmar.</p></div><div className="path-grid path-grid-wide">{snapshot?.trajectories?.length?snapshot.trajectories.map((trajectory)=><TrajectoryCard key={trajectory.trajectory_id} trajectory={trajectory} taxonomy={taxonomy} source={source} repertoire={snapshot.repertoire||[]} entries={entries} circles={circles} refresh={refresh}/>):<article><span className="path-dot"/><div><b>Tu primer Faro puede nacer acá.</b><small>Elegido por vos</small><p>Una dirección que quieras cuidar sin convertirla en meta ni score.</p></div></article>}</div><form className="inline-create" onSubmit={create}><input value={newFaro} onChange={(e)=>setNewFaro(e.target.value)} placeholder="Algo que quiero cuidar en mi vida..."/><button disabled={busy||!newFaro.trim()}>Abrir un Faro</button></form>{(()=>{const relatedSource=relatedSourceToActiveLife(source,snapshot,3);const relatedSanctuary=relatedSanctuaryToActiveLife(entries,source,snapshot,2);const human=relatedSource.filter((item)=>['professional_support','institutional_service','human_action','conversation'].includes(item.help_type));return (relatedSource.length||relatedSanctuary.length||human.length)?<section className="organism-bridges"><div className="section-heading"><h2>Conexiones alrededor de lo que estás cuidando</h2><p>Fuente, Santuario y Tejido pueden aportar sin convertir tu Faro en un programa.</p></div><div className="bridge-grid">{relatedSource.filter((item)=>!['professional_support','institutional_service','human_action','conversation'].includes(item.help_type)).slice(0,2).map((item)=><button className="bridge-card" type="button" key={item.help_id} onClick={()=>onOpenSource(item)}><small>FUENTE</small><b>{item.title}</b><p>{item.summary}</p></button>)}{relatedSanctuary.slice(0,1).map((entry)=><button className="bridge-card" type="button" key={entry.entry_id} onClick={()=>go('sanctuary')}><small>SANTUARIO</small><b>{entry.title||'Algo que guardaste'}</b><p>{entry.content.slice(0,120)}</p></button>)}{human.slice(0,1).map((item)=><button className="bridge-card" type="button" key={item.help_id} onClick={()=>onOpenSource(item)}><small>TEJIDO</small><b>{item.title}</b><p>{item.summary}</p></button>)}</div></section>:null})()}<div className="section-heading"><h2>Mi repertorio</h2><p>Lo que ya reconociste como útil para volver a usar.</p></div><div className="repertoire-grid">{snapshot?.repertoire?.length?snapshot.repertoire.map((item)=><article key={item.repertoire_id}><img src={IMG.practice} alt=""/><span><b>{item.title}</b><small>{item.times_reused?`${item.times_reused} retornos`:'Disponible para vos'}</small><p>{item.summary}</p><div className="card-actions"><button className="ghost small" type="button" disabled={busy} onClick={()=>void cultivate(item.repertoire_id,'REPEAT')}>Repetir</button><button className="ghost small" type="button" disabled={busy} onClick={()=>void cultivate(item.repertoire_id,'VARY')}>Variar</button><button className="ghost small" type="button" disabled={busy} onClick={()=>void cultivate(item.repertoire_id,'APPLY_IN_CONTEXT')}>Aplicar</button></div><details><summary>Qué cambió con esto</summary><div className="card-actions"><button className="ghost small" type="button" disabled={busy} onClick={()=>void explicitSignal(item,'RECOGNIZED_AS_OWN')}>Ya lo siento propio</button><button className="ghost small" type="button" disabled={busy} onClick={()=>void explicitSignal(item,'NO_REMINDER_NEEDED')}>Ya no necesito recordatorios</button><button className="ghost small" type="button" disabled={busy} onClick={()=>void explicitSignal(item,'STOPPED_HELPING')}>Dejó de servirme</button></div></details></span></article>):<div className="empty-state">Todavía no hay nada en tu repertorio. LUMEN no lo llena por vos.</div>}</div>{status&&<p className="status-message">{status}</p>}<div className="section-heading"><h2>Continuidad elegida</h2><p>LUMEN sólo vuelve si vos lo permitís.</p></div><aside className="soft-control"><span>Proactividad {proactivity?.proactive_allowed?'activada':'desactivada'}</span><button aria-label="Proactividad" type="button" className={proactivity?.proactive_allowed?'switch on':'switch'} onClick={async()=>{await setProactivity(!(proactivity?.proactive_allowed??false));await refresh()}}><i/></button></aside>{snapshot?.repertoire?.length?<form className="inline-create" onSubmit={scheduleReminder}><select aria-label="Recurso para recordar" value={reminderRepertoireId} onChange={(e)=>setReminderRepertoireId(e.target.value)}><option value="">Elegir algo a lo que volver…</option>{snapshot.repertoire.map((item)=><option key={item.repertoire_id} value={item.repertoire_id}>{item.title}</option>)}</select><input aria-label="Cuándo volver" type="datetime-local" value={reminderAt} onChange={(e)=>setReminderAt(e.target.value)}/><button disabled={busy||!reminderRepertoireId||!reminderAt}>Acordar retorno</button></form>:null}</div></section>
}

function SpaceHero({ kicker,title,text,image }: { kicker:string; title:string; text:string; image:string }) {
  const identity = kicker==='EXPLORAR'||kicker==='BUSCAR' ? 'FUENTE' : kicker
  const editorial = identity==='FUENTE' && (kicker==='EXPLORAR'||kicker==='BUSCAR')
  const notes:Record<string,string> = {
    'FUENTE':'Explorar también es una forma de cuidarte.',
    'MI PROCESO':'También aquí, en lo cotidiano, hay un lugar para volver a ti.',
    'SANTUARIO':'Conservar lo que importa también es una forma de cuidarte.',
    'TEJIDO':'Compartir también es una forma de cuidar.',
    'NOTIFICACIONES':'Volver sólo cuando lo elegís.',
    'AJUSTES':'Una vida más tuya también se construye con límites claros.',
  }
  return <header className={editorial?'space-hero space-hero-editorial':'space-hero'} style={{backgroundImage:`url(${image})`}}>
    <div className="space-brand">LUMEN · {identity}</div>
    <aside className="space-hero-note"><em>{notes[identity]||notes[kicker]||'Una vida más tuya.'}</em><span>—</span></aside>
    <div className="space-hero-copy"><p>{kicker}</p><h1>{title}</h1><span>{text}</span></div>
  </header>
}

function ExploreView({ source,taxonomy,snapshot,authenticated,onOpen,onSave,returnConstellationKey,onReturnConstellationChange }: { source:SourceItem[]; taxonomy:SourceTaxonomy|null; snapshot:ContinuitySnapshot|null; authenticated:boolean; onOpen:(item:SourceItem)=>void; onSave:(item:SourceItem)=>Promise<void>; returnConstellationKey:string|null; onReturnConstellationChange:(key:string|null)=>void }) {
  const [query,setQuery]=useState('')
  const [selectedCapacity,setSelectedCapacity]=useState<string|null>(null)
  const [constellation,setConstellation]=useState<SourceItem[]>([])
  const [selectedConstellationKey,setSelectedConstellationKey]=useState<string|null>(null)
  const [loading,setLoading]=useState(false)
  const [message,setMessage]=useState('')
  const [filtersOpen,setFiltersOpen]=useState(false)
  const [filters,setFilters]=useState<SourceFiltersState>(EMPTY_SOURCE_FILTERS)
  const filtered=useMemo(()=>source.filter((item)=>`${item.title} ${item.summary} ${(item.capacities||[]).join(' ')}`.toLowerCase().includes(query.toLowerCase())).filter((item)=>matchesSourceFilters(item,filters)).slice(0,24),[source,query,filters])
  const faroRelated=useMemo(()=>relatedSourceToActiveLife(source,snapshot,4),[source,snapshot])
  const premiumGroups=useMemo(()=>premiumConstellations(source,taxonomy),[source,taxonomy])
  const selectedLabel=taxonomy?.capacities?.find((term)=>term.key===selectedCapacity)?.label||selectedCapacity
  const filteredConstellation=useMemo(()=>constellation.filter((item)=>matchesSourceFilters(item,filters)),[constellation,filters])
  const groups=useMemo(()=>{const grouped=new Map<string,SourceItem[]>();filteredConstellation.forEach((item)=>{const role=item.cultivation_roles?.[0]||'OTHER';grouped.set(role,[...(grouped.get(role)||[]),item])});return[...grouped.entries()]},[filteredConstellation])
  useEffect(()=>{if(!returnConstellationKey||selectedConstellationKey)return;const group=premiumGroups.find((item)=>item.key===returnConstellationKey);if(!group)return;setSelectedConstellationKey(group.key);setSelectedCapacity(group.capacityKey);setConstellation(group.items);setMessage('');setLoading(false)},[returnConstellationKey,premiumGroups,selectedConstellationKey])
  const openCapacity=async(key:string)=>{onReturnConstellationChange(null);setSelectedConstellationKey(null);setSelectedCapacity(key);setLoading(true);setMessage('');try{const items=await discoverConstellation(key,null,navigator.language||'es-AR',16);setConstellation(items);if(!items.length)setMessage('No encontré una constelación suficientemente diversa para esta capacidad ahora.')}catch{setConstellation([]);setMessage('No pude componer esta constelación ahora.')}finally{setLoading(false)}}
  const openPremium=(key:string)=>{const group=premiumGroups.find((item)=>item.key===key);if(!group)return;onReturnConstellationChange(key);setSelectedConstellationKey(key);setSelectedCapacity(group.capacityKey);setConstellation(group.items);setMessage('');setLoading(false)}
  return <section className={selectedCapacity?'space-page explore-view constellation-open':'space-page explore-view'}><SpaceHero kicker="EXPLORAR" title="Explorar" text="Descubrí saberes, prácticas, experiencias y otras vidas para una vida más tuya." image={IMG.sunrise}/><div className="space-content"><div className="explore-toolbar"><div className="search-large"><Icon name="search"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar por tema, capacidad o palabra..."/></div><SourceFilters items={selectedCapacity?constellation:source} open={filtersOpen} setOpen={setFiltersOpen} filters={filters} setFilters={setFilters}/></div>{premiumGroups.length>0&&<section className="premium-constellation-showcase"><div className="section-heading"><h2>Constelaciones destacadas</h2><p>Composiciones cuidadas de saberes y prácticas que conservan procedencia y naturaleza propia.</p></div><div className="premium-constellation-grid">{premiumGroups.map((group)=><button type="button" key={group.key} onClick={()=>openPremium(group.key)} style={{backgroundImage:`linear-gradient(90deg,rgba(18,24,18,.76),rgba(18,24,18,.16)),url(${IMG.calm})`}}><small>CONSTELACIÓN PREMIUM</small><b>{group.capacityLabel}</b><span>{group.items.length} posibilidades · abrir constelación</span></button>)}</div></section>}{faroRelated.length>0&&<section id="related-to-faro"><div className="section-heading"><h2>Relacionado con tu Faro</h2><p>Posibilidades de Fuente conectadas con las Capacidades que elegiste cuidar. La relación orienta; no prescribe.</p></div><div className="source-grid">{faroRelated.map((item,index)=><ResourceCard key={item.help_id} item={item} index={index} authenticated={authenticated} onOpen={(resource)=>onOpen(resource as SourceItem)} onSave={onSave} taxonomy={taxonomy} contextLabel="RELACIONADO CON TU FARO"/>)}</div></section>}<div className="section-heading capability-heading"><h2>Capacidades</h2><p>Son lentes para orientar posibilidades, no niveles ni scores sobre tu vida.</p></div><div className="faro-large-grid">{(taxonomy?.capacities||[]).map((term,index)=><button key={term.key} className={selectedCapacity===term.key?'active':''} type="button" onClick={()=>void openCapacity(term.key)}><span>{['◎','◌','♡','◍','◇','◉','◈','○','◐','✦'][index%10]}</span><b>{term.label}</b><small>Componer constelación</small></button>)}</div>{selectedCapacity?<><div className={selectedConstellationKey?'constellation-hero premium':'constellation-hero'} style={{backgroundImage:`linear-gradient(90deg,rgba(18,24,18,.76),rgba(18,24,18,.18)),url(${IMG.calm})`}}><div><p className="eyebrow">{selectedConstellationKey?'CONSTELACIÓN PREMIUM · FUENTE':'CONSTELACIÓN · FUENTE'}</p><h1>{selectedLabel}</h1><p>{selectedConstellationKey?'Siete puertas complementarias para comprender, practicar, contemplar y pedir ayuda sin convertir la regulación en un programa.':'Una composición dinámica de formas complementarias. No es un programa.'}</p>{selectedConstellationKey&&<small>{selectedConstellationKey}</small>}</div></div>{loading&&<div className="empty-state">Componiendo desde Fuente…</div>}{message&&<div className="empty-state">{message}</div>}{!loading&&!message&&filteredConstellation.length===0&&<div className="empty-state">Ninguna posibilidad de esta constelación coincide con los filtros actuales.</div>}{groups.map(([role,items])=><section key={role}><div className="section-heading"><h2>{ROLE_LABEL[role]||'Otras maneras de acercarte'}</h2><p>{items.length} {items.length===1?'posibilidad':'posibilidades'}.</p></div><div className="source-grid">{items.map((item,index)=><SourceCard key={item.help_id} item={item} index={index} authenticated={authenticated} onOpen={onOpen} onSave={onSave} taxonomy={taxonomy}/>)}</div></section>)}<button className="ghost" type="button" onClick={()=>{onReturnConstellationChange(null);setSelectedCapacity(null);setSelectedConstellationKey(null);setConstellation([]);setMessage('')}}>Volver a todas las posibilidades</button></>:<><div className="section-heading"><h2>Posibilidades</h2><p>Exploración deliberada de Fuente. Cada pieza conserva naturaleza y origen.</p></div><div className="source-grid">{filtered.map((item,index)=><SourceCard key={item.help_id} item={item} index={index} authenticated={authenticated} onOpen={onOpen} onSave={onSave} taxonomy={taxonomy}/>)}</div>{!filtered.length&&<div className="empty-state">No hay posibilidades que coincidan con esta búsqueda y estos filtros.</div>}</>}</div></section>
}

function SanctuaryView({ entries,source,snapshot,refresh,go }: { entries:SanctuaryEntry[]; source:SourceItem[]; snapshot:ContinuitySnapshot|null; refresh:()=>Promise<void>; go:(space:Space)=>void }) {
  const [title,setTitle]=useState('')
  const [content,setContent]=useState('')
  const [filter,setFilter]=useState<'all'|'treasure'|'reflection'|'note'>('all')
  const [busy,setBusy]=useState(false)
  const [editingId,setEditingId]=useState<string|null>(null)
  const [editTitle,setEditTitle]=useState('')
  const [editContent,setEditContent]=useState('')
  const visible=filter==='all'?entries:entries.filter((entry)=>entry.entry_kind===filter)
  const related=useMemo(()=>relatedSanctuaryToActiveLife(entries,source,snapshot,3),[entries,source,snapshot])
  const save=async(e:FormEvent)=>{e.preventDefault();if(!content.trim())return;setBusy(true);try{await saveSanctuary('note',title.trim(),content.trim());setTitle('');setContent('');await refresh()}finally{setBusy(false)}}
  const download=async()=>{const data=await exportSanctuary();const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='mi-santuario-lumen.json';anchor.click();URL.revokeObjectURL(url)}
  const startEdit=(entry:SanctuaryEntry)=>{setEditingId(entry.entry_id);setEditTitle(entry.title||'');setEditContent(entry.content)}
  const saveEdit=async()=>{if(!editingId||!editContent.trim())return;setBusy(true);try{await updateSanctuary(editingId,editTitle.trim(),editContent.trim());setEditingId(null);setEditTitle('');setEditContent('');await refresh()}finally{setBusy(false)}}
  const filters:Array<[typeof filter,string]>=[['all','Todo'],['treasure','Tesoros'],['reflection','Reflexiones'],['note','Notas']]
  return <section className="space-page sanctuary-view"><SpaceHero kicker="SANTUARIO" title="Aquí vive lo que importa." text="Un espacio íntimo para conservar significado, no una carpeta de favoritos." image={IMG.journal}/><div className="space-content">{related.length>0&&<section><div className="section-heading"><h2>Conexiones con tu Faro</h2><p>Algo que vos guardaste y que conserva una relación trazable con lo que elegiste cuidar.</p></div><div className="filter-chips">{related.map((entry)=><button key={entry.entry_id} type="button" onClick={()=>document.getElementById(`sanctuary-${entry.entry_id}`)?.scrollIntoView({behavior:'smooth',block:'center'})}>{entry.title||'Volver a algo que guardaste'}</button>)}<button type="button" onClick={()=>go('life')}>Ver mi Faro</button></div></section>}<div className="sanctuary-toolbar"><div className="filter-chips">{filters.map(([key,label])=><button key={key} className={filter===key?'active':''} type="button" onClick={()=>setFilter(key)}>{label}</button>)}</div><button className="text-action" onClick={()=>void download()} type="button"><Icon name="download"/>Exportar lo mío</button></div><div className="sanctuary-grid-large">{visible.length?visible.map((entry,index)=><article id={`sanctuary-${entry.entry_id}`} key={entry.entry_id} className={index===0?'feature':''}><div className="entry-visual" style={{backgroundImage:`linear-gradient(0deg,rgba(28,31,24,.50),rgba(28,31,24,.06)),url(${[IMG.calm,IMG.journal,IMG.meeting,IMG.walk][index%4]})`}}/><div className="entry-copy"><small>{entry.entry_kind}</small>{editingId===entry.entry_id?<><input value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} placeholder="Título (opcional)"/><textarea value={editContent} onChange={(e)=>setEditContent(e.target.value)}/><div className="card-actions"><button className="primary small" type="button" disabled={busy||!editContent.trim()} onClick={()=>void saveEdit()}>Guardar cambios</button><button className="ghost small" type="button" disabled={busy} onClick={()=>setEditingId(null)}>Cancelar</button></div></>:<><h3>{entry.title||'Algo que elegiste conservar'}</h3><p>{entry.content}</p><div className="card-actions"><button className="ghost small" type="button" onClick={()=>startEdit(entry)}>Editar</button><button className="icon-action" type="button" onClick={async()=>{await deleteSanctuary(entry.entry_id);await refresh()}} aria-label="Eliminar"><Icon name="trash"/></button></div></>}</div></article>):<article className="empty-sanctuary"><span className="orb small"/><h3>{entries.length?'No hay elementos de este tipo.':'Tu Santuario empieza cuando algo importa para vos.'}</h3><p>Nada entra sin tu decisión.</p></article>}</div><form className="sanctuary-compose" onSubmit={save}><p className="section-label">UNA NOTA PARA VOS</p><input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Título (opcional)"/><textarea value={content} onChange={(e)=>setContent(e.target.value)} placeholder="Algo que quieras conservar..."/><button className="primary" disabled={busy||!content.trim()}>Conservar en mi Santuario</button></form></div></section>
}

function TissueSource({ items,onOpen,taxonomy }: { items:SourceItem[]; onOpen:(item:SourceItem)=>void; taxonomy?:SourceTaxonomy|null }) {
  return <div className="source-grid">{items.length?items.map((item,index)=><SourceCard key={item.help_id} item={item} index={index} authenticated={false} onOpen={onOpen} onSave={async()=>undefined} taxonomy={taxonomy}/>):<div className="empty-state">No hay posibilidades activas de este tipo en Fuente ahora. LUMEN no inventa personas ni servicios.</div>}</div>
}

function TissueView({ circles,source,snapshot,refresh,onOpen,taxonomy }: { circles:Circle[]; source:SourceItem[]; snapshot:ContinuitySnapshot|null; refresh:()=>Promise<void>; onOpen:(item:SourceItem)=>void; taxonomy?:SourceTaxonomy|null }) {
  const [name,setName]=useState('')
  const [purpose,setPurpose]=useState('')
  const [kind,setKind]=useState<TissueKind>('circles')
  const [busy,setBusy]=useState(false)
  const [joinToken,setJoinToken]=useState('')
  const [message,setMessage]=useState('')
  const [inviteTokens,setInviteTokens]=useState<Record<string,string>>({})
  const [shareSelection,setShareSelection]=useState<Record<string,string>>({})
  const create=async(e:FormEvent)=>{e.preventDefault();if(!name.trim()||!purpose.trim())return;setBusy(true);try{await createCircle(name.trim(),purpose.trim());setName('');setPurpose('');await refresh()}finally{setBusy(false)}}
  const join=async(e:FormEvent)=>{e.preventDefault();if(!joinToken.trim())return;setBusy(true);setMessage('');try{await joinCircle(joinToken.trim());setJoinToken('');setMessage('Entraste al círculo.');await refresh()}catch{setMessage('No pude entrar con esa invitación. Revisá el código o pedí uno nuevo.')}finally{setBusy(false)}}
  const invite=async(circle:Circle)=>{setBusy(true);setMessage('');try{const result=await createCircleInvite(circle.space_id);setInviteTokens((current)=>({...current,[circle.space_id]:result.invite_token}));setMessage('Invitación creada. Compartila sólo con quien quieras sumar.')}catch{setMessage('No pude crear la invitación.')}finally{setBusy(false)}}
  const share=async(circle:Circle)=>{const helpId=shareSelection[circle.space_id];if(!helpId)return;setBusy(true);setMessage('');try{await shareHelp(circle.space_id,helpId);setMessage('Posibilidad compartida en el círculo.');await refresh()}catch{setMessage('No pude compartir esa posibilidad.')}finally{setBusy(false)}}
  const leave=async(circle:Circle)=>{setBusy(true);setMessage('');try{await leaveCircle(circle.space_id);setMessage('Saliste del círculo.');await refresh()}catch{setMessage('No pude salir de ese círculo ahora.')}finally{setBusy(false)}}
  const report=async(circle:Circle)=>{setBusy(true);setMessage('');try{await reportCircle(circle.space_id,'other');setMessage('Gracias. El reporte quedó registrado sin convertir la intimidad del círculo en contenido.')}catch{setMessage('No pude registrar el reporte ahora.')}finally{setBusy(false)}}
  const relatedHuman=useMemo(()=>relatedSourceToActiveLife(source,snapshot,8).filter((item)=>['professional_support','institutional_service','human_action','conversation'].includes(item.help_type)),[source,snapshot])
  const professional=source.filter((item)=>item.help_type==='professional_support')
  const institutions=source.filter((item)=>item.help_type==='institutional_service')
  const actions=source.filter((item)=>['human_action','conversation'].includes(item.help_type))
  const tabs:Array<[TissueKind,string]>=[['circles','Círculos'],['professionals','Apoyo profesional'],['institutions','Instituciones'],['actions','Acciones humanas']]
  return <section className="space-page tissue-view"><SpaceHero kicker="TEJIDO" title="Juntos también se avanza." text="Personas, saberes y experiencias para una vida más humana, más consciente y más conectada." image={IMG.meeting}/><div className="space-content">{relatedHuman.length>0&&<section><div className="section-heading"><h2>Relacionado con tu Faro</h2><p>Presencias y ayudas humanas vinculadas con las Capacidades que elegiste cuidar.</p></div><TissueSource items={relatedHuman} onOpen={onOpen} taxonomy={taxonomy}/></section>}<div className="filter-chips tissue-filters">{tabs.map(([key,label])=><button key={key} className={kind===key?'active':''} type="button" onClick={()=>setKind(key)}>{label}</button>)}</div>{kind==='circles'&&<><div className="section-heading"><h2>Mis círculos y encuentros</h2><p>Espacios reales con propósito. Sin feed, likes ni ranking.</p></div><form className="inline-create" onSubmit={join}><input value={joinToken} onChange={(e)=>setJoinToken(e.target.value)} placeholder="Código de invitación para entrar a un círculo"/><button disabled={busy||!joinToken.trim()}>Entrar</button></form><div className="circle-large">{circles.map((circle,index)=><article key={circle.space_id}><img src={[IMG.meeting,IMG.journal,IMG.walk][index%3]} alt=""/><div><h3>{circle.name}</h3><p>{circle.purpose}</p><small>{circle.member_count} vidas · {circle.role}</small>{inviteTokens[circle.space_id]&&<p><b>Invitación:</b> {inviteTokens[circle.space_id]}</p>}<div className="card-actions">{circle.role==='host'&&<button className="ghost small" type="button" disabled={busy} onClick={()=>void invite(circle)}>Crear invitación</button>}<button className="ghost small" type="button" disabled={busy} onClick={()=>void leave(circle)}>Salir</button><button className="ghost small" type="button" disabled={busy} onClick={()=>void report(circle)}>Reportar</button></div><div className="inline-create"><select aria-label={`Posibilidad para compartir en ${circle.name}`} value={shareSelection[circle.space_id]||''} onChange={(e)=>setShareSelection((current)=>({...current,[circle.space_id]:e.target.value}))}><option value="">Compartir una posibilidad…</option>{source.slice(0,60).map((item)=><option key={item.help_id} value={item.help_id}>{item.title}</option>)}</select><button type="button" disabled={busy||!shareSelection[circle.space_id]} onClick={()=>void share(circle)}>Compartir</button></div></div></article>)}{!circles.length&&<div className="empty-state">Todavía no participás de ningún círculo.</div>}</div>{message&&<p className="status-message">{message}</p>}<form className="circle-create" onSubmit={create}><div><p className="section-label">ABRIR UN CÍRCULO</p><h2>Crear un espacio con propósito.</h2><p>LUMEN sostiene los bordes; las personas ocupan el centro.</p></div><input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Nombre del círculo"/><input value={purpose} onChange={(e)=>setPurpose(e.target.value)} placeholder="Para qué existe"/><button className="primary" disabled={busy||!name.trim()||!purpose.trim()}>Crear círculo</button></form></>}{kind==='professionals'&&<><div className="section-heading"><h2>Apoyo profesional</h2><p>Opciones activas y trazables desde Fuente.</p></div><TissueSource items={professional} onOpen={onOpen} taxonomy={taxonomy}/></>}{kind==='institutions'&&<><div className="section-heading"><h2>Instituciones y servicios</h2><p>Acceso, ayuda pública o institucional cuando corresponde.</p></div><TissueSource items={institutions} onOpen={onOpen} taxonomy={taxonomy}/></>}{kind==='actions'&&<><div className="section-heading"><h2>Acciones y conversaciones</h2><p>Formas de llevar la vida hacia otras vidas fuera de la pantalla.</p></div><TissueSource items={actions} onOpen={onOpen} taxonomy={taxonomy}/></>}</div></section>
}

function SearchView({ source,onOpen,taxonomy }: { source:SourceItem[]; onOpen:(item:SourceItem)=>void; taxonomy?:SourceTaxonomy|null }) {
  const [query,setQuery]=useState('')
  const [filtersOpen,setFiltersOpen]=useState(false)
  const [filters,setFilters]=useState<SourceFiltersState>(EMPTY_SOURCE_FILTERS)
  const results=useMemo(()=>{const q=query.trim().toLowerCase();if(!q)return[];return source.filter((item)=>`${item.title} ${item.summary} ${(item.areas||[]).join(' ')} ${(item.capacities||[]).join(' ')} ${item.provider?.name||''}`.toLowerCase().includes(q)).filter((item)=>matchesSourceFilters(item,filters))},[query,source,filters])
  return <section className="space-page explore-view"><SpaceHero kicker="BUSCAR" title="Buscar" text="Encontrá recursos, prácticas, experiencias y saberes sin perderte en un catálogo." image={IMG.sunrise}/><div className="space-content"><div className="explore-toolbar"><div className="search-large"><Icon name="search"/><input autoFocus value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="¿Qué estás buscando?"/></div><SourceFilters items={source} open={filtersOpen} setOpen={setFiltersOpen} filters={filters} setFilters={setFilters}/></div>{query.trim()?<><div className="section-heading"><h2>{results.length} resultados</h2><p>La búsqueda no modifica tu vida ni tu memoria.</p></div><TissueSource items={results} onOpen={onOpen} taxonomy={taxonomy}/></>:<div className="empty-state">Escribí algo para buscar en Fuente.</div>}</div></section>
}

function NotificationsView({ proactivity,refresh }: { proactivity:ProactivitySnapshot|null; refresh:()=>Promise<void> }) {
  const followups=proactivity?.followups||[]
  return <section className="space-page life-view"><SpaceHero kicker="NOTIFICACIONES" title="Continuidad sin perseguirte." text="Sólo aparecen retornos con razón y consentimiento." image={IMG.calm}/><div className="space-content"><div className="life-columns"><section><p className="section-label">PROACTIVIDAD</p><h2>{proactivity?.proactive_allowed?'Está activada por vos.':'Está desactivada.'}</h2><p>No se agenda nada sólo porque estuviste inactiva.</p></section><aside className="soft-control"><span>{proactivity?.proactive_allowed?'Permitida':'No permitida'}</span><button aria-label="Proactividad" type="button" className={proactivity?.proactive_allowed?'switch on':'switch'} onClick={async()=>{await setProactivity(!(proactivity?.proactive_allowed??false));await refresh()}}><i/></button></aside></div><div className="section-heading"><h2>Retornos acordados</h2><p>Podés cancelarlos en cualquier momento.</p></div><div className="path-grid">{followups.map((item)=><article key={item.followup_id}><span className="path-dot"/><div><b>{item.reason_code.replaceAll('_',' ')}</b><small>{new Date(item.due_at).toLocaleString()}</small><p>{item.cultivation_move?`Movimiento: ${item.cultivation_move}`:'Continuidad elegida'}</p><button className="ghost small" type="button" onClick={async()=>{await cancelFollowup(item.followup_id);await refresh()}}>Cancelar</button></div></article>)}{!followups.length&&<div className="empty-state">No hay retornos pendientes.</div>}</div></div></section>
}

function SettingsView({ snapshot,proactivity,refresh }: { snapshot:ContinuitySnapshot|null; proactivity:ProactivitySnapshot|null; refresh:()=>Promise<void> }) {
  return <section className="space-page sanctuary-view"><SpaceHero kicker="AJUSTES" title="Tu soberanía también se configura." text="Memoria y proactividad permanecen bajo tu control." image={IMG.journal}/><div className="space-content"><div className="life-columns"><section><p className="section-label">MEMORIA</p><h2>Recordar sólo con permiso.</h2><p>Podés apagar la memoria elegida sin perder tu derecho a seguir usando LUMEN.</p></section><aside className="soft-control"><span>{snapshot?.memory_allowed?'Activada':'Desactivada'}</span><button aria-label="Memoria" type="button" className={snapshot?.memory_allowed?'switch on':'switch'} onClick={async()=>{await setMemory(!(snapshot?.memory_allowed??false));await refresh()}}><i/></button></aside></div><div className="life-columns"><section><p className="section-label">PROACTIVIDAD</p><h2>Volver sólo cuando lo elegís.</h2><p>Ningún contacto por engagement. Los retornos necesitan razón y consentimiento.</p></section><aside className="soft-control"><span>{proactivity?.proactive_allowed?'Activada':'Desactivada'}</span><button aria-label="Proactividad" type="button" className={proactivity?.proactive_allowed?'switch on':'switch'} onClick={async()=>{await setProactivity(!(proactivity?.proactive_allowed??false));await refresh()}}><i/></button></aside></div></div></section>
}

export default function App() {
  const [space,setSpace]=useState<Space>('home')
  const [authChecked,setAuthChecked]=useState(false)
  const [authenticated,setAuthenticated]=useState(false)
  const [profile,setProfile]=useState<ViewerProfile|null>(null)
  const [email,setEmail]=useState('')
  const [otp,setOtp]=useState('')
  const [otpSent,setOtpSent]=useState(false)
  const [authError,setAuthError]=useState('')
  const [expression,setExpression]=useState('')
  const [stage,setStage]=useState<MomentStage>('idle')
  const [scene,setScene]=useState<S1Scene|null>(null)
  const [help,setHelp]=useState<ExperienceHelp|null>(null)
  const [momentConstellation,setMomentConstellation]=useState<SourceItem[]>([])
  const [capacityKeys,setCapacityKeys]=useState<string[]>([])
  const [selectedPathIds,setSelectedPathIds]=useState<string[]>([])
  const [createdTrajectoryId,setCreatedTrajectoryId]=useState<string|null>(null)
  const [snapshot,setSnapshot]=useState<ContinuitySnapshot|null>(null)
  const [taxonomy,setTaxonomy]=useState<SourceTaxonomy|null>(null)
  const [source,setSource]=useState<SourceItem[]>([])
  const [entries,setEntries]=useState<SanctuaryEntry[]>([])
  const [circles,setCircles]=useState<Circle[]>([])
  const [proactivity,setProactivityState]=useState<ProactivitySnapshot|null>(null)
  const [busy,setBusy]=useState(false)
  const [integrated,setIntegrated]=useState(false)
  const [sourceReturnConstellationKey,setSourceReturnConstellationKey]=useState<string|null>(null)

  const loadPublic=useCallback(async()=>{
    const [tax,items]=await Promise.all([getSourceTaxonomy(),discoverSource(null,null,null,navigator.language||'es-AR',100)])
    setTaxonomy(tax)
    setSource(items)
  },[])

  const loadPrivate=useCallback(async()=>{
    const [nextSnapshot,nextEntries,nextCircles,nextProactivity]=await Promise.all([getContinuitySnapshot(),listSanctuary(),getTissueSnapshot(),getProactivitySnapshot()])
    setSnapshot(nextSnapshot)
    setEntries(nextEntries)
    setCircles(nextCircles)
    setProactivityState(nextProactivity)
  },[])

  useEffect(()=>{void (async()=>{try{const auth=await getAuthSnapshot();setAuthenticated(Boolean(auth.session));setProfile(auth.user?viewerProfile(auth.user):null);if(auth.session){await bootstrapPerson();await loadPrivate()}await loadPublic()}finally{setAuthChecked(true)}})()},[loadPrivate,loadPublic])
  useEffect(()=>{window.dispatchEvent(new CustomEvent('lumen:space',{detail:{space}}))},[space])

  const go=(next:Space)=>{setSpace(next);if(next!=='home'&&stage!=='idle')setStage('idle')}
  const resetMoment=()=>{setStage('idle');setScene(null);setHelp(null);setMomentConstellation([]);setCapacityKeys([]);setSelectedPathIds([]);setCreatedTrajectoryId(null);setIntegrated(false)}

  const runMoment=async(value=expression)=>{
    const momentExpression=value.trim()
    if(!momentExpression)return
    if(momentExpression!==expression)setExpression(momentExpression)
    if(!authenticated){setStage('auth');return}
    setBusy(true)
    try{
      const nextScene=await accompanyMoment(momentExpression,navigator.language||'es-AR','es')
      setScene(nextScene)
      const primary=primaryHelpFromScene(nextScene)
      setHelp(primary)
      setCapacityKeys(nextScene.interpretation?.capacity_keys||[])
      if(nextScene.episode_id){
        try{
          const projection=await composeMomentConstellation(nextScene.episode_id,navigator.language||'es-AR',12)
          setMomentConstellation(projection.items)
          setCapacityKeys(projection.capacity_keys?.length?projection.capacity_keys:(nextScene.interpretation?.capacity_keys||[]))
          const primaryItem=projection.items.find((item)=>item.primary_now)||projection.items[0]
          if(primaryItem)setHelp(primaryItem)
          setSelectedPathIds(projection.items.filter((item)=>item.primary_now).map((item)=>item.help_id))
        }catch{setMomentConstellation([])}
      }
      setStage('scene')
    }finally{setBusy(false)}
  }

  const sendOtp=async()=>{setBusy(true);setAuthError('');try{await requestEmailOtp(email);setOtpSent(true)}catch{setAuthError('No pude enviar el código. Revisá el email e intentá de nuevo.')}finally{setBusy(false)}}
  const verifyOtp=async()=>{setBusy(true);setAuthError('');try{const auth=await verifyEmailOtp(email,otp);if(!auth.session)throw new Error('No session');await bootstrapPerson();setAuthenticated(true);setProfile(auth.user?viewerProfile(auth.user):null);setOtp('');setOtpSent(false);await loadPrivate();if(stage==='auth')await runMomentAfterAuth()}catch{setAuthError('Ese código no pudo verificarse. Podés pedir uno nuevo.')}finally{setBusy(false)}}
  const runMomentAfterAuth=async()=>{const nextScene=await accompanyMoment(expression.trim(),navigator.language||'es-AR','es');setScene(nextScene);const primary=primaryHelpFromScene(nextScene);setHelp(primary);setCapacityKeys(nextScene.interpretation?.capacity_keys||[]);if(nextScene.episode_id){try{const projection=await composeMomentConstellation(nextScene.episode_id,navigator.language||'es-AR',12);setMomentConstellation(projection.items);setCapacityKeys(projection.capacity_keys?.length?projection.capacity_keys:(nextScene.interpretation?.capacity_keys||[]));const primaryItem=projection.items.find((item)=>item.primary_now)||projection.items[0];if(primaryItem)setHelp(primaryItem);setSelectedPathIds(projection.items.filter((item)=>item.primary_now).map((item)=>item.help_id))}catch{setMomentConstellation([])}}setStage('scene')}

  const chooseMomentHelp=async(item:ExperienceHelp)=>{if(!scene?.episode_id)return;setBusy(true);try{const selection=await selectHelp(scene.episode_id,item.help_id,'selected');setHelp(isSourceItem(item)?item:selection.help);setStage('experience')}finally{setBusy(false)}}
  const momentOutcome=async(effect:OutcomeEffect)=>{if(!scene?.episode_id)return;setBusy(true);try{await recordOutcome(scene.episode_id,effect);setStage('closed');if(authenticated)await loadPrivate()}finally{setBusy(false)}}
  const integrateMoment=async()=>{if(!help)return;setBusy(true);try{await integrateHelp(help.help_id);setIntegrated(true);await loadPrivate()}finally{setBusy(false)}}
  const recomposeMomentForCapabilities=async(keys:string[])=>{
    if(!scene?.episode_id)return
    try{
      if(!keys.length){
        const projection=await composeMomentConstellation(scene.episode_id,navigator.language||'es-AR',12)
        setMomentConstellation(projection.items)
        setSelectedPathIds((current)=>current.filter((id)=>projection.items.some((item)=>item.help_id===id)))
        return
      }
      const areaKey=scene.interpretation?.area_keys?.[0]||null
      const groups=await Promise.all(keys.slice(0,4).map((key)=>discoverConstellation(key,areaKey,navigator.language||'es-AR',8)))
      const merged:Array<SourceItem>=[]
      const seen=new Set<string>()
      for(const group of groups)for(const item of group){if(!seen.has(item.help_id)){seen.add(item.help_id);merged.push(item)}}
      const next=merged.slice(0,12)
      setMomentConstellation(next)
      setSelectedPathIds((current)=>{
        const kept=current.filter((id)=>next.some((item)=>item.help_id===id))
        return kept.length?kept:(next[0]?[next[0].help_id]:[])
      })
    }catch{setMomentConstellation([])}
  }
  const changeMomentCapabilities=async(keys:string[])=>{setCapacityKeys(keys);if(createdTrajectoryId)await setTrajectoryCapabilities(createdTrajectoryId,keys);await recomposeMomentForCapabilities(keys)}
  const reexpressMoment=async(text:string)=>{
    if(!text.trim())return
    setBusy(true)
    try{
      setExpression(text.trim())
      const nextScene=await accompanyMoment(text.trim(),navigator.language||'es-AR','es')
      setScene(nextScene)
      setHelp(primaryHelpFromScene(nextScene))
      const initialKeys=nextScene.interpretation?.capacity_keys||[]
      setCapacityKeys(initialKeys)
      setCreatedTrajectoryId(null)
      setSelectedPathIds([])
      if(nextScene.episode_id){
        try{
          const projection=await composeMomentConstellation(nextScene.episode_id,navigator.language||'es-AR',12)
          setMomentConstellation(projection.items)
          const nextKeys=projection.capacity_keys?.length?projection.capacity_keys:initialKeys
          setCapacityKeys(nextKeys)
          const primaryItem=projection.items.find((item)=>item.primary_now)||projection.items[0]
          if(primaryItem)setHelp(primaryItem)
          setSelectedPathIds(primaryItem?[primaryItem.help_id]:[])
        }catch{setMomentConstellation([])}
      }
    }finally{setBusy(false)}
  }
  const createMomentFaro=async(text:string)=>{setBusy(true);try{const result=await createTrajectoryFromMoment(text,capacityKeys,scene?.moment_id||null);setCreatedTrajectoryId(result.trajectory_id);if(selectedPathIds.length)await saveConstellationToPath(result.trajectory_id,selectedPathIds);await loadPrivate()}finally{setBusy(false)}}
  const saveMomentPath=async()=>{if(!createdTrajectoryId||!selectedPathIds.length)return;setBusy(true);try{await saveConstellationToPath(createdTrajectoryId,selectedPathIds);await loadPrivate()}finally{setBusy(false)}}

  const openSource=async(item:SourceItem)=>{setSourceReturnConstellationKey(constellationKey(item));setHelp(item);setScene(null);setStage('experience')}
  const saveSource=async(item:SourceItem)=>{if(!authenticated){setEmail('');setSpace('sanctuary');return}await saveSanctuary('treasure',item.title,item.summary,item.help_id);await loadPrivate()}
  const closeExperience=()=>{if(scene?.episode_id)setStage('outcome');else setStage('idle')}

  const content=useMemo(()=>{
    if(stage==='auth')return <AuthFlow email={email} setEmail={setEmail} otp={otp} setOtp={setOtp} otpSent={otpSent} busy={busy} error={authError} onSend={()=>void sendOtp()} onVerify={()=>void verifyOtp()} onCancel={()=>resetMoment()}/>
    if(stage!=='idle')return <MomentFlow stage={stage} scene={scene} help={help} constellation={momentConstellation} capacityKeys={capacityKeys} taxonomy={taxonomy} expression={expression} busy={busy} selectedPathIds={selectedPathIds} createdTrajectoryId={createdTrajectoryId} onSelect={(item)=>void chooseMomentHelp(item)} onExperienceExit={closeExperience} onOutcome={(effect)=>void momentOutcome(effect)} onIntegrate={()=>void integrateMoment()} onClose={()=>{resetMoment();setSpace('home')}} onClarify={()=>{setStage('idle');setSpace('home')}} onReexpress={(text)=>void reexpressMoment(text)} onCapacityChange={(keys)=>void changeMomentCapabilities(keys)} onTogglePath={(helpId)=>setSelectedPathIds((current)=>current.includes(helpId)?current.filter((id)=>id!==helpId):[...current,helpId])} onCreateFaro={(text)=>void createMomentFaro(text)} onSavePath={()=>void saveMomentPath()} onOpenPath={()=>{resetMoment();setSpace('life')}} integrated={integrated}/>
    if(space==='home')return <PremiumHome expression={expression} setExpression={setExpression} submit={()=>void runMoment()} startPath={()=>void runMoment('Necesito recuperar mi espacio')} busy={busy} source={source} taxonomy={taxonomy} authenticated={authenticated} onOpen={(item)=>void openSource(item)} onSave={saveSource} go={go}/>
    if(space==='explore')return <ExploreView source={source} taxonomy={taxonomy} snapshot={snapshot} authenticated={authenticated} onOpen={(item)=>void openSource(item)} onSave={saveSource} returnConstellationKey={sourceReturnConstellationKey} onReturnConstellationChange={setSourceReturnConstellationKey}/>
    if(!authenticated&&!['search'].includes(space))return <PrivateGate name={space==='life'?'MI PROCESO':space==='sanctuary'?'SANTUARIO':space==='tissue'?'TEJIDO':'TU ESPACIO'} email={email} setEmail={setEmail} goHome={()=>setStage('auth')} goExplore={()=>go('explore')}/>
    if(space==='life')return <LifeView snapshot={snapshot} proactivity={proactivity} taxonomy={taxonomy} source={source} entries={entries} circles={circles} refresh={loadPrivate} onOpenSource={(item)=>void openSource(item)} go={go}/>
    if(space==='sanctuary')return <SanctuaryView entries={entries} source={source} snapshot={snapshot} refresh={loadPrivate} go={go}/>
    if(space==='tissue')return <TissueView circles={circles} source={source} snapshot={snapshot} refresh={loadPrivate} onOpen={(item)=>void openSource(item)} taxonomy={taxonomy}/>
    if(space==='search')return <SearchView source={source} onOpen={(item)=>void openSource(item)} taxonomy={taxonomy}/>
    if(space==='notifications')return <NotificationsView proactivity={proactivity} refresh={loadPrivate}/>
    return <SettingsView snapshot={snapshot} proactivity={proactivity} refresh={loadPrivate}/>
  },[stage,space,email,otp,otpSent,busy,authError,scene,help,momentConstellation,capacityKeys,taxonomy,expression,selectedPathIds,createdTrajectoryId,integrated,authenticated,profile,sourceReturnConstellationKey,source,snapshot,entries,circles,proactivity,loadPrivate])

  if(!authChecked)return <div className="boot-screen"><span className="orb"/><p>LUMEN</p></div>
  const logout=()=>void (async()=>{await signOut();setAuthenticated(false);setProfile(null);setSourceReturnConstellationKey(null);setSnapshot(null);setEntries([]);setCircles([]);setProactivityState(null);resetMoment();setSpace('home')})()
  return <div className="app-shell">{stage==='idle'&&<Topbar authenticated={authenticated} profile={profile} go={go} onSignOut={logout}/>}<Sidebar active={space} go={go} authenticated={authenticated} onSignOut={logout}/><main className="main-field">{content}</main></div>
}
