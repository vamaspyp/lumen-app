-- VA+LUMEN V0.4 · S1 core: Momento→Ayuda→Retorno

create or replace function gf_core.current_person_id()
returns uuid language sql stable security invoker set search_path=''
as $$ select p.person_id from gf_core.persons p where p.auth_user_id=(select auth.uid()) limit 1 $$;
revoke execute on function gf_core.current_person_id() from public,anon;
grant execute on function gf_core.current_person_id() to authenticated;

create table gf_core.moments(
  moment_id uuid primary key default gen_random_uuid(),
  person_id uuid not null references gf_core.persons(person_id) on delete cascade,
  received_at timestamptz not null default now(), locale text not null, language text not null, surface text not null,
  expression_length integer not null check(expression_length>=0),
  original_retention text not null default 'ephemeral' check(original_retention in('ephemeral','private_ref')),
  status text not null default 'received' check(status in('received','interpreted','clarification_needed','decided','closed')),
  contract_version text not null default 's1.v1', revision integer not null default 1 check(revision>0)
);
create table gf_core.moment_interpretations(
  interpretation_id uuid primary key default gen_random_uuid(), moment_id uuid not null references gf_core.moments(moment_id) on delete cascade,
  person_id uuid not null references gf_core.persons(person_id) on delete cascade, interpreter_version text not null,
  intent_key text, need_keys text[] not null default '{}', confidence numeric(4,3) not null check(confidence between 0 and 1),
  uncertainty_key text, requires_clarification boolean not null default false,
  safety_state text not null check(safety_state in('clear','caution','blocked')), features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table gf_core.providers(
  provider_id uuid primary key default gen_random_uuid(), provider_code text not null unique, display_name text not null,
  provider_kind text not null, provenance jsonb not null default '{}'::jsonb, rights jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), revision integer not null default 1 check(revision>0)
);
create table gf_core.help_possibilities(
  help_id uuid primary key default gen_random_uuid(), canonical_code text not null unique, help_type text not null,
  provider_id uuid references gf_core.providers(provider_id), lifecycle text not null check(lifecycle in('candidate','review','active_limited','active','restricted','retired')),
  current_version integer not null default 1 check(current_version>0), risk_class text not null default 'low' check(risk_class in('low','moderate','high')),
  evidence_class text not null default 'practice_based', conflict_note text, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), revision integer not null default 1 check(revision>0)
);
create table gf_core.help_versions(
  help_version_id uuid primary key default gen_random_uuid(), help_id uuid not null references gf_core.help_possibilities(help_id) on delete cascade,
  version integer not null check(version>0), mechanism_key text not null, detail jsonb not null default '{}'::jsonb,
  duration_minutes integer, energy text check(energy is null or energy in('very_low','low','medium','high')),
  accessibility jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(help_id,version)
);
create table gf_core.help_localizations(
  localization_id uuid primary key default gen_random_uuid(), help_version_id uuid not null references gf_core.help_versions(help_version_id) on delete cascade,
  locale text not null, title text not null, summary text not null, content_payload jsonb not null default '{}'::jsonb,
  cultural_scope text[] not null default '{}', provenance jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
  unique(help_version_id,locale)
);
create table gf_core.coverage_cells(
  coverage_id uuid primary key default gen_random_uuid(), help_id uuid not null references gf_core.help_possibilities(help_id) on delete cascade,
  contract_version text not null default 'coverage.v1', need_key text not null, intent_key text,
  status text not null check(status in('covered','partial','restricted','not_covered')), locale_pattern text not null default '*',
  priority_hint smallint not null default 50 check(priority_hint between 1 and 100), reason_key text, created_at timestamptz not null default now()
);

create table gf_core.accompaniment_episodes(
  episode_id uuid primary key default gen_random_uuid(), person_id uuid not null references gf_core.persons(person_id) on delete cascade,
  moment_id uuid not null references gf_core.moments(moment_id) on delete cascade,
  status text not null check(status in('clarification_needed','proposed','selected','rejected','no_match','completed')),
  started_at timestamptz not null default now(), completed_at timestamptz, contract_version text not null default 's1.v1'
);
create table gf_core.decision_runs(
  decision_run_id uuid primary key default gen_random_uuid(), episode_id uuid not null references gf_core.accompaniment_episodes(episode_id) on delete cascade,
  person_id uuid not null references gf_core.persons(person_id) on delete cascade, policy_version text not null, interpreter_version text not null,
  coverage_version text not null, safety_state text not null, coverage_state text not null check(coverage_state in('covered','partial','restricted','not_covered')),
  eligible_count integer not null default 0 check(eligible_count>=0), decision_reason_key text, created_at timestamptz not null default now()
);
create table gf_core.decision_candidates(
  decision_candidate_id uuid primary key default gen_random_uuid(), decision_run_id uuid not null references gf_core.decision_runs(decision_run_id) on delete cascade,
  person_id uuid not null references gf_core.persons(person_id) on delete cascade, help_id uuid not null references gf_core.help_possibilities(help_id),
  help_version_id uuid not null references gf_core.help_versions(help_version_id), eligibility_status text not null check(eligibility_status in('eligible','filtered')),
  reason_key text, priority_hint smallint not null, created_at timestamptz not null default now(), unique(decision_run_id,help_id)
);
create table gf_core.candidate_exposures(
  exposure_id uuid primary key default gen_random_uuid(), decision_run_id uuid not null references gf_core.decision_runs(decision_run_id) on delete cascade,
  person_id uuid not null references gf_core.persons(person_id) on delete cascade, help_id uuid not null references gf_core.help_possibilities(help_id),
  help_version_id uuid not null references gf_core.help_versions(help_version_id), display_rank smallint not null check(display_rank>0),
  created_at timestamptz not null default now(), unique(decision_run_id,display_rank)
);
create table gf_core.help_selections(
  selection_id uuid primary key default gen_random_uuid(), episode_id uuid not null references gf_core.accompaniment_episodes(episode_id) on delete cascade,
  person_id uuid not null references gf_core.persons(person_id) on delete cascade, help_id uuid not null references gf_core.help_possibilities(help_id),
  action text not null check(action in('selected','rejected')), created_at timestamptz not null default now()
);
create table gf_core.outcomes_feedback(
  outcome_id uuid primary key default gen_random_uuid(), episode_id uuid not null references gf_core.accompaniment_episodes(episode_id) on delete cascade,
  person_id uuid not null references gf_core.persons(person_id) on delete cascade, help_id uuid not null references gf_core.help_possibilities(help_id),
  effect text not null check(effect in('helped','not_helped','unsure')), applied boolean, created_at timestamptz not null default now()
);
create table gf_core.no_match_events(
  no_match_id uuid primary key default gen_random_uuid(), episode_id uuid not null references gf_core.accompaniment_episodes(episode_id) on delete cascade,
  person_id uuid not null references gf_core.persons(person_id) on delete cascade, reason_code text not null,
  coverage_state text not null check(coverage_state in('restricted','not_covered')), coverage_gap boolean not null default false,
  created_at timestamptz not null default now()
);

alter table gf_core.moments enable row level security; alter table gf_core.moments force row level security;
alter table gf_core.moment_interpretations enable row level security; alter table gf_core.moment_interpretations force row level security;
alter table gf_core.accompaniment_episodes enable row level security; alter table gf_core.accompaniment_episodes force row level security;
alter table gf_core.decision_runs enable row level security; alter table gf_core.decision_runs force row level security;
alter table gf_core.decision_candidates enable row level security; alter table gf_core.decision_candidates force row level security;
alter table gf_core.candidate_exposures enable row level security; alter table gf_core.candidate_exposures force row level security;
alter table gf_core.help_selections enable row level security; alter table gf_core.help_selections force row level security;
alter table gf_core.outcomes_feedback enable row level security; alter table gf_core.outcomes_feedback force row level security;
alter table gf_core.no_match_events enable row level security; alter table gf_core.no_match_events force row level security;
grant select,insert,update on gf_core.moments,gf_core.moment_interpretations,gf_core.accompaniment_episodes,gf_core.decision_runs,gf_core.decision_candidates,gf_core.candidate_exposures,gf_core.help_selections,gf_core.outcomes_feedback,gf_core.no_match_events to authenticated;
create policy moments_self_all on gf_core.moments for all to authenticated using(person_id=(select gf_core.current_person_id())) with check(person_id=(select gf_core.current_person_id()));
create policy interpretations_self_all on gf_core.moment_interpretations for all to authenticated using(person_id=(select gf_core.current_person_id())) with check(person_id=(select gf_core.current_person_id()));
create policy episodes_self_all on gf_core.accompaniment_episodes for all to authenticated using(person_id=(select gf_core.current_person_id())) with check(person_id=(select gf_core.current_person_id()));
create policy decision_runs_self_all on gf_core.decision_runs for all to authenticated using(person_id=(select gf_core.current_person_id())) with check(person_id=(select gf_core.current_person_id()));
create policy decision_candidates_self_all on gf_core.decision_candidates for all to authenticated using(person_id=(select gf_core.current_person_id())) with check(person_id=(select gf_core.current_person_id()));
create policy exposures_self_all on gf_core.candidate_exposures for all to authenticated using(person_id=(select gf_core.current_person_id())) with check(person_id=(select gf_core.current_person_id()));
create policy selections_self_all on gf_core.help_selections for all to authenticated using(person_id=(select gf_core.current_person_id())) with check(person_id=(select gf_core.current_person_id()));
create policy outcomes_self_all on gf_core.outcomes_feedback for all to authenticated using(person_id=(select gf_core.current_person_id())) with check(person_id=(select gf_core.current_person_id()));
create policy no_match_self_all on gf_core.no_match_events for all to authenticated using(person_id=(select gf_core.current_person_id())) with check(person_id=(select gf_core.current_person_id()));

alter table gf_core.providers enable row level security; alter table gf_core.providers force row level security;
alter table gf_core.help_possibilities enable row level security; alter table gf_core.help_possibilities force row level security;
alter table gf_core.help_versions enable row level security; alter table gf_core.help_versions force row level security;
alter table gf_core.help_localizations enable row level security; alter table gf_core.help_localizations force row level security;
alter table gf_core.coverage_cells enable row level security; alter table gf_core.coverage_cells force row level security;
grant select on gf_core.providers,gf_core.help_possibilities,gf_core.help_versions,gf_core.help_localizations,gf_core.coverage_cells to authenticated;
create policy source_providers_read on gf_core.providers for select to authenticated using(true);
create policy source_help_read on gf_core.help_possibilities for select to authenticated using(lifecycle in('active_limited','active'));
create policy source_versions_read on gf_core.help_versions for select to authenticated using(exists(select 1 from gf_core.help_possibilities hp where hp.help_id=help_versions.help_id and hp.lifecycle in('active_limited','active')));
create policy source_localizations_read on gf_core.help_localizations for select to authenticated using(exists(select 1 from gf_core.help_versions hv join gf_core.help_possibilities hp on hp.help_id=hv.help_id where hv.help_version_id=help_localizations.help_version_id and hp.lifecycle in('active_limited','active')));
create policy source_coverage_read on gf_core.coverage_cells for select to authenticated using(exists(select 1 from gf_core.help_possibilities hp where hp.help_id=coverage_cells.help_id and hp.lifecycle in('active_limited','active')));

create or replace function gf_core.s1_interpret(p_expression text)
returns jsonb language plpgsql immutable security invoker set search_path=''
as $$
declare v text:=lower(trim(coalesce(p_expression,''))); v_intent text; v_needs text[]:='{}'; v_conf numeric(4,3):=0.25; v_clarify boolean:=false;
begin
 if char_length(v)<3 then return jsonb_build_object('intent_key',null,'need_keys',jsonb_build_array(),'confidence',0.1,'uncertainty_key','too_little_context','requires_clarification',true,'safety_state','clear','features','{}'::jsonb); end if;
 if v ~ '(suicid|matarme|quiero morir|hacerme daño|hacerme dano|self[- ]?harm|kill myself|overdose|sobredosis|violencia grave|abuso grave)' then return jsonb_build_object('intent_key','seek_support','need_keys',jsonb_build_array('human_support'),'confidence',0.95,'uncertainty_key',null,'requires_clarification',false,'safety_state','blocked','features',jsonb_build_object('risk_pattern_detected',true)); end if;
 if v ~ '(no sé qué hacer|no se que hacer|decidir|decisión|decision|confund|ordenar.*idea|claridad|qué quiero|que quiero)' then v_intent:='gain_clarity';v_needs:=array['clarity'];v_conf:=0.82;
 elsif v ~ '(bloquead|trabado|procrast|empezar|arrancar|primer paso|pequeño paso|pequeno paso)' then v_intent:='move_forward';v_needs:=array['agency'];v_conf:=0.80;
 elsif v ~ '(saturad|abrumad|agotad|cansad|necesito parar|bajar un cambio|demasiado)' then v_intent:='reduce_load';v_needs:=array['pause','clarity'];v_conf:=0.78;
 elsif v ~ '(sentido|propósito|proposito|qué importa|que importa|valores|dirección|direccion)' then v_intent:='reconnect_meaning';v_needs:=array['meaning','clarity'];v_conf:=0.78;
 elsif v ~ '(solo|sola|acompañ|acompan|hablar con alguien|necesito apoyo|conectar con alguien)' then v_intent:='seek_connection';v_needs:=array['connection'];v_conf:=0.76;
 elsif v ~ '(agradec|valorar|apreciar|algo bueno|reconocer lo bueno)' then v_intent:='notice_value';v_needs:=array['appreciation'];v_conf:=0.78;
 else v_intent:='open_expression';v_needs:='{}';v_conf:=0.30; end if;
 return jsonb_build_object('intent_key',v_intent,'need_keys',to_jsonb(v_needs),'confidence',v_conf,'uncertainty_key',case when v_conf<0.5 then 'insufficient_coverage_signal' else null end,'requires_clarification',v_clarify,'safety_state','clear','features',jsonb_build_object('fallback','rules.v1'));
end $$;
revoke execute on function gf_core.s1_interpret(text) from public,anon; grant execute on function gf_core.s1_interpret(text) to authenticated;

create or replace function gf_ledger.emit_s1_event()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_trace uuid;v_event_id uuid;v_type text;v_second text;v_person uuid;v_agg text;v_agg_id uuid;v_payload jsonb:='{}'::jsonb;v_second_payload jsonb:='{}'::jsonb;
begin
 begin v_trace:=nullif(current_setting('app.trace_id',true),'')::uuid; exception when others then v_trace:=null; end; v_trace:=coalesce(v_trace,gen_random_uuid());
 if tg_table_name='moments' then v_type:='MomentReceived';v_person:=new.person_id;v_agg:='moment';v_agg_id:=new.moment_id;v_payload:=jsonb_build_object('locale',new.locale,'language',new.language,'surface',new.surface,'expression_length',new.expression_length,'original_retention',new.original_retention);
 elsif tg_table_name='moment_interpretations' then v_type:='MomentInterpreted';v_person:=new.person_id;v_agg:='moment';v_agg_id:=new.moment_id;v_payload:=jsonb_build_object('interpreter_version',new.interpreter_version,'intent_key',new.intent_key,'need_keys',new.need_keys,'confidence',new.confidence,'requires_clarification',new.requires_clarification,'safety_state',new.safety_state);
 elsif tg_table_name='decision_runs' then v_type:='CandidateSetGenerated';v_person:=new.person_id;v_agg:='decision_run';v_agg_id:=new.decision_run_id;v_payload:=jsonb_build_object('policy_version',new.policy_version,'coverage_version',new.coverage_version,'safety_state',new.safety_state,'coverage_state',new.coverage_state,'eligible_count',new.eligible_count);
 elsif tg_table_name='candidate_exposures' then v_type:='CandidateExposed';v_person:=new.person_id;v_agg:='decision_run';v_agg_id:=new.decision_run_id;v_payload:=jsonb_build_object('help_id',new.help_id,'help_version_id',new.help_version_id,'display_rank',new.display_rank);
 elsif tg_table_name='help_selections' then v_type:=case when new.action='selected' then 'HelpSelected' else 'HelpRejected' end;v_person:=new.person_id;v_agg:='episode';v_agg_id:=new.episode_id;v_payload:=jsonb_build_object('help_id',new.help_id,'action',new.action); if new.action='selected' then v_second:='HelpStarted';v_second_payload:=jsonb_build_object('help_id',new.help_id);end if;
 elsif tg_table_name='outcomes_feedback' then v_type:='OutcomeReported';v_person:=new.person_id;v_agg:='episode';v_agg_id:=new.episode_id;v_payload:=jsonb_build_object('help_id',new.help_id,'effect',new.effect,'applied',new.applied);v_second:='HelpCompleted';v_second_payload:=jsonb_build_object('help_id',new.help_id);
 elsif tg_table_name='no_match_events' then v_type:='NoMatchDeclared';v_person:=new.person_id;v_agg:='episode';v_agg_id:=new.episode_id;v_payload:=jsonb_build_object('reason_code',new.reason_code,'coverage_state',new.coverage_state,'coverage_gap',new.coverage_gap);if new.coverage_gap then v_second:='CoverageGapDetected';v_second_payload:=jsonb_build_object('reason_code',new.reason_code,'coverage_state',new.coverage_state);end if;
 else raise exception 'unsupported S1 audited table %',tg_table_name; end if;
 v_event_id:=gen_random_uuid(); insert into gf_ledger.domain_events(event_id,event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance) values(v_event_id,v_type,v_agg,v_agg_id,'person',auth.uid()::text,v_person,v_trace,'s1.v1',v_payload,jsonb_build_object('source','postgres_trigger','slice','s1')); insert into gf_ledger.outbox(event_type,payload,idempotency_key) values(v_type,jsonb_build_object('event_id',v_event_id,'trace_id',v_trace,'aggregate_id',v_agg_id,'contract_version','s1.v1'),'ledger:'||v_event_id::text);
 if v_second is not null then v_event_id:=gen_random_uuid();insert into gf_ledger.domain_events(event_id,event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance) values(v_event_id,v_second,v_agg,v_agg_id,'person',auth.uid()::text,v_person,v_trace,'s1.v1',v_second_payload,jsonb_build_object('source','postgres_trigger','slice','s1'));insert into gf_ledger.outbox(event_type,payload,idempotency_key) values(v_second,jsonb_build_object('event_id',v_event_id,'trace_id',v_trace,'aggregate_id',v_agg_id,'contract_version','s1.v1'),'ledger:'||v_event_id::text);end if;
 return new;
end $$;
revoke all on function gf_ledger.emit_s1_event() from public,anon,authenticated;
create trigger moments_emit_s1_event after insert on gf_core.moments for each row execute function gf_ledger.emit_s1_event();
create trigger interpretations_emit_s1_event after insert on gf_core.moment_interpretations for each row execute function gf_ledger.emit_s1_event();
create trigger decision_runs_emit_s1_event after insert on gf_core.decision_runs for each row execute function gf_ledger.emit_s1_event();
create trigger exposures_emit_s1_event after insert on gf_core.candidate_exposures for each row execute function gf_ledger.emit_s1_event();
create trigger selections_emit_s1_event after insert on gf_core.help_selections for each row execute function gf_ledger.emit_s1_event();
create trigger outcomes_emit_s1_event after insert on gf_core.outcomes_feedback for each row execute function gf_ledger.emit_s1_event();
create trigger no_match_emit_s1_event after insert on gf_core.no_match_events for each row execute function gf_ledger.emit_s1_event();

create index moments_person_idx on gf_core.moments(person_id,received_at desc);
create index interpretations_person_moment_idx on gf_core.moment_interpretations(person_id,moment_id);
create index episodes_person_idx on gf_core.accompaniment_episodes(person_id,started_at desc);
create index decision_runs_person_episode_idx on gf_core.decision_runs(person_id,episode_id);
create index candidates_run_idx on gf_core.decision_candidates(decision_run_id,priority_hint);
create index exposures_run_idx on gf_core.candidate_exposures(decision_run_id,display_rank);
create index selections_person_episode_idx on gf_core.help_selections(person_id,episode_id);
create index outcomes_person_episode_idx on gf_core.outcomes_feedback(person_id,episode_id);
create index coverage_need_idx on gf_core.coverage_cells(need_key,status,priority_hint);

comment on table gf_core.moments is 'M2 LIFE owner · Moment metadata; raw expression is ephemeral by default.';
comment on table gf_core.moment_interpretations is 'M2 LIFE owner · versioned/refutable interpretation.';
comment on table gf_core.help_possibilities is 'M4 SOURCE owner · typed possibility, lifecycle/provenance.';
comment on table gf_core.accompaniment_episodes is 'M3 ACCOMPANIMENT owner · Moment→Help→Return episode.';