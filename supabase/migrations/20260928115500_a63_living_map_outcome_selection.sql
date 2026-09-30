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
      'conditions', '[]'::jsonb, 'realization', '[]'::jsonb,
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

  return jsonb_build_object('memory_allowed', true, 'territory', v_territory,
    'direction', v_direction, 'potential', v_resources, 'conditions', v_context,
    'realization', v_lived,
    'epistemic_note', 'Mapa vivo, parcial, contextual y corregible.');
end
$function$;
