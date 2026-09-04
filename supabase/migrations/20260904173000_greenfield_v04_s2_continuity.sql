-- VA+LUMEN V0.4 · S2 Sanctuary + Trajectory + Cultivation

create table gf_core.trajectories(
  trajectory_id uuid primary key default gen_random_uuid(),
  person_id uuid not null references gf_core.persons(person_id) on delete cascade,
  faro_text text not null check(char_length(trim(faro_text)) between 1 and 280),
  status text not null default 'active' check(status in('active','paused','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  revision integer not null default 1 check(revision>0)
);
create table gf_core.paths(
  path_id uuid primary key default gen_random_uuid(),
  trajectory_id uuid not null references gf_core.trajectories(trajectory_id) on delete cascade,
  person_id uuid not null references gf_core.persons(person_id) on delete cascade,
  title text not null default 'Camino abierto' check(char_length(title) between 1 and 120),
  status text not null default 'active' check(status in('active','paused','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table gf_core.path_items(
  path_item_id uuid primary key default gen_random_uuid(), path_id uuid not null references gf_core.paths(path_id) on delete cascade,
  person_id uuid not null references gf_core.persons(person_id) on delete cascade,
  help_id uuid references gf_core.help_possibilities(help_id), label text not null check(char_length(label) between 1 and 160),
  position integer not null default 1 check(position>0), status text not null default 'planned' check(status in('planned','done','skipped')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table gf_core.personal_repertoire(
  repertoire_id uuid primary key default gen_random_uuid(), person_id uuid not null references gf_core.persons(person_id) on delete cascade,
  help_id uuid not null references gf_core.help_possibilities(help_id), source_outcome_id uuid references gf_core.outcomes_feedback(outcome_id) on delete set null,
  status text not null default 'active' check(status in('active','retired')), times_reused integer not null default 0 check(times_reused>=0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(person_id,help_id)
);

create table gf_private.sanctuary_entries(
  entry_id uuid primary key default gen_random_uuid(), person_id uuid not null references gf_core.persons(person_id) on delete cascade,
  entry_kind text not null check(entry_kind in('treasure','reflection','note')),
  title text, content_text text not null check(char_length(content_text) between 1 and 4000),
  source_help_id uuid references gf_core.help_possibilities(help_id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
revoke all on gf_private.sanctuary_entries from public,anon,authenticated;

alter table gf_core.trajectories enable row level security; alter table gf_core.trajectories force row level security;
alter table gf_core.paths enable row level security; alter table gf_core.paths force row level security;
alter table gf_core.path_items enable row level security; alter table gf_core.path_items force row level security;
alter table gf_core.personal_repertoire enable row level security; alter table gf_core.personal_repertoire force row level security;
grant select,insert,update,delete on gf_core.trajectories,gf_core.paths,gf_core.path_items,gf_core.personal_repertoire to authenticated;
create policy trajectories_self_all on gf_core.trajectories for all to authenticated using(person_id=(select gf_core.current_person_id())) with check(person_id=(select gf_core.current_person_id()));
create policy paths_self_all on gf_core.paths for all to authenticated using(person_id=(select gf_core.current_person_id())) with check(person_id=(select gf_core.current_person_id()));
create policy path_items_self_all on gf_core.path_items for all to authenticated using(person_id=(select gf_core.current_person_id())) with check(person_id=(select gf_core.current_person_id()));
create policy repertoire_self_all on gf_core.personal_repertoire for all to authenticated using(person_id=(select gf_core.current_person_id())) with check(person_id=(select gf_core.current_person_id()));

create index trajectories_person_idx on gf_core.trajectories(person_id,status);
create index paths_person_idx on gf_core.paths(person_id,trajectory_id);
create index path_items_person_idx on gf_core.path_items(person_id,path_id,position);
create index repertoire_person_idx on gf_core.personal_repertoire(person_id,status);
create index sanctuary_person_idx on gf_private.sanctuary_entries(person_id,created_at desc);

create or replace function gf_private.emit_person_event(p_type text,p_aggregate text,p_aggregate_id uuid,p_person uuid,p_trace uuid,p_contract text,p_payload jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path=''
as $$ declare v_id uuid:=gen_random_uuid(); begin
 insert into gf_ledger.domain_events(event_id,event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance)
 values(v_id,p_type,p_aggregate,p_aggregate_id,'person',p_person::text,p_person,coalesce(p_trace,gen_random_uuid()),p_contract,coalesce(p_payload,'{}'::jsonb),jsonb_build_object('source','greenfield'));
 return v_id; end $$;
revoke execute on function gf_private.emit_person_event(text,text,uuid,uuid,uuid,text,jsonb) from public,anon,authenticated;

create or replace function public.lumen_s2_set_memory(p_enabled boolean,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid()); begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then raise exception 'person unavailable' using errcode='P0002'; end if;
 insert into gf_core.privacy_preferences(person_id,memory_allowed) values(v_person,p_enabled)
 on conflict(person_id) do update set memory_allowed=excluded.memory_allowed,updated_at=now(),revision=gf_core.privacy_preferences.revision+1;
 insert into gf_core.consent_grants(person_id,scope,granted,granted_at,revoked_at,terms_version)
 values(v_person,'memory',p_enabled,now(),case when p_enabled then null else now() end,'memory.v1');
 perform gf_private.emit_person_event('ConsentChanged','privacy',v_person,v_person,v_trace,'s2.v1',jsonb_build_object('scope','memory','granted',p_enabled));
 return jsonb_build_object('memory_allowed',p_enabled,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s2_save_sanctuary(p_entry_kind text,p_title text,p_content text,p_source_help_id uuid,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_entry uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_kind text:=lower(trim(coalesce(p_entry_kind,'')));v_content text:=trim(coalesce(p_content,'')); begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then raise exception 'person unavailable' using errcode='P0002'; end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then raise exception 'memory consent required' using errcode='42501'; end if;
 if v_kind not in('treasure','reflection','note') or char_length(v_content) not between 1 and 4000 then raise exception 'invalid sanctuary entry' using errcode='22023'; end if;
 if p_source_help_id is not null and not exists(select 1 from gf_core.help_possibilities where help_id=p_source_help_id and lifecycle in('active_limited','active')) then raise exception 'help unavailable' using errcode='P0002'; end if;
 insert into gf_private.sanctuary_entries(person_id,entry_kind,title,content_text,source_help_id) values(v_person,v_kind,nullif(trim(p_title),''),v_content,p_source_help_id) returning entry_id into v_entry;
 perform gf_private.emit_person_event('SanctuarySaved','sanctuary_entry',v_entry,v_person,v_trace,'s2.v1',jsonb_build_object('entry_kind',v_kind,'source_help_id',p_source_help_id));
 return jsonb_build_object('entry_id',v_entry,'entry_kind',v_kind,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s2_list_sanctuary()
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_result jsonb; begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then return jsonb_build_array(); end if;
 select coalesce(jsonb_agg(jsonb_build_object('entry_id',s.entry_id,'entry_kind',s.entry_kind,'title',s.title,'content',s.content_text,'source_help_id',s.source_help_id,'created_at',s.created_at) order by s.created_at desc),'[]'::jsonb) into v_result from gf_private.sanctuary_entries s where s.person_id=v_person;
 return v_result;
end $$;

create or replace function public.lumen_s2_delete_sanctuary(p_entry_id uuid,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_kind text; begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 delete from gf_private.sanctuary_entries where entry_id=p_entry_id and person_id=v_person returning entry_kind into v_kind;
 if v_kind is null then raise exception 'entry not found' using errcode='P0002'; end if;
 perform gf_private.emit_person_event('SanctuaryDeleted','sanctuary_entry',p_entry_id,v_person,v_trace,'s2.v1',jsonb_build_object('entry_kind',v_kind));
 return jsonb_build_object('deleted',true,'entry_id',p_entry_id,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s2_create_trajectory(p_faro_text text,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_faro text:=trim(coalesce(p_faro_text,''));v_trajectory uuid;v_path uuid; begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then raise exception 'person unavailable' using errcode='P0002'; end if;
 if char_length(v_faro) not between 1 and 280 then raise exception 'invalid faro' using errcode='22023'; end if;
 insert into gf_core.trajectories(person_id,faro_text) values(v_person,v_faro) returning trajectory_id into v_trajectory;
 insert into gf_core.paths(trajectory_id,person_id) values(v_trajectory,v_person) returning path_id into v_path;
 perform gf_private.emit_person_event('TrajectoryCreated','trajectory',v_trajectory,v_person,v_trace,'s2.v1',jsonb_build_object('status','active'));
 return jsonb_build_object('trajectory_id',v_trajectory,'path_id',v_path,'faro_text',v_faro,'status','active','trace_id',v_trace);
end $$;

create or replace function public.lumen_s2_update_trajectory(p_trajectory_id uuid,p_faro_text text,p_status text,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_faro text:=trim(coalesce(p_faro_text,''));v_status text:=lower(trim(coalesce(p_status,'')));v_event text; begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if char_length(v_faro) not between 1 and 280 or v_status not in('active','paused','closed') then raise exception 'invalid trajectory' using errcode='22023'; end if;
 update gf_core.trajectories set faro_text=v_faro,status=v_status,updated_at=now(),revision=revision+1 where trajectory_id=p_trajectory_id and person_id=v_person;
 if not found then raise exception 'trajectory not found' using errcode='P0002'; end if;
 v_event:=case when v_status='paused' then 'TrajectoryPaused' else 'TrajectoryChanged' end;
 perform gf_private.emit_person_event(v_event,'trajectory',p_trajectory_id,v_person,v_trace,'s2.v1',jsonb_build_object('status',v_status));
 return jsonb_build_object('trajectory_id',p_trajectory_id,'faro_text',v_faro,'status',v_status,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s2_add_repertoire(p_help_id uuid,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_outcome uuid;v_rep uuid; begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 select outcome_id into v_outcome from gf_core.outcomes_feedback where person_id=v_person and help_id=p_help_id and effect='helped' order by created_at desc limit 1;
 if v_outcome is null then raise exception 'a helped outcome is required before integration' using errcode='42501'; end if;
 insert into gf_core.personal_repertoire(person_id,help_id,source_outcome_id) values(v_person,p_help_id,v_outcome)
 on conflict(person_id,help_id) do update set status='active',source_outcome_id=excluded.source_outcome_id,updated_at=now()
 returning repertoire_id into v_rep;
 perform gf_private.emit_person_event('RepertoireIntegrated','repertoire',v_rep,v_person,v_trace,'s2.v1',jsonb_build_object('help_id',p_help_id,'source_outcome_id',v_outcome));
 return jsonb_build_object('repertoire_id',v_rep,'help_id',p_help_id,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s2_add_path_item(p_trajectory_id uuid,p_help_id uuid,p_label text,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_path uuid;v_item uuid;v_pos integer;v_label text:=trim(coalesce(p_label,'')); begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 select path_id into v_path from gf_core.paths where trajectory_id=p_trajectory_id and person_id=v_person and status='active' order by created_at limit 1;
 if v_path is null then raise exception 'active path unavailable' using errcode='P0002'; end if;
 if char_length(v_label) not between 1 and 160 then raise exception 'invalid label' using errcode='22023'; end if;
 if p_help_id is not null and not exists(select 1 from gf_core.help_possibilities where help_id=p_help_id and lifecycle in('active_limited','active')) then raise exception 'help unavailable' using errcode='P0002'; end if;
 select coalesce(max(position),0)+1 into v_pos from gf_core.path_items where path_id=v_path;
 insert into gf_core.path_items(path_id,person_id,help_id,label,position) values(v_path,v_person,p_help_id,v_label,v_pos) returning path_item_id into v_item;
 perform gf_private.emit_person_event('PathItemAdded','path_item',v_item,v_person,v_trace,'s2.v1',jsonb_build_object('trajectory_id',p_trajectory_id,'help_id',p_help_id,'position',v_pos));
 return jsonb_build_object('path_item_id',v_item,'path_id',v_path,'position',v_pos,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s2_snapshot()
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_memory boolean:=false;v_trajectories jsonb;v_repertoire jsonb;v_sanctuary_count integer; begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then return jsonb_build_object('memory_allowed',false,'trajectories','[]'::jsonb,'repertoire','[]'::jsonb,'sanctuary_count',0); end if;
 select coalesce(memory_allowed,false) into v_memory from gf_core.privacy_preferences where person_id=v_person;
 select coalesce(jsonb_agg(jsonb_build_object('trajectory_id',t.trajectory_id,'faro_text',t.faro_text,'status',t.status,'path',coalesce((select jsonb_agg(jsonb_build_object('path_item_id',pi.path_item_id,'help_id',pi.help_id,'label',pi.label,'position',pi.position,'status',pi.status) order by pi.position) from gf_core.path_items pi join gf_core.paths p on p.path_id=pi.path_id where p.trajectory_id=t.trajectory_id),'[]'::jsonb)) order by t.updated_at desc),'[]'::jsonb) into v_trajectories from gf_core.trajectories t where t.person_id=v_person;
 select coalesce(jsonb_agg(jsonb_build_object('repertoire_id',r.repertoire_id,'help_id',r.help_id,'title',hl.title,'summary',hl.summary,'times_reused',r.times_reused) order by r.updated_at desc),'[]'::jsonb) into v_repertoire from gf_core.personal_repertoire r join gf_core.help_possibilities hp on hp.help_id=r.help_id join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version join lateral(select title,summary from gf_core.help_localizations where help_version_id=hv.help_version_id order by case when locale='es-AR' then 0 else 1 end limit 1) hl on true where r.person_id=v_person and r.status='active';
 select count(*) into v_sanctuary_count from gf_private.sanctuary_entries where person_id=v_person;
 return jsonb_build_object('memory_allowed',coalesce(v_memory,false),'trajectories',v_trajectories,'repertoire',v_repertoire,'sanctuary_count',v_sanctuary_count);
end $$;

revoke execute on function public.lumen_s2_set_memory(boolean,uuid),public.lumen_s2_save_sanctuary(text,text,text,uuid,uuid),public.lumen_s2_list_sanctuary(),public.lumen_s2_delete_sanctuary(uuid,uuid),public.lumen_s2_create_trajectory(text,uuid),public.lumen_s2_update_trajectory(uuid,text,text,uuid),public.lumen_s2_add_repertoire(uuid,uuid),public.lumen_s2_add_path_item(uuid,uuid,text,uuid),public.lumen_s2_snapshot() from public,anon;
grant execute on function public.lumen_s2_set_memory(boolean,uuid),public.lumen_s2_save_sanctuary(text,text,text,uuid,uuid),public.lumen_s2_list_sanctuary(),public.lumen_s2_delete_sanctuary(uuid,uuid),public.lumen_s2_create_trajectory(text,uuid),public.lumen_s2_update_trajectory(uuid,text,text,uuid),public.lumen_s2_add_repertoire(uuid,uuid),public.lumen_s2_add_path_item(uuid,uuid,text,uuid),public.lumen_s2_snapshot() to authenticated;
