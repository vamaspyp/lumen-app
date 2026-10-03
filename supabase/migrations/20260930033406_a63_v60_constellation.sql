CREATE OR REPLACE FUNCTION public.lumen_s1_moment_constellation(p_episode_id uuid, p_locale text DEFAULT 'es-AR'::text, p_limit integer DEFAULT 12, p_trace_id uuid DEFAULT NULL::uuid, p_capacity_keys text[] DEFAULT NULL::text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_person uuid:=gf_core.current_person_id(); v_trace uuid:=coalesce(p_trace_id,gen_random_uuid()); v_run uuid; v_moment uuid; v_areas text[]; v_interp_caps text[]; v_caps text[]; v_primary uuid; v_rank integer; v_result jsonb:='[]'::jsonb; v_limit integer:=least(3,greatest(1,coalesce(p_limit,3))); v_memory boolean:=false; v_invalid integer; r record;
begin
  if v_person is null then raise exception 'authentication required' using errcode='28000'; end if;
  select coalesce(memory_allowed,false) into v_memory from gf_core.privacy_preferences where person_id=v_person;
  select dr.decision_run_id,ae.moment_id,mi.area_keys,mi.capacity_keys into v_run,v_moment,v_areas,v_interp_caps
  from gf_core.accompaniment_episodes ae
  join gf_core.decision_runs dr on dr.episode_id=ae.episode_id and dr.person_id=v_person
  join gf_core.moment_interpretations mi on mi.moment_id=ae.moment_id and mi.person_id=v_person
  where ae.episode_id=p_episode_id and ae.person_id=v_person and dr.safety_state<>'blocked' and dr.coverage_state in('covered','partial')
  order by dr.created_at desc,mi.created_at desc limit 1;
  if v_run is null then return jsonb_build_object('episode_id',p_episode_id,'items','[]'::jsonb,'capacity_keys','[]'::jsonb,'area_keys','[]'::jsonb,'trace_id',v_trace); end if;
  v_caps:=case when p_capacity_keys is null or cardinality(p_capacity_keys)=0 then v_interp_caps else p_capacity_keys end;
  select count(*) into v_invalid from unnest(v_caps) cap where not exists(select 1 from gf_core.capacity_terms ct where ct.taxonomy_version='life-taxonomy.v1' and ct.capacity_key=cap and ct.status='active');
  if v_invalid>0 then raise exception 'invalid capacity' using errcode='22023'; end if;
  select array_agg(distinct x order by x) into v_caps from unnest(v_caps) x;
  v_caps:=coalesce(v_caps,v_interp_caps,'{}'::text[]);
  select help_id into v_primary from gf_core.candidate_exposures where decision_run_id=v_run and person_id=v_person order by display_rank limit 1;
  select coalesce(max(display_rank),0) into v_rank from gf_core.candidate_exposures where decision_run_id=v_run;
  for r in
    with eligible as (
      select hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hp.lifecycle,hp.risk_class,hp.evidence_class,
             hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail,hv.accessibility,
             pr.display_name provider_name,pr.provider_kind,pr.provenance provider_provenance,pr.rights provider_rights,
             min(ha.priority_hint) priority_hint,max(ha.applicability_confidence) applicability_confidence,
             array_agg(distinct ha.capacity_key order by ha.capacity_key) matched_capacity_keys,
             array_agg(distinct ha.area_key order by ha.area_key) matched_area_keys,
             array_agg(distinct role) filter(where role is not null) cultivation_roles,
             count(distinct ha.capacity_key) capacity_match_count,
             count(distinct role) filter(where role is not null) role_diversity,
             (v_memory and exists(select 1 from gf_core.personal_repertoire own where own.person_id=v_person and own.help_id=hp.help_id and own.status='active' and own.user_confirmed)) from_own_repertoire,
             (v_memory and exists(select 1 from gf_private.sanctuary_entries se where se.person_id=v_person and se.source_help_id=hp.help_id)) from_sanctuary
      from gf_core.help_applicability ha
      join gf_core.help_versions hv on hv.help_version_id=ha.help_version_id
      join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version
      join gf_core.providers pr on pr.provider_id=hp.provider_id
      join lateral(select hloc.* from gf_core.help_localizations hloc where hloc.help_version_id=hv.help_version_id order by case when hloc.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0 when left(hloc.locale,2)=left(coalesce(nullif(trim(p_locale),''),'es-AR'),2) then 1 when hloc.locale='es-AR' then 2 else 3 end limit 1) hl on true
      left join lateral unnest(ha.cultivation_roles) role on true
      where hp.lifecycle in('active_limited','active') and ha.state in('applicable','partial') and ha.taxonomy_version='life-taxonomy.v1'
        and ha.area_key=any(v_areas) and ha.capacity_key=any(v_caps)
      group by hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hp.lifecycle,hp.risk_class,hp.evidence_class,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail,hv.accessibility,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
    )
    select * from eligible order by (help_id=v_primary) desc,from_own_repertoire desc,from_sanctuary desc,capacity_match_count desc,role_diversity desc,applicability_confidence desc,priority_hint,canonical_code limit v_limit
  loop
    if not exists(select 1 from gf_core.decision_candidates where decision_run_id=v_run and help_id=r.help_id) then
      insert into gf_core.decision_candidates(decision_run_id,person_id,help_id,help_version_id,eligibility_status,reason_key,priority_hint)
      values(v_run,v_person,r.help_id,r.help_version_id,'eligible',case when r.from_own_repertoire then 'moment_constellation_own_repertoire' else 'moment_constellation' end,r.priority_hint);
    end if;
    if not exists(select 1 from gf_core.candidate_exposures where decision_run_id=v_run and person_id=v_person and help_id=r.help_id) then
      v_rank:=v_rank+1; insert into gf_core.candidate_exposures(decision_run_id,person_id,help_id,help_version_id,display_rank) values(v_run,v_person,r.help_id,r.help_version_id,v_rank);
    end if;
    v_result:=v_result || jsonb_build_array(jsonb_build_object(
      'help_id',r.help_id,'help_version_id',r.help_version_id,'canonical_code',r.canonical_code,'help_type',r.help_type,'lifecycle',r.lifecycle,'risk_class',r.risk_class,'evidence_class',r.evidence_class,
      'title',r.title,'summary',r.summary,'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail,'accessibility',r.accessibility,
      'provider',jsonb_build_object('name',r.provider_name,'kind',r.provider_kind,'provenance',r.provider_provenance,'rights',r.provider_rights),
      'areas',to_jsonb(r.matched_area_keys),'capacities',to_jsonb(r.matched_capacity_keys),'cultivation_roles',to_jsonb(coalesce(r.cultivation_roles,'{}'::text[])),'cultivation_vocab_version','cultivation.v1','taxonomy_version','life-taxonomy.v1',
      'primary_now',jsonb_array_length(v_result)=0,'context_origin',case when r.from_own_repertoire then 'propio' when r.from_sanctuary then 'santuario' when r.help_type in ('professional_support','institutional_service','conversation') then 'tejido' else 'fuente' end,
      'context_reason',case when r.from_own_repertoire then 'Lo reconociste como propio y se relaciona con lo que expresaste hoy.' when r.from_sanctuary then 'Elegiste conservarlo y puede volver a servirte ahora.' when r.help_type in ('professional_support','institutional_service','conversation') then 'Una forma de acompañamiento humano relacionada con este Momento.' else 'Una posibilidad relacionada con lo que expresaste hoy.' end,'from_own_repertoire',r.from_own_repertoire,'applicability_confidence',r.applicability_confidence));
  end loop;
  perform gf_private.emit_person_event('MomentConstellationExposed','episode',p_episode_id,v_person,v_trace,'s1.a63.v60',jsonb_build_object('decision_run_id',v_run,'item_count',jsonb_array_length(v_result),'capacity_keys',to_jsonb(v_caps),'area_keys',to_jsonb(v_areas),'user_adjusted_capacities',p_capacity_keys is not null));
  return jsonb_build_object('episode_id',p_episode_id,'moment_id',v_moment,'decision_run_id',v_run,'state',case when jsonb_array_length(v_result)>0 then 'success' else 'no_match' end,'items',v_result,'capacity_keys',to_jsonb(v_caps),'area_keys',to_jsonb(v_areas),'trace_id',v_trace);
end $function$
;

