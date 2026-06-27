import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from './supabase'

// ───────── Types ─────────

export interface Action {
  label: string
  action: string
  value?: string
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
  checkinHelpIntent: string
  checkinTime: string

  // Experiencia (modelo nuevo)
  currentExperienceRunId: string
  selectedIkKey: string

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
  checkinHelpIntent: '',
  checkinTime: '',

  currentExperienceRunId: '',
  selectedIkKey: '',

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
    // Check-in (4 pasos canónicos)
    checkin_state:       state.checkinState,
    checkin_area:        state.checkinArea,
    checkin_help_intent: state.checkinHelpIntent,
    checkin_time:        state.checkinTime,
    // Experiencia activa (modelo nuevo)
    experience_run_id: state.currentExperienceRunId,
  }
}

function updateState(
  setState: React.Dispatch<React.SetStateAction<LumiState>>,
  result: Record<string, unknown>
) {
  setState(prev => ({
    ...prev,
    lumiMessage: (result.message as string) ?? prev.lumiMessage,
    lumiActions: (result.actions as Action[]) ?? prev.lumiActions,
    lumiContentType: (result.content_type as string) ?? prev.lumiContentType,
    lumiContentData: (result.content as Record<string, unknown>) ?? prev.lumiContentData,
    lumiCode: (result.code as string) ?? prev.lumiCode,
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
      const { data, error } = await supabase.rpc('lumi_dispatch', {
        p_action: action,
        p_params: { ...buildParams(stateRef.current), ...extra },
      })

      if (error) {
        console.error('[useLumi] dispatch error:', error)
        return
      }

      if (data?.ok) {
        updateState(setState, data as Record<string, unknown>)
      } else {
        console.warn('[useLumi] dispatch returned not-ok:', data)
      }
    },
    []
  )

  // Bootstrap: auth → init_data → go_home
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
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

  return { state, dispatch, linkAccount }
}