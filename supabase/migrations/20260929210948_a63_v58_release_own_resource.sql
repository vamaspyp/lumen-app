-- A63 / V58: the person's explicit recognition of a resource is reversible.
-- Releasing recognition does not claim that the resource stopped helping.
create or replace function public.lumen_s2_release_repertoire(
  p_repertoire_id uuid,
  p_trace_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person uuid := gf_core.current_person_id();
  v_trace uuid := coalesce(p_trace_id, gen_random_uuid());
  v_help uuid;
begin
  if v_person is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  update gf_core.personal_repertoire
     set status = 'retired', user_confirmed = false, updated_at = now()
   where repertoire_id = p_repertoire_id
     and person_id = v_person
     and status = 'active'
     and user_confirmed = true
   returning help_id into v_help;
  if v_help is null then
    raise exception 'own resource unavailable' using errcode = 'P0002';
  end if;

  perform gf_private.emit_person_event(
    'RepertoireRecognitionReleased','repertoire',p_repertoire_id,v_person,
    v_trace,'s2.v58.1',jsonb_build_object('help_id',v_help)
  );
  return jsonb_build_object('repertoire_id',p_repertoire_id,'help_id',v_help,'released',true,'trace_id',v_trace);
end $$;

revoke all on function public.lumen_s2_release_repertoire(uuid,uuid) from public, anon;
grant execute on function public.lumen_s2_release_repertoire(uuid,uuid) to authenticated;

-- Recognition is a person's declaration after more than one distinct lived return.
-- Keep the same anatomy and public signature used by the existing S2 client.
create or replace function public.lumen_s2_add_repertoire(
  p_help_id uuid,
  p_trace_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person uuid := gf_core.current_person_id();
  v_trace uuid := coalesce(p_trace_id, gen_random_uuid());
  v_outcome uuid;
  v_rep uuid;
  v_count integer;
  v_caps text[] := '{}';
begin
  if v_person is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  select count(distinct o.episode_id) into v_count
    from gf_core.outcomes_feedback o
    join gf_core.help_selections s on s.selection_id=o.selection_id and s.person_id=o.person_id
   where o.person_id=v_person and s.help_id=p_help_id and s.action='selected' and o.effect='helped';
  if v_count < 2 then
    raise exception 'Para reconocerlo como propio, volvé a esta ayuda y registrá al menos dos retornos en ocasiones distintas.' using errcode='P0001';
  end if;
  select o.outcome_id, coalesce(mi.capacity_keys,'{}'::text[]) into v_outcome,v_caps
    from gf_core.outcomes_feedback o
    join gf_core.help_selections s on s.selection_id=o.selection_id and s.person_id=o.person_id
    join gf_core.accompaniment_episodes ae on ae.episode_id=o.episode_id
    left join lateral (
      select capacity_keys from gf_core.moment_interpretations
       where moment_id=ae.moment_id and person_id=v_person order by created_at desc limit 1
    ) mi on true
   where o.person_id=v_person and s.help_id=p_help_id and s.action='selected' and o.effect='helped'
   order by o.created_at desc limit 1;
  insert into gf_core.personal_repertoire
    (person_id,help_id,source_outcome_id,capability_keys,user_confirmed,integration_context)
  values
    (v_person,p_help_id,v_outcome,coalesce(v_caps,'{}'::text[]),true,
     jsonb_build_object('integration_source','explicit_after_repeated_helped_outcomes','contract_version','s2.v58.1'))
  on conflict(person_id,help_id) do update
    set status='active',source_outcome_id=excluded.source_outcome_id,
        capability_keys=case when cardinality(excluded.capability_keys)>0 then excluded.capability_keys else gf_core.personal_repertoire.capability_keys end,
        user_confirmed=true,integration_context=excluded.integration_context,updated_at=now()
  returning repertoire_id into v_rep;
  perform gf_private.emit_person_event(
    'RepertoireConfirmed','repertoire',v_rep,v_person,v_trace,'s2.v58.1',
    jsonb_build_object('help_id',p_help_id,'source_outcome_id',v_outcome,
                       'capability_keys',to_jsonb(coalesce(v_caps,'{}'::text[])))
  );
  return jsonb_build_object('repertoire_id',v_rep,'help_id',p_help_id,'source_outcome_id',v_outcome,
                            'capability_keys',to_jsonb(coalesce(v_caps,'{}'::text[])),
                            'user_confirmed',true,'trace_id',v_trace);
end $$;
