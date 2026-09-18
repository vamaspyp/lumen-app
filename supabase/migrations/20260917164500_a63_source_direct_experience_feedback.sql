create or replace function public.lumen_source_begin_experience(
  p_help_id uuid,
  p_locale text default 'es-AR',
  p_language text default 'es',
  p_trace_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_person uuid := gf_core.current_person_id();
  v_trace uuid := coalesce(p_trace_id, gen_random_uuid());
  v_help_version uuid;
  v_moment uuid;
  v_episode uuid;
  v_decision uuid;
  v_selection uuid;
begin
  if v_person is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select hv.help_version_id
    into v_help_version
  from gf_core.help_possibilities hp
  join gf_core.help_versions hv
    on hv.help_id = hp.help_id
   and hv.version = hp.current_version
  where hp.help_id = p_help_id
    and hp.lifecycle = 'active_limited'
  limit 1;

  if v_help_version is null then
    raise exception 'help unavailable' using errcode = '22023';
  end if;

  perform set_config('app.trace_id', v_trace::text, true);

  insert into gf_core.moments(person_id, locale, language, surface, expression_length, original_retention, status, contract_version)
  values (v_person, coalesce(nullif(trim(p_locale),''),'es-AR'), coalesce(nullif(trim(p_language),''),'es'), 'source', 0, 'ephemeral', 'decided', 's1.v55')
  returning moment_id into v_moment;

  insert into gf_core.accompaniment_episodes(person_id, moment_id, status, contract_version)
  values (v_person, v_moment, 'selected', 's1.v55')
  returning episode_id into v_episode;

  insert into gf_core.decision_runs(
    episode_id, person_id, policy_version, interpreter_version, coverage_version,
    safety_state, coverage_state, eligible_count, decision_reason_key,
    continuity_context, decision_kind
  ) values (
    v_episode, v_person, 'decision.v53.1', 'source.direct.v1', 'coverage.eval.v1',
    'clear', 'covered', 1, 'source_direct_experience',
    jsonb_build_object('entry_surface','source'), 'NEW_HELP'
  ) returning decision_run_id into v_decision;

  insert into gf_core.candidate_exposures(decision_run_id, person_id, help_id, help_version_id, display_rank)
  values (v_decision, v_person, p_help_id, v_help_version, 1);

  insert into gf_core.help_selections(episode_id, person_id, help_id, action, decision_run_id, help_version_id)
  values (v_episode, v_person, p_help_id, 'selected', v_decision, v_help_version)
  returning selection_id into v_selection;

  return jsonb_build_object(
    'episode_id', v_episode,
    'moment_id', v_moment,
    'decision_run_id', v_decision,
    'selection_id', v_selection,
    'help_id', p_help_id,
    'help_version_id', v_help_version,
    'trace_id', v_trace
  );
end
$function$;

revoke all on function public.lumen_source_begin_experience(uuid,text,text,uuid) from public, anon;
grant execute on function public.lumen_source_begin_experience(uuid,text,text,uuid) to authenticated;