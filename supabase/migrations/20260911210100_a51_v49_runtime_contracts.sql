-- A51 · V49 clean convergence · runtime contracts
-- One current contract per function. No V47 bridge, no versioned RPC archaeology.

create or replace function gf_core.s1_interpret(p_expression text)
returns jsonb
language plpgsql
immutable
set search_path=''
as $$
declare
  v text:=lower(trim(coalesce(p_expression,'')));
  v_areas text[]:='{}';
  v_caps text[]:='{}';
  v_conf numeric(4,3):=0.30;
  v_clarify boolean:=false;
  v_safety text:='clear';
  v_rule text:='open_expression';
begin
  if char_length(v)<3 or v ~ '^(no sé|no se|ni idea|qué sé yo|que se yo)[.! ]*$' then
    return jsonb_build_object('taxonomy_version','life-taxonomy.v1','area_keys','[]'::jsonb,'capacity_keys','[]'::jsonb,'confidence',0.10,'uncertainty_key','too_little_context','requires_clarification',true,'safety_state','clear','features',jsonb_build_object('ruleset','orientation.rules.v1','rule_key','too_little_context'));
  end if;

  if v ~ '(suicid|matarme|quiero morir|no quiero seguir viviendo|hacerme daño|hacerme dano|self[- ]?harm|kill myself|overdose|sobredosis|violencia grave|abuso grave)' then
    return jsonb_build_object('taxonomy_version','life-taxonomy.v1','area_keys','[]'::jsonb,'capacity_keys','[]'::jsonb,'confidence',0.95,'uncertainty_key',null,'requires_clarification',false,'safety_state','blocked','features',jsonb_build_object('ruleset','orientation.rules.v1','risk_pattern_detected',true));
  elsif v ~ '(duelo|falleci|murió|murio|muerte de|perdí a|perdi a|luto|ruptura|vacío enorme|vacio enorme)' then v_areas:=array['relationships'];v_caps:=array['integration'];v_conf:=0.88;v_rule:='grief';
  elsif v ~ '(no puedo dormir|insomnio|dormir mal|me despierto|conciliar el sueño|conciliar el sueno|sueño cortado|sueno cortado|me cuesta dormirme)' then v_areas:=array['wellbeing'];v_caps:=array['regulation'];v_conf:=0.86;v_rule:='sleep';
  elsif v ~ '(plata|dinero|deuda|finanzas|gastos|fin de mes|vencim|económic|economic|saldo)' then v_areas:=array['economy'];v_caps:=array['discernment'];v_conf:=0.85;v_rule:='economy';
  elsif v ~ '(mudanza|me mud[eé]|nuevo trabajo|cambio de vida|transición|transicion|me jubil|me recibí|me recibi|me qued[eé] sin trabajo|perdí el trabajo|perdi el trabajo)' then v_areas:=array['general_life'];v_caps:=array['adaptation'];v_conf:=0.84;v_rule:='transition';
  elsif v ~ '(cuido a|persona que cuido|cuidador|cuidadora|cuidando a|familiar enfermo|haciendo cargo de)' then v_areas:=array['family_care'];v_caps:=array['self_compassion'];v_conf:=0.83;v_rule:='caregiving';
  elsif v ~ '(poner un límite|poner un limite|decir que no|me invade|se aprovecha|no respeta|necesito un límite|necesito un limite)' then v_areas:=array['relationships'];v_caps:=array['agency'];v_conf:=0.84;v_rule:='boundaries';
  elsif v ~ '(ansiedad|ansioso|ansiosa|angustia|preocupad|nervios|miedo constante|mente no para|no dejo de imaginar|pecho apretado|cabeza acelerada|darle vueltas)' then v_areas:=array['wellbeing'];v_caps:=array['regulation'];v_conf:=0.84;v_rule:='anxiety';
  elsif v ~ '(enojad|enfadad|furios|ira|bronca|rabia|explotar|responder en caliente)' then v_areas:=array['wellbeing'];v_caps:=array['regulation'];v_conf:=0.84;v_rule:='emotion_regulation';
  elsif v ~ '(pelea|discutimos|discusión|discusion|conflicto con|reconciliar|pedir perdón|pedir perdon|disculparme|arreglar con)' then v_areas:=array['relationships'];v_caps:=array['connection'];v_conf:=0.84;v_rule:='relationship_repair';
  elsif v ~ '(me odio|soy un fracaso|culpa|vergüenza|verguenza|me castigo|no me perdono|muy duro conmigo|muy dura conmigo)' then v_areas:=array['wellbeing'];v_caps:=array['self_compassion'];v_conf:=0.82;v_rule:='self_compassion';
  elsif v ~ '(no confío en mí|no confio en mi|insegur|no soy capaz|comparándome|comparandome|autoestima|no estoy a la altura)' then v_areas:=array['general_life'];v_caps:=array['agency'];v_conf:=0.82;v_rule:='confidence';
  elsif v ~ '(hábito|habito|rutina|constancia|dejé de|deje de|retomar.*ejercicio|mantener.*costumbre)' then v_areas:=array['general_life'];v_caps:=array['agency'];v_conf:=0.80;v_rule:='habit';
  elsif v ~ '(sin energía|sin energia|sin ganas de nada|apagado|apagada|sedentario|necesito activarme|moverme un poco)' then v_areas:=array['wellbeing'];v_caps:=array['agency'];v_conf:=0.79;v_rule:='energy';
  elsif v ~ '(distraíd|distraid|no me concentro|no puedo concentrarme|pierdo el foco|mil pestañas|mil pestanas|teléfono cada|telefono cada)' then v_areas:=array['learning_growth'];v_caps:=array['attention'];v_conf:=0.80;v_rule:='focus';
  elsif v ~ '(en automático|en automatico|para qué hago todo|para que hago todo|sentido|propósito|proposito|qué importa|que importa|valores|dirección|direccion)' then v_areas:=array['meaning_spirituality'];v_caps:=array['meaning'];v_conf:=0.80;v_rule:='meaning';
  elsif v ~ '(trabajo|laburo|jefe|reuniones|burnout|agotamiento laboral|sobrecarga laboral|no desconecto|tapado de trabajo)' then v_areas:=array['work'];v_caps:=array['regulation'];v_conf:=0.80;v_rule:='work_stress';
  elsif v ~ '(no sé qué hacer|no se que hacer|no sé si|no se si|decidir|decisión|decision|confund|ordenar.*idea|claridad|qué quiero|que quiero)' then v_areas:=array['general_life'];v_caps:=array['discernment'];v_conf:=0.82;v_rule:='clarity';
  elsif v ~ '(bloquead|trabado|procrast|pateándolo|pateandolo|posterg|empezar|arrancar|primer paso|pequeño paso|pequeno paso)' then v_areas:=array['general_life'];v_caps:=array['agency'];v_conf:=0.80;v_rule:='move_forward';
  elsif v ~ '(saturad|abrumad|agotad|cansad|necesito parar|bajar un cambio|demasiado|no me entra una más|no me entra una mas)' then v_areas:=array['wellbeing'];v_caps:=array['regulation'];v_conf:=0.78;v_rule:='overload';
  elsif v ~ '(solo|sola|acompañ|acompan|hablar con alguien|necesito apoyo|conectar con alguien)' then v_areas:=array['relationships'];v_caps:=array['connection'];v_conf:=0.76;v_rule:='connection';
  elsif v ~ '(agradec|valorar|apreciar|algo bueno|reconocer lo bueno|gesto.*me hizo muy bien)' then v_areas:=array['general_life'];v_caps:=array['appreciation'];v_conf:=0.78;v_rule:='appreciation';
  else v_clarify:=true;v_conf:=0.30;v_rule:='open_expression';
  end if;

  return jsonb_build_object('taxonomy_version','life-taxonomy.v1','area_keys',to_jsonb(v_areas),'capacity_keys',to_jsonb(v_caps),'confidence',v_conf,'uncertainty_key',case when v_clarify then 'insufficient_orientation' else null end,'requires_clarification',v_clarify,'safety_state',v_safety,'features',jsonb_build_object('ruleset','orientation.rules.v1','rule_key',v_rule));
end $$;

create or replace function gf_ledger.emit_s1_event()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  v_trace uuid;v_event_id uuid;v_type text;v_second text;v_person uuid;v_agg text;v_agg_id uuid;
  v_payload jsonb:='{}'::jsonb;v_second_payload jsonb:='{}'::jsonb;
  v_help_id uuid;v_help_version_id uuid;v_decision_run_id uuid;
begin
  begin v_trace:=nullif(current_setting('app.trace_id',true),'')::uuid; exception when others then v_trace:=null; end;
  v_trace:=coalesce(v_trace,gen_random_uuid());
  if tg_table_name='moments' then
    v_type:='MomentReceived';v_person:=new.person_id;v_agg:='moment';v_agg_id:=new.moment_id;
    v_payload:=jsonb_build_object('locale',new.locale,'language',new.language,'surface',new.surface,'expression_length',new.expression_length,'original_retention',new.original_retention);
  elsif tg_table_name='moment_interpretations' then
    v_type:='MomentInterpreted';v_person:=new.person_id;v_agg:='moment';v_agg_id:=new.moment_id;
    v_payload:=jsonb_build_object('interpreter_version',new.interpreter_version,'taxonomy_version',new.taxonomy_version,'area_keys',new.area_keys,'capacity_keys',new.capacity_keys,'confidence',new.confidence,'requires_clarification',new.requires_clarification,'safety_state',new.safety_state);
  elsif tg_table_name='decision_runs' then
    v_type:='CandidateSetGenerated';v_person:=new.person_id;v_agg:='decision_run';v_agg_id:=new.decision_run_id;
    v_payload:=jsonb_build_object('policy_version',new.policy_version,'interpreter_version',new.interpreter_version,'coverage_version',new.coverage_version,'safety_state',new.safety_state,'coverage_state',new.coverage_state,'eligible_count',new.eligible_count,'decision_reason_key',new.decision_reason_key,'continuity_context',new.continuity_context);
  elsif tg_table_name='candidate_exposures' then
    v_type:='CandidateExposed';v_person:=new.person_id;v_agg:='decision_run';v_agg_id:=new.decision_run_id;
    v_payload:=jsonb_build_object('help_id',new.help_id,'help_version_id',new.help_version_id,'display_rank',new.display_rank);
  elsif tg_table_name='help_selections' then
    v_type:=case when new.action='selected' then 'HelpSelected' else 'HelpRejected' end;v_person:=new.person_id;v_agg:='episode';v_agg_id:=new.episode_id;
    v_payload:=jsonb_build_object('selection_id',new.selection_id,'decision_run_id',new.decision_run_id,'help_id',new.help_id,'help_version_id',new.help_version_id,'action',new.action);
    if new.action='selected' then v_second:='HelpStarted';v_second_payload:=v_payload; end if;
  elsif tg_table_name='outcomes_feedback' then
    select hs.help_id,hs.help_version_id,hs.decision_run_id into v_help_id,v_help_version_id,v_decision_run_id from gf_core.help_selections hs where hs.selection_id=new.selection_id;
    v_type:='OutcomeReported';v_person:=new.person_id;v_agg:='episode';v_agg_id:=new.episode_id;
    v_payload:=jsonb_build_object('selection_id',new.selection_id,'decision_run_id',v_decision_run_id,'help_id',v_help_id,'help_version_id',v_help_version_id,'effect',new.effect,'applied',new.applied);
    v_second:='HelpCompleted';v_second_payload:=v_payload;
  elsif tg_table_name='no_match_events' then
    v_type:='NoMatchDeclared';v_person:=new.person_id;v_agg:='episode';v_agg_id:=new.episode_id;
    v_payload:=jsonb_build_object('reason_code',new.reason_code,'coverage_state',new.coverage_state,'coverage_gap',new.coverage_gap);
    if new.coverage_gap then v_second:='CoverageGapDetected';v_second_payload:=v_payload;end if;
  else raise exception 'unsupported S1 audited table %',tg_table_name;
  end if;
  v_event_id:=gen_random_uuid();
  insert into gf_ledger.domain_events(event_id,event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance)
  values(v_event_id,v_type,v_agg,v_agg_id,'person',auth.uid()::text,v_person,v_trace,'s1.v49.1',v_payload,jsonb_build_object('source','postgres_trigger','slice','s1'));
  insert into gf_ledger.outbox(event_type,payload,idempotency_key) values(v_type,jsonb_build_object('event_id',v_event_id,'trace_id',v_trace,'aggregate_id',v_agg_id,'contract_version','s1.v49.1'),'ledger:'||v_event_id::text);
  if v_second is not null then
    v_event_id:=gen_random_uuid();
    insert into gf_ledger.domain_events(event_id,event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance)
    values(v_event_id,v_second,v_agg,v_agg_id,'person',auth.uid()::text,v_person,v_trace,'s1.v49.1',v_second_payload,jsonb_build_object('source','postgres_trigger','slice','s1'));
    insert into gf_ledger.outbox(event_type,payload,idempotency_key) values(v_second,jsonb_build_object('event_id',v_event_id,'trace_id',v_trace,'aggregate_id',v_agg_id,'contract_version','s1.v49.1'),'ledger:'||v_event_id::text);
  end if;
  return new;
end $$;

create or replace function gf_private.capture_outcome_evidence()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  v_trace uuid:=gen_random_uuid();v_run gf_core.decision_runs%rowtype;v_selection gf_core.help_selections%rowtype;
  v_eligible jsonb:='[]'::jsonb;v_exposed jsonb:='[]'::jsonb;v_area_keys text[]:='{}';v_capacity_keys text[]:='{}';v_taxonomy text;
begin
  if coalesce((select evidence_use_allowed from gf_core.privacy_preferences where person_id=new.person_id),false) then
    select * into v_selection from gf_core.help_selections where selection_id=new.selection_id and person_id=new.person_id;
    select * into v_run from gf_core.decision_runs where decision_run_id=v_selection.decision_run_id;
    select coalesce(jsonb_agg(jsonb_build_object('help_id',dc.help_id,'help_version_id',dc.help_version_id,'eligibility_status',dc.eligibility_status,'reason_key',dc.reason_key,'priority_hint',dc.priority_hint) order by dc.priority_hint,dc.created_at),'[]'::jsonb) into v_eligible from gf_core.decision_candidates dc where dc.decision_run_id=v_run.decision_run_id;
    select coalesce(jsonb_agg(jsonb_build_object('help_id',ce.help_id,'help_version_id',ce.help_version_id,'display_rank',ce.display_rank) order by ce.display_rank),'[]'::jsonb) into v_exposed from gf_core.candidate_exposures ce where ce.decision_run_id=v_run.decision_run_id;
    select mi.area_keys,mi.capacity_keys,mi.taxonomy_version into v_area_keys,v_capacity_keys,v_taxonomy
      from gf_core.accompaniment_episodes ae join lateral(select x.area_keys,x.capacity_keys,x.taxonomy_version from gf_core.moment_interpretations x where x.moment_id=ae.moment_id and x.person_id=new.person_id order by x.created_at desc limit 1) mi on true
      where ae.episode_id=new.episode_id and ae.person_id=new.person_id;
    insert into gf_private.evidence_units(person_pseudonym,source_kind,source_id,signal_type,signal_value,context,contract_version)
    values(new.person_id,'outcome',new.outcome_id,'help_effect',new.effect,jsonb_build_object('selection_id',new.selection_id,'help_id',v_selection.help_id,'help_version_id',v_selection.help_version_id,'applied',new.applied,'episode_id',new.episode_id,'decision_run_id',v_run.decision_run_id,'policy_version',v_run.policy_version,'interpreter_version',v_run.interpreter_version,'coverage_version',v_run.coverage_version,'coverage_state',v_run.coverage_state,'decision_reason_key',v_run.decision_reason_key,'continuity_context',coalesce(v_run.continuity_context,'{}'::jsonb),'taxonomy_version',v_taxonomy,'area_keys',to_jsonb(coalesce(v_area_keys,'{}'::text[])),'capacity_keys',to_jsonb(coalesce(v_capacity_keys,'{}'::text[])),'eligible_candidates',v_eligible,'exposed_candidates',v_exposed),'evidence.v49.1');
    update gf_core.help_applicability ha set evidence_count=ha.evidence_count+1,last_evidence_at=now(),updated_at=now()
      where ha.help_version_id=v_selection.help_version_id and ha.taxonomy_version=v_taxonomy and ha.area_key=any(coalesce(v_area_keys,'{}'::text[])) and ha.capacity_key=any(coalesce(v_capacity_keys,'{}'::text[]));
    insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance)
    values('EvidenceUnitCaptured','evidence_unit',new.outcome_id,'system','evidence-capture',new.person_id,v_trace,'s4.v49.1',jsonb_build_object('source_kind','outcome','effect',new.effect,'selection_id',new.selection_id,'help_id',v_selection.help_id,'help_version_id',v_selection.help_version_id,'decision_run_id',v_run.decision_run_id,'taxonomy_version',v_taxonomy),'{}'::jsonb);
  end if;
  return new;
end $$;

create or replace function public.lumen_s1_accompany_moment(p_expression text,p_locale text,p_language text,p_surface text,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_expression text:=trim(coalesce(p_expression,''));
  v_interp jsonb;v_moment uuid;v_episode uuid;v_run uuid;v_areas text[]:='{}';v_caps text[]:='{}';v_safety text;
  v_candidate_count integer:=0;v_has_applicable boolean:=false;v_coverage_state text:='unknown';v_primary jsonb;v_alt jsonb;v_rank integer:=0;
  v_memory boolean:=false;v_context jsonb:='{}'::jsonb;v_active_trajectory_ids jsonb:='[]'::jsonb;v_repertoire_help_ids jsonb:='[]'::jsonb;v_repertoire_available boolean:=false;r record;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'persistent accompaniment requires a non-anonymous account' using errcode='42501';end if;
  if char_length(v_expression)=0 or char_length(v_expression)>4000 then raise exception 'expression must contain 1..4000 characters' using errcode='22023';end if;
  perform set_config('app.trace_id',v_trace::text,true);perform public.lumen_bootstrap_person(v_trace);v_person:=gf_core.current_person_id();if v_person is null then raise exception 'person unavailable';end if;
  select coalesce(memory_allowed,false) into v_memory from gf_core.privacy_preferences where person_id=v_person;
  if v_memory then
    select coalesce(jsonb_agg(trajectory_id order by updated_at desc),'[]'::jsonb) into v_active_trajectory_ids from gf_core.trajectories where person_id=v_person and status='active';
    select coalesce(jsonb_agg(help_id order by updated_at desc),'[]'::jsonb) into v_repertoire_help_ids from gf_core.personal_repertoire where person_id=v_person and status='active';
  end if;
  insert into gf_core.moments(person_id,locale,language,surface,expression_length,original_retention,contract_version)
    values(v_person,coalesce(nullif(trim(p_locale),''),'es-AR'),coalesce(nullif(trim(p_language),''),'es'),coalesce(nullif(trim(p_surface),''),'web'),char_length(v_expression),'private_ref','s1.v49.1') returning moment_id into v_moment;
  insert into gf_private.moment_originals(moment_id,person_id,expression_text,retention_policy) values(v_moment,v_person,v_expression,'private_reclassifiable.v1')
    on conflict(moment_id) do update set expression_text=excluded.expression_text,retention_policy=excluded.retention_policy,updated_at=now(),revision=gf_private.moment_originals.revision+1;
  perform gf_private.emit_person_event('MomentOriginalPreserved','moment',v_moment,v_person,v_trace,'s1.v49.1',jsonb_build_object('original_retention','private_ref','retention_policy','private_reclassifiable.v1'));
  v_interp:=gf_core.s1_interpret(v_expression);v_safety:=v_interp->>'safety_state';
  v_areas:=array(select jsonb_array_elements_text(v_interp->'area_keys'));v_caps:=array(select jsonb_array_elements_text(v_interp->'capacity_keys'));
  v_context:=jsonb_build_object('memory_used',v_memory,'active_trajectory_ids',v_active_trajectory_ids,'repertoire_help_ids',v_repertoire_help_ids,'taxonomy_version','life-taxonomy.v1','area_keys',to_jsonb(v_areas),'capacity_keys',to_jsonb(v_caps));
  insert into gf_core.moment_interpretations(moment_id,person_id,interpreter_version,confidence,uncertainty_key,requires_clarification,safety_state,features,taxonomy_version,area_keys,capacity_keys)
    values(v_moment,v_person,'orientation.rules.v1',(v_interp->>'confidence')::numeric,v_interp->>'uncertainty_key',coalesce((v_interp->>'requires_clarification')::boolean,false),v_safety,coalesce(v_interp->'features','{}'::jsonb),'life-taxonomy.v1',v_areas,v_caps);
  if coalesce((v_interp->>'requires_clarification')::boolean,false) then
    insert into gf_core.accompaniment_episodes(person_id,moment_id,status,contract_version) values(v_person,v_moment,'clarification_needed','s1.v49.1') returning episode_id into v_episode;
    update gf_core.moments set status='clarification_needed' where moment_id=v_moment;
    return jsonb_build_object('scene_id','moment.clarify','scene_version','s1.v49.1','presence_mode','P3','episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','clarify.more_context')),'available_actions',jsonb_build_array(jsonb_build_object('id','tell_more','intent','continue_expression')),'safety',jsonb_build_object('state',v_safety),'coverage',jsonb_build_object('state','unknown'),'interpretation',jsonb_build_object('taxonomy_version','life-taxonomy.v1','area_keys',to_jsonb(v_areas),'capacity_keys',to_jsonb(v_caps),'confidence',v_interp->'confidence','uncertainty_key',v_interp->'uncertainty_key'),'privacy',jsonb_build_object('original_retention','private_ref','retention_policy','private_reclassifiable.v1','shared_learning',false));
  end if;
  insert into gf_core.accompaniment_episodes(person_id,moment_id,status,contract_version) values(v_person,v_moment,case when v_safety='blocked' then 'no_match' else 'proposed' end,'s1.v49.1') returning episode_id into v_episode;
  if v_safety='blocked' then
    insert into gf_core.no_match_events(episode_id,person_id,reason_code,coverage_state,coverage_gap) values(v_episode,v_person,'safety_scope','restricted',false);update gf_core.moments set status='decided' where moment_id=v_moment;
    return jsonb_build_object('scene_id','moment.safety_referral','scene_version','s1.v49.1','presence_mode','P4','episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','safety_referral','semantic_key','safety.human_help_now')),'available_actions',jsonb_build_array(jsonb_build_object('id','seek_human_help','intent','seek_human_help'),jsonb_build_object('id','close','intent','close')),'safety',jsonb_build_object('state','blocked'),'coverage',jsonb_build_object('state','restricted','reason','safety_scope'),'privacy',jsonb_build_object('original_retention','private_ref','retention_policy','private_reclassifiable.v1','shared_learning',false));
  end if;
  select count(distinct hp.help_id),coalesce(bool_or(ha.state='applicable'),false) into v_candidate_count,v_has_applicable
    from gf_core.help_applicability ha join gf_core.help_versions hv on hv.help_version_id=ha.help_version_id join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version
    where hp.lifecycle in('active_limited','active') and ha.state in('applicable','partial') and ha.taxonomy_version='life-taxonomy.v1' and ha.area_key=any(v_areas) and ha.capacity_key=any(v_caps);
  v_coverage_state:=case when v_candidate_count=0 then 'not_covered' when v_has_applicable then 'covered' else 'partial' end;
  if v_candidate_count=0 then
    insert into gf_core.no_match_events(episode_id,person_id,reason_code,coverage_state,coverage_gap) values(v_episode,v_person,'no_sufficient_applicability',v_coverage_state,true);
    update gf_core.accompaniment_episodes set status='no_match',completed_at=now() where episode_id=v_episode;update gf_core.moments set status='decided' where moment_id=v_moment;
    return jsonb_build_object('scene_id','moment.no_match','scene_version','s1.v49.1','presence_mode','P2','episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','no_match.honest')),'available_actions',jsonb_build_array(jsonb_build_object('id','rephrase','intent','rephrase'),jsonb_build_object('id','close','intent','close')),'safety',jsonb_build_object('state','clear'),'coverage',jsonb_build_object('state',v_coverage_state,'reason','no_sufficient_applicability'),'interpretation',jsonb_build_object('taxonomy_version','life-taxonomy.v1','area_keys',to_jsonb(v_areas),'capacity_keys',to_jsonb(v_caps),'confidence',v_interp->'confidence'),'privacy',jsonb_build_object('original_retention','private_ref','retention_policy','private_reclassifiable.v1','shared_learning',false));
  end if;
  if v_memory then
    select exists(select 1 from gf_core.personal_repertoire pr join gf_core.help_possibilities hp on hp.help_id=pr.help_id join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version join gf_core.help_applicability ha on ha.help_version_id=hv.help_version_id where pr.person_id=v_person and pr.status='active' and hp.lifecycle in('active_limited','active') and ha.state in('applicable','partial') and ha.taxonomy_version='life-taxonomy.v1' and ha.area_key=any(v_areas) and ha.capacity_key=any(v_caps)) into v_repertoire_available;
  end if;
  insert into gf_core.decision_runs(episode_id,person_id,policy_version,interpreter_version,coverage_version,safety_state,coverage_state,eligible_count,decision_reason_key,continuity_context)
    values(v_episode,v_person,'decision.v49.1','orientation.rules.v1','coverage.eval.v1',v_safety,v_coverage_state,v_candidate_count,case when v_repertoire_available then 'relevant_repertoire_available' else 'area_capacity_applicability_match' end,v_context) returning decision_run_id into v_run;
  for r in with eligible as(
    select hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail,
           bool_or(ha.state='applicable') as strong_match,count(*) as match_count,max(ha.applicability_confidence) as applicability_confidence,min(ha.priority_hint) as priority_hint,
           case when v_memory and exists(select 1 from gf_core.personal_repertoire pr where pr.person_id=v_person and pr.help_id=hp.help_id and pr.status='active') then 0 else 1 end as repertoire_rank
    from gf_core.help_applicability ha join gf_core.help_versions hv on hv.help_version_id=ha.help_version_id join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version
    join lateral(select hloc.* from gf_core.help_localizations hloc where hloc.help_version_id=hv.help_version_id order by case when hloc.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0 when left(hloc.locale,2)=left(coalesce(nullif(trim(p_language),''),'es'),2) then 1 when hloc.locale='es-AR' then 2 else 3 end limit 1) hl on true
    where hp.lifecycle in('active_limited','active') and ha.state in('applicable','partial') and ha.taxonomy_version='life-taxonomy.v1' and ha.area_key=any(v_areas) and ha.capacity_key=any(v_caps)
    group by hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail
  ) select * from eligible order by strong_match desc,match_count desc,applicability_confidence desc,repertoire_rank,priority_hint,canonical_code limit 2 loop
    v_rank:=v_rank+1;
    insert into gf_core.decision_candidates(decision_run_id,person_id,help_id,help_version_id,eligibility_status,reason_key,priority_hint)
      values(v_run,v_person,r.help_id,r.help_version_id,'eligible',case when r.repertoire_rank=0 then 'relevant_own_repertoire' else 'area_capacity_applicability' end,r.priority_hint);
    insert into gf_core.candidate_exposures(decision_run_id,person_id,help_id,help_version_id,display_rank) values(v_run,v_person,r.help_id,r.help_version_id,v_rank);
    if v_rank=1 then v_primary:=jsonb_build_object('help_id',r.help_id,'help_version_id',r.help_version_id,'help_type',r.help_type,'title',r.title,'summary',r.summary,'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail,'from_own_repertoire',r.repertoire_rank=0,'applicability_confidence',r.applicability_confidence);
    else v_alt:=jsonb_build_object('help_id',r.help_id,'help_version_id',r.help_version_id,'help_type',r.help_type,'title',r.title,'summary',r.summary,'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail,'from_own_repertoire',r.repertoire_rank=0,'applicability_confidence',r.applicability_confidence);end if;
  end loop;
  update gf_core.moments set status='decided' where moment_id=v_moment;
  return jsonb_build_object('scene_id','moment.help','scene_version','s1.v49.1','presence_mode','P2','episode_id',v_episode,'moment_id',v_moment,'decision_run_id',v_run,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','help.offer_humble'),jsonb_build_object('type','help_preview','primary',v_primary,'alternative',v_alt),jsonb_build_object('type','continuity_hint','semantic_key',case when coalesce((v_primary->>'from_own_repertoire')::boolean,false) then 'continuity.own_repertoire' else 'continuity.none' end)),'available_actions',jsonb_build_array(jsonb_build_object('id','try_primary','intent','select_help','payload',jsonb_build_object('help_id',v_primary->>'help_id')),jsonb_build_object('id','not_this','intent','reject_help')),'safety',jsonb_build_object('state','clear'),'coverage',jsonb_build_object('state',v_coverage_state),'interpretation',jsonb_build_object('taxonomy_version','life-taxonomy.v1','area_keys',to_jsonb(v_areas),'capacity_keys',to_jsonb(v_caps),'confidence',v_interp->'confidence','uncertainty_key',v_interp->'uncertainty_key'),'continuity',jsonb_build_object('memory_used',v_memory,'own_repertoire_reused',coalesce((v_primary->>'from_own_repertoire')::boolean,false),'active_trajectory_count',jsonb_array_length(v_active_trajectory_ids)),'delivery',jsonb_build_object('pattern','prepare_possibility_integrate','optional',true,'prepare_semantic_key','help.offer_humble','integrate_semantic_key','outcome.thank_and_release'),'privacy',jsonb_build_object('original_retention','private_ref','retention_policy','private_reclassifiable.v1','shared_learning',false));
end $$;

create or replace function public.lumen_s1_select_help(p_episode_id uuid,p_help_id uuid,p_action text,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_person uuid:=gf_core.current_person_id();v_action text:=lower(trim(p_action));v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_help jsonb;v_selection uuid;v_run uuid;v_help_version uuid;v_locale text:='es-AR';
begin
  if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
  if v_action not in('selected','rejected') then raise exception 'invalid action' using errcode='22023';end if;
  select ce.decision_run_id,ce.help_version_id,m.locale into v_run,v_help_version,v_locale
    from gf_core.candidate_exposures ce join gf_core.decision_runs dr on dr.decision_run_id=ce.decision_run_id join gf_core.accompaniment_episodes ae on ae.episode_id=dr.episode_id join gf_core.moments m on m.moment_id=ae.moment_id
    where dr.episode_id=p_episode_id and ce.person_id=v_person and ce.help_id=p_help_id order by dr.created_at desc,ce.display_rank limit 1;
  if v_run is null then raise exception 'help was not exposed in this episode' using errcode='42501';end if;
  perform set_config('app.trace_id',v_trace::text,true);
  insert into gf_core.help_selections(episode_id,person_id,decision_run_id,help_id,help_version_id,action) values(p_episode_id,v_person,v_run,p_help_id,v_help_version,v_action) returning selection_id into v_selection;
  update gf_core.accompaniment_episodes set status=case when v_action='selected' then 'selected' else 'rejected' end where episode_id=p_episode_id and person_id=v_person;
  select jsonb_build_object('help_id',hp.help_id,'help_version_id',hv.help_version_id,'help_type',hp.help_type,'title',hl.title,'summary',hl.summary,'content',hl.content_payload,'duration_minutes',hv.duration_minutes,'energy',hv.energy,'detail',hv.detail) into v_help
    from gf_core.help_versions hv join gf_core.help_possibilities hp on hp.help_id=hv.help_id join lateral(select hloc.* from gf_core.help_localizations hloc where hloc.help_version_id=hv.help_version_id order by case when hloc.locale=v_locale then 0 when left(hloc.locale,2)=left(v_locale,2) then 1 when hloc.locale='es-AR' then 2 else 3 end limit 1) hl on true where hv.help_version_id=v_help_version;
  return jsonb_build_object('selection_id',v_selection,'episode_id',p_episode_id,'action',v_action,'help',v_help,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s1_record_outcome(p_episode_id uuid,p_effect text,p_applied boolean,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();v_effect text:=lower(trim(p_effect));v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_selection uuid;
begin
  if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
  if v_effect not in('helped','not_helped','unsure') then raise exception 'invalid effect' using errcode='22023';end if;
  select selection_id into v_selection from gf_core.help_selections where episode_id=p_episode_id and person_id=v_person and action='selected' order by created_at desc limit 1;
  if v_selection is null then raise exception 'selected help unavailable' using errcode='42501';end if;
  perform set_config('app.trace_id',v_trace::text,true);
  insert into gf_core.outcomes_feedback(episode_id,person_id,selection_id,effect,applied) values(p_episode_id,v_person,v_selection,v_effect,p_applied);
  update gf_core.accompaniment_episodes set status='completed',completed_at=now() where episode_id=p_episode_id and person_id=v_person;
  return jsonb_build_object('selection_id',v_selection,'episode_id',p_episode_id,'effect',v_effect,'applied',p_applied,'trace_id',v_trace,'semantic_key','outcome.thank_and_release');
end $$;

create or replace function gf_private.activate_source_intake(p_intake_id uuid,p_reviewer text,p_target_lifecycle text default 'active_limited')
returns uuid language plpgsql security definer set search_path='' as $$
declare r gf_private.source_intake_candidates%rowtype;v_provider uuid;v_help uuid;v_version uuid;v_state text:=lower(trim(p_target_lifecycle));v_app jsonb;v_area text;v_cap text;v_app_state text;
begin
  if v_state not in('active_limited','active') then raise exception 'invalid target lifecycle';end if;
  select * into r from gf_private.source_intake_candidates where intake_id=p_intake_id for update;
  if r.intake_id is null or r.status not in('received','review') then raise exception 'intake unavailable';end if;
  if not (r.candidate ? 'title' and r.candidate ? 'summary' and r.candidate ? 'external_url' and r.candidate ? 'locale' and r.candidate ? 'applicability') or jsonb_typeof(r.candidate->'applicability')<>'array' then raise exception 'candidate incomplete';end if;
  select provider_id into v_provider from gf_core.providers where provider_code=r.provider_code;if v_provider is null then raise exception 'provider not registered';end if;
  insert into gf_core.help_possibilities(canonical_code,help_type,provider_id,lifecycle,risk_class,evidence_class,conflict_note) values(r.canonical_code,r.help_type,v_provider,v_state,coalesce(r.candidate->>'risk_class','low'),coalesce(r.candidate->>'evidence_class','external_curated'),r.candidate->>'conflict_note') returning help_id into v_help;
  insert into gf_core.help_versions(help_id,version,mechanism_key,detail,duration_minutes,energy,accessibility) values(v_help,1,coalesce(r.candidate->>'mechanism_key','external_resource'),jsonb_build_object('external_url',r.candidate->>'external_url','source_kind','external'),nullif(r.candidate->>'duration_minutes','')::integer,nullif(r.candidate->>'energy',''),coalesce(r.candidate->'accessibility','{}'::jsonb)) returning help_version_id into v_version;
  insert into gf_core.help_localizations(help_version_id,locale,title,summary,content_payload,cultural_scope,provenance) values(v_version,r.candidate->>'locale',r.candidate->>'title',r.candidate->>'summary',jsonb_build_object('external_url',r.candidate->>'external_url','cta_label',coalesce(r.candidate->>'cta_label','Abrir recurso')),coalesce(array(select jsonb_array_elements_text(r.candidate->'cultural_scope')),'{}'),jsonb_build_object('provider_code',r.provider_code,'source_url',r.candidate->>'external_url','curated_by',p_reviewer));
  for v_app in select * from jsonb_array_elements(r.candidate->'applicability') loop
    v_area:=v_app->>'area_key';v_cap:=v_app->>'capacity_key';v_app_state:=coalesce(v_app->>'state','partial');
    if v_app_state not in('applicable','partial','restricted') then raise exception 'invalid applicability state';end if;
    if not exists(select 1 from gf_core.area_terms where taxonomy_version='life-taxonomy.v1' and area_key=v_area and status='active') then raise exception 'unknown area %',v_area;end if;
    if not exists(select 1 from gf_core.capacity_terms where taxonomy_version='life-taxonomy.v1' and capacity_key=v_cap and status='active') then raise exception 'unknown capacity %',v_cap;end if;
    insert into gf_core.help_applicability(help_version_id,taxonomy_version,area_key,capacity_key,state,priority_hint,applicability_confidence,provenance) values(v_version,'life-taxonomy.v1',v_area,v_cap,v_app_state,coalesce((v_app->>'priority_hint')::smallint,50),coalesce((v_app->>'confidence')::numeric,0.500),jsonb_build_object('source','source_intake','reviewed_by',p_reviewer));
  end loop;
  insert into gf_core.source_lifecycle_events(help_id,from_state,to_state,reason_key,actor_ref) values(v_help,'candidate',v_state,'curation_accepted',p_reviewer);
  update gf_private.source_intake_candidates set status='accepted',reviewed_by=p_reviewer,review_note='activated',updated_at=now() where intake_id=p_intake_id;
  insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,trace_id,contract_version,payload,provenance) values('SourcePossibilityActivated','help_possibility',v_help,'operator',p_reviewer,gen_random_uuid(),'s3.v49.1',jsonb_build_object('canonical_code',r.canonical_code,'lifecycle',v_state,'provider_code',r.provider_code),jsonb_build_object('intake_id',p_intake_id));
  return v_help;
end $$;

create or replace function public.lumen_source_discover(p_area_key text default null,p_capacity_key text default null,p_help_type text default null,p_locale text default 'es-AR',p_limit integer default 24)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_result jsonb;v_limit integer:=greatest(1,least(coalesce(p_limit,24),50));v_external_boost integer:=0;
begin
  select coalesce((config->>'external_boost')::integer,0) into v_external_boost from gf_private.runtime_policies where policy_key='source_discovery';
  select coalesce(jsonb_agg(x.item order by x.effective_priority,x.title),'[]'::jsonb) into v_result from(
    select coalesce(min(ha.priority_hint),100)+case when pr.provider_kind='internal_curated' then 0 else v_external_boost end effective_priority,hl.title,
      jsonb_build_object('help_id',hp.help_id,'canonical_code',hp.canonical_code,'help_type',hp.help_type,'lifecycle',hp.lifecycle,'risk_class',hp.risk_class,'evidence_class',hp.evidence_class,'title',hl.title,'summary',hl.summary,'content',hl.content_payload,'duration_minutes',hv.duration_minutes,'energy',hv.energy,'provider',jsonb_build_object('name',pr.display_name,'kind',pr.provider_kind,'provenance',pr.provenance,'rights',pr.rights),'areas',coalesce(jsonb_agg(distinct ha.area_key) filter(where ha.area_key is not null),'[]'::jsonb),'capacities',coalesce(jsonb_agg(distinct ha.capacity_key) filter(where ha.capacity_key is not null),'[]'::jsonb),'taxonomy_version','life-taxonomy.v1','localization_provenance',hl.provenance) item
    from gf_core.help_possibilities hp join gf_core.providers pr on pr.provider_id=hp.provider_id join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version
    join lateral(select h.* from gf_core.help_localizations h where h.help_version_id=hv.help_version_id order by case when h.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0 when left(h.locale,2)=left(coalesce(nullif(trim(p_locale),''),'es-AR'),2) then 1 when h.locale='es-AR' then 2 else 3 end limit 1) hl on true
    left join gf_core.help_applicability ha on ha.help_version_id=hv.help_version_id and ha.state in('applicable','partial') and ha.taxonomy_version='life-taxonomy.v1'
    where hp.lifecycle in('active_limited','active') and (p_help_type is null or hp.help_type=p_help_type)
      and (p_area_key is null or exists(select 1 from gf_core.help_applicability a where a.help_version_id=hv.help_version_id and a.taxonomy_version='life-taxonomy.v1' and a.state in('applicable','partial') and a.area_key=p_area_key and (p_capacity_key is null or a.capacity_key=p_capacity_key)))
      and (p_area_key is not null or p_capacity_key is null or exists(select 1 from gf_core.help_applicability a where a.help_version_id=hv.help_version_id and a.taxonomy_version='life-taxonomy.v1' and a.state in('applicable','partial') and a.capacity_key=p_capacity_key))
    group by hp.help_id,hp.canonical_code,hp.help_type,hp.lifecycle,hp.risk_class,hp.evidence_class,hv.help_version_id,hv.duration_minutes,hv.energy,hl.title,hl.summary,hl.content_payload,hl.provenance,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
    order by effective_priority,hl.title limit v_limit
  ) x;
  return v_result;
end $$;

create or replace function public.lumen_source_taxonomy()
returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object('taxonomy_version','life-taxonomy.v1','areas',coalesce((select jsonb_agg(jsonb_build_object('key',area_key,'label',display_name) order by display_name) from gf_core.area_terms where taxonomy_version='life-taxonomy.v1' and status='active'),'[]'::jsonb),'capacities',coalesce((select jsonb_agg(jsonb_build_object('key',capacity_key,'label',display_name) order by display_name) from gf_core.capacity_terms where taxonomy_version='life-taxonomy.v1' and status='active'),'[]'::jsonb)); $$;

create or replace function public.lumen_embryo_health()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_source integer;v_applicability integer;v_types integer;v_policy integer;v_provider_ready integer;v_integrity_status text;v_integrity_version integer;v_authority_set jsonb;v_state text;
begin
  select count(*) into v_source from gf_core.help_possibilities where lifecycle in('active_limited','active');
  select count(*) into v_applicability from gf_core.help_applicability where state in('applicable','partial');
  select count(distinct help_type) into v_types from gf_core.help_possibilities where lifecycle in('active_limited','active');
  select version into v_policy from gf_private.runtime_policies where policy_key='source_discovery';
  select count(*) into v_provider_ready from gf_private.provider_runtime_status where status='ready';
  select config->>'status',version,config->'authority_set' into v_integrity_status,v_integrity_version,v_authority_set from gf_private.runtime_policies where policy_key='canonical_integrity';
  v_integrity_status:=coalesce(v_integrity_status,'uncertified');v_authority_set:=coalesce(v_authority_set,'[]'::jsonb);
  v_state:=case when v_source>=16 and v_applicability>=18 and v_types>=4 and v_integrity_status='certified' then 'operational' else 'forming' end;
  return jsonb_build_object('state',v_state,'release_contract','embryo.v49.1','slices',jsonb_build_object('s0','implemented','s1','implemented','s2','implemented','s3','implemented','s4','implemented','s5','implemented','s6','implemented','s7','implemented'),'canonical_integrity',jsonb_build_object('status',v_integrity_status,'version',v_integrity_version,'authority_set',v_authority_set),'source',jsonb_build_object('active_possibilities',v_source,'applicability_relations',v_applicability,'semantic_types',v_types,'taxonomy_version','life-taxonomy.v1','coverage_contract','coverage.eval.v1'),'evolution',jsonb_build_object('source_policy_version',coalesce(v_policy,1)),'operations',jsonb_build_object('providers_ready',v_provider_ready),'prelaunch_reset_required',true);
end $$;

-- Clean final schema: remove superseded semantics only after all consumers are replaced.
drop function if exists public.lumen_s1_accompany_moment_v3(text,text,text,text,uuid);
drop function if exists public.lumen_s1_accompany_moment_v4(text,text,text,text,uuid);
drop function if exists public.lumen_s1_accompany_moment_v47_core(text,text,text,text,uuid);
drop function if exists gf_core.v47_orientation_bridge(text,text[]);
drop function if exists public.lumen_s1_record_outcome(uuid,uuid,text,boolean,uuid);
drop function if exists public.lumen_source_discover(text,text,text,integer);

alter table gf_core.moment_interpretations drop column if exists intent_key;
alter table gf_core.moment_interpretations drop column if exists need_keys;
alter table gf_core.outcomes_feedback drop constraint if exists outcomes_feedback_help_id_fkey;
alter table gf_core.outcomes_feedback drop column if exists help_id;
drop table if exists gf_core.coverage_cells;
drop table if exists gf_private.sanctuary_private_stub;

revoke execute on function public.lumen_s1_accompany_moment(text,text,text,text,uuid) from public,anon;
grant execute on function public.lumen_s1_accompany_moment(text,text,text,text,uuid) to authenticated;
revoke execute on function public.lumen_s1_select_help(uuid,uuid,text,uuid) from public,anon;
grant execute on function public.lumen_s1_select_help(uuid,uuid,text,uuid) to authenticated;
revoke execute on function public.lumen_s1_record_outcome(uuid,text,boolean,uuid) from public,anon;
grant execute on function public.lumen_s1_record_outcome(uuid,text,boolean,uuid) to authenticated;
revoke execute on function public.lumen_source_discover(text,text,text,text,integer) from public;
grant execute on function public.lumen_source_discover(text,text,text,text,integer) to anon,authenticated;
revoke execute on function public.lumen_source_taxonomy() from public;
grant execute on function public.lumen_source_taxonomy() to anon,authenticated;
revoke execute on function public.lumen_embryo_health() from public;
grant execute on function public.lumen_embryo_health() to anon,authenticated;
