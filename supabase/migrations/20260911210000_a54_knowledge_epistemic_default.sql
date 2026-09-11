-- A54 · Knowledge/Evolution must be able to propose a versioned policy from eligible evidence.
-- The K0..K5 constraint had drifted away from an E0 default, making every new claim fail.

alter table gf_private.knowledge_claims
  alter column epistemic_level set default 'K0';

create or replace function gf_private.create_policy_version(
  p_policy_key text,
  p_config jsonb,
  p_evidence_ids uuid[],
  p_claim_key text,
  p_claim_statement text,
  p_actor text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_claim uuid;
  v_policy uuid;
  v_version integer;
  v_e uuid;
begin
  if coalesce(array_length(p_evidence_ids,1),0)=0 then
    raise exception 'evidence required';
  end if;

  foreach v_e in array p_evidence_ids loop
    if not exists(
      select 1
      from gf_private.evidence_units
      where evidence_unit_id=v_e
        and learning_eligible
    ) then
      raise exception 'eligible evidence not found';
    end if;
  end loop;

  insert into gf_private.knowledge_claims(
    claim_key, statement, status, confidence, scope,
    epistemic_level, uncertainty, contradictions, provenance
  )
  values(
    p_claim_key,
    p_claim_statement,
    'hypothesis',
    0.5,
    jsonb_build_object('policy_key',p_policy_key),
    'K0',
    jsonb_build_object('status','provisional'),
    '[]'::jsonb,
    jsonb_build_object('created_by',p_actor,'source','governed_policy_proposal')
  )
  on conflict(claim_key) do update
    set statement=excluded.statement,
        scope=excluded.scope,
        provenance=gf_private.knowledge_claims.provenance || excluded.provenance,
        updated_at=now()
  returning claim_id into v_claim;

  foreach v_e in array p_evidence_ids loop
    insert into gf_private.claim_evidence(claim_id,evidence_unit_id)
    values(v_claim,v_e)
    on conflict do nothing;
  end loop;

  select coalesce(max(version),0)+1
  into v_version
  from gf_private.policy_versions
  where policy_key=p_policy_key;

  insert into gf_private.policy_versions(
    policy_key,version,config,status,evidence_summary,created_by
  )
  values(
    p_policy_key,
    v_version,
    p_config,
    'candidate',
    jsonb_build_object(
      'claim_id',v_claim,
      'evidence_count',array_length(p_evidence_ids,1),
      'epistemic_level','K0'
    ),
    p_actor
  )
  returning policy_version_id into v_policy;

  insert into gf_ledger.domain_events(
    event_type,aggregate_type,aggregate_id,actor_type,actor_id,
    trace_id,contract_version,payload,provenance
  )
  values(
    'PolicyVersionProposed','policy_version',v_policy,'operator',p_actor,
    gen_random_uuid(),'s4.v49.1',
    jsonb_build_object(
      'policy_key',p_policy_key,
      'version',v_version,
      'evidence_count',array_length(p_evidence_ids,1),
      'epistemic_level','K0'
    ),
    jsonb_build_object('claim_id',v_claim)
  );

  return v_policy;
end
$function$;
