-- A60 · Existing Source and Now surfaces become longitudinal without a new screen.

create or replace function public.lumen_source_discover(p_area_key text default null,p_capacity_key text default null,p_help_type text default null,p_locale text default 'es-AR',p_limit integer default 24)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_result jsonb;v_limit integer:=greatest(1,least(coalesce(p_limit,24),50));v_external_boost integer:=0;
begin
 -- A capacity without an explicit form asks Source for a diverse constellation, not a flat ranked slice.
 if p_capacity_key is not null and p_help_type is null then
   return public.lumen_source_constellation(p_capacity_key,p_area_key,p_locale,least(v_limit,32));
 end if;
 select coalesce((config->>'external_boost')::integer,0) into v_external_boost from gf_private.runtime_policies where policy_key='source_discovery';
 select coalesce(jsonb_agg(x.item order by x.effective_priority,x.title),'[]'::jsonb) into v_result from(
  select coalesce(nullif(hv.detail->>'browse_priority','')::integer,coalesce(min(ha.priority_hint),100))+case when pr.provider_kind='internal_curated' then 0 else v_external_boost end effective_priority,hl.title,
   jsonb_build_object('help_id',hp.help_id,'canonical_code',hp.canonical_code,'help_type',hp.help_type,'lifecycle',hp.lifecycle,'risk_class',hp.risk_class,'evidence_class',hp.evidence_class,'title',hl.title,'summary',hl.summary,'content',hl.content_payload,'duration_minutes',hv.duration_minutes,'energy',hv.energy,'accessibility',hv.accessibility,'provider',jsonb_build_object('name',pr.display_name,'kind',pr.provider_kind,'provenance',pr.provenance,'rights',pr.rights),'areas',coalesce(jsonb_agg(distinct ha.area_key) filter(where ha.area_key is not null),'[]'::jsonb),'capacities',coalesce(jsonb_agg(distinct ha.capacity_key) filter(where ha.capacity_key is not null),'[]'::jsonb),'taxonomy_version','life-taxonomy.v1','localization_provenance',hl.provenance) item
  from gf_core.help_possibilities hp join gf_core.providers pr on pr.provider_id=hp.provider_id join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version
  join lateral(select h.* from gf_core.help_localizations h where h.help_version_id=hv.help_version_id order by case when h.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0 when left(h.locale,2)=left(coalesce(nullif(trim(p_locale),''),'es-AR'),2) then 1 when h.locale='es-AR' then 2 else 3 end limit 1) hl on true
  left join gf_core.help_applicability ha on ha.help_version_id=hv.help_version_id and ha.state in('applicable','partial') and ha.taxonomy_version='life-taxonomy.v1'
  where hp.lifecycle in('active_limited','active') and (p_help_type is null or hp.help_type=p_help_type)
   and (p_area_key is null or exists(select 1 from gf_core.help_applicability a where a.help_version_id=hv.help_version_id and a.taxonomy_version='life-taxonomy.v1' and a.state in('applicable','partial') and a.area_key=p_area_key and (p_capacity_key is null or a.capacity_key=p_capacity_key)))
   and (p_area_key is not null or p_capacity_key is null or exists(select 1 from gf_core.help_applicability a where a.help_version_id=hv.help_version_id and a.taxonomy_version='life-taxonomy.v1' and a.state in('applicable','partial') and a.capacity_key=p_capacity_key))
  group by hp.help_id,hp.canonical_code,hp.help_type,hp.lifecycle,hp.risk_class,hp.evidence_class,hv.help_version_id,hv.detail,hv.duration_minutes,hv.energy,hv.accessibility,hl.title,hl.summary,hl.content_payload,hl.provenance,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
  order by effective_priority,hl.title limit v_limit)x;
 return v_result;
end $$;

create or replace function public.lumen_s1_record_outcome(p_episode_id uuid,p_effect text,p_applied boolean,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_person uuid:=gf_core.current_person_id();v_effect text:=lower(trim(p_effect));v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_selection gf_core.help_selections%rowtype;v_signal text;v_rep uuid;
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if v_effect not in('helped','not_helped','unsure') then raise exception 'invalid effect' using errcode='22023';end if;
 select * into v_selection from gf_core.help_selections where episode_id=p_episode_id and person_id=v_person and action='selected' order by created_at desc limit 1;
 if not found then raise exception 'selected help unavailable' using errcode='42501';end if;
 select repertoire_id into v_rep from gf_core.personal_repertoire where person_id=v_person and help_id=v_selection.help_id and status='active' and user_confirmed=true;
 v_signal:=case when v_effect='helped' and v_rep is not null then 'REUSED' when v_effect='helped' then 'HELPED_NOW' when v_effect='not_helped' then 'NOT_HELPED_NOW' else 'UNKNOWN' end;
 perform set_config('app.trace_id',v_trace::text,true);
 insert into gf_core.outcomes_feedback(episode_id,person_id,selection_id,effect,applied,signal_kind,signal_context)
 values(p_episode_id,v_person,v_selection.selection_id,v_effect,p_applied,v_signal,case when v_rep is not null then jsonb_build_object('repertoire_id',v_rep,'natural_return',true) else '{}'::jsonb end);
 if v_rep is not null then update gf_core.personal_repertoire set times_reused=times_reused+1,last_used_at=now(),updated_at=now() where repertoire_id=v_rep;end if;
 update gf_core.accompaniment_episodes set status='completed',completed_at=now() where episode_id=p_episode_id and person_id=v_person;
 if v_signal='REUSED' then perform gf_private.emit_person_event('RepertoireReused','repertoire',v_rep,v_person,v_trace,'s2.v53.1',jsonb_build_object('episode_id',p_episode_id,'help_id',v_selection.help_id,'selection_id',v_selection.selection_id,'natural_return',true));end if;
 return jsonb_build_object('selection_id',v_selection.selection_id,'episode_id',p_episode_id,'effect',v_effect,'signal_kind',v_signal,'applied',p_applied,'repertoire_id',v_rep,'trace_id',v_trace,'semantic_key',case when v_signal='REUSED' then 'outcome.repertoire_helped_again' else 'outcome.thank_and_release' end);
end $$;
