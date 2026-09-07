-- A44 · Certificación transversal de integridad canónica del Embrión
-- Delta mínimo: continuidad entra al Motor, evidencia conserva contexto de decisión,
-- Santuario permite corrección/exportación y health deja de confundir implementación con certificación.

alter table gf_core.decision_runs
  add column if not exists continuity_context jsonb not null default '{}'::jsonb;

alter table gf_private.knowledge_claims
  add column if not exists epistemic_level text not null default 'E0',
  add column if not exists uncertainty jsonb not null default '{}'::jsonb,
  add column if not exists contradictions jsonb not null default '[]'::jsonb,
  add column if not exists provenance jsonb not null default '{}'::jsonb,
  add column if not exists valid_from timestamptz not null default now(),
  add column if not exists valid_to timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'knowledge_claims_epistemic_level_check'
      and conrelid = 'gf_private.knowledge_claims'::regclass
  ) then
    alter table gf_private.knowledge_claims
      add constraint knowledge_claims_epistemic_level_check
      check (epistemic_level in ('E0','E1','E2','E3','E4','E5'));
  end if;
end $$;

create or replace function gf_ledger.emit_s1_event()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_trace uuid;
  v_event_id uuid;
  v_type text;
  v_second text;
  v_person uuid;
  v_agg text;
  v_agg_id uuid;
  v_payload jsonb := '{}'::jsonb;
  v_second_payload jsonb := '{}'::jsonb;
begin
  begin
    v_trace := nullif(current_setting('app.trace_id', true), '')::uuid;
  exception when others then
    v_trace := null;
  end;
  v_trace := coalesce(v_trace, gen_random_uuid());

  if tg_table_name='moments' then
    v_type:='MomentReceived'; v_person:=new.person_id; v_agg:='moment'; v_agg_id:=new.moment_id;
    v_payload:=jsonb_build_object('locale',new.locale,'language',new.language,'surface',new.surface,'expression_length',new.expression_length,'original_retention',new.original_retention);
  elsif tg_table_name='moment_interpretations' then
    v_type:='MomentInterpreted'; v_person:=new.person_id; v_agg:='moment'; v_agg_id:=new.moment_id;
    v_payload:=jsonb_build_object('interpreter_version',new.interpreter_version,'intent_key',new.intent_key,'need_keys',new.need_keys,'confidence',new.confidence,'requires_clarification',new.requires_clarification,'safety_state',new.safety_state);
  elsif tg_table_name='decision_runs' then
    v_type:='CandidateSetGenerated'; v_person:=new.person_id; v_agg:='decision_run'; v_agg_id:=new.decision_run_id;
    v_payload:=jsonb_build_object(
      'policy_version',new.policy_version,
      'interpreter_version',new.interpreter_version,
      'coverage_version',new.coverage_version,
      'safety_state',new.safety_state,
      'coverage_state',new.coverage_state,
      'eligible_count',new.eligible_count,
      'decision_reason_key',new.decision_reason_key,
      'continuity',jsonb_build_object(
        'memory_used',coalesce((new.continuity_context->>'memory_used')::boolean,false),
        'active_trajectory_count',coalesce(jsonb_array_length(new.continuity_context->'active_trajectory_ids'),0),
        'repertoire_count',coalesce(jsonb_array_length(new.continuity_context->'repertoire_help_ids'),0)
      )
    );
  elsif tg_table_name='candidate_exposures' then
    v_type:='CandidateExposed'; v_person:=new.person_id; v_agg:='decision_run'; v_agg_id:=new.decision_run_id;
    v_payload:=jsonb_build_object('help_id',new.help_id,'help_version_id',new.help_version_id,'display_rank',new.display_rank);
  elsif tg_table_name='help_selections' then
    v_type:=case when new.action='selected' then 'HelpSelected' else 'HelpRejected' end;
    v_person:=new.person_id; v_agg:='episode'; v_agg_id:=new.episode_id;
    v_payload:=jsonb_build_object('help_id',new.help_id,'action',new.action);
    if new.action='selected' then v_second:='HelpStarted'; v_second_payload:=jsonb_build_object('help_id',new.help_id); end if;
  elsif tg_table_name='outcomes_feedback' then
    v_type:='OutcomeReported'; v_person:=new.person_id; v_agg:='episode'; v_agg_id:=new.episode_id;
    v_payload:=jsonb_build_object('help_id',new.help_id,'effect',new.effect,'applied',new.applied);
    v_second:='HelpCompleted'; v_second_payload:=jsonb_build_object('help_id',new.help_id);
  elsif tg_table_name='no_match_events' then
    v_type:='NoMatchDeclared'; v_person:=new.person_id; v_agg:='episode'; v_agg_id:=new.episode_id;
    v_payload:=jsonb_build_object('reason_code',new.reason_code,'coverage_state',new.coverage_state,'coverage_gap',new.coverage_gap);
    if new.coverage_gap then v_second:='CoverageGapDetected'; v_second_payload:=jsonb_build_object('reason_code',new.reason_code,'coverage_state',new.coverage_state); end if;
  else
    raise exception 'unsupported S1 audited table %',tg_table_name;
  end if;

  v_event_id:=gen_random_uuid();
  insert into gf_ledger.domain_events(event_id,event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance)
  values(v_event_id,v_type,v_agg,v_agg_id,'person',auth.uid()::text,v_person,v_trace,'s1.v2',v_payload,jsonb_build_object('source','postgres_trigger','slice','s1'));
  insert into gf_ledger.outbox(event_type,payload,idempotency_key)
  values(v_type,jsonb_build_object('event_id',v_event_id,'trace_id',v_trace,'aggregate_id',v_agg_id,'contract_version','s1.v2'),'ledger:'||v_event_id::text);

  if v_second is not null then
    v_event_id:=gen_random_uuid();
    insert into gf_ledger.domain_events(event_id,event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance)
    values(v_event_id,v_second,v_agg,v_agg_id,'person',auth.uid()::text,v_person,v_trace,'s1.v2',v_second_payload,jsonb_build_object('source','postgres_trigger','slice','s1'));
    insert into gf_ledger.outbox(event_type,payload,idempotency_key)
    values(v_second,jsonb_build_object('event_id',v_event_id,'trace_id',v_trace,'aggregate_id',v_agg_id,'contract_version','s1.v2'),'ledger:'||v_event_id::text);
  end if;
  return new;
end $$;

create or replace function gf_private.capture_outcome_evidence()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_trace uuid:=gen_random_uuid();
  v_run gf_core.decision_runs%rowtype;
  v_eligible jsonb := '[]'::jsonb;
  v_exposed jsonb := '[]'::jsonb;
begin
  if coalesce((select evidence_use_allowed from gf_core.privacy_preferences where person_id=new.person_id),false) then
    select * into v_run
    from gf_core.decision_runs
    where episode_id=new.episode_id and person_id=new.person_id
    order by created_at desc limit 1;

    if v_run.decision_run_id is not null then
      select coalesce(jsonb_agg(jsonb_build_object(
        'help_id',dc.help_id,
        'help_version_id',dc.help_version_id,
        'eligibility_status',dc.eligibility_status,
        'reason_key',dc.reason_key,
        'priority_hint',dc.priority_hint
      ) order by dc.priority_hint, dc.created_at),'[]'::jsonb)
      into v_eligible
      from gf_core.decision_candidates dc
      where dc.decision_run_id=v_run.decision_run_id;

      select coalesce(jsonb_agg(jsonb_build_object(
        'help_id',ce.help_id,
        'help_version_id',ce.help_version_id,
        'display_rank',ce.display_rank
      ) order by ce.display_rank),'[]'::jsonb)
      into v_exposed
      from gf_core.candidate_exposures ce
      where ce.decision_run_id=v_run.decision_run_id;
    end if;

    insert into gf_private.evidence_units(person_pseudonym,source_kind,source_id,signal_type,signal_value,context,contract_version)
    values(
      new.person_id,
      'outcome',
      new.outcome_id,
      'help_effect',
      new.effect,
      jsonb_build_object(
        'help_id',new.help_id,
        'applied',new.applied,
        'episode_id',new.episode_id,
        'decision_run_id',v_run.decision_run_id,
        'policy_version',v_run.policy_version,
        'interpreter_version',v_run.interpreter_version,
        'coverage_version',v_run.coverage_version,
        'coverage_state',v_run.coverage_state,
        'decision_reason_key',v_run.decision_reason_key,
        'continuity_context',coalesce(v_run.continuity_context,'{}'::jsonb),
        'eligible_candidates',v_eligible,
        'exposed_candidates',v_exposed
      ),
      'evidence.v2'
    );
    insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance)
    values('EvidenceUnitCaptured','evidence_unit',new.outcome_id,'system','evidence-capture',new.person_id,v_trace,'s4.v2',jsonb_build_object('source_kind','outcome','effect',new.effect,'help_id',new.help_id,'decision_run_id',v_run.decision_run_id),'{}'::jsonb);
  end if;
  return new;
end $$;

create or replace function public.lumen_s1_accompany_moment(p_expression text, p_locale text, p_language text, p_surface text, p_trace_id uuid)
returns jsonb
language plpgsql
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_person uuid;
  v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());
  v_expression text:=trim(coalesce(p_expression,''));
  v_interp jsonb;
  v_moment uuid;
  v_episode uuid;
  v_run uuid;
  v_needs text[];
  v_intent text;
  v_safety text;
  v_candidate_count integer:=0;
  v_primary jsonb;
  v_alt jsonb;
  v_rank integer:=0;
  v_memory boolean:=false;
  v_context jsonb:='{}'::jsonb;
  v_active_trajectory_ids jsonb:='[]'::jsonb;
  v_repertoire_help_ids jsonb:='[]'::jsonb;
  v_repertoire_available boolean:=false;
  r record;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'persistent accompaniment requires a non-anonymous account' using errcode='42501'; end if;
  if char_length(v_expression)=0 or char_length(v_expression)>4000 then raise exception 'expression must contain 1..4000 characters' using errcode='22023'; end if;

  perform set_config('app.trace_id',v_trace::text,true);
  perform public.lumen_bootstrap_person(v_trace);
  v_person:=gf_core.current_person_id();
  if v_person is null then raise exception 'person unavailable'; end if;

  select coalesce(memory_allowed,false) into v_memory from gf_core.privacy_preferences where person_id=v_person;
  if v_memory then
    select coalesce(jsonb_agg(trajectory_id order by updated_at desc),'[]'::jsonb)
      into v_active_trajectory_ids
    from gf_core.trajectories where person_id=v_person and status='active';
    select coalesce(jsonb_agg(help_id order by updated_at desc),'[]'::jsonb)
      into v_repertoire_help_ids
    from gf_core.personal_repertoire where person_id=v_person and status='active';
  end if;
  v_context:=jsonb_build_object(
    'memory_used',v_memory,
    'active_trajectory_ids',v_active_trajectory_ids,
    'repertoire_help_ids',v_repertoire_help_ids
  );

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
    return jsonb_build_object('scene_id','moment.clarify','scene_version','s1.v2','presence_mode','P3','human_intent',v_intent,'episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','clarify.more_context')),'available_actions',jsonb_build_array(jsonb_build_object('id','tell_more','intent','continue_expression')),'safety',jsonb_build_object('state',v_safety),'coverage',jsonb_build_object('state','unknown'));
  end if;

  insert into gf_core.accompaniment_episodes(person_id,moment_id,status)
  values(v_person,v_moment,case when v_safety='blocked' then 'no_match' else 'proposed' end) returning episode_id into v_episode;

  if v_safety='blocked' then
    insert into gf_core.no_match_events(episode_id,person_id,reason_code,coverage_state,coverage_gap) values(v_episode,v_person,'safety_scope','restricted',false);
    update gf_core.moments set status='decided' where moment_id=v_moment;
    return jsonb_build_object('scene_id','moment.safety_referral','scene_version','s1.v2','presence_mode','P4','human_intent','seek_support','episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','safety_referral','semantic_key','safety.human_help_now')),'available_actions',jsonb_build_array(jsonb_build_object('id','seek_human_help','intent','seek_human_help'),jsonb_build_object('id','close','intent','close')),'safety',jsonb_build_object('state','blocked'),'coverage',jsonb_build_object('state','restricted','reason','safety_scope'));
  end if;

  select count(distinct hp.help_id) into v_candidate_count
  from gf_core.coverage_cells cc join gf_core.help_possibilities hp on hp.help_id=cc.help_id
  where hp.lifecycle in('active_limited','active') and cc.status in('covered','partial') and cc.need_key=any(v_needs)
    and (cc.locale_pattern='*' or coalesce(nullif(trim(p_locale),''),'es-AR') like replace(cc.locale_pattern,'*','%'));

  if v_candidate_count=0 then
    insert into gf_core.no_match_events(episode_id,person_id,reason_code,coverage_state,coverage_gap) values(v_episode,v_person,'no_sufficient_coverage','not_covered',true);
    update gf_core.accompaniment_episodes set status='no_match',completed_at=now() where episode_id=v_episode;
    update gf_core.moments set status='decided' where moment_id=v_moment;
    return jsonb_build_object('scene_id','moment.no_match','scene_version','s1.v2','presence_mode','P2','human_intent',v_intent,'episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','no_match.honest')),'available_actions',jsonb_build_array(jsonb_build_object('id','rephrase','intent','rephrase'),jsonb_build_object('id','close','intent','close')),'safety',jsonb_build_object('state','clear'),'coverage',jsonb_build_object('state','not_covered','reason','no_sufficient_coverage'));
  end if;

  if v_memory then
    select exists(
      select 1 from gf_core.personal_repertoire pr
      join gf_core.coverage_cells cc on cc.help_id=pr.help_id
      join gf_core.help_possibilities hp on hp.help_id=pr.help_id
      where pr.person_id=v_person and pr.status='active' and hp.lifecycle in('active_limited','active')
        and cc.status in('covered','partial') and cc.need_key=any(v_needs)
        and (cc.locale_pattern='*' or coalesce(nullif(trim(p_locale),''),'es-AR') like replace(cc.locale_pattern,'*','%'))
    ) into v_repertoire_available;
  end if;

  insert into gf_core.decision_runs(episode_id,person_id,policy_version,interpreter_version,coverage_version,safety_state,coverage_state,eligible_count,decision_reason_key,continuity_context)
  values(v_episode,v_person,'decision.v3','rules.v3','coverage.v3',v_safety,'covered',v_candidate_count,case when v_repertoire_available then 'continuity_repertoire_available' else 'intent_aware_covered_match' end,v_context)
  returning decision_run_id into v_run;

  for r in
    with eligible as (
      select hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail,
             min(case when cc.intent_key=v_intent then 0 when cc.intent_key is null then 1 else 2 end) as intent_rank,
             min(case cc.status when 'covered' then 0 else 1 end) as status_rank,
             min(cc.priority_hint) as priority_hint,
             case when v_memory and exists(select 1 from gf_core.personal_repertoire pr where pr.person_id=v_person and pr.help_id=hp.help_id and pr.status='active') then 0 else 1 end as repertoire_rank
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
    select * from eligible order by repertoire_rank,intent_rank,status_rank,priority_hint,canonical_code limit 2
  loop
    v_rank:=v_rank+1;
    insert into gf_core.decision_candidates(decision_run_id,person_id,help_id,help_version_id,eligibility_status,reason_key,priority_hint)
    values(v_run,v_person,r.help_id,r.help_version_id,'eligible',case when r.repertoire_rank=0 then 'own_repertoire_relevant' when r.intent_rank=0 then 'intent_coverage_match' else 'coverage_match' end,r.priority_hint);
    insert into gf_core.candidate_exposures(decision_run_id,person_id,help_id,help_version_id,display_rank)
    values(v_run,v_person,r.help_id,r.help_version_id,v_rank);
    if v_rank=1 then
      v_primary:=jsonb_build_object('help_id',r.help_id,'help_version_id',r.help_version_id,'help_type',r.help_type,'title',r.title,'summary',r.summary,'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail,'from_own_repertoire',r.repertoire_rank=0);
    elsif v_rank=2 then
      v_alt:=jsonb_build_object('help_id',r.help_id,'help_version_id',r.help_version_id,'help_type',r.help_type,'title',r.title,'summary',r.summary,'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail,'from_own_repertoire',r.repertoire_rank=0);
    end if;
  end loop;

  update gf_core.moments set status='decided' where moment_id=v_moment;
  return jsonb_build_object(
    'scene_id','moment.help','scene_version','s1.v2','presence_mode','P2','human_intent',v_intent,
    'episode_id',v_episode,'moment_id',v_moment,'decision_run_id',v_run,'trace_id',v_trace,
    'semantic_blocks',jsonb_build_array(
      jsonb_build_object('type','lumi_line','semantic_key','help.offer_humble'),
      jsonb_build_object('type','help_preview','primary',v_primary,'alternative',v_alt),
      jsonb_build_object('type','continuity_hint','semantic_key',case when coalesce((v_primary->>'from_own_repertoire')::boolean,false) then 'continuity.own_repertoire' else 'continuity.none' end)
    ),
    'available_actions',jsonb_build_array(jsonb_build_object('id','try_primary','intent','select_help','payload',jsonb_build_object('help_id',v_primary->>'help_id')),jsonb_build_object('id','not_this','intent','reject_help')),
    'safety',jsonb_build_object('state','clear'),'coverage',jsonb_build_object('state','covered'),
    'interpretation',jsonb_build_object('intent_key',v_intent,'confidence',v_interp->'confidence','uncertainty_key',v_interp->'uncertainty_key'),
    'continuity',jsonb_build_object('memory_used',v_memory,'own_repertoire_reused',coalesce((v_primary->>'from_own_repertoire')::boolean,false),'active_trajectory_count',jsonb_array_length(v_active_trajectory_ids))
  );
end $$;

create or replace function public.lumen_s2_update_sanctuary(p_entry_id uuid, p_title text, p_content text, p_trace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_person uuid;
  v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());
  v_content text:=trim(coalesce(p_content,''));
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
  select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
  if v_person is null then raise exception 'person unavailable' using errcode='P0002'; end if;
  if char_length(v_content) not between 1 and 4000 then raise exception 'invalid sanctuary entry' using errcode='22023'; end if;
  update gf_private.sanctuary_entries
    set title=nullif(trim(p_title),''), content_text=v_content, updated_at=now()
    where entry_id=p_entry_id and person_id=v_person;
  if not found then raise exception 'entry not found' using errcode='P0002'; end if;
  perform gf_private.emit_person_event('SanctuaryUpdated','sanctuary_entry',p_entry_id,v_person,v_trace,'s2.v2',jsonb_build_object('content_changed',true));
  return jsonb_build_object('entry_id',p_entry_id,'updated',true,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s2_export_sanctuary()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_person uuid;
  v_entries jsonb;
  v_trajectories jsonb;
  v_repertoire jsonb;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
  select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
  if v_person is null then raise exception 'person unavailable' using errcode='P0002'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'entry_id',entry_id,'entry_kind',entry_kind,'title',title,'content',content_text,
    'source_help_id',source_help_id,'created_at',created_at,'updated_at',updated_at
  ) order by created_at),'[]'::jsonb) into v_entries
  from gf_private.sanctuary_entries where person_id=v_person;

  select coalesce(jsonb_agg(jsonb_build_object(
    'trajectory_id',trajectory_id,'faro_text',faro_text,'status',status,'created_at',created_at,'updated_at',updated_at
  ) order by created_at),'[]'::jsonb) into v_trajectories
  from gf_core.trajectories where person_id=v_person;

  select coalesce(jsonb_agg(jsonb_build_object(
    'repertoire_id',repertoire_id,'help_id',help_id,'source_outcome_id',source_outcome_id,
    'status',status,'times_reused',times_reused,'created_at',created_at,'updated_at',updated_at
  ) order by created_at),'[]'::jsonb) into v_repertoire
  from gf_core.personal_repertoire where person_id=v_person;

  return jsonb_build_object(
    'export_version','sanctuary.v1',
    'generated_at',now(),
    'sanctuary_entries',v_entries,
    'trajectories',v_trajectories,
    'personal_repertoire',v_repertoire
  );
end $$;

revoke all on function public.lumen_s2_update_sanctuary(uuid,text,text,uuid) from public, anon;
grant execute on function public.lumen_s2_update_sanctuary(uuid,text,text,uuid) to authenticated;
revoke all on function public.lumen_s2_export_sanctuary() from public, anon;
grant execute on function public.lumen_s2_export_sanctuary() to authenticated;

create or replace function public.lumen_embryo_health()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_source integer;
  v_coverage integer;
  v_types integer;
  v_policy integer;
  v_provider_ready integer;
  v_integrity_status text;
  v_integrity_version integer;
  v_state text;
begin
  select count(*) into v_source from gf_core.help_possibilities where lifecycle in ('active_limited','active');
  select count(*) into v_coverage from gf_core.coverage_cells where status in ('covered','partial');
  select count(distinct help_type) into v_types from gf_core.help_possibilities where lifecycle in ('active_limited','active');
  select version into v_policy from gf_private.runtime_policies where policy_key='source_discovery';
  select count(*) into v_provider_ready from gf_private.provider_runtime_status where status='ready';
  select config->>'status', version into v_integrity_status, v_integrity_version
    from gf_private.runtime_policies where policy_key='canonical_integrity';
  v_integrity_status:=coalesce(v_integrity_status,'uncertified');
  v_state := case when v_source >= 16 and v_coverage >= 18 and v_types >= 4 and v_integrity_status='certified' then 'operational' else 'forming' end;
  return jsonb_build_object(
    'state',v_state,
    'release_contract','embryo.v0.4',
    'slices',jsonb_build_object('s0','implemented','s1','implemented','s2','implemented','s3','implemented','s4','implemented','s5','implemented','s6','implemented','s7','implemented'),
    'canonical_integrity',jsonb_build_object('status',v_integrity_status,'version',v_integrity_version,'authority_set',jsonb_build_array('V37','V39','V40','V41','V43')),
    'source',jsonb_build_object('active_possibilities',v_source,'coverage_cells',v_coverage,'semantic_types',v_types),
    'evolution',jsonb_build_object('source_policy_version',coalesce(v_policy,1)),
    'operations',jsonb_build_object('providers_ready',v_provider_ready),
    'prelaunch_reset_required',true
  );
end $$;
