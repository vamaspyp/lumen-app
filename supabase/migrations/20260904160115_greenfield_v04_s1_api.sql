-- VA+LUMEN V0.4 · S1 explicit application API

create or replace function public.lumen_s1_accompany_moment(
  p_expression text,p_locale text,p_language text,p_surface text,p_trace_id uuid
)
returns jsonb language plpgsql security invoker set search_path=''
as $$
declare
  v_uid uuid:=auth.uid(); v_person uuid; v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());
  v_expression text:=trim(coalesce(p_expression,'')); v_interp jsonb; v_moment uuid; v_episode uuid; v_run uuid;
  v_needs text[]; v_safety text; v_candidate_count integer:=0; v_primary jsonb; v_alt jsonb; r record; v_rank integer:=0;
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

  v_interp:=gf_core.s1_interpret(v_expression); v_safety:=v_interp->>'safety_state';
  v_needs:=array(select jsonb_array_elements_text(v_interp->'need_keys'));
  insert into gf_core.moment_interpretations(moment_id,person_id,interpreter_version,intent_key,need_keys,confidence,uncertainty_key,requires_clarification,safety_state,features)
  values(v_moment,v_person,'rules.v1',v_interp->>'intent_key',v_needs,(v_interp->>'confidence')::numeric,v_interp->>'uncertainty_key',coalesce((v_interp->>'requires_clarification')::boolean,false),v_safety,coalesce(v_interp->'features','{}'::jsonb));

  if coalesce((v_interp->>'requires_clarification')::boolean,false) then
    insert into gf_core.accompaniment_episodes(person_id,moment_id,status) values(v_person,v_moment,'clarification_needed') returning episode_id into v_episode;
    update gf_core.moments set status='clarification_needed' where moment_id=v_moment;
    return jsonb_build_object('scene_id','moment.clarify','scene_version','s1.v1','presence_mode','P3','human_intent',v_interp->>'intent_key','episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','clarify.more_context')),'available_actions',jsonb_build_array(jsonb_build_object('id','tell_more','intent','continue_expression')),'safety',jsonb_build_object('state',v_safety),'coverage',jsonb_build_object('state','unknown'));
  end if;

  insert into gf_core.accompaniment_episodes(person_id,moment_id,status)
  values(v_person,v_moment,case when v_safety='blocked' then 'no_match' else 'proposed' end) returning episode_id into v_episode;

  if v_safety='blocked' then
    insert into gf_core.no_match_events(episode_id,person_id,reason_code,coverage_state,coverage_gap) values(v_episode,v_person,'safety_scope','restricted',false);
    update gf_core.moments set status='decided' where moment_id=v_moment;
    return jsonb_build_object('scene_id','moment.safety_referral','scene_version','s1.v1','presence_mode','P4','human_intent','seek_support','episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','safety_referral','semantic_key','safety.human_help_now')),'available_actions',jsonb_build_array(jsonb_build_object('id','seek_human_help','intent','seek_human_help'),jsonb_build_object('id','close','intent','close')),'safety',jsonb_build_object('state','blocked'),'coverage',jsonb_build_object('state','restricted','reason','safety_scope'));
  end if;

  select count(*) into v_candidate_count
  from gf_core.coverage_cells cc join gf_core.help_possibilities hp on hp.help_id=cc.help_id
  where hp.lifecycle in('active_limited','active') and cc.status in('covered','partial') and cc.need_key=any(v_needs)
    and (cc.locale_pattern='*' or coalesce(nullif(trim(p_locale),''),'es-AR') like replace(cc.locale_pattern,'*','%'));

  if v_candidate_count=0 then
    insert into gf_core.no_match_events(episode_id,person_id,reason_code,coverage_state,coverage_gap) values(v_episode,v_person,'no_sufficient_coverage','not_covered',true);
    update gf_core.accompaniment_episodes set status='no_match',completed_at=now() where episode_id=v_episode;
    update gf_core.moments set status='decided' where moment_id=v_moment;
    return jsonb_build_object('scene_id','moment.no_match','scene_version','s1.v1','presence_mode','P2','human_intent',v_interp->>'intent_key','episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','no_match.honest')),'available_actions',jsonb_build_array(jsonb_build_object('id','rephrase','intent','rephrase'),jsonb_build_object('id','close','intent','close')),'safety',jsonb_build_object('state','clear'),'coverage',jsonb_build_object('state','not_covered','reason','no_sufficient_coverage'));
  end if;

  insert into gf_core.decision_runs(episode_id,person_id,policy_version,interpreter_version,coverage_version,safety_state,coverage_state,eligible_count,decision_reason_key)
  values(v_episode,v_person,'decision.v1','rules.v1','coverage.v1',v_safety,'covered',v_candidate_count,'low_risk_covered_match') returning decision_run_id into v_run;

  for r in
    select hp.help_id,hv.help_version_id,hp.help_type,cc.priority_hint,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail
    from gf_core.coverage_cells cc
    join gf_core.help_possibilities hp on hp.help_id=cc.help_id
    join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version
    join lateral(
      select hloc.* from gf_core.help_localizations hloc where hloc.help_version_id=hv.help_version_id
      order by case when hloc.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0 when left(hloc.locale,2)=left(coalesce(nullif(trim(p_language),''),'es'),2) then 1 when hloc.locale='es-AR' then 2 else 3 end limit 1
    ) hl on true
    where hp.lifecycle in('active_limited','active') and cc.status in('covered','partial') and cc.need_key=any(v_needs)
      and (cc.locale_pattern='*' or coalesce(nullif(trim(p_locale),''),'es-AR') like replace(cc.locale_pattern,'*','%'))
    order by case cc.status when 'covered' then 0 else 1 end,cc.priority_hint,hp.canonical_code limit 2
  loop
    v_rank:=v_rank+1;
    insert into gf_core.decision_candidates(decision_run_id,person_id,help_id,help_version_id,eligibility_status,reason_key,priority_hint)
    values(v_run,v_person,r.help_id,r.help_version_id,'eligible','coverage_match',r.priority_hint);
    insert into gf_core.candidate_exposures(decision_run_id,person_id,help_id,help_version_id,display_rank)
    values(v_run,v_person,r.help_id,r.help_version_id,v_rank);
    if v_rank=1 then v_primary:=jsonb_build_object('help_id',r.help_id,'help_version_id',r.help_version_id,'help_type',r.help_type,'title',r.title,'summary',r.summary,'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail);
    elsif v_rank=2 then v_alt:=jsonb_build_object('help_id',r.help_id,'help_version_id',r.help_version_id,'help_type',r.help_type,'title',r.title,'summary',r.summary,'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail); end if;
  end loop;
  update gf_core.moments set status='decided' where moment_id=v_moment;
  return jsonb_build_object('scene_id','moment.help','scene_version','s1.v1','presence_mode','P2','human_intent',v_interp->>'intent_key','episode_id',v_episode,'moment_id',v_moment,'decision_run_id',v_run,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','help.offer_humble'),jsonb_build_object('type','help_preview','primary',v_primary,'alternative',v_alt)),'available_actions',jsonb_build_array(jsonb_build_object('id','try_primary','intent','select_help','payload',jsonb_build_object('help_id',v_primary->>'help_id')),jsonb_build_object('id','not_this','intent','reject_help')),'safety',jsonb_build_object('state','clear'),'coverage',jsonb_build_object('state','covered'),'interpretation',jsonb_build_object('intent_key',v_interp->>'intent_key','confidence',v_interp->'confidence','uncertainty_key',v_interp->'uncertainty_key'));
end $$;
revoke execute on function public.lumen_s1_accompany_moment(text,text,text,text,uuid) from public,anon;
grant execute on function public.lumen_s1_accompany_moment(text,text,text,text,uuid) to authenticated;

create or replace function public.lumen_s1_select_help(p_episode_id uuid,p_help_id uuid,p_action text,p_trace_id uuid)
returns jsonb language plpgsql security invoker set search_path=''
as $$
declare v_person uuid:=gf_core.current_person_id();v_action text:=lower(trim(p_action));v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_help jsonb;
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if v_action not in('selected','rejected') then raise exception 'invalid action' using errcode='22023';end if;
 if not exists(select 1 from gf_core.accompaniment_episodes e where e.episode_id=p_episode_id and e.person_id=v_person) then raise exception 'episode not found' using errcode='P0002';end if;
 if not exists(select 1 from gf_core.candidate_exposures ce join gf_core.decision_runs dr on dr.decision_run_id=ce.decision_run_id where dr.episode_id=p_episode_id and ce.help_id=p_help_id and ce.person_id=v_person) then raise exception 'help was not exposed in this episode' using errcode='42501';end if;
 perform set_config('app.trace_id',v_trace::text,true);
 insert into gf_core.help_selections(episode_id,person_id,help_id,action) values(p_episode_id,v_person,p_help_id,v_action);
 update gf_core.accompaniment_episodes set status=case when v_action='selected' then 'selected' else 'rejected' end where episode_id=p_episode_id;
 select jsonb_build_object('help_id',hp.help_id,'help_type',hp.help_type,'title',hl.title,'summary',hl.summary,'content',hl.content_payload,'duration_minutes',hv.duration_minutes,'energy',hv.energy,'detail',hv.detail) into v_help
 from gf_core.help_possibilities hp join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version
 join lateral(select hloc.* from gf_core.help_localizations hloc where hloc.help_version_id=hv.help_version_id order by case when hloc.locale='es-AR' then 0 else 1 end limit 1) hl on true
 where hp.help_id=p_help_id;
 return jsonb_build_object('episode_id',p_episode_id,'action',v_action,'help',v_help,'trace_id',v_trace);
end $$;
revoke execute on function public.lumen_s1_select_help(uuid,uuid,text,uuid) from public,anon;
grant execute on function public.lumen_s1_select_help(uuid,uuid,text,uuid) to authenticated;

create or replace function public.lumen_s1_record_outcome(p_episode_id uuid,p_help_id uuid,p_effect text,p_applied boolean,p_trace_id uuid)
returns jsonb language plpgsql security invoker set search_path=''
as $$
declare v_person uuid:=gf_core.current_person_id();v_effect text:=lower(trim(p_effect));v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if v_effect not in('helped','not_helped','unsure') then raise exception 'invalid effect' using errcode='22023';end if;
 if not exists(select 1 from gf_core.help_selections hs where hs.episode_id=p_episode_id and hs.help_id=p_help_id and hs.person_id=v_person and hs.action='selected') then raise exception 'help must be selected first' using errcode='42501';end if;
 perform set_config('app.trace_id',v_trace::text,true);
 insert into gf_core.outcomes_feedback(episode_id,person_id,help_id,effect,applied) values(p_episode_id,v_person,p_help_id,v_effect,p_applied);
 update gf_core.accompaniment_episodes set status='completed',completed_at=now() where episode_id=p_episode_id and person_id=v_person;
 return jsonb_build_object('episode_id',p_episode_id,'effect',v_effect,'applied',p_applied,'trace_id',v_trace,'semantic_key','outcome.thank_and_release');
end $$;
revoke execute on function public.lumen_s1_record_outcome(uuid,uuid,text,boolean,uuid) from public,anon;
grant execute on function public.lumen_s1_record_outcome(uuid,uuid,text,boolean,uuid) to authenticated;

comment on function public.lumen_s1_accompany_moment(text,text,text,text,uuid) is 'S1 boundary: ephemeral expression → refutable interpretation → deterministic safety/coverage → Source → help/NO_MATCH scene.';
comment on function public.lumen_s1_select_help(uuid,uuid,text,uuid) is 'S1 boundary: records selection/rejection only for exposed candidates.';
comment on function public.lumen_s1_record_outcome(uuid,uuid,text,boolean,uuid) is 'S1 boundary: differentiated outcome without collecting free-text intimacy.';