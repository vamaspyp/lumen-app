import { useEffect, useMemo, useRef, useState } from 'react'
import { recordOutcome, type HelpPossibility, type OutcomeEffect } from '../greenfield/application/s1'
import { beginDirectSourceExperience } from '../greenfield/application/source-feedback'
import type { SourceItem } from '../greenfield/application/embryo'
import { premiumFamily, sourceUrl } from './premium-source'

type Help = HelpPossibility | SourceItem
type Kind = 'editorial'|'practice'|'audio'|'video'|'external'|'human'|'group'|'action'|'quiet'
type DirectEpisode = Readonly<{ helpId: string; episodeId: string }>
type Obj = Record<string, unknown>

function contentOf(help: Help): Obj { return help.content || {} }
function str(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null }
function arr(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [] }
function objectArray(value: unknown): Obj[] { return Array.isArray(value) ? value.filter((item): item is Obj => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : [] }
function record(value: unknown): Obj { return value && typeof value === 'object' && !Array.isArray(value) ? value as Obj : {} }
function provider(help: Help): string | null { return 'provider' in help && help.provider ? help.provider.name : null }
function sourceItem(help: Help): SourceItem | null { return 'canonical_code' in help ? help as SourceItem : null }
function externalUrl(help: Help): string | null { const c = contentOf(help); return str(c.external_url) || str(c.url) || str(c.href) }
function mediaUrl(help: Help, kind: 'audio'|'video'): string | null { const c = contentOf(help); return str(c[`${kind}_url`]) || str(c.media_url) || str(c.asset_url) || str(c.src) }
function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${rest}`
}

const EXPERIENCE_IMAGE: Record<Kind,string> = {
  editorial:'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1800&q=90',
  practice:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1800&q=90',
  audio:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd4297?auto=format&fit=crop&w=1800&q=90',
  video:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=90',
  external:'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=90',
  human:'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1800&q=90',
  group:'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1800&q=90',
  action:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=90',
  quiet:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd4297?auto=format&fit=crop&w=1800&q=90',
}

function premiumHeroImage(kind:Kind,premium:string|null):string {
  if (premium==='audio_practice') return 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd4297?auto=format&fit=crop&w=1800&q=90'
  if (premium==='contemplative_reading_audio') return EXPERIENCE_IMAGE.practice
  if (premium==='classic_reading'||premium==='illustrated_guide') return EXPERIENCE_IMAGE.editorial
  if (premium==='video_or_audio_visual_sequence') return EXPERIENCE_IMAGE.video
  if (premium==='health_reference') return 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1800&q=90'
  return EXPERIENCE_IMAGE[kind]
}

function kindOf(help: Help): Kind {
  const type = help.help_type.toLowerCase().replace(/[-\s]+/g, '_')
  if (type.includes('audio') || mediaUrl(help, 'audio')) return 'audio'
  if (type.includes('video') || type.includes('film') || mediaUrl(help, 'video')) return 'video'
  if (type.includes('quiet') || type.includes('silence') || type.includes('stillness') || type.includes('no_content')) return 'quiet'
  if (type.includes('practice') || type.includes('breath') || type.includes('meditation') || type.includes('exercise')) return 'practice'
  if (type.includes('circle') || type.includes('group') || type.includes('community')) return 'group'
  if (type.includes('person') || type.includes('mentor') || type.includes('professional') || type.includes('human_support')) return 'human'
  if (type.includes('conversation') || type.includes('action') || type.includes('event') || type.includes('place') || type.includes('service') || type.includes('material')) return 'action'
  if (externalUrl(help) || type.includes('resource') || type.includes('book') || type.includes('work')) return 'external'
  return 'editorial'
}

function BackIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7"/></svg>
}
function PlayIcon({ pause=false }: { pause?: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{pause?<><path d="M9 7v10"/><path d="M15 7v10"/></>:<path d="m9 7 8 5-8 5Z"/>}</svg>
}

function ExperienceHero({ kind,premium,eyebrow,title,deck,onExit,sourceName }: { kind:Kind; premium:string|null; eyebrow:string; title:string; deck:string; onExit:()=>void; sourceName?:string|null }) {
  return <header className="experience-feature-hero" style={{backgroundImage:`linear-gradient(90deg,rgba(18,24,20,.76),rgba(18,24,20,.12)),url(${premiumHeroImage(kind,premium)})`}}>
    <div className="experience-topbar">
      <button type="button" className="experience-back" onClick={onExit} aria-label="Volver"><BackIcon/></button>
      <span className="experience-brand">LUMEN · FUENTE</span>
      <span className="experience-source-mark">{sourceName || ''}</span>
    </div>
    <div className="experience-hero-copy">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{deck}</p>
    </div>
  </header>
}

function FindList({ label='QUÉ VAS A ENCONTRAR', items }: { label?: string; items:string[] }) {
  if (!items.length) return null
  return <section className="premium-find premium-find-list"><small>{label}</small>{items.slice(0,5).map((item,index)=><span key={`${item}-${index}`}><i aria-hidden="true">✦</i>{item}</span>)}</section>
}

function AfterCard({ label='PARA LLEVAR A LA VIDA', text }: { label?:string; text:string|null }) {
  if (!text) return null
  return <div className="experience-after-card"><small>{label}</small><p>{text}</p></div>
}

function SourcePanel({ sourceName,sourceLabel,rights,destination,cta='Abrir fuente original' }: { sourceName:string|null; sourceLabel:string|null; rights:string|null; destination:string|null; cta?:string }) {
  if (!sourceName && !sourceLabel && !destination && !rights) return null
  return <section className="experience-source-panel">
    <div className="source-leaf" aria-hidden="true">⌁</div>
    <div>
      <small>FUENTE</small>
      <h3>{sourceLabel || sourceName || 'Fuente original'}</h3>
      {rights&&<p>{rights}</p>}
    </div>
    {destination&&<a className="source-open-link" href={destination} target="_blank" rel="noreferrer" aria-label={cta}>↗</a>}
  </section>
}

function PremiumAudioPlayer({ src }: { src:string }) {
  const audioRef=useRef<HTMLAudioElement>(null)
  const [playing,setPlaying]=useState(false)
  const [current,setCurrent]=useState(0)
  const [duration,setDuration]=useState(0)
  const [rate,setRate]=useState(1)

  useEffect(()=>{setPlaying(false);setCurrent(0);setDuration(0)},[src])

  const toggle=async()=>{
    const audio=audioRef.current
    if(!audio)return
    if(audio.paused){await audio.play();setPlaying(true)}else{audio.pause();setPlaying(false)}
  }
  const changeRate=()=>{
    const audio=audioRef.current
    const next=rate===1?1.25:rate===1.25?1.5:1
    if(audio)audio.playbackRate=next
    setRate(next)
  }
  const seek=(value:number)=>{
    const audio=audioRef.current
    if(!audio)return
    audio.currentTime=value
    setCurrent(value)
  }

  return <div className="premium-audio-player">
    <audio ref={audioRef} src={src} preload="metadata" onLoadedMetadata={(e)=>setDuration(e.currentTarget.duration||0)} onTimeUpdate={(e)=>setCurrent(e.currentTarget.currentTime)} onPause={()=>setPlaying(false)} onPlay={()=>setPlaying(true)} onEnded={()=>setPlaying(false)}/>
    <button type="button" className="audio-play" onClick={()=>void toggle()} aria-label={playing?'Pausar':'Reproducir'}><PlayIcon pause={playing}/></button>
    <div className="audio-track">
      <div className="audio-wave" aria-hidden="true">{Array.from({length:38},(_,index)=><i key={index} style={{height:`${12+((index*17)%27)}px`}}/>)}</div>
      <input aria-label="Progreso del audio" type="range" min="0" max={duration||1} step="0.1" value={Math.min(current,duration||1)} onChange={(e)=>seek(Number(e.target.value))}/>
      <div className="audio-time"><span>{formatTime(current)}</span><span>−{formatTime(Math.max(0,duration-current))}</span></div>
    </div>
    <button type="button" className="audio-rate" onClick={changeRate} aria-label="Velocidad de reproducción">{rate}×</button>
  </div>
}

function SourceMediaLaunch({ kind='audio',destination,cta }: { kind?:'audio'|'video'|'practice'; destination:string|null; cta:string }) {
  if(!destination)return <div className="media-boundary">La fuente todavía no ofrece un acceso directo utilizable desde esta experiencia. LUMEN no simula un reproductor inexistente.</div>
  return <a className={`source-media-launch ${kind}`} href={destination} target="_blank" rel="noreferrer">
    <span className="source-media-play"><PlayIcon/></span>
    <span><small>{kind==='video'?'FUENTE AUDIOVISUAL':kind==='practice'?'PRÁCTICA ORIGINAL':'AUDIO ORIGINAL'}</small><b>{cta}</b><em>Se abre en la fuente original ↗</em></span>
  </a>
}

function PremiumSourceExperience({ help,premium,onExit,onFinish }: { help:Help; premium:string; onExit:()=>void; onFinish:()=>void }) {
  const content=contentOf(help)
  const wrapper=record(content.lumen_wrapper)
  const manifest=record(content.experience_manifest)
  const entrance=record(manifest.entrance)
  const experience=record(manifest.experience)
  const continuity=record(manifest.continuity)
  const accessibility=record(manifest.accessibility)
  const destination=sourceItem(help) ? (sourceUrl(sourceItem(help) as SourceItem) || externalUrl(help)) : externalUrl(help)
  const sourceName=provider(help)
  const sourceLabel=str(content.source_label)
  const rights=str(wrapper.rights_note)||str(content.rights_note)
  const deck=str(entrance.deck)||str(wrapper.deck)||help.summary
  const eyebrow=str(entrance.eyebrow)||str(wrapper.eyebrow)||sourceName||'FUENTE ORIGINAL'
  const after=str(wrapper.after_prompt)||str(experience.after)||str(continuity.return_prompt)
  const find=arr(wrapper.what_you_find)
  const sections=arr(experience.sections)
  const structuredSections=objectArray(experience.sections)
  const pullouts=arr(experience.pullouts)
  const cta=str(content.cta_label)||'Abrir fuente original'
  const directAudio=mediaUrl(help,'audio')
  const directVideo=mediaUrl(help,'video')

  return <div className={`experience-premium-page premium-family-${premium}`}>
    <ExperienceHero kind="external" premium={premium} eyebrow={eyebrow} title={help.title} deck={deck} onExit={onExit} sourceName={sourceName}/>
    <main className="experience-premium-body">
      {premium==='illustrated_guide'&&<>
        <div className="premium-section-heading"><small>QUÉ OFRECE</small><h2>Una obra para entrar por donde hoy tenga sentido.</h2></div>
        {structuredSections.length>0?<div className="premium-offer-list">{structuredSections.map((section,index)=>{
          const label=str(section.label)||`Parte ${index+1}`
          const body=str(section.body)
          const items=arr(section.items)
          return <article key={`${label}-${index}`}><div className="offer-image" style={{backgroundImage:`url(${[EXPERIENCE_IMAGE.editorial,EXPERIENCE_IMAGE.practice,EXPERIENCE_IMAGE.audio][index%3]})`}}/><div><h3>{label}</h3>{body&&<p>{body}</p>}{items.length>0&&<p>{items.join(' · ')}</p>}</div></article>
        })}</div>:<FindList items={find}/>}
        {pullouts[0]&&<blockquote className="experience-quote">{pullouts[0]}</blockquote>}
        <SourcePanel sourceName={sourceName} sourceLabel={sourceLabel} rights={rights} destination={destination} cta={cta}/>
        <AfterCard text={after}/>
      </>}

      {premium==='audio_practice'&&<>
        <section className="experience-media-card audio-source-card">
          {directAudio?<PremiumAudioPlayer src={directAudio}/>:<SourceMediaLaunch kind="audio" destination={destination} cta={cta}/>}
        </section>
        <FindList items={find}/>
        <SourcePanel sourceName={sourceName} sourceLabel={sourceLabel} rights={rights} destination={destination} cta={cta}/>
        <AfterCard label="PARA DESPUÉS" text={after}/>
      </>}

      {premium==='contemplative_reading_audio'&&<>
        <section className="contemplative-intro"><span className="quiet-mark" aria-hidden="true">◌</span><p>{str(experience.opening)||deck}</p></section>
        <SourceMediaLaunch kind="practice" destination={destination} cta={cta}/>
        <FindList items={find}/>
        <SourcePanel sourceName={sourceName} sourceLabel={sourceLabel} rights={rights} destination={destination} cta={cta}/>
        <AfterCard text={after}/>
      </>}

      {premium==='classic_reading'&&<>
        <section className="classic-reading-intro"><small>OBRA PRIMARIA</small><p>{str(experience.opening)||deck}</p></section>
        {str(experience.reading_mode)&&<p className="media-boundary">{str(experience.reading_mode)}</p>}
        <SourcePanel sourceName={sourceName} sourceLabel={sourceLabel} rights={rights} destination={destination} cta={cta}/>
        <AfterCard text={after}/>
      </>}

      {premium==='video_or_audio_visual_sequence'&&<>
        <section className="experience-media-card video-card">
          {directVideo?<video controls playsInline src={directVideo}/>:<SourceMediaLaunch kind="video" destination={destination} cta={cta}/>}
        </section>
        {str(experience.primary_source)&&<p className="source-focus">{str(experience.primary_source)}</p>}
        <SourcePanel sourceName={sourceName} sourceLabel={sourceLabel} rights={rights} destination={destination} cta={cta}/>
        <AfterCard text={after}/>
      </>}

      {premium==='health_reference'&&<>
        <div className="premium-section-heading"><small>COMPRENSIÓN SANITARIA</small><h2>Información para comprender sin convertir información en diagnóstico.</h2></div>
        {sections.length>0&&<div className="health-sections">{sections.map((item,index)=><article key={item}><span>{String(index+1).padStart(2,'0')}</span><h3>{item}</h3></article>)}</div>}
        {Boolean(accessibility.plain_language)&&<p className="media-boundary">La fuente ofrece información sanitaria en lenguaje accesible. El detalle médico permanece en la fuente original.</p>}
        <SourcePanel sourceName={sourceName} sourceLabel={sourceLabel} rights={rights} destination={destination} cta={cta}/>
        <AfterCard text={after}/>
      </>}

      {!['illustrated_guide','audio_practice','contemplative_reading_audio','classic_reading','video_or_audio_visual_sequence','health_reference'].includes(premium)&&<>
        <FindList items={find}/>
        <SourcePanel sourceName={sourceName} sourceLabel={sourceLabel} rights={rights} destination={destination} cta={cta}/>
        <AfterCard text={after}/>
      </>}

      <div className="experience-finish-row"><button className="ghost" type="button" onClick={onFinish}>Volver a LUMEN</button></div>
    </main>
  </div>
}

export function Experience({ help, onExit, onFeedback }: { help: Help; onExit: () => void; onFeedback?: (effect: OutcomeEffect) => void | Promise<void> }) {
  const kind = useMemo(() => kindOf(help), [help])
  const content = contentOf(help)
  const [step, setStep] = useState(0)
  const [reflecting, setReflecting] = useState(false)
  const [sending, setSending] = useState(false)
  const [directEpisode, setDirectEpisode] = useState<DirectEpisode | null>(null)
  const steps = arr(content.steps).length ? arr(content.steps) : arr(content.structure)
  const body = arr(content.paragraphs)
  const prompt = str(content.prompt) || str(content.template) || str(content.note)
  const current = steps[step] || prompt || help.summary
  const media = kind === 'audio' ? mediaUrl(help, 'audio') : kind === 'video' ? mediaUrl(help, 'video') : null
  const premium = sourceItem(help) ? premiumFamily(sourceItem(help) as SourceItem) : null
  const destination = sourceItem(help) ? (sourceUrl(sourceItem(help) as SourceItem) || externalUrl(help)) : externalUrl(help)
  const phone = str(content.phone)
  const availability = str(content.availability)
  const access = str(content.access)
  const parentOwnsOutcome = 'help_version_id' in help
  const directEpisodeId = directEpisode?.helpId === help.help_id ? directEpisode.episodeId : null

  useEffect(() => {
    let cancelled = false
    if (parentOwnsOutcome) return () => { cancelled = true }
    void beginDirectSourceExperience(help.help_id, navigator.language || 'es-AR', 'es')
      .then((result) => { if (!cancelled) setDirectEpisode({ helpId: help.help_id, episodeId: result.episode_id }) })
      .catch(() => { /* Public exploration remains available without forcing identification. */ })
    return () => { cancelled = true }
  }, [help.help_id, parentOwnsOutcome])

  const finish = () => (onFeedback || !parentOwnsOutcome) ? setReflecting(true) : onExit()
  const feedback = async (effect: OutcomeEffect) => {
    setSending(true)
    try {
      if (onFeedback) await onFeedback(effect)
      else if (directEpisodeId) await recordOutcome(directEpisodeId, effect)
      onExit()
    } finally { setSending(false) }
  }

  if (reflecting) return <section className="experience experience-return"><button className="experience-close" type="button" onClick={onExit} aria-label="Salir sin responder">×</button><div className="experience-return-inner"><div className="experience-lumi return"><span className="orb tiny"/><small>LUMI · RETORNO</small></div><p className="eyebrow">DESPUÉS DE VIVIRLO</p><h1>¿Cómo fue para vos?</h1><p>No hace falta explicar. Esta señal ayuda a que LUMEN acompañe mejor sin convertir tu vida en una métrica.</p><div className="outcome-row premium"><button type="button" disabled={sending} onClick={() => void feedback('helped')}>Me ayudó</button><button type="button" disabled={sending} onClick={() => void feedback('unsure')}>No estoy segura</button><button type="button" disabled={sending} onClick={() => void feedback('not_helped')}>No me ayudó</button></div><button className="text-action return-skip" type="button" onClick={onExit}>Prefiero no responder</button></div></section>

  if (premium) return <section className="experience experience-premium-source"><PremiumSourceExperience help={help} premium={premium} onExit={onExit} onFinish={finish}/></section>

  return <section className={`experience experience-${kind}`}>
    {kind === 'practice' && <div className="experience-premium-page"><ExperienceHero kind={kind} premium={null} eyebrow={`PRÁCTICA GUIADA · ${help.duration_minutes ? `${help.duration_minutes} MIN` : 'A TU RITMO'}`} title={help.title} deck={help.summary} onExit={onExit}/><div className="experience-premium-body"><section className="practice-stage"><div className="breath-orb"/><p className="section-label">AHORA</p><h2>{current}</h2>{steps.length > 1 && <div className="step-dots">{steps.map((_, index) => <i key={index} className={index <= step ? 'done' : ''}/>)}</div>}<div className="button-row center">{steps.length > 1 && step < steps.length - 1 ? <button className="primary" type="button" onClick={() => setStep((value) => value + 1)}>Seguir</button> : <button className="primary" type="button" onClick={finish}>Terminé</button>}<button className="ghost" type="button" onClick={onExit}>Salir cuando quieras</button></div></section>{steps.length>1&&<FindList items={steps.slice(0,3)}/>}<AfterCard text={prompt}/></div></div>}

    {kind === 'editorial' && <div className="experience-premium-page"><ExperienceHero kind={kind} premium={null} eyebrow={`LECTURA EDITORIAL${help.duration_minutes ? ` · ${help.duration_minutes} MIN` : ''}`} title={help.title} deck={help.summary} onExit={onExit} sourceName={provider(help)}/><div className="editorial-layout premium-editorial"><header><p className="section-label">LECTURA</p><h2>{str(content.heading) || str(content.subtitle) || 'Una mirada para llevar a la vida.'}</h2></header><article>{(body.length ? body : [str(content.intro), str(content.body), help.summary].filter((value): value is string => Boolean(value))).map((paragraph, index) => <p key={index} className={index === 0 ? 'lede' : ''}>{paragraph}</p>)}{str(content.quote) && <blockquote>{str(content.quote)}</blockquote>}<AfterCard text={prompt}/><div className="button-row"><button className="primary" type="button" onClick={finish}>Terminé de leer</button></div></article></div></div>}

    {kind === 'audio' && <div className="experience-premium-page"><ExperienceHero kind={kind} premium={null} eyebrow={`AUDIO · ${help.duration_minutes ? `${help.duration_minutes} MIN` : 'A TU RITMO'}`} title={help.title} deck={help.summary} onExit={onExit} sourceName={provider(help)}/><div className="experience-premium-body"><section className="experience-media-card">{media ? <PremiumAudioPlayer src={media}/> : <div className="media-boundary">El audio todavía no está publicado. LUMEN no simula una experiencia inexistente.</div>}</section><FindList items={steps.slice(0,3)}/><AfterCard label="PARA DESPUÉS" text={prompt}/><button className="ghost" type="button" onClick={finish}>Terminé</button></div></div>}

    {kind === 'video' && <div className="experience-premium-page"><ExperienceHero kind={kind} premium={null} eyebrow={`VIDEO${help.duration_minutes ? ` · ${help.duration_minutes} MIN` : ''}`} title={help.title} deck={help.summary} onExit={onExit} sourceName={provider(help)}/><div className="experience-premium-body"><section className="experience-media-card video-card">{media ? <video controls playsInline src={media}/> : <div className="video-empty"><span className="orb"/><p>El audiovisual todavía no tiene un asset publicado. LUMEN no lo finge.</p></div>}</section><AfterCard text={prompt}/><button className="ghost" type="button" onClick={finish}>Terminé</button></div></div>}

    {kind === 'external' && <div className="experience-premium-page"><ExperienceHero kind={kind} premium={null} eyebrow="OBRA / RECURSO EXTERNO" title={help.title} deck={help.summary} onExit={onExit} sourceName={provider(help)}/><div className="experience-premium-body"><SourcePanel sourceName={provider(help)} sourceLabel={str(content.source_label)} rights={str(content.rights_note)} destination={destination}/><div className="experience-finish-row"><button className="ghost" type="button" onClick={finish}>Volver a LUMEN</button></div></div></div>}

    {(kind === 'human' || kind === 'group') && <div className="experience-premium-page"><ExperienceHero kind={kind} premium={null} eyebrow={kind === 'human' ? 'ENCUENTRO HUMANO' : 'CÍRCULO / GRUPO'} title={help.title} deck={help.summary} onExit={onExit} sourceName={provider(help)}/><div className="experience-premium-body"><section className="human-premium-card"><div className="human-symbol">{help.title.slice(0,1).toUpperCase()}</div>{(phone || availability || access) && <div className="help-meta">{phone && <span>{phone}</span>}{availability && <span>{availability}</span>}{access && <span>{access}</span>}</div>}{prompt && <p>{prompt}</p>}<p className="media-boundary">Cuando empieza el encuentro, LUMEN se corre. La otra vida ocupa el centro.</p><div className="button-row center">{destination && <a className="primary as-link" href={destination} target="_blank" rel="noreferrer">Ver cómo acceder ↗</a>}{phone && <a className="ghost as-link" href={`tel:${phone.replace(/[^+\d]/g, '')}`}>Llamar</a>}<button className="ghost" type="button" onClick={finish}>Volver</button></div></section></div></div>}

    {kind === 'action' && <div className="experience-premium-page"><ExperienceHero kind={kind} premium={null} eyebrow="ACCIÓN EN LA VIDA" title={help.title} deck={help.summary} onExit={onExit} sourceName={provider(help)}/><div className="experience-premium-body"><section className="human-premium-card">{prompt && <p>{prompt}</p>}{steps.length > 0 && <ol className="action-steps">{steps.map((item) => <li key={item}>{item}</li>)}</ol>}{(phone || availability || access) && <div className="help-meta">{phone && <span>{phone}</span>}{availability && <span>{availability}</span>}{access && <span>{access}</span>}</div>}<p className="media-boundary">Lo importante ocurre fuera de la pantalla.</p><div className="button-row center">{destination && <a className="primary as-link" href={destination} target="_blank" rel="noreferrer">Abrir acceso ↗</a>}{phone && <a className="ghost as-link" href={`tel:${phone.replace(/[^+\d]/g, '')}`}>Llamar</a>}<button className={destination || phone ? 'ghost' : 'primary'} type="button" onClick={finish}>{destination || phone ? 'Volver' : 'Salir a vivirlo'}</button></div></section></div></div>}

    {kind === 'quiet' && <div className="experience-center quiet"><span className="orb quiet-orb"/><p className="eyebrow">QUIETUD</p><h1>{help.title}</h1><p>{help.summary}</p><button className="ghost" type="button" onClick={finish}>Cuando quieras, volver</button></div>}
  </section>
}
