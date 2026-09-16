import { useMemo, useState } from 'react'
import type { HelpPossibility } from '../greenfield/application/s1'
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
  if (type.includes('action') || type.includes('event') || type.includes('place') || type.includes('service') || type.includes('material')) return 'action'
  if (externalUrl(help) || type.includes('resource') || type.includes('book') || type.includes('work')) return 'external'
  return 'editorial'
}

export function Experience({ help, onExit }: { help: Help; onExit: () => void }) {
  const kind = useMemo(() => kindOf(help), [help])
  const content = contentOf(help)
  const [step, setStep] = useState(0)
  const steps = arr(content.steps)
  const body = arr(content.paragraphs)
  const current = steps[step] || str(content.prompt) || help.summary
  const url = kind === 'audio' ? mediaUrl(help, 'audio') : kind === 'video' ? mediaUrl(help, 'video') : null
  return <section className={`experience experience-${kind}`}>
    <button className="experience-close" type="button" onClick={onExit} aria-label="Salir de la experiencia">×</button>
    <div className="experience-lumi"><span className="orb tiny"/><small>LUMI · PRESENCIA MÍNIMA</small></div>
    {kind === 'practice' && <div className="experience-center"><p className="eyebrow">PRÁCTICA · {help.duration_minutes ? `${help.duration_minutes} MIN` : 'A TU RITMO'}</p><h1>{help.title}</h1><div className="breath-orb"/><p className="practice-copy">{current}</p>{steps.length > 1 && <div className="step-dots">{steps.map((_, index) => <i key={index} className={index <= step ? 'done' : ''}/>)}</div>}<div className="button-row center">{steps.length > 1 && step < steps.length - 1 ? <button className="primary" type="button" onClick={() => setStep((value) => value + 1)}>Seguir</button> : <button className="primary" type="button" onClick={onExit}>Terminé</button>}<button className="ghost" type="button" onClick={onExit}>Salir cuando quieras</button></div></div>}
    {kind === 'editorial' && <div className="editorial-layout"><header><p className="eyebrow">{provider(help) || 'LUMEN · PERSPECTIVA'}</p><h1>{help.title}</h1><p>{help.summary}</p></header><article>{(body.length ? body : [str(content.intro), str(content.body), help.summary].filter((value): value is string => Boolean(value))).map((paragraph, index) => <p key={index} className={index === 0 ? 'lede' : ''}>{paragraph}</p>)}{str(content.quote) && <blockquote>{str(content.quote)}</blockquote>}</article></div>}
    {kind === 'audio' && <div className="experience-center media"><div className="audio-halo"><i/><i/><i/></div><p className="eyebrow">ESCUCHA</p><h1>{help.title}</h1><p>{help.summary}</p>{url ? <audio controls preload="metadata" src={url}/> : <p className="media-boundary">Esta posibilidad está preparada para audio. El asset todavía no está publicado; LUMEN no simula una experiencia inexistente.</p>}<button className="ghost" type="button" onClick={onExit}>Volver</button></div>}
    {kind === 'video' && <div className="video-layout">{url ? <video controls playsInline src={url}/> : <div className="video-empty"><span className="orb"/><p>El audiovisual todavía no tiene un asset publicado. LUMEN no lo finge.</p></div>}<div><p className="eyebrow">AUDIOVISUAL</p><h1>{help.title}</h1><p>{help.summary}</p></div></div>}
    {kind === 'external' && <div className="experience-center"><p className="eyebrow">OBRA / RECURSO EXTERNO</p><h1>{help.title}</h1><p>{help.summary}</p>{provider(help) && <small className="source-line">Fuente: {provider(help)}</small>}<p className="media-boundary">LUMEN te acompaña hasta la puerta; la obra sigue siendo de su fuente.</p><div className="button-row center">{externalUrl(help) && <a className="primary as-link" href={externalUrl(help)!} target="_blank" rel="noreferrer">Abrir en su fuente ↗</a>}<button className="ghost" type="button" onClick={onExit}>Volver a LUMEN</button></div></div>}
    {(kind === 'human' || kind === 'group') && <div className="experience-center human"><div className="human-symbol">{help.title.slice(0,1).toUpperCase()}</div><p className="eyebrow">{kind === 'human' ? 'ENCUENTRO HUMANO' : 'CÍRCULO / GRUPO'}</p><h1>{help.title}</h1><p>{help.summary}</p><p className="media-boundary">Cuando empieza el encuentro, LUMEN se corre. La otra vida ocupa el centro.</p><button className="ghost" type="button" onClick={onExit}>Volver</button></div>}
    {kind === 'action' && <div className="experience-center"><p className="eyebrow">ACCIÓN EN LA VIDA</p><h1>{help.title}</h1><p>{help.summary}</p>{steps.length > 0 && <ol className="action-steps">{steps.map((item) => <li key={item}>{item}</li>)}</ol>}<p className="media-boundary">Lo importante ocurre fuera de la pantalla.</p><button className="primary" type="button" onClick={onExit}>Salir a vivirlo</button></div>}
    {kind === 'quiet' && <div className="experience-center quiet"><span className="orb quiet-orb"/><p className="eyebrow">QUIETUD</p><h1>{help.title}</h1><p>{help.summary}</p><button className="ghost" type="button" onClick={onExit}>Cuando quieras, volver</button></div>}
  </section>
}
