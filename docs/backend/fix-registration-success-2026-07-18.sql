-- ============================================================
-- FIX: Cerrar Circulación de Luz + Cuenta Express — REGISTRATION_SUCCESS
-- Fecha: 2026-07-18
-- Ejecutar en Supabase SQL Editor. Bloque único, idempotente.
-- ============================================================
--
-- Causa raíz: el nodo REGISTRATION_SUCCESS ya existe en lumen_nodes
-- (creado 2026-06-27) pero ningún RPC lo devuelve. RegisterForm.tsx
-- hacía dispatch('go_home') directo tras un registro exitoso, saltando
-- el nodo canónico de confirmación.
--
-- Esta función es un wrapper mínimo, exactamente análogo a
-- lumi_show_register_form / lumi_dismiss_registration_prompt: solo
-- expone el nodo REGISTRATION_SUCCESS ya existente a través del
-- dispatcher universal (lumi_dispatch → action 'complete_registration').
--
-- No crea tablas. No duplica linkAccount/updateUser (la cuenta ya fue
-- creada en el cliente antes de esta llamada). No toca otros nodos ni
-- RPCs. 'state' se devuelve mínimo a propósito: currentShareToken,
-- currentExperienceRunId, currentSessionId, etc. quedan intactos
-- porque React solo sobreescribe lo que el nodo trae explícitamente.

CREATE OR REPLACE FUNCTION public.lumi_complete_registration(p_params jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_node jsonb;
BEGIN
  v_node := public.lumi_get_node('REGISTRATION_SUCCESS');

  RETURN jsonb_build_object(
    'ok',           true,
    'code',         'REGISTRATION_SUCCESS',
    'message',      coalesce(v_node->>'message', 'Listo. Todo lo que construiste hasta ahora queda guardado con vos.'),
    'actions',      coalesce(v_node->'actions', '[]'::jsonb),
    'content_type', 'empty_presence',
    'content',      jsonb_build_object('type', 'empty_presence'),
    'state',        jsonb_build_object(
                      'contentSource',         'lumi',
                      'showRegistrationPrompt', false
                    )
  );
END;
$function$;
