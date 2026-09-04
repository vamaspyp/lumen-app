-- VA+LUMEN V0.4 · S5 Tissue / Circle pilot

create table gf_core.interaction_spaces(
  space_id uuid primary key default gen_random_uuid(), created_by uuid not null references gf_core.persons(person_id) on delete cascade,
  name text not null check(char_length(trim(name)) between 1 and 80), purpose text not null check(char_length(trim(purpose)) between 1 and 240),
  space_kind text not null default 'circle' check(space_kind='circle'), status text not null default 'active' check(status in('active','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table gf_core.memberships(
  membership_id uuid primary key default gen_random_uuid(), space_id uuid not null references gf_core.interaction_spaces(space_id) on delete cascade,
  person_id uuid not null references gf_core.persons(person_id) on delete cascade, role text not null default 'member' check(role in('host','member')),
  status text not null default 'active' check(status in('active','left','removed')), consent_version text not null default 'circle.v1',
  joined_at timestamptz not null default now(), left_at timestamptz, unique(space_id,person_id)
);
create table gf_core.contributions(
  contribution_id uuid primary key default gen_random_uuid(), space_id uuid not null references gf_core.interaction_spaces(space_id) on delete cascade,
  person_id uuid not null references gf_core.persons(person_id) on delete cascade,
  contribution_kind text not null default 'share_help' check(contribution_kind='share_help'), help_id uuid not null references gf_core.help_possibilities(help_id),
  created_at timestamptz not null default now(), status text not null default 'active' check(status in('active','withdrawn'))
);
create table gf_core.tissue_reports(
  report_id uuid primary key default gen_random_uuid(), space_id uuid not null references gf_core.interaction_spaces(space_id) on delete cascade,
  reporter_person_id uuid not null references gf_core.persons(person_id) on delete cascade,
  reason_code text not null check(reason_code in('unsafe','spam','boundary','other')), created_at timestamptz not null default now(), status text not null default 'open' check(status in('open','reviewed','closed'))
);
create table gf_private.circle_invites(
  invite_id uuid primary key default gen_random_uuid(), space_id uuid not null references gf_core.interaction_spaces(space_id) on delete cascade,
  created_by uuid not null references gf_core.persons(person_id) on delete cascade, invite_token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz not null default(now()+interval '7 days'), used_by uuid references gf_core.persons(person_id), used_at timestamptz,
  created_at timestamptz not null default now()
);
revoke all on gf_private.circle_invites from public,anon,authenticated;

alter table gf_core.interaction_spaces enable row level security; alter table gf_core.interaction_spaces force row level security;
alter table gf_core.memberships enable row level security; alter table gf_core.memberships force row level security;
alter table gf_core.contributions enable row level security; alter table gf_core.contributions force row level security;
alter table gf_core.tissue_reports enable row level security; alter table gf_core.tissue_reports force row level security;
grant select on gf_core.interaction_spaces,gf_core.memberships,gf_core.contributions to authenticated;
grant insert on gf_core.tissue_reports to authenticated;

create or replace function gf_private.current_is_active_member(p_space_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from gf_core.memberships m join gf_core.persons p on p.person_id=m.person_id where m.space_id=p_space_id and m.status='active' and p.auth_user_id=auth.uid()) $$;
revoke execute on function gf_private.current_is_active_member(uuid) from public,anon;
grant execute on function gf_private.current_is_active_member(uuid) to authenticated;

create policy spaces_member_select on gf_core.interaction_spaces for select to authenticated using(gf_private.current_is_active_member(space_id));
create policy memberships_member_select on gf_core.memberships for select to authenticated using(gf_private.current_is_active_member(space_id));
create policy contributions_member_select on gf_core.contributions for select to authenticated using(gf_private.current_is_active_member(space_id));
create policy reports_self_insert on gf_core.tissue_reports for insert to authenticated with check(reporter_person_id=(select gf_core.current_person_id()) and gf_private.current_is_active_member(space_id));
create index memberships_person_idx on gf_core.memberships(person_id,status);
create index contributions_space_idx on gf_core.contributions(space_id,created_at desc);

create or replace function public.lumen_s5_create_circle(p_name text,p_purpose text,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_space uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid()); begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then raise exception 'person unavailable'; end if;
 insert into gf_core.interaction_spaces(created_by,name,purpose) values(v_person,trim(p_name),trim(p_purpose)) returning space_id into v_space;
 insert into gf_core.memberships(space_id,person_id,role) values(v_space,v_person,'host');
 insert into gf_core.consent_grants(person_id,scope,granted,terms_version) values(v_person,'tissue:'||v_space::text,true,'circle.v1');
 perform gf_private.emit_person_event('CircleCreated','interaction_space',v_space,v_person,v_trace,'s5.v1',jsonb_build_object('space_kind','circle'));
 return jsonb_build_object('space_id',v_space,'name',trim(p_name),'purpose',trim(p_purpose),'role','host','trace_id',v_trace);
end $$;

create or replace function public.lumen_s5_create_invite(p_space_id uuid,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_token uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid()); begin
 if v_uid is null then raise exception 'authentication required'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if not exists(select 1 from gf_core.memberships where space_id=p_space_id and person_id=v_person and role='host' and status='active') then raise exception 'host membership required' using errcode='42501'; end if;
 insert into gf_private.circle_invites(space_id,created_by) values(p_space_id,v_person) returning invite_token into v_token;
 perform gf_private.emit_person_event('CircleInviteCreated','interaction_space',p_space_id,v_person,v_trace,'s5.v1',jsonb_build_object('expires_in_days',7));
 return jsonb_build_object('invite_token',v_token,'space_id',p_space_id,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s5_join_circle(p_invite_token uuid,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;r gf_private.circle_invites%rowtype;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid()); begin
 if v_uid is null then raise exception 'authentication required'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 select * into r from gf_private.circle_invites where invite_token=p_invite_token and used_at is null and expires_at>now() for update;
 if r.invite_id is null then raise exception 'invite unavailable' using errcode='P0002'; end if;
 if not exists(select 1 from gf_core.interaction_spaces where space_id=r.space_id and status='active') then raise exception 'circle unavailable'; end if;
 insert into gf_core.memberships(space_id,person_id,role,status) values(r.space_id,v_person,'member','active') on conflict(space_id,person_id) do update set status='active',left_at=null,consent_version='circle.v1';
 update gf_private.circle_invites set used_by=v_person,used_at=now() where invite_id=r.invite_id;
 insert into gf_core.consent_grants(person_id,scope,granted,terms_version) values(v_person,'tissue:'||r.space_id::text,true,'circle.v1');
 perform gf_private.emit_person_event('CircleJoined','interaction_space',r.space_id,v_person,v_trace,'s5.v1',jsonb_build_object('role','member'));
 return jsonb_build_object('space_id',r.space_id,'joined',true,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s5_share_help(p_space_id uuid,p_help_id uuid,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_contribution uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid()); begin
 if v_uid is null then raise exception 'authentication required'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if not exists(select 1 from gf_core.memberships where space_id=p_space_id and person_id=v_person and status='active') then raise exception 'active membership required' using errcode='42501'; end if;
 if not exists(select 1 from gf_core.help_possibilities where help_id=p_help_id and lifecycle in('active_limited','active')) then raise exception 'help unavailable'; end if;
 insert into gf_core.contributions(space_id,person_id,help_id) values(p_space_id,v_person,p_help_id) returning contribution_id into v_contribution;
 perform gf_private.emit_person_event('TissueContributionShared','contribution',v_contribution,v_person,v_trace,'s5.v1',jsonb_build_object('space_id',p_space_id,'help_id',p_help_id));
 return jsonb_build_object('contribution_id',v_contribution,'space_id',p_space_id,'help_id',p_help_id,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s5_leave_circle(p_space_id uuid,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid()); begin
 if v_uid is null then raise exception 'authentication required'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 update gf_core.memberships set status='left',left_at=now() where space_id=p_space_id and person_id=v_person and status='active';
 if not found then raise exception 'membership unavailable'; end if;
 insert into gf_core.consent_grants(person_id,scope,granted,granted_at,revoked_at,terms_version) values(v_person,'tissue:'||p_space_id::text,false,now(),now(),'circle.v1');
 perform gf_private.emit_person_event('CircleLeft','interaction_space',p_space_id,v_person,v_trace,'s5.v1','{}'::jsonb);
 return jsonb_build_object('space_id',p_space_id,'left',true,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s5_report_circle(p_space_id uuid,p_reason_code text,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_report uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_reason text:=lower(trim(p_reason_code)); begin
 if v_uid is null then raise exception 'authentication required'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if not exists(select 1 from gf_core.memberships where space_id=p_space_id and person_id=v_person and status='active') then raise exception 'membership required'; end if;
 if v_reason not in('unsafe','spam','boundary','other') then raise exception 'invalid reason'; end if;
 insert into gf_core.tissue_reports(space_id,reporter_person_id,reason_code) values(p_space_id,v_person,v_reason) returning report_id into v_report;
 perform gf_private.emit_person_event('TissueReportCreated','tissue_report',v_report,v_person,v_trace,'s5.v1',jsonb_build_object('space_id',p_space_id,'reason_code',v_reason));
 return jsonb_build_object('report_id',v_report,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s5_snapshot()
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_uid uuid:=auth.uid();v_person uuid;v_result jsonb; begin
 if v_uid is null then raise exception 'authentication required'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 select coalesce(jsonb_agg(jsonb_build_object('space_id',s.space_id,'name',s.name,'purpose',s.purpose,'role',m.role,'member_count',(select count(*) from gf_core.memberships mm where mm.space_id=s.space_id and mm.status='active'),'contributions',coalesce((select jsonb_agg(jsonb_build_object('contribution_id',c.contribution_id,'help_id',c.help_id,'title',hl.title,'summary',hl.summary,'from_me',c.person_id=v_person) order by c.created_at desc) from gf_core.contributions c join gf_core.help_possibilities hp on hp.help_id=c.help_id join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version join lateral(select title,summary from gf_core.help_localizations where help_version_id=hv.help_version_id order by case when locale='es-AR' then 0 else 1 end limit 1) hl on true where c.space_id=s.space_id and c.status='active'),'[]'::jsonb)) order by s.updated_at desc),'[]'::jsonb) into v_result
 from gf_core.memberships m join gf_core.interaction_spaces s on s.space_id=m.space_id where m.person_id=v_person and m.status='active' and s.status='active';
 return v_result;
end $$;

revoke execute on function public.lumen_s5_create_circle(text,text,uuid),public.lumen_s5_create_invite(uuid,uuid),public.lumen_s5_join_circle(uuid,uuid),public.lumen_s5_share_help(uuid,uuid,uuid),public.lumen_s5_leave_circle(uuid,uuid),public.lumen_s5_report_circle(uuid,text,uuid),public.lumen_s5_snapshot() from public,anon;
grant execute on function public.lumen_s5_create_circle(text,text,uuid),public.lumen_s5_create_invite(uuid,uuid),public.lumen_s5_join_circle(uuid,uuid),public.lumen_s5_share_help(uuid,uuid,uuid),public.lumen_s5_leave_circle(uuid,uuid),public.lumen_s5_report_circle(uuid,text,uuid),public.lumen_s5_snapshot() to authenticated;
