-- VA+LUMEN V0.4 · S7 readiness after integrated certification
-- Marks the Embryo Integration slice closed while keeping the prelaunch reset gate explicit.

create or replace function public.lumen_embryo_health()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare
  v_source integer;
  v_coverage integer;
  v_types integer;
  v_policy integer;
  v_provider_ready integer;
  v_state text;
begin
  select count(*) into v_source
  from gf_core.help_possibilities
  where lifecycle in ('active_limited','active');

  select count(*) into v_coverage
  from gf_core.coverage_cells
  where status in ('covered','partial');

  select count(distinct help_type) into v_types
  from gf_core.help_possibilities
  where lifecycle in ('active_limited','active');

  select version into v_policy
  from gf_private.runtime_policies
  where policy_key='source_discovery';

  select count(*) into v_provider_ready
  from gf_private.provider_runtime_status
  where status='ready';

  v_state := case
    when v_source >= 16 and v_coverage >= 18 and v_types >= 4 then 'operational'
    else 'forming'
  end;

  return jsonb_build_object(
    'state', v_state,
    'release_contract', 'embryo.v0.4',
    'slices', jsonb_build_object(
      's0','closed','s1','closed','s2','closed','s3','closed',
      's4','closed','s5','closed','s6','closed','s7','closed'
    ),
    'source', jsonb_build_object(
      'active_possibilities',v_source,
      'coverage_cells',v_coverage,
      'semantic_types',v_types
    ),
    'evolution', jsonb_build_object('source_policy_version',coalesce(v_policy,1)),
    'operations', jsonb_build_object('providers_ready',v_provider_ready),
    'prelaunch_reset_required', true
  );
end $$;

revoke execute on function public.lumen_embryo_health() from public;
grant execute on function public.lumen_embryo_health() to anon,authenticated;
