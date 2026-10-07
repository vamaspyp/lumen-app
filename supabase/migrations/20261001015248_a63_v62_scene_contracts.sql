-- A63 · V62 · backend owns renderer family and realizability.
create or replace function public.lumen_s1_correct_moment_context(p_episode_id uuid,p_available_minutes integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();v_moment uuid;begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if p_available_minutes not in (0,5,10,20,60) then raise exception 'invalid available time' using errcode='22023';end if;
 select moment_id into v_moment from gf_core.accompaniment_episodes where episode_id=p_episode_id and person_id=v_person;
 if v_moment is null then raise exception 'moment unavailable' using errcode='42501';end if;
 update gf_core.moment_interpretations set features=features||jsonb_build_object('available_minutes',p_available_minutes,'context_source','person') where moment_id=v_moment and person_id=v_person;
 perform gf_private.emit_person_event('MomentContextCorrected','moment',v_moment,v_person,gen_random_uuid(),'s1.a63.v62',jsonb_build_object('available_minutes',p_available_minutes));
 return jsonb_build_object('state','success');end $$;
revoke all on function public.lumen_s1_correct_moment_context(uuid,integer) from public,anon;
grant execute on function public.lumen_s1_correct_moment_context(uuid,integer) to authenticated;

update gf_core.help_versions hv set detail=coalesce(hv.detail,'{}'::jsonb)||jsonb_build_object('renderer_family',case
 when hv.detail->>'premium_family'='audio_practice' then 'audio'
 when hv.detail->>'premium_family'='video_or_audio_visual_sequence' then 'video'
 when hv.detail->>'premium_family'='contemplative_reading_audio' then 'practice'
 when hv.detail->>'premium_family' in ('classic_reading','illustrated_guide','health_reference') then 'editorial'
 when hp.help_type in ('reading','reflection','question') then 'editorial'
 when hp.help_type='practice' then 'practice'
 when hp.help_type='professional_support' then 'human'
 when hp.help_type='institutional_service' then 'material'
 when hp.help_type in ('human_action','conversation','tool') then 'action'
 else 'external' end)
 from gf_core.help_possibilities hp where hp.help_id=hv.help_id and hp.current_version=hv.version;

CREATE OR REPLACE FUNCTION public.lumen_s1_moment_constellation(p_episode_id uuid, p_locale text DEFAULT 'es-AR'::text, p_limit integer DEFAULT 12, p_trace_id uuid DEFAULT NULL::uuid, p_capacity_keys text[] DEFAULT NULL::text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_person uuid:=gf_core.current_person_id(); v_trace uuid:=coalesce(p_trace_id,gen_random_uuid()); v_run uuid; v_moment uuid; v_areas text[]; v_interp_caps text[]; v_caps text[]; v_primary uuid; v_rank integer; v_result jsonb:='[]'::jsonb; v_limit integer:=least(3,greatest(1,coalesce(p_limit,3))); v_memory boolean:=false; v_invalid integer; v_kind text:='NEW_HELP'; v_withdraw boolean:=false; v_event uuid; v_control uuid; r record;
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
        and (coalesce((select (mi.features->>'available_minutes')::integer from gf_core.moment_interpretations mi where mi.moment_id=v_moment and mi.person_id=v_person order by mi.created_at desc limit 1),0)=0 or hv.duration_minutes<= (select (mi.features->>'available_minutes')::integer from gf_core.moment_interpretations mi where mi.moment_id=v_moment and mi.person_id=v_person order by mi.created_at desc limit 1))
        and (not v_memory or coalesce((select o.signal_kind from gf_core.outcomes_feedback o join gf_core.help_selections sel on sel.selection_id=o.selection_id where o.person_id=v_person and sel.help_id=hp.help_id order by o.created_at desc limit 1),'') not in ('STOPPED_HELPING','NOT_HELPED_NOW'))
      group by hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hp.lifecycle,hp.risk_class,hp.evidence_class,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail,hv.accessibility,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
    )
    select * from eligible order by from_own_repertoire desc,from_sanctuary desc,(help_id=v_primary) desc,capacity_match_count desc,role_diversity desc,applicability_confidence desc,priority_hint,canonical_code limit v_limit
  loop
    if not exists(select 1 from gf_core.decision_candidates where decision_run_id=v_run and help_id=r.help_id) then
      insert into gf_core.decision_candidates(decision_run_id,person_id,help_id,help_version_id,eligibility_status,reason_key,priority_hint)
      values(v_run,v_person,r.help_id,r.help_version_id,'eligible',case when r.from_own_repertoire then 'moment_constellation_own_repertoire' else 'moment_constellation' end,r.priority_hint);
    end if;
    if not exists(select 1 from gf_core.candidate_exposures where decision_run_id=v_run and person_id=v_person and help_id=r.help_id) then
      v_rank:=v_rank+1; insert into gf_core.candidate_exposures(decision_run_id,person_id,help_id,help_version_id,display_rank) values(v_run,v_person,r.help_id,r.help_version_id,v_rank);
    end if;
    if jsonb_array_length(v_result)=0 then
      if r.from_own_repertoire then v_kind:='REUSE_REPERTOIRE';v_withdraw:=true;
      elsif v_memory and exists(select 1 from gf_core.outcomes_feedback o join gf_core.help_selections sel on sel.selection_id=o.selection_id where o.person_id=v_person and sel.help_id=r.help_id and o.effect='helped') then v_kind:='REPEAT';end if;
    end if;
    v_result:=v_result || jsonb_build_array(jsonb_build_object(
      'help_id',r.help_id,'help_version_id',r.help_version_id,'canonical_code',r.canonical_code,'help_type',r.help_type,'lifecycle',r.lifecycle,'risk_class',r.risk_class,'evidence_class',r.evidence_class,
      'title',r.title,'summary',r.summary,'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail,'accessibility',r.accessibility,
      'provider',jsonb_build_object('name',r.provider_name,'kind',r.provider_kind,'provenance',r.provider_provenance,'rights',r.provider_rights),
      'areas',to_jsonb(r.matched_area_keys),'capacities',to_jsonb(r.matched_capacity_keys),'cultivation_roles',to_jsonb(coalesce(r.cultivation_roles,'{}'::text[])),'cultivation_vocab_version','cultivation.v1','taxonomy_version','life-taxonomy.v1',
      'primary_now',jsonb_array_length(v_result)=0,'context_origin',case when r.from_own_repertoire then 'propio' when r.from_sanctuary then 'santuario' when r.help_type in ('professional_support','institutional_service','conversation') then 'tejido' else 'fuente' end,
      'decision_kind',v_kind,'context_reason',case when r.from_own_repertoire then 'Lo reconociste como propio y se relaciona con lo que expresaste hoy.' when v_kind='REPEAT' then 'Esto te ayudó antes y se relaciona con este Momento.' when r.from_sanctuary then 'Elegiste conservarlo y puede volver a servirte ahora.' when r.help_type in ('professional_support','institutional_service','conversation') then 'Una forma de acompañamiento humano relacionada con este Momento.' else 'Una posibilidad relacionada con lo que expresaste hoy.' end,'from_own_repertoire',r.from_own_repertoire,'applicability_confidence',r.applicability_confidence));
    if v_withdraw then exit;end if;
  end loop;
  if jsonb_array_length(v_result)=0 then v_kind:='NO_MATCH';end if;
  select hp.help_id into v_control from gf_core.help_applicability ha join gf_core.help_versions hv on hv.help_version_id=ha.help_version_id join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version where hp.lifecycle in('active_limited','active') and ha.state in('applicable','partial') and ha.area_key=any(v_areas) and ha.capacity_key=any(v_caps) group by hp.help_id,hp.canonical_code order by count(distinct ha.capacity_key) desc,max(ha.applicability_confidence) desc,min(ha.priority_hint),hp.canonical_code limit 1;
  update gf_core.decision_runs set decision_kind=v_kind,decision_reason_key=case when v_withdraw then 'own_resource_sufficient' else decision_reason_key end,
    continuity_context=continuity_context || jsonb_build_object('memory_used',v_memory,'elegida_por',case when v_withdraw then 'repertorio' else 'motor' end,'lumi_withdrawn',v_withdraw,
    'experiment',jsonb_build_object('version','continuity.shadow.v1','arm','live','control_help_id',v_control,'live_help_id',v_result->0->>'help_id','outcome_pending',true),
    'facets_frozen',jsonb_build_object('area_keys',v_areas,'capacity_keys',v_caps)) where decision_run_id=v_run and person_id=v_person;
  perform gf_private.emit_person_event('AccompanimentAdapted','episode',p_episode_id,v_person,v_trace,'s1.a63.v62',jsonb_build_object('decision_run_id',v_run,'decision_kind',v_kind,'help_id',v_result->0->>'help_id','lumi_withdrawn',v_withdraw,'memory_used',v_memory));
  select event_id into v_event from gf_ledger.domain_events where person_pseudonym=v_person and trace_id=v_trace and event_type='AccompanimentAdapted' order by occurred_at desc limit 1;
  perform gf_private.emit_person_event('MomentConstellationExposed','episode',p_episode_id,v_person,v_trace,'s1.a63.v60',jsonb_build_object('decision_run_id',v_run,'item_count',jsonb_array_length(v_result),'capacity_keys',to_jsonb(v_caps),'area_keys',to_jsonb(v_areas),'user_adjusted_capacities',p_capacity_keys is not null));
  return jsonb_build_object('episode_id',p_episode_id,'moment_id',v_moment,'decision_run_id',v_run,'decision_kind',v_kind,'lumi_withdrawn',v_withdraw,'evidence_event_id',v_event,'continuity_message',case when v_withdraw then 'Esto ya es tuyo. Empecemos por lo que reconociste: hoy puedo ocupar menos lugar.' when v_kind='REPEAT' then 'Esto te ayudó antes. Podés volver a probarlo o elegir otra forma.' else null end,'state',case when jsonb_array_length(v_result)>0 then 'success' else 'no_match' end,'items',v_result,'capacity_keys',to_jsonb(v_caps),'area_keys',to_jsonb(v_areas),'trace_id',v_trace);
end $function$;


