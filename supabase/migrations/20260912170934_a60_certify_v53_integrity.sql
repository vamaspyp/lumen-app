-- A60 · certify Embrión V1.1 after bidirectional V52/V53 ↔ runtime verification.
do $$
declare
  v_previous gf_private.policy_versions%rowtype;
  v_policy_id uuid;
  v_config jsonb:=jsonb_build_object(
    'scope','embryo_birth',
    'status','integrally_certified',
    'authority_set',jsonb_build_array('V46','V51','V52','V53','V40','V41','V43'),
    'contract_count',18,
    'certification_act','A60',
    'blocking_contracts',0,
    'bidirectional_matrix',jsonb_build_object('spec_to_runtime',30,'runtime_to_spec',18),
    'release_contract','embryo.v53.1',
    'longitudinal_birth_proof','PASS',
    'constellation_seed_capabilities',5
  );
begin
  select * into v_previous from gf_private.policy_versions
  where policy_key='canonical_integrity' and status='active'
  order by version desc limit 1 for update;

  update gf_private.policy_versions set status='retired'
  where policy_key='canonical_integrity' and status='active';

  insert into gf_private.policy_versions(policy_key,version,config,status,evidence_summary,created_by)
  values(
    'canonical_integrity',6,v_config,'active',
    jsonb_build_object(
      'authority_basis',jsonb_build_array('V46','V51','V52','V53','V40','V41','V43'),
      'act','A60',
      'longitudinal_e2e','Moment→Help→HELPED_NOW→Repertoire→APPLY_IN_CONTEXT→longitudinal evidence→consented followup→NO_REMINDER_NEEDED→WITHDRAW',
      'source_depth','5 seed capacities verified with role/type/provider diversity',
      'privacy','Ledger/Evidence trace verified without raw private text',
      'prelaunch_reset_required',true
    ),
    'A60'
  ) returning policy_version_id into v_policy_id;

  insert into gf_private.change_executions(policy_key,from_policy_version_id,to_policy_version_id,from_version,from_config,executed_by)
  values('canonical_integrity',v_previous.policy_version_id,v_policy_id,v_previous.version,v_previous.config,'A60');

  insert into gf_private.runtime_policies(policy_key,policy_version_id,version,config,updated_at)
  values('canonical_integrity',v_policy_id,6,v_config,now())
  on conflict(policy_key) do update set policy_version_id=excluded.policy_version_id,version=excluded.version,config=excluded.config,updated_at=now();

  insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,trace_id,contract_version,payload,provenance)
  values(
    'CanonicalIntegrityCertified','policy_version',v_policy_id,'operator','A60',gen_random_uuid(),'governance.v53.1',
    jsonb_build_object('policy_key','canonical_integrity','version',6,'status','integrally_certified','authority_set',v_config->'authority_set','release_contract','embryo.v53.1','blocking_contracts',0),
    jsonb_build_object('source','Sistema de Conducción V3','act','A60')
  );
end $$;

create or replace function public.lumen_embryo_health()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare
  v_source integer;v_applicability integer;v_types integer;v_policy integer;v_provider_ready integer;
  v_integrity_status text;v_integrity_version integer;v_authority_set jsonb;v_release text;v_state text;
begin
  select count(*) into v_source from gf_core.help_possibilities where lifecycle in('active_limited','active');
  select count(*) into v_applicability from gf_core.help_applicability where state in('applicable','partial');
  select count(distinct help_type) into v_types from gf_core.help_possibilities where lifecycle in('active_limited','active');
  select version into v_policy from gf_private.runtime_policies where policy_key='source_discovery' order by version desc limit 1;
  select count(*) into v_provider_ready from gf_private.provider_runtime_status where status='ready';
  select config->>'status',version,config->'authority_set',config->>'release_contract'
    into v_integrity_status,v_integrity_version,v_authority_set,v_release
  from gf_private.policy_versions where policy_key='canonical_integrity' and status='active' order by version desc limit 1;
  v_integrity_status:=coalesce(v_integrity_status,'uncertified');
  v_authority_set:=coalesce(v_authority_set,'[]'::jsonb);
  v_release:=coalesce(v_release,'embryo.v49.1');
  v_state:=case when v_source>=16 and v_applicability>=18 and v_types>=4 and v_integrity_status in('certified','integrally_certified') then 'operational' else 'forming' end;
  return jsonb_build_object(
    'state',v_state,'release_contract',v_release,
    'slices',jsonb_build_object('s0','implemented','s1','implemented','s2','implemented','s3','implemented','s4','implemented','s5','implemented','s6','implemented','s7','implemented'),
    'canonical_integrity',jsonb_build_object('status',v_integrity_status,'version',v_integrity_version,'authority_set',v_authority_set),
    'source',jsonb_build_object('active_possibilities',v_source,'applicability_relations',v_applicability,'semantic_types',v_types,'taxonomy_version','life-taxonomy.v1','coverage_contract','coverage.eval.v1'),
    'evolution',jsonb_build_object('source_policy_version',coalesce(v_policy,1)),
    'operations',jsonb_build_object('providers_ready',v_provider_ready),
    'prelaunch_reset_required',true
  );
end $$;