-- VA+LUMEN · PRELAUNCH RESET · GREENFIELD EMBRYO
--
-- PURPOSE
--   Remove every construction/test trace before the first real person enters LUMEN,
--   while preserving curated Source+, its provenance/lifecycle, and the baseline
--   Knowledge/Evolution policy required by embryo.v0.4.
--
-- IMPORTANT
--   This is an OPERATOR RUNBOOK, NOT A MIGRATION. Never add it to automated deploys.
--   It intentionally fails unless the operator explicitly sets the confirmation
--   token in the SAME SQL session immediately before running this file:
--
--     set app.prelaunch_reset_confirm = 'ERASE_SYNTHETIC_GREENFIELD';
--
--   Do not run for construction Preview. Run once immediately before admitting
--   real users, then certify the post-reset assertions at the bottom.

begin;

do $$
begin
  if coalesce(current_setting('app.prelaunch_reset_confirm', true), '') <> 'ERASE_SYNTHETIC_GREENFIELD' then
    raise exception 'PRELAUNCH RESET BLOCKED: explicit confirmation token is missing';
  end if;
end $$;

-- User-owned activity. CASCADE follows person ownership into Momento,
-- accompaniment, continuity, paths, repertoire, Circles and proactivity without
-- touching Source reference tables that are only referenced by those records.
truncate table gf_core.persons cascade;

-- Sensitive/operational construction traces not owned directly by a person FK.
truncate table
  gf_private.sanctuary_entries,
  gf_private.sanctuary_private_stub,
  gf_private.evidence_units,
  gf_private.claim_evidence,
  gf_private.knowledge_claims,
  gf_private.change_executions,
  gf_private.rollback_records,
  gf_private.circle_invites,
  gf_private.safety_incidents,
  gf_private.external_observations,
  gf_private.job_runs,
  gf_private.cost_events,
  gf_private.provider_runtime_status,
  gf_private.source_intake_candidates
cascade;

-- Construction audit/outbox can contain pseudonymous test traces. Source
-- lifecycle history is deliberately preserved because it is reference provenance.
truncate table gf_ledger.domain_events, gf_ledger.outbox;

-- This project is greenfield-isolated. At prelaunch there must be no real Auth
-- identities yet; remove any synthetic identities left by manual testing.
delete from auth.users;

-- Protect the reference corpus and baseline evolution contract. These assertions
-- fail the transaction if a reset would leave the embryo without its seed.
do $$
declare
  v_source integer;
  v_providers integer;
  v_runtime integer;
  v_policy integer;
  v_people integer;
  v_auth integer;
begin
  select count(*) into v_source
  from gf_core.help_possibilities
  where lifecycle in ('active_limited','active');

  select count(*) into v_providers from gf_core.providers;
  select count(*) into v_runtime from gf_private.runtime_policies;
  select count(*) into v_policy from gf_private.policy_versions;
  select count(*) into v_people from gf_core.persons;
  select count(*) into v_auth from auth.users;

  if v_people <> 0 or v_auth <> 0 then
    raise exception 'PRELAUNCH RESET FAILED: user identities remain (persons %, auth %)', v_people, v_auth;
  end if;
  if v_source < 16 then
    raise exception 'PRELAUNCH RESET FAILED: curated Source was damaged (% active)', v_source;
  end if;
  if v_providers < 5 then
    raise exception 'PRELAUNCH RESET FAILED: Source provenance providers were damaged (%)', v_providers;
  end if;
  if v_runtime < 1 or v_policy < 1 then
    raise exception 'PRELAUNCH RESET FAILED: baseline evolution policy was damaged';
  end if;
end $$;

commit;

-- POST-RESET CERTIFICATION (expected: zero activity, Source intact)
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from gf_core.persons) as persons,
  (select count(*) from gf_core.moments) as moments,
  (select count(*) from gf_core.outcomes_feedback) as outcomes,
  (select count(*) from gf_core.trajectories) as trajectories,
  (select count(*) from gf_private.sanctuary_entries) as sanctuary_entries,
  (select count(*) from gf_core.interaction_spaces) as circles,
  (select count(*) from gf_core.followups) as followups,
  (select count(*) from gf_ledger.domain_events) as ledger_events,
  (select count(*) from gf_core.help_possibilities where lifecycle in ('active_limited','active')) as source_active,
  (select count(*) from gf_core.providers) as source_providers;
