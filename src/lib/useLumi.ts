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

  reflectionHint: '',
}

// ───────── Helpers ─────────

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

function updateState(
  setState: React.Dispatch<React.SetStateAction<LumiState>>,
  result: Record<string, unknown>
) {
  setState(prev => ({
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
  }))
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
    if (session?.user) {
      return {
        userId: session.user.id,
        isAnonymous: session.user.is_anonymous ?? false,
      }
    }
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
      const params = { ...buildParams(stateRef.current), ...extra }

      if (import.meta.env.DEV) {
        console.log('[LUMI ACTION]', action, { extra, params })
      }

      const { data, error } = await supabase.rpc('lumi_dispatch', { p_action: action, p_params: params })

      if (import.meta.env.DEV) {
        console.log('[LUMI RPC RESULT]', 'lumi_dispatch', { data, error })
      }

      if (error) {
        console.error(`[useLumi] ${action} error:`, error)
        return
      }

      if (data?.ok) {
        updateState(setState, data as Record<string, unknown>)
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
          return
        }

        if (error) console.error('[useLumi] lumi_open_shared_light error:', error)
        else console.warn('[useLumi] lumi_open_shared_light returned not-ok:', data)
      }

      const { userId, isAnonymous } = await ensureUser(qaAnonReset)

      if (cancelled) return

      setState(prev => ({ ...prev, userId, isAnonymous }))

      const { data: initData } = await supabase.rpc('lumi_get_init_data', {
        p_user_id: userId,
      })

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
  const linkAccount = useCallback(
    async (email: string, password: string) => {
      let userId = stateRef.current.userId

      if (!userId) {
        try {
          const ensured = await ensureUser()
          userId = ensured.userId
          setState(prev => ({ ...prev, userId: ensured.userId, isAnonymous: ensured.isAnonymous }))
        } catch (err) {
          console.error('[useLumi] linkAccount anon bootstrap error:', err)
          return { ok: false, error: 'No se pudo preparar la cuenta. Intentá de nuevo.' }
        }
      }

      const { data, error } = await supabase.auth.updateUser({
        email,
        password,
      })
      if (error) {
        console.error('[useLumi] linkAccount error:', error)
        return { ok: false, error: error.message }
      }
      setState(prev => ({ ...prev, isAnonymous: false }))
      return { ok: true, user: data.user, userId }
    },
    []
  )

  return { state, dispatch, linkAccount, updateShareLightText, completeShareLight }
}