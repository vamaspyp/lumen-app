-- A63 · Functional closure: STOPPED_HELPING must release an active repertoire item.
-- No new anatomy. Extends the existing longitudinal signal contract in place.

create or replace function public.lumen_s2_record_longitudinal_signal(p_episode_id uuid, p_signal_kind text, p_trace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid:=auth.uid();
  v_person uuid;
  v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());
  v_signal text:=upper(trim(coalesce(p_signal_kind,'')));
  v_selection gf_core.help_selections%rowtype;
  v_effect text;
  v_outcome uuid;
  v_rep uuid;
  v_withdraw_run uuid;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
  select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
  if v_person is null then raise exception 'person unavailable' using errcode='P0002'; end if;
  if v_signal not in('REUSED','REPEATED','VARIED','APPLIED_OTHER_CONTEXT','ADAPTED','RECOGNIZED_AS_OWN','NO_REMINDER_NEEDED','STOPPED_HELPING','UNKNOWN') then raise exception 'invalid longitudinal signal' using errcode='22023'; end if;

  select * into v_selection
  from gf_core.help_selections
  where episode_id=p_episode_id and person_id=v_person and action='selected'
  order by created_at desc limit 1;
  if not found then raise exception 'selected help unavailable' using errcode='42501'; end if;

  v_effect:=case when v_signal='STOPPED_HELPING' then 'not_helped' when v_signal='UNKNOWN' then 'unsure' else 'helped' end;
  perform set_config('app.trace_id',v_trace::text,true);

  insert into gf_core.outcomes_feedback(episode_id,person_id,selection_id,effect,applied,signal_kind,signal_context)
  values(p_episode_id,v_person,v_selection.selection_id,v_effect,true,v_signal,jsonb_build_object('longitudinal',true))
  returning outcome_id into v_outcome;

  update gf_core.accompaniment_episodes
  set status='completed',completed_at=now()
  where episode_id=p_episode_id and person_id=v_person;

  select repertoire_id into v_rep
  from gf_core.personal_repertoire
  where person_id=v_person and help_id=v_selection.help_id and status='active';

  if v_rep is not null then
    update gf_core.personal_repertoire
    set last_used_at=now(),
        updated_at=now(),
        user_confirmed=case when v_signal='RECOGNIZED_AS_OWN' then true else user_confirmed end,
        status=case when v_signal='STOPPED_HELPING' then 'retired' else status end
    where repertoire_id=v_rep;
  end if;

  if v_signal='NO_REMINDER_NEEDED' then
    update gf_core.followups
    set status='cancelled',cancelled_at=now(),updated_at=now()
    where person_id=v_person and related_help_id=v_selection.help_id and status in('scheduled','due');

    insert into gf_core.decision_runs(
      episode_id,person_id,policy_version,interpreter_version,coverage_version,
      safety_state,coverage_state,eligible_count,decision_reason_key,continuity_context,decision_kind
    ) values(
      p_episode_id,v_person,'decision.v53.1','continuity.autonomy.v1','coverage.eval.v1',
      'clear','covered',0,'own_resource_sufficient_no_reminder',
      jsonb_build_object('signal_kind',v_signal,'repertoire_id',v_rep,'help_id',v_selection.help_id),'WITHDRAW'
    ) returning decision_run_id into v_withdraw_run;

    perform gf_private.emit_person_event(
      'LumiWithdrew','repertoire',coalesce(v_rep,v_selection.help_id),v_person,v_trace,'s2.v53.1',
      jsonb_build_object('signal_kind',v_signal,'episode_id',p_episode_id,'decision_run_id',v_withdraw_run,'help_id',v_selection.help_id)
    );
  end if;

  perform gf_private.emit_person_event(
    'LongitudinalSignalRecorded','outcome',v_outcome,v_person,v_trace,'s2.v53.1',
    jsonb_build_object('signal_kind',v_signal,'effect',v_effect,'episode_id',p_episode_id,'help_id',v_selection.help_id,'repertoire_id',v_rep)
  );

  return jsonb_build_object(
    'outcome_id',v_outcome,
    'episode_id',p_episode_id,
    'signal_kind',v_signal,
    'effect',v_effect,
    'decision_kind',case when v_signal='NO_REMINDER_NEEDED' then 'WITHDRAW' else null end,
    'withdraw_decision_run_id',v_withdraw_run,
    'semantic_key',case
      when v_signal='NO_REMINDER_NEEDED' then 'continuity.you_have_this'
      when v_signal='RECOGNIZED_AS_OWN' then 'continuity.becoming_yours'
      when v_signal='STOPPED_HELPING' then 'continuity.release'
      else 'continuity.thank_and_learn'
    end,
    'trace_id',v_trace
  );
end
$function$;

revoke execute on function public.lumen_s2_record_longitudinal_signal(uuid,text,uuid) from public, anon;
grant execute on function public.lumen_s2_record_longitudinal_signal(uuid,text,uuid) to authenticated, service_role;
