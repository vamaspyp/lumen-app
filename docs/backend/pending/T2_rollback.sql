-- T2 · ROLLBACK EXPLÍCITO
-- Snapshot vivo capturado antes de aplicar T2 (2026-09-01).
-- Restaura las tres funciones/nodo reemplazados y retira objetos nuevos T2.

begin;

update public.lumen_nodes
set message_text = 'Si esto te dejó algo valioso, podés guardarlo en tu Santuario para volver cuando lo necesites.',
    actions_json = jsonb_build_array(
      jsonb_build_object('label','Guardar en Santuario','action','save_to_sanctuary','variant','solid'),
      jsonb_build_object('label','No, gracias','action','go_home','variant','ghost')
    ),
    updated_at = '2026-07-16 13:50:27.169195+00'::timestamptz
where code = 'POST_EFFECT_OFFER';

create or replace function public.lumi_activate_faro(p_params jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid;
  v_area text;
  v_key text;
  v_label text;
begin
  p_params := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));

  v_user_id := nullif(trim(p_params->>'user_id'), '')::uuid;
  v_area := nullif(trim(coalesce(p_params->>'area', p_params->>'area_key', p_params->>'checkin_area')), '');
  v_key := nullif(trim(coalesce(nullif(p_params->>'value', ''), p_params->>'faro_key')), '');

  if v_area is null then
    select parent_key
      into v_area
    from public.ui_copy
    where domain = 'faro'
      and lang = 'es'
      and key = v_key
    limit 1;
  end if;

  select short_label
    into v_label
  from public.ui_copy
  where domain = 'faro'
    and lang = 'es'
    and key = v_key
    and parent_key = v_area
  limit 1;

  if v_user_id is null or v_area is null or v_key is null or v_label is null then
    raise exception 'Faro inválido';
  end if;

  insert into public.user_area_faros (
    user_id, area, faro_key, faro_text, status,
    activated_at, paused_at, closed_at,
    close_reason, close_reflection, close_value_key,
    created_at, updated_at
  )
  values (
    v_user_id, v_area::public.life_area, v_key, v_label, 'active',
    now(), null, null,
    null, null, null,
    now(), now()
  )
  on conflict (user_id, area, faro_key)
    where status in ('active', 'paused')
  do update set
    status = 'active',
    faro_text = excluded.faro_text,
    activated_at = now(),
    paused_at = null,
    closed_at = null,
    close_reason = null,
    close_reflection = null,
    close_value_key = null,
    updated_at = now();

  return public.lumi_open_faros(p_params);
end;
$function$;

create or replace function public.lumi_get_presence_context(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $function$
declare
  v_has_history boolean := false;
  v_days_since integer := 0;
  v_active_faros jsonb := '[]'::jsonb;
  v_last_faro_worked jsonb := null;
  v_last_area_worked text := null;
  v_last_cap_perceived text := null;
  v_sanctuary_highlights jsonb := '[]'::jsonb;
  v_has_sanctuary boolean := false;
  v_session_count integer := 0;
begin
  select
    count(*),
    coalesce(extract(day from (now() - max(s.created_at)))::integer, 0)
  into
    v_session_count,
    v_days_since
  from public.sessions s
  where s.user_id = p_user_id
    and s.mode = 'propose';

  v_has_history := v_session_count > 0;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'user_area_faro_id', uaf.id::text,
        'area', uaf.area::text,
        'faro_key', uaf.faro_key,
        'faro_label', coalesce(faro_uc.short_label, uaf.faro_key),
        'faro_text', coalesce(uaf.faro_text, '')
      )
      order by uaf.updated_at desc
    ),
    '[]'::jsonb
  )
  into v_active_faros
  from public.user_area_faros uaf
  left join public.ui_copy faro_uc
    on faro_uc.domain = 'faro'
   and faro_uc.lang = 'es'
   and faro_uc.key = uaf.faro_key
  where uaf.user_id = p_user_id
    and uaf.faro_key is not null
    and uaf.faro_key <> '';

  select jsonb_build_object(
    'user_area_faro_id', er.user_area_faro_id::text,
    'faro_key', er.faro_key,
    'faro_label', coalesce(faro_uc.short_label, er.faro_key),
    'area', er.life_area_key,
    'last_run_at', er.started_at
  )
  into v_last_faro_worked
  from public.experience_runs er
  left join public.ui_copy faro_uc
    on faro_uc.domain = 'faro'
   and faro_uc.lang = 'es'
   and faro_uc.key = er.faro_key
  where er.user_id = p_user_id
    and er.faro_key is not null
  order by er.started_at desc
  limit 1;

  select er.life_area_key
  into v_last_area_worked
  from public.experience_runs er
  where er.user_id = p_user_id
    and er.life_area_key is not null
  order by er.started_at desc
  limit 1;

  select uc.subtitle
  into v_last_cap_perceived
  from public.experience_runs er
  join public.ui_copy uc
    on uc.domain = 'capability'
   and uc.lang = 'es'
   and uc.key = er.perceived_capability_key
  where er.user_id = p_user_id
    and er.perceived_capability_key is not null
  order by er.started_at desc
  limit 1;

  select count(*) > 0
  into v_has_sanctuary
  from public.sanctuary_items
  where user_id = p_user_id
    and experience_run_id is not null;

  if v_has_sanctuary then
    select coalesce(jsonb_agg(item order by item->>'created_at' desc), '[]'::jsonb)
    into v_sanctuary_highlights
    from (
      select jsonb_build_object(
        'sanctuary_item_id', si.id::text,
        'title', coalesce(e.title, r.title, ''),
        'faro_key', si.faro_key,
        'faro_label', coalesce(faro_uc.short_label, si.faro_key, ''),
        'expected_capability_key', er.expected_capability_key,
        'perceived_capability_key', er.perceived_capability_key,
        'created_at', si.created_at
      ) as item
      from public.sanctuary_items si
      left join public.experiences e on e.id = si.experience_id
      left join public.resources r on r.id = si.resource_id
      left join public.experience_runs er on er.id = si.experience_run_id
      left join public.ui_copy faro_uc
        on faro_uc.domain = 'faro'
       and faro_uc.lang = 'es'
       and faro_uc.key = si.faro_key
      where si.user_id = p_user_id
        and si.experience_run_id is not null
      order by si.created_at desc
      limit 2
    ) sub;
  end if;

  return jsonb_build_object(
    'has_history', v_has_history,
    'session_count', v_session_count,
    'days_since_last_session', v_days_since,
    'active_faros', v_active_faros,
    'last_faro_worked', v_last_faro_worked,
    'last_area_worked', v_last_area_worked,
    'last_capability_perceived', v_last_cap_perceived,
    'sanctuary_highlights', v_sanctuary_highlights,
    'has_sanctuary_items', v_has_sanctuary
  );
end;
$function$;

create or replace function public.lumi_go_home(p_params jsonb)
returns jsonb
language plpgsql
security definer
as $function$
declare
  v_user_id uuid;
  v_user_name text;
  v_sanctuary_count integer;
  v_node_code text;
  v_node jsonb;
  v_message text;
begin
  p_params := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));

  v_user_id := nullif(trim(coalesce(p_params->>'user_id', '')), '')::uuid;

  if v_user_id is not null then
    select coalesce(nullif(trim(first_name), ''), 'Pablo')
    into v_user_name
    from public.users
    where id = v_user_id;
  end if;

  v_user_name := coalesce(v_user_name, 'Pablo');

  if v_user_id is not null then
    select count(*)
    into v_sanctuary_count
    from public.sanctuary_items
    where user_id = v_user_id
      and experience_run_id is not null;
  else
    v_sanctuary_count := 0;
  end if;

  v_node_code := case
    when v_sanctuary_count > 0 then 'HOME_RETURNING'
    else 'HOME_DEFAULT'
  end;

  v_node := public.lumi_get_node(v_node_code);
  v_message := coalesce(v_node->>'message', '');
  v_message := replace(v_message, 'Pablo', v_user_name);

  return jsonb_build_object(
    'ok', true,
    'code', v_node_code,
    'title', v_node->>'title',
    'module', coalesce(v_node->>'module', 'home'),
    'node_type', v_node->>'node_type',
    'moment_type', v_node->>'moment_type',
    'message', v_message,
    'actions', coalesce(v_node->'actions', '[]'::jsonb),
    'content_type', coalesce(v_node->>'content_type', 'empty_presence'),
    'content', coalesce(v_node->'content', jsonb_build_object('type','empty_presence','source','home')),
    'metadata', coalesce(v_node->'metadata', '{}'::jsonb),
    'state', public.lumi_clear_conversation_state('lumi','#7860E0','','')
  );
end;
$function$;

-- Retirar endpoints nuevos T2.
drop function if exists public.lumi_submit_checkin_faro_remeasurement(jsonb);
drop function if exists public.lumi_open_faro_remeasurement(jsonb);
drop function if exists public.lumi_submit_checkin_faro_baseline(jsonb);
drop function if exists public.lumi_get_depth_eligibility(jsonb);
drop function if exists public.lumi_submit_return(jsonb);
drop function if exists public.lumi_open_return(jsonb);
drop function if exists public.lumi_create_commitment(jsonb);
drop function if exists public.lumi_offer_commitment(jsonb);

-- Retirar helpers internos antes de las tablas.
drop function if exists private.lumen_get_depth_eligibility(uuid, uuid);
drop function if exists private.lumen_get_due_continuity(uuid);
drop function if exists private.lumen_actor_allowed(uuid);

-- Persistencia T2. El schema private se conserva: es una frontera reusable.
drop table if exists public.faro_measurements;
drop table if exists public.lumen_returns;
drop table if exists public.lumen_commitments;

commit;
