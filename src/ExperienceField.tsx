import { useMemo, useState } from 'react'
import type { HelpPossibility } from './greenfield/application/s1'
import type { SourceItem } from './greenfield/application/embryo'

export type ExperientialHelp = HelpPossibility | SourceItem
export type ExperienceKind =
  | 'editorial'
  | 'practice'
  | 'audio'
  | 'video'
  | 'external'
  | 'action'
  | 'human'
  | 'gathering'
  | 'place'
  | 'material'
  | 'quiet'
  | 'dialogue'

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}
function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []
}
function contentOf(help: ExperientialHelp): Record<string, unknown> {
  return help.content ?? {}
}
function detailOf(help: ExperientialHelp): Record<string, unknown> {
  return 'detail' in help && help.detail && typeof help.detail === 'object' ? help.detail : {}
}
function providerOf(help: ExperientialHelp): string | null {
  if ('provider' in help && help.provider) return help.provider.name
  return stringValue(detailOf(help).provider_name) ?? stringValue(contentOf(help).provider)
}
function externalUrl(help: ExperientialHelp): string | null {
  const content = contentOf(help)
  return stringValue(content.external_url) ?? stringValue(content.url) ?? stringValue(content.href)
}
function mediaUrl(help: ExperientialHelp, kind: 'audio' | 'video'): string | null {
  const content = contentOf(help)
  const detail = detailOf(help)
  const keys = kind === 'audio'
    ? ['audio_url', 'media_url', 'asset_url', 'src']
    : ['video_url', 'media_url', 'asset_url', 'src']
  for (const key of keys) {
    const value = stringValue(content[key]) ?? stringValue(detail[key])
    if (value) return value
  }
  return null
}
function imageUrl(help: ExperientialHelp): string | null {
  const content = contentOf(help)
  return stringValue(content.image_url) ?? stringValue(content.hero_image) ?? stringValue(content.poster_url)
}

function resolveExperienceKind(help: ExperientialHelp): ExperienceKind {
  const type = help.help_type.toLowerCase().replace(/[-\s]+/g, '_')
  const content = contentOf(help)
  if (type.includes('audio') || mediaUrl(help, 'audio')) return 'audio'
  if (type.includes('video') || type.includes('film') || mediaUrl(help, 'video')) return 'video'
  if (type.includes('quiet') || type.includes('silence') || type.includes('stillness') || type.includes('no_content')) return 'quiet'
  if (type.includes('practice') || type.includes('breath') || type.includes('meditation') || type.includes('exercise')) return 'practice'
  if (type.includes('human_action') || type === 'action' || type.includes('real_action')) return 'action'
  if (type.includes('circle') || type.includes('group') || type.includes('community')) return 'gathering'
  if (type.includes('mentor') || type.includes('professional') || type.includes('person') || type.includes('human_support')) return 'human'
  if (type.includes('material') || type.includes('public_help') || type.includes('material_help')) return 'material'
  if (type.includes('event') || type.includes('place') || type.includes('service')) return 'place'
  if (externalUrl(help) || type.includes('resource') || type.includes('book') || type.includes('work')) return 'external'
  if (type.includes('conversation') || type.includes('dialogue')) return 'dialogue'
  if (type.includes('reflection') || type.includes('perspective') || type.includes('reading') || type.includes('essay') || type.includes('text')) return 'editorial'
  if (stringArray(content.steps).length > 0) return 'practice'
  return 'editorial'
}

const KIND_LABEL: Record<ExperienceKind, string> = {
  editorial: 'Perspectiva', practice: 'Práctica', audio: 'Escucha', video: 'Audiovisual', external: 'Obra / recurso', action: 'Acción real', human: 'Encuentro humano', gathering: 'Círculo / grupo', place: 'Lugar / servicio', material: 'Ayuda concreta', quiet: 'Quietud', dialogue: 'Conversación',
}

const KIND_PROMISE: Record<ExperienceKind, string> = {
  editorial: 'Una idea para leer sin apuro.',
  practice: 'Algo para hacer, no para completar.',
  audio: 'Escuchá. La pantalla puede dejar de importar.',
  video: 'Una experiencia para mirar con atención completa.',
  external: 'LUMEN te acompaña hasta la puerta; la obra sigue siendo de su fuente.',
  action: 'Lo importante ocurre fuera de la pantalla.',
  human: 'A veces la mejor ayuda es otra persona.',
  gathering: 'Presencia compartida, sin convertirla en red social.',
  place: 'Una transición concreta hacia el mundo.',
  material: 'Ayuda clara, verificable y con límites visibles.',
  quiet: 'No hacer nada también puede ser una posibilidad.',
  dialogue: 'Una conversación puede abrir espacio sin cerrar respuestas.',
}

export function PossibilityPreview({ help, onOpen, compact = false }: { help: ExperientialHelp; onOpen: () => void; compact?: boolean }) {
  const kind = resolveExperienceKind(help)
  const provider = providerOf(help)
  const roles = 'cultivation_roles' in help ? help.cultivation_roles ?? [] : []
  return (
    <article className={`possibility-preview kind-${kind} ${compact ? 'compact' : ''}`}>
      <div className="possibility-kicker"><span>{KIND_LABEL[kind]}</span>{help.duration_minutes ? <span>{help.duration_minutes} min</span> : null}</div>
      <h3>{help.title}</h3>
      <p>{help.summary}</p>
      {roles.length > 0 && <div className="role-line">{roles.slice(0, 3).map((role) => <span key={role}>{role.toLowerCase()}</span>)}</div>}
      <div className="possibility-foot">
        {provider && <span>Origen: {provider}</span>}
        <button type="button" className="field-link" onClick={onOpen}>Vivir esta posibilidad →</button>
      </div>
    </article>
  )
}

function ExperienceChrome({ kind, help, onExit, children }: { kind: ExperienceKind; help: ExperientialHelp; onExit: () => void; children: React.ReactNode }) {
  return (
    <section className={`experience-fullscreen experience-${kind}`} aria-label={`${KIND_LABEL[kind]}: ${help.title}`}>
      <button className="experience-close" type="button" onClick={onExit} aria-label="Salir de la experiencia">×</button>
      <div className="experience-presence"><span className="presence-seed" aria-hidden="true" /><span>LUMI · P1</span></div>
      {children}
    </section>
  )
}

function EditorialExperience({ help, onExit }: { help: ExperientialHelp; onExit: () => void }) {
  const content = contentOf(help)
  const paragraphs = stringArray(content.paragraphs)
  const prompts = stringArray(content.prompts)
  const body = paragraphs.length ? paragraphs : [stringValue(content.intro), stringValue(content.body), help.summary].filter((item): item is string => Boolean(item))
  const quote = stringValue(content.quote) ?? stringValue(content.pull_quote) ?? stringValue(content.prompt)
  return (
    <ExperienceChrome kind="editorial" help={help} onExit={onExit}>
      <div className="editorial-hero"><div><p className="experience-eyebrow">{providerOf(help) ?? 'LUMEN · perspectiva'}</p><h1>{help.title}</h1><p>{help.summary}</p></div></div>
      <article className="editorial-body">
        {body.map((paragraph, index) => <p key={`${paragraph}-${index}`} className={index === 0 ? 'lede' : ''}>{paragraph}</p>)}
        {quote && <blockquote>{quote}</blockquote>}
        {prompts.length > 0 && <div className="editorial-prompts">{prompts.map((prompt) => <p key={prompt}>{prompt}</p>)}</div>}
      </article>
    </ExperienceChrome>
  )
}

function PracticeExperience({ help, onExit }: { help: ExperientialHelp; onExit: () => void }) {
  const content = contentOf(help)
  const steps = stringArray(content.steps)
  const [step, setStep] = useState(0)
  const current = steps[step] ?? stringValue(content.prompt) ?? help.summary
  const complete = steps.length > 0 && step >= steps.length - 1
  return (
    <ExperienceChrome kind="practice" help={help} onExit={onExit}>
      <div className="practice-field">
        <p className="experience-eyebrow">PRÁCTICA · {help.duration_minutes ? `${help.duration_minutes} min` : 'a tu ritmo'}</p>
        <h1>{help.title}</h1>
        <div className="practice-breath" aria-hidden="true" />
        <p className="practice-step">{current}</p>
        {steps.length > 1 && <div className="practice-progress" aria-label={`Paso ${step + 1} de ${steps.length}`}>{steps.map((_, index) => <i key={index} className={index <= step ? 'done' : ''} />)}</div>}
        <div className="experience-actions">
          {!complete && steps.length > 0 ? <><button className="field-primary" type="button" onClick={() => setStep((value) => Math.min(value + 1, steps.length - 1))}>Seguir</button><button className="field-ghost" type="button" onClick={onExit}>Terminé</button></> : <button className="field-primary" type="button" onClick={onExit}>Terminé</button>}
          {step > 0 && <button className="field-ghost" type="button" onClick={() => setStep((value) => Math.max(0, value - 1))}>Atrás</button>}
        </div>
      </div>
    </ExperienceChrome>
  )
}

function AudioExperience({ help, onExit }: { help: ExperientialHelp; onExit: () => void }) {
  const url = mediaUrl(help, 'audio')
  const transcript = stringArray(contentOf(help).transcript)
  return (
    <ExperienceChrome kind="audio" help={help} onExit={onExit}>
      <div className="media-field audio-field">
        <div className="audio-halo" aria-hidden="true"><span /><span /><span /></div>
        <p className="experience-eyebrow">ESCUCHA · {help.duration_minutes ? `${help.duration_minutes} min` : 'sin apuro'}</p>
        <h1>{help.title}</h1><p className="media-summary">{help.summary}</p>
        {url ? <audio className="premium-audio" controls preload="metadata" src={url}>Tu navegador no puede reproducir este audio.</audio> : <p className="media-missing">Esta experiencia está preparada para audio, pero todavía no tiene un asset publicado. LUMEN no simula contenido inexistente.</p>}
        {transcript.length > 0 && <details className="transcript"><summary>Leer transcripción</summary>{transcript.map((line) => <p key={line}>{line}</p>)}</details>}
        <p className="offscreen-note">Podés cerrar los ojos. LUMI no necesita que mires la pantalla.</p>
      </div>
    </ExperienceChrome>
  )
}

function VideoExperience({ help, onExit }: { help: ExperientialHelp; onExit: () => void }) {
  const url = mediaUrl(help, 'video')
  const poster = imageUrl(help) ?? undefined
  return (
    <ExperienceChrome kind="video" help={help} onExit={onExit}>
      <div className="video-field">
        {url ? <video className="premium-video" controls playsInline poster={poster} src={url}>Tu navegador no puede reproducir este video.</video> : <div className="video-placeholder"><span className="presence-seed large" /><p>Esta experiencia audiovisual todavía no tiene un asset publicado. No la fingimos.</p></div>}
        <div className="video-caption"><p className="experience-eyebrow">AUDIOVISUAL</p><h1>{help.title}</h1><p>{help.summary}</p></div>
      </div>
    </ExperienceChrome>
  )
}

function ExternalExperience({ help, onExit }: { help: ExperientialHelp; onExit: () => void }) {
  const url = externalUrl(help)
  return (
    <ExperienceChrome kind="external" help={help} onExit={onExit}>
      <div className="external-field"><p className="experience-eyebrow">OBRA / RECURSO EXTERNO</p><h1>{help.title}</h1><p>{help.summary}</p><p className="boundary-copy">{KIND_PROMISE.external}</p>{providerOf(help) && <p className="source-line">Fuente: {providerOf(help)}</p>}<div className="experience-actions">{url && <a className="field-primary as-link" href={url} target="_blank" rel="noreferrer">Abrir en su fuente ↗</a>}<button className="field-ghost" type="button" onClick={onExit}>Volver a LUMEN</button></div></div>
    </ExperienceChrome>
  )
}

function RealWorldExperience({ help, kind, onExit }: { help: ExperientialHelp; kind: 'action' | 'place' | 'material'; onExit: () => void }) {
  const content = contentOf(help)
  const instructions = stringArray(content.steps)
  const conditions = [stringValue(content.when), stringValue(content.where), stringValue(content.cost), stringValue(content.availability)].filter((item): item is string => Boolean(item))
  return (
    <ExperienceChrome kind={kind} help={help} onExit={onExit}>
      <div className="realworld-field"><p className="experience-eyebrow">{KIND_LABEL[kind].toUpperCase()}</p><h1>{help.title}</h1><p>{help.summary}</p>{instructions.length > 0 && <ol>{instructions.map((item) => <li key={item}>{item}</li>)}</ol>}{conditions.length > 0 && <div className="conditions">{conditions.map((item) => <span key={item}>{item}</span>)}</div>}<p className="boundary-copy">{KIND_PROMISE[kind]}</p><button className="field-primary" type="button" onClick={onExit}>Salir a vivirlo</button></div>
    </ExperienceChrome>
  )
}

function HumanExperience({ help, kind, onExit }: { help: ExperientialHelp; kind: 'human' | 'gathering' | 'dialogue'; onExit: () => void }) {
  const content = contentOf(help)
  const boundaries = stringArray(content.boundaries)
  const contact = stringValue(content.contact) ?? stringValue(content.external_url)
  return (
    <ExperienceChrome kind={kind} help={help} onExit={onExit}>
      <div className="human-field"><div className="human-avatar" aria-hidden="true">{help.title.slice(0, 1).toUpperCase()}</div><p className="experience-eyebrow">{KIND_LABEL[kind].toUpperCase()}</p><h1>{help.title}</h1><p>{help.summary}</p>{providerOf(help) && <p className="source-line">{providerOf(help)}</p>}{boundaries.length > 0 && <div className="boundary-list">{boundaries.map((item) => <span key={item}>{item}</span>)}</div>}<div className="experience-actions">{contact && <a className="field-primary as-link" href={contact} target="_blank" rel="noreferrer">Abrir contacto ↗</a>}<button className="field-ghost" type="button" onClick={onExit}>Volver</button></div></div>
    </ExperienceChrome>
  )
}

function QuietExperience({ help, onExit }: { help: ExperientialHelp; onExit: () => void }) {
  return (
    <ExperienceChrome kind="quiet" help={help} onExit={onExit}>
      <div className="quiet-field"><span className="presence-seed quiet-seed" aria-hidden="true" /><h1>{help.title}</h1><p>{help.summary}</p><p className="quiet-invitation">No hay nada que completar.</p><button className="quiet-return" type="button" onClick={onExit}>volver cuando quieras</button></div>
    </ExperienceChrome>
  )
}

export function ExperienceSurface({ help, onExit }: { help: ExperientialHelp; onExit: () => void }) {
  const kind = useMemo(() => resolveExperienceKind(help), [help])
  if (kind === 'practice') return <PracticeExperience help={help} onExit={onExit} />
  if (kind === 'audio') return <AudioExperience help={help} onExit={onExit} />
  if (kind === 'video') return <VideoExperience help={help} onExit={onExit} />
  if (kind === 'external') return <ExternalExperience help={help} onExit={onExit} />
  if (kind === 'action' || kind === 'place' || kind === 'material') return <RealWorldExperience help={help} kind={kind} onExit={onExit} />
  if (kind === 'human' || kind === 'gathering' || kind === 'dialogue') return <HumanExperience help={help} kind={kind} onExit={onExit} />
  if (kind === 'quiet') return <QuietExperience help={help} onExit={onExit} />
  return <EditorialExperience help={help} onExit={onExit} />
}
