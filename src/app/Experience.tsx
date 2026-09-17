import { useMemo, useState } from 'react'
import type { HelpPossibility, OutcomeEffect } from '../greenfield/application/s1'
import type { SourceItem } from '../greenfield/application/embryo'

type Help = HelpPossibility | SourceItem

type Kind = 'editorial'|'practice'|'audio'|'video'|'external'|'human'|'group'|'action'|'quiet'

function contentOf(help: Help): Record<string, unknown> { return help.content || {} }
function str(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null }
function arr(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [] }
function provider(help: Help): string | null { return 'provider' in help && help.provider ? help.provider.name : null }
function externalUrl(help: Help): string | null { const c = contentOf(help); return str(c.external_url) || str(c.url) || str(c.href) }
function mediaUrl(help: Help, kind: 'audio'|'video'): string | null { const c = contentOf(help); return str(c[`${kind}_url`]) || str(c.media_url) || str(c.asset_url) || str(c.src) }

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

export function Experience({ help, onExit, onFeedback }: { help: Help; onExit: () => void; onFeedback?: (effect: OutcomeEffect) => void | Promise<void> }) {
  const kind = useMemo(() => kindOf(help), [help])
  const content = contentOf(help)
  const [step, setStep] = useState(0)
  const [reflecting, setReflecting] = useState(false)
  const [sending, setSending] = useState(false)
  const steps = arr(content.steps).length ? arr(content.steps) : arr(content.structure)
  const body = arr(content.paragraphs)
  const prompt = str(content.prompt) || str(content.template) || str(content.note)
  const current = steps[step] || prompt || help.summary
  const media = kind === 'audio' ? mediaUrl(help, 'audio') : kind === 'video' ? mediaUrl(help, 'video') : null
  const destination = externalUrl(help)
  const phone = str(content.phone)
  const availability = str(content.availability)
  const access = str(content.access)
  const parentOwnsOutcome = 'help_version_id' in help && !help.from_own_repertoire
  const finish = () => parentOwnsOutcome ? onExit() : setReflecting(true)
  const feedback = async (effect: OutcomeEffect) => {
    setSending(true)
    try { await onFeedback?.(effect); onExit() } finally { setSending(false) }
  }

  if (reflecting) return <section className="experience experience-return"><button className="experience-close" type="button" onClick={onExit} aria-label="Salir sin responder">×</button><div className="experience-return-inner"><div className="experience-lumi return"><span className="orb tiny"/><small>LUMI · RETORNO</small></div><p className="eyebrow">DESPUÉS DE VIVIRLO</p><h1>¿Cómo fue para vos?</h1><p>No hace falta explicar. Esta señal ayuda a que LUMEN acompañe mejor sin convertir tu vida en una métrica.</p><div className="outcome-row premium"><button type="button" disabled={sending} onClick={() => void feedback('helped')}>Me ayudó</button><button type="button" disabled={sending} onClick={() => void feedback('unsure')}>No estoy segura</button><button type="button" disabled={sending} onClick={() => void feedback('not_helped')}>No me ayudó</button></div><button className="text-action return-skip" type="button" onClick={onExit}>Prefiero no responder</button></div></section>

  return <section className={`experience experience-${kind}`}>
    <button className="experience-close" type="button" onClick={onExit} aria-label="Salir de la experiencia">×</button>
    <div className="experience-lumi"><span className="orb tiny"/><small>LUMI · PRESENCIA MÍNIMA</small></div>
    {kind === 'practice' && <div className="experience-center"><p className="eyebrow">PRÁCTICA · {help.duration_minutes ? `${help.duration_minutes} MIN` : 'A TU RITMO'}</p><h1>{help.title}</h1><div className="breath-orb"/><p className="practice-copy">{current}</p>{steps.length > 1 && <div className="step-dots">{steps.map((_, index) => <i key={index} className={index <= step ? 'done' : ''}/>)}</div>}<div className="button-row center">{steps.length > 1 && step < steps.length - 1 ? <button className="primary" type="button" onClick={() => setStep((value) => value + 1)}>Seguir</button> : <button className="primary" type="button" onClick={finish}>Terminé</button>}<button className="ghost" type="button" onClick={onExit}>Salir cuando quieras</button></div></div>}
    {kind === 'editorial' && <div className="editorial-layout"><header><p className="eyebrow">{provider(help) || 'LUMEN · PERSPECTIVA'}</p><h1>{help.title}</h1><p>{help.summary}</p></header><article>{(body.length ? body : [str(content.intro), str(content.body), help.summary].filter((value): value is string => Boolean(value))).map((paragraph, index) => <p key={index} className={index === 0 ? 'lede' : ''}>{paragraph}</p>)}{str(content.quote) && <blockquote>{str(content.quote)}</blockquote>}<div className="button-row"><button className="primary" type="button" onClick={finish}>Terminé de leer</button></div></article></div>}
    {kind === 'audio' && <div className="experience-center media"><div className="audio-halo"><i/><i/><i/></div><p className="eyebrow">ESCUCHA</p><h1>{help.title}</h1><p>{help.summary}</p>{media ? <audio controls preload="metadata" src={media}/> : <p className="media-boundary">Esta posibilidad está preparada para audio. El asset todavía no está publicado; LUMEN no simula una experiencia inexistente.</p>}<button className="ghost" type="button" onClick={finish}>Terminé</button></div>}
    {kind === 'video' && <div className="video-layout">{media ? <video controls playsInline src={media}/> : <div className="video-empty"><span className="orb"/><p>El audiovisual todavía no tiene un asset publicado. LUMEN no lo finge.</p></div>}<div><p className="eyebrow">AUDIOVISUAL</p><h1>{help.title}</h1><p>{help.summary}</p><button className="ghost" type="button" onClick={finish}>Terminé</button></div></div>}
    {kind === 'external' && <div className="experience-center"><p className="eyebrow">OBRA / RECURSO EXTERNO</p><h1>{help.title}</h1><p>{help.summary}</p>{provider(help) && <small className="source-line">Fuente: {provider(help)}</small>}<p className="media-boundary">LUMEN te acompaña hasta la puerta; la obra sigue siendo de su fuente.</p><div className="button-row center">{destination && <a className="primary as-link" href={destination} target="_blank" rel="noreferrer">Abrir en su fuente ↗</a>}<button className="ghost" type="button" onClick={finish}>Volver a LUMEN</button></div></div>}
    {(kind === 'human' || kind === 'group') && <div className="experience-center human"><div className="human-symbol">{help.title.slice(0,1).toUpperCase()}</div><p className="eyebrow">{kind === 'human' ? 'ENCUENTRO HUMANO' : 'CÍRCULO / GRUPO'}</p><h1>{help.title}</h1><p>{help.summary}</p>{provider(help) && <small className="source-line">{provider(help)}</small>} {(phone || availability || access) && <div className="help-meta">{phone && <span>{phone}</span>}{availability && <span>{availability}</span>}{access && <span>{access}</span>}</div>}{prompt && <p className="practice-copy">{prompt}</p>}<p className="media-boundary">Cuando empieza el encuentro, LUMEN se corre. La otra vida ocupa el centro.</p><div className="button-row center">{destination && <a className="primary as-link" href={destination} target="_blank" rel="noreferrer">Ver cómo acceder ↗</a>}{phone && <a className="ghost as-link" href={`tel:${phone.replace(/[^+\d]/g, '')}`}>Llamar</a>}<button className="ghost" type="button" onClick={finish}>Volver</button></div></div>}
    {kind === 'action' && <div className="experience-center"><p className="eyebrow">ACCIÓN EN LA VIDA</p><h1>{help.title}</h1><p>{help.summary}</p>{provider(help) && <small className="source-line">{provider(help)}</small>}{prompt && <p className="practice-copy">{prompt}</p>}{steps.length > 0 && <ol className="action-steps">{steps.map((item) => <li key={item}>{item}</li>)}</ol>}{(phone || availability || access) && <div className="help-meta">{phone && <span>{phone}</span>}{availability && <span>{availability}</span>}{access && <span>{access}</span>}</div>}<p className="media-boundary">Lo importante ocurre fuera de la pantalla.</p><div className="button-row center">{destination && <a className="primary as-link" href={destination} target="_blank" rel="noreferrer">Abrir acceso ↗</a>}{phone && <a className="ghost as-link" href={`tel:${phone.replace(/[^+\d]/g, '')}`}>Llamar</a>}<button className={destination || phone ? 'ghost' : 'primary'} type="button" onClick={finish}>{destination || phone ? 'Volver' : 'Salir a vivirlo'}</button></div></div>}
    {kind === 'quiet' && <div className="experience-center quiet"><span className="orb quiet-orb"/><p className="eyebrow">QUIETUD</p><h1>{help.title}</h1><p>{help.summary}</p><button className="ghost" type="button" onClick={finish}>Cuando quieras, volver</button></div>}
  </section>
}