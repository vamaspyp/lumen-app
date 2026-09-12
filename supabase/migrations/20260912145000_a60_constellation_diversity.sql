-- A60 · Constellation is a diverse projection, not a ranked catalogue slice.
create or replace function public.lumen_source_constellation(
  p_capacity_key text,
  p_area_key text default null,
  p_locale text default 'es-AR',
  p_limit integer default 16
) returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare v_result jsonb; v_limit integer:=greatest(1,least(coalesce(p_limit,16),32));
begin
 if p_capacity_key is null or not exists(select 1 from gf_core.capacity_terms where taxonomy_version='life-taxonomy.v1' and capacity_key=p_capacity_key and status='active') then
   raise exception 'active capacity required' using errcode='22023';
 end if;
 if p_area_key is not null and not exists(select 1 from gf_core.area_terms where taxonomy_version='life-taxonomy.v1' and area_key=p_area_key and status='active') then
   raise exception 'invalid area' using errcode='22023';
 end if;

 with eligible as (
   select hp.help_id,hv.help_version_id,hp.canonical_code,hp.help_type,hp.lifecycle,hp.risk_class,hp.evidence_class,
          hv.duration_minutes,hv.energy,hv.accessibility,hl.title,hl.summary,hl.content_payload,
          pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance provider_provenance,pr.rights,
          min(ha.priority_hint) priority_hint,
          array_agg(distinct role order by role) filter(where role is not null) cultivation_roles
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
   group by hp.help_id,hv.help_version_id,hp.canonical_code,hp.help_type,hp.lifecycle,hp.risk_class,hp.evidence_class,hv.duration_minutes,hv.energy,hv.accessibility,hl.title,hl.summary,hl.content_payload,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
 ), ranked as (
   select e.*,
          row_number() over(partition by e.help_type order by e.priority_hint,e.title) type_slot,
          row_number() over(partition by e.provider_id order by e.priority_hint,e.title) provider_slot
   from eligible e
 ), picked as (
   select * from ranked
   order by type_slot,provider_slot,priority_hint,title
   limit v_limit
 )
 select coalesce(jsonb_agg(jsonb_build_object(
   'help_id',help_id,'help_version_id',help_version_id,'canonical_code',canonical_code,
   'help_type',help_type,'lifecycle',lifecycle,'risk_class',risk_class,'evidence_class',evidence_class,
   'title',title,'summary',summary,'content',content_payload,'duration_minutes',duration_minutes,'energy',energy,'accessibility',accessibility,
   'provider',jsonb_build_object('name',display_name,'kind',provider_kind,'provenance',provider_provenance,'rights',rights),
   'area_key',p_area_key,'capacity_key',p_capacity_key,
   'cultivation_roles',to_jsonb(coalesce(cultivation_roles,'{}'::text[])),
   'cultivation_vocab_version','cultivation.v1','taxonomy_version','life-taxonomy.v1'
 ) order by type_slot,provider_slot,priority_hint,title),'[]'::jsonb)
 into v_result from picked;
 return v_result;
end $$;
