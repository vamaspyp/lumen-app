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

// Actions cuyo nodo real se resuelve con una RPC específica en vez del
// dispatcher genérico lumi_dispatch.
const DIRECT_RPC_ACTIONS: Record<string, string> = {
  share_light: 'lumi_share_light',
  start_shared_light: 'lumi_start_shared_light',
  complete_shared_light: 'lumi_complete_shared_light',
  submit_shared_light_signal: 'lumi_submit_shared_light_signal',
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
    // Supabase decide qué App State actualizar
    ...((result.state as Partial<LumiState>) || {}),
  }))
}

// ───────── Auth ─────────

async function ensureUser(): Promise<{ userId: string; isAnonymous: boolean }> {
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

  // No hay sesión → sign in anónimo
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error || !data.user) {
    throw new Error('No se pudo crear sesión anónima: ' + (error?.message || 'unknown'))
  }

  return {
    userId: data.user.id,
    isAnonymous: true,
  }
}

// ───────── Hook ─────────

export function useLumi() {
  const [state, setState] = useState<LumiState>(initialState)
  const stateRef = useRef(state)
  stateRef.current = state

  const dispatch = useCallback(
    async (action: string, extra?: Record<string, string>) => {
      const params = { ...buildParams(stateRef.current), ...extra }

      // Algunas actions resuelven su nodo real con una RPC específica
      // (Circular Luz) en vez del dispatcher genérico. Se aplica siempre
      // como cualquier respuesta de nodo: Supabase decide, React renderiza.
      const rpcName = DIRECT_RPC_ACTIONS[action]
      const { data, error } = rpcName
        ? await supabase.rpc(rpcName, { p_params: params })
        : await supabase.rpc('lumi_dispatch', { p_action: action, p_params: params })

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

  // Llamada directa a una RPC de nodo (usada por flujos que necesitan
  // intercalar efectos de cliente —clipboard/share— entre dos llamadas,
  // como la secuencia de copiar/compartir de ShareLightEditor). Aplica
  // la respuesta exactamente igual que dispatch: nunca inventa estado.
  const callRpc = useCallback(
    async (rpcName: string, params: Record<string, string>) => {
      const { data, error } = await supabase.rpc(rpcName, { p_params: params })

      if (error) {
        console.error(`[useLumi] ${rpcName} error:`, error)
        return null
      }

      if (data?.ok) {
        updateState(setState, data as Record<string, unknown>)
      } else {
        console.warn(`[useLumi] ${rpcName} returned not-ok:`, data)
      }

      return data as Record<string, unknown> | null
    },
    []
  )

  // Bootstrap: auth → init_data → go_home
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
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

      const { userId, isAnonymous } = await ensureUser()

      if (cancelled) return

      setState(prev => ({ ...prev, userId, isAnonymous }))

      const { data: initData } = await supabase.rpc('lumi_get_init_data', {
        p_user_id: userId,
      })

      if (cancelled) return

      const days = (initData?.days_since_last_session as number) ?? 0
      const reflection = (initData?.reflection_hint as string) || ''

      setState(prev => ({
        ...prev,
        daysSinceLastSession: days,
        reflectionHint: reflection,
      }))

      await dispatch('go_home', {
        user_id: userId,
        days_since_last_session: String(days),
      })
    }

    bootstrap()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Función para vincular cuenta anónima a cuenta real
  const linkAccount = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.updateUser({
        email,
        password,
      })
      if (error) {
        console.error('[useLumi] linkAccount error:', error)
        return { ok: false, error: error.message }
      }
      setState(prev => ({ ...prev, isAnonymous: false }))
      return { ok: true, user: data.user }
    },
    []
  )

  return { state, dispatch, linkAccount, callRpc }
}