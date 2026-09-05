-- VA+LUMEN A38 · intent-aware matching + deduplication

update gf_core.coverage_cells cc set intent_key='move_forward'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('one_small_step','lumen_tiny_start_2m') and cc.need_key='agency';
update gf_core.coverage_cells cc set intent_key='gain_clarity'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('name_what_matters','write_three_lines') and cc.need_key='clarity';
update gf_core.coverage_cells cc set intent_key='reduce_load'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('pause_quiet_2m','lumen_unload_mind_5m') and cc.need_key in ('pause','clarity');
update gf_core.coverage_cells cc set intent_key='reconnect_meaning'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('lumen_values_compass','name_what_matters') and cc.need_key in ('meaning','clarity');
update gf_core.coverage_cells cc set intent_key='seek_connection'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('reach_someone_trusted','lumen_loneliness_low_friction') and cc.need_key='connection';
update gf_core.coverage_cells cc set intent_key='notice_value'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('notice_one_good','lumen_specific_gratitude') and cc.need_key='appreciation';
update gf_core.coverage_cells cc set intent_key='regulate_anxiety'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('lumen_grounding_senses','lumen_worry_window','lumen_uncertainty_circles','who_stress_es_2026','paho_doing_what_matters_latam','medlineplus_anxiety_es') and cc.need_key in ('anxiety','pause','focus','clarity');
update gf_core.coverage_cells cc set intent_key='rest_better'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('lumen_sleep_wind_down','lumen_sleep_problem_parking','medlineplus_healthy_sleep_es') and cc.need_key in ('sleep','pause','clarity');
update gf_core.coverage_cells cc set intent_key='move_through_grief'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('lumen_grief_small_ritual','lumen_grief_reach_out','medlineplus_bereavement_es') and cc.need_key in ('grief','connection');
update gf_core.coverage_cells cc set intent_key='regulate_emotion'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('lumen_conflict_pause','lumen_anger_cooldown','lumen_name_emotion_need') and cc.need_key in ('emotion_regulation','clarity');
update gf_core.coverage_cells cc set intent_key='repair_relationship'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('lumen_apology_prepare','lumen_repair_message','lumen_listen_before_answer','lumen_difficult_conversation','ggia_active_listening_es','ggia_self_forgiveness_es','ggia_forgiveness_steps_es') and cc.need_key in ('relationship_repair','connection','boundaries','emotion_regulation');
update gf_core.coverage_cells cc set intent_key='set_boundary'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('lumen_boundary_three_parts','lumen_difficult_conversation','lumen_anger_cooldown') and cc.need_key='boundaries';
update gf_core.coverage_cells cc set intent_key='offer_self_compassion'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('lumen_self_compassion_minute','lumen_mistake_to_learning','lumen_rest_without_guilt','ggia_self_compassion_break_es','ggia_self_forgiveness_es') and cc.need_key='self_compassion';
update gf_core.coverage_cells cc set intent_key='restore_confidence'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('lumen_confidence_evidence','lumen_comparison_detox') and cc.need_key in ('confidence','agency','meaning');
update gf_core.coverage_cells cc set intent_key='build_habit'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('lumen_habit_shrink','lumen_restart_after_lapse','lumen_tiny_start_2m') and cc.need_key in ('habit','agency','self_compassion');
update gf_core.coverage_cells cc set intent_key='reduce_work_stress'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('lumen_work_triage','lumen_work_shutdown') and cc.need_key in ('work_stress','clarity','focus','boundaries');
update gf_core.coverage_cells cc set intent_key='face_financial_worry'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code='lumen_money_first_fact' and cc.need_key in ('financial_calm','clarity');
update gf_core.coverage_cells cc set intent_key='sustain_care'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code='lumen_caregiving_minimum' and cc.need_key in ('caregiving','self_compassion');
update gf_core.coverage_cells cc set intent_key='navigate_transition'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code='lumen_transition_anchor' and cc.need_key in ('change_transition','meaning');
update gf_core.coverage_cells cc set intent_key='restore_energy'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code in ('lumen_move_10m','who_physical_activity_es') and cc.need_key in ('energy','agency');
update gf_core.coverage_cells cc set intent_key='regain_focus'
from gf_core.help_possibilities hp where hp.help_id=cc.help_id and hp.canonical_code='lumen_three_priorities' and cc.need_key in ('focus','clarity');

create or replace function public.lumen_s1_accompany_moment(
  p_expression text,p_locale text,p_language text,p_surface text,p_trace_id uuid
)
returns jsonb language plpgsql security invoker set search_path=''
as $$
declare
  v_uid uuid:=auth.uid(); v_person uuid; v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());
  v_expression text:=trim(coalesce(p_expression,'')); v_interp jsonb; v_moment uuid; v_episode uuid; v_run uuid;
  v_needs text[]; v_intent text; v_safety text; v_candidate_count integer:=0; v_primary jsonb; v_alt jsonb; r record; v_rank integer:=0;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'persistent accompaniment requires a non-anonymous account' using errcode='42501'; end if;
  if char_length(v_expression)=0 or char_length(v_expression)>4000 then raise exception 'expression must contain 1..4000 characters' using errcode='22023'; end if;

  perform set_config('app.trace_id',v_trace::text,true);
  perform public.lumen_bootstrap_person(v_trace);
  v_person:=gf_core.current_person_id();
  if v_person is null then raise exception 'person unavailable'; end if;

  insert into gf_core.moments(person_id,locale,language,surface,expression_length,original_retention)
  values(v_person,coalesce(nullif(trim(p_locale),''),'es-AR'),coalesce(nullif(trim(p_language),''),'es'),coalesce(nullif(trim(p_surface),''),'web'),char_length(v_expression),'ephemeral')
  returning moment_id into v_moment;

  v_interp:=gf_core.s1_interpret(v_expression); v_safety:=v_interp->>'safety_state'; v_intent:=v_interp->>'intent_key';
  v_needs:=array(select jsonb_array_elements_text(v_interp->'need_keys'));
  insert into gf_core.moment_interpretations(moment_id,person_id,interpreter_version,intent_key,need_keys,confidence,uncertainty_key,requires_clarification,safety_state,features)
  values(v_moment,v_person,'rules.v3',v_intent,v_needs,(v_interp->>'confidence')::numeric,v_interp->>'uncertainty_key',coalesce((v_interp->>'requires_clarification')::boolean,false),v_safety,coalesce(v_interp->'features','{}'::jsonb));

  if coalesce((v_interp->>'requires_clarification')::boolean,false) then
    insert into gf_core.accompaniment_episodes(person_id,moment_id,status) values(v_person,v_moment,'clarification_needed') returning episode_id into v_episode;
    update gf_core.moments set status='clarification_needed' where moment_id=v_moment;
    return jsonb_build_object('scene_id','moment.clarify','scene_version','s1.v1','presence_mode','P3','human_intent',v_intent,'episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','clarify.more_context')),'available_actions',jsonb_build_array(jsonb_build_object('id','tell_more','intent','continue_expression')),'safety',jsonb_build_object('state',v_safety),'coverage',jsonb_build_object('state','unknown'));
  end if;

  insert into gf_core.accompaniment_episodes(person_id,moment_id,status)
  values(v_person,v_moment,case when v_safety='blocked' then 'no_match' else 'proposed' end) returning episode_id into v_episode;

  if v_safety='blocked' then
    insert into gf_core.no_match_events(episode_id,person_id,reason_code,coverage_state,coverage_gap) values(v_episode,v_person,'safety_scope','restricted',false);
    update gf_core.moments set status='decided' where moment_id=v_moment;
    return jsonb_build_object('scene_id','moment.safety_referral','scene_version','s1.v1','presence_mode','P4','human_intent','seek_support','episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','safety_referral','semantic_key','safety.human_help_now')),'available_actions',jsonb_build_array(jsonb_build_object('id','seek_human_help','intent','seek_human_help'),jsonb_build_object('id','close','intent','close')),'safety',jsonb_build_object('state','blocked'),'coverage',jsonb_build_object('state','restricted','reason','safety_scope'));
  end if;

  select count(distinct hp.help_id) into v_candidate_count
  from gf_core.coverage_cells cc join gf_core.help_possibilities hp on hp.help_id=cc.help_id
  where hp.lifecycle in('active_limited','active') and cc.status in('covered','partial') and cc.need_key=any(v_needs)
    and (cc.locale_pattern='*' or coalesce(nullif(trim(p_locale),''),'es-AR') like replace(cc.locale_pattern,'*','%'));

  if v_candidate_count=0 then
    insert into gf_core.no_match_events(episode_id,person_id,reason_code,coverage_state,coverage_gap) values(v_episode,v_person,'no_sufficient_coverage','not_covered',true);
    update gf_core.accompaniment_episodes set status='no_match',completed_at=now() where episode_id=v_episode;
    update gf_core.moments set status='decided' where moment_id=v_moment;
    return jsonb_build_object('scene_id','moment.no_match','scene_version','s1.v1','presence_mode','P2','human_intent',v_intent,'episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','no_match.honest')),'available_actions',jsonb_build_array(jsonb_build_object('id','rephrase','intent','rephrase'),jsonb_build_object('id','close','intent','close')),'safety',jsonb_build_object('state','clear'),'coverage',jsonb_build_object('state','not_covered','reason','no_sufficient_coverage'));
  end if;

  insert into gf_core.decision_runs(episode_id,person_id,policy_version,interpreter_version,coverage_version,safety_state,coverage_state,eligible_count,decision_reason_key)
  values(v_episode,v_person,'decision.v2','rules.v3','coverage.v3',v_safety,'covered',v_candidate_count,'intent_aware_covered_match') returning decision_run_id into v_run;

  for r in
    with eligible as (
      select hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail,
             min(case when cc.intent_key=v_intent then 0 when cc.intent_key is null then 1 else 2 end) as intent_rank,
             min(case cc.status when 'covered' then 0 else 1 end) as status_rank,
             min(cc.priority_hint) as priority_hint
      from gf_core.coverage_cells cc
      join gf_core.help_possibilities hp on hp.help_id=cc.help_id
      join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version
      join lateral(
        select hloc.* from gf_core.help_localizations hloc where hloc.help_version_id=hv.help_version_id
        order by case when hloc.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0 when left(hloc.locale,2)=left(coalesce(nullif(trim(p_language),''),'es'),2) then 1 when hloc.locale='es-AR' then 2 else 3 end limit 1
      ) hl on true
      where hp.lifecycle in('active_limited','active') and cc.status in('covered','partial') and cc.need_key=any(v_needs)
        and (cc.locale_pattern='*' or coalesce(nullif(trim(p_locale),''),'es-AR') like replace(cc.locale_pattern,'*','%'))
      group by hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail
    )
    select * from eligible order by intent_rank,status_rank,priority_hint,canonical_code limit 2
  loop
    v_rank:=v_rank+1;
    insert into gf_core.decision_candidates(decision_run_id,person_id,help_id,help_version_id,eligibility_status,reason_key,priority_hint)
    values(v_run,v_person,r.help_id,r.help_version_id,'eligible',case when r.intent_rank=0 then 'intent_coverage_match' else 'coverage_match' end,r.priority_hint);
    insert into gf_core.candidate_exposures(decision_run_id,person_id,help_id,help_version_id,display_rank)
    values(v_run,v_person,r.help_id,r.help_version_id,v_rank);
    if v_rank=1 then v_primary:=jsonb_build_object('help_id',r.help_id,'help_version_id',r.help_version_id,'help_type',r.help_type,'title',r.title,'summary',r.summary,'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail);
    elsif v_rank=2 then v_alt:=jsonb_build_object('help_id',r.help_id,'help_version_id',r.help_version_id,'help_type',r.help_type,'title',r.title,'summary',r.summary,'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail); end if;
  end loop;

  update gf_core.moments set status='decided' where moment_id=v_moment;
  return jsonb_build_object('scene_id','moment.help','scene_version','s1.v1','presence_mode','P2','human_intent',v_intent,'episode_id',v_episode,'moment_id',v_moment,'decision_run_id',v_run,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','help.offer_humble'),jsonb_build_object('type','help_preview','primary',v_primary,'alternative',v_alt)),'available_actions',jsonb_build_array(jsonb_build_object('id','try_primary','intent','select_help','payload',jsonb_build_object('help_id',v_primary->>'help_id')),jsonb_build_object('id','not_this','intent','reject_help')),'safety',jsonb_build_object('state','clear'),'coverage',jsonb_build_object('state','covered'),'interpretation',jsonb_build_object('intent_key',v_intent,'confidence',v_interp->'confidence','uncertainty_key',v_interp->'uncertainty_key'));
end $$;

revoke execute on function public.lumen_s1_accompany_moment(text,text,text,text,uuid) from public,anon;
grant execute on function public.lumen_s1_accompany_moment(text,text,text,text,uuid) to authenticated;
