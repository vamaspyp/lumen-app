-- VA+LUMEN Greenfield V0.4 · S0 public API + core event emission
-- Principle: browser reaches only explicit public RPCs; gf_core/gf_private/gf_ledger remain internal.

create or replace function gf_ledger.audit_core_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid := gen_random_uuid();
  v_trace_id uuid;
  v_event_type text;
  v_aggregate_type text;
  v_aggregate_id uuid;
  v_person_pseudonym uuid;
  v_payload jsonb := '{}'::jsonb;
begin
  begin
    v_trace_id := nullif(current_setting('app.trace_id', true), '')::uuid;
  exception when others then
    v_trace_id := null;
  end;
  v_trace_id := coalesce(v_trace_id, gen_random_uuid());

  if tg_table_schema = 'gf_core' and tg_table_name = 'persons' and tg_op = 'INSERT' then
    v_event_type := 'PersonBootstrapped';
    v_aggregate_type := 'person';
    v_aggregate_id := new.person_id;
    v_person_pseudonym := new.person_id;
    v_payload := jsonb_build_object('revision', new.revision);
  elsif tg_table_schema = 'gf_core' and tg_table_name = 'consent_grants' and tg_op = 'INSERT' then
    v_event_type := 'ConsentChanged';
    v_aggregate_type := 'consent';
    v_aggregate_id := new.consent_id;
    v_person_pseudonym := new.person_id;
    v_payload := jsonb_build_object(
      'scope', new.scope,
      'granted', new.granted,
      'terms_version', new.terms_version
    );
  else
    raise exception 'unsupported audited core change %.% %', tg_table_schema, tg_table_name, tg_op;
  end if;

  insert into gf_ledger.domain_events (
    event_id, event_type, aggregate_type, aggregate_id,
    actor_type, actor_id, person_pseudonym, trace_id,
    contract_version, payload, provenance
  ) values (
    v_event_id, v_event_type, v_aggregate_type, v_aggregate_id,
    'person', auth.uid()::text, v_person_pseudonym, v_trace_id,
    's0.v1', v_payload,
    jsonb_build_object('source', 'postgres_trigger', 'surface', 'public_rpc')
  );

  insert into gf_ledger.outbox (
    event_type, payload, idempotency_key
  ) values (
    v_event_type,
    jsonb_build_object(
      'event_id', v_event_id,
      'aggregate_type', v_aggregate_type,
      'aggregate_id', v_aggregate_id,
      'trace_id', v_trace_id,
      'contract_version', 's0.v1'
    ),
    'ledger:' || v_event_id::text
  );

  return new;
end;
$$;

revoke all on function gf_ledger.audit_core_insert() from public, anon, authenticated;

drop trigger if exists persons_emit_event on gf_core.persons;
create trigger persons_emit_event
after insert on gf_core.persons
for each row execute function gf_ledger.audit_core_insert();

drop trigger if exists consent_emit_event on gf_core.consent_grants;
create trigger consent_emit_event
after insert on gf_core.consent_grants
for each row execute function gf_ledger.audit_core_insert();

create or replace function public.lumen_bootstrap_person(p_trace_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_person_id uuid;
  v_preferences jsonb;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'anonymous users are not eligible for persistent profile' using errcode = '42501';
  end if;

  perform set_config('app.trace_id', coalesce(p_trace_id, gen_random_uuid())::text, true);

  insert into gf_core.persons (auth_user_id)
  values (v_uid)
  on conflict (auth_user_id) do nothing;

  select p.person_id
    into v_person_id
  from gf_core.persons p
  where p.auth_user_id = v_uid;

  if v_person_id is null then
    raise exception 'person bootstrap failed' using errcode = 'P0001';
  end if;

  insert into gf_core.privacy_preferences (person_id)
  values (v_person_id)
  on conflict (person_id) do nothing;

  select jsonb_build_object(
    'proactive_allowed', pp.proactive_allowed,
    'memory_allowed', pp.memory_allowed,
    'evidence_use_allowed', pp.evidence_use_allowed,
    'sharing_allowed', pp.sharing_allowed,
    'revision', pp.revision
  )
  into v_preferences
  from gf_core.privacy_preferences pp
  where pp.person_id = v_person_id;

  return jsonb_build_object(
    'person_id', v_person_id,
    'preferences', v_preferences
  );
end;
$$;

revoke execute on function public.lumen_bootstrap_person(uuid) from public, anon;
grant execute on function public.lumen_bootstrap_person(uuid) to authenticated;

create or replace function public.lumen_get_consent_state()
returns jsonb
language plpgsql
security invoker
stable
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_person_id uuid;
  v_preferences jsonb;
  v_grants jsonb;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'anonymous users are not eligible for persistent profile' using errcode = '42501';
  end if;

  select p.person_id
    into v_person_id
  from gf_core.persons p
  where p.auth_user_id = v_uid;

  if v_person_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'proactive_allowed', pp.proactive_allowed,
    'memory_allowed', pp.memory_allowed,
    'evidence_use_allowed', pp.evidence_use_allowed,
    'sharing_allowed', pp.sharing_allowed,
    'revision', pp.revision
  )
  into v_preferences
  from gf_core.privacy_preferences pp
  where pp.person_id = v_person_id;

  select coalesce(jsonb_object_agg(x.scope, jsonb_build_object(
    'granted', x.granted,
    'terms_version', x.terms_version,
    'created_at', x.created_at
  )), '{}'::jsonb)
  into v_grants
  from (
    select distinct on (cg.scope)
      cg.scope, cg.granted, cg.terms_version, cg.created_at, cg.consent_id
    from gf_core.consent_grants cg
    where cg.person_id = v_person_id
    order by cg.scope, cg.created_at desc, cg.consent_id desc
  ) x;

  return jsonb_build_object(
    'person_id', v_person_id,
    'preferences', v_preferences,
    'grants', v_grants
  );
end;
$$;

revoke execute on function public.lumen_get_consent_state() from public, anon;
grant execute on function public.lumen_get_consent_state() to authenticated;

create or replace function public.lumen_set_consent(
  p_scope text,
  p_granted boolean,
  p_terms_version text,
  p_trace_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_person_id uuid;
  v_scope text := lower(trim(p_scope));
  v_terms text := trim(p_terms_version);
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'anonymous users are not eligible for persistent consent' using errcode = '42501';
  end if;
  if v_scope not in ('proactivity', 'memory', 'evidence_use', 'sharing') then
    raise exception 'unsupported consent scope' using errcode = '22023';
  end if;
  if v_terms is null or v_terms = '' or length(v_terms) > 128 then
    raise exception 'invalid terms version' using errcode = '22023';
  end if;

  perform set_config('app.trace_id', coalesce(p_trace_id, gen_random_uuid())::text, true);

  insert into gf_core.persons (auth_user_id)
  values (v_uid)
  on conflict (auth_user_id) do nothing;

  select p.person_id
    into v_person_id
  from gf_core.persons p
  where p.auth_user_id = v_uid;

  insert into gf_core.privacy_preferences (person_id)
  values (v_person_id)
  on conflict (person_id) do nothing;

  insert into gf_core.consent_grants (
    person_id, scope, granted, revoked_at, terms_version
  ) values (
    v_person_id,
    v_scope,
    p_granted,
    case when p_granted then null else now() end,
    v_terms
  );

  update gf_core.privacy_preferences pp
  set proactive_allowed = case when v_scope = 'proactivity' then p_granted else pp.proactive_allowed end,
      memory_allowed = case when v_scope = 'memory' then p_granted else pp.memory_allowed end,
      evidence_use_allowed = case when v_scope = 'evidence_use' then p_granted else pp.evidence_use_allowed end,
      sharing_allowed = case when v_scope = 'sharing' then p_granted else pp.sharing_allowed end,
      updated_at = now(),
      revision = pp.revision + 1
  where pp.person_id = v_person_id;

  return public.lumen_get_consent_state();
end;
$$;

revoke execute on function public.lumen_set_consent(text, boolean, text, uuid) from public, anon;
grant execute on function public.lumen_set_consent(text, boolean, text, uuid) to authenticated;

comment on function public.lumen_bootstrap_person(uuid) is 'Greenfield S0 explicit browser API: establish user-owned person + privacy defaults under RLS.';
comment on function public.lumen_get_consent_state() is 'Greenfield S0 explicit browser API: read only the caller consent/privacy state under RLS.';
comment on function public.lumen_set_consent(text, boolean, text, uuid) is 'Greenfield S0 explicit browser API: append versioned consent and update current preference under RLS.';
