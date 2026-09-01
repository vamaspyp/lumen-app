-- T2 · CONTINUIDAD · 03 INTEGRACIÓN
-- Requiere T2_01 + T2_02.
-- Integra: oferta post-experiencia, baseline/remedición Faro, presence context
-- y reentrada explicable. No agrega push, rachas ni score.

begin;

-- 1) La salida positiva ofrece dos formas distintas de conservar valor:
-- Santuario (guardar) o Continuidad (elegir volver).
update public.lumen_nodes
set message_text = 'Si esto te dejó algo valioso, podés guardarlo o elegir volver más adelante.',
    actions_json = jsonb_build_array(
      jsonb_build_object('label','Guardar en Santuario','action','save_to_sanctuary','variant','solid'),
      jsonb_build_object('label','Volver a esto','action','offer_commitment','variant','outline'),
      jsonb_build_object('label','No, gracias','action','go_home','value','skip_continuity','variant','ghost')
    ),
    updated_at = now()
where code = 'POST_EFFECT_OFFER';

-- 2) Activar un Faro pide la línea base aprobada sólo si esa instancia no la
-- tiene todavía. El Faro se activa primero; la medición no decide su existencia.
create or replace function public.lumi_activate_faro(p_params jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_area text;
  v_key text;
  v_label text;
  v_user_area_faro_id uuid;
  v_options jsonb;
begin
  p_params := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));

  v_user_id := nullif(trim(p_params->>'user_id'), '')::uuid;
  v_area := nullif(trim(coalesce(p_params->>'area', p_params->>'area_key', p_params->>'checkin_area')), '');
  v_key := nullif(trim(coalesce(nullif(p_params->>'value', ''), p_params->>'faro_key')), '');

  if not private.lumen_actor_allowed(v_user_id) then
    return jsonb_build_object('ok', false, 'error', 'forbidden', 'state', '{}'::jsonb);
  end if;

  if v_area is null then
    select uc.parent_key
    into v_area
    from public.ui_copy uc
    where uc.domain = 'faro'
      and uc.lang = 'es'
      and uc.key = v_key
    limit 1;
  end if;

  select uc.short_label
  into v_label
  from public.ui_copy uc
  where uc.domain = 'faro'
    and uc.lang = 'es'
    and uc.key = v_key
    and uc.parent_key = v_area
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
    updated_at = now()
  returning id into v_user_area_faro_id;

  if not exists (
    select 1
    from public.faro_measurements fm
    where fm.user_area_faro_id = v_user_area_faro_id
      and fm.measurement_kind = 'baseline'
  ) then
    select jsonb_agg(
      jsonb_build_object(
        'value', gs::text,
        'label', gs::text,
        'user_area_faro_id', v_user_area_faro_id::text
      )
      order by gs
    )
    into v_options
    from generate_series(0, 10) gs;

    return jsonb_build_object(
      'ok', true,
      'code', 'FARO_BASELINE_PROMPT',
      'message', '¿Cuánto sentís hoy que podés avanzar en esto?',
      'actions', '[]'::jsonb,
      'content_type', 'checkin_options',
      'content', jsonb_build_object(
        'type','checkin_options',
        'step','faro_baseline',
        'options',coalesce(v_options,'[]'::jsonb),
        'scale_min',0,
        'scale_max',10,
        'user_area_faro_id',v_user_area_faro_id::text
      ),
      'state', jsonb_build_object(
        'checkinArea',v_area,
        'checkinFaro',v_key,
        'contentSource','faros'
      )
    );
  end if;

  return public.lumi_open_faros(p_params);
end;
$function$;

create or replace function public.lumi_submit_checkin_faro_baseline(p_params jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_user_area_faro_id uuid;
  v_value smallint;
  v_result jsonb;
begin
  p_params := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));
  v_user_id := nullif(trim(p_params->>'user_id'), '')::uuid;
  v_user_area_faro_id := nullif(trim(p_params->>'user_area_faro_id'), '')::uuid;
  v_value := nullif(trim(coalesce(p_params->>'checkin_faro_baseline', p_params->>'value')), '')::smallint;

  if not private.lumen_actor_allowed(v_user_id) then
    return jsonb_build_object('ok', false, 'error', 'forbidden', 'state', '{}'::jsonb);
  end if;

  if v_value is null or v_value < 0 or v_value > 10 then
    return jsonb_build_object('ok', false, 'error', 'valor_faro_invalido', 'state', '{}'::jsonb);
  end if;

  if not exists (
    select 1
    from public.user_area_faros uaf
    where uaf.id = v_user_area_faro_id
      and uaf.user_id = v_user_id
  ) then
    return jsonb_build_object('ok', false, 'error', 'faro_no_encontrado', 'state', '{}'::jsonb);
  end if;

  insert into public.faro_measurements (
    user_id, user_area_faro_id, measurement_kind, value, metadata
  ) values (
    v_user_id,
    v_user_area_faro_id,
    'baseline',
    v_value,
    jsonb_build_object(
      'contract','t2_faro_measurement_v1',
      'question','¿Cuánto sentís hoy que podés avanzar en esto?',
      'scale','0..10',
      'created_via','lumi_submit_checkin_faro_baseline'
    )
  )
  on conflict (user_area_faro_id) where measurement_kind = 'baseline'
  do nothing;

  v_result := public.lumi_open_faros(p_params);
  return v_result || jsonb_build_object(
    'message','Gracias. Es una foto de hoy, no una medida de quién sos.'
  );
end;
$function$;

create or replace function public.lumi_open_faro_remeasurement(p_params jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_user_area_faro_id uuid;
  v_options jsonb;
begin
  p_params := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));
  v_user_id := nullif(trim(p_params->>'user_id'), '')::uuid;
  v_user_area_faro_id := nullif(trim(coalesce(p_params->>'user_area_faro_id', p_params->>'value')), '')::uuid;

  if not private.lumen_actor_allowed(v_user_id) then
    return jsonb_build_object('ok', false, 'error', 'forbidden', 'state', '{}'::jsonb);
  end if;

  if not exists (
    select 1
    from public.user_area_faros uaf
    join public.faro_measurements fm
      on fm.user_area_faro_id = uaf.id
     and fm.measurement_kind = 'baseline'
    where uaf.id = v_user_area_faro_id
      and uaf.user_id = v_user_id
      and uaf.status = 'active'
      and fm.created_at <= now() - interval '30 days'
      and not exists (
        select 1
        from public.faro_measurements rm
        where rm.user_area_faro_id = uaf.id
          and rm.measurement_kind = 'remeasurement'
          and rm.created_at >= fm.created_at
      )
  ) then
    return jsonb_build_object('ok', false, 'error', 'remedicion_no_vencida', 'state', '{}'::jsonb);
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'value', gs::text,
      'label', gs::text,
      'user_area_faro_id', v_user_area_faro_id::text
    )
    order by gs
  )
  into v_options
  from generate_series(0, 10) gs;

  return jsonb_build_object(
    'ok', true,
    'code', 'FARO_REMEASUREMENT_PROMPT',
    'message', '¿Cuánto sentís hoy que podés avanzar en esto?',
    'actions', '[]'::jsonb,
    'content_type', 'checkin_options',
    'content', jsonb_build_object(
      'type','checkin_options',
      'step','faro_remeasurement',
      'options',coalesce(v_options,'[]'::jsonb),
      'scale_min',0,
      'scale_max',10,
      'user_area_faro_id',v_user_area_faro_id::text
    ),
    'state', jsonb_build_object('contentSource','faros')
  );
end;
$function$;

create or replace function public.lumi_submit_checkin_faro_remeasurement(p_params jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_user_area_faro_id uuid;
  v_value smallint;
  v_baseline_at timestamptz;
begin
  p_params := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));
  v_user_id := nullif(trim(p_params->>'user_id'), '')::uuid;
  v_user_area_faro_id := nullif(trim(p_params->>'user_area_faro_id'), '')::uuid;
  v_value := nullif(trim(coalesce(p_params->>'checkin_faro_remeasurement', p_params->>'value')), '')::smallint;

  if not private.lumen_actor_allowed(v_user_id) then
    return jsonb_build_object('ok', false, 'error', 'forbidden', 'state', '{}'::jsonb);
  end if;

  if v_value is null or v_value < 0 or v_value > 10 then
    return jsonb_build_object('ok', false, 'error', 'valor_faro_invalido', 'state', '{}'::jsonb);
  end if;

  select fm.created_at
  into v_baseline_at
  from public.user_area_faros uaf
  join public.faro_measurements fm
    on fm.user_area_faro_id = uaf.id
   and fm.measurement_kind = 'baseline'
  where uaf.id = v_user_area_faro_id
    and uaf.user_id = v_user_id
    and uaf.status = 'active'
  order by fm.created_at asc
  limit 1;

  if v_baseline_at is null or v_baseline_at > now() - interval '30 days' then
    return jsonb_build_object('ok', false, 'error', 'remedicion_no_vencida', 'state', '{}'::jsonb);
  end if;

  if not exists (
    select 1
    from public.faro_measurements rm
    where rm.user_area_faro_id = v_user_area_faro_id
      and rm.measurement_kind = 'remeasurement'
      and rm.created_at >= v_baseline_at
  ) then
    insert into public.faro_measurements (
      user_id, user_area_faro_id, measurement_kind, value, metadata
    ) values (
      v_user_id,
      v_user_area_faro_id,
      'remeasurement',
      v_value,
      jsonb_build_object(
        'contract','t2_faro_measurement_v1',
        'question','¿Cuánto sentís hoy que podés avanzar en esto?',
        'scale','0..10',
        'initial_remeasurement_days',30,
        'created_via','lumi_submit_checkin_faro_remeasurement'
      )
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', 'FARO_REMEASUREMENT_RECORDED',
    'message', 'Gracias. Queda como otra foto del camino, no como un puntaje sobre vos.',
    'actions', jsonb_build_array(
      jsonb_build_object('label','Inicio','action','go_home','value','skip_continuity','variant','solid')
    ),
    'content_type','empty_presence',
    'content',jsonb_build_object('type','empty_presence','source','faros'),
    'state',jsonb_build_object('contentSource','faros')
  );
end;
$function$;

-- 3) Presence context conserva toda la memoria humilde existente y suma sólo
-- las razones de Continuidad que permiten una reentrada explicable.
create or replace function public.lumi_get_presence_context(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
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
  v_continuity jsonb := '{}'::jsonb;
begin
  select
    count(*),
    coalesce(extract(day from (now() - max(s.created_at)))::integer, 0)
  into v_session_count, v_days_since
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
  from public.sanctuary_items si
  where si.user_id = p_user_id
    and si.experience_run_id is not null;

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

  v_continuity := private.lumen_get_due_continuity(p_user_id);

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
  ) || v_continuity;
end;
$function$;

-- 4) Reentrada explicable. `skip_continuity` permite a la persona posponerla
-- sin perder nada y sin volverla a encerrar en un loop de Home.
create or replace function public.lumi_go_home(p_params jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_user_name text;
  v_sanctuary_count integer;
  v_node_code text;
  v_node jsonb;
  v_message text;
  v_context jsonb;
  v_skip_continuity boolean := false;
  v_due_commitment jsonb;
  v_due_remeasurement jsonb;
begin
  p_params := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));
  v_user_id := nullif(trim(coalesce(p_params->>'user_id', '')), '')::uuid;
  v_skip_continuity := coalesce(p_params->>'value','') = 'skip_continuity';

  if v_user_id is not null and not private.lumen_actor_allowed(v_user_id) then
    return jsonb_build_object('ok', false, 'error', 'forbidden', 'state', '{}'::jsonb);
  end if;

  if v_user_id is not null then
    select coalesce(nullif(trim(u.first_name), ''), 'Pablo')
    into v_user_name
    from public.users u
    where u.id = v_user_id;

    v_context := public.lumi_get_presence_context(v_user_id);
  end if;

  v_user_name := coalesce(v_user_name, 'Pablo');
  v_context := coalesce(v_context, '{}'::jsonb);

  if not v_skip_continuity and coalesce((v_context->>'due_commitment_count')::integer, 0) > 0 then
    v_due_commitment := v_context->'due_commitment';

    return jsonb_build_object(
      'ok', true,
      'code', 'CONTINUITY_DUE',
      'message', 'Habías elegido volver a esto. Si querés, podemos mirar qué pasó.',
      'actions', jsonb_build_array(
        jsonb_build_object(
          'label','Contar qué pasó',
          'action','open_return',
          'value',v_due_commitment->>'commitment_id',
          'variant','solid'
        ),
        jsonb_build_object('label','Ahora no','action','go_home','value','skip_continuity','variant','ghost')
      ),
      'content_type','empty_presence',
      'content',jsonb_build_object(
        'type','empty_presence',
        'source','continuity',
        'reason','due_commitment',
        'commitment',v_due_commitment
      ),
      'state',public.lumi_clear_conversation_state('lumi','#7860E0','','continuity')
    );
  end if;

  if not v_skip_continuity and coalesce((v_context->>'due_remeasurement_count')::integer, 0) > 0 then
    v_due_remeasurement := v_context->'due_remeasurement';

    return jsonb_build_object(
      'ok', true,
      'code', 'FARO_REMEASUREMENT_DUE',
      'message', 'Hace un tiempo elegiste este Faro. ¿Querés mirar cómo se siente hoy tu posibilidad de avanzar?',
      'actions', jsonb_build_array(
        jsonb_build_object(
          'label','Mirarlo ahora',
          'action','open_faro_remeasurement',
          'value',v_due_remeasurement->>'user_area_faro_id',
          'variant','solid'
        ),
        jsonb_build_object('label','Ahora no','action','go_home','value','skip_continuity','variant','ghost')
      ),
      'content_type','empty_presence',
      'content',jsonb_build_object(
        'type','empty_presence',
        'source','faros',
        'reason','due_faro_remeasurement',
        'measurement',v_due_remeasurement
      ),
      'state',public.lumi_clear_conversation_state('lumi','#7860E0','','faros')
    );
  end if;

  if v_user_id is not null then
    select count(*)
    into v_sanctuary_count
    from public.sanctuary_items si
    where si.user_id = v_user_id
      and si.experience_run_id is not null;
  else
    v_sanctuary_count := 0;
  end if;

  v_node_code := case
    when v_sanctuary_count > 0 then 'HOME_RETURNING'
    else 'HOME_DEFAULT'
  end;

  v_node := public.lumi_get_node(v_node_code);
  v_message := replace(coalesce(v_node->>'message', ''), 'Pablo', v_user_name);

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

revoke execute on function public.lumi_submit_checkin_faro_baseline(jsonb) from public, anon;
revoke execute on function public.lumi_open_faro_remeasurement(jsonb) from public, anon;
revoke execute on function public.lumi_submit_checkin_faro_remeasurement(jsonb) from public, anon;

grant execute on function public.lumi_submit_checkin_faro_baseline(jsonb) to authenticated, service_role;
grant execute on function public.lumi_open_faro_remeasurement(jsonb) to authenticated, service_role;
grant execute on function public.lumi_submit_checkin_faro_remeasurement(jsonb) to authenticated, service_role;

commit;
