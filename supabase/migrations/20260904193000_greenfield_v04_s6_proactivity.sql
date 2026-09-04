-- VA+LUMEN V0.4 · S6 consented proactivity

create table gf_core.proactivity_settings(
  person_id uuid primary key references gf_core.persons(person_id) on delete cascade,
  quiet_start_hour smallint not null default 22 check(quiet_start_hour between 0 and 23),
  quiet_end_hour smallint not null default 8 check(quiet_end_hour between 0 and 23),
  timezone text not null default 'America/Argentina/Buenos_Aires',
  custody_blocked boolean not null default false, custody_reason_key text,
  updated_at timestamptz not null default now()
);
create table gf_core.followups(
  followup_id uuid primary key default gen_random_uuid(), person_id uuid not null references gf_core.persons(person_id) on delete cascade,
  reason_code text not null check(reason_code in('trajectory_checkin','practice_return','circle_return','self_chosen')),
  related_trajectory_id uuid references gf_core.trajectories(trajectory_id) on delete set null,
  related_help_id uuid references gf_core.help_possibilities(help_id) on delete set null,
  due_at timestamptz not null, channel text not null default 'in_app' check(channel='in_app'),
  status text not null default 'scheduled' check(status in('scheduled','due','cancelled','completed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), cancelled_at timestamptz
);
alter table gf_core.proactivity_settings enable row level security; alter table gf_core.proactivity_settings force row level security;
alter table gf_core.followups enable row level security; alter table gf_core.followups force row level security;
grant select on gf_core.proactivity_settings,gf_core.followups to authenticated;
create policy proactivity_settings_self_select on gf_core.proactivity_settings for select to authenticated using(person_id=(select gf_core.current_person_id()));
create policy followups_self_select on gf_core.followups for select to authenticated using(person_id=(select gf_core.current_person_id()));
create index followups_due_idx on gf_core.followups(status,due_at);
create index followups_person_idx on gf_core.followups(person_id,status,due_at);

create or replace function public.lumen_s6_set_proactivity(p_enabled boolean,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid()); begin
 if v_uid is null then raise exception 'authentication required'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then raise exception 'person unavailable'; end if;
 insert into gf_core.privacy_preferences(person_id,proactive_allowed) values(v_person,p_enabled)
 on conflict(person_id) do update set proactive_allowed=excluded.proactive_allowed,updated_at=now(),revision=gf_core.privacy_preferences.revision+1;
 insert into gf_core.proactivity_settings(person_id) values(v_person) on conflict(person_id) do nothing;
 insert into gf_core.consent_grants(person_id,scope,granted,granted_at,revoked_at,terms_version)
 values(v_person,'proactivity',p_enabled,now(),case when p_enabled then null else now() end,'proactivity.v1');
 if not p_enabled then update gf_core.followups set status='cancelled',cancelled_at=now(),updated_at=now() where person_id=v_person and status in('scheduled','due'); end if;
 perform gf_private.emit_person_event('ConsentChanged','privacy',v_person,v_person,v_trace,'s6.v1',jsonb_build_object('scope','proactivity','granted',p_enabled));
 return jsonb_build_object('proactive_allowed',p_enabled,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s6_set_quiet_hours(p_start_hour integer,p_end_hour integer,p_timezone text,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid()); begin
 if v_uid is null then raise exception 'authentication required'; end if;
 if p_start_hour not between 0 and 23 or p_end_hour not between 0 and 23 or trim(coalesce(p_timezone,''))='' then raise exception 'invalid quiet hours'; end if;
 perform now() at time zone p_timezone;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 insert into gf_core.proactivity_settings(person_id,quiet_start_hour,quiet_end_hour,timezone) values(v_person,p_start_hour,p_end_hour,p_timezone)
 on conflict(person_id) do update set quiet_start_hour=excluded.quiet_start_hour,quiet_end_hour=excluded.quiet_end_hour,timezone=excluded.timezone,updated_at=now();
 perform gf_private.emit_person_event('ProactivityQuietHoursChanged','proactivity_settings',v_person,v_person,v_trace,'s6.v1',jsonb_build_object('start_hour',p_start_hour,'end_hour',p_end_hour,'timezone',p_timezone));
 return jsonb_build_object('quiet_start_hour',p_start_hour,'quiet_end_hour',p_end_hour,'timezone',p_timezone,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s6_schedule_followup(p_reason_code text,p_due_at timestamptz,p_trajectory_id uuid,p_help_id uuid,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_followup uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_reason text:=lower(trim(p_reason_code)); begin
 if v_uid is null then raise exception 'authentication required'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if not coalesce((select proactive_allowed from gf_core.privacy_preferences where person_id=v_person),false) then raise exception 'proactivity consent required' using errcode='42501'; end if;
 if coalesce((select custody_blocked from gf_core.proactivity_settings where person_id=v_person),false) then raise exception 'proactivity blocked by custody' using errcode='42501'; end if;
 if v_reason not in('trajectory_checkin','practice_return','circle_return','self_chosen') then raise exception 'invalid reason'; end if;
 if p_due_at<=now() or p_due_at>now()+interval '90 days' then raise exception 'invalid due time'; end if;
 if p_trajectory_id is not null and not exists(select 1 from gf_core.trajectories where trajectory_id=p_trajectory_id and person_id=v_person) then raise exception 'trajectory unavailable'; end if;
 if p_help_id is not null and not exists(select 1 from gf_core.help_possibilities where help_id=p_help_id and lifecycle in('active_limited','active')) then raise exception 'help unavailable'; end if;
 insert into gf_core.followups(person_id,reason_code,related_trajectory_id,related_help_id,due_at) values(v_person,v_reason,p_trajectory_id,p_help_id,p_due_at) returning followup_id into v_followup;
 perform gf_private.emit_person_event('ProactiveFollowupScheduled','followup',v_followup,v_person,v_trace,'s6.v1',jsonb_build_object('reason_code',v_reason,'due_at',p_due_at,'channel','in_app'));
 insert into gf_ledger.outbox(event_type,payload,idempotency_key) values('ProactiveFollowupScheduled',jsonb_build_object('followup_id',v_followup,'due_at',p_due_at), 'followup:schedule:'||v_followup::text) on conflict(idempotency_key) do nothing;
 return jsonb_build_object('followup_id',v_followup,'reason_code',v_reason,'due_at',p_due_at,'channel','in_app','trace_id',v_trace);
end $$;

create or replace function public.lumen_s6_cancel_followup(p_followup_id uuid,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid()); begin
 if v_uid is null then raise exception 'authentication required'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 update gf_core.followups set status='cancelled',cancelled_at=now(),updated_at=now() where followup_id=p_followup_id and person_id=v_person and status in('scheduled','due');
 if not found then raise exception 'followup unavailable'; end if;
 perform gf_private.emit_person_event('ProactiveFollowupCancelled','followup',p_followup_id,v_person,v_trace,'s6.v1','{}'::jsonb);
 return jsonb_build_object('followup_id',p_followup_id,'cancelled',true,'trace_id',v_trace);
end $$;

create or replace function gf_private.set_proactivity_custody_block(p_person_id uuid,p_blocked boolean,p_reason_key text,p_actor text)
returns void language plpgsql security definer set search_path=''
as $$ begin
 insert into gf_core.proactivity_settings(person_id,custody_blocked,custody_reason_key) values(p_person_id,p_blocked,p_reason_key)
 on conflict(person_id) do update set custody_blocked=excluded.custody_blocked,custody_reason_key=excluded.custody_reason_key,updated_at=now();
 if p_blocked then update gf_core.followups set status='cancelled',cancelled_at=now(),updated_at=now() where person_id=p_person_id and status in('scheduled','due'); end if;
 insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance)
 values('ProactivityCustodyGateChanged','proactivity_settings',p_person_id,'operator',p_actor,p_person_id,gen_random_uuid(),'s6.v1',jsonb_build_object('blocked',p_blocked,'reason_key',p_reason_key),'{}'::jsonb);
end $$;
revoke execute on function gf_private.set_proactivity_custody_block(uuid,boolean,text,text) from public,anon,authenticated;

create or replace function gf_private.process_due_followups(p_limit integer default 100)
returns integer language plpgsql security definer set search_path=''
as $$ declare r record;v_count integer:=0;v_hour integer; begin
 for r in select f.*,s.quiet_start_hour,s.quiet_end_hour,s.timezone,s.custody_blocked,coalesce(pp.proactive_allowed,false) proactive_allowed
   from gf_core.followups f join gf_core.proactivity_settings s on s.person_id=f.person_id join gf_core.privacy_preferences pp on pp.person_id=f.person_id
   where f.status='scheduled' and f.due_at<=now() order by f.due_at for update of f skip locked limit greatest(1,least(coalesce(p_limit,100),500))
 loop
   if not r.proactive_allowed or r.custody_blocked then update gf_core.followups set status='cancelled',cancelled_at=now(),updated_at=now() where followup_id=r.followup_id; continue; end if;
   v_hour:=extract(hour from now() at time zone r.timezone)::integer;
   if (r.quiet_start_hour>r.quiet_end_hour and (v_hour>=r.quiet_start_hour or v_hour<r.quiet_end_hour)) or (r.quiet_start_hour<r.quiet_end_hour and v_hour>=r.quiet_start_hour and v_hour<r.quiet_end_hour) then continue; end if;
   update gf_core.followups set status='due',updated_at=now() where followup_id=r.followup_id;
   insert into gf_ledger.outbox(event_type,payload,idempotency_key) values('ProactiveFollowupDue',jsonb_build_object('followup_id',r.followup_id,'channel','in_app'),'followup:due:'||r.followup_id::text) on conflict(idempotency_key) do nothing;
   insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance)
   values('ProactiveFollowupDue','followup',r.followup_id,'system','proactivity-runner',r.person_id,gen_random_uuid(),'s6.v1',jsonb_build_object('reason_code',r.reason_code,'channel','in_app'),'{}'::jsonb);
   v_count:=v_count+1;
 end loop;
 return v_count;
end $$;
revoke execute on function gf_private.process_due_followups(integer) from public,anon,authenticated;

create or replace function public.lumen_s6_snapshot()
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_allowed boolean:=false;v_settings jsonb;v_followups jsonb; begin
 if v_uid is null then raise exception 'authentication required'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 select coalesce(proactive_allowed,false) into v_allowed from gf_core.privacy_preferences where person_id=v_person;
 select jsonb_build_object('quiet_start_hour',quiet_start_hour,'quiet_end_hour',quiet_end_hour,'timezone',timezone,'custody_blocked',custody_blocked) into v_settings from gf_core.proactivity_settings where person_id=v_person;
 select coalesce(jsonb_agg(jsonb_build_object('followup_id',followup_id,'reason_code',reason_code,'due_at',due_at,'status',status,'channel',channel,'related_trajectory_id',related_trajectory_id,'related_help_id',related_help_id) order by due_at),'[]'::jsonb) into v_followups from gf_core.followups where person_id=v_person and status in('scheduled','due');
 return jsonb_build_object('proactive_allowed',coalesce(v_allowed,false),'settings',coalesce(v_settings,jsonb_build_object('quiet_start_hour',22,'quiet_end_hour',8,'timezone','America/Argentina/Buenos_Aires','custody_blocked',false)),'followups',v_followups);
end $$;

revoke execute on function public.lumen_s6_set_proactivity(boolean,uuid),public.lumen_s6_set_quiet_hours(integer,integer,text,uuid),public.lumen_s6_schedule_followup(text,timestamptz,uuid,uuid,uuid),public.lumen_s6_cancel_followup(uuid,uuid),public.lumen_s6_snapshot() from public,anon;
grant execute on function public.lumen_s6_set_proactivity(boolean,uuid),public.lumen_s6_set_quiet_hours(integer,integer,text,uuid),public.lumen_s6_schedule_followup(text,timestamptz,uuid,uuid,uuid),public.lumen_s6_cancel_followup(uuid,uuid),public.lumen_s6_snapshot() to authenticated;
