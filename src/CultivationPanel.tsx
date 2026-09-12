import { useEffect, useState } from 'react'
import {
  addPathItem,
  getContinuitySnapshot,
  getProactivitySnapshot,
  recordLongitudinalSignal,
  reuseRepertoire,
  scheduleCultivationFollowup,
  type CultivationMove,
  type CultivationScene,
  type LongitudinalSignal,
  type ProactivitySnapshot,
  type RepertoireItem,
} from './greenfield/application/embryo'

type Props = Readonly<{ activeTrajectoryId: string | null }>

const MOVE_COPY: Record<CultivationMove, string> = {
  REUSE_REPERTOIRE: 'Volver a esto', REPEAT: 'Repetirlo', VARY: 'Probar una variación', APPLY_IN_CONTEXT: 'Llevarlo a otra situación', REFLECT: 'Mirar qué quedó', INTEGRATE: 'Integrarlo un poco más', CONTINUE_PATH: 'Seguir este hilo',
}

function signalForMove(move: CultivationScene['decision_kind']): LongitudinalSignal {
  if (move === 'REPEAT') return 'REPEATED'
  if (move === 'VARY') return 'VARIED'
  if (move === 'APPLY_IN_CONTEXT') return 'APPLIED_OTHER_CONTEXT'
  return 'REUSED'
}

function humanMessage(signal: LongitudinalSignal) {
  if (signal === 'RECOGNIZED_AS_OWN') return 'Lo tomo como una señal, no como una etiqueta: esto parece estar volviéndose más tuyo.'
  if (signal === 'NO_REMINDER_NEEDED') return 'Entendido. No hace falta que LUMI siga ocupando lugar alrededor de esto.'
  if (signal === 'STOPPED_HELPING') return 'También es aprendizaje. Algo que ayudó antes puede dejar de servir.'
  if (signal === 'ADAPTED') return 'Eso importa: no sólo lo repetiste, lo hiciste más tuyo.'
  return 'Gracias. Saber que volvió a servir es distinto de saber que ayudó una sola vez.'
}

function ExperienceContent({ scene }: { scene: CultivationScene }) {
  const steps = Array.isArray(scene.help.content?.steps) ? scene.help.content.steps.filter((item): item is string => typeof item === 'string') : []
  const prompts = Array.isArray(scene.help.content?.prompts) ? scene.help.content.prompts.filter((item): item is string => typeof item === 'string') : []
  const prompt = typeof scene.help.content?.prompt === 'string' ? scene.help.content.prompt : ''
  const intro = typeof scene.help.content?.intro === 'string' ? scene.help.content.intro : ''
  return <>{intro && <p className="experience-intro">{intro}</p>}{steps.length > 0 && <ol className="practice-steps">{steps.map((step) => <li key={step}>{step}</li>)}</ol>}{prompt && <p className="reflection-prompt">{prompt}</p>}{prompts.map((item) => <p className="reflection-prompt" key={item}>{item}</p>)}</>
}

export default function CultivationPanel({ activeTrajectoryId }: Props) {
  const [items, setItems] = useState<RepertoireItem[]>([])
  const [proactivity, setProactivity] = useState<ProactivitySnapshot | null>(null)
  const [scene, setScene] = useState<CultivationScene | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = async () => {
    const [continuity, proactive] = await Promise.all([getContinuitySnapshot(), getProactivitySnapshot()])
    setItems(continuity.repertoire)
    setProactivity(proactive)
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([getContinuitySnapshot(), getProactivitySnapshot()])
      .then(([continuity, proactive]) => {
        if (cancelled) return
        setItems(continuity.repertoire)
        setProactivity(proactive)
      })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'No pude abrir tu repertorio.') })
    return () => { cancelled = true }
  }, [])

  const cultivate = async (item: RepertoireItem, move: Exclude<CultivationMove, 'CONTINUE_PATH'>) => {
    setBusy(true); setError(''); setMessage('')
    try { const next = await reuseRepertoire(item.repertoire_id, move); setScene(next); await refresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No pude volver a esa experiencia.') }
    finally { setBusy(false) }
  }

  const record = async (signal: LongitudinalSignal) => {
    if (!scene) return
    setBusy(true); setError('')
    try { await recordLongitudinalSignal(scene.episode_id, signal); setMessage(humanMessage(signal)); setScene(null); await refresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No pude guardar esa señal.') }
    finally { setBusy(false) }
  }

  const remind = async (item: RepertoireItem) => {
    setBusy(true); setError('')
    try {
      await scheduleCultivationFollowup('practice_return', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), 'REPEAT', { trajectoryId: activeTrajectoryId, helpId: item.help_id, repertoireId: item.repertoire_id, capacityKey: item.capability_keys?.[0] ?? null })
      setMessage('Quedó acordado volver mañana. Podés cancelarlo cuando quieras.')
      await refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pude acordar ese regreso.') }
    finally { setBusy(false) }
  }

  return (
    <section className="subspace">
      <div><p className="card-kicker">REPERTORIO PROPIO</p><h2>Lo que ya te ayudó puede volverse más tuyo.</h2><p>No hace falta acumular novedades. Podés volver, variar o llevar a otra situación algo que ya reconociste como valioso.</p></div>
      {message && <p className="success-note">{message}</p>}{error && <p className="error-note" role="alert">{error}</p>}
      {scene && <article className="experience-scene"><p className="presence-label">LUMI · CULTIVAR</p><h2>{MOVE_COPY[scene.decision_kind]}</h2><h3>{scene.help.title}</h3><p className="experience-summary">{scene.help.summary}</p><ExperienceContent scene={scene} /><p className="space-note">No buscamos completar una tarea. Sólo ver qué ocurre al volver a algo que ya tenía valor para vos.</p><div className="small-actions"><button className="primary-action" type="button" disabled={busy} onClick={() => void record(signalForMove(scene.decision_kind))}>Me sirvió de nuevo</button><button className="secondary-action" type="button" disabled={busy} onClick={() => void record('ADAPTED')}>Lo adapté a mi manera</button><button className="secondary-action" type="button" disabled={busy} onClick={() => void record('RECOGNIZED_AS_OWN')}>Esto ya es bastante mío</button><button className="text-action" type="button" disabled={busy} onClick={() => void record('NO_REMINDER_NEEDED')}>Ya no necesito que me lo recuerdes</button><button className="text-action" type="button" disabled={busy} onClick={() => void record('STOPPED_HELPING')}>Dejó de servirme</button></div></article>}
      <div className="stack-list">{items.map((item) => <article className="repertoire-row" key={item.repertoire_id}><div><strong>{item.title}</strong><span>{item.summary}</span>{item.times_reused > 0 && <small>Volviste a esto {item.times_reused} vez{item.times_reused === 1 ? '' : 'es'}.</small>}</div><div className="small-actions"><button type="button" className="secondary-action" disabled={busy} onClick={() => void cultivate(item, 'REUSE_REPERTOIRE')}>Volver a esto</button><button type="button" className="text-action" disabled={busy} onClick={() => void cultivate(item, 'VARY')}>Probar una variación</button><button type="button" className="text-action" disabled={busy} onClick={() => void cultivate(item, 'APPLY_IN_CONTEXT')}>Llevarlo a otra situación</button>{activeTrajectoryId && <button type="button" className="text-action" disabled={busy} onClick={() => void addPathItem(activeTrajectoryId, item.help_id, item.title).then(refresh)}>Sumar al Camino</button>}{proactivity?.proactive_allowed && <button type="button" className="text-action" disabled={busy} onClick={() => void remind(item)}>Recordarme volver mañana</button>}</div></article>)}{!busy && items.length === 0 && <p className="empty-note">Cuando una experiencia realmente te ayude, podés elegir integrarla acá. Nada entra automáticamente.</p>}</div>
    </section>
  )
}
