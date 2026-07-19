import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from './supabase'

// ───────── Types ─────────

export interface Action {
  label: string
  action: string
  value?: string
  variant?: string
  target_node?: string
}

export interface LumiState {
  // LUMI
  lumiMessage: string
  lumiActions: Action[]
  lumiContentType: string
  lumiContentData: Record<string, unknown>
  lumiCode: string

  // Sesión
  userId: string
  isAnonymous: boolean
  currentSessionId: string
  currentResourceId: string
  currentItemId: string
  currentSanctuaryItemId: string
  daysSinceLastSession: number

  // Navegación
  moduleColor: string
  contentSource: string

  // Check-in
   checkinState: string
  checkinArea: string
  checkinTime: string
  checkinHemisphere: string
  checkinFaro: string
  checkinCapability: string

  // Experiencia (modelo nuevo)
  currentExperienceRunId: string
  currentExperienceId: string
  selectedIkKey: string

  // Circular Luz
  currentShareLightId: string
  currentShareToken: string
  // Receptor anónimo de una luz compartida: mientras es true, la UI vive
  // el flujo mínimo de Circular Luz (sin navegación general de LUMEN).
  // Nunca lo derivamos de currentShareToken/currentShareLightId porque
  // Supabase no los limpia en result.state (ver nota en updateState) —
  // por eso es un flag explícito que solo el frontend prende/apaga.
  sharedLightReceiverMode: boolean

  // Reflejo
  reflectionHint: string
}

const initialState: LumiState = {
  lumiMessage: '',
  lumiActions: [],
  lumiContentType: 'empty_presence',
  lumiContentData: {},
  lumiCode: '',

  userId: '',
  isAnonymous: false,
  currentSessionId: '',
  currentResourceId: '',
  currentItemId: '',
  currentSanctuaryItemId: '',
  daysSinceLastSession: 0,

  moduleColor: '#9B8EC4',
  contentSource: '',

checkinState: '',
  checkinArea: '',
  checkinTime: '',
  checkinHemisphere: '',
  checkinFaro: '',
  checkinCapability: '',
  currentExperienceRunId: '',
  currentExperienceId: '',
  selectedIkKey: '',

  currentShareLightId: '',
  currentShareToken: '',
  sharedLightReceiverMode: false,

  reflectionHint: '',
}

// ───────── Helpers ─────────

// Traduce errores técnicos de Supabase Auth a copy sobrio y accionable.
// Vive acá (no en RegisterForm) porque es acá donde se ve el error crudo
// de supabase.auth.updateUser — RegisterForm solo muestra lo que se le tira.
function mapAuthError(message?: string): string {
  if (!message) return 'No pudimos crear la cuenta ahora. Probá nuevamente.'

  if (message.includes('New password should be different from the old password')) {
    return 'Esa clave parece coincidir con una anterior. Probá con otra.'
  }

  if (message.includes('Email address') || message.trim() === '') {
    return 'Revisá el email antes de continuar.'
  }

  return 'No pudimos crear la cuenta ahora. Probá nuevamente.'
}

function buildParams(state: LumiState): Record<string, string> {
  return {
    user_id: state.userId,
    session_id: state.currentSessionId,
    resource_id: state.currentItemId || state.currentResourceId,
    sanctuary_item_id: state.currentSanctuaryItemId,
    source: state.contentSource,
    days_since_last_session: String(state.daysSinceLastSession),
    // Check-in canónico H1/H2
    checkin_state:       state.checkinState,
    checkin_area:        state.checkinArea,
    checkin_time:        state.checkinTime,
    checkin_hemisphere:  state.checkinHemisphere,
    checkin_faro:        state.checkinFaro,
    checkin_capability:  state.checkinCapability,
    // Experiencia activa (modelo nuevo)
    experience_run_id: state.currentExperienceRunId,
    experience_id: state.currentExperienceId,
    // Circular Luz
    share_light_id: state.currentShareLightId,
    share_token: state.currentShareToken,
  }
}

// Auditoría defensiva: el chain de Circular Luz (lumi_start_shared_light /
// lumi_complete_shared_light / lumi_submit_shared_light_signal) no siempre
// trae currentExperienceRunId en result.state — a veces solo viaja en
// result.content bajo otro nombre. Busca en todas las variantes conocidas
// para no perderlo si aparece en cualquiera de ellas.
function extractExperienceRunId(result: Record<string, unknown>): string {
  const state = (result.state as Record<string, unknown>) || {}
  const content = (result.content as Record<string, unknown>) || {}

  const candidates = [
    state.currentExperienceRunId,
    state.experience_run_id,
    content.experience_run_id,
    content.experienceRunId,
    result.experience_run_id,
    result.currentExperienceRunId,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      return candidate.trim()
    }
  }

  return ''
}

function updateState(
  setState: React.Dispatch<React.SetStateAction<LumiState>>,
  result: Record<string, unknown>
) {
  setState(prev => {
    const merged: LumiState = {
      ...prev,
      lumiMessage: 'message' in result ? (result.message as string) : prev.lumiMessage,
      lumiActions: 'actions' in result ? (result.actions as Action[]) : [],
      lumiContentType: 'content_type' in result ? (result.content_type as string) : 'empty_presence',
      lumiContentData: ('content' in result && result.content != null) ? (result.content as Record<string, unknown>) : {},
      lumiCode: 'code' in result ? (result.code as string) : prev.lumiCode,
      // Momento de reflejo sobrio: es de una sola aparición. Se limpia en
      // cada respuesta salvo que el nodo activo lo traiga explícitamente
      // en result.state, para que no persista al volver a Home.
      reflectionHint: '',
      // Supabase decide qué App State actualizar
      ...((result.state as Partial<LumiState>) || {}),
    }

    // Mientras se vive el modo receptor de Circular Luz, el run id (y el
    // contexto de share) no se pierden entre transiciones: si esta
    // respuesta trae uno nuevo se toma (aunque venga solo en content), y si
    // no trae ninguno no se limpia el que ya se conocía.
    if (prev.sharedLightReceiverMode) {
      const foundRunId = extractExperienceRunId(result)

      if (foundRunId) {
        merged.currentExperienceRunId = foundRunId
      } else if (!merged.currentExperienceRunId && prev.currentExperienceRunId) {
        merged.currentExperienceRunId = prev.currentExperienceRunId
      }

      if (!merged.currentShareToken && prev.currentShareToken) {
        merged.currentShareToken = prev.currentShareToken
      }
      if (!merged.currentShareLightId && prev.currentShareLightId) {
        merged.currentShareLightId = prev.currentShareLightId
      }

      if (isLumiDebugEnabled()) {
        console.debug('[useLumi][sharedLightExperienceRunId]', {
          code: merged.lumiCode,
          foundRunId,
          currentExperienceRunId: merged.currentExperienceRunId,
        })
      }
    }

    return merged
  })
}

// ───────── Debug ─────────
// Habilita los logs temporales de aislamiento de bootstrap/session también
// en producción vía ?debug_lumi en la URL, sin depender de un build DEV.
export function isLumiDebugEnabled(): boolean {
  return import.meta.env.DEV || new URLSearchParams(window.location.search).has('debug_lumi')
}

// ───────── Auth ─────────

async function ensureUser(forceAnonymous = false): Promise<{ userId: string; isAnonymous: boolean }> {
  if (!forceAnonymous) {
    // Dev override: si hay VITE_DEV_USER_ID, usarlo directamente
    const devUserId = import.meta.env.VITE_DEV_USER_ID
    if (devUserId) {
      return { userId: devUserId, isAnonymous: false }
    }

    // Buscar sesión existente
    const { data: { session } } = await supabase.auth.getSession()

    if (isLumiDebugEnabled()) {
      console.debug('[useLumi][ensureUser:decision]', {
        forceAnonymous,
        hasExistingSession: !!session,
        existingUserId: session?.user?.id ?? null,
        existingEmail: session?.user?.email ?? null,
        willCreateAnonymous: !session?.user,
      })
    }

    if (session?.user) {
      return {
        userId: session.user.id,
        isAnonymous: session.user.is_anonymous ?? false,
      }
    }
  } else if (isLumiDebugEnabled()) {
    console.debug('[useLumi][ensureUser:decision]', {
      forceAnonymous,
      hasExistingSession: null,
      existingUserId: null,
      existingEmail: null,
      willCreateAnonymous: true,
    })
  }

  // No hay sesión (o se fuerza anónimo) → sign in anónimo
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error || !data.user) {
    throw new Error('No se pudo crear sesión anónima: ' + (error?.message || 'unknown'))
  }

  return {
    userId: data.user.id,
    isAnonymous: true,
  }
}

// ───────── QA: reset a anónimo ─────────
// Utilidad de testing local. Solo se activa con ?qa_anon=1 en la URL.
// No cambia ningún comportamiento por default de la app.
async function maybeApplyQaAnonReset(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search)
  if (params.get('qa_anon') !== '1') return false

  await supabase.auth.signOut({ scope: 'local' })
  localStorage.clear()
  sessionStorage.clear()

  window.history.replaceState(
    {},
    '',
    window.location.pathname + window.location.search.replace(/[?&]qa_anon=1/, '')
  )

  if (import.meta.env.DEV) {
    console.info('[LUMEN QA] Anonymous reset applied')
  }

  return true
}

// ───────── Hook ─────────

export function useLumi() {
  const [state, setState] = useState<LumiState>(initialState)
  const stateRef = useRef(state)
  stateRef.current = state

  const dispatch = useCallback(
    async (action: string, extra?: Record<string, string>) => {
      // Única salida canónica del modo receptor de Circular Luz: la persona
      // creó cuenta (REGISTRATION_SUCCESS) y tocó "Seguimos" (go_home).
      // Supabase nunca limpia sharedLightReceiverMode por su cuenta — lo
      // apaga el frontend acá, después de que la respuesta confirme el ok.
      const isLeavingSharedLightReceiverMode =
        action === 'go_home' &&
        stateRef.current.sharedLightReceiverMode &&
        stateRef.current.lumiCode === 'REGISTRATION_SUCCESS'

      // save_to_sanctuary depende de experience_run_id/share context vigentes
      // en el hook — nunca de lo que traiga `extra`, que puede venir vacío o
      // desactualizado desde el pill que lo dispara. Se reafirman acá en vez
      // de confiar únicamente en buildParams para dejar explícito que este
      // guardado es el mismo mecanismo normal, solo con el contexto correcto.
      const mergedExtra = action === 'save_to_sanctuary'
        ? {
            ...extra,
            experience_run_id: stateRef.current.currentExperienceRunId,
            currentExperienceRunId: stateRef.current.currentExperienceRunId,
            share_token: stateRef.current.currentShareToken,
            currentShareToken: stateRef.current.currentShareToken,
            share_light_id: stateRef.current.currentShareLightId,
            currentShareLightId: stateRef.current.currentShareLightId,
          }
        : extra

      const params = { ...buildParams(stateRef.current), ...mergedExtra }

      if (import.meta.env.DEV) {
        console.log('[LUMI ACTION]', action, { extra: mergedExtra, params })
      }

      if (action === 'save_to_sanctuary' && isLumiDebugEnabled()) {
        console.debug('[useLumi][saveToSanctuaryPayload]', {
          action,
          currentExperienceRunId: stateRef.current.currentExperienceRunId,
          currentShareToken: stateRef.current.currentShareToken,
          currentShareLightId: stateRef.current.currentShareLightId,
          params,
        })
      }

      const { data, error } = await supabase.rpc('lumi_dispatch', { p_action: action, p_params: params })

      if (import.meta.env.DEV) {
        console.log('[LUMI RPC RESULT]', 'lumi_dispatch', { data, error })
      }

      if (action === 'save_to_sanctuary' && isLumiDebugEnabled()) {
        console.debug('[useLumi][saveToSanctuaryResult]', {
          ok: data?.ok,
          code: data?.code,
          error: error?.message || data?.error,
          message: data?.message,
        })
      }

      if (error) {
        console.error(`[useLumi] ${action} error:`, error)
        return
      }

      if (data?.ok) {
        updateState(setState, data as Record<string, unknown>)

        if (isLeavingSharedLightReceiverMode) {
          setState(prev => ({ ...prev, sharedLightReceiverMode: false }))

          if (isLumiDebugEnabled()) {
            console.debug('[useLumi][sharedLightReceiverMode]', {
              enter: false,
              exit: true,
              reason: 'go_home after REGISTRATION_SUCCESS',
            })
          }
        }
      } else {
        console.warn(`[useLumi] ${action} returned not-ok:`, data)
      }
    },
    []
  )

  // Handlers técnicos acotados de Circular Luz (usados por ShareLightEditor
  // para intercalar efectos de cliente —clipboard/share nativo— entre dos
  // llamadas). Aplican la respuesta exactamente igual que dispatch: nunca
  // inventan estado. No exponen una puerta RPC arbitraria a componentes.
  const updateShareLightText = useCallback(
    async (params: { share_light_id: string; editable_text: string }) => {
      const { data, error } = await supabase.rpc('lumi_update_share_light_text', { p_params: params })

      if (error) {
        console.error('[useLumi] lumi_update_share_light_text error:', error)
        return null
      }

      if (data?.ok) {
        updateState(setState, data as Record<string, unknown>)
      } else {
        console.warn('[useLumi] lumi_update_share_light_text returned not-ok:', data)
      }

      return data as Record<string, unknown> | null
    },
    []
  )

  const completeShareLight = useCallback(
    async (params: {
      share_light_id: string
      channel: string
      surface: string
      result: string
      success: string
      final_text: string
      public_url: string
    }) => {
      const { data, error } = await supabase.rpc('lumi_complete_share_light', { p_params: params })

      if (error) {
        console.error('[useLumi] lumi_complete_share_light error:', error)
        return null
      }

      if (data?.ok) {
        updateState(setState, data as Record<string, unknown>)
      } else {
        console.warn('[useLumi] lumi_complete_share_light returned not-ok:', data)
      }

      return data as Record<string, unknown> | null
    },
    []
  )

  // Bootstrap: auth → init_data → go_home
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (isLumiDebugEnabled()) {
        console.debug('[useLumi][bootstrap:start]', {
          url: window.location.href,
          hasQaAnon: new URLSearchParams(window.location.search).has('qa_anon'),
        })
      }

      const qaAnonReset = await maybeApplyQaAnonReset()
      if (cancelled) return

      if (qaAnonReset) {
        setState(initialState)
      }

      // Luz compartida recibida por link: se vive sin crear usuario.
      // Solo si Supabase no puede resolver el token, se cae al bootstrap normal.
      const sharedToken = new URLSearchParams(window.location.search).get('share_light')

      if (sharedToken) {
        const { data, error } = await supabase.rpc('lumi_open_shared_light', {
          p_share_token: sharedToken,
          p_params: {},
        })

        if (cancelled) return

        if (!error && data?.ok) {
          updateState(setState, data as Record<string, unknown>)
          setState(prev => ({ ...prev, sharedLightReceiverMode: true }))

          if (isLumiDebugEnabled()) {
            console.debug('[useLumi][sharedLightReceiverMode]', {
              enter: true,
              exit: false,
              reason: 'lumi_open_shared_light ok',
              shareToken: sharedToken,
            })
          }

          return
        }

        if (error) console.error('[useLumi] lumi_open_shared_light error:', error)
        else console.warn('[useLumi] lumi_open_shared_light returned not-ok:', data)
      }

      if (isLumiDebugEnabled()) {
        const { data: sessionData } = await supabase.auth.getSession()
        console.debug('[useLumi][auth:session-before-ensure]', {
          hasSession: !!sessionData.session,
          userId: sessionData.session?.user?.id ?? null,
          email: sessionData.session?.user?.email ?? null,
          isAnonymous: sessionData.session?.user?.is_anonymous ?? null,
          metadata: sessionData.session?.user?.user_metadata ?? null,
        })
      }

      const { userId, isAnonymous } = await ensureUser(qaAnonReset)

      if (cancelled) return

      if (isLumiDebugEnabled()) {
        console.debug('[useLumi][ensureUser:result]', { userId })
      }

      setState(prev => ({ ...prev, userId, isAnonymous }))

      if (isLumiDebugEnabled()) {
        console.debug('[useLumi][initData:request]', { userId })
      }

      const { data: initData } = await supabase.rpc('lumi_get_init_data', {
        p_user_id: userId,
      })

      if (isLumiDebugEnabled()) {
        // Cast puntual: log de diagnóstico temporal sobre un jsonb cuya
        // forma exacta es justamente lo que se está aislando acá.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const initDataDebug = initData as any
        console.debug('[useLumi][initData:response]', {
          code: initDataDebug?.code ?? null,
          isAnonymous: initDataDebug?.state?.is_anonymous ?? initDataDebug?.is_anonymous ?? null,
          showRegister:
            initDataDebug?.state?.showRegistrationPrompt ?? initDataDebug?.show_register_prompt ?? null,
          firstName: initDataDebug?.state?.first_name ?? initDataDebug?.first_name ?? null,
          message: initDataDebug?.message ?? null,
        })
      }

      if (cancelled) return

      const days = (initData?.days_since_last_session as number) ?? 0
      const reflection = (initData?.reflection_hint as string) || ''

      setState(prev => ({ ...prev, daysSinceLastSession: days }))

      await dispatch('go_home', {
        user_id: userId,
        days_since_last_session: String(days),
      })

      if (cancelled) return

      // Reflejo sobrio: se agrega una sola vez, después de la respuesta
      // inicial de go_home, para no perderse cuando updateState limpia
      // reflectionHint en cada respuesta de dispatch.
      if (reflection) {
        setState(prev => ({ ...prev, reflectionHint: reflection }))
      }
    }

    bootstrap()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Función para vincular cuenta anónima a cuenta real.
  // El receptor de una Circulación de Luz puede llegar sin sesión Auth
  // (lumi_open_shared_light vive la experiencia sin crear usuario): antes
  // de vincular el email hace falta que exista una identidad anónima
  // técnica, si todavía no existe, reutilizando el mismo ensureUser del
  // bootstrap — nunca un mecanismo de auth paralelo.
  //
  // Contrato: resuelve con { userId, name, email } solo si la cuenta
  // quedó realmente vinculada en Auth. Cualquier falla (validación local,
  // identidad anónima, o el propio updateUser) se propaga con throw —
  // nunca un { ok: false } silencioso — para que RegisterForm no pueda
  // interpretar una falla como éxito.
  const linkAccount = useCallback(
    async (name: string, email: string, password: string) => {
      const normalizedName = name?.trim() ?? ''
      const normalizedEmail = email?.trim().toLowerCase() ?? ''
      const normalizedPassword = password?.trim() ?? ''

      if (!normalizedName) {
        throw new Error('Decime cómo querés que te llame.')
      }
      if (!normalizedEmail) {
        throw new Error('Ingresá un email válido.')
      }
      if (!normalizedPassword) {
        throw new Error('Ingresá una clave.')
      }

      let userId = stateRef.current.userId

      if (!userId) {
        const ensured = await ensureUser()
        userId = ensured.userId
        setState(prev => ({ ...prev, userId: ensured.userId, isAnonymous: ensured.isAnonymous }))
      }

      if (import.meta.env.DEV) {
        console.debug('[useLumi] linkAccount payload', {
          hasName: !!normalizedName,
          nameLength: normalizedName.length,
          hasEmail: !!normalizedEmail,
          emailLength: normalizedEmail.length,
          hasPassword: !!normalizedPassword,
          userId,
        })
      }

      const { data, error } = await supabase.auth.updateUser({
        email: normalizedEmail,
        password: normalizedPassword,
        data: {
          display_name: normalizedName,
          first_name: normalizedName,
          name: normalizedName,
        },
      })

      if (error) {
        console.error('[useLumi] linkAccount error:', error)
        throw new Error(mapAuthError(error.message))
      }

      if (!data.user?.id) {
        console.error('[useLumi] linkAccount: updateUser sin user id válido', data)
        throw new Error('No pudimos confirmar la cuenta. Probá nuevamente.')
      }

      setState(prev => ({ ...prev, isAnonymous: false }))
      return { userId: data.user.id, name: normalizedName, email: normalizedEmail }
    },
    []
  )

  return { state, dispatch, linkAccount, updateShareLightText, completeShareLight }
}