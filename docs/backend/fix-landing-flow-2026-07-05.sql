-- ============================================================
-- FIX: Flujo de llegada canónico — culture_phrase una sola vez
-- Fecha: 2026-07-05
-- Ejecutar en orden. Cada bloque es independiente.
-- ============================================================


-- ── 1. lumi_submit_name ──────────────────────────────────────
-- Saca culture_phrase del content de HOME_DEFAULT.
-- Era el lugar incorrecto; ahora vive solo en LUMI_PRESENCE_ENTRY.

CREATE OR REPLACE FUNCTION public.lumi_submit_name(p_params jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id    uuid;
  v_first_name text;
  v_node       jsonb;
  v_message    text;
BEGIN
  v_user_id    := nullif(trim(p_params->>'user_id'), '')::uuid;
  v_first_name := nullif(trim(p_params->>'first_name'), '');

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_user_id');
  END IF;

  IF v_first_name IS NOT NULL AND length(v_first_name) > 0 THEN
    UPDATE public.users
    SET first_name = substring(v_first_name from 1 for 40), has_visited = true
    WHERE id = v_user_id;
    v_message := 'Hola, ' || substring(v_first_name from 1 for 40)
              || '. No hace falta que sepas qué necesitás. Podemos empezar por algo pequeño.';
  ELSE
    UPDATE public.users SET has_visited = true WHERE id = v_user_id;
    v_message := 'No hace falta que sepas qué necesitás. Podemos empezar por algo pequeño.';
  END IF;

  v_node := public.lumi_get_node('HOME_DEFAULT');

  RETURN jsonb_build_object(
    'ok',           true,
    'code',         'HOME_DEFAULT',
    'message',      v_message,
    'actions',      coalesce(v_node->'actions', '[]'::jsonb),
    'content_type', 'empty_presence',
    'content',      jsonb_build_object('type', 'empty_presence'),
    'state', jsonb_build_object(
      'contentSource', '', 'moduleColor', '#7860E0',
      'currentSessionId', '', 'currentResourceId', '', 'currentSanctuaryItemId', ''
    )
  );
END;
$$;


-- ── 2. lumi_start_checkin ────────────────────────────────────
-- Agregar culture_phrase al content del nodo LUMI_PRESENCE_ENTRY.
-- INSTRUCCIÓN: abrí la función actual en SQL Editor y buscá el
-- jsonb_build_object que construye el content del return de
-- LUMI_PRESENCE_ENTRY. Agregá esta línea dentro de ese objeto:
--
--   'culture_phrase', coalesce(public.lumi_get_message('culture_phrase', 'first_contact'), ''),
--
-- Ejemplo — si el content actual es:
--   content: jsonb_build_object('type', 'checkin_options', 'step', 'hemisphere', 'options', v_options)
-- Debe quedar:
--   content: jsonb_build_object(
--     'type', 'checkin_options',
--     'step', 'hemisphere',
--     'options', v_options,
--     'culture_phrase', coalesce(public.lumi_get_message('culture_phrase', 'first_contact'), '')
--   )
--
-- También necesitás declarar la variable en el DECLARE si no existe:
--   v_culture_phrase text;
-- Y asignarla antes del RETURN:
--   v_culture_phrase := public.lumi_get_message('culture_phrase', 'first_contact');


-- ── 3. lumi_submit_checkin_hemisphere — rama H1 ──────────────
-- Cambiar la rama H1: en vez de devolver checkin_options con
-- picker de área, devuelve un nodo lumi_scan random.
-- La rama H2 NO se toca.
--
-- INSTRUCCIÓN: abrí la función en SQL Editor.
-- En la rama H1 (v_hemisphere = 'H1'), reemplazá todo lo que
-- construye el checkin_options de área por esto:

/*
DECLARE
  v_scan_node record;
  -- (mantener el resto del DECLARE actual)
BEGIN
  -- (mantener v_hemisphere := ... y la rama H2 intacta)

  -- Rama H1: mostrar scan antes del picker de área
  SELECT code, message_text, actions_json, content_json
  INTO   v_scan_node
  FROM   public.lumen_nodes
  WHERE  moment_type = 'landing_scan'
    AND  active = true
  ORDER BY random()
  LIMIT 1;

  RETURN jsonb_build_object(
    'ok',           true,
    'code',         v_scan_node.code,
    'message',      coalesce(v_scan_node.message_text, ''),
    'actions',      coalesce(v_scan_node.actions_json, '[]'::jsonb),
    'content_type', 'lumi_scan',
    'content',      coalesce(v_scan_node.content_json, '{}'::jsonb),
    'state',        jsonb_build_object('checkinHemisphere', 'H1')
  );
END;
*/


-- ── 4. lumi_complete_scan ────────────────────────────────────
-- Reemplazar completamente: antes devolvía CULTURE_PHRASE/go_home
-- (callejón sin salida), ahora devuelve el picker de área H1.

CREATE OR REPLACE FUNCTION public.lumi_complete_scan(p_params jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_node    jsonb;
  v_options jsonb;
BEGIN
  v_node := public.lumi_get_node('LUMI_H1_LANDING');

  SELECT jsonb_agg(
    jsonb_build_object('value', uc.key, 'label', uc.short_label, 'hint', uc.subtitle)
    ORDER BY uc.sort_order, uc.key
  ) INTO v_options
  FROM public.ui_copy uc
  WHERE uc.domain = 'area' AND uc.lang = 'es';

  RETURN jsonb_build_object(
    'ok',           true,
    'code',         'LUMI_H1_LANDING',
    'message',      coalesce(v_node->>'message',
                      'Miremos este momento con suavidad. ¿En qué área de tu vida está más presente?'),
    'actions',      coalesce(v_node->'actions', '[]'::jsonb),
    'content_type', 'checkin_options',
    'content',      jsonb_build_object(
                      'type',    'checkin_options',
                      'step',    'area',
                      'options', coalesce(v_options, '[]'::jsonb)
                    ),
    'state',        jsonb_build_object('checkinHemisphere', 'H1')
  );
END;
$$;


-- ── 5. Desactivar nodo CULTURE_PHRASE ────────────────────────
-- No borrarlo, solo apagarlo.

UPDATE public.lumen_nodes
SET active = false
WHERE code = 'CULTURE_PHRASE';
