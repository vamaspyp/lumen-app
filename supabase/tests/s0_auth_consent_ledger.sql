-- VA+LUMEN Greenfield V0.4 · S0 integration certification
-- Run against an isolated greenfield database. Always rolls back fixtures.

begin;

select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa","role":"authenticated","is_anonymous":false}',
  true
);
set local role authenticated;
select public.lumen_bootstrap_person('aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa'::uuid);
select public.lumen_set_consent('memory', true, 'terms.v1', 'aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa'::uuid);
reset role;

do $$
declare
  v_persons integer;
  v_grants integer;
  v_events integer;
  v_outbox integer;
  v_memory boolean;
begin
  select count(*) into v_persons
  from gf_core.persons
  where auth_user_id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'::uuid;

  select count(*) into v_grants
  from gf_core.consent_grants cg
  join gf_core.persons p on p.person_id=cg.person_id
  where p.auth_user_id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'::uuid;

  select count(*) into v_events
  from gf_ledger.domain_events
  where trace_id in (
    'aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa'::uuid,
    'aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa'::uuid
  );

  select count(*) into v_outbox
  from gf_ledger.outbox
  where payload->>'trace_id' in (
    'aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa',
    'aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa'
  );

  select pp.memory_allowed into v_memory
  from gf_core.privacy_preferences pp
  join gf_core.persons p on p.person_id=pp.person_id
  where p.auth_user_id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'::uuid;

  if v_persons <> 1 then raise exception 'S0 certification failed: person bootstrap'; end if;
  if v_grants <> 1 then raise exception 'S0 certification failed: consent append'; end if;
  if v_events <> 2 then raise exception 'S0 certification failed: ledger events'; end if;
  if v_outbox <> 2 then raise exception 'S0 certification failed: outbox'; end if;
  if v_memory is distinct from true then raise exception 'S0 certification failed: current privacy state'; end if;
end $$;

select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb","role":"authenticated","is_anonymous":false}',
  true
);
set local role authenticated;
do $$
begin
  if public.lumen_get_consent_state() is not null then
    raise exception 'S0 certification failed: cross-user isolation';
  end if;
end $$;
reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-1111-4111-8111-cccccccccccc","role":"authenticated","is_anonymous":true}',
  true
);
set local role authenticated;
do $$
begin
  begin
    perform public.lumen_bootstrap_person('cccccccc-2222-4222-8222-cccccccccccc'::uuid);
    raise exception 'S0 certification failed: anonymous user unexpectedly allowed';
  exception when insufficient_privilege then
    null;
  end;
end $$;
reset role;

rollback;
