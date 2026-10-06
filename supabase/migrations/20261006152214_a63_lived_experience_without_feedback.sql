-- A63 / CF-06 / RV-06: project completed experiences independently of feedback.
-- Preserve original map fields, ownership, consent and ACL. No new entity or inferred effect.
-- A63: outcomes store a selection reference; help_id lives on help_selections.
-- Preserve the consent boundary and project only the current person's data.
create or replace function public.lumen_living_map_snapshot()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $function$
declare
  v_person uuid := gf_core.current_person_id();
  v_memory boolean := false;
  v_direction jsonb := '[]';
  v_resources jsonb := '[]';
  v_context jsonb := '[]';
  v_lived jsonb := '[]';
  v_experiences jsonb := '[]';
  v_territory jsonb := '[]';
begin
  if v_person is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  select coalesce(memory_allowed, false) into v_memory
  from gf_core.privacy_preferences where person_id = v_person;
  if not v_memory then
    return jsonb_build_object(
      'memory_allowed', false, 'territory', '[]'::jsonb,
      'direction', '[]'::jsonb, 'potential', '[]'::jsonb,
      'conditions', '[]'::jsonb, 'realization', '[]'::jsonb, 'lived_experiences', '[]'::jsonb,
      'epistemic_note', 'El Mapa Vivo requiere memoria consentida.'
    );
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'faro_id', trajectory_id, 'text', faro_text,
    'status', status, 'updated_at', updated_at
  ) order by updated_at desc), '[]'::jsonb) into v_direction
  from gf_core.trajectories where person_id = v_person and status = 'active';

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_territory
  from (select jsonb_build_object('area_keys', area_keys, 'confidence', confidence,
    'observed_at', created_at) x from gf_core.moment_interpretations
    where person_id = v_person and safety_state = 'clear'
    order by created_at desc limit 12) q;

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_resources
  from (select jsonb_build_object('resource_id', repertoire_id, 'help_id', help_id,
    'times_reused', times_reused, 'user_confirmed', user_confirmed) x
    from gf_core.personal_repertoire where person_id = v_person and status = 'active'
    order by updated_at desc limit 12) q;

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_context
  from (select jsonb_build_object('features', features, 'confidence', confidence,
    'observed_at', created_at) x from gf_core.moment_interpretations
    where person_id = v_person and safety_state = 'clear'
    order by created_at desc limit 12) q;

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_lived
  from (select jsonb_build_object('outcome_id', o.outcome_id,
    'help_id', h.help_id, 'effect', o.effect, 'applied', o.applied,
    'signal_kind', o.signal_kind, 'lived_at', o.created_at) x
    from gf_core.outcomes_feedback o
    left join gf_core.help_selections h
      on h.selection_id = o.selection_id and h.person_id = o.person_id
    where o.person_id = v_person order by o.created_at desc limit 12) q;

  -- Completion and explicit return are separate evidence. Never infer benefit from completion.
  select coalesce(jsonb_agg(q.item order by q.lived_at desc), '[]'::jsonb) into v_experiences
  from (
    select coalesce((e.experience_position->>'saved_at')::timestamptz, o.created_at) lived_at,
      jsonb_build_object('episode_id', e.episode_id, 'help_id', h.help_id,
        'lived_at', coalesce((e.experience_position->>'saved_at')::timestamptz, o.created_at),
        'finished', coalesce((e.experience_position->>'finished')::boolean, false),
        'effect', o.effect) item
    from gf_core.accompaniment_episodes e
    join lateral (select s.help_id, s.selection_id from gf_core.help_selections s
      where s.episode_id=e.episode_id and s.person_id=v_person and s.action='selected'
      order by s.created_at desc, s.selection_id desc limit 1) h on true
    left join lateral (select f.effect, f.created_at from gf_core.outcomes_feedback f
      where f.episode_id=e.episode_id and f.person_id=v_person
        and (f.selection_id=h.selection_id or f.selection_id is null)
      order by f.created_at desc, f.outcome_id desc limit 1) o on true
    where e.person_id=v_person
      and (coalesce((e.experience_position->>'finished')::boolean, false) or o.created_at is not null)
    order by lived_at desc limit 12
  ) q;

  return jsonb_build_object('memory_allowed', true, 'territory', v_territory,
    'direction', v_direction, 'potential', v_resources, 'conditions', v_context,
    'realization', v_lived, 'lived_experiences', v_experiences,
    'epistemic_note', 'Mapa vivo, parcial, contextual y corregible.');
end
$function$;

revoke all on function public.lumen_living_map_snapshot() from public,anon;
grant execute on function public.lumen_living_map_snapshot() to authenticated;
