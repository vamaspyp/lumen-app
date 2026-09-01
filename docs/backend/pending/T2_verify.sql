-- T2 · VERIFICACIÓN REPRODUCIBLE · S05–S08
-- Ejecutar DESPUÉS de T2_01 + T2_02 + T2_03.
-- Toda la prueba corre dentro de transacción y termina en ROLLBACK.
-- No deja compromisos, retornos ni mediciones de prueba.

begin;

do $test$
declare
  v_user_id uuid;
  v_other_user_id uuid;
  v_run_id uuid;
  v_uaf_id uuid;
  v_area text;
  v_faro_key text;
  v_result jsonb;
  v_commitment_id uuid;
  v_commitment_2 uuid;
  v_commitment_3 uuid;
  v_depth jsonb;
  v_baseline jsonb;
  v_remeasure jsonb;
  v_runs_before integer;
  v_commitments_before integer;
  v_returns_before integer;
  v_measurements_before integer;
begin
  -- Baseline real: run positivo, completo y ligado a un Faro activo.
  select er.user_id, er.id, uaf.id, uaf.area::text, uaf.faro_key
  into v_user_id, v_run_id, v_uaf_id, v_area, v_faro_key
  from public.experience_runs er
  join public.user_area_faros uaf on uaf.id = er.user_area_faro_id
  where er.completed_at is not null
    and er.help_signal = 'me_dejo_un_poco_mejor'
    and uaf.status = 'active'
  order by er.completed_at desc
  limit 1;

  if v_user_id is null or v_run_id is null or v_uaf_id is null then
    raise exception 'T2_VERIFY: no hay run positivo con Faro activo para baseline';
  end if;

  select u.id into v_other_user_id
  from public.users u
  where u.id <> v_user_id
  order by u.created_at asc
  limit 1;

  select count(*) into v_runs_before from public.experience_runs;
  select count(*) into v_commitments_before from public.lumen_commitments;
  select count(*) into v_returns_before from public.lumen_returns;
  select count(*) into v_measurements_before from public.faro_measurements;

  -- Simular el JWT real del usuario para que las pruebas atraviesen el mismo
  -- guardarraíl de ownership que el Data API/dispatcher.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_user_id::text, 'role', 'authenticated')::text,
    true
  );

  -- Seguridad: otro usuario no puede actuar sobre este run.
  if v_other_user_id is not null then
    v_result := public.lumi_offer_commitment(jsonb_build_object(
      'user_id', v_other_user_id::text,
      'experience_run_id', v_run_id::text
    ));
    if coalesce(v_result->>'error','') <> 'forbidden' then
      raise exception 'T2_VERIFY: ownership no rechazó user_id ajeno: %', v_result;
    end if;
  end if;

  -- Las tablas nuevas son públicas por identidad canónica, no por exposición:
  -- RLS ON y sin grants directos anon/authenticated.
  if (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public'
        and c.relname in ('lumen_commitments','lumen_returns','faro_measurements')
        and c.relrowsecurity) <> 3 then
    raise exception 'T2_VERIFY: RLS no está activo en las 3 tablas T2';
  end if;

  if exists (
    select 1
    from information_schema.role_table_grants g
    where g.table_schema='public'
      and g.table_name in ('lumen_commitments','lumen_returns','faro_measurements')
      and g.grantee in ('anon','authenticated')
  ) then
    raise exception 'T2_VERIFY: hay grants directos anon/authenticated sobre tablas T2';
  end if;

  if exists (
    select 1
    from information_schema.columns c
    where c.table_schema='public'
      and c.table_name in ('lumen_commitments','lumen_returns','faro_measurements')
      and lower(c.column_name) in ('score','compliance_score','streak','points','penalty')
  ) then
    raise exception 'T2_VERIFY: T2 introdujo score/racha/penalización estructural';
  end if;

  -- S05 · experiencia → compromiso → vencimiento → reentrada → "lo hice".
  v_result := public.lumi_dispatch('offer_commitment', jsonb_build_object(
    'user_id', v_user_id::text,
    'experience_run_id', v_run_id::text
  ));
  if not coalesce((v_result->>'ok')::boolean,false)
     or v_result->>'code' <> 'CONTINUITY_COMMITMENT_OFFER' then
    raise exception 'T2_VERIFY S05: oferta de compromiso falló: %', v_result;
  end if;

  v_result := public.lumi_dispatch('create_commitment', jsonb_build_object(
    'user_id', v_user_id::text,
    'experience_run_id', v_run_id::text,
    'value', 'P1D'
  ));
  v_commitment_id := nullif(v_result->'content'->>'commitment_id','')::uuid;
  if v_commitment_id is null then
    raise exception 'T2_VERIFY S05: no se creó compromiso: %', v_result;
  end if;

  -- El vencimiento se calcula: sólo movemos due_at para simular el paso del tiempo.
  update public.lumen_commitments
  set due_at = now() - interval '1 minute'
  where id = v_commitment_id;

  v_result := public.lumi_dispatch('go_home', jsonb_build_object(
    'user_id', v_user_id::text
  ));
  if v_result->>'code' <> 'CONTINUITY_DUE'
     or v_result->'content'->>'reason' <> 'due_commitment' then
    raise exception 'T2_VERIFY S08: reentrada no explicó compromiso vencido: %', v_result;
  end if;

  v_result := public.lumi_dispatch('open_return', jsonb_build_object(
    'user_id', v_user_id::text,
    'value', v_commitment_id::text
  ));
  if v_result->>'code' <> 'CONTINUITY_RETURN_OPEN' then
    raise exception 'T2_VERIFY S05: open_return falló: %', v_result;
  end if;

  v_result := public.lumi_dispatch('submit_return', jsonb_build_object(
    'user_id', v_user_id::text,
    'value', 'did:' || v_commitment_id::text
  ));
  if v_result->>'code' <> 'CONTINUITY_RETURN_RECORDED' then
    raise exception 'T2_VERIFY S05: submit did falló: %', v_result;
  end if;

  if not exists (
    select 1
    from public.lumen_returns lr
    join public.lumen_commitments lc on lc.id=lr.commitment_id
    where lr.commitment_id=v_commitment_id
      and lr.outcome='did'
      and lc.status='returned'
      and lc.closed_at is not null
  ) then
    raise exception 'T2_VERIFY S05: evidencia did/returned inconsistente';
  end if;

  -- S06 · "no pude" es evidencia válida, sin penalización.
  v_result := public.lumi_dispatch('create_commitment', jsonb_build_object(
    'user_id', v_user_id::text,
    'experience_run_id', v_run_id::text,
    'value', 'P1D'
  ));
  v_commitment_2 := nullif(v_result->'content'->>'commitment_id','')::uuid;
  if v_commitment_2 is null or v_commitment_2 = v_commitment_id then
    raise exception 'T2_VERIFY S06: segundo compromiso no nació tras cerrar el primero';
  end if;

  update public.lumen_commitments set due_at=now()-interval '1 minute' where id=v_commitment_2;

  v_result := public.lumi_dispatch('submit_return', jsonb_build_object(
    'user_id', v_user_id::text,
    'value', 'could_not:' || v_commitment_2::text,
    'barrier_text', 'prueba_controlada_t2'
  ));
  if v_result->>'code' <> 'CONTINUITY_RETURN_RECORDED' then
    raise exception 'T2_VERIFY S06: submit could_not falló: %', v_result;
  end if;

  if not exists (
    select 1
    from public.lumen_returns lr
    where lr.commitment_id=v_commitment_2
      and lr.outcome='could_not'
      and lr.metadata->>'non_penalizing'='true'
  ) then
    raise exception 'T2_VERIFY S06: no pude no quedó como evidencia no penalizante';
  end if;

  -- S07 · C04: 2 Retornos del mismo Faro => profundidad 2.
  v_depth := public.lumi_dispatch('get_depth_eligibility', jsonb_build_object(
    'user_id', v_user_id::text,
    'user_area_faro_id', v_uaf_id::text
  ));
  if coalesce((v_depth->>'eligible_depth')::integer,0) <> 2
     or coalesce((v_depth->>'returned_commitments_same_faro')::integer,0) <> 2 then
    raise exception 'T2_VERIFY S07/C04: profundidad 2 incorrecta: %', v_depth;
  end if;

  -- Tercer Retorno, incluso "lo hice distinto", habilita profundidad 3 según C05.
  v_result := public.lumi_dispatch('create_commitment', jsonb_build_object(
    'user_id', v_user_id::text,
    'experience_run_id', v_run_id::text,
    'value', 'P1D'
  ));
  v_commitment_3 := nullif(v_result->'content'->>'commitment_id','')::uuid;
  if v_commitment_3 is null then
    raise exception 'T2_VERIFY S07: tercer compromiso no creado';
  end if;

  v_result := public.lumi_dispatch('submit_return', jsonb_build_object(
    'user_id', v_user_id::text,
    'value', 'did_differently:' || v_commitment_3::text
  ));
  if v_result->>'code' <> 'CONTINUITY_RETURN_RECORDED' then
    raise exception 'T2_VERIFY S07: tercer Retorno falló: %', v_result;
  end if;

  v_depth := public.lumi_dispatch('get_depth_eligibility', jsonb_build_object(
    'user_id', v_user_id::text,
    'user_area_faro_id', v_uaf_id::text
  ));
  if coalesce((v_depth->>'eligible_depth')::integer,0) <> 3
     or coalesce((v_depth->>'returned_commitments_same_faro')::integer,0) <> 3
     or coalesce((v_depth->>'persisted_level')::boolean,true) then
    raise exception 'T2_VERIFY S07/C05: profundidad 3 incorrecta o persistida: %', v_depth;
  end if;

  -- Sin razón vigente, Home no inventa proactividad.
  v_result := public.lumi_dispatch('go_home', jsonb_build_object(
    'user_id', v_user_id::text
  ));
  if v_result->>'code' in ('CONTINUITY_DUE','FARO_REMEASUREMENT_DUE') then
    raise exception 'T2_VERIFY S08: proactividad sin razón válida: %', v_result;
  end if;

  -- Faro · baseline 0..10 al activar.
  -- La tabla acaba de nacer; elegimos esta instancia controlada sin baseline.
  if exists (
    select 1 from public.faro_measurements fm
    where fm.user_area_faro_id=v_uaf_id
      and fm.measurement_kind='baseline'
  ) then
    raise exception 'T2_VERIFY FARO: baseline preexistente impide prueba controlada';
  end if;

  v_baseline := public.lumi_dispatch('activate_faro', jsonb_build_object(
    'user_id', v_user_id::text,
    'area', v_area,
    'value', v_faro_key
  ));
  if v_baseline->>'code' <> 'FARO_BASELINE_PROMPT'
     or v_baseline->>'message' <> '¿Cuánto sentís hoy que podés avanzar en esto?'
     or jsonb_array_length(v_baseline->'content'->'options') <> 11 then
    raise exception 'T2_VERIFY FARO: prompt baseline incorrecto: %', v_baseline;
  end if;

  v_result := public.lumi_dispatch('submit_checkin_faro_baseline', jsonb_build_object(
    'user_id', v_user_id::text,
    'user_area_faro_id', v_uaf_id::text,
    'checkin_faro_baseline', '4'
  ));
  if not coalesce((v_result->>'ok')::boolean,false) then
    raise exception 'T2_VERIFY FARO: baseline no registrado: %', v_result;
  end if;

  if not exists (
    select 1 from public.faro_measurements fm
    where fm.user_area_faro_id=v_uaf_id
      and fm.measurement_kind='baseline'
      and fm.value=4
  ) then
    raise exception 'T2_VERIFY FARO: valor baseline inconsistente';
  end if;

  -- Simular D+31; la remedición inicial debe aparecer como razón explicable.
  update public.faro_measurements
  set created_at = now() - interval '31 days'
  where user_area_faro_id=v_uaf_id
    and measurement_kind='baseline';

  v_result := public.lumi_dispatch('go_home', jsonb_build_object('user_id',v_user_id::text));
  if v_result->>'code' <> 'FARO_REMEASUREMENT_DUE'
     or v_result->'content'->>'reason' <> 'due_faro_remeasurement' then
    raise exception 'T2_VERIFY FARO/S08: remedición vencida no explica reentrada: %', v_result;
  end if;

  v_remeasure := public.lumi_dispatch('open_faro_remeasurement', jsonb_build_object(
    'user_id',v_user_id::text,
    'value',v_uaf_id::text
  ));
  if v_remeasure->>'code' <> 'FARO_REMEASUREMENT_PROMPT'
     or jsonb_array_length(v_remeasure->'content'->'options') <> 11 then
    raise exception 'T2_VERIFY FARO: open remeasurement incorrecto: %', v_remeasure;
  end if;

  v_result := public.lumi_dispatch('submit_checkin_faro_remeasurement', jsonb_build_object(
    'user_id',v_user_id::text,
    'user_area_faro_id',v_uaf_id::text,
    'checkin_faro_remeasurement','6'
  ));
  if v_result->>'code' <> 'FARO_REMEASUREMENT_RECORDED' then
    raise exception 'T2_VERIFY FARO: remedición no registrada: %', v_result;
  end if;

  if (select count(*) from public.faro_measurements fm
      where fm.user_area_faro_id=v_uaf_id and fm.measurement_kind='remeasurement') <> 1 then
    raise exception 'T2_VERIFY FARO: remedición no idempotente/única en contrato inicial';
  end if;

  v_result := public.lumi_dispatch('go_home', jsonb_build_object('user_id',v_user_id::text));
  if v_result->>'code' = 'FARO_REMEASUREMENT_DUE' then
    raise exception 'T2_VERIFY FARO: siguió vencida después de remedición';
  end if;

  -- T2 no altera la evidencia de runs existente.
  if (select count(*) from public.experience_runs) <> v_runs_before then
    raise exception 'T2_VERIFY: T2 alteró cantidad de experience_runs';
  end if;

  raise notice 'T2_VERIFY PASS · S05 did · S06 could_not · S07 depth · S08 explainable reentry · Faro 0..10 D+30';
end;
$test$;

rollback;
