import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

// ─── ensureAnonymousUser ──────────────────────────────────────────
// Patrón "promesa singleton" — previene doble creación de usuario
// bajo React 18 StrictMode (Vite dev monta dos veces).
let userPromise: Promise<User | null> | null = null

function ensureAnonymousUser(): Promise<User | null> {
  if (userPromise) return userPromise
  userPromise = (async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session.user
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.error('[useLumi] Auth anónima falló.', error)
      userPromise = null
      return null
    }
    return data.user
  })()
  return userPromise
}

// ─── State shape ──────────────────────────────────────────────────
export type Action = { label: string; action: string; value?: string }

export type LumiState = {
  userId: string
  lang: string
  daysSinceLastSession: number
  currentSessionId: string
  currentResourceId: string
  currentSanctuaryItemId: string
  contentSource: string
  moduleColor: string
  lumiMessage: string
  lumiCulturePhrase: string
  lumiActions: Action[]
  lumiContentType: string
  lumiContentData: Record<string, unknown>
  lumiCode: string
  checkinState: string
  checkinArea: string
  checkinTime: string
}

const initialState: LumiState = {
  userId: '',
  lang: 'es',
  daysSinceLastSession: 0,
  currentSessionId: '',
  currentResourceId: '',
  currentSanctuaryItemId: '',
  contentSource: '',
  moduleColor: '#7860E0',
  lumiMessage: '',
  lumiCulturePhrase: '',
  lumiActions: [],
  lumiContentType: 'empty_presence',
  lumiContentData: {},
  lumiCode: '',
  checkinState: '',
  checkinArea: '',
  checkinTime: '',
}

function buildParams(state: LumiState): Record<string, string> {
  return {
    user_id: state.userId,
    session_id: state.currentSessionId,
    resource_id: state.currentResourceId,
    sanctuary_item_id: state.currentSanctuaryItemId,
    lang: state.lang,
    source: state.contentSource,
    checkin_state: state.checkinState,
    checkin_area: state.checkinArea,
    checkin_time: state.checkinTime,
  }
}

function updateState(
  setState: React.Dispatch<React.SetStateAction<LumiState>>,
  result: Record<string, unknown>
) {
  setState(prev => {
    const content = (result.content as Record<string, unknown>) ?? {}
    const culturePhrase =
      typeof content.culture_phrase === 'string'
        ? (content.culture_phrase as string)
        : prev.lumiCulturePhrase

    // ── Resolución de session_id y resource_id ──
    // Prioridad: state override del backend (si no es vacío) > content > prev.
    // Strings vacíos del backend NO limpian valores ya seteados.
    const stateOverride = (result.state as Partial<LumiState>) || {}
    const overrideSession =
      typeof stateOverride.currentSessionId === 'string' ? stateOverride.currentSessionId : ''
    const overrideResource =
      typeof stateOverride.currentResourceId === 'string' ? stateOverride.currentResourceId : ''
    const contentSession =
      typeof content.session_id === 'string' ? content.session_id : ''
    const contentResource =
      typeof content.resource_id === 'string' ? content.resource_id : ''
    const finalSessionId = overrideSession || contentSession || prev.currentSessionId
    const finalResourceId = overrideResource || contentResource || prev.currentResourceId

    return {
      ...prev,
      lumiMessage:       (result.message as string)        ?? prev.lumiMessage,
      lumiActions:       (result.actions as Action[])      ?? prev.lumiActions,
      lumiContentType:   (result.content_type as string)   ?? prev.lumiContentType,
      lumiContentData:   content,
      lumiCulturePhrase: culturePhrase,
      lumiCode:          (result.code as string)           ?? prev.lumiCode,
      ...stateOverride,
      currentSessionId: finalSessionId,
      currentResourceId: finalResourceId,
    }
  })
}

// ─── useLumi hook ─────────────────────────────────────────────────
export function useLumi() {
  const [state, setState] = useState<LumiState>(initialState)

  const dispatch = useCallback(
    async (action: string, extra?: Record<string, string>) => {
      const params = { ...buildParams(state), ...extra }

const { data, error } = await supabase.rpc('lumi_dispatch', {
        p_action: action,
        p_params: params,
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
    [state]
  )

  useEffect(() => {
    let cancelled = false

    async function init() {
      const user = await ensureAnonymousUser()
      if (cancelled || !user) return
      setState(prev => ({ ...prev, userId: user.id }))

      const { data: initData } = await supabase.rpc('lumi_get_init_data', {
        p_user_id: user.id,
      })
      if (cancelled) return

      const days = (initData?.days_since_last_session as number) ?? 0
      setState(prev => ({ ...prev, daysSinceLastSession: days }))

      const { data: homeData, error: homeErr } = await supabase.rpc('lumi_dispatch', {
        p_action: 'go_home',
        p_params: {
          user_id: user.id,
          session_id: '',
          resource_id: '',
          sanctuary_item_id: '',
          lang: 'es',
          days_since_last_session: String(days),
        },
      })
      if (cancelled) return
      if (homeErr) {
        console.error('[useLumi] go_home error:', homeErr)
        return
      }
      if (homeData?.ok) {
        updateState(setState, homeData as Record<string, unknown>)
      }
    }

    init()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { state, dispatch }
}
