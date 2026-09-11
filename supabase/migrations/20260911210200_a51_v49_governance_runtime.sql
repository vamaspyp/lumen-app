-- A51 · runtime governance must express the same current authority chain as POV/repo.
-- This is a structural governance update, not an empirical learning policy.

do $$
declare
  v_previous gf_private.runtime_policies%rowtype;
  v_policy_id uuid;
  v_execution uuid;
  v_config jsonb:=jsonb_build_object(
    'scope','embryo_birth',
    'status','reconciling',
    'authority_set',jsonb_build_array('V46','V48','V49','V40','V41','V43'),
    'contract_count',18,
    'certification_act','A51',
    'blocking_contracts',0
  );
begin
  select * into v_previous from gf_private.runtime_policies where policy_key='canonical_integrity' for update;

  select policy_version_id into v_policy_id
  from gf_private.policy_versions
  where policy_key='canonical_integrity' and version=3;

  if v_policy_id is null then
    update gf_private.policy_versions set status='retired'
    where policy_key='canonical_integrity' and status='active';

    insert into gf_private.policy_versions(policy_key,version,config,status,evidence_summary,created_by)
    values(
      'canonical_integrity',
      3,
      v_config,
      'active',
      jsonb_build_object('authority_basis',jsonb_build_array('V46','V48','V49','V40','V41','V43'),'act','A51'),
      'A51'
    ) returning policy_version_id into v_policy_id;

    insert into gf_private.change_executions(policy_key,from_policy_version_id,to_policy_version_id,from_version,from_config,executed_by)
    values('canonical_integrity',v_previous.policy_version_id,v_policy_id,v_previous.version,v_previous.config,'A51')
    returning execution_id into v_execution;

    insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,trace_id,contract_version,payload,provenance)
    values(
      'PolicyVersionActivated','policy_version',v_policy_id,'operator','A51',gen_random_uuid(),'governance.v49.1',
      jsonb_build_object('policy_key','canonical_integrity','version',3,'status','reconciling','authority_set',v_config->'authority_set'),
      jsonb_build_object('source','Sistema de Conducción V3','act','A51')
    );
  end if;

  insert into gf_private.runtime_policies(policy_key,policy_version_id,version,config,updated_at)
  values('canonical_integrity',v_policy_id,3,v_config,now())
  on conflict(policy_key) do update
    set policy_version_id=excluded.policy_version_id,
        version=excluded.version,
        config=excluded.config,
        updated_at=now();
end $$;
