-- A63 · Expose canonical premium Source metadata through existing Source contracts.
-- No new anatomy: only enriches existing projections and completes cultivation roles for the witness constellation.

CREATE OR REPLACE FUNCTION public.lumen_source_discover(p_area_key text DEFAULT NULL::text, p_capacity_key text DEFAULT NULL::text, p_help_type text DEFAULT NULL::text, p_locale text DEFAULT 'es-AR'::text, p_limit integer DEFAULT 24)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_result jsonb;v_limit integer:=greatest(1,least(coalesce(p_limit,24),120));v_external_boost integer:=0;
begin
 if p_capacity_key is not null and p_help_type is null then
   return public.lumen_source_constellation(p_capacity_key,p_area_key,'{}'::jsonb,p_locale,least(v_limit,32));
 end if;
 select coalesce((config->>'external_boost')::integer,0) into v_external_boost from gf_private.runtime_policies where policy_key='source_discovery';
 select coalesce(jsonb_agg(x.item order by x.effective_priority,x.title),'[]'::jsonb) into v_result
 from(
   select coalesce(nullif(hv.detail->>'browse_priority','')::integer,coalesce(min(ha.priority_hint),100))+case when pr.provider_kind='internal_curated' then 0 else v_external_boost end effective_priority,
          hl.title,
          jsonb_build_object('help_id',hp.help_id,'canonical_code',hp.canonical_code,'help_type',hp.help_type,'lifecycle',hp.lifecycle,'risk_class',hp.risk_class,'evidence_class',hp.evidence_class,'title',hl.title,'summary',hl.summary,'content',hl.content_payload,'duration_minutes',hv.duration_minutes,'energy',hv.energy,'accessibility',hv.accessibility,'detail',hv.detail,'provider',jsonb_build_object('name',pr.display_name,'kind',pr.provider_kind,'provenance',pr.provenance,'rights',pr.rights),'areas',coalesce(jsonb_agg(distinct ha.area_key) filter(where ha.area_key is not null),'[]'::jsonb),'capacities',coalesce(jsonb_agg(distinct ha.capacity_key) filter(where ha.capacity_key is not null),'[]'::jsonb),'taxonomy_version','life-taxonomy.v1','localization_provenance',hl.provenance) item
   from gf_core.help_possibilities hp
   join gf_core.providers pr on pr.provider_id=hp.provider_id
   join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version
   join lateral(select h.* from gf_core.help_localizations h where h.help_version_id=hv.help_version_id order by case when h.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0 when left(h.locale,2)=left(coalesce(nullif(trim(p_locale),''),'es-AR'),2) then 1 when h.locale='es-AR' then 2 else 3 end limit 1) hl on true
   left join gf_core.help_applicability ha on ha.help_version_id=hv.help_version_id and ha.state in('applicable','partial') and ha.taxonomy_version='life-taxonomy.v1'
   where hp.lifecycle in('active_limited','active')
     and (p_help_type is null or hp.help_type=p_help_type)
     and (p_area_key is null or exists(select 1 from gf_core.help_applicability a where a.help_version_id=hv.help_version_id and a.taxonomy_version='life-taxonomy.v1' and a.state in('applicable','partial') and a.area_key=p_area_key and (p_capacity_key is null or a.capacity_key=p_capacity_key)))
     and (p_area_key is not null or p_capacity_key is null or exists(select 1 from gf_core.help_applicability a where a.help_version_id=hv.help_version_id and a.taxonomy_version='life-taxonomy.v1' and a.state in('applicable','partial') and a.capacity_key=p_capacity_key))
   group by hp.help_id,hp.canonical_code,hp.help_type,hp.lifecycle,hp.risk_class,hp.evidence_class,hv.help_version_id,hv.detail,hv.duration_minutes,hv.energy,hv.accessibility,hl.title,hl.summary,hl.content_payload,hl.provenance,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
   order by effective_priority,hl.title limit v_limit
 )x;
 return v_result;
end $function$


CREATE OR REPLACE FUNCTION public.lumen_source_constellation(p_capacity_key text, p_area_key text DEFAULT NULL::text, p_context jsonb DEFAULT '{}'::jsonb, p_locale text DEFAULT 'es-AR'::text, p_limit integer DEFAULT 16)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
            'title',hl.title,'summary',hl.summary,'content',hl.content_payload,'duration_minutes',hv.duration_minutes,'energy',hv.energy,'accessibility',hv.accessibility,'detail',hv.detail,
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
   group by hp.help_id,hv.help_version_id,hp.canonical_code,hp.help_type,hp.lifecycle,hp.risk_class,hp.evidence_class,hv.duration_minutes,hv.energy,hv.accessibility,hv.detail,hl.title,hl.summary,hl.content_payload,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
   order by role_diversity desc, min(ha.priority_hint), hl.title
   limit v_limit
 ) q;
 return v_result;
end $function$



update gf_core.help_applicability ha
set cultivation_roles = x.roles::text[],
    cultivation_vocab_version='cultivation.v1',
    updated_at=now()
from gf_core.help_versions hv
join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version
join (values
  ('paho_grounding_audio_es', array['PRACTICE','APPLY','SUSTAIN']),
  ('paho_leave_space_audio_es', array['PRACTICE','INTEGRATE']),
  ('plum_village_mindful_breathing_es', array['PRACTICE','REFLECT','SUSTAIN']),
  ('marcus_aurelius_meditations_pd_es', array['UNDERSTAND','REFLECT','INTEGRATE']),
  ('bbva_castellanos_breathing_brain_es', array['UNDERSTAND','REFLECT']),
  ('medlineplus_anxiety_es', array['UNDERSTAND','CONNECT'])
) as x(code,roles) on x.code=hp.canonical_code
where ha.help_version_id=hv.help_version_id
  and ha.taxonomy_version='life-taxonomy.v1'
  and ha.capacity_key='regulation';
