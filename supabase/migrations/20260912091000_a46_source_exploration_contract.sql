-- A46 · Source exploration contract: dynamic semantic forms + realization metadata.
-- Additive public contract evolution; no new domain entity.

create or replace function public.lumen_source_taxonomy()
returns jsonb
language sql
stable security definer
set search_path to ''
as $function$
select jsonb_build_object(
  'taxonomy_version','life-taxonomy.v1',
  'areas',coalesce((
    select jsonb_agg(jsonb_build_object('key',area_key,'label',display_name) order by display_name)
    from gf_core.area_terms
    where taxonomy_version='life-taxonomy.v1' and status='active'
  ),'[]'::jsonb),
  'capacities',coalesce((
    select jsonb_agg(jsonb_build_object('key',capacity_key,'label',display_name) order by display_name)
    from gf_core.capacity_terms
    where taxonomy_version='life-taxonomy.v1' and status='active'
  ),'[]'::jsonb),
  'help_types',coalesce((
    select jsonb_agg(jsonb_build_object(
      'key',help_type,
      'label',case help_type
        when 'practice' then 'Práctica'
        when 'reflection' then 'Reflexión'
        when 'reading' then 'Lectura'
        when 'external_resource' then 'Recurso externo'
        when 'human_action' then 'Acción humana'
        when 'conversation' then 'Conversación'
        when 'tool' then 'Herramienta'
        when 'question' then 'Pregunta'
        when 'professional_support' then 'Apoyo profesional'
        when 'institutional_service' then 'Servicio institucional'
        else initcap(replace(help_type,'_',' '))
      end
    ) order by help_type)
    from (
      select distinct hp.help_type
      from gf_core.help_possibilities hp
      where hp.lifecycle in ('active_limited','active')
    ) t
  ),'[]'::jsonb)
);
$function$;

create or replace function public.lumen_source_discover(
  p_area_key text default null,
  p_capacity_key text default null,
  p_help_type text default null,
  p_locale text default 'es-AR',
  p_limit integer default 24
) returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
declare
  v_result jsonb;
  v_limit integer:=greatest(1,least(coalesce(p_limit,24),50));
  v_external_boost integer:=0;
begin
  select coalesce((config->>'external_boost')::integer,0)
  into v_external_boost
  from gf_private.runtime_policies
  where policy_key='source_discovery';

  select coalesce(jsonb_agg(x.item order by x.effective_priority,x.title),'[]'::jsonb)
  into v_result
  from (
    select
      coalesce(min(ha.priority_hint),100)+case when pr.provider_kind='internal_curated' then 0 else v_external_boost end effective_priority,
      hl.title,
      jsonb_build_object(
        'help_id',hp.help_id,
        'canonical_code',hp.canonical_code,
        'help_type',hp.help_type,
        'lifecycle',hp.lifecycle,
        'risk_class',hp.risk_class,
        'evidence_class',hp.evidence_class,
        'title',hl.title,
        'summary',hl.summary,
        'content',hl.content_payload,
        'duration_minutes',hv.duration_minutes,
        'energy',hv.energy,
        'accessibility',hv.accessibility,
        'provider',jsonb_build_object('name',pr.display_name,'kind',pr.provider_kind,'provenance',pr.provenance,'rights',pr.rights),
        'areas',coalesce(jsonb_agg(distinct ha.area_key) filter(where ha.area_key is not null),'[]'::jsonb),
        'capacities',coalesce(jsonb_agg(distinct ha.capacity_key) filter(where ha.capacity_key is not null),'[]'::jsonb),
        'taxonomy_version','life-taxonomy.v1',
        'localization_provenance',hl.provenance
      ) item
    from gf_core.help_possibilities hp
    join gf_core.providers pr on pr.provider_id=hp.provider_id
    join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version
    join lateral(
      select h.*
      from gf_core.help_localizations h
      where h.help_version_id=hv.help_version_id
      order by case
        when h.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0
        when left(h.locale,2)=left(coalesce(nullif(trim(p_locale),''),'es-AR'),2) then 1
        when h.locale='es-AR' then 2
        else 3 end
      limit 1
    ) hl on true
    left join gf_core.help_applicability ha
      on ha.help_version_id=hv.help_version_id
     and ha.state in('applicable','partial')
     and ha.taxonomy_version='life-taxonomy.v1'
    where hp.lifecycle in('active_limited','active')
      and (p_help_type is null or hp.help_type=p_help_type)
      and (p_area_key is null or exists(
        select 1 from gf_core.help_applicability a
        where a.help_version_id=hv.help_version_id
          and a.taxonomy_version='life-taxonomy.v1'
          and a.state in('applicable','partial')
          and a.area_key=p_area_key
          and (p_capacity_key is null or a.capacity_key=p_capacity_key)
      ))
      and (p_area_key is not null or p_capacity_key is null or exists(
        select 1 from gf_core.help_applicability a
        where a.help_version_id=hv.help_version_id
          and a.taxonomy_version='life-taxonomy.v1'
          and a.state in('applicable','partial')
          and a.capacity_key=p_capacity_key
      ))
    group by hp.help_id,hp.canonical_code,hp.help_type,hp.lifecycle,hp.risk_class,hp.evidence_class,
      hv.help_version_id,hv.duration_minutes,hv.energy,hv.accessibility,
      hl.title,hl.summary,hl.content_payload,hl.provenance,
      pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
    order by effective_priority,hl.title
    limit v_limit
  ) x;
  return v_result;
end
$function$;
