-- A54 · Repertoire must resolve a helped outcome through the exact selection.
-- V49 removed outcomes_feedback.help_id in favor of selection_id; this closes the
-- residual consumer without reintroducing duplicated attribution.

create or replace function public.lumen_s2_add_repertoire(
  p_help_id uuid,
  p_trace_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_person uuid;
  v_trace uuid := coalesce(p_trace_id, gen_random_uuid());
  v_outcome uuid;
  v_rep uuid;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode='28000';
  end if;

  select person_id into v_person
  from gf_core.persons
  where auth_user_id = v_uid;

  if v_person is null then
    raise exception 'person unavailable' using errcode='P0002';
  end if;

  select o.outcome_id
  into v_outcome
  from gf_core.outcomes_feedback o
  join gf_core.help_selections s
    on s.selection_id = o.selection_id
   and s.person_id = o.person_id
  where o.person_id = v_person
    and s.help_id = p_help_id
    and s.action = 'selected'
    and o.effect = 'helped'
  order by o.created_at desc
  limit 1;

  if v_outcome is null then
    raise exception 'a helped outcome is required before integration' using errcode='42501';
  end if;

  insert into gf_core.personal_repertoire(person_id, help_id, source_outcome_id)
  values(v_person, p_help_id, v_outcome)
  on conflict(person_id, help_id) do update
    set status = 'active',
        source_outcome_id = excluded.source_outcome_id,
        updated_at = now()
  returning repertoire_id into v_rep;

  perform gf_private.emit_person_event(
    'RepertoireIntegrated',
    'repertoire',
    v_rep,
    v_person,
    v_trace,
    's2.v49.1',
    jsonb_build_object('help_id', p_help_id, 'source_outcome_id', v_outcome)
  );

  return jsonb_build_object(
    'repertoire_id', v_rep,
    'help_id', p_help_id,
    'source_outcome_id', v_outcome,
    'trace_id', v_trace
  );
end
$function$;
