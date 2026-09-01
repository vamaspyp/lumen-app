-- T1 · VERIFICACIÓN REPRODUCIBLE
-- Ejecutar DESPUÉS de T1_01 + T1_02 + T1_03.
-- Toda la prueba corre dentro de transacción y termina en ROLLBACK.
-- No deja sesiones, eventos ni runs de prueba.

begin;

do $test$
declare
  v_user_id uuid;
  v_session_id uuid;
  v_no_match_session_id uuid;
  v_capability text;
  v_area text;
  v_state text;
  v_result jsonb;
  v_start jsonb;
  v_start_again jsonb;
  v_offer_token text;
  v_experience_id uuid;
  v_resource_id uuid;
  v_run_id uuid;
  v_run_id_again uuid;
  v_runs_before integer;
  v_runs_after_match integer;
  v_runs_after_start integer;
  v_events_before integer;
  v_events_after integer;
  v_no_match_result jsonb;
  v_no_match_events integer;
  v_bad_capability text := '__t1_no_match__';
begin
  -- Elegir usuario + hipótesis H1 viva sin rechazo reciente de esa experiencia.
  select
    u.id,
    eh.capability_key,
    eh.life_area_key,
    eh.state_key
  into
    v_user_id,
    v_capability,
    v_area,
    v_state
  from public.users u
  cross join public.experience_hypotheses eh
  join public.experiences e
    on e.id = eh.experience_id
   and e.active = true
   and e.editorial_status in ('core_mvp', 'enrichment_mvp')
  join public.resources r
    on r.id = e.primary_resource_id
   and r.is_active = true
   and r.status = 'active'
  where eh.active = true
    and eh.hemisphere_key = 'H1'
    and nullif(eh.capability_key, '') is not null
    and eh.expected_capability_key = eh.capability_key
    and not exists (
      select 1
      from public.experience_runs er
      where er.user_id = u.id
        and er.experience_id = e.id
        and er.help_signal = 'no_era_para_mi'
        and er.started_at > now() - interval '30 days'
    )
  order by u.created_at asc, eh.priority desc
  limit 1;

  if v_user_id is null or v_capability is null then
    raise exception 'T1_VERIFY: no se encontró baseline H1 elegible';
  end if;

  insert into public.sessions (
    user_id,
    hemisphere_key,
    area,
    state_key,
    selected_capability_key,
    landing_completed
  ) values (
    v_user_id,
    'H1',
    case when v_area is null then null else v_area::public.life_area end,
    v_state,
    v_capability,
    true
  ) returning id into v_session_id;

  select count(*) into v_runs_before
  from public.experience_runs
  where session_id = v_session_id;

  -- 1) MATCH positivo: devuelve oferta, no crea Run.
  v_result := public.lumi_select_experience(
    p_user_id := v_user_id,
    p_session_id := v_session_id
  );

  if not coalesce((v_result->>'matched')::boolean, false) then
    raise exception 'T1_VERIFY: baseline esperado MATCH, obtuvo %', v_result;
  end if;

  v_offer_token := nullif(v_result->>'offer_token', '');
  v_experience_id := nullif(v_result->>'experience_id', '')::uuid;
  v_resource_id := nullif(v_result->'resource'->>'id', '')::uuid;

  if v_offer_token is null or v_experience_id is null or v_resource_id is null then
    raise exception 'T1_VERIFY: MATCH sin token/experience/resource: %', v_result;
  end if;

  select count(*) into v_runs_after_match
  from public.experience_runs
  where session_id = v_session_id;

  if v_runs_after_match <> v_runs_before then
    raise exception 'T1_VERIFY: MATCH creó Run (% -> %)', v_runs_before, v_runs_after_match;
  end if;

  if (select selected_experience_id from public.sessions where id = v_session_id) is not null then
    raise exception 'T1_VERIFY: MATCH volvió a escribir sessions.selected_experience_id';
  end if;

  -- 2) "Ahora no" se representa no invocando Empezar: sigue habiendo 0 Runs.
  if exists (select 1 from public.experience_runs where session_id = v_session_id) then
    raise exception 'T1_VERIFY: PRE sin Empezar dejó Run';
  end if;

  -- 3) Empezar crea exactamente un Run canónico.
  v_start := public.lumi_open_resource_viewer(jsonb_build_object(
    'user_id', v_user_id::text,
    'session_id', v_session_id::text,
    'experience_id', v_experience_id::text,
    'resource_id', v_resource_id::text,
    'source', 'lumi',
    'value', v_offer_token
  ));

  v_run_id := nullif(v_start->'content'->>'run_id', '')::uuid;
  if v_run_id is null then
    raise exception 'T1_VERIFY: Empezar no devolvió run_id: %', v_start;
  end if;

  select count(*) into v_runs_after_start
  from public.experience_runs
  where session_id = v_session_id;

  if v_runs_after_start <> 1 then
    raise exception 'T1_VERIFY: Empezar debía crear 1 Run; creó %', v_runs_after_start;
  end if;

  if not exists (
    select 1
    from public.experience_runs er
    where er.id = v_run_id
      and er.user_id = v_user_id
      and er.session_id = v_session_id
      and er.experience_id = v_experience_id
      and er.resource_id = v_resource_id
      and er.selection_source = 'motor'
      and er.realization_type = 'source'
      and er.served_capability_key = v_capability
      and er.started_at is not null
      and er.offer_snapshot->>'offer_token' = v_offer_token
      and er.offer_snapshot->>'contract' = 't1_checkin_match_run_v1'
  ) then
    raise exception 'T1_VERIFY: Run creado no cumple contrato canónico';
  end if;

  -- Idempotencia: doble Empezar con mismo token reusa el mismo Run.
  v_start_again := public.lumi_open_resource_viewer(jsonb_build_object(
    'user_id', v_user_id::text,
    'session_id', v_session_id::text,
    'experience_id', v_experience_id::text,
    'resource_id', v_resource_id::text,
    'source', 'lumi',
    'value', v_offer_token
  ));
  v_run_id_again := nullif(v_start_again->'content'->>'run_id', '')::uuid;

  if v_run_id_again is distinct from v_run_id then
    raise exception 'T1_VERIFY: idempotencia falló: % vs %', v_run_id, v_run_id_again;
  end if;

  if (select count(*) from public.experience_runs where session_id = v_session_id) <> 1 then
    raise exception 'T1_VERIFY: doble Empezar creó más de un Run';
  end if;

  -- 4) Retorno actualiza el mismo Run; session_events no duplica feedback.
  select count(*) into v_events_before
  from public.session_events
  where experience_run_id = v_run_id;

  perform public.lumi_complete_experience_run(
    v_run_id,
    'me_dejo_un_poco_mejor',
    null,
    null
  );

  if not exists (
    select 1 from public.experience_runs
    where id = v_run_id
      and help_signal = 'me_dejo_un_poco_mejor'
      and completed_at is not null
  ) then
    raise exception 'T1_VERIFY: complete_experience_run no actualizó el Run';
  end if;

  select count(*) into v_events_after
  from public.session_events
  where experience_run_id = v_run_id;

  if v_events_after <> v_events_before then
    raise exception 'T1_VERIFY: Retorno duplicó evidencia en session_events (% -> %)', v_events_before, v_events_after;
  end if;

  if exists (
    select 1 from public.session_events
    where experience_run_id = v_run_id
      and (intervention_key is not null or help_intent_key is not null or pattern_key is not null)
  ) then
    raise exception 'T1_VERIFY: evento canónico de Run escribió claves legacy';
  end if;

  -- 5) NO_MATCH: cero Runs + journal válido; sessions no se vuelve autoridad.
  insert into public.sessions (
    user_id,
    hemisphere_key,
    area,
    state_key,
    selected_capability_key,
    landing_completed
  ) values (
    v_user_id,
    'H1',
    case when v_area is null then null else v_area::public.life_area end,
    v_state,
    v_bad_capability,
    true
  ) returning id into v_no_match_session_id;

  v_no_match_result := public.lumi_select_experience(
    p_user_id := v_user_id,
    p_session_id := v_no_match_session_id
  );

  if coalesce((v_no_match_result->>'matched')::boolean, false) then
    raise exception 'T1_VERIFY: capacidad imposible produjo MATCH: %', v_no_match_result;
  end if;

  if exists (select 1 from public.experience_runs where session_id = v_no_match_session_id) then
    raise exception 'T1_VERIFY: NO_MATCH creó Run';
  end if;

  select count(*) into v_no_match_events
  from public.session_events se
  where se.session_id = v_no_match_session_id
    and se.action_type = 'no_match'
    and se.metadata->>'reason' = 'no_hypothesis_found'
    and se.metadata->>'selector_contract' = 't1_checkin_match_run_v1';

  if v_no_match_events <> 1 then
    raise exception 'T1_VERIFY: NO_MATCH debía dejar 1 journal; dejó %', v_no_match_events;
  end if;

  if exists (
    select 1 from public.sessions s
    where s.id = v_no_match_session_id
      and (
        s.selected_experience_id is not null
        or s.last_no_match_at is not null
        or s.last_no_match_reason is not null
      )
  ) then
    raise exception 'T1_VERIFY: NO_MATCH volvió a consolidar estado legacy en sessions';
  end if;

  if exists (
    select 1 from public.session_events se
    where se.session_id = v_no_match_session_id
      and se.action_type = 'no_match'
      and (se.intervention_key is not null or se.help_intent_key is not null or se.pattern_key is not null)
  ) then
    raise exception 'T1_VERIFY: NO_MATCH escribió claves legacy en journal';
  end if;

  raise notice 'T1_VERIFY PASS · MATCH≠RUN · idempotencia · retorno · NO_MATCH journal';
end;
$test$;

rollback;
