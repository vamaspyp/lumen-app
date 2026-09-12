-- A60 final contract alignment to V53: no new anatomy, only missing longitudinal contracts.

-- 1) DiscoverConstellation receives an optional realization context instead of creating a new domain object.
drop function if exists public.lumen_source_constellation(text,text,text,integer);
create function public.lumen_source_constellation(
  p_capacity_key text,
  p_area_key text default null,
  p_context jsonb default '{}'::jsonb,
  p_locale text default 'es-AR',
  p_limit integer default 16
) returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare
  v_result jsonb;
  v_limit integer:=greatest(1,least(coalesce(p_limit,16),32));
  v_context jsonb:=coalesce(p_context,'{}'::jsonb);
begin
 if p_capacity_key is null or not exists(select 1 from gf_core.capacity_terms where taxonomy_version='life-taxonomy.v1' and capacity_key=p_capacity_key and status='active') then
   raise exception 'active capacity required' using errcode='22023';
 end if;
 if p_area_key is not null and not exists(select 1 from gf_core.area_terms where taxonomy_version='life-taxonomy.v1' and area_key=p_area_key and status='active') then
   raise exception 'invalid area' using errcode='22023';
 end if;
 if v_context ? 'max_duration_minutes' and jsonb_typeof(v_context->'max_duration_minutes') <> 'number' then
   raise exception 'invalid max_duration_minutes' using errcode='22023';
 end if;
 if v_context ? 'allowed_energy' and jsonb_typeof(v_context->'allowed_energy') <> 'array' then
   raise exception 'invalid allowed_energy' using errcode='22023';
 end if;

 select coalesce(jsonb_agg(item order by role_diversity desc,priority_hint,title),'[]'::jsonb)
 into v_result
 from (
   select min(ha.priority_hint) priority_hint,
          count(distinct role) role_diversity,
          hl.title,
          jsonb_build_object(
            'help_id',hp.help_id,'help_version_id',hv.help_version_id,'canonical_code',hp.canonical_code,
            'help_type',hp.help_type,'lifecycle',hp.lifecycle,'risk_class',hp.risk_class,'evidence_class',hp.evidence_class,
            'title',hl.title,'summary',hl.summary,'content',hl.content_payload,'duration_minutes',hv.duration_minutes,'energy',hv.energy,'accessibility',hv.accessibility,
            'provider',jsonb_build_object('name',pr.display_name,'kind',pr.provider_kind,'provenance',pr.provenance,'rights',pr.rights),
            'area_key',p_area_key,'capacity_key',p_capacity_key,
            'cultivation_roles',coalesce(jsonb_agg(distinct role) filter(where role is not null),'[]'::jsonb),
            'cultivation_vocab_version','cultivation.v1','taxonomy_version','life-taxonomy.v1'
          ) item
   from gf_core.help_applicability ha
   join gf_core.help_versions hv on hv.help_version_id=ha.help_version_id
   join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version
   join gf_core.providers pr on pr.provider_id=hp.provider_id
   join lateral(select h.* from gf_core.help_localizations h where h.help_version_id=hv.help_version_id order by case when h.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0 when left(h.locale,2)=left(coalesce(nullif(trim(p_locale),''),'es-AR'),2) then 1 when h.locale='es-AR' then 2 else 3 end limit 1) hl on true
   left join lateral unnest(ha.cultivation_roles) role on true
   where hp.lifecycle in('active_limited','active')
     and ha.state in('applicable','partial')
     and ha.taxonomy_version='life-taxonomy.v1'
     and ha.capacity_key=p_capacity_key
     and (p_area_key is null or ha.area_key=p_area_key)
     and (not (v_context ? 'max_duration_minutes') or hv.duration_minutes is null or hv.duration_minutes <= (v_context->>'max_duration_minutes')::integer)
     and (not (v_context ? 'allowed_energy') or hv.energy is null or exists(select 1 from jsonb_array_elements_text(v_context->'allowed_energy') e where e=hv.energy))
     and (not (v_context ? 'provider_kind') or pr.provider_kind=v_context->>'provider_kind')
   group by hp.help_id,hv.help_version_id,hp.canonical_code,hp.help_type,hp.lifecycle,hp.risk_class,hp.evidence_class,hv.duration_minutes,hv.energy,hv.accessibility,hl.title,hl.summary,hl.content_payload,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
   order by role_diversity desc, min(ha.priority_hint), hl.title
   limit v_limit
 ) q;
 return v_result;
end $$;
revoke all on function public.lumen_source_constellation(text,text,jsonb,text,integer) from public;
grant execute on function public.lumen_source_constellation(text,text,jsonb,text,integer) to anon, authenticated;

-- 2) Path can carry the voluntary cultivation intention without becoming a program.
drop function if exists public.lumen_s2_add_path_item(uuid,uuid,text,uuid);
create function public.lumen_s2_add_path_item(
  p_trajectory_id uuid,
  p_help_id uuid,
  p_label text,
  p_cultivation_move text default null,
  p_trace_id uuid default null
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_path uuid;v_item uuid;v_pos integer;v_label text:=trim(coalesce(p_label,''));v_move text:=nullif(upper(trim(coalesce(p_cultivation_move,''))), '');
begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 select path_id into v_path from gf_core.paths where trajectory_id=p_trajectory_id and person_id=v_person and status='active' order by created_at limit 1;
 if v_path is null then raise exception 'active path unavailable' using errcode='P0002'; end if;
 if char_length(v_label) not between 1 and 160 then raise exception 'invalid label' using errcode='22023'; end if;
 if p_help_id is not null and not exists(select 1 from gf_core.help_possibilities where help_id=p_help_id and lifecycle in('active_limited','active')) then raise exception 'help unavailable' using errcode='P0002'; end if;
 if v_move is not null and v_move not in('REUSE_REPERTOIRE','REPEAT','VARY','APPLY_IN_CONTEXT','REFLECT','INTEGRATE','CONTINUE_PATH','CONNECT_HUMAN') then raise exception 'invalid cultivation move' using errcode='22023'; end if;
 select coalesce(max(position),0)+1 into v_pos from gf_core.path_items where path_id=v_path;
 insert into gf_core.path_items(path_id,person_id,help_id,label,position,cultivation_move) values(v_path,v_person,p_help_id,v_label,v_pos,v_move) returning path_item_id into v_item;
 perform gf_private.emit_person_event('PathItemAdded','path_item',v_item,v_person,v_trace,'s2.v53.1',jsonb_build_object('trajectory_id',p_trajectory_id,'help_id',p_help_id,'position',v_pos,'cultivation_move',v_move));
 return jsonb_build_object('path_item_id',v_item,'path_id',v_path,'position',v_pos,'cultivation_move',v_move,'trace_id',v_trace);
end $$;
revoke all on function public.lumen_s2_add_path_item(uuid,uuid,text,text,uuid) from public;
grant execute on function public.lumen_s2_add_path_item(uuid,uuid,text,text,uuid) to authenticated;

-- 3) ResolveCultivationContext is a minimized longitudinal projection. It deliberately excludes Sanctuary and raw Moment text.
create or replace function public.lumen_s2_resolve_cultivation_context(p_capacity_key text default null)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_person uuid;v_rep jsonb;v_traj jsonb;v_signals jsonb;v_followups jsonb;
begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then raise exception 'person unavailable' using errcode='P0002'; end if;
 if p_capacity_key is not null and not exists(select 1 from gf_core.capacity_terms where taxonomy_version='life-taxonomy.v1' and capacity_key=p_capacity_key and status='active') then raise exception 'capacity unavailable' using errcode='22023'; end if;

 select coalesce(jsonb_agg(jsonb_build_object('repertoire_id',r.repertoire_id,'help_id',r.help_id,'capability_keys',to_jsonb(r.capability_keys),'times_reused',r.times_reused,'last_used_at',r.last_used_at,'user_confirmed',r.user_confirmed) order by r.updated_at desc),'[]'::jsonb)
 into v_rep from gf_core.personal_repertoire r where r.person_id=v_person and r.status='active' and r.user_confirmed=true and (p_capacity_key is null or p_capacity_key=any(r.capability_keys));

 select coalesce(jsonb_agg(jsonb_build_object('trajectory_id',t.trajectory_id,'faro_text',t.faro_text,'path',coalesce((select jsonb_agg(jsonb_build_object('path_item_id',pi.path_item_id,'help_id',pi.help_id,'label',pi.label,'cultivation_move',pi.cultivation_move,'status',pi.status) order by pi.position) from gf_core.path_items pi join gf_core.paths p on p.path_id=pi.path_id where p.trajectory_id=t.trajectory_id),'[]'::jsonb)) order by t.updated_at desc),'[]'::jsonb)
 into v_traj from gf_core.trajectories t where t.person_id=v_person and t.status='active';

 select coalesce(jsonb_agg(jsonb_build_object('signal_kind',q.signal_kind,'help_id',q.help_id,'decision_kind',q.decision_kind,'created_at',q.created_at) order by q.created_at desc),'[]'::jsonb)
 into v_signals from (
   select o.signal_kind,s.help_id,dr.decision_kind,o.created_at
   from gf_core.outcomes_feedback o join gf_core.help_selections s on s.selection_id=o.selection_id join gf_core.decision_runs dr on dr.decision_run_id=s.decision_run_id
   where o.person_id=v_person and o.signal_kind not in('HELPED_NOW','NOT_HELPED_NOW','UNKNOWN')
     and (p_capacity_key is null or p_capacity_key=any(coalesce(array(select jsonb_array_elements_text(coalesce(dr.continuity_context->'capability_keys','[]'::jsonb))),'{}'::text[])))
   order by o.created_at desc limit 12
 ) q;

 select coalesce(jsonb_agg(jsonb_build_object('followup_id',f.followup_id,'reason_code',f.reason_code,'due_at',f.due_at,'cultivation_move',f.cultivation_move,'capacity_key',f.capacity_key,'repertoire_id',f.repertoire_id,'related_help_id',f.related_help_id) order by f.due_at),'[]'::jsonb)
 into v_followups from gf_core.followups f where f.person_id=v_person and f.status in('scheduled','due') and (p_capacity_key is null or f.capacity_key=p_capacity_key);

 return jsonb_build_object('contract_version','cultivation-context.v53.1','capacity_key',p_capacity_key,'repertoire',v_rep,'active_trajectories',v_traj,'longitudinal_signals',v_signals,'followups',v_followups);
end $$;
revoke all on function public.lumen_s2_resolve_cultivation_context(text) from public;
grant execute on function public.lumen_s2_resolve_cultivation_context(text) to authenticated;
