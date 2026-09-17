-- A63 · Momento → Constelación singular → Faro → Camino editable
-- Constelación remains a projection. No constellation table, no capacity scores.

alter table gf_core.trajectories add column if not exists capability_keys text[] not null default '{}'::text[];
alter table gf_core.trajectories add column if not exists origin_moment_id uuid null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='trajectories_origin_moment_id_fkey' and conrelid='gf_core.trajectories'::regclass) then
    alter table gf_core.trajectories add constraint trajectories_origin_moment_id_fkey foreign key(origin_moment_id) references gf_core.moments(moment_id) on delete set null;
  end if;
end $$;

alter table gf_core.path_items add column if not exists source_kind text not null default 'custom';
alter table gf_core.path_items add column if not exists source_ref_id uuid null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='path_items_source_kind_check' and conrelid='gf_core.path_items'::regclass) then
    alter table gf_core.path_items add constraint path_items_source_kind_check check(source_kind in ('source','repertoire','sanctuary','tissue','custom'));
  end if;
end $$;
update gf_core.path_items set source_kind='source' where help_id is not null and source_kind='custom';

create or replace function public.lumen_s2_create_trajectory_from_moment(
  p_faro_text text,
  p_capacity_keys text[] default '{}'::text[],
  p_origin_moment_id uuid default null,
  p_trace_id uuid default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_faro text:=trim(coalesce(p_faro_text,''));v_caps text[]:=coalesce(p_capacity_keys,'{}'::text[]);v_trajectory uuid;v_path uuid;v_invalid integer;
begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then raise exception 'person unavailable' using errcode='P0002';end if;
 if char_length(v_faro) not between 1 and 280 then raise exception 'invalid faro' using errcode='22023';end if;
 if p_origin_moment_id is not null and not exists(select 1 from gf_core.moments where moment_id=p_origin_moment_id and person_id=v_person) then raise exception 'moment unavailable' using errcode='42501';end if;
 if cardinality(v_caps)=0 and p_origin_moment_id is not null then select coalesce(capacity_keys,'{}'::text[]) into v_caps from gf_core.moment_interpretations where moment_id=p_origin_moment_id and person_id=v_person order by created_at desc limit 1;end if;
 select count(*) into v_invalid from unnest(v_caps) cap where not exists(select 1 from gf_core.capacity_terms ct where ct.taxonomy_version='life-taxonomy.v1' and ct.capacity_key=cap and ct.status='active');
 if v_invalid>0 then raise exception 'invalid capacity' using errcode='22023';end if;
 select array_agg(distinct x order by x) into v_caps from unnest(v_caps) x;v_caps:=coalesce(v_caps,'{}'::text[]);
 insert into gf_core.trajectories(person_id,faro_text,capability_keys,origin_moment_id) values(v_person,v_faro,v_caps,p_origin_moment_id) returning trajectory_id into v_trajectory;
 insert into gf_core.paths(trajectory_id,person_id) values(v_trajectory,v_person) returning path_id into v_path;
 perform gf_private.emit_person_event('TrajectoryCreated','trajectory',v_trajectory,v_person,v_trace,'s2.a63.1',jsonb_build_object('status','active','origin_moment_id',p_origin_moment_id,'capability_keys',to_jsonb(v_caps)));
 return jsonb_build_object('trajectory_id',v_trajectory,'path_id',v_path,'faro_text',v_faro,'status','active','capability_keys',to_jsonb(v_caps),'origin_moment_id',p_origin_moment_id,'trace_id',v_trace);
end $$;
revoke all on function public.lumen_s2_create_trajectory_from_moment(text,text[],uuid,uuid) from public, anon;
grant execute on function public.lumen_s2_create_trajectory_from_moment(text,text[],uuid,uuid) to authenticated;

create or replace function public.lumen_s2_set_trajectory_capabilities(p_trajectory_id uuid,p_capacity_keys text[],p_trace_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_caps text[]:=coalesce(p_capacity_keys,'{}'::text[]);v_invalid integer;
begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if not exists(select 1 from gf_core.trajectories where trajectory_id=p_trajectory_id and person_id=v_person) then raise exception 'trajectory unavailable' using errcode='P0002';end if;
 select count(*) into v_invalid from unnest(v_caps) cap where not exists(select 1 from gf_core.capacity_terms ct where ct.taxonomy_version='life-taxonomy.v1' and ct.capacity_key=cap and ct.status='active');
 if v_invalid>0 then raise exception 'invalid capacity' using errcode='22023';end if;
 select array_agg(distinct x order by x) into v_caps from unnest(v_caps) x;v_caps:=coalesce(v_caps,'{}'::text[]);
 update gf_core.trajectories set capability_keys=v_caps,updated_at=now(),revision=revision+1 where trajectory_id=p_trajectory_id and person_id=v_person;
 perform gf_private.emit_person_event('TrajectoryCapabilitiesChanged','trajectory',p_trajectory_id,v_person,v_trace,'s2.a63.1',jsonb_build_object('capability_keys',to_jsonb(v_caps)));
 return jsonb_build_object('trajectory_id',p_trajectory_id,'capability_keys',to_jsonb(v_caps),'trace_id',v_trace);
end $$;
revoke all on function public.lumen_s2_set_trajectory_capabilities(uuid,text[],uuid) from public, anon;
grant execute on function public.lumen_s2_set_trajectory_capabilities(uuid,text[],uuid) to authenticated;

create or replace function public.lumen_s2_add_path_reference(p_trajectory_id uuid,p_source_kind text,p_source_ref_id uuid,p_help_id uuid,p_label text,p_cultivation_move text default null,p_trace_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_path uuid;v_item uuid;v_pos integer;v_label text:=trim(coalesce(p_label,''));v_kind text:=lower(trim(coalesce(p_source_kind,'')));v_move text:=nullif(upper(trim(coalesce(p_cultivation_move,''))),'');v_help uuid:=p_help_id;
begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 select path_id into v_path from gf_core.paths where trajectory_id=p_trajectory_id and person_id=v_person and status='active' order by created_at limit 1;if v_path is null then raise exception 'active path unavailable' using errcode='P0002';end if;
 if char_length(v_label) not between 1 and 160 then raise exception 'invalid label' using errcode='22023';end if;if v_kind not in('source','repertoire','sanctuary','tissue','custom') then raise exception 'invalid source kind' using errcode='22023';end if;
 if v_move is not null and v_move not in('REUSE_REPERTOIRE','REPEAT','VARY','APPLY_IN_CONTEXT','REFLECT','INTEGRATE','CONTINUE_PATH','CONNECT_HUMAN') then raise exception 'invalid cultivation move' using errcode='22023';end if;
 if v_kind='source' then if v_help is null or not exists(select 1 from gf_core.help_possibilities where help_id=v_help and lifecycle in('active_limited','active')) then raise exception 'help unavailable' using errcode='P0002';end if;
 elsif v_kind='repertoire' then select help_id into v_help from gf_core.personal_repertoire where repertoire_id=p_source_ref_id and person_id=v_person and status='active';if v_help is null then raise exception 'repertoire unavailable' using errcode='P0002';end if;
 elsif v_kind='sanctuary' then if not exists(select 1 from gf_private.sanctuary_entries where entry_id=p_source_ref_id and person_id=v_person) then raise exception 'sanctuary entry unavailable' using errcode='P0002';end if;if v_help is null then select source_help_id into v_help from gf_private.sanctuary_entries where entry_id=p_source_ref_id and person_id=v_person;end if;
 elsif v_kind='tissue' then if not exists(select 1 from gf_core.memberships where space_id=p_source_ref_id and person_id=v_person and status='active') then raise exception 'tissue reference unavailable' using errcode='P0002';end if;if v_help is not null and not exists(select 1 from gf_core.help_possibilities where help_id=v_help and lifecycle in('active_limited','active')) then raise exception 'help unavailable' using errcode='P0002';end if;
 else v_help:=null;p_source_ref_id:=null;end if;
 select coalesce(max(position),0)+1 into v_pos from gf_core.path_items where path_id=v_path;
 insert into gf_core.path_items(path_id,person_id,help_id,label,position,cultivation_move,source_kind,source_ref_id) values(v_path,v_person,v_help,v_label,v_pos,v_move,v_kind,p_source_ref_id) returning path_item_id into v_item;
 perform gf_private.emit_person_event('PathItemAdded','path_item',v_item,v_person,v_trace,'s2.a63.1',jsonb_build_object('trajectory_id',p_trajectory_id,'help_id',v_help,'position',v_pos,'cultivation_move',v_move,'source_kind',v_kind,'source_ref_id',p_source_ref_id));
 return jsonb_build_object('path_item_id',v_item,'path_id',v_path,'position',v_pos,'cultivation_move',v_move,'source_kind',v_kind,'source_ref_id',p_source_ref_id,'help_id',v_help,'trace_id',v_trace);
end $$;
revoke all on function public.lumen_s2_add_path_reference(uuid,text,uuid,uuid,text,text,uuid) from public, anon;
grant execute on function public.lumen_s2_add_path_reference(uuid,text,uuid,uuid,text,text,uuid) to authenticated;

create or replace function public.lumen_s2_remove_path_item(p_path_item_id uuid,p_trace_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_path uuid;v_position integer;begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;select person_id into v_person from gf_core.persons where auth_user_id=v_uid;select path_id,position into v_path,v_position from gf_core.path_items where path_item_id=p_path_item_id and person_id=v_person;if v_path is null then raise exception 'path item unavailable' using errcode='P0002';end if;
 delete from gf_core.path_items where path_item_id=p_path_item_id and person_id=v_person;update gf_core.path_items set position=position-1,updated_at=now() where path_id=v_path and person_id=v_person and position>v_position;perform gf_private.emit_person_event('PathItemRemoved','path_item',p_path_item_id,v_person,v_trace,'s2.a63.1',jsonb_build_object('path_id',v_path));return jsonb_build_object('path_item_id',p_path_item_id,'removed',true,'trace_id',v_trace);
end $$;
revoke all on function public.lumen_s2_remove_path_item(uuid,uuid) from public, anon;grant execute on function public.lumen_s2_remove_path_item(uuid,uuid) to authenticated;

create or replace function public.lumen_s2_reorder_path_item(p_path_item_id uuid,p_position integer,p_trace_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_path uuid;v_old integer;v_new integer;v_max integer;begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;select person_id into v_person from gf_core.persons where auth_user_id=v_uid;select path_id,position into v_path,v_old from gf_core.path_items where path_item_id=p_path_item_id and person_id=v_person;if v_path is null then raise exception 'path item unavailable' using errcode='P0002';end if;select count(*) into v_max from gf_core.path_items where path_id=v_path and person_id=v_person;v_new:=greatest(1,least(coalesce(p_position,v_old),v_max));
 if v_new<v_old then update gf_core.path_items set position=position+1,updated_at=now() where path_id=v_path and person_id=v_person and position>=v_new and position<v_old and path_item_id<>p_path_item_id;elsif v_new>v_old then update gf_core.path_items set position=position-1,updated_at=now() where path_id=v_path and person_id=v_person and position>v_old and position<=v_new and path_item_id<>p_path_item_id;end if;update gf_core.path_items set position=v_new,updated_at=now() where path_item_id=p_path_item_id and person_id=v_person;perform gf_private.emit_person_event('PathItemReordered','path_item',p_path_item_id,v_person,v_trace,'s2.a63.1',jsonb_build_object('path_id',v_path,'from',v_old,'to',v_new));return jsonb_build_object('path_item_id',p_path_item_id,'position',v_new,'trace_id',v_trace);
end $$;
revoke all on function public.lumen_s2_reorder_path_item(uuid,integer,uuid) from public, anon;grant execute on function public.lumen_s2_reorder_path_item(uuid,integer,uuid) to authenticated;

create or replace function public.lumen_s2_save_constellation_to_path(p_trajectory_id uuid,p_help_ids uuid[],p_trace_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_path uuid;v_pos integer;v_added integer:=0;r record;begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;select person_id into v_person from gf_core.persons where auth_user_id=v_uid;select path_id into v_path from gf_core.paths where trajectory_id=p_trajectory_id and person_id=v_person and status='active' order by created_at limit 1;if v_path is null then raise exception 'active path unavailable' using errcode='P0002';end if;
 for r in select hp.help_id,hl.title from gf_core.help_possibilities hp join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version join lateral(select title from gf_core.help_localizations where help_version_id=hv.help_version_id order by case when locale='es-AR' then 0 else 1 end limit 1) hl on true where hp.help_id=any(coalesce(p_help_ids,'{}'::uuid[])) and hp.lifecycle in('active_limited','active') loop if not exists(select 1 from gf_core.path_items where path_id=v_path and help_id=r.help_id and status='planned') then select coalesce(max(position),0)+1 into v_pos from gf_core.path_items where path_id=v_path;insert into gf_core.path_items(path_id,person_id,help_id,label,position,source_kind) values(v_path,v_person,r.help_id,left(r.title,160),v_pos,'source');v_added:=v_added+1;end if;end loop;
 perform gf_private.emit_person_event('ConstellationMaterializedAsPath','trajectory',p_trajectory_id,v_person,v_trace,'s2.a63.1',jsonb_build_object('added_count',v_added));return jsonb_build_object('trajectory_id',p_trajectory_id,'added_count',v_added,'trace_id',v_trace);
end $$;
revoke all on function public.lumen_s2_save_constellation_to_path(uuid,uuid[],uuid) from public, anon;grant execute on function public.lumen_s2_save_constellation_to_path(uuid,uuid[],uuid) to authenticated;

-- Replace the temporary four-argument projection with the final editable-capability contract.
drop function if exists public.lumen_s1_moment_constellation(uuid,text,integer,uuid);
create or replace function public.lumen_s1_moment_constellation(p_episode_id uuid,p_locale text default 'es-AR',p_limit integer default 12,p_trace_id uuid default null,p_capacity_keys text[] default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_run uuid;v_moment uuid;v_areas text[];v_interp_caps text[];v_caps text[];v_primary uuid;v_rank integer;v_result jsonb:='[]'::jsonb;v_limit integer:=greatest(3,least(coalesce(p_limit,12),24));v_invalid integer;r record;
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 select dr.decision_run_id,ae.moment_id,mi.area_keys,mi.capacity_keys into v_run,v_moment,v_areas,v_interp_caps from gf_core.accompaniment_episodes ae join gf_core.decision_runs dr on dr.episode_id=ae.episode_id and dr.person_id=v_person join gf_core.moment_interpretations mi on mi.moment_id=ae.moment_id and mi.person_id=v_person where ae.episode_id=p_episode_id and ae.person_id=v_person and dr.safety_state<>'blocked' and dr.coverage_state in('covered','partial') order by dr.created_at desc,mi.created_at desc limit 1;
 if v_run is null then return jsonb_build_object('episode_id',p_episode_id,'items','[]'::jsonb,'capacity_keys','[]'::jsonb,'area_keys','[]'::jsonb,'trace_id',v_trace);end if;
 v_caps:=case when p_capacity_keys is null or cardinality(p_capacity_keys)=0 then v_interp_caps else p_capacity_keys end;select count(*) into v_invalid from unnest(v_caps) cap where not exists(select 1 from gf_core.capacity_terms ct where ct.taxonomy_version='life-taxonomy.v1' and ct.capacity_key=cap and ct.status='active');if v_invalid>0 then raise exception 'invalid capacity' using errcode='22023';end if;select array_agg(distinct x order by x) into v_caps from unnest(v_caps) x;v_caps:=coalesce(v_caps,v_interp_caps,'{}'::text[]);
 select help_id into v_primary from gf_core.candidate_exposures where decision_run_id=v_run and person_id=v_person order by display_rank limit 1;select coalesce(max(display_rank),0) into v_rank from gf_core.candidate_exposures where decision_run_id=v_run;
 for r in with eligible as (
  select hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hp.lifecycle,hp.risk_class,hp.evidence_class,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail,hv.accessibility,pr.display_name provider_name,pr.provider_kind,pr.provenance provider_provenance,pr.rights provider_rights,min(ha.priority_hint) priority_hint,max(ha.applicability_confidence) applicability_confidence,array_agg(distinct ha.capacity_key order by ha.capacity_key) matched_capacity_keys,array_agg(distinct ha.area_key order by ha.area_key) matched_area_keys,array_agg(distinct role) filter(where role is not null) cultivation_roles,count(distinct ha.capacity_key) capacity_match_count,count(distinct role) filter(where role is not null) role_diversity,exists(select 1 from gf_core.personal_repertoire own where own.person_id=v_person and own.help_id=hp.help_id and own.status='active') from_own_repertoire
  from gf_core.help_applicability ha join gf_core.help_versions hv on hv.help_version_id=ha.help_version_id join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version join gf_core.providers pr on pr.provider_id=hp.provider_id join lateral(select hloc.* from gf_core.help_localizations hloc where hloc.help_version_id=hv.help_version_id order by case when hloc.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0 when left(hloc.locale,2)=left(coalesce(nullif(trim(p_locale),''),'es-AR'),2) then 1 when hloc.locale='es-AR' then 2 else 3 end limit 1) hl on true left join lateral unnest(ha.cultivation_roles) role on true
  where hp.lifecycle in('active_limited','active') and ha.state in('applicable','partial') and ha.taxonomy_version='life-taxonomy.v1' and ha.area_key=any(v_areas) and ha.capacity_key=any(v_caps)
  group by hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hp.lifecycle,hp.risk_class,hp.evidence_class,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail,hv.accessibility,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights)
 select * from eligible order by (help_id=v_primary) desc,from_own_repertoire desc,capacity_match_count desc,role_diversity desc,applicability_confidence desc,priority_hint,canonical_code limit v_limit loop
  if not exists(select 1 from gf_core.decision_candidates where decision_run_id=v_run and help_id=r.help_id) then insert into gf_core.decision_candidates(decision_run_id,person_id,help_id,help_version_id,eligibility_status,reason_key,priority_hint) values(v_run,v_person,r.help_id,r.help_version_id,'eligible',case when r.from_own_repertoire then 'moment_constellation_own_repertoire' else 'moment_constellation' end,r.priority_hint);end if;
  if not exists(select 1 from gf_core.candidate_exposures where decision_run_id=v_run and person_id=v_person and help_id=r.help_id) then v_rank:=v_rank+1;insert into gf_core.candidate_exposures(decision_run_id,person_id,help_id,help_version_id,display_rank) values(v_run,v_person,r.help_id,r.help_version_id,v_rank);end if;
  v_result:=v_result||jsonb_build_array(jsonb_build_object('help_id',r.help_id,'help_version_id',r.help_version_id,'canonical_code',r.canonical_code,'help_type',r.help_type,'lifecycle',r.lifecycle,'risk_class',r.risk_class,'evidence_class',r.evidence_class,'title',r.title,'summary',r.summary,'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail,'accessibility',r.accessibility,'provider',jsonb_build_object('name',r.provider_name,'kind',r.provider_kind,'provenance',r.provider_provenance,'rights',r.provider_rights),'areas',to_jsonb(r.matched_area_keys),'capacities',to_jsonb(r.matched_capacity_keys),'cultivation_roles',to_jsonb(coalesce(r.cultivation_roles,'{}'::text[])),'cultivation_vocab_version','cultivation.v1','taxonomy_version','life-taxonomy.v1','primary_now',r.help_id=v_primary,'from_own_repertoire',r.from_own_repertoire,'applicability_confidence',r.applicability_confidence));
 end loop;
 perform gf_private.emit_person_event('MomentConstellationExposed','episode',p_episode_id,v_person,v_trace,'s1.a63.2',jsonb_build_object('decision_run_id',v_run,'item_count',jsonb_array_length(v_result),'capacity_keys',to_jsonb(v_caps),'area_keys',to_jsonb(v_areas),'user_adjusted_capacities',p_capacity_keys is not null));return jsonb_build_object('episode_id',p_episode_id,'moment_id',v_moment,'decision_run_id',v_run,'items',v_result,'capacity_keys',to_jsonb(v_caps),'area_keys',to_jsonb(v_areas),'trace_id',v_trace);
end $$;
revoke all on function public.lumen_s1_moment_constellation(uuid,text,integer,uuid,text[]) from public, anon;grant execute on function public.lumen_s1_moment_constellation(uuid,text,integer,uuid,text[]) to authenticated;

create or replace function public.lumen_s2_snapshot()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_person uuid;v_memory boolean:=false;v_trajectories jsonb;v_repertoire jsonb;v_sanctuary_count integer;begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;select person_id into v_person from gf_core.persons where auth_user_id=v_uid;if v_person is null then return jsonb_build_object('memory_allowed',false,'trajectories','[]'::jsonb,'repertoire','[]'::jsonb,'sanctuary_count',0);end if;select coalesce(memory_allowed,false) into v_memory from gf_core.privacy_preferences where person_id=v_person;
 select coalesce(jsonb_agg(jsonb_build_object('trajectory_id',t.trajectory_id,'faro_text',t.faro_text,'status',t.status,'capability_keys',to_jsonb(t.capability_keys),'origin_moment_id',t.origin_moment_id,'path',coalesce((select jsonb_agg(jsonb_build_object('path_item_id',pi.path_item_id,'help_id',pi.help_id,'label',pi.label,'position',pi.position,'status',pi.status,'cultivation_move',pi.cultivation_move,'source_kind',pi.source_kind,'source_ref_id',pi.source_ref_id) order by pi.position) from gf_core.path_items pi join gf_core.paths p on p.path_id=pi.path_id where p.trajectory_id=t.trajectory_id),'[]'::jsonb)) order by t.updated_at desc),'[]'::jsonb) into v_trajectories from gf_core.trajectories t where t.person_id=v_person;
 select coalesce(jsonb_agg(jsonb_build_object('repertoire_id',r.repertoire_id,'help_id',r.help_id,'title',hl.title,'summary',hl.summary,'times_reused',r.times_reused,'last_used_at',r.last_used_at,'capability_keys',to_jsonb(r.capability_keys),'user_confirmed',r.user_confirmed) order by r.updated_at desc),'[]'::jsonb) into v_repertoire from gf_core.personal_repertoire r join gf_core.help_possibilities hp on hp.help_id=r.help_id join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version join lateral(select title,summary from gf_core.help_localizations where help_version_id=hv.help_version_id order by case when locale='es-AR' then 0 else 1 end limit 1) hl on true where r.person_id=v_person and r.status='active';select count(*) into v_sanctuary_count from gf_private.sanctuary_entries where person_id=v_person;return jsonb_build_object('memory_allowed',coalesce(v_memory,false),'trajectories',v_trajectories,'repertoire',v_repertoire,'sanctuary_count',v_sanctuary_count);
end $$;
