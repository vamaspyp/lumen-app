-- VA+LUMEN V0.4 · S1 certification
-- Run against an isolated/pre-real-life database. All synthetic person data is rolled back.
begin;

-- Seed must be intentionally small and limited.
select 1 / case when (select count(*) from gf_core.help_possibilities where lifecycle='active_limited') >= 6 then 1 else 0 end;

-- A. Covered Moment → Help → Selection → Outcome
select set_config('request.jwt.claims',jsonb_build_object('sub','10000000-0000-0000-0000-000000000101','role','authenticated','is_anonymous',false)::text,true);
set local role authenticated;
create temporary table s1_covered as
select public.lumen_s1_accompany_moment('Estoy bloqueado y no sé por dónde empezar','es-AR','es','web','20000000-0000-0000-0000-000000000101'::uuid) scene;
select 1 / case when (select scene->>'scene_id' from s1_covered)='moment.help' then 1 else 0 end;
select 1 / case when (select scene#>>'{coverage,state}' from s1_covered)='covered' then 1 else 0 end;
select public.lumen_s1_select_help(
  (select (scene->>'episode_id')::uuid from s1_covered),
  (select (scene#>>'{semantic_blocks,1,primary,help_id}')::uuid from s1_covered),
  'selected','20000000-0000-0000-0000-000000000102'::uuid
);
select public.lumen_s1_record_outcome(
  (select (scene->>'episode_id')::uuid from s1_covered),
  (select (scene#>>'{semantic_blocks,1,primary,help_id}')::uuid from s1_covered),
  'helped',true,'20000000-0000-0000-0000-000000000103'::uuid
);
select 1 / case when (select count(*) from gf_core.outcomes_feedback where person_id=gf_core.current_person_id())=1 then 1 else 0 end;
reset role;
select 1 / case when (
  select count(*) from gf_ledger.domain_events
  where person_pseudonym=(select person_id from gf_core.persons where auth_user_id='10000000-0000-0000-0000-000000000101'::uuid)
    and contract_version='s1.v1'
)>=8 then 1 else 0 end;

-- B. Unknown domain → honest NO_MATCH + coverage gap
select set_config('request.jwt.claims',jsonb_build_object('sub','10000000-0000-0000-0000-000000000111','role','authenticated','is_anonymous',false)::text,true);
set local role authenticated;
create temporary table s1_nomatch as
select public.lumen_s1_accompany_moment('Estoy pensando en cómo organizar una expedición de paleontología submarina','es-AR','es','web','20000000-0000-0000-0000-000000000111'::uuid) scene;
select 1 / case when (select scene->>'scene_id' from s1_nomatch)='moment.no_match' then 1 else 0 end;
reset role;
select 1 / case when exists(
  select 1 from gf_ledger.domain_events
  where person_pseudonym=(select person_id from gf_core.persons where auth_user_id='10000000-0000-0000-0000-000000000111'::uuid)
    and event_type='CoverageGapDetected' and contract_version='s1.v1'
) then 1 else 0 end;

-- C. Safety boundary → P4 referral, never reclassified as Source gap
select set_config('request.jwt.claims',jsonb_build_object('sub','10000000-0000-0000-0000-000000000121','role','authenticated','is_anonymous',false)::text,true);
set local role authenticated;
create temporary table s1_safety as
select public.lumen_s1_accompany_moment('Quiero matarme','es-AR','es','web','20000000-0000-0000-0000-000000000121'::uuid) scene;
select 1 / case when (select scene->>'scene_id' from s1_safety)='moment.safety_referral' then 1 else 0 end;
select 1 / case when (select scene->>'presence_mode' from s1_safety)='P4' then 1 else 0 end;
reset role;
select 1 / case when not exists(
  select 1 from gf_core.no_match_events
  where person_id=(select person_id from gf_core.persons where auth_user_id='10000000-0000-0000-0000-000000000121'::uuid)
    and coverage_gap
) then 1 else 0 end;

-- D. Cross-user RLS
select set_config('request.jwt.claims',jsonb_build_object('sub','10000000-0000-0000-0000-000000000131','role','authenticated','is_anonymous',false)::text,true);
set local role authenticated;
select public.lumen_s1_accompany_moment('Necesito claridad para decidir','es-AR','es','web','20000000-0000-0000-0000-000000000131'::uuid);
reset role;
create temporary table s1_a as select person_id from gf_core.persons where auth_user_id='10000000-0000-0000-0000-000000000131'::uuid;
grant select on s1_a to authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub','10000000-0000-0000-0000-000000000132','role','authenticated','is_anonymous',false)::text,true);
set local role authenticated;
select public.lumen_bootstrap_person('20000000-0000-0000-0000-000000000132'::uuid);
select 1 / case when (select count(*) from gf_core.moments where person_id=(select person_id from s1_a))=0 then 1 else 0 end;
select 1 / case when (select count(*) from gf_core.accompaniment_episodes where person_id=(select person_id from s1_a))=0 then 1 else 0 end;
select 1 / case when (select count(*) from gf_core.decision_runs where person_id=(select person_id from s1_a))=0 then 1 else 0 end;
select 1 / case when (select count(*) from gf_core.candidate_exposures where person_id=(select person_id from s1_a))=0 then 1 else 0 end;
reset role;

-- E. Privacy: raw Moment text has no storage column and Ledger payload contains only minimized features.
select 1 / case when not exists(
  select 1 from information_schema.columns
  where table_schema='gf_core' and table_name='moments' and column_name in ('expression','raw_text','original_text','content')
) then 1 else 0 end;
select 1 / case when not exists(
  select 1 from gf_ledger.domain_events
  where contract_version='s1.v1' and payload::text ilike '%Quiero matarme%'
) then 1 else 0 end;

rollback;