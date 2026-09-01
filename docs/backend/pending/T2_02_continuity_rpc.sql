-- T2 · CONTINUIDAD · 02 RPC DE COMPROMISO / RETORNO / PROFUNDIDAD
-- Requiere T2_01_continuity_schema.sql.

begin;

create or replace function private.lumen_actor_allowed(p_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $function$
  select p_user_id is not null
    and (
      (select auth.uid()) = p_user_id
      or (
        (select auth.uid()) is null
        and session_user = 'postgres'
      )
      or coalesce(
        nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role',
        ''
      ) = 'service_role'
    );
$function$;

revoke execute on function private.lumen_actor_allowed(uuid) from public, anon, authenticated;
grant execute on function private.lumen_actor_allowed(uuid) to service_role;

create or replace function private.lumen_get_due_continuity(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_due_count integer := 0;
  v_due_commitment jsonb := null;
  v_next_commitment jsonb := null;
  v_due_remeasurement_count integer := 0;
  v_due_remeasurement jsonb := null;
begin
  select count(*)
  into v_due_count
  from public.lumen_commitments lc
  where lc.user_id = p_user_id
    and lc.status = 'active'
    and lc.due_at <= now();

  select jsonb_strip_nulls(jsonb_build_object(
    'commitment_id', lc.id::text,
    'origin_run_id', lc.origin_run_id::text,
    'user_area_faro_id', lc.user_area_faro_id::text,
    'capability_key', lc.capability_key,
    'due_at', lc.due_at,
    'experience_title', e.title,
    'faro_key', er.faro_key,
    'faro_text', er.faro_text_snapshot
  ))
  into v_due_commitment
  from public.lumen_commitments lc
  join public.experience_runs er on er.id = lc.origin_run_id
  left join public.experiences e on e.id = er.experience_id
  where lc.user_id = p_user_id
    and lc.status = 'active'
    and lc.due_at <= now()
  order by lc.due_at asc, lc.created_at asc
  limit 1;

  select jsonb_strip_nulls(jsonb_build_object(
    'commitment_id', lc.id::text,
    'origin_run_id', lc.origin_run_id::text,
    'user_area_faro_id', lc.user_area_faro_id::text,
    'capability_key', lc.capability_key,
    'due_at', lc.due_at,
    'experience_title', e.title,
    'faro_key', er.faro_key,
    'faro_text', er.faro_text_snapshot
  ))
  into v_next_commitment
  from public.lumen_commitments lc
  join public.experience_runs er on er.id = lc.origin_run_id
  left join public.experiences e on e.id = er.experience_id
  where lc.user_id = p_user_id
    and lc.status = 'active'
    and lc.due_at > now()
  order by lc.due_at asc, lc.created_at asc
  limit 1;

  select count(*)
  into v_due_remeasurement_count
  from public.user_area_faros uaf
  join public.faro_measurements fm
    on fm.user_area_faro_id = uaf.id
   and fm.measurement_kind = 'baseline'
  where uaf.user_id = p_user_id
    and uaf.status = 'active'
    and fm.created_at <= now() - interval '30 days'
    and not exists (
      select 1
      from public.faro_measurements rm
      where rm.user_area_faro_id = uaf.id
        and rm.measurement_kind = 'remeasurement'
        and rm.created_at >= fm.created_at
    );

  select jsonb_strip_nulls(jsonb_build_object(
    'user_area_faro_id', uaf.id::text,
    'faro_key', uaf.faro_key,
    'faro_text', uaf.faro_text,
    'baseline_value', fm.value,
    'baseline_at', fm.created_at,
    'due_at', fm.created_at + interval '30 days'
  ))
  into v_due_remeasurement
  from public.user_area_faros uaf
  join public.faro_measurements fm
    on fm.user_area_faro_id = uaf.id
   and fm.measurement_kind = 'baseline'
  where uaf.user_id = p_user_id
    and uaf.status = 'active'
    and fm.created_at <= now() - interval '30 days'
    and not exists (
      select 1
      from public.faro_measurements rm
      where rm.user_area_faro_id = uaf.id
        and rm.measurement_kind = 'remeasurement'
        and rm.created_at >= fm.created_at
    )
  order by fm.created_at asc
  limit 1;

  return jsonb_build_object(
    'due_commitment_count', v_due_count,
    'due_commitment', v_due_commitment,
    'next_commitment', v_next_commitment,
    'due_remeasurement_count', v_due_remeasurement_count,
    'due_remeasurement', v_due_remeasurement,
    'reentry_reason', case
      when v_due_count > 0 then 'due_commitment'
      when v_due_remeasurement_count > 0 then 'due_faro_remeasurement'
      else null
    end
  );
end;
$function$;

revoke execute on function private.lumen_get_due_continuity(uuid) from public, anon, authenticated;
grant execute on function private.lumen_get_due_continuity(uuid) to service_role;

create or replace function private.lumen_get_depth_eligibility(
  p_user_id uuid,
  p_user_area_faro_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_returned_count integer := 0;
  v_depth smallint := 1;
begin
  select count(*)
  into v_returned_count
  from public.lumen_returns lr
  join public.lumen_commitments lc on lc.id = lr.commitment_id
  where lc.user_id = p_user_id
    and lc.user_area_faro_id = p_user_area_faro_id
    and lc.status = 'returned';

  v_depth := case
    when v_returned_count >= 3 then 3
    when v_returned_count >= 2 then 2
    else 1
  end;

  return jsonb_build_object(
    'eligible_depth', v_depth,
    'returned_commitments_same_faro', v_returned_count,
    'depth_2_threshold', 2,
    'depth_3_threshold', 3,
    'rule_source', 'V33:C04/C05',
    'persisted_level', false
  );
end;
$function$;

revoke execute on function private.lumen_get_depth_eligibility(uuid, uuid) from public, anon, authenticated;
grant execute on function private.lumen_get_depth_eligibility(uuid, uuid) to service_role;

create or replace function public.lumi_offer_commitment(p_params jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_run_id uuid;
  v_run record;
begin
  p_params := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));
  v_user_id := nullif(trim(p_params->>'user_id'), '')::uuid;
  v_run_id := nullif(trim(coalesce(
    p_params->>'experience_run_id',
    p_params->>'currentExperienceRunId'
  )), '')::uuid;

  if not private.lumen_actor_allowed(v_user_id) then
    return jsonb_build_object('ok', false, 'error', 'forbidden', 'state', '{}'::jsonb);
  end if;

  select er.id, er.user_id, er.completed_at, er.help_signal, er.resource_id
  into v_run
  from public.experience_runs er
  where er.id = v_run_id
    and er.user_id = v_user_id;

  if not found or v_run.completed_at is null or v_run.help_signal <> 'me_dejo_un_poco_mejor' then
    return jsonb_build_object(
      'ok', false,
      'error', 'run_no_elegible_para_compromiso',
      'state', '{}'::jsonb
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', 'CONTINUITY_COMMITMENT_OFFER',
    'message', '¿Querés volver a esto en algún momento?',
    'actions', jsonb_build_array(
      jsonb_build_object('label','Mañana','action','create_commitment','value','P1D','variant','solid'),
      jsonb_build_object('label','En 3 días','action','create_commitment','value','P3D','variant','outline'),
      jsonb_build_object('label','En una semana','action','create_commitment','value','P7D','variant','outline'),
      jsonb_build_object('label','Ahora no','action','go_home','value','skip_continuity','variant','ghost')
    ),
    'content_type', 'empty_presence',
    'content', jsonb_build_object('type','empty_presence','source','continuity'),
    'state', jsonb_build_object(
      'currentExperienceRunId', v_run_id::text,
      'currentResourceId', coalesce(v_run.resource_id::text, ''),
      'contentSource', 'continuity'
    )
  );
end;
$function$;

create or replace function public.lumi_create_commitment(p_params jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_run_id uuid;
  v_choice text;
  v_due_at timestamptz;
  v_run record;
  v_commitment_id uuid;
  v_existing_due_at timestamptz;
begin
  p_params := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));
  v_user_id := nullif(trim(p_params->>'user_id'), '')::uuid;
  v_run_id := nullif(trim(coalesce(
    p_params->>'experience_run_id',
    p_params->>'currentExperienceRunId'
  )), '')::uuid;
  v_choice := nullif(trim(coalesce(p_params->>'value', p_params->>'when', '')), '');

  if not private.lumen_actor_allowed(v_user_id) then
    return jsonb_build_object('ok', false, 'error', 'forbidden', 'state', '{}'::jsonb);
  end if;

  v_due_at := case v_choice
    when 'P1D' then now() + interval '1 day'
    when 'P3D' then now() + interval '3 days'
    when 'P7D' then now() + interval '7 days'
    else null
  end;

  if v_due_at is null then
    return jsonb_build_object('ok', false, 'error', 'momento_de_retorno_invalido', 'state', '{}'::jsonb);
  end if;

  select
    er.id,
    er.user_id,
    er.completed_at,
    er.help_signal,
    er.user_area_faro_id,
    coalesce(
      er.served_capability_key,
      er.perceived_capability_key,
      er.primary_capability_key,
      er.selected_capability_key
    ) as capability_key
  into v_run
  from public.experience_runs er
  where er.id = v_run_id
    and er.user_id = v_user_id;

  if not found or v_run.completed_at is null or v_run.help_signal <> 'me_dejo_un_poco_mejor' then
    return jsonb_build_object(
      'ok', false,
      'error', 'run_no_elegible_para_compromiso',
      'state', '{}'::jsonb
    );
  end if;

  insert into public.lumen_commitments (
    user_id,
    origin_run_id,
    user_area_faro_id,
    capability_key,
    due_at,
    status,
    metadata
  ) values (
    v_user_id,
    v_run_id,
    v_run.user_area_faro_id,
    v_run.capability_key,
    v_due_at,
    'active',
    jsonb_build_object(
      'contract', 't2_continuity_v1',
      'choice', v_choice,
      'created_via', 'lumi_create_commitment'
    )
  )
  on conflict (user_id, origin_run_id) where status = 'active'
  do nothing
  returning id, due_at into v_commitment_id, v_existing_due_at;

  if v_commitment_id is null then
    select lc.id, lc.due_at
    into v_commitment_id, v_existing_due_at
    from public.lumen_commitments lc
    where lc.user_id = v_user_id
      and lc.origin_run_id = v_run_id
      and lc.status = 'active'
    order by lc.created_at desc
    limit 1;
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', 'CONTINUITY_COMMITMENT_CREATED',
    'message', 'Quedó. Cuando llegue ese momento, podemos retomarlo desde acá.',
    'actions', jsonb_build_array(
      jsonb_build_object('label','Inicio','action','go_home','value','skip_continuity','variant','solid')
    ),
    'content_type', 'empty_presence',
    'content', jsonb_build_object(
      'type','empty_presence',
      'source','continuity',
      'commitment_id',v_commitment_id::text,
      'due_at',v_existing_due_at
    ),
    'state', jsonb_build_object('contentSource','continuity')
  );
end;
$function$;

create or replace function public.lumi_open_return(p_params jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_commitment_id uuid;
  v_commitment record;
begin
  p_params := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));
  v_user_id := nullif(trim(p_params->>'user_id'), '')::uuid;
  v_commitment_id := nullif(trim(coalesce(
    p_params->>'commitment_id',
    p_params->>'value'
  )), '')::uuid;

  if not private.lumen_actor_allowed(v_user_id) then
    return jsonb_build_object('ok', false, 'error', 'forbidden', 'state', '{}'::jsonb);
  end if;

  select lc.id, lc.origin_run_id, lc.due_at, lc.status
  into v_commitment
  from public.lumen_commitments lc
  where lc.id = v_commitment_id
    and lc.user_id = v_user_id;

  if not found or v_commitment.status <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'compromiso_no_activo', 'state', '{}'::jsonb);
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', 'CONTINUITY_RETURN_OPEN',
    'message', 'Habías elegido volver a esto. ¿Qué pasó desde entonces?',
    'actions', jsonb_build_array(
      jsonb_build_object('label','Lo hice','action','submit_return','value','did:' || v_commitment_id::text,'variant','solid'),
      jsonb_build_object('label','No pude','action','submit_return','value','could_not:' || v_commitment_id::text,'variant','outline'),
      jsonb_build_object('label','Lo hice distinto','action','submit_return','value','did_differently:' || v_commitment_id::text,'variant','outline'),
      jsonb_build_object('label','Ahora no','action','go_home','value','skip_continuity','variant','ghost')
    ),
    'content_type', 'empty_presence',
    'content', jsonb_build_object(
      'type','empty_presence',
      'source','continuity',
      'commitment_id',v_commitment_id::text
    ),
    'state', jsonb_build_object(
      'currentExperienceRunId', v_commitment.origin_run_id::text,
      'contentSource', 'continuity'
    )
  );
end;
$function$;

create or replace function public.lumi_submit_return(p_params jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_raw text;
  v_outcome text;
  v_commitment_id uuid;
  v_reflection text;
  v_barrier text;
  v_commitment record;
  v_return_id uuid;
  v_existing_outcome text;
begin
  p_params := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));
  v_user_id := nullif(trim(p_params->>'user_id'), '')::uuid;
  v_raw := nullif(trim(coalesce(p_params->>'value', '')), '');
  v_outcome := split_part(coalesce(v_raw, ''), ':', 1);
  v_commitment_id := nullif(split_part(coalesce(v_raw, ''), ':', 2), '')::uuid;
  v_reflection := nullif(trim(coalesce(p_params->>'reflection_text', '')), '');
  v_barrier := nullif(trim(coalesce(p_params->>'barrier_text', '')), '');

  if not private.lumen_actor_allowed(v_user_id) then
    return jsonb_build_object('ok', false, 'error', 'forbidden', 'state', '{}'::jsonb);
  end if;

  if v_outcome not in ('did','could_not','did_differently') or v_commitment_id is null then
    return jsonb_build_object('ok', false, 'error', 'retorno_invalido', 'state', '{}'::jsonb);
  end if;

  select lc.id, lc.origin_run_id, lc.status
  into v_commitment
  from public.lumen_commitments lc
  where lc.id = v_commitment_id
    and lc.user_id = v_user_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'compromiso_no_encontrado', 'state', '{}'::jsonb);
  end if;

  select lr.id, lr.outcome
  into v_return_id, v_existing_outcome
  from public.lumen_returns lr
  where lr.commitment_id = v_commitment_id;

  if v_return_id is not null then
    if v_existing_outcome <> v_outcome then
      return jsonb_build_object('ok', false, 'error', 'retorno_ya_registrado', 'state', '{}'::jsonb);
    end if;
  else
    if v_commitment.status <> 'active' then
      return jsonb_build_object('ok', false, 'error', 'compromiso_no_activo', 'state', '{}'::jsonb);
    end if;

    insert into public.lumen_returns (
      user_id,
      commitment_id,
      origin_run_id,
      outcome,
      reflection_text,
      barrier_text,
      metadata
    ) values (
      v_user_id,
      v_commitment_id,
      v_commitment.origin_run_id,
      v_outcome,
      v_reflection,
      case when v_outcome = 'could_not' then v_barrier else null end,
      jsonb_build_object(
        'contract', 't2_continuity_v1',
        'created_via', 'lumi_submit_return',
        'non_penalizing', true
      )
    )
    returning id into v_return_id;

    update public.lumen_commitments
    set status = 'returned',
        closed_at = now(),
        updated_at = now()
    where id = v_commitment_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', 'CONTINUITY_RETURN_RECORDED',
    'message', case v_outcome
      when 'did' then 'Gracias. Queda como parte de lo que realmente ocurrió.'
      when 'could_not' then 'Gracias por traerlo así. No hay nada que compensar: también esto nos ayuda a comprender.'
      else 'Gracias. Lo distinto también cuenta: importa lo que pasó en la vida real.'
    end,
    'actions', jsonb_build_array(
      jsonb_build_object('label','Inicio','action','go_home','value','skip_continuity','variant','solid')
    ),
    'content_type', 'empty_presence',
    'content', jsonb_build_object(
      'type','empty_presence',
      'source','continuity',
      'return_id',v_return_id::text,
      'outcome',v_outcome
    ),
    'state', jsonb_build_object('contentSource','continuity')
  );
end;
$function$;

create or replace function public.lumi_get_depth_eligibility(p_params jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_user_area_faro_id uuid;
begin
  p_params := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));
  v_user_id := nullif(trim(p_params->>'user_id'), '')::uuid;
  v_user_area_faro_id := nullif(trim(coalesce(
    p_params->>'user_area_faro_id',
    p_params->>'faro_id',
    p_params->>'value'
  )), '')::uuid;

  if not private.lumen_actor_allowed(v_user_id) then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if not exists (
    select 1
    from public.user_area_faros uaf
    where uaf.id = v_user_area_faro_id
      and uaf.user_id = v_user_id
  ) then
    return jsonb_build_object('ok', false, 'error', 'faro_no_encontrado');
  end if;

  return jsonb_build_object('ok', true)
    || private.lumen_get_depth_eligibility(v_user_id, v_user_area_faro_id);
end;
$function$;

revoke execute on function public.lumi_offer_commitment(jsonb) from public, anon;
revoke execute on function public.lumi_create_commitment(jsonb) from public, anon;
revoke execute on function public.lumi_open_return(jsonb) from public, anon;
revoke execute on function public.lumi_submit_return(jsonb) from public, anon;
revoke execute on function public.lumi_get_depth_eligibility(jsonb) from public, anon;

grant execute on function public.lumi_offer_commitment(jsonb) to authenticated, service_role;
grant execute on function public.lumi_create_commitment(jsonb) to authenticated, service_role;
grant execute on function public.lumi_open_return(jsonb) to authenticated, service_role;
grant execute on function public.lumi_submit_return(jsonb) to authenticated, service_role;
grant execute on function public.lumi_get_depth_eligibility(jsonb) to authenticated, service_role;

commit;
