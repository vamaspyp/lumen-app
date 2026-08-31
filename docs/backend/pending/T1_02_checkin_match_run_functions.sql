-- T1 · Check-in → Match → Run · 02/02
-- Estado: PREPRODUCCIÓN / NO APLICAR SIN AUTORIZACIÓN.
-- Requiere T1_01_run_contract.sql aplicado primero.
--
-- Regla central:
--   MATCH / PRE -> NO crea experience_run
--   Empezar / open_resource_viewer -> crea exactamente un experience_run
--
-- Compatibilidad:
-- - columnas legacy permanecen;
-- - hypothesis_json recibe sólo un espejo mínimo de compatibilidad;
-- - experience_hypothesis_id deja de ser necesario para runs nuevos;
-- - gaia_submit_session_action se usa únicamente en viewer legacy sin run.

begin;

-- ---------------------------------------------------------------------------
-- 1. Selector: resuelve OFERTA, no RUN
-- ---------------------------------------------------------------------------

create or replace function public.lumi_select_experience(
  p_user_id uuid,
  p_session_id uuid default null::uuid,
  p_state_key text default null::text,
  p_area text default null::text,
  p_time_bucket text default null::text,
  p_hemisphere text default null::text,
  p_capability text default null::text,
  p_faro_key text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_experience          record;
  v_resource            record;
  v_hypothesis          record;
  v_max_mins            integer := 999;
  v_position            smallint := 1;
  v_format_preference   text;
  v_user_area_faro_id   uuid;
  v_faro_text_snapshot  text;
  v_offer_token         text := gen_random_uuid()::text;
begin
  if p_user_id is null then
    raise exception 'p_user_id requerido';
  end if;

  if p_session_id is not null then
    select
      coalesce(p_hemisphere, s.hemisphere_key),
      coalesce(p_capability, s.selected_capability_key),
      coalesce(p_faro_key, s.faro_key),
      coalesce(p_area, s.area::text),
      coalesce(p_state_key, s.state_key),
      coalesce(p_time_bucket, s.time_bucket::text),
      s.current_format_preference,
      s.user_area_faro_id,
      coalesce(nullif(uaf.faro_text, ''), faro_uc.short_label, s.faro_key)
    into
      p_hemisphere,
      p_capability,
      p_faro_key,
      p_area,
      p_state_key,
      p_time_bucket,
      v_format_preference,
      v_user_area_faro_id,
      v_faro_text_snapshot
    from public.sessions s
    left join public.user_area_faros uaf
      on uaf.id = s.user_area_faro_id
    left join public.ui_copy faro_uc
      on faro_uc.domain = 'faro'
     and faro_uc.lang = 'es'
     and faro_uc.key = s.faro_key
    where s.id = p_session_id
      and s.user_id = p_user_id;
  end if;

  if p_capability is null or p_capability = '' then
    return jsonb_build_object(
      'matched', false,
      'fallback_reason', 'no_capability_signal',
      'actions', jsonb_build_array('open_fuente', 'go_home')
    );
  end if;

  if p_time_bucket is not null then
    begin
      v_max_mins := public.lumi_max_minutes(p_time_bucket::public.time_bucket);
    exception when others then
      v_max_mins := 999;
    end;
  end if;

  select coalesce(max(position), 0) + 1
  into v_position
  from public.session_experience_shown
  where session_id = p_session_id;

  select eh.*
  into v_hypothesis
  from public.experience_hypotheses eh
  join public.experiences e
    on e.id = eh.experience_id
   and e.active = true
   and e.editorial_status in ('core_mvp', 'enrichment_mvp')
  join public.resources r
    on r.id = e.primary_resource_id
   and r.is_active = true
   and r.status = 'active'
  where eh.active = true
    and eh.hemisphere_key = p_hemisphere
    and (eh.life_area_key = p_area or eh.life_area_key is null)
    and eh.capability_key = p_capability
    and eh.expected_capability_key = p_capability
    and (
      case
        when p_hemisphere = 'H1' then (eh.state_key = p_state_key or eh.state_key is null)
        when p_hemisphere = 'H2' then (eh.faro_key = p_faro_key or eh.faro_key is null)
        else false
      end
    )
    and r.duration_min <= v_max_mins
    and (
      v_format_preference is null
      or v_format_preference = ''
      or r.format::text = v_format_preference
    )
    and not exists (
      select 1
      from public.session_experience_shown ses
      where ses.session_id = p_session_id
        and ses.experience_id = e.id
    )
    and not exists (
      select 1
      from public.experience_runs er
      where er.user_id = p_user_id
        and er.experience_id = e.id
        and er.help_signal = 'no_era_para_mi'
        and er.started_at > now() - interval '30 days'
    )
  order by
    (
      case when eh.life_area_key is not null then 1 else 0 end
      + case when eh.state_key is not null or eh.faro_key is not null then 1 else 0 end
    ) desc,
    eh.priority desc,
    (
      select max(er2.started_at)
      from public.experience_runs er2
      where er2.user_id = p_user_id
        and er2.experience_id = e.id
    ) asc nulls first
  limit 1;

  -- Segunda pasada: distingue ausencia real de match de una negociación
  -- de tiempo/formato. Sigue sin crear Run.
  if v_hypothesis is null then
    select
      eh.*,
      r.duration_min as res_duration,
      r.format::text as res_format,
      e.title as exp_title
    into v_hypothesis
    from public.experience_hypotheses eh
    join public.experiences e
      on e.id = eh.experience_id
     and e.active = true
     and e.editorial_status in ('core_mvp', 'enrichment_mvp')
    join public.resources r
      on r.id = e.primary_resource_id
     and r.is_active = true
     and r.status = 'active'
    where eh.active = true
      and eh.hemisphere_key = p_hemisphere
      and (eh.life_area_key = p_area or eh.life_area_key is null)
      and eh.capability_key = p_capability
      and eh.expected_capability_key = p_capability
      and (
        case
          when p_hemisphere = 'H1' then (eh.state_key = p_state_key or eh.state_key is null)
          when p_hemisphere = 'H2' then (eh.faro_key = p_faro_key or eh.faro_key is null)
          else false
        end
      )
      and not exists (
        select 1
        from public.session_experience_shown ses
        where ses.session_id = p_session_id
          and ses.experience_id = e.id
      )
    order by
      (
        case when eh.life_area_key is not null then 1 else 0 end
        + case when eh.state_key is not null or eh.faro_key is not null then 1 else 0 end
      ) desc,
      eh.priority desc
    limit 1;

    if v_hypothesis is not null then
      if v_hypothesis.res_duration > v_max_mins then
        return jsonb_build_object(
          'matched', false,
          'fallback_reason', 'time_mismatch',
          'experience_id', v_hypothesis.experience_id,
          'experience_title', v_hypothesis.exp_title,
          'required_mins', v_hypothesis.res_duration,
          'available_mins', v_max_mins,
          'capability_key', p_capability,
          'negotiation_msg',
            'Tengo algo que puede ayudarte, pero lleva ' ||
            v_hypothesis.res_duration::text ||
            ' minutos. Dijiste que tenés ' ||
            v_max_mins::text ||
            '. ¿Querés tomarlo igual?',
          'actions', jsonb_build_array('accept_time_anyway', 'find_shorter', 'go_home')
        );
      end if;

      if v_format_preference is not null
         and v_format_preference <> ''
         and v_hypothesis.res_format <> v_format_preference then
        return jsonb_build_object(
          'matched', false,
          'fallback_reason', 'format_mismatch',
          'experience_id', v_hypothesis.experience_id,
          'experience_title', v_hypothesis.exp_title,
          'required_format', v_hypothesis.res_format,
          'preferred_format', v_format_preference,
          'capability_key', p_capability,
          'negotiation_msg',
            'Tengo algo que puede ayudarte, pero está en formato ' ||
            v_hypothesis.res_format ||
            '. ¿Querés tomarlo igual o preferís buscar otro formato?',
          'actions', jsonb_build_array('accept_format_anyway', 'find_other_format', 'go_home')
        );
      end if;
    end if;
  end if;

  if v_hypothesis is null then
    if p_session_id is not null then
      insert into public.session_events (
        session_id,
        user_id,
        action_type,
        metadata,
        created_at
      ) values (
        p_session_id,
        p_user_id,
        'no_match',
        jsonb_strip_nulls(jsonb_build_object(
          'reason', 'no_hypothesis_found',
          'selector_source', 'lumi_select_experience',
          'selector_contract', 't1_checkin_match_run_v1',
          'hemisphere', p_hemisphere,
          'life_area_key', p_area,
          'state_key', p_state_key,
          'faro_key', p_faro_key,
          'capability_key', p_capability,
          'time_bucket', p_time_bucket,
          'format_preference', v_format_preference
        )),
        now()
      );
    end if;

    return jsonb_build_object(
      'matched', false,
      'fallback_reason', 'no_hypothesis_found',
      'hemisphere', p_hemisphere,
      'area', p_area,
      'state_key', p_state_key,
      'faro_key', p_faro_key,
      'capability', p_capability,
      'actions', jsonb_build_array('open_fuente', 'go_home')
    );
  end if;

  select
    e.id,
    e.code,
    e.title,
    e.pre_text,
    e.post_text,
    e.primary_resource_id,
    e.expected_capability_key,
    e.primary_capability_key
  into v_experience
  from public.experiences e
  where e.id = v_hypothesis.experience_id;

  select
    r.id,
    r.title,
    r.format::text as format,
    r.url,
    r.duration_min,
    r.description_short,
    r.source_kind,
    r.author,
    r.provider,
    r.why_now,
    r.minimum_step,
    r.after_prompt
  into v_resource
  from public.resources r
  where r.id = v_experience.primary_resource_id;

  -- "shown" pertenece al match/oferta, no al Run.
  if p_session_id is not null then
    insert into public.session_experience_shown (
      session_id,
      experience_id,
      position,
      shown_at
    ) values (
      p_session_id,
      v_experience.id,
      v_position,
      now()
    )
    on conflict (session_id, experience_id) do nothing;
  end if;

  return jsonb_build_object(
    'matched', true,
    'offer_token', v_offer_token,
    'selection_source', 'motor',
    'realization_type', 'source',
    'experience_id', v_experience.id,
    'experience_code', v_experience.code,
    'title', v_experience.title,
    'pre_text', v_experience.pre_text,
    'post_text', v_experience.post_text,
    'capability_key', p_capability,
    'served_capability_key', p_capability,
    'expected_capability', v_hypothesis.expected_capability_key,
    'legacy_hypothesis_id', v_hypothesis.id,
    'resource', jsonb_build_object(
      'id', v_resource.id,
      'title', v_resource.title,
      'format', v_resource.format,
      'url', v_resource.url,
      'duration_min', v_resource.duration_min,
      'description_short', v_resource.description_short,
      'source_kind', v_resource.source_kind,
      'author', v_resource.author,
      'provider', v_resource.provider,
      'why_now', v_resource.why_now,
      'minimum_step', v_resource.minimum_step,
      'after_prompt', v_resource.after_prompt
    )
  );
end;
$function$;

-- ---------------------------------------------------------------------------
-- 2. Check-in motor: PRE sin Run; token via action Empezar
-- ---------------------------------------------------------------------------

create or replace function public.lumi_start_experience(p_params jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id       uuid;
  v_session_id    uuid;
  v_result        jsonb;
  v_node          jsonb;
  v_hemisphere    text;
  v_area          text;
  v_state_key     text;
  v_faro_key      text;
  v_capability    text;
  v_time_bucket   text;
  v_actions       jsonb;
  v_actions_final jsonb := '[]'::jsonb;
  v_action        jsonb;
begin
  p_params     := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));
  v_user_id    := nullif(trim(p_params->>'user_id'), '')::uuid;
  v_session_id := nullif(trim(p_params->>'session_id'), '')::uuid;

  if v_user_id is null then
    return public.lumi_get_node('HOME_DEFAULT')
      || jsonb_build_object('ok', false, 'error', 'user_id requerido', 'state', '{}'::jsonb);
  end if;

  v_result := public.lumi_select_experience(
    p_user_id := v_user_id,
    p_session_id := v_session_id
  );

  if v_session_id is not null then
    select s.hemisphere_key, s.area::text, s.state_key, s.faro_key,
           s.selected_capability_key, s.time_bucket::text
    into v_hemisphere, v_area, v_state_key, v_faro_key, v_capability, v_time_bucket
    from public.sessions s
    where s.id = v_session_id and s.user_id = v_user_id;
  end if;

  if not coalesce((v_result->>'matched')::boolean, false) then
    if (v_result->>'fallback_reason') = 'time_mismatch' then
      v_node := public.lumi_get_node('TIME_MISMATCH_OFFER');
      return v_node || jsonb_build_object(
        'ok', true,
        'code', 'TIME_MISMATCH_OFFER',
        'message', coalesce(nullif(v_result->>'negotiation_msg', ''), v_node->>'message'),
        'content_type', 'empty_presence',
        'content', jsonb_build_object('type', 'empty_presence') || v_result,
        'state', jsonb_build_object(
          'currentSessionId', coalesce(v_session_id::text, ''),
          'currentExperienceRunId', '',
          'currentExperienceId', '',
          'checkinHemisphere', coalesce(v_hemisphere, ''),
          'checkinArea', coalesce(v_area, ''),
          'checkinState', coalesce(v_state_key, ''),
          'checkinFaro', coalesce(v_faro_key, ''),
          'checkinCapability', coalesce(v_capability, ''),
          'checkinTime', coalesce(v_time_bucket, '')
        )
      );
    end if;

    if (v_result->>'fallback_reason') = 'format_mismatch' then
      v_node := public.lumi_get_node('FORMAT_MISMATCH_OFFER');
      return v_node || jsonb_build_object(
        'ok', true,
        'code', 'FORMAT_MISMATCH_OFFER',
        'message', coalesce(nullif(v_result->>'negotiation_msg', ''), v_node->>'message'),
        'content_type', 'empty_presence',
        'content', jsonb_build_object('type', 'empty_presence') || v_result,
        'state', jsonb_build_object(
          'currentSessionId', coalesce(v_session_id::text, ''),
          'currentExperienceRunId', '',
          'currentExperienceId', '',
          'checkinHemisphere', coalesce(v_hemisphere, ''),
          'checkinArea', coalesce(v_area, ''),
          'checkinState', coalesce(v_state_key, ''),
          'checkinFaro', coalesce(v_faro_key, ''),
          'checkinCapability', coalesce(v_capability, ''),
          'checkinTime', coalesce(v_time_bucket, '')
        )
      );
    end if;

    v_node := public.lumi_get_node('NO_MATCH_HONEST');
    return v_node || jsonb_build_object(
      'ok', true,
      'code', 'NO_MATCH_HONEST',
      'content_type', 'empty_presence',
      'content', jsonb_build_object('type', 'empty_presence'),
      'state', jsonb_build_object(
        'currentSessionId', coalesce(v_session_id::text, ''),
        'currentExperienceRunId', '',
        'currentExperienceId', '',
        'checkinHemisphere', coalesce(v_hemisphere, ''),
        'checkinArea', coalesce(v_area, ''),
        'checkinState', coalesce(v_state_key, ''),
        'checkinFaro', coalesce(v_faro_key, ''),
        'checkinCapability', coalesce(v_capability, ''),
        'checkinTime', coalesce(v_time_bucket, '')
      )
    );
  end if;

  v_node := public.lumi_get_node('EXPERIENCE_PRE');
  v_actions := coalesce(v_node->'actions', '[]'::jsonb);

  for v_action in select * from jsonb_array_elements(v_actions)
  loop
    if v_action->>'action' = 'open_resource_viewer' then
      v_action := v_action || jsonb_build_object('value', v_result->>'offer_token');
    end if;
    v_actions_final := v_actions_final || jsonb_build_array(v_action);
  end loop;

  return jsonb_build_object(
    'ok', true,
    'code', 'EXPERIENCE_PRE',
    'message', coalesce(nullif(v_result->>'pre_text', ''), v_node->>'message'),
    'actions', v_actions_final,
    'content_type', 'empty_presence',
    'content', jsonb_build_object(
      'type', 'empty_presence',
      'experience_id', v_result->>'experience_id',
      'experience_code', v_result->>'experience_code',
      'offer_token', v_result->>'offer_token',
      'selection_source', 'motor',
      'realization_type', 'source',
      'capability_key', v_result->>'capability_key',
      'served_capability_key', v_result->>'served_capability_key',
      'resource_id', v_result->'resource'->>'id',
      'resource_title', v_result->'resource'->>'title',
      'resource_format', v_result->'resource'->>'format',
      'resource_url', v_result->'resource'->>'url',
      'post_text', v_result->>'post_text'
    ),
    'state', jsonb_build_object(
      'currentSessionId', coalesce(v_session_id::text, ''),
      'currentResourceId', v_result->'resource'->>'id',
      'currentExperienceId', v_result->>'experience_id',
      'currentExperienceRunId', '',
      'checkinHemisphere', coalesce(v_hemisphere, ''),
      'checkinArea', coalesce(v_area, ''),
      'checkinState', coalesce(v_state_key, ''),
      'checkinFaro', coalesce(v_faro_key, ''),
      'checkinCapability', coalesce(v_capability, ''),
      'checkinTime', coalesce(v_time_bucket, ''),
      'contentSource', 'lumi'
    )
  );
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3. Fuente: abrir experiencia prepara PRE, no Run
-- ---------------------------------------------------------------------------

create or replace function public.lumi_open_experience(p_params jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id       uuid;
  v_session_id    uuid;
  v_experience_id uuid;
  v_experience    record;
  v_resource      record;
  v_node          jsonb;
  v_source        text;
  v_offer_token   text := gen_random_uuid()::text;
  v_actions       jsonb;
  v_actions_final jsonb := '[]'::jsonb;
  v_action        jsonb;
  v_served_cap    text;
begin
  p_params        := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));
  v_user_id       := nullif(trim(p_params->>'user_id'), '')::uuid;
  v_session_id    := nullif(trim(p_params->>'session_id'), '')::uuid;
  v_experience_id := nullif(trim(coalesce(p_params->>'experience_id', p_params->>'id')), '')::uuid;
  v_source        := coalesce(nullif(trim(p_params->>'source'), ''), 'fuente');

  if v_experience_id is null or v_user_id is null then
    return public.lumi_get_node('HOME_DEFAULT')
      || jsonb_build_object('ok', false, 'error', 'experience_id_o_user_id_requerido', 'state', '{}'::jsonb);
  end if;

  select e.id, e.code, e.title, e.pre_text, e.post_text, e.primary_resource_id,
         e.expected_capability_key, e.hemisphere_key, e.primary_life_area_key,
         e.primary_capability_key
  into v_experience
  from public.experiences e
  where e.id = v_experience_id
    and e.active = true
    and e.editorial_status in ('core_mvp', 'enrichment_mvp');

  if not found then
    return public.lumi_get_node('HOME_DEFAULT')
      || jsonb_build_object('ok', false, 'error', 'experiencia_no_visible_en_mvp', 'state', '{}'::jsonb);
  end if;

  select r.id, r.title, r.url, r.source_kind, r.format, r.duration_min
  into v_resource
  from public.resources r
  where r.id = v_experience.primary_resource_id
    and r.is_active = true
    and r.status = 'active';

  if not found then
    return public.lumi_get_node('HOME_DEFAULT')
      || jsonb_build_object('ok', false, 'error', 'recurso_primario_no_disponible', 'state', '{}'::jsonb);
  end if;

  v_served_cap := coalesce(v_experience.primary_capability_key, v_experience.expected_capability_key);
  v_node := public.lumi_get_node('EXPERIENCE_PRE');
  v_actions := coalesce(v_node->'actions', '[]'::jsonb);

  for v_action in select * from jsonb_array_elements(v_actions)
  loop
    if v_action->>'action' = 'open_resource_viewer' then
      v_action := v_action || jsonb_build_object('value', v_offer_token);
    end if;
    v_actions_final := v_actions_final || jsonb_build_array(v_action);
  end loop;

  return jsonb_build_object(
    'ok', true,
    'code', 'EXPERIENCE_PRE',
    'message', coalesce(v_experience.pre_text, v_node->>'message', 'Cuando estés listo, empezamos.'),
    'actions', v_actions_final,
    'content_type', 'empty_presence',
    'content', jsonb_build_object(
      'type', 'empty_presence',
      'experience_id', v_experience.id::text,
      'experience_code', v_experience.code,
      'offer_token', v_offer_token,
      'selection_source', case when v_source = 'lumi' then 'motor' else 'fuente' end,
      'realization_type', 'source',
      'served_capability_key', v_served_cap,
      'resource_id', v_resource.id::text,
      'resource_title', v_resource.title,
      'resource_format', v_resource.format::text,
      'resource_url', v_resource.url,
      'post_text', v_experience.post_text
    ),
    'state', jsonb_build_object(
      'currentSessionId', coalesce(v_session_id::text, ''),
      'currentResourceId', v_resource.id::text,
      'currentExperienceId', v_experience.id::text,
      'currentExperienceRunId', '',
      'contentSource', v_source
    )
  );
end;
$function$;

-- ---------------------------------------------------------------------------
-- 4. Santuario replay: PRE sin Run
-- ---------------------------------------------------------------------------

create or replace function public.lumi_restart_experience(p_params jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id           uuid;
  v_experience_id     uuid;
  v_sanctuary_item_id uuid;
  v_experience        record;
  v_resource          record;
  v_node              jsonb;
  v_offer_token       text := gen_random_uuid()::text;
  v_actions           jsonb;
  v_actions_final     jsonb := '[]'::jsonb;
  v_action            jsonb;
begin
  p_params := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));

  v_user_id := nullif(trim(p_params->>'user_id'), '')::uuid;
  v_experience_id := nullif(trim(coalesce(p_params->>'value', p_params->>'experience_id')), '')::uuid;
  v_sanctuary_item_id := nullif(trim(coalesce(
    p_params->>'sanctuary_item_id',
    p_params->>'currentSanctuaryItemId'
  )), '')::uuid;

  if v_user_id is null or v_experience_id is null then
    return public.lumi_get_node('HOME_DEFAULT')
      || jsonb_build_object('ok', false, 'error', 'user_id y experience_id requeridos', 'state', '{}'::jsonb);
  end if;

  if v_sanctuary_item_id is null then
    select si.id
    into v_sanctuary_item_id
    from public.sanctuary_items si
    where si.user_id = v_user_id
      and si.experience_id = v_experience_id
      and si.experience_run_id is not null
    order by si.created_at desc
    limit 1;
  else
    perform 1
    from public.sanctuary_items si
    where si.id = v_sanctuary_item_id
      and si.user_id = v_user_id
      and si.experience_id = v_experience_id
      and si.experience_run_id is not null;

    if not found then
      return public.lumi_get_node('HOME_DEFAULT')
        || jsonb_build_object('ok', false, 'error', 'sanctuary_item_no_valido', 'state', '{}'::jsonb);
    end if;
  end if;

  if v_sanctuary_item_id is null then
    return public.lumi_get_node('HOME_DEFAULT')
      || jsonb_build_object('ok', false, 'error', 'sanctuary_item_no_encontrado', 'state', '{}'::jsonb);
  end if;

  select e.id, e.code, e.title, e.pre_text, e.post_text, e.primary_resource_id,
         e.hemisphere_key, e.primary_life_area_key, e.primary_capability_key,
         e.expected_capability_key
  into v_experience
  from public.experiences e
  where e.id = v_experience_id
    and e.active = true
    and e.editorial_status in ('core_mvp', 'enrichment_mvp');

  if not found then
    return public.lumi_get_node('HOME_DEFAULT')
      || jsonb_build_object('ok', false, 'error', 'experience_not_found', 'state', '{}'::jsonb);
  end if;

  select r.id, r.title, r.format::text as format, r.url, r.duration_min,
         r.description_short, r.source_kind, r.author, r.provider
  into v_resource
  from public.resources r
  where r.id = v_experience.primary_resource_id
    and r.is_active = true
    and r.status = 'active';

  if not found then
    return public.lumi_get_node('HOME_DEFAULT')
      || jsonb_build_object('ok', false, 'error', 'resource_not_found', 'state', '{}'::jsonb);
  end if;

  v_node := public.lumi_get_node('EXPERIENCE_PRE');
  v_actions := coalesce(v_node->'actions', '[]'::jsonb);

  for v_action in select * from jsonb_array_elements(v_actions)
  loop
    if v_action->>'action' = 'open_resource_viewer' then
      v_action := v_action || jsonb_build_object('value', v_offer_token);
    end if;
    v_actions_final := v_actions_final || jsonb_build_array(v_action);
  end loop;

  return jsonb_build_object(
    'ok', true,
    'code', 'EXPERIENCE_PRE',
    'message', coalesce(v_experience.pre_text, v_node->>'message', 'Cuando estés listo, empezamos.'),
    'actions', v_actions_final,
    'content_type', 'empty_presence',
    'content', jsonb_build_object(
      'type', 'empty_presence',
      'experience_id', v_experience.id::text,
      'offer_token', v_offer_token,
      'selection_source', 'sanctuary',
      'realization_type', 'sanctuary',
      'sanctuary_item_id', v_sanctuary_item_id::text,
      'resource_id', v_resource.id::text,
      'resource_title', v_resource.title,
      'resource_format', v_resource.format,
      'resource_url', v_resource.url,
      'post_text', v_experience.post_text
    ),
    'state', jsonb_build_object(
      'currentResourceId', v_resource.id::text,
      'currentExperienceId', v_experience.id::text,
      'currentExperienceRunId', '',
      'currentSanctuaryItemId', v_sanctuary_item_id::text,
      'contentSource', 'sanctuary'
    )
  );
end;
$function$;

-- ---------------------------------------------------------------------------
-- 5. Frontera única de inicio: open_resource_viewer crea/reusa Run
-- ---------------------------------------------------------------------------

create or replace function public.lumi_open_resource_viewer(p_params jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id              uuid;
  v_session_id           uuid;
  v_resource_id          uuid;
  v_experience_id        uuid;
  v_run_id               uuid;
  v_offer_token          text;
  v_source               text;
  v_selection_source     text;
  v_realization_type     text;
  v_node                 jsonb;
  v_resource             record;
  v_experience           record;
  v_hypothesis           record;
  v_origin_run           record;
  v_source_kind          text;
  v_served_capability    text;
  v_session_hemisphere   text;
  v_session_area         text;
  v_session_state        text;
  v_session_faro_key     text;
  v_session_uaf_id       uuid;
  v_session_faro_text    text;
  v_session_capability   text;
  v_session_time         text;
  v_session_format       text;
  v_max_mins             integer := 999;
  v_sanctuary_item_id    uuid;
  v_offer_snapshot       jsonb;
  v_legacy_hypothesis    jsonb;
  v_created_run          boolean := false;
begin
  p_params       := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));
  v_user_id      := nullif(trim(coalesce(p_params->>'user_id', '')), '')::uuid;
  v_session_id   := nullif(trim(coalesce(p_params->>'session_id', '')), '')::uuid;
  v_resource_id  := nullif(trim(coalesce(p_params->>'resource_id', '')), '')::uuid;
  v_experience_id:= nullif(trim(coalesce(p_params->>'experience_id', '')), '')::uuid;
  v_run_id       := nullif(trim(coalesce(p_params->>'experience_run_id', p_params->>'currentExperienceRunId', '')), '')::uuid;
  v_offer_token  := nullif(trim(coalesce(p_params->>'value', p_params->>'offer_token', '')), '');
  v_source       := coalesce(nullif(trim(coalesce(p_params->>'source', '')), ''), 'lumi');
  v_sanctuary_item_id := nullif(trim(coalesce(
    p_params->>'sanctuary_item_id',
    p_params->>'currentSanctuaryItemId',
    ''
  )), '')::uuid;

  if v_user_id is null then
    return public.lumi_get_node('HOME_DEFAULT')
      || jsonb_build_object('ok', false, 'error', 'user_id_requerido', 'state', '{}'::jsonb);
  end if;

  -- Compatibilidad: si ya llegó un run válido (cliente anterior o flujo ya
  -- iniciado), se reutiliza. No se crea uno nuevo.
  if v_run_id is not null then
    select er.experience_id, er.resource_id
    into v_experience_id, v_resource_id
    from public.experience_runs er
    where er.id = v_run_id
      and er.user_id = v_user_id;

    if not found then
      return public.lumi_get_node('HOME_DEFAULT')
        || jsonb_build_object('ok', false, 'error', 'experience_run_no_valido', 'state', '{}'::jsonb);
    end if;
  end if;

  -- Camino canónico T1: PRE trae experience_id pero todavía no run.
  if v_run_id is null and v_experience_id is not null then
    select
      e.id,
      e.code,
      e.title,
      e.pre_text,
      e.post_text,
      e.primary_resource_id,
      e.expected_capability_key,
      e.primary_capability_key,
      e.primary_life_area_key,
      e.hemisphere_key
    into v_experience
    from public.experiences e
    where e.id = v_experience_id
      and e.active = true
      and e.editorial_status in ('core_mvp', 'enrichment_mvp');

    if not found then
      return public.lumi_get_node('HOME_DEFAULT')
        || jsonb_build_object('ok', false, 'error', 'experiencia_no_visible_en_mvp', 'state', '{}'::jsonb);
    end if;

    if v_resource_id is not null and v_resource_id <> v_experience.primary_resource_id then
      return public.lumi_get_node('HOME_DEFAULT')
        || jsonb_build_object('ok', false, 'error', 'offer_resource_mismatch', 'state', '{}'::jsonb);
    end if;

    v_resource_id := v_experience.primary_resource_id;

    select r.id, r.title, r.url, r.source_kind, r.format, r.duration_min, r.metadata
    into v_resource
    from public.resources r
    where r.id = v_resource_id
      and r.is_active = true
      and r.status = 'active';

    if not found then
      return public.lumi_get_node('HOME_DEFAULT')
        || jsonb_build_object('ok', false, 'error', 'resource_not_found_or_inactive', 'state', '{}'::jsonb);
    end if;

    v_offer_token := coalesce(v_offer_token, gen_random_uuid()::text);

    -- Idempotencia secuencial: si este PRE ya inició un Run, reutilizarlo.
    select er.id
    into v_run_id
    from public.experience_runs er
    where er.user_id = v_user_id
      and er.offer_snapshot->>'offer_token' = v_offer_token
    limit 1;

    if v_run_id is null then
      v_selection_source := case v_source
        when 'lumi'      then 'motor'
        when 'motor'     then 'motor'
        when 'fuente'    then 'fuente'
        when 'sanctuary' then 'sanctuary'
        when 'tejido'    then 'tejido'
        when 'derrame'   then 'derrame'
        when 'mercado'   then 'mercado'
        else 'other'
      end;

      v_realization_type := case v_selection_source
        when 'motor'     then 'source'
        when 'fuente'    then 'source'
        when 'sanctuary' then 'sanctuary'
        when 'tejido'    then 'weave'
        when 'derrame'   then 'spill'
        when 'mercado'   then 'market'
        else 'other'
      end;

      if v_selection_source = 'motor' then
        if v_session_id is null then
          return public.lumi_get_node('HOME_DEFAULT')
            || jsonb_build_object('ok', false, 'error', 'session_id_requerido_para_motor', 'state', '{}'::jsonb);
        end if;

        select
          s.hemisphere_key,
          s.area::text,
          s.state_key,
          s.faro_key,
          s.user_area_faro_id,
          coalesce(nullif(uaf.faro_text, ''), faro_uc.short_label, s.faro_key),
          s.selected_capability_key,
          s.time_bucket::text,
          s.current_format_preference
        into
          v_session_hemisphere,
          v_session_area,
          v_session_state,
          v_session_faro_key,
          v_session_uaf_id,
          v_session_faro_text,
          v_session_capability,
          v_session_time,
          v_session_format
        from public.sessions s
        left join public.user_area_faros uaf
          on uaf.id = s.user_area_faro_id
        left join public.ui_copy faro_uc
          on faro_uc.domain = 'faro'
         and faro_uc.lang = 'es'
         and faro_uc.key = s.faro_key
        where s.id = v_session_id
          and s.user_id = v_user_id;

        if not found or nullif(v_session_capability, '') is null then
          return public.lumi_get_node('NO_MATCH_HONEST')
            || jsonb_build_object('ok', true, 'code', 'NO_MATCH_HONEST', 'state', jsonb_build_object('currentSessionId', v_session_id::text));
        end if;

        if v_session_time is not null then
          begin
            v_max_mins := public.lumi_max_minutes(v_session_time::public.time_bucket);
          exception when others then
            v_max_mins := 999;
          end;
        end if;

        -- Revalidación específica de la oferta ya mostrada. No vuelve a correr
        -- el ranking y no consulta session_experience_shown.
        select eh.*
        into v_hypothesis
        from public.experience_hypotheses eh
        where eh.active = true
          and eh.experience_id = v_experience_id
          and eh.hemisphere_key = v_session_hemisphere
          and (eh.life_area_key = v_session_area or eh.life_area_key is null)
          and eh.capability_key = v_session_capability
          and eh.expected_capability_key = v_session_capability
          and (
            case
              when v_session_hemisphere = 'H1' then (eh.state_key = v_session_state or eh.state_key is null)
              when v_session_hemisphere = 'H2' then (eh.faro_key = v_session_faro_key or eh.faro_key is null)
              else false
            end
          )
          and v_resource.duration_min <= v_max_mins
          and (
            v_session_format is null
            or v_session_format = ''
            or v_resource.format::text = v_session_format
          )
          and not exists (
            select 1
            from public.experience_runs er
            where er.user_id = v_user_id
              and er.experience_id = v_experience_id
              and er.help_signal = 'no_era_para_mi'
              and er.started_at > now() - interval '30 days'
          )
        order by
          (
            case when eh.life_area_key is not null then 1 else 0 end
            + case when eh.state_key is not null or eh.faro_key is not null then 1 else 0 end
          ) desc,
          eh.priority desc
        limit 1;

        if v_hypothesis is null then
          insert into public.session_events(session_id, user_id, action_type, metadata, created_at)
          values (
            v_session_id,
            v_user_id,
            'no_match',
            jsonb_strip_nulls(jsonb_build_object(
              'reason', 'offer_stale_on_accept',
              'selector_source', 'lumi_open_resource_viewer',
              'selector_contract', 't1_checkin_match_run_v1',
              'experience_id', v_experience_id,
              'hemisphere', v_session_hemisphere,
              'life_area_key', v_session_area,
              'state_key', v_session_state,
              'faro_key', v_session_faro_key,
              'capability_key', v_session_capability,
              'time_bucket', v_session_time,
              'format_preference', v_session_format
            )),
            now()
          );

          v_node := public.lumi_get_node('NO_MATCH_HONEST');
          return v_node || jsonb_build_object(
            'ok', true,
            'code', 'NO_MATCH_HONEST',
            'content_type', 'empty_presence',
            'content', jsonb_build_object('type', 'empty_presence'),
            'state', jsonb_build_object(
              'currentSessionId', v_session_id::text,
              'currentExperienceRunId', '',
              'currentExperienceId', ''
            )
          );
        end if;

        v_served_capability := v_session_capability;

      elsif v_selection_source = 'sanctuary' then
        if v_sanctuary_item_id is null then
          select si.id
          into v_sanctuary_item_id
          from public.sanctuary_items si
          where si.user_id = v_user_id
            and si.experience_id = v_experience_id
            and si.experience_run_id is not null
          order by si.created_at desc
          limit 1;
        end if;

        select
          er.id,
          er.hemisphere_key,
          er.life_area_key,
          er.state_key,
          er.faro_key,
          er.user_area_faro_id,
          er.faro_text_snapshot,
          er.served_capability_key,
          er.primary_capability_key,
          er.selected_capability_key,
          er.expected_capability_key
        into v_origin_run
        from public.sanctuary_items si
        join public.experience_runs er on er.id = si.experience_run_id
        where si.id = v_sanctuary_item_id
          and si.user_id = v_user_id
          and coalesce(si.experience_id, er.experience_id) = v_experience_id
        limit 1;

        if not found then
          return public.lumi_get_node('HOME_DEFAULT')
            || jsonb_build_object('ok', false, 'error', 'sanctuary_origin_no_valido', 'state', '{}'::jsonb);
        end if;

        v_session_hemisphere := coalesce(v_origin_run.hemisphere_key, v_experience.hemisphere_key);
        v_session_area := coalesce(v_origin_run.life_area_key, v_experience.primary_life_area_key);
        v_session_state := v_origin_run.state_key;
        v_session_faro_key := v_origin_run.faro_key;
        v_session_uaf_id := v_origin_run.user_area_faro_id;
        v_session_faro_text := v_origin_run.faro_text_snapshot;
        v_served_capability := coalesce(
          v_origin_run.served_capability_key,
          v_origin_run.primary_capability_key,
          v_origin_run.selected_capability_key,
          v_origin_run.expected_capability_key,
          v_experience.primary_capability_key,
          v_experience.expected_capability_key
        );

      else
        -- Fuente (y futuras realizaciones todavía sin contrato específico):
        -- no importa contexto mutable de una sesión previa como autoridad.
        v_session_hemisphere := v_experience.hemisphere_key;
        v_session_area := v_experience.primary_life_area_key;
        v_served_capability := coalesce(v_experience.primary_capability_key, v_experience.expected_capability_key);
      end if;

      v_offer_snapshot := jsonb_strip_nulls(jsonb_build_object(
        'contract', 't1_checkin_match_run_v1',
        'offer_token', v_offer_token,
        'selection_source', v_selection_source,
        'realization_type', v_realization_type,
        'experience_id', v_experience_id,
        'resource_id', v_resource_id,
        'served_capability_key', v_served_capability,
        'hemisphere_key', v_session_hemisphere,
        'life_area_key', v_session_area,
        'state_key', v_session_state,
        'faro_key', v_session_faro_key,
        'time_bucket', v_session_time,
        'format_preference', v_session_format,
        'legacy_hypothesis_id', case when v_selection_source = 'motor' then v_hypothesis.id else null end,
        'sanctuary_item_id', case when v_selection_source = 'sanctuary' then v_sanctuary_item_id else null end,
        'origin_run_id', case when v_selection_source = 'sanctuary' then v_origin_run.id else null end,
        'accepted_at', now()
      ));

      -- Espejo mínimo para lectores transitorios todavía no migrados.
      -- No es autoridad del nuevo Run.
      v_legacy_hypothesis := jsonb_strip_nulls(jsonb_build_object(
        'source', case v_selection_source
          when 'motor' then 'lumi_motor'
          when 'sanctuary' then 'sanctuary_replay'
          else v_selection_source
        end,
        'canonical_offer_snapshot', true,
        'offer_token', v_offer_token,
        'time_bucket', v_session_time,
        'sanctuary_item_id', case when v_selection_source = 'sanctuary' then v_sanctuary_item_id else null end
      ));

      begin
        insert into public.experience_runs (
          user_id,
          session_id,
          experience_id,
          resource_id,
          state_key,
          life_area_key,
          hemisphere_key,
          faro_key,
          faro_text_snapshot,
          expected_capability_key,
          selected_capability_key,
          user_area_faro_id,
          primary_capability_key,
          primary_life_area_key,
          current_format_preference,
          hypothesis_json,
          selection_source,
          served_capability_key,
          realization_type,
          offer_snapshot,
          started_at,
          saved_to_sanctuary
        ) values (
          v_user_id,
          v_session_id,
          v_experience_id,
          v_resource_id,
          v_session_state,
          v_session_area,
          v_session_hemisphere,
          v_session_faro_key,
          v_session_faro_text,
          v_experience.expected_capability_key,
          v_served_capability,
          v_session_uaf_id,
          v_experience.primary_capability_key,
          v_experience.primary_life_area_key,
          v_session_format,
          v_legacy_hypothesis,
          v_selection_source,
          v_served_capability,
          v_realization_type,
          v_offer_snapshot,
          now(),
          false
        )
        returning id into v_run_id;

        v_created_run := true;
      exception when unique_violation then
        select er.id
        into v_run_id
        from public.experience_runs er
        where er.user_id = v_user_id
          and er.offer_snapshot->>'offer_token' = v_offer_token
        limit 1;

        if v_run_id is null then
          raise;
        end if;
      end;

      -- Journal canónico accesorio: enlaza el Run, sin feedback ni claves IK.
      if v_created_run and v_session_id is not null then
        insert into public.session_events (
          session_id,
          user_id,
          action_type,
          resource_id,
          experience_id,
          experience_run_id,
          metadata,
          created_at
        ) values (
          v_session_id,
          v_user_id,
          'opened',
          v_resource_id,
          v_experience_id,
          v_run_id,
          jsonb_build_object(
            'src', 't1_canonical_run_start',
            'selection_source', v_selection_source,
            'offer_token', v_offer_token
          ),
          now()
        );
      end if;
    end if;
  end if;

  if v_resource_id is null then
    return public.lumi_get_node('HOME_DEFAULT')
      || jsonb_build_object('ok', false, 'error', 'resource_id_requerido', 'state', '{}'::jsonb);
  end if;

  -- Cargar recurso para el viewer si no se cargó arriba.
  if v_resource.id is null then
    select r.id, r.title, r.url, r.source_kind, r.format, r.duration_min, r.metadata
    into v_resource
    from public.resources r
    where r.id = v_resource_id;
  end if;

  if not found then
    return public.lumi_get_node('HOME_DEFAULT')
      || jsonb_build_object('ok', false, 'error', 'resource_not_found', 'state', '{}'::jsonb);
  end if;

  v_source_kind := coalesce(nullif(trim(coalesce(v_resource.source_kind, '')), ''), 'external_url');

  -- Camino legacy puro: resource viewer sin experience_id/run.
  if v_run_id is null and v_experience_id is null and v_session_id is not null then
    begin
      perform public.gaia_submit_session_action(
        p_session_id := v_session_id,
        p_chosen_resource_id := v_resource_id,
        p_feedback := null,
        p_saved := false,
        p_action := 'opened'
      );
    exception when others then
      null;
    end;
  end if;

  v_node := public.lumi_get_node('RESOURCE_VIEWER_ACTIVE');

  return jsonb_build_object(
    'ok', true,
    'code', 'RESOURCE_VIEWER_ACTIVE',
    'message', coalesce(v_node->>'message', 'Tomá el tiempo que necesitás.'),
    'actions', coalesce(v_node->'actions', jsonb_build_array(
      jsonb_build_object('label', 'Listo', 'value', '', 'action', 'close_resource_viewer')
    )),
    'content_type', 'resource_viewer',
    'content', jsonb_build_object(
      'type', 'resource_viewer',
      'title', coalesce(v_resource.title, ''),
      'url', coalesce(v_resource.url, ''),
      'activeUrl', coalesce(v_resource.url, ''),
      'source_kind', v_source_kind,
      'format', coalesce(v_resource.format::text, ''),
      'duration_min', coalesce(v_resource.duration_min, 0),
      'resource_id', v_resource_id::text,
      'experience_id', coalesce(v_experience_id::text, ''),
      'experience_run_id', coalesce(v_run_id::text, ''),
      'run_id', coalesce(v_run_id::text, ''),
      'source', v_source,
      'metadata', coalesce(v_resource.metadata, '{}'::jsonb)
    ),
    'state', jsonb_build_object(
      'currentResourceId', v_resource_id::text,
      'currentExperienceId', coalesce(v_experience_id::text, ''),
      'currentExperienceRunId', coalesce(v_run_id::text, ''),
      'resourceSourceKind', v_source_kind,
      'activeUrl', coalesce(v_resource.url, ''),
      'contentSource', v_source
    )
  );
end;
$function$;

commit;
