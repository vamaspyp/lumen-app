-- A46 · Operational health must report the active canonical-integrity policy, never a retired row.
create or replace function public.lumen_embryo_health()
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
declare
  v_source integer;
  v_applicability integer;
  v_types integer;
  v_policy integer;
  v_provider_ready integer;
  v_integrity_status text;
  v_integrity_version integer;
  v_authority_set jsonb;
  v_state text;
begin
  select count(*) into v_source
  from gf_core.help_possibilities
  where lifecycle in('active_limited','active');

  select count(*) into v_applicability
  from gf_core.help_applicability
  where state in('applicable','partial');

  select count(distinct help_type) into v_types
  from gf_core.help_possibilities
  where lifecycle in('active_limited','active');

  select version into v_policy
  from gf_private.runtime_policies
  where policy_key='source_discovery'
    and status='active'
  order by version desc
  limit 1;

  select count(*) into v_provider_ready
  from gf_private.provider_runtime_status
  where status='ready';

  select config->>'status',version,config->'authority_set'
  into v_integrity_status,v_integrity_version,v_authority_set
  from gf_private.runtime_policies
  where policy_key='canonical_integrity'
    and status='active'
  order by version desc
  limit 1;

  v_integrity_status:=coalesce(v_integrity_status,'uncertified');
  v_authority_set:=coalesce(v_authority_set,'[]'::jsonb);

  v_state:=case
    when v_source>=16
      and v_applicability>=18
      and v_types>=4
      and v_integrity_status in('certified','integrally_certified')
    then 'operational'
    else 'forming'
  end;

  return jsonb_build_object(
    'state',v_state,
    'release_contract','embryo.v49.1',
    'slices',jsonb_build_object(
      's0','implemented','s1','implemented','s2','implemented','s3','implemented',
      's4','implemented','s5','implemented','s6','implemented','s7','implemented'
    ),
    'canonical_integrity',jsonb_build_object(
      'status',v_integrity_status,
      'version',v_integrity_version,
      'authority_set',v_authority_set
    ),
    'source',jsonb_build_object(
      'active_possibilities',v_source,
      'applicability_relations',v_applicability,
      'semantic_types',v_types,
      'taxonomy_version','life-taxonomy.v1',
      'coverage_contract','coverage.eval.v1'
    ),
    'evolution',jsonb_build_object('source_policy_version',coalesce(v_policy,1)),
    'operations',jsonb_build_object('providers_ready',v_provider_ready),
    'prelaunch_reset_required',true
  );
end
$function$;
