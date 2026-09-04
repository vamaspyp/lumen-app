-- S1 low-cost performance hardening: covering indexes for foreign keys flagged by advisor.
create index if not exists episodes_moment_idx on gf_core.accompaniment_episodes(moment_id);
create index if not exists exposures_person_idx on gf_core.candidate_exposures(person_id);
create index if not exists exposures_help_idx on gf_core.candidate_exposures(help_id);
create index if not exists exposures_help_version_idx on gf_core.candidate_exposures(help_version_id);
create index if not exists coverage_help_idx on gf_core.coverage_cells(help_id);
create index if not exists candidates_person_idx on gf_core.decision_candidates(person_id);
create index if not exists candidates_help_idx on gf_core.decision_candidates(help_id);
create index if not exists candidates_help_version_idx on gf_core.decision_candidates(help_version_id);
create index if not exists decision_runs_episode_idx on gf_core.decision_runs(episode_id);
create index if not exists help_provider_idx on gf_core.help_possibilities(provider_id);
create index if not exists selections_episode_idx on gf_core.help_selections(episode_id);
create index if not exists selections_help_idx on gf_core.help_selections(help_id);
create index if not exists interpretations_moment_idx on gf_core.moment_interpretations(moment_id);
create index if not exists no_match_episode_idx on gf_core.no_match_events(episode_id);
create index if not exists no_match_person_idx on gf_core.no_match_events(person_id);
create index if not exists outcomes_episode_idx on gf_core.outcomes_feedback(episode_id);
create index if not exists outcomes_help_idx on gf_core.outcomes_feedback(help_id);