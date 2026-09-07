-- A44 · Certificación transversal de integridad canónica del Embrión
-- Authority set: V37 / V39 / V40 / V41 / V43
-- This policy is intentionally small: it records the certification state already
-- earned by the canonical-integrity manifest and pre-certification gates.

do $$
declare
  v_policy_version_id uuid;
  v_config jsonb := jsonb_build_object(
    'status', 'certified',
    'scope', 'embryo_birth',
    'certification_act', 'A44',
    'authority_set', jsonb_build_array('V37','V39','V40','V41','V43'),
    'contract_count', 18,
    'blocking_contracts', 0
  );
  v_evidence jsonb := jsonb_build_object(
    'manifest', 'governance/canonical-integrity-contracts.json',
    'pull_request', 4,
    'pre_certification_ci_run', 97,
    'pre_certification_head', 'bbfaba088f8bcca38575a8f15a92337631e833a8',
    'pre_certification_gates', jsonb_build_array(
      'Conduction Gate PASS',
      'production dependency audit PASS',
      'architecture/unit 32/32 PASS',
      'lint PASS',
      'build PASS',
      'Playwright 7/7 PASS'
    ),
    'live_checks', jsonb_build_array(
      'exact original expression private/revocable PASS',
      'raw original absent from Ledger PASS',
      'Santuario sovereignty PASS',
      'repertoire continuity PASS',
      'LIFE inference envelope present'
    )
  );
begin
  insert into gf_private.policy_versions(
    policy_key, version, config, status, evidence_summary, created_by
  ) values (
    'canonical_integrity', 1, v_config, 'active', v_evidence, 'A44'
  )
  on conflict (policy_key, version) do update
    set config = excluded.config,
        status = 'active',
        evidence_summary = excluded.evidence_summary,
        created_by = excluded.created_by
  returning policy_version_id into v_policy_version_id;

  update gf_private.policy_versions
     set status = 'retired'
   where policy_key = 'canonical_integrity'
     and version <> 1
     and status = 'active';

  insert into gf_private.runtime_policies(
    policy_key, policy_version_id, version, config, updated_at
  ) values (
    'canonical_integrity', v_policy_version_id, 1, v_config, now()
  )
  on conflict (policy_key) do update
    set policy_version_id = excluded.policy_version_id,
        version = excluded.version,
        config = excluded.config,
        updated_at = excluded.updated_at;
end $$;
