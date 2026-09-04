-- VA+LUMEN V0.4 · S4 Knowledge + Evolution

create table gf_private.evidence_units(
  evidence_unit_id uuid primary key default gen_random_uuid(), person_pseudonym uuid,
  source_kind text not null, source_id uuid, signal_type text not null, signal_value text,
  context jsonb not null default '{}'::jsonb, learning_eligible boolean not null default true,
  created_at timestamptz not null default now(), contract_version text not null default 's4.v1'
);
create table gf_private.knowledge_claims(
  claim_id uuid primary key default gen_random_uuid(), claim_key text not null unique, statement text not null,
  status text not null default 'hypothesis' check(status in('hypothesis','active','rejected')),
  confidence numeric(5,4) not null default 0 check(confidence between 0 and 1), scope jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table gf_private.claim_evidence(
  claim_id uuid not null references gf_private.knowledge_claims(claim_id) on delete cascade,
  evidence_unit_id uuid not null references gf_private.evidence_units(evidence_unit_id) on delete cascade,
  relation text not null default 'supports' check(relation in('supports','contradicts','context')),
  primary key(claim_id,evidence_unit_id)
);
create table gf_private.policy_versions(
  policy_version_id uuid primary key default gen_random_uuid(), policy_key text not null, version integer not null,
  config jsonb not null, status text not null default 'candidate' check(status in('candidate','active','retired')),
  evidence_summary jsonb not null default '{}'::jsonb, created_by text not null, created_at timestamptz not null default now(),
  unique(policy_key,version)
);
create table gf_private.runtime_policies(
  policy_key text primary key, policy_version_id uuid references gf_private.policy_versions(policy_version_id),
  version integer not null, config jsonb not null, updated_at timestamptz not null default now()
);
create table gf_private.change_executions(
  execution_id uuid primary key default gen_random_uuid(), policy_key text not null,
  from_policy_version_id uuid, to_policy_version_id uuid not null references gf_private.policy_versions(policy_version_id),
  from_version integer, from_config jsonb, executed_by text not null, executed_at timestamptz not null default now(),
  rolled_back_at timestamptz, rollback_by text
);
create table gf_private.rollback_records(
  rollback_id uuid primary key default gen_random_uuid(), execution_id uuid not null references gf_private.change_executions(execution_id),
  restored_version integer, restored_config jsonb, actor text not null, created_at timestamptz not null default now()
);
revoke all on gf_private.evidence_units,gf_private.knowledge_claims,gf_private.claim_evidence,gf_private.policy_versions,gf_private.runtime_policies,gf_private.change_executions,gf_private.rollback_records from public,anon,authenticated;

insert into gf_private.policy_versions(policy_key,version,config,status,evidence_summary,created_by)
values('source_discovery',1,jsonb_build_object('external_boost',0),'active',jsonb_build_object('basis','foundation default'),'system')
on conflict(policy_key,version) do nothing;
insert into gf_private.runtime_policies(policy_key,policy_version_id,version,config)
select policy_key,policy_version_id,version,config from gf_private.policy_versions where policy_key='source_discovery' and version=1
on conflict(policy_key) do nothing;

create or replace function gf_private.capture_outcome_evidence()
returns trigger language plpgsql security definer set search_path=''
as $$ declare v_trace uuid:=gen_random_uuid(); begin
 if coalesce((select evidence_use_allowed from gf_core.privacy_preferences where person_id=new.person_id),false) then
   insert into gf_private.evidence_units(person_pseudonym,source_kind,source_id,signal_type,signal_value,context)
   values(new.person_id,'outcome',new.outcome_id,'help_effect',new.effect,jsonb_build_object('help_id',new.help_id,'applied',new.applied));
   insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance)
   values('EvidenceUnitCaptured','evidence_unit',new.outcome_id,'system','evidence-capture',new.person_id,v_trace,'s4.v1',jsonb_build_object('source_kind','outcome','effect',new.effect,'help_id',new.help_id),'{}'::jsonb);
 end if;
 return new;
end $$;
revoke execute on function gf_private.capture_outcome_evidence() from public,anon,authenticated;
create trigger outcomes_capture_evidence after insert on gf_core.outcomes_feedback for each row execute function gf_private.capture_outcome_evidence();

create or replace function public.lumen_s4_set_evidence_use(p_enabled boolean,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid()); begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then raise exception 'person unavailable' using errcode='P0002'; end if;
 insert into gf_core.privacy_preferences(person_id,evidence_use_allowed) values(v_person,p_enabled)
 on conflict(person_id) do update set evidence_use_allowed=excluded.evidence_use_allowed,updated_at=now(),revision=gf_core.privacy_preferences.revision+1;
 insert into gf_core.consent_grants(person_id,scope,granted,granted_at,revoked_at,terms_version)
 values(v_person,'evidence_use',p_enabled,now(),case when p_enabled then null else now() end,'evidence.v1');
 perform gf_private.emit_person_event('ConsentChanged','privacy',v_person,v_person,v_trace,'s4.v1',jsonb_build_object('scope','evidence_use','granted',p_enabled));
 return jsonb_build_object('evidence_use_allowed',p_enabled,'trace_id',v_trace);
end $$;
revoke execute on function public.lumen_s4_set_evidence_use(boolean,uuid) from public,anon;
grant execute on function public.lumen_s4_set_evidence_use(boolean,uuid) to authenticated;

create or replace function gf_private.create_policy_version(p_policy_key text,p_config jsonb,p_evidence_ids uuid[],p_claim_key text,p_claim_statement text,p_actor text)
returns uuid language plpgsql security definer set search_path=''
as $$ declare v_claim uuid;v_policy uuid;v_version integer;v_e uuid; begin
 if coalesce(array_length(p_evidence_ids,1),0)=0 then raise exception 'evidence required'; end if;
 insert into gf_private.knowledge_claims(claim_key,statement,status,confidence,scope)
 values(p_claim_key,p_claim_statement,'hypothesis',0.5,jsonb_build_object('policy_key',p_policy_key))
 on conflict(claim_key) do update set statement=excluded.statement,updated_at=now() returning claim_id into v_claim;
 foreach v_e in array p_evidence_ids loop
   if not exists(select 1 from gf_private.evidence_units where evidence_unit_id=v_e and learning_eligible) then raise exception 'eligible evidence not found'; end if;
   insert into gf_private.claim_evidence(claim_id,evidence_unit_id) values(v_claim,v_e) on conflict do nothing;
 end loop;
 select coalesce(max(version),0)+1 into v_version from gf_private.policy_versions where policy_key=p_policy_key;
 insert into gf_private.policy_versions(policy_key,version,config,status,evidence_summary,created_by)
 values(p_policy_key,v_version,p_config,'candidate',jsonb_build_object('claim_id',v_claim,'evidence_count',array_length(p_evidence_ids,1)),p_actor) returning policy_version_id into v_policy;
 insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,trace_id,contract_version,payload,provenance)
 values('PolicyVersionProposed','policy_version',v_policy,'operator',p_actor,gen_random_uuid(),'s4.v1',jsonb_build_object('policy_key',p_policy_key,'version',v_version,'evidence_count',array_length(p_evidence_ids,1)),jsonb_build_object('claim_id',v_claim));
 return v_policy;
end $$;
revoke execute on function gf_private.create_policy_version(text,jsonb,uuid[],text,text,text) from public,anon,authenticated;

create or replace function gf_private.activate_policy_version(p_policy_version_id uuid,p_actor text)
returns uuid language plpgsql security definer set search_path=''
as $$ declare r gf_private.policy_versions%rowtype;v_current gf_private.runtime_policies%rowtype;v_execution uuid; begin
 select * into r from gf_private.policy_versions where policy_version_id=p_policy_version_id for update;
 if r.policy_version_id is null or r.status<>'candidate' then raise exception 'candidate policy unavailable'; end if;
 select * into v_current from gf_private.runtime_policies where policy_key=r.policy_key for update;
 insert into gf_private.change_executions(policy_key,from_policy_version_id,to_policy_version_id,from_version,from_config,executed_by)
 values(r.policy_key,v_current.policy_version_id,r.policy_version_id,v_current.version,v_current.config,p_actor) returning execution_id into v_execution;
 update gf_private.policy_versions set status='retired' where policy_key=r.policy_key and status='active';
 update gf_private.policy_versions set status='active' where policy_version_id=r.policy_version_id;
 insert into gf_private.runtime_policies(policy_key,policy_version_id,version,config,updated_at)
 values(r.policy_key,r.policy_version_id,r.version,r.config,now()) on conflict(policy_key) do update set policy_version_id=excluded.policy_version_id,version=excluded.version,config=excluded.config,updated_at=now();
 insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,trace_id,contract_version,payload,provenance)
 values('PolicyVersionActivated','policy_version',r.policy_version_id,'operator',p_actor,gen_random_uuid(),'s4.v1',jsonb_build_object('policy_key',r.policy_key,'version',r.version),'{}'::jsonb);
 return v_execution;
end $$;
revoke execute on function gf_private.activate_policy_version(uuid,text) from public,anon,authenticated;

create or replace function gf_private.rollback_policy_execution(p_execution_id uuid,p_actor text)
returns uuid language plpgsql security definer set search_path=''
as $$ declare r gf_private.change_executions%rowtype;v_rollback uuid; begin
 select * into r from gf_private.change_executions where execution_id=p_execution_id for update;
 if r.execution_id is null or r.rolled_back_at is not null then raise exception 'execution unavailable'; end if;
 update gf_private.runtime_policies set policy_version_id=r.from_policy_version_id,version=coalesce(r.from_version,1),config=coalesce(r.from_config,'{}'::jsonb),updated_at=now() where policy_key=r.policy_key;
 update gf_private.policy_versions set status='retired' where policy_version_id=r.to_policy_version_id;
 if r.from_policy_version_id is not null then update gf_private.policy_versions set status='active' where policy_version_id=r.from_policy_version_id; end if;
 update gf_private.change_executions set rolled_back_at=now(),rollback_by=p_actor where execution_id=p_execution_id;
 insert into gf_private.rollback_records(execution_id,restored_version,restored_config,actor) values(p_execution_id,r.from_version,r.from_config,p_actor) returning rollback_id into v_rollback;
 insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,trace_id,contract_version,payload,provenance)
 values('PolicyRollbackExecuted','change_execution',p_execution_id,'operator',p_actor,gen_random_uuid(),'s4.v1',jsonb_build_object('policy_key',r.policy_key,'restored_version',r.from_version),'{}'::jsonb);
 return v_rollback;
end $$;
revoke execute on function gf_private.rollback_policy_execution(uuid,text) from public,anon,authenticated;

create or replace function public.lumen_source_discover(p_need_key text default null,p_help_type text default null,p_locale text default 'es-AR',p_limit integer default 24)
returns jsonb language plpgsql stable security definer set search_path=''
as $$ declare v_result jsonb;v_limit integer:=greatest(1,least(coalesce(p_limit,24),50));v_external_boost integer:=0; begin
 select coalesce((config->>'external_boost')::integer,0) into v_external_boost from gf_private.runtime_policies where policy_key='source_discovery';
 select coalesce(jsonb_agg(x.item order by x.effective_priority,x.title),'[]'::jsonb) into v_result from (
   select min(cc.priority_hint)+case when pr.provider_kind='internal_curated' then 0 else v_external_boost end effective_priority,hl.title,jsonb_build_object(
     'help_id',hp.help_id,'canonical_code',hp.canonical_code,'help_type',hp.help_type,'lifecycle',hp.lifecycle,'risk_class',hp.risk_class,'evidence_class',hp.evidence_class,
     'title',hl.title,'summary',hl.summary,'content',hl.content_payload,'duration_minutes',hv.duration_minutes,'energy',hv.energy,
     'provider',jsonb_build_object('name',pr.display_name,'kind',pr.provider_kind,'provenance',pr.provenance,'rights',pr.rights),
     'needs',coalesce(jsonb_agg(distinct cc.need_key) filter(where cc.need_key is not null),'[]'::jsonb),'localization_provenance',hl.provenance
   ) item
   from gf_core.help_possibilities hp join gf_core.providers pr on pr.provider_id=hp.provider_id
   join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version
   join lateral(select h.* from gf_core.help_localizations h where h.help_version_id=hv.help_version_id order by case when h.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0 when left(h.locale,2)=left(coalesce(nullif(trim(p_locale),''),'es-AR'),2) then 1 when h.locale='es-AR' then 2 else 3 end limit 1) hl on true
   left join gf_core.coverage_cells cc on cc.help_id=hp.help_id and cc.status in('covered','partial')
   where hp.lifecycle in('active_limited','active') and (p_help_type is null or hp.help_type=p_help_type)
     and (p_need_key is null or exists(select 1 from gf_core.coverage_cells c2 where c2.help_id=hp.help_id and c2.need_key=p_need_key and c2.status in('covered','partial')))
   group by hp.help_id,hp.canonical_code,hp.help_type,hp.lifecycle,hp.risk_class,hp.evidence_class,hv.help_version_id,hv.duration_minutes,hv.energy,hl.title,hl.summary,hl.content_payload,hl.provenance,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
   order by effective_priority,hl.title limit v_limit
 ) x;
 return v_result;
end $$;
