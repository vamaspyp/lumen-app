-- A60 final certification metadata: preserve v6 history and publish the exact 20-contract V1.1 manifest.
do $$
declare
  v_previous gf_private.policy_versions%rowtype;
  v_policy_id uuid;
  v_config jsonb:=jsonb_build_object(
    'scope','embryo_birth','status','integrally_certified',
    'authority_set',jsonb_build_array('V46','V51','V52','V53','V40','V41','V43'),
    'contract_count',20,'certification_act','A60','blocking_contracts',0,
    'bidirectional_matrix',jsonb_build_object('spec_to_runtime',30,'runtime_to_spec',20),
    'release_contract','embryo.v53.1','longitudinal_birth_proof','PASS','constellation_seed_capabilities',5
  );
begin
  select * into v_previous from gf_private.policy_versions where policy_key='canonical_integrity' and status='active' order by version desc limit 1 for update;
  update gf_private.policy_versions set status='retired' where policy_key='canonical_integrity' and status='active';
  insert into gf_private.policy_versions(policy_key,version,config,status,evidence_summary,created_by)
  values('canonical_integrity',7,v_config,'active',jsonb_build_object(
    'authority_basis',v_config->'authority_set','act','A60',
    'correction','v6 preserved as historical certification draft; v7 aligns contract and bidirectional matrix counts to final manifest',
    'longitudinal_e2e','PASS','source_constellation_depth','PASS','raw_private_text_in_certification_events',false,'prelaunch_reset_required',true),'A60')
  returning policy_version_id into v_policy_id;
  insert into gf_private.change_executions(policy_key,from_policy_version_id,to_policy_version_id,from_version,from_config,executed_by)
  values('canonical_integrity',v_previous.policy_version_id,v_policy_id,v_previous.version,v_previous.config,'A60');
  insert into gf_private.runtime_policies(policy_key,policy_version_id,version,config,updated_at)
  values('canonical_integrity',v_policy_id,7,v_config,now())
  on conflict(policy_key) do update set policy_version_id=excluded.policy_version_id,version=excluded.version,config=excluded.config,updated_at=now();
  insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,trace_id,contract_version,payload,provenance)
  values('CanonicalIntegrityCertified','policy_version',v_policy_id,'operator','A60',gen_random_uuid(),'governance.v53.1',
    jsonb_build_object('policy_key','canonical_integrity','version',7,'status','integrally_certified','authority_set',v_config->'authority_set','release_contract','embryo.v53.1','contract_count',20,'blocking_contracts',0),
    jsonb_build_object('source','Sistema de Conducción V3','act','A60','supersedes_policy_version',6));
end $$;