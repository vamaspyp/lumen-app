import { FormEvent, useEffect, useMemo, useState } from 'react'
import './App.css'
import { getAuthSnapshot, requestMagicLink, signOut } from './greenfield/application/auth'
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

function HelpContent({ help }: { help: HelpPossibility }) {
  const steps = Array.isArray(help.content?.steps) ? help.content.steps.filter((item): item is string => typeof item === 'string') : []
  const prompts = Array.isArray(help.content?.prompts) ? help.content.prompts.filter((item): item is string => typeof item === 'string') : []
  const intro = typeof help.content?.intro === 'string' ? help.content.intro : ''
  const prompt = typeof help.content?.prompt === 'string' ? help.content.prompt : ''

  return (
    <div className="experience-body">
      {intro && <p className="experience-intro">{intro}</p>}
      {steps.length > 0 && (
        <ol className="practice-steps">
          {steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      )}
      {prompt && <p className="reflection-prompt">{prompt}</p>}
      {prompts.length > 0 && (
        <div className="reflection-prompts">
          {prompts.map((item) => <p key={item}>{item}</p>)}
        </div>
      )}
    </div>
  )
}

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [stage, setStage] = useState<Stage>('home')
  const [expression, setExpression] = useState('')
  const [clarification, setClarification] = useState('')
  const [email, setEmail] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [scene, setScene] = useState<S1Scene | null>(null)
  const [selectedHelp, setSelectedHelp] = useState<HelpPossibility | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [closingMessage, setClosingMessage] = useState('')

  useEffect(() => {
    getAuthSnapshot()
      .then(({ user }) => setAuthenticated(Boolean(user)))
      .catch(() => setAuthenticated(false))
      .finally(() => setAuthChecked(true))
  }, [])

  const primaryHelp = useMemo(() => scene ? primaryHelpFromScene(scene) : null, [scene])

  const resetHome = (message = '') => {
    setScene(null)
    setSelectedHelp(null)
    setClarification('')
    setExpression('')
    setError('')
    setClosingMessage(message)
    setStage(message ? 'closed' : 'home')
  }

  const submitMoment = async (value: string) => {
    const clean = value.trim()
    if (!clean) return
    if (!authenticated) {
      setStage('auth')
      return
    }

    setBusy(true)
    setError('')
    try {
      const { locale, language } = languageContext()
      const nextScene = await accompanyMoment(clean, locale, language)
      setScene(nextScene)
      setStage('scene')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pude continuar este encuentro.')
    } finally {
      setBusy(false)
    }
  }

  const onMomentSubmit = (event: FormEvent) => {
    event.preventDefault()
    void submitMoment(expression)
  }

  const sendMagicLink = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await requestMagicLink(email, window.location.origin)
      setMagicLinkSent(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pude enviar el acceso.')
    } finally {
      setBusy(false)
    }
  }

  const submitClarification = async (event: FormEvent) => {
    event.preventDefault()
    const extra = clarification.trim()
    if (!extra) return
    await submitMoment(`${expression.trim()}\n${extra}`)
  }

  const chooseHelp = async (action: 'selected' | 'rejected') => {
    if (!scene?.episode_id || !primaryHelp?.help_id) return
    setBusy(true)
    setError('')
    try {
      const result = await selectHelp(scene.episode_id, primaryHelp.help_id, action)
      if (action === 'selected') {
        setSelectedHelp(result.help)
        setStage('experience')
      } else {
        resetHome('Está bien. No hace falta insistir con una propuesta que no te representa.')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pude registrar tu elección.')
    } finally {
      setBusy(false)
    }
  }

  const finishOutcome = async (effect: OutcomeEffect) => {
    if (!scene?.episode_id || !selectedHelp?.help_id) return
    setBusy(true)
    setError('')
    try {
      await recordOutcome(scene.episode_id, selectedHelp.help_id, effect)
      resetHome('Gracias. Con esto alcanza por ahora.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pude registrar el retorno.')
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    setBusy(true)
    try {
      await signOut()
      setAuthenticated(false)
      resetHome()
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={`lumen-shell presence-${scene?.presence_mode?.toLowerCase() || 'p3'}`}>
      <header className="quiet-header">
        <a className="brand" href="/" aria-label="LUMEN, volver al inicio">LUMEN</a>
        {authChecked && authenticated && (
          <button className="text-action" type="button" onClick={() => void logout()} disabled={busy}>Salir</button>
        )}
      </header>

      <section className="lumi-scene" aria-live="polite">
        <div className="lumi-orb" aria-hidden="true" />

        {(stage === 'home' || stage === 'auth') && (
          <>
            <p className="presence-label">LUMI</p>
            <h1>Estoy acá.</h1>
            <p className="lumi-line">Podés contarme lo que está pasando, como te salga. No hace falta elegir una categoría.</p>

            <form className="moment-form" onSubmit={onMomentSubmit}>
              <label htmlFor="moment-expression">Lo que te está pasando</label>
              <textarea
                id="moment-expression"
                value={expression}
                onChange={(event) => setExpression(event.target.value)}
                rows={5}
                maxLength={4000}
                placeholder="Por ejemplo: tengo demasiadas cosas en la cabeza y no sé por dónde empezar…"
                disabled={busy || stage === 'auth'}
              />
              {stage === 'home' && (
                <button className="primary-action" type="submit" disabled={busy || !expression.trim()}>
                  {busy ? 'Un momento…' : 'Ver qué podría ayudarme'}
                </button>
              )}
            </form>

            {stage === 'home' && <p className="privacy-note">Tu expresión se usa para este Momento. El backend conserva su longitud y la interpretación necesaria, no el texto original.</p>}

            {stage === 'auth' && (
              <div className="auth-panel">
                <h2>Antes de seguir</h2>
                <p>Para sostener este encuentro sin mezclar vidas, necesito que entres con un correo. Si salís de esta pantalla, lo que escribiste acá no queda guardado.</p>
                {magicLinkSent ? (
                  <p className="success-note">Te envié un enlace de acceso. Al volver, podés contármelo otra vez; LUMEN no habrá guardado este texto.</p>
                ) : (
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
                <div className="help-meta">
                  <span>{primaryHelp.help_type.replace('_', ' ')}</span>
                  {primaryHelp.duration_minutes && <span>{primaryHelp.duration_minutes} min</span>}
                </div>
                <h2>{primaryHelp.title}</h2>
                <p>{primaryHelp.summary}</p>
                <div className="choice-row">
                  <button className="primary-action" type="button" onClick={() => void chooseHelp('selected')} disabled={busy}>Quiero probarlo</button>
                  <button className="secondary-action" type="button" onClick={() => void chooseHelp('rejected')} disabled={busy}>No es esto</button>
                </div>
              </article>
            )}

            {scene.scene_id === 'moment.clarify' && (
              <form className="moment-form compact" onSubmit={submitClarification}>
                <label htmlFor="clarification">Algo más que sí cambie la ayuda</label>
                <textarea id="clarification" rows={3} value={clarification} onChange={(event) => setClarification(event.target.value)} maxLength={2000} />
                <div className="choice-row">
                  <button className="primary-action" type="submit" disabled={busy || !clarification.trim()}>Contarte un poco más</button>
                  <button className="secondary-action" type="button" onClick={() => resetHome()}>Cerrar por ahora</button>
                </div>
              </form>
            )}

            {scene.scene_id === 'moment.no_match' && (
              <div className="choice-row">
                <button className="primary-action" type="button" onClick={() => resetHome()}>Contarlo de otra manera</button>
                <button className="secondary-action" type="button" onClick={() => resetHome('Con esto alcanza por ahora.')}>Cerrar por ahora</button>
              </div>
            )}

            {scene.scene_id === 'moment.safety_referral' && (
              <div className="safety-panel" role="alert">
                <p>Buscá ahora a una persona de confianza, un profesional o un servicio de emergencia de tu zona. Si hay peligro inmediato, priorizá la ayuda humana presencial.</p>
                <button className="primary-action" type="button" onClick={() => resetHome('Ojalá puedas acercarte a alguien ahora. LUMEN queda acá, sin reemplazar esa ayuda.')}>Entendido</button>
              </div>
            )}
          </>
        )}

        {stage === 'experience' && selectedHelp && (
          <article className="experience-scene">
            <p className="presence-label">Ahora, la experiencia</p>
            <h1>{selectedHelp.title}</h1>
            <p className="experience-summary">{selectedHelp.summary}</p>
            <HelpContent help={selectedHelp} />
            <button className="primary-action" type="button" onClick={() => setStage('outcome')}>Terminé</button>
            <button className="text-action centered" type="button" onClick={() => resetHome('Podés dejarlo acá. No hace falta terminar para que este Momento tenga valor.')}>Salir de la experiencia</button>
          </article>
        )}

        {stage === 'outcome' && selectedHelp && (
          <div className="outcome-scene">
            <p className="presence-label">LUMI</p>
            <h1>¿Te ayudó algo de esto?</h1>
            <p className="lumi-line">No hace falta explicarlo. Una señal breve alcanza para que LUMEN aprenda sin invadir.</p>
            <div className="outcome-actions">
              <button type="button" onClick={() => void finishOutcome('helped')} disabled={busy}>Sí, un poco</button>
              <button type="button" onClick={() => void finishOutcome('not_helped')} disabled={busy}>No era para mí</button>
              <button type="button" onClick={() => void finishOutcome('unsure')} disabled={busy}>No sé todavía</button>
            </div>
          </div>
        )}

        {stage === 'closed' && (
          <div className="closed-scene">
            <p className="presence-label">LUMI</p>
            <h1>{closingMessage}</h1>
            <p className="lumi-line">Podés volver a tu vida. Cuando quieras, empezamos de nuevo desde lo que esté pasando entonces.</p>
            <button className="primary-action" type="button" onClick={() => resetHome()}>Volver al inicio</button>
          </div>
        )}

        {error && <p className="error-note" role="alert">{error}</p>}
      </section>
    </main>
  )
}

export default App
