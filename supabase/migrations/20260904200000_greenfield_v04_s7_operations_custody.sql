-- VA+LUMEN V0.4 · S7 minimal Custody + Operations integration

create table gf_private.safety_incidents(
  incident_id uuid primary key default gen_random_uuid(), person_pseudonym uuid,
  source_event_id uuid, severity text not null default 'high' check(severity in('medium','high','critical')),
  route_key text, status text not null default 'open' check(status in('open','reviewed','closed')),
  created_at timestamptz not null default now(), reviewed_at timestamptz, reviewed_by text
);
create table gf_private.external_observations(
  observation_id uuid primary key default gen_random_uuid(), source_kind text not null,
  observation_type text not null, payload jsonb not null default '{}'::jsonb,
  status text not null default 'received' check(status in('received','reviewed','integrated','dismissed')),
  created_at timestamptz not null default now(), reviewed_at timestamptz
);
create table gf_private.job_runs(
  job_run_id uuid primary key default gen_random_uuid(), job_key text not null, status text not null check(status in('started','success','failure')),
  started_at timestamptz not null default now(), finished_at timestamptz, metrics jsonb not null default '{}'::jsonb, error_code text
);
create table gf_private.cost_events(
  cost_event_id uuid primary key default gen_random_uuid(), cost_key text not null, amount numeric(14,4) not null check(amount>=0),
  currency text not null default 'USD', units numeric(14,4), occurred_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb
);
create table gf_private.provider_runtime_status(
  provider_key text primary key, status text not null check(status in('unknown','ready','degraded','down')),
  checked_at timestamptz not null default now(), detail jsonb not null default '{}'::jsonb
);
revoke all on gf_private.safety_incidents,gf_private.external_observations,gf_private.job_runs,gf_private.cost_events,gf_private.provider_runtime_status from public,anon,authenticated;

create or replace function gf_private.capture_safety_incident()
returns trigger language plpgsql security definer set search_path=''
as $$ begin
 if new.event_type='SafetyRouteTriggered' then
   insert into gf_private.safety_incidents(person_pseudonym,source_event_id,severity,route_key)
   values(new.person_pseudonym,new.event_id,'high',new.payload->>'route');
 end if;
 return new;
end $$;
revoke execute on function gf_private.capture_safety_incident() from public,anon,authenticated;
create trigger ledger_capture_safety after insert on gf_ledger.domain_events for each row execute function gf_private.capture_safety_incident();

create or replace function gf_private.record_external_observation(p_source_kind text,p_observation_type text,p_payload jsonb)
returns uuid language plpgsql security definer set search_path=''
as $$ declare v_id uuid; begin
 insert into gf_private.external_observations(source_kind,observation_type,payload) values(trim(p_source_kind),trim(p_observation_type),coalesce(p_payload,'{}'::jsonb)) returning observation_id into v_id;
 insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,trace_id,contract_version,payload,provenance)
 values('ExternalObservationReceived','external_observation',v_id,'operator','operations',gen_random_uuid(),'s7.v1',jsonb_build_object('source_kind',p_source_kind,'observation_type',p_observation_type),'{}'::jsonb);
 return v_id;
end $$;
revoke execute on function gf_private.record_external_observation(text,text,jsonb) from public,anon,authenticated;

create or replace function gf_private.record_job_run(p_job_key text,p_status text,p_metrics jsonb,p_error_code text default null)
returns uuid language plpgsql security definer set search_path=''
as $$ declare v_id uuid;v_status text:=lower(trim(p_status)); begin
 if v_status not in('started','success','failure') then raise exception 'invalid job status'; end if;
 insert into gf_private.job_runs(job_key,status,finished_at,metrics,error_code) values(trim(p_job_key),v_status,case when v_status='started' then null else now() end,coalesce(p_metrics,'{}'::jsonb),p_error_code) returning job_run_id into v_id;
 return v_id;
end $$;
revoke execute on function gf_private.record_job_run(text,text,jsonb,text) from public,anon,authenticated;

create or replace function gf_private.record_cost_event(p_cost_key text,p_amount numeric,p_currency text,p_units numeric,p_metadata jsonb)
returns uuid language plpgsql security definer set search_path=''
as $$ declare v_id uuid; begin
 insert into gf_private.cost_events(cost_key,amount,currency,units,metadata) values(trim(p_cost_key),p_amount,upper(trim(coalesce(p_currency,'USD'))),p_units,coalesce(p_metadata,'{}'::jsonb)) returning cost_event_id into v_id;
 return v_id;
end $$;
revoke execute on function gf_private.record_cost_event(text,numeric,text,numeric,jsonb) from public,anon,authenticated;

create or replace function gf_private.set_provider_runtime_status(p_provider_key text,p_status text,p_detail jsonb)
returns void language plpgsql security definer set search_path=''
as $$ declare v_status text:=lower(trim(p_status)); begin
 if v_status not in('unknown','ready','degraded','down') then raise exception 'invalid provider status'; end if;
 insert into gf_private.provider_runtime_status(provider_key,status,detail) values(trim(p_provider_key),v_status,coalesce(p_detail,'{}'::jsonb))
 on conflict(provider_key) do update set status=excluded.status,checked_at=now(),detail=excluded.detail;
end $$;
revoke execute on function gf_private.set_provider_runtime_status(text,text,jsonb) from public,anon,authenticated;

create or replace function public.lumen_embryo_health()
returns jsonb language plpgsql stable security definer set search_path=''
as $$ declare v_source integer;v_coverage integer;v_types integer;v_policy integer;v_provider_ready integer; begin
 select count(*) into v_source from gf_core.help_possibilities where lifecycle in('active_limited','active');
 select count(*) into v_coverage from gf_core.coverage_cells where status in('covered','partial');
 select count(distinct help_type) into v_types from gf_core.help_possibilities where lifecycle in('active_limited','active');
 select version into v_policy from gf_private.runtime_policies where policy_key='source_discovery';
 select count(*) into v_provider_ready from gf_private.provider_runtime_status where status='ready';
 return jsonb_build_object('state',case when v_source>=16 and v_coverage>=18 then 'operational' else 'forming' end,'slices',jsonb_build_object('s0','closed','s1','closed','s2','closed','s3','closed','s4','closed','s5','closed','s6','closed','s7','integrating'),'source',jsonb_build_object('active_possibilities',v_source,'coverage_cells',v_coverage,'semantic_types',v_types),'evolution',jsonb_build_object('source_policy_version',coalesce(v_policy,1)),'operations',jsonb_build_object('providers_ready',v_provider_ready),'prelaunch_reset_required',true);
end $$;
revoke execute on function public.lumen_embryo_health() from public;
grant execute on function public.lumen_embryo_health() to anon,authenticated;
