import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { getAuthSnapshot, requestMagicLink, signOut } from './greenfield/application/auth'
import { bootstrapPerson } from './greenfield/application/consent'
import {
  addPathItem,
  cancelFollowup,
  createCircle,
  createCircleInvite,
  createTrajectory,
  deleteSanctuary,
  discoverSource,
  getContinuitySnapshot,
  getEmbryoHealth,
  getProactivitySnapshot,
  getTissueSnapshot,
  integrateHelp,
  joinCircle,
  leaveCircle,
  listSanctuary,
  reportCircle,
  saveSanctuary,
  scheduleFollowup,
  setMemory,
  setProactivity,
  shareHelp,
  updateTrajectory,
  type Circle,
  type ContinuitySnapshot,
  type EmbryoHealth,
  type ProactivitySnapshot,
  type SanctuaryEntry,
  type SourceItem,
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

type Stage = 'home' | 'auth' | 'scene' | 'experience' | 'outcome' | 'closed'
type Space = 'ahora' | 'trayectoria' | 'fuente' | 'santuario' | 'tejido'

const SPACE_LABELS: ReadonlyArray<{ id: Space; label: string }> = [
  { id: 'ahora', label: 'Ahora' },
  { id: 'trayectoria', label: 'Trayectoria' },
  { id: 'fuente', label: 'Fuente' },
  { id: 'santuario', label: 'Santuario' },
  { id: 'tejido', label: 'Tejido' },
]

function languageContext() {
  const locale = navigator.language || 'es-AR'
  return { locale, language: locale.split('-')[0] || 'es' }
}

function semanticCopy(scene: S1Scene): string {
  if (scene.scene_id === 'moment.clarify') return 'No estoy seguro de haber entendido bien. Contame un poco más, sólo si cambia lo que necesitás ahora.'
  if (scene.scene_id === 'moment.no_match') return 'Para esto no tengo algo suficientemente pertinente. Prefiero decírtelo antes que acercarte una ayuda floja.'
  if (scene.scene_id === 'moment.safety_referral') return 'Esto merece apoyo humano inmediato. LUMEN no debería intentar resolverlo solo desde acá.'
  return 'Con lo que entendí hasta ahora, esto podría ayudarte. Si no te representa, no hace falta forzarlo.'
}

function humanReason(reason: string) {
  if (reason === 'trajectory_checkin') return 'Volver a mirar un Faro'
  if (reason === 'practice_return') return 'Volver a una práctica'
  if (reason === 'circle_return') return 'Volver a un Círculo'
  return 'Una vuelta que elegiste'
}

function HelpContent({ help }: { help: HelpPossibility }) {
  const steps = Array.isArray(help.content?.steps) ? help.content.steps.filter((item): item is string => typeof item === 'string') : []
  const prompts = Array.isArray(help.content?.prompts) ? help.content.prompts.filter((item): item is string => typeof item === 'string') : []
  const intro = typeof help.content?.intro === 'string' ? help.content.intro : ''
  const prompt = typeof help.content?.prompt === 'string' ? help.content.prompt : ''

  return (
    <div className="experience-body">
      {intro && <p className="experience-intro">{intro}</p>}
      {steps.length > 0 && <ol className="practice-steps">{steps.map((step) => <li key={step}>{step}</li>)}</ol>}
      {prompt && <p className="reflection-prompt">{prompt}</p>}
      {prompts.length > 0 && <div className="reflection-prompts">{prompts.map((item) => <p key={item}>{item}</p>)}</div>}
    </div>
  )
}

function PrivateGate({ onGoNow }: { onGoNow: () => void }) {
  return (
    <section className="space-scene compact-space">
      <p className="presence-label">Un espacio personal</p>
      <h1>Esto necesita ser tuyo.</h1>
      <p className="lumi-line">Entrá desde Ahora para que LUMEN pueda sostener continuidad sin mezclar tu vida con otra.</p>
      <button className="primary-action centered-action" type="button" onClick={onGoNow}>Ir a Ahora</button>
    </section>
  )
}

function SourceSpace() {
  const [items, setItems] = useState<SourceItem[]>([])
  const [health, setHealth] = useState<EmbryoHealth | null>(null)
  const [need, setNeed] = useState('')
  const [type, setType] = useState('')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setBusy(true)
    setError('')
    const locale = navigator.language || 'es-AR'
    Promise.all([discoverSource(need || null, type || null, locale, 40), getEmbryoHealth()])
      .then(([nextItems, nextHealth]) => {
        setItems(nextItems)
        setHealth(nextHealth)
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'No pude abrir Fuente.'))
      .finally(() => setBusy(false))
  }, [need, type])

  return (
    <section className="space-scene source-space">
      <p className="presence-label">FUENTE</p>
      <h1>Algo del patrimonio humano, cuando haga falta.</h1>
      <p className="lumi-line">No es un feed. Podés explorar por lo que querés cuidar y por la forma de ayuda que hoy te resulte posible.</p>

      <div className="filter-bar" aria-label="Filtros de Fuente">
        <label>Necesidad
          <select value={need} onChange={(event) => setNeed(event.target.value)}>
            <option value="">Todas</option>
            <option value="pause">Pausa</option>
            <option value="clarity">Claridad</option>
            <option value="agency">Acción</option>
            <option value="meaning">Sentido</option>
            <option value="connection">Conexión</option>
            <option value="appreciation">Apreciación</option>
          </select>
        </label>
        <label>Forma
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">Todas</option>
            <option value="practice">Práctica</option>
            <option value="reflection">Reflexión</option>
            <option value="reading">Lectura</option>
            <option value="external_resource">Recurso externo</option>
            <option value="human_action">Acción humana</option>
          </select>
        </label>
      </div>

      {health && <p className="space-note">{health.source.active_possibilities} posibilidades activas limitadas · {health.source.semantic_types} formas semánticas · cobertura todavía en aprendizaje.</p>}
      {busy && <p className="lumi-line">Abriendo Fuente…</p>}
      {error && <p className="error-note" role="alert">{error}</p>}
      {!busy && !error && items.length === 0 && <p className="empty-note">No encontré algo suficientemente pertinente con estos filtros.</p>}

      <div className="source-grid">
        {items.map((item) => {
          const externalUrl = typeof item.content?.external_url === 'string' ? item.content.external_url : null
          const steps = Array.isArray(item.content?.steps) ? item.content.steps.filter((step): step is string => typeof step === 'string') : []
          const prompt = typeof item.content?.prompt === 'string' ? item.content.prompt : null
          return (
            <article className="source-card" key={item.help_id}>
              <div className="help-meta">
                <span>{item.help_type.replace('_', ' ')}</span>
                {item.duration_minutes && <span>{item.duration_minutes} min</span>}
                {item.energy && <span>energía {item.energy.replace('_', ' ')}</span>}
              </div>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              {steps.length > 0 && <ol className="mini-steps">{steps.map((step) => <li key={step}>{step}</li>)}</ol>}
              {prompt && <p className="mini-prompt">{prompt}</p>}
              <p className="provenance-line">Origen: {item.provider.name}</p>
              {externalUrl && <a className="secondary-link" href={externalUrl} target="_blank" rel="noreferrer">Abrir recurso original</a>}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function TrajectorySpace() {
  const [snapshot, setSnapshot] = useState<ContinuitySnapshot | null>(null)
  const [proactivity, setProactivityState] = useState<ProactivitySnapshot | null>(null)
  const [faro, setFaro] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = async () => {
    const [continuity, proactive] = await Promise.all([getContinuitySnapshot(), getProactivitySnapshot()])
    setSnapshot(continuity)
    setProactivityState(proactive)
  }

  useEffect(() => {
    setBusy(true)
    refresh().catch((cause) => setError(cause instanceof Error ? cause.message : 'No pude abrir tu Trayectoria.')).finally(() => setBusy(false))
  }, [])

  const act = async (operation: () => Promise<unknown>) => {
    setBusy(true)
    setError('')
    try {
      await operation()
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pude guardar ese cambio.')
    } finally {
      setBusy(false)
    }
  }

  const onCreateFaro = (event: FormEvent) => {
    event.preventDefault()
    if (!faro.trim()) return
    void act(async () => {
      await createTrajectory(faro.trim())
      setFaro('')
    })
  }

  const activeTrajectory = snapshot?.trajectories.find((item) => item.status === 'active') ?? null

  return (
    <section className="space-scene">
      <p className="presence-label">TRAYECTORIA</p>
      <h1>Dirección sin convertir la vida en un plan.</h1>
      <p className="lumi-line">Un Faro puede cambiar, pausarse o desaparecer. El Camino sólo conserva próximos apoyos que vos decidís sostener.</p>

      <form className="inline-create" onSubmit={onCreateFaro}>
        <label htmlFor="new-faro">Un Faro que hoy te importe</label>
        <div className="inline-row">
          <input id="new-faro" value={faro} onChange={(event) => setFaro(event.target.value)} maxLength={280} placeholder="Por ejemplo: recuperar calma para decidir mejor" />
          <button className="primary-action" disabled={busy || !faro.trim()} type="submit">Crear Faro</button>
        </div>
      </form>

      {error && <p className="error-note" role="alert">{error}</p>}
      <div className="stack-list">
        {snapshot?.trajectories.map((trajectory) => (
          <article className="living-card" key={trajectory.trajectory_id}>
            <div className="card-kicker">Faro · {trajectory.status}</div>
            {editId === trajectory.trajectory_id ? (
              <div className="edit-block">
                <input value={editText} onChange={(event) => setEditText(event.target.value)} maxLength={280} />
                <div className="small-actions">
                  <button type="button" className="primary-action" onClick={() => void act(async () => { await updateTrajectory(trajectory.trajectory_id, editText.trim(), trajectory.status); setEditId(null) })} disabled={!editText.trim() || busy}>Guardar</button>
                  <button type="button" className="text-action" onClick={() => setEditId(null)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <h2>{trajectory.faro_text}</h2>
                <div className="small-actions">
                  <button type="button" className="text-action" onClick={() => { setEditId(trajectory.trajectory_id); setEditText(trajectory.faro_text) }}>Editar</button>
                  {trajectory.status !== 'closed' && <button type="button" className="text-action" onClick={() => void act(() => updateTrajectory(trajectory.trajectory_id, trajectory.faro_text, trajectory.status === 'paused' ? 'active' : 'paused'))}>{trajectory.status === 'paused' ? 'Retomar' : 'Pausar'}</button>}
                </div>
              </>
            )}
            <div className="path-list">
              <strong>Camino</strong>
              {trajectory.path.length === 0 ? <span className="muted-inline">Todavía abierto, sin pasos impuestos.</span> : trajectory.path.map((item) => <span key={item.path_item_id}>• {item.label}</span>)}
            </div>
          </article>
        ))}
      </div>

      <section className="subspace">
        <div>
          <p className="card-kicker">REPERTORIO PROPIO</p>
          <h2>Lo que ya te ayudó puede volver.</h2>
        </div>
        {snapshot?.repertoire.length ? snapshot.repertoire.map((item) => (
          <article className="repertoire-row" key={item.repertoire_id}>
            <div><strong>{item.title}</strong><span>{item.summary}</span></div>
            {activeTrajectory && <button type="button" className="secondary-action" onClick={() => void act(() => addPathItem(activeTrajectory.trajectory_id, item.help_id, item.title))}>Sumar al Camino</button>}
          </article>
        )) : <p className="empty-note">Cuando una experiencia realmente te ayude, podés elegir integrarla acá.</p>}
      </section>

      <section className="subspace continuity-panel">
        <div>
          <p className="card-kicker">CONTINUIDAD</p>
          <h2>LUMEN sólo vuelve si vos lo permitís.</h2>
          <p>Ventana de silencio: {proactivity?.settings.quiet_start_hour ?? 22}:00–{proactivity?.settings.quiet_end_hour ?? 8}:00 · canal del embrión: dentro de LUMEN.</p>
        </div>
        <button className={proactivity?.proactive_allowed ? 'secondary-action' : 'primary-action'} type="button" disabled={busy || proactivity?.settings.custody_blocked} onClick={() => void act(() => setProactivity(!proactivity?.proactive_allowed))}>
          {proactivity?.proactive_allowed ? 'Apagar continuidad' : 'Permitir continuidad'}
        </button>
        {proactivity?.proactive_allowed && (
          <button className="text-action" type="button" onClick={() => void act(() => scheduleFollowup('self_chosen', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), activeTrajectory?.trajectory_id ?? null, null))}>Recordarme volver mañana</button>
        )}
        {proactivity?.followups.map((followup) => (
          <div className="followup-row" key={followup.followup_id}>
            <span>{humanReason(followup.reason_code)} · {new Date(followup.due_at).toLocaleString()}</span>
            <button className="text-action" type="button" onClick={() => void act(() => cancelFollowup(followup.followup_id))}>Cancelar</button>
          </div>
        ))}
      </section>
    </section>
  )
}

function SanctuarySpace() {
  const [snapshot, setSnapshot] = useState<ContinuitySnapshot | null>(null)
  const [entries, setEntries] = useState<SanctuaryEntry[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = async () => {
    const [continuity, nextEntries] = await Promise.all([getContinuitySnapshot(), listSanctuary()])
    setSnapshot(continuity)
    setEntries(nextEntries)
  }

  useEffect(() => {
    setBusy(true)
    refresh().catch((cause) => setError(cause instanceof Error ? cause.message : 'No pude abrir tu Santuario.')).finally(() => setBusy(false))
  }, [])

  const act = async (operation: () => Promise<unknown>) => {
    setBusy(true)
    setError('')
    try { await operation(); await refresh() } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pude guardar ese cambio.') } finally { setBusy(false) }
  }

  const onSave = (event: FormEvent) => {
    event.preventDefault()
    if (!content.trim()) return
    void act(async () => {
      await saveSanctuary('reflection', title.trim(), content.trim())
      setTitle('')
      setContent('')
    })
  }

  return (
    <section className="space-scene">
      <p className="presence-label">SANTUARIO</p>
      <h1>Lo que es tuyo sigue siendo tuyo.</h1>
      <p className="lumi-line">Acá podés conservar una reflexión o un descubrimiento para volver después. LUMEN no usa este texto como evidencia compartida ni lo copia al Ledger.</p>

      <div className="consent-strip">
        <span>{snapshot?.memory_allowed ? 'Memoria del Santuario permitida' : 'Guardar nuevas cosas está apagado'}</span>
        <button className="secondary-action" type="button" disabled={busy} onClick={() => void act(() => setMemory(!snapshot?.memory_allowed))}>{snapshot?.memory_allowed ? 'Dejar de guardar' : 'Permitir guardar'}</button>
      </div>

      {snapshot?.memory_allowed && (
        <form className="sanctuary-form" onSubmit={onSave}>
          <label htmlFor="sanctuary-title">Título opcional</label>
          <input id="sanctuary-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="Algo que quiero recordar" />
          <label htmlFor="sanctuary-content">Tu reflexión</label>
          <textarea id="sanctuary-content" value={content} onChange={(event) => setContent(event.target.value)} maxLength={4000} rows={4} placeholder="Escribilo como sea útil para vos…" />
          <button className="primary-action" type="submit" disabled={busy || !content.trim()}>Guardar en mi Santuario</button>
        </form>
      )}

      {error && <p className="error-note" role="alert">{error}</p>}
      <div className="stack-list">
        {entries.map((entry) => (
          <article className="sanctuary-entry" key={entry.entry_id}>
            <div className="card-kicker">{entry.entry_kind} · {new Date(entry.created_at).toLocaleDateString()}</div>
            {entry.title && <h2>{entry.title}</h2>}
            <p>{entry.content}</p>
            <button className="text-action" type="button" onClick={() => void act(() => deleteSanctuary(entry.entry_id))}>Borrar definitivamente</button>
          </article>
        ))}
        {!busy && entries.length === 0 && <p className="empty-note">Todavía no guardaste nada. No hace falta llenar este espacio.</p>}
      </div>
    </section>
  )
}

function TissueSpace() {
  const [circles, setCircles] = useState<Circle[]>([])
  const [source, setSource] = useState<SourceItem[]>([])
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [invite, setInvite] = useState('')
  const [lastInvite, setLastInvite] = useState('')
  const [shareByCircle, setShareByCircle] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = async () => {
    const [nextCircles, nextSource] = await Promise.all([getTissueSnapshot(), discoverSource(null, null, navigator.language || 'es-AR', 20)])
    setCircles(nextCircles)
    setSource(nextSource)
  }

  useEffect(() => {
    setBusy(true)
    refresh().catch((cause) => setError(cause instanceof Error ? cause.message : 'No pude abrir Tejido.')).finally(() => setBusy(false))
  }, [])

  const act = async (operation: () => Promise<unknown>) => {
    setBusy(true)
    setError('')
    try { await operation(); await refresh() } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pude completar ese gesto.') } finally { setBusy(false) }
  }

  const onCreate = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !purpose.trim()) return
    void act(async () => { await createCircle(name.trim(), purpose.trim()); setName(''); setPurpose('') })
  }

  const onJoin = (event: FormEvent) => {
    event.preventDefault()
    if (!invite.trim()) return
    void act(async () => { await joinCircle(invite.trim()); setInvite('') })
  }

  return (
    <section className="space-scene">
      <p className="presence-label">TEJIDO</p>
      <h1>La vida también puede circular entre personas.</h1>
      <p className="lumi-line">El embrión empieza con Círculos privados y deliberados. Sin feed público, likes, seguidores ni ranking.</p>

      <div className="two-column-actions">
        <form className="living-card" onSubmit={onCreate}>
          <h2>Crear un Círculo</h2>
          <label htmlFor="circle-name">Nombre</label>
          <input id="circle-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
          <label htmlFor="circle-purpose">Para qué existe</label>
          <input id="circle-purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)} maxLength={240} />
          <button className="primary-action" type="submit" disabled={busy || !name.trim() || !purpose.trim()}>Crear</button>
        </form>
        <form className="living-card" onSubmit={onJoin}>
          <h2>Entrar por invitación</h2>
          <label htmlFor="invite-token">Código privado</label>
          <input id="invite-token" value={invite} onChange={(event) => setInvite(event.target.value)} placeholder="UUID de invitación" />
          <button className="secondary-action" type="submit" disabled={busy || !invite.trim()}>Entrar</button>
        </form>
      </div>

      {lastInvite && <div className="invite-note"><strong>Invitación creada</strong><code>{lastInvite}</code><span>Compartila sólo con la persona que querés invitar.</span></div>}
      {error && <p className="error-note" role="alert">{error}</p>}

      <div className="stack-list">
        {circles.map((circle) => (
          <article className="living-card circle-card" key={circle.space_id}>
            <div className="card-kicker">Círculo · {circle.role} · {circle.member_count} miembro{circle.member_count === 1 ? '' : 's'}</div>
            <h2>{circle.name}</h2>
            <p>{circle.purpose}</p>
            {circle.role === 'host' && <button className="text-action" type="button" onClick={() => void act(async () => { const result = await createCircleInvite(circle.space_id); setLastInvite(result.invite_token) })}>Crear invitación</button>}

            <div className="share-row">
              <select aria-label={`Ayuda para compartir en ${circle.name}`} value={shareByCircle[circle.space_id] ?? ''} onChange={(event) => setShareByCircle((current) => ({ ...current, [circle.space_id]: event.target.value }))}>
                <option value="">Elegir algo de Fuente…</option>
                {source.map((item) => <option key={item.help_id} value={item.help_id}>{item.title}</option>)}
              </select>
              <button className="secondary-action" type="button" disabled={!shareByCircle[circle.space_id] || busy} onClick={() => void act(() => shareHelp(circle.space_id, shareByCircle[circle.space_id]))}>Compartir esta ayuda</button>
            </div>

            <div className="contribution-list">
              {circle.contributions.map((contribution) => <div key={contribution.contribution_id}><strong>{contribution.title}</strong><span>{contribution.summary}</span><small>{contribution.from_me ? 'Compartido por vos' : 'Compartido por otra persona del Círculo'}</small></div>)}
              {circle.contributions.length === 0 && <span className="muted-inline">Todavía no circuló ninguna ayuda.</span>}
            </div>
            <div className="small-actions">
              <button className="text-action" type="button" onClick={() => void act(() => reportCircle(circle.space_id, 'boundary'))}>Reportar un límite</button>
              <button className="text-action" type="button" onClick={() => void act(() => leaveCircle(circle.space_id))}>Salir del Círculo</button>
            </div>
          </article>
        ))}
        {!busy && circles.length === 0 && <p className="empty-note">Todavía no pertenecés a ningún Círculo. Tejido puede empezar pequeño.</p>}
      </div>
    </section>
  )
}

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [space, setSpace] = useState<Space>('ahora')
  const [stage, setStage] = useState<Stage>('home')
  const [expression, setExpression] = useState('')
  const [clarification, setClarification] = useState('')
  const [email, setEmail] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [scene, setScene] = useState<S1Scene | null>(null)
  const [selectedHelp, setSelectedHelp] = useState<HelpPossibility | null>(null)
  const [lastOutcome, setLastOutcome] = useState<OutcomeEffect | null>(null)
  const [integrated, setIntegrated] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [closingMessage, setClosingMessage] = useState('')

  useEffect(() => {
    getAuthSnapshot()
      .then(async ({ user }) => {
        setAuthenticated(Boolean(user))
        if (user) await bootstrapPerson()
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setAuthChecked(true))
  }, [])

  const primaryHelp = useMemo(() => scene ? primaryHelpFromScene(scene) : null, [scene])

  const resetHome = (message = '') => {
    setScene(null)
    setSelectedHelp(null)
    setLastOutcome(null)
    setIntegrated(false)
    setClarification('')
    setExpression('')
    setError('')
    setClosingMessage(message)
    setStage(message ? 'closed' : 'home')
  }

  const submitMoment = async (value: string) => {
    const clean = value.trim()
    if (!clean) return
    if (!authenticated) { setStage('auth'); return }
    setBusy(true)
    setError('')
    try {
      const { locale, language } = languageContext()
      const nextScene = await accompanyMoment(clean, locale, language)
      setScene(nextScene)
      setStage('scene')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pude continuar este encuentro.')
    } finally { setBusy(false) }
  }

  const onMomentSubmit = (event: FormEvent) => { event.preventDefault(); void submitMoment(expression) }

  const sendMagicLink = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try { await requestMagicLink(email, window.location.origin); setMagicLinkSent(true) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No pude enviar el acceso.') }
    finally { setBusy(false) }
  }

  const submitClarification = async (event: FormEvent) => {
    event.preventDefault()
    const extra = clarification.trim()
    if (extra) await submitMoment(`${expression.trim()}\n${extra}`)
  }

  const chooseHelp = async (action: 'selected' | 'rejected') => {
    if (!scene?.episode_id || !primaryHelp?.help_id) return
    setBusy(true)
    setError('')
    try {
      const result = await selectHelp(scene.episode_id, primaryHelp.help_id, action)
      if (action === 'selected') { setSelectedHelp(result.help); setStage('experience') }
      else resetHome('Está bien. No hace falta insistir con una propuesta que no te representa.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pude registrar tu elección.') }
    finally { setBusy(false) }
  }

  const finishOutcome = async (effect: OutcomeEffect) => {
    if (!scene?.episode_id || !selectedHelp?.help_id) return
    setBusy(true)
    setError('')
    try {
      await recordOutcome(scene.episode_id, selectedHelp.help_id, effect)
      setLastOutcome(effect)
      setClosingMessage('Gracias. Con esto alcanza por ahora.')
      setStage('closed')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pude registrar el retorno.') }
    finally { setBusy(false) }
  }

  const integrateSelectedHelp = async () => {
    if (!selectedHelp?.help_id) return
    setBusy(true)
    setError('')
    try { await integrateHelp(selectedHelp.help_id); setIntegrated(true) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No pude integrarlo a tu repertorio.') }
    finally { setBusy(false) }
  }

  const logout = async () => {
    setBusy(true)
    try { await signOut(); setAuthenticated(false); setSpace('ahora'); resetHome() }
    finally { setBusy(false) }
  }

  const openSpace = (next: Space) => {
    setSpace(next)
    setError('')
    if (next === 'ahora' && stage === 'closed') resetHome()
  }

  return (
    <main className={`lumen-shell presence-${scene?.presence_mode?.toLowerCase() || 'p3'}`}>
      <header className="quiet-header wide-header">
        <button className="brand brand-button" type="button" onClick={() => openSpace('ahora')} aria-label="LUMEN, volver a Ahora">LUMEN</button>
        <nav className="semantic-nav" aria-label="Espacios de LUMEN">
          {SPACE_LABELS.map((item) => <button key={item.id} type="button" className={space === item.id ? 'active' : ''} onClick={() => openSpace(item.id)}>{item.label}</button>)}
        </nav>
        {authChecked && authenticated ? <button className="text-action" type="button" onClick={() => void logout()} disabled={busy}>Salir</button> : <span className="header-spacer" />}
      </header>

      {space === 'fuente' && <SourceSpace />}
      {space === 'trayectoria' && (authenticated ? <TrajectorySpace /> : <PrivateGate onGoNow={() => openSpace('ahora')} />)}
      {space === 'santuario' && (authenticated ? <SanctuarySpace /> : <PrivateGate onGoNow={() => openSpace('ahora')} />)}
      {space === 'tejido' && (authenticated ? <TissueSpace /> : <PrivateGate onGoNow={() => openSpace('ahora')} />)}

      {space === 'ahora' && (
        <section className="lumi-scene" aria-live="polite">
          <div className="lumi-orb" aria-hidden="true" />

          {(stage === 'home' || stage === 'auth') && (
            <>
              <p className="presence-label">LUMI</p>
              <h1>Estoy acá.</h1>
              <p className="lumi-line">Podés contarme lo que está pasando, como te salga. No hace falta elegir una categoría.</p>
              <form className="moment-form" onSubmit={onMomentSubmit}>
                <label htmlFor="moment-expression">Lo que te está pasando</label>
                <textarea id="moment-expression" value={expression} onChange={(event) => setExpression(event.target.value)} rows={5} maxLength={4000} placeholder="Por ejemplo: tengo demasiadas cosas en la cabeza y no sé por dónde empezar…" disabled={busy || stage === 'auth'} />
                {stage === 'home' && <button className="primary-action" type="submit" disabled={busy || !expression.trim()}>{busy ? 'Un momento…' : 'Ver qué podría ayudarme'}</button>}
              </form>
              {stage === 'home' && <><p className="privacy-note">Tu expresión se usa para este Momento. El backend conserva su longitud y la interpretación necesaria, no el texto original.</p><button className="text-action centered" type="button" onClick={() => openSpace('fuente')}>O explorar Fuente sin contar nada</button></>}

              {stage === 'auth' && (
                <div className="auth-panel">
                  <h2>Antes de seguir</h2>
                  <p>Para sostener este encuentro sin mezclar vidas, necesito que entres con un correo. Si salís de esta pantalla, lo que escribiste acá no queda guardado.</p>
                  {magicLinkSent ? <p className="success-note">Te envié un enlace de acceso. Al volver, podés contármelo otra vez; LUMEN no habrá guardado este texto.</p> : (
                    <form onSubmit={sendMagicLink} className="email-form">
                      <label htmlFor="email">Tu correo</label>
                      <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                      <button className="primary-action" type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviarme un enlace'}</button>
                      <button className="secondary-action" type="button" onClick={() => setStage('home')}>Ahora no</button>
                    </form>
                  )}
                </div>
              )}
            </>
          )}

          {stage === 'scene' && scene && (
            <>
              <p className="presence-label">LUMI · {scene.presence_mode}</p>
              <h1>{scene.scene_id === 'moment.help' ? 'Quizá podamos empezar por acá.' : scene.scene_id === 'moment.clarify' ? 'Quiero entender un poco mejor.' : 'Prefiero ser claro con esto.'}</h1>
              <p className="lumi-line">{semanticCopy(scene)}</p>
              {scene.scene_id === 'moment.help' && primaryHelp && (
                <article className="help-card">
                  <div className="help-meta"><span>{primaryHelp.help_type.replace('_', ' ')}</span>{primaryHelp.duration_minutes && <span>{primaryHelp.duration_minutes} min</span>}</div>
                  <h2>{primaryHelp.title}</h2><p>{primaryHelp.summary}</p>
                  <div className="choice-row"><button className="primary-action" type="button" onClick={() => void chooseHelp('selected')} disabled={busy}>Quiero probarlo</button><button className="secondary-action" type="button" onClick={() => void chooseHelp('rejected')} disabled={busy}>No es esto</button></div>
                </article>
              )}
              {scene.scene_id === 'moment.clarify' && (
                <form className="moment-form compact" onSubmit={submitClarification}>
                  <label htmlFor="clarification">Algo más que sí cambie la ayuda</label><textarea id="clarification" rows={3} value={clarification} onChange={(event) => setClarification(event.target.value)} maxLength={2000} />
                  <div className="choice-row"><button className="primary-action" type="submit" disabled={busy || !clarification.trim()}>Contarte un poco más</button><button className="secondary-action" type="button" onClick={() => resetHome()}>Cerrar por ahora</button></div>
                </form>
              )}
              {scene.scene_id === 'moment.no_match' && <div className="choice-row"><button className="primary-action" type="button" onClick={() => resetHome()}>Contarlo de otra manera</button><button className="secondary-action" type="button" onClick={() => resetHome('Con esto alcanza por ahora.')}>Cerrar por ahora</button></div>}
              {scene.scene_id === 'moment.safety_referral' && <div className="safety-panel" role="alert"><p>Buscá ahora a una persona de confianza, un profesional o un servicio de emergencia de tu zona. Si hay peligro inmediato, priorizá la ayuda humana presencial.</p><button className="primary-action" type="button" onClick={() => resetHome('Ojalá puedas acercarte a alguien ahora. LUMEN queda acá, sin reemplazar esa ayuda.')}>Entendido</button></div>}
            </>
          )}

          {stage === 'experience' && selectedHelp && (
            <article className="experience-scene">
              <p className="presence-label">Ahora, la experiencia</p><h1>{selectedHelp.title}</h1><p className="experience-summary">{selectedHelp.summary}</p><HelpContent help={selectedHelp} />
              <button className="primary-action" type="button" onClick={() => setStage('outcome')}>Terminé</button>
              <button className="text-action centered" type="button" onClick={() => resetHome('Podés dejarlo acá. No hace falta terminar para que este Momento tenga valor.')}>Salir de la experiencia</button>
            </article>
          )}

          {stage === 'outcome' && selectedHelp && (
            <div className="outcome-scene">
              <p className="presence-label">LUMI</p><h1>¿Te ayudó algo de esto?</h1><p className="lumi-line">No hace falta explicarlo. Una señal breve alcanza para que LUMEN aprenda sin invadir.</p>
              <div className="outcome-actions"><button type="button" onClick={() => void finishOutcome('helped')} disabled={busy}>Sí, un poco</button><button type="button" onClick={() => void finishOutcome('not_helped')} disabled={busy}>No era para mí</button><button type="button" onClick={() => void finishOutcome('unsure')} disabled={busy}>No sé todavía</button></div>
            </div>
          )}

          {stage === 'closed' && (
            <div className="closed-scene">
              <p className="presence-label">LUMI</p><h1>{closingMessage}</h1><p className="lumi-line">Podés volver a tu vida. Si algo de esto merece continuidad, sólo vos decidís qué conservar.</p>
              {lastOutcome === 'helped' && selectedHelp && !integrated && <button className="secondary-action centered-action" type="button" disabled={busy} onClick={() => void integrateSelectedHelp()}>Guardar “{selectedHelp.title}” en mi repertorio</button>}
              {integrated && <p className="success-note">Quedó en tu repertorio. Podés encontrarlo en Trayectoria.</p>}
              <div className="choice-row compact-choice"><button className="primary-action" type="button" onClick={() => resetHome()}>Volver a Ahora</button><button className="secondary-action" type="button" onClick={() => openSpace('santuario')}>Ir a mi Santuario</button></div>
            </div>
          )}

          {error && <p className="error-note" role="alert">{error}</p>}
        </section>
      )}
    </main>
  )
}

export default App