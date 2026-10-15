CREATE OR REPLACE FUNCTION public.lumen_faro_agreement_snapshot(p_trajectory_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_person uuid:=gf_core.current_person_id();v_faro gf_core.trajectories;v_version gf_private.faro_agreement_versions;v_items jsonb;v_history jsonb;
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then return jsonb_build_object('state','without_memory','version',0,'items','[]'::jsonb,'history','[]'::jsonb);end if;
 select * into v_faro from gf_core.trajectories where trajectory_id=p_trajectory_id and person_id=v_person;
 if not found then raise exception 'Faro unavailable' using errcode='P0002';end if;
 select * into v_version from gf_private.faro_agreement_versions where trajectory_id=p_trajectory_id and person_id=v_person order by version desc limit 1;
 select coalesce(jsonb_agg(jsonb_build_object('identity_id',i.identity_id,'concept_id',i.concept_id,'label',i.label,'definition',i.definition,'contextual_meaning',i.contextual_meaning,'origin',i.origin,'status',i.status,'source_status',c.editorial_status) order by i.position),'[]'::jsonb) into v_items from gf_private.faro_agreement_items i left join gf_core.potential_concepts c on c.concept_id=i.concept_id where i.agreement_id=v_version.agreement_id;
 select coalesce(jsonb_agg(jsonb_build_object('version',a.version,'faro_text',a.faro_text,'validated_at',a.validated_at,'items',(select coalesce(jsonb_agg(jsonb_build_object('label',i.label,'status',i.status) order by i.position),'[]'::jsonb) from gf_private.faro_agreement_items i where i.agreement_id=a.agreement_id)) order by a.version desc),'[]'::jsonb) into v_history from gf_private.faro_agreement_versions a where a.trajectory_id=p_trajectory_id and a.person_id=v_person;
 return jsonb_build_object('state',case when v_version.agreement_id is null then 'unvalidated' when v_version.faro_text<>v_faro.faro_text then 'stale' else 'validated' end,'version',coalesce(v_version.version,0),'original_expression',(select expression_text from gf_private.moment_originals where moment_id=v_faro.origin_moment_id and person_id=v_person),'validated_at',v_version.validated_at,'faro_text',v_faro.faro_text,'faro_revision',v_faro.revision,'area_keys',coalesce(v_version.area_keys,'{}'::text[]),'items',v_items,'history',v_history);
end $function$;

CREATE OR REPLACE FUNCTION public.lumen_faro_agreement_validate(p_trajectory_id uuid, p_faro_text text, p_items jsonb, p_area_keys text[] DEFAULT '{}'::text[], p_expected_version integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_person uuid:=gf_core.current_person_id();v_faro gf_core.trajectories;v_current integer;v_id uuid;v_item jsonb;v_index integer:=0;v_concept uuid;v_trace uuid:=gen_random_uuid();
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then raise exception 'memory consent required' using errcode='42501';end if;
 select * into v_faro from gf_core.trajectories where trajectory_id=p_trajectory_id and person_id=v_person for update;
 if not found then raise exception 'Faro unavailable' using errcode='P0002';end if;
 if v_faro.faro_text<>trim(coalesce(p_faro_text,'')) then raise exception 'Faro changed; reread before confirming' using errcode='40001';end if;
 select coalesce(max(version),0) into v_current from gf_private.faro_agreement_versions where trajectory_id=p_trajectory_id;
 if p_expected_version is distinct from v_current then raise exception 'agreement changed; reread before confirming' using errcode='40001';end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)>24 then raise exception 'invalid agreement items' using errcode='22023';end if;
 if exists(select 1 from unnest(coalesce(p_area_keys,'{}'::text[])) k where not exists(select 1 from gf_core.area_terms a where a.area_key=k and a.status='active')) then raise exception 'invalid area' using errcode='22023';end if;
 if v_current>0 and exists(select 1 from gf_private.faro_agreement_versions a where a.trajectory_id=p_trajectory_id and a.version=v_current and a.faro_text=v_faro.faro_text and a.area_keys=coalesce(p_area_keys,'{}'::text[]) and (select coalesce(jsonb_agg(jsonb_build_object('identity_id',i.identity_id,'concept_id',i.concept_id,'label',i.label,'definition',i.definition,'contextual_meaning',i.contextual_meaning,'origin',i.origin,'status',i.status) order by i.position),'[]'::jsonb) from gf_private.faro_agreement_items i where i.agreement_id=a.agreement_id)=(select coalesce(jsonb_agg(value-'source_status'-'reason' order by ord),'[]'::jsonb) from jsonb_array_elements(p_items) with ordinality as input(value,ord))) then return public.lumen_faro_agreement_snapshot(p_trajectory_id);end if;
 insert into gf_private.faro_agreement_versions(trajectory_id,person_id,version,faro_text,area_keys) values(p_trajectory_id,v_person,v_current+1,v_faro.faro_text,coalesce(p_area_keys,'{}'::text[])) returning agreement_id into v_id;
 for v_item in select value from jsonb_array_elements(p_items) loop
  v_concept:=nullif(v_item->>'concept_id','')::uuid;
  if v_concept is not null and not exists(select 1 from gf_core.potential_concepts where concept_id=v_concept and editorial_status in('candidate','reviewed')) then raise exception 'concept unavailable' using errcode='22023';end if;
  if v_concept is not null and not exists(select 1 from gf_core.potential_concepts where concept_id=v_concept and label_es=trim(v_item->>'label')) then raise exception 'reformulated labels require personal concept identity' using errcode='22023';end if;
  insert into gf_private.faro_agreement_items(agreement_id,identity_id,concept_id,label,definition,contextual_meaning,origin,status,position) values(v_id,coalesce(nullif(v_item->>'identity_id','')::uuid,gen_random_uuid()),v_concept,trim(coalesce(v_item->>'label','')),coalesce(v_item->>'definition',''),coalesce(v_item->>'contextual_meaning',''),coalesce(v_item->>'origin','person'),coalesce(v_item->>'status','accepted'),v_index);
  v_index:=v_index+1;
 end loop;
 perform gf_private.emit_person_event('FaroPotentialAgreementValidated','trajectory',p_trajectory_id,v_person,v_trace,'faro.agreement.v1',jsonb_build_object('version',v_current+1,'item_count',v_index));
 return public.lumen_faro_agreement_snapshot(p_trajectory_id);
end $function$;
CREATE OR REPLACE FUNCTION gf_core.s1_interpret(p_expression text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  v text:=lower(trim(coalesce(p_expression,'')));
  v_areas text[]:='{}';
  v_caps text[]:='{}';
  v_conf numeric(4,3):=0.30;
  v_clarify boolean:=false;
  v_safety text:='clear';
  v_rule text:='open_expression';
  v_rules text[]:='{}';
begin
  if char_length(v)<3 or v ~ '^(no sé|no se|ni idea|qué sé yo|que se yo)[.! ]*$' then
    return jsonb_build_object('taxonomy_version','life-taxonomy.v1','area_keys','[]'::jsonb,'capacity_keys','[]'::jsonb,'confidence',0.10,'uncertainty_key','too_little_context','requires_clarification',true,'safety_state','clear','features',jsonb_build_object('ruleset','orientation.rules.v2','rule_keys','[]'::jsonb));
  end if;
  if v ~ '(suicid|matarme|quiero morir|no quiero seguir viviendo|hacerme daño|hacerme dano|self[- ]?harm|kill myself|overdose|sobredosis|violencia grave|abuso grave)' then
    return jsonb_build_object('taxonomy_version','life-taxonomy.v1','area_keys','[]'::jsonb,'capacity_keys','[]'::jsonb,'confidence',0.95,'requires_clarification',false,'safety_state','blocked','features',jsonb_build_object('ruleset','orientation.rules.v2','risk_pattern_detected',true));
  end if;
  -- Suppress explicit denials of states, without suppressing needs such as "no puedo dormir".
  v:=regexp_replace(v,'no (estoy|estamos|soy|somos|tengo|siento) (ansios[oa]s?|agotad[oa]s?|cansad[oa]s?|angustia|ansiedad|culpa|miedo|bronca|enojad[oa]s?)',' ','g');
  if v ~ '(duelo|falleci|murió|murio|muerte de|perdí a|perdi a|luto|ruptura|vacío enorme|vacio enorme)' then v_areas:=v_areas||array['relationships'];v_caps:=v_caps||array['integration'];v_conf:=greatest(v_conf,0.88);v_rules:=v_rules||'grief'::text;end if;
  if v ~ '(no puedo dormir|insomnio|dormir mal|me despierto|conciliar el sueño|conciliar el sueno|sueño cortado|sueno cortado|me cuesta dormirme)' then v_areas:=v_areas||array['wellbeing'];v_caps:=v_caps||array['regulation'];v_conf:=greatest(v_conf,0.86);v_rules:=v_rules||'sleep'::text;end if;
  if v ~ '(plata|dinero|deuda|finanzas|gastos|fin de mes|vencim|económic|economic|saldo)' then v_areas:=v_areas||array['economy'];v_caps:=v_caps||array['discernment'];v_conf:=greatest(v_conf,0.85);v_rules:=v_rules||'economy'::text;end if;
  if v ~ '(mudanza|me mud[eé]|nuevo trabajo|cambio de vida|transición|transicion|me jubil|me recibí|me recibi|me qued[eé] sin trabajo|perdí el trabajo|perdi el trabajo)' then v_areas:=v_areas||array['general_life'];v_caps:=v_caps||array['adaptation'];v_conf:=greatest(v_conf,0.84);v_rules:=v_rules||'transition'::text;end if;
  if v ~ '(cuido a|persona que cuido|cuidador|cuidadora|cuidando a|familiar enfermo|haciendo cargo de)' then v_areas:=v_areas||array['family_care'];v_caps:=v_caps||array['self_compassion'];v_conf:=greatest(v_conf,0.83);v_rules:=v_rules||'caregiving'::text;end if;
  if v ~ '(poner un límite|poner un limite|decir que no|me invade|se aprovecha|no respeta|necesito un límite|necesito un limite)' then v_areas:=v_areas||array['relationships'];v_caps:=v_caps||array['agency'];v_conf:=greatest(v_conf,0.84);v_rules:=v_rules||'boundaries'::text;end if;
  if v ~ '(ansiedad|ansioso|ansiosa|angustia|preocupad|nervios|miedo constante|mente no para|no dejo de imaginar|pecho apretado|cabeza acelerada|darle vueltas)' then v_areas:=v_areas||array['wellbeing'];v_caps:=v_caps||array['regulation'];v_conf:=greatest(v_conf,0.84);v_rules:=v_rules||'anxiety'::text;end if;
  if v ~ '(enojad|enfadad|furios|ira|bronca|rabia|explotar|responder en caliente)' then v_areas:=v_areas||array['wellbeing'];v_caps:=v_caps||array['regulation'];v_conf:=greatest(v_conf,0.84);v_rules:=v_rules||'emotion_regulation'::text;end if;
  if v ~ '(pelea|discutimos|discusión|discusion|conflicto con|reconciliar|pedir perdón|pedir perdon|disculparme|arreglar con)' then v_areas:=v_areas||array['relationships'];v_caps:=v_caps||array['connection'];v_conf:=greatest(v_conf,0.84);v_rules:=v_rules||'relationship_repair'::text;end if;
  if v ~ '(me odio|soy un fracaso|culpa|vergüenza|verguenza|me castigo|no me perdono|muy duro conmigo|muy dura conmigo)' then v_areas:=v_areas||array['wellbeing'];v_caps:=v_caps||array['self_compassion'];v_conf:=greatest(v_conf,0.82);v_rules:=v_rules||'self_compassion'::text;end if;
  if v ~ '(no confío en mí|no confio en mi|insegur|no soy capaz|comparándome|comparandome|autoestima|no estoy a la altura)' then v_areas:=v_areas||array['general_life'];v_caps:=v_caps||array['agency'];v_conf:=greatest(v_conf,0.82);v_rules:=v_rules||'confidence'::text;end if;
  if v ~ '(hábito|habito|rutina|constancia|dejé de|deje de|retomar.*ejercicio|mantener.*costumbre)' then v_areas:=v_areas||array['general_life'];v_caps:=v_caps||array['agency'];v_conf:=greatest(v_conf,0.80);v_rules:=v_rules||'habit'::text;end if;
  if v ~ '(sin energía|sin energia|sin ganas de nada|apagado|apagada|sedentario|necesito activarme|moverme un poco)' then v_areas:=v_areas||array['wellbeing'];v_caps:=v_caps||array['agency'];v_conf:=greatest(v_conf,0.79);v_rules:=v_rules||'energy'::text;end if;
  if v ~ '(distraíd|distraid|no me concentro|no puedo concentrarme|pierdo el foco|mil pestañas|mil pestanas|teléfono cada|telefono cada)' then v_areas:=v_areas||array['learning_growth'];v_caps:=v_caps||array['attention'];v_conf:=greatest(v_conf,0.80);v_rules:=v_rules||'focus'::text;end if;
  if v ~ '(en automático|en automatico|para qué hago todo|para que hago todo|sentido|propósito|proposito|qué importa|que importa|valores|dirección|direccion)' then v_areas:=v_areas||array['meaning_spirituality'];v_caps:=v_caps||array['meaning'];v_conf:=greatest(v_conf,0.80);v_rules:=v_rules||'meaning'::text;end if;
  if v ~ '(trabajo|laburo|jefe|reuniones|burnout|agotamiento laboral|sobrecarga laboral|no desconecto|tapado de trabajo)' then v_areas:=v_areas||array['work'];v_caps:=v_caps||array['regulation'];v_conf:=greatest(v_conf,0.80);v_rules:=v_rules||'work_stress'::text;end if;
  if v ~ '(no sé qué hacer|no se que hacer|no sé si|no se si|decidir|decisión|decision|confund|ordenar.*idea|claridad|qué quiero|que quiero)' then v_areas:=v_areas||array['general_life'];v_caps:=v_caps||array['discernment'];v_conf:=greatest(v_conf,0.82);v_rules:=v_rules||'clarity'::text;end if;
  if v ~ '(bloquead|trabado|procrast|pateándolo|pateandolo|posterg|empezar|arrancar|primer paso|pequeño paso|pequeno paso)' then v_areas:=v_areas||array['general_life'];v_caps:=v_caps||array['agency'];v_conf:=greatest(v_conf,0.80);v_rules:=v_rules||'move_forward'::text;end if;
  if v ~ '(saturad|abrumad|agotad|cansad|necesito parar|bajar un cambio|demasiado|no me entra una más|no me entra una mas)' then v_areas:=v_areas||array['wellbeing'];v_caps:=v_caps||array['regulation'];v_conf:=greatest(v_conf,0.78);v_rules:=v_rules||'overload'::text;end if;
  if v ~ '(solo|sola|acompañ|acompan|hablar con alguien|necesito apoyo|conectar con alguien)' then v_areas:=v_areas||array['relationships'];v_caps:=v_caps||array['connection'];v_conf:=greatest(v_conf,0.76);v_rules:=v_rules||'connection'::text;end if;
  if v ~ '(agradec|valorar|apreciar|algo bueno|reconocer lo bueno|gesto.*me hizo muy bien)' then v_areas:=v_areas||array['general_life'];v_caps:=v_caps||array['appreciation'];v_conf:=greatest(v_conf,0.78);v_rules:=v_rules||'appreciation'::text;end if;
  if v ~ '(mis hijos|mi hij[oa]|familia|maternidad|paternidad|crianza|criar)' then v_areas:=v_areas||array['family_care'];end if;
  if v ~ '(estudiar|estudio|aprender|aprendizaje|crear|creativ|pintar|escribir|oficio)' then v_areas:=v_areas||array['learning_growth'];end if;
  if cardinality(v_rules)=0 then v_clarify:=true;end if;
  select coalesce(array_agg(distinct x),'{}') into v_areas from unnest(v_areas) x;
  select coalesce(array_agg(distinct x),'{}') into v_caps from unnest(v_caps) x;
  v_rule:=coalesce(v_rules[1],'open_expression');
return jsonb_build_object('understanding',case v_rule when 'grief' then 'Tal vez buscás acompañamiento para atravesar una pérdida.' when 'sleep' then 'Tal vez querés encontrar un poco de descanso.' when 'economy' then 'Tal vez necesitás ordenar una preocupación económica.' when 'transition' then 'Tal vez estás buscando cómo atravesar un cambio.' when 'caregiving' then 'Tal vez necesitás cuidarte mientras cuidás a alguien.' when 'boundaries' then 'Tal vez querés encontrar una forma de poner un límite.' when 'anxiety' then 'Tal vez querés bajar un poco el ruido de las preocupaciones.' when 'emotion_regulation' then 'Tal vez necesitás espacio antes de responder desde el enojo.' when 'relationship_repair' then 'Tal vez querés cuidar o reparar un vínculo.' when 'self_compassion' then 'Tal vez necesitás tratarte con un poco más de amabilidad.' when 'confidence' then 'Tal vez querés recuperar confianza para dar un paso.' when 'habit' then 'Tal vez querés volver a algo que te hace bien.' when 'energy' then 'Tal vez querés recuperar algo de energía.' when 'focus' then 'Tal vez buscás un poco de espacio para concentrarte.' when 'meaning' then 'Tal vez querés acercarte a lo que tiene sentido para vos.' when 'work_stress' then 'Tal vez necesitás una pausa ante lo que te exige el trabajo.' when 'clarity' then 'Tal vez buscás claridad para decidir tu próximo paso.' when 'move_forward' then 'Tal vez querés encontrar un primer paso posible.' when 'overload' then 'Tal vez necesitás bajar un cambio y recuperar espacio.' when 'connection' then 'Tal vez buscás compañía o una forma de conectar.' when 'appreciation' then 'Tal vez querés darle lugar a algo bueno que viviste.' else 'Todavía necesito un poco más de contexto para comprender qué importa ahora.' end,'taxonomy_version','life-taxonomy.v1','area_keys',to_jsonb(v_areas),'capacity_keys',to_jsonb(v_caps),'confidence',v_conf,'uncertainty_key',case when v_clarify then 'insufficient_orientation' else null end,'requires_clarification',v_clarify,'safety_state',v_safety,'features',jsonb_build_object('ruleset','orientation.rules.v2','rule_key',v_rule,'rule_keys',to_jsonb(v_rules)));
end $function$;

drop function public.lumen_s1_accompany_moment(text,text,text,text,uuid);
CREATE OR REPLACE FUNCTION public.lumen_s1_accompany_moment(p_expression text, p_locale text, p_language text, p_surface text, p_trace_id uuid, p_review_first boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_expression text:=trim(coalesce(p_expression,''));v_interp jsonb;v_moment uuid;v_episode uuid;v_run uuid;v_areas text[]:='{}';v_caps text[]:='{}';v_safety text;v_candidate_count integer:=0;v_has_applicable boolean:=false;v_coverage_state text:='unknown';v_primary jsonb;v_alt jsonb;v_rank integer:=0;v_memory boolean:=false;v_context jsonb:='{}'::jsonb;v_active_trajectory_ids jsonb:='[]'::jsonb;v_repertoire_help_ids jsonb:='[]'::jsonb;v_repertoire_available boolean:=false;r record;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'persistent accompaniment requires a non-anonymous account' using errcode='42501';end if;if char_length(v_expression)=0 or char_length(v_expression)>4000 then raise exception 'expression must contain 1..4000 characters' using errcode='22023';end if;
  perform set_config('app.trace_id',v_trace::text,true);perform public.lumen_bootstrap_person(v_trace);v_person:=gf_core.current_person_id();if v_person is null then raise exception 'person unavailable';end if;select coalesce(memory_allowed,false) into v_memory from gf_core.privacy_preferences where person_id=v_person;
  if v_memory then select coalesce(jsonb_agg(trajectory_id order by updated_at desc),'[]'::jsonb) into v_active_trajectory_ids from gf_core.trajectories where person_id=v_person and status='active';select coalesce(jsonb_agg(help_id order by updated_at desc),'[]'::jsonb) into v_repertoire_help_ids from gf_core.personal_repertoire where person_id=v_person and status='active';end if;
  insert into gf_core.moments(person_id,locale,language,surface,expression_length,original_retention,contract_version) values(v_person,coalesce(nullif(trim(p_locale),''),'es-AR'),coalesce(nullif(trim(p_language),''),'es'),coalesce(nullif(trim(p_surface),''),'web'),char_length(v_expression),'private_ref','s1.v49.1') returning moment_id into v_moment;
  insert into gf_private.moment_originals(moment_id,person_id,expression_text,retention_policy) values(v_moment,v_person,v_expression,'private_reclassifiable.v1') on conflict(moment_id) do update set expression_text=excluded.expression_text,retention_policy=excluded.retention_policy,updated_at=now(),revision=gf_private.moment_originals.revision+1;perform gf_private.emit_person_event('MomentOriginalPreserved','moment',v_moment,v_person,v_trace,'s1.v49.1',jsonb_build_object('original_retention','private_ref','retention_policy','private_reclassifiable.v1'));
  v_interp:=gf_core.s1_interpret(v_expression);v_safety:=v_interp->>'safety_state';v_areas:=array(select jsonb_array_elements_text(v_interp->'area_keys'));v_caps:=array(select jsonb_array_elements_text(v_interp->'capacity_keys'));v_context:=jsonb_build_object('memory_used',v_memory,'active_trajectory_ids',v_active_trajectory_ids,'repertoire_help_ids',v_repertoire_help_ids,'taxonomy_version','life-taxonomy.v1','area_keys',to_jsonb(v_areas),'capacity_keys',to_jsonb(v_caps));
  insert into gf_core.moment_interpretations(moment_id,person_id,interpreter_version,confidence,uncertainty_key,requires_clarification,safety_state,features,taxonomy_version,area_keys,capacity_keys) values(v_moment,v_person,'orientation.rules.v1',(v_interp->>'confidence')::numeric,v_interp->>'uncertainty_key',coalesce((v_interp->>'requires_clarification')::boolean,false),v_safety,coalesce(v_interp->'features','{}'::jsonb),'life-taxonomy.v1',v_areas,v_caps);
  if p_review_first and v_safety<>'blocked' then
    insert into gf_core.accompaniment_episodes(person_id,moment_id,status,contract_version) values(v_person,v_moment,'proposed','s1.a63.review.v1') returning episode_id into v_episode;
    update gf_core.moments set status='interpreted' where moment_id=v_moment;
    return jsonb_build_object('scene_id',case when coalesce((v_interp->>'requires_clarification')::boolean,false) then 'moment.clarify' else 'moment.understanding' end,'episode_id',v_episode,'moment_id',v_moment,'understanding',v_interp->>'understanding','safety',jsonb_build_object('state',v_safety),'coverage',jsonb_build_object('state','pending_review'),'interpretation',v_interp-'features');
  end if;
  if coalesce((v_interp->>'requires_clarification')::boolean,false) then insert into gf_core.accompaniment_episodes(person_id,moment_id,status,contract_version) values(v_person,v_moment,'clarification_needed','s1.v49.1') returning episode_id into v_episode;update gf_core.moments set status='clarification_needed' where moment_id=v_moment;return jsonb_build_object('scene_id','moment.clarify','scene_version','s1.v49.1','presence_mode','P3','episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','clarify.more_context')),'available_actions',jsonb_build_array(jsonb_build_object('id','tell_more','intent','continue_expression')),'safety',jsonb_build_object('state',v_safety),'coverage',jsonb_build_object('state','unknown'),'understanding',v_interp->>'understanding','interpretation',jsonb_build_object('taxonomy_version','life-taxonomy.v1','area_keys',to_jsonb(v_areas),'capacity_keys',to_jsonb(v_caps),'confidence',v_interp->'confidence','uncertainty_key',v_interp->'uncertainty_key'),'privacy',jsonb_build_object('original_retention','private_ref','retention_policy','private_reclassifiable.v1','shared_learning',false));end if;
  insert into gf_core.accompaniment_episodes(person_id,moment_id,status,contract_version) values(v_person,v_moment,case when v_safety='blocked' then 'no_match' else 'proposed' end,'s1.v49.1') returning episode_id into v_episode;
  if v_safety='blocked' then insert into gf_core.no_match_events(episode_id,person_id,reason_code,coverage_state,coverage_gap) values(v_episode,v_person,'safety_scope','restricted',false);update gf_core.moments set status='decided' where moment_id=v_moment;return jsonb_build_object('scene_id','moment.safety_referral','scene_version','s1.v49.1','presence_mode','P4','episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','safety_referral','semantic_key','safety.human_help_now')),'available_actions',jsonb_build_array(jsonb_build_object('id','seek_human_help','intent','seek_human_help'),jsonb_build_object('id','close','intent','close')),'safety',jsonb_build_object('state','blocked'),'coverage',jsonb_build_object('state','restricted','reason','safety_scope'),'privacy',jsonb_build_object('original_retention','private_ref','retention_policy','private_reclassifiable.v1','shared_learning',false));end if;
  select count(distinct hp.help_id),coalesce(bool_or(ha.state='applicable'),false) into v_candidate_count,v_has_applicable from gf_core.help_applicability ha join gf_core.help_versions hv on hv.help_version_id=ha.help_version_id join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version where hp.lifecycle in('active_limited','active') and ha.state in('applicable','partial') and ha.taxonomy_version='life-taxonomy.v1' and ha.area_key=any(v_areas) and ha.capacity_key=any(v_caps);v_coverage_state:=case when v_candidate_count=0 then 'not_covered' when v_has_applicable then 'covered' else 'partial' end;
  if v_candidate_count=0 then insert into gf_core.no_match_events(episode_id,person_id,reason_code,coverage_state,coverage_gap) values(v_episode,v_person,'no_sufficient_applicability',v_coverage_state,true);update gf_core.accompaniment_episodes set status='no_match',completed_at=now() where episode_id=v_episode;update gf_core.moments set status='decided' where moment_id=v_moment;return jsonb_build_object('scene_id','moment.no_match','scene_version','s1.v49.1','presence_mode','P2','episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','no_match.honest')),'available_actions',jsonb_build_array(jsonb_build_object('id','rephrase','intent','rephrase'),jsonb_build_object('id','close','intent','close')),'safety',jsonb_build_object('state','clear'),'coverage',jsonb_build_object('state',v_coverage_state,'reason','no_sufficient_applicability'),'understanding',v_interp->>'understanding','interpretation',jsonb_build_object('taxonomy_version','life-taxonomy.v1','area_keys',to_jsonb(v_areas),'capacity_keys',to_jsonb(v_caps),'confidence',v_interp->'confidence'),'privacy',jsonb_build_object('original_retention','private_ref','retention_policy','private_reclassifiable.v1','shared_learning',false));end if;
  if v_memory then select exists(select 1 from gf_core.personal_repertoire pr join gf_core.help_possibilities hp on hp.help_id=pr.help_id join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version join gf_core.help_applicability ha on ha.help_version_id=hv.help_version_id where pr.person_id=v_person and pr.status='active' and hp.lifecycle in('active_limited','active') and ha.state in('applicable','partial') and ha.taxonomy_version='life-taxonomy.v1' and ha.area_key=any(v_areas) and ha.capacity_key=any(v_caps)) into v_repertoire_available;end if;
  insert into gf_core.decision_runs(episode_id,person_id,policy_version,interpreter_version,coverage_version,safety_state,coverage_state,eligible_count,decision_reason_key,continuity_context) values(v_episode,v_person,'decision.v49.1','orientation.rules.v1','coverage.eval.v1',v_safety,v_coverage_state,v_candidate_count,case when v_repertoire_available then 'relevant_repertoire_available' else 'area_capacity_applicability_match' end,v_context) returning decision_run_id into v_run;
  for r in with eligible as(select hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail,bool_or(ha.state='applicable') as strong_match,count(*) as match_count,max(ha.applicability_confidence) as applicability_confidence,min(ha.priority_hint) as priority_hint,case when v_memory and exists(select 1 from gf_core.personal_repertoire pr where pr.person_id=v_person and pr.help_id=hp.help_id and pr.status='active') then 0 else 1 end as repertoire_rank from gf_core.help_applicability ha join gf_core.help_versions hv on hv.help_version_id=ha.help_version_id join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version join lateral(select hloc.* from gf_core.help_localizations hloc where hloc.help_version_id=hv.help_version_id order by case when hloc.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0 when left(hloc.locale,2)=left(coalesce(nullif(trim(p_language),''),'es'),2) then 1 when hloc.locale='es-AR' then 2 else 3 end limit 1) hl on true where hp.lifecycle in('active_limited','active') and ha.state in('applicable','partial') and ha.taxonomy_version='life-taxonomy.v1' and ha.area_key=any(v_areas) and ha.capacity_key=any(v_caps) group by hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail) select * from eligible order by strong_match desc,match_count desc,applicability_confidence desc,repertoire_rank,priority_hint,canonical_code limit 2 loop v_rank:=v_rank+1;insert into gf_core.decision_candidates(decision_run_id,person_id,help_id,help_version_id,eligibility_status,reason_key,priority_hint) values(v_run,v_person,r.help_id,r.help_version_id,'eligible',case when r.repertoire_rank=0 then 'relevant_own_repertoire' else 'area_capacity_applicability' end,r.priority_hint);insert into gf_core.candidate_exposures(decision_run_id,person_id,help_id,help_version_id,display_rank) values(v_run,v_person,r.help_id,r.help_version_id,v_rank);if v_rank=1 then v_primary:=jsonb_build_object('help_id',r.help_id,'help_version_id',r.help_version_id,'help_type',r.help_type,'title',r.title,'summary',r.summary,'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail,'from_own_repertoire',r.repertoire_rank=0,'applicability_confidence',r.applicability_confidence);else v_alt:=jsonb_build_object('help_id',r.help_id,'help_version_id',r.help_version_id,'help_type',r.help_type,'title',r.title,'summary',r.summary,'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail,'from_own_repertoire',r.repertoire_rank=0,'applicability_confidence',r.applicability_confidence);end if;end loop;
  update gf_core.moments set status='decided' where moment_id=v_moment;return jsonb_build_object('scene_id','moment.help','scene_version','s1.v49.1','presence_mode','P2','episode_id',v_episode,'moment_id',v_moment,'decision_run_id',v_run,'trace_id',v_trace,'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','help.offer_humble'),jsonb_build_object('type','help_preview','primary',v_primary,'alternative',v_alt),jsonb_build_object('type','continuity_hint','semantic_key',case when coalesce((v_primary->>'from_own_repertoire')::boolean,false) then 'continuity.own_repertoire' else 'continuity.none' end)),'available_actions',jsonb_build_array(jsonb_build_object('id','try_primary','intent','select_help','payload',jsonb_build_object('help_id',v_primary->>'help_id')),jsonb_build_object('id','not_this','intent','reject_help')),'safety',jsonb_build_object('state','clear'),'coverage',jsonb_build_object('state',v_coverage_state),'understanding',v_interp->>'understanding','interpretation',jsonb_build_object('taxonomy_version','life-taxonomy.v1','area_keys',to_jsonb(v_areas),'capacity_keys',to_jsonb(v_caps),'confidence',v_interp->'confidence','uncertainty_key',v_interp->'uncertainty_key'),'continuity',jsonb_build_object('memory_used',v_memory,'own_repertoire_reused',coalesce((v_primary->>'from_own_repertoire')::boolean,false),'active_trajectory_count',jsonb_array_length(v_active_trajectory_ids)),'delivery',jsonb_build_object('pattern','prepare_possibility_integrate','optional',true,'prepare_semantic_key','help.offer_humble','integrate_semantic_key','outcome.thank_and_release'),'privacy',jsonb_build_object('original_retention','private_ref','retention_policy','private_reclassifiable.v1','shared_learning',false));
end $function$;

-- One transaction: an invalid or stale agreement cannot leave a changed Faro behind.
create or replace function public.lumen_faro_review_confirm(p_trajectory_id uuid,p_faro_text text,p_items jsonb,p_area_keys text[],p_expected_version integer,p_expected_revision integer,p_origin_moment_id uuid,p_status text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();v_id uuid:=p_trajectory_id;v_faro gf_core.trajectories;v_agreement jsonb;v_created jsonb;
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then raise exception 'memory consent required' using errcode='42501';end if;
 if gf_core.s1_interpret(p_faro_text)->>'safety_state'='blocked' then raise exception 'human help required' using errcode='42501';end if;
 if v_id is null then
  if p_expected_version<>0 or p_expected_revision is not null then raise exception 'invalid new agreement' using errcode='22023';end if;
  v_created:=public.lumen_s2_create_trajectory(p_faro_text,gen_random_uuid());v_id:=(v_created->>'trajectory_id')::uuid;
  if p_origin_moment_id is not null then
   if not exists(select 1 from gf_core.moments where moment_id=p_origin_moment_id and person_id=v_person) then raise exception 'moment unavailable' using errcode='42501';end if;
   -- An original reference is not a legacy capacity-to-Potential conversion.
   update gf_core.trajectories set origin_moment_id=p_origin_moment_id where trajectory_id=v_id;
  end if;
 else
  select * into v_faro from gf_core.trajectories where trajectory_id=v_id and person_id=v_person for update;
  if not found then raise exception 'Faro unavailable' using errcode='P0002';end if;
  if p_expected_revision is distinct from v_faro.revision or p_expected_version is distinct from coalesce((select max(version) from gf_private.faro_agreement_versions where trajectory_id=v_id),0) then raise exception 'Faro changed; reread before confirming' using errcode='40001';end if;
 end if;
 perform public.lumen_s2_update_trajectory(v_id,p_faro_text,p_status,gen_random_uuid());
 v_agreement:=public.lumen_faro_agreement_validate(v_id,p_faro_text,p_items,p_area_keys,p_expected_version);
 return jsonb_build_object('trajectory_id',v_id,'agreement',v_agreement);
end $$;

create or replace function public.lumen_s1_review_moment(p_episode_id uuid,p_understanding text,p_area_keys text[],p_available_minutes integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();v_moment uuid;v_interp gf_core.moment_interpretations;v_count integer;v_strong boolean;v_coverage text;v_run uuid;v_areas text[];v_reading jsonb;
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 select moment_id into v_moment from gf_core.accompaniment_episodes where episode_id=p_episode_id and person_id=v_person for update;
 if v_moment is null then raise exception 'moment unavailable' using errcode='42501';end if;
 select * into v_interp from gf_core.moment_interpretations where moment_id=v_moment and person_id=v_person order by created_at desc limit 1;
 if v_interp.safety_state='blocked' or (gf_core.s1_interpret(p_understanding)->>'safety_state')='blocked' then raise exception 'human help required' using errcode='42501';end if;
 if char_length(trim(coalesce(p_understanding,''))) not between 1 and 1000 then raise exception 'invalid understanding' using errcode='22023';end if;
 if exists(select 1 from unnest(coalesce(p_area_keys,'{}'::text[])) k where not exists(select 1 from gf_core.area_terms a where a.taxonomy_version='life-taxonomy.v1' and a.area_key=k and a.status='active')) then raise exception 'invalid area' using errcode='22023';end if;
 select coalesce(array_agg(distinct x order by x),'{}') into v_areas from unnest(coalesce(p_area_keys,'{}'::text[])) x;
 v_reading:=gf_core.s1_interpret(p_understanding);
 if p_understanding is distinct from (select gf_core.s1_interpret(expression_text)->>'understanding' from gf_private.moment_originals where moment_id=v_moment and person_id=v_person) then v_interp.capacity_keys:=array(select jsonb_array_elements_text(v_reading->'capacity_keys'));end if;
 perform public.lumen_s1_correct_moment_context(p_episode_id,p_available_minutes);
 update gf_core.moment_interpretations set area_keys=v_areas,capacity_keys=v_interp.capacity_keys,requires_clarification=false,features=features||jsonb_build_object('reviewed_understanding',trim(p_understanding),'reviewed_by','person','reviewed_at',now()) where interpretation_id=v_interp.interpretation_id;
 select count(distinct hp.help_id),coalesce(bool_or(ha.state='applicable'),false) into v_count,v_strong from gf_core.help_applicability ha join gf_core.help_versions hv on hv.help_version_id=ha.help_version_id join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version where hp.lifecycle in('active_limited','active') and ha.state in('applicable','partial') and ha.taxonomy_version='life-taxonomy.v1' and ha.area_key=any(v_areas) and ha.capacity_key=any(v_interp.capacity_keys);
 v_coverage:=case when v_count=0 then 'not_covered' when v_strong then 'covered' else 'partial' end;
 insert into gf_core.decision_runs(episode_id,person_id,policy_version,interpreter_version,coverage_version,safety_state,coverage_state,eligible_count,decision_reason_key,continuity_context)
 values(p_episode_id,v_person,'decision.a63.review.v1','orientation.rules.v2','coverage.eval.v1',v_interp.safety_state,v_coverage,v_count,'person_reviewed_context',jsonb_build_object('area_keys',v_areas,'capacity_keys',v_interp.capacity_keys,'reviewed_by','person')) returning decision_run_id into v_run;
 update gf_core.accompaniment_episodes set status=case when v_count=0 then 'no_match' else 'proposed' end where episode_id=p_episode_id;
 perform gf_private.emit_person_event('MomentContextCorrected','moment',v_moment,v_person,gen_random_uuid(),'s1.a63.review.v1',jsonb_build_object('area_keys',v_areas,'available_minutes',p_available_minutes,'reviewed_by','person'));
 return jsonb_build_object('state','reviewed','coverage',v_coverage,'decision_run_id',v_run);
end $$;

-- Open contextual hypotheses. These expressions do not create canonical concepts or Source links.
drop function public.lumen_faro_potential_proposal(text);
create function public.lumen_faro_potential_proposal(p_expression text,p_faro_text text default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_text text:=trim(coalesce(nullif(trim(p_faro_text),''),p_expression,''));v_scan text;v_items jsonb:='[]';r record;
begin
 if gf_core.current_person_id() is null then raise exception 'authentication required' using errcode='28000';end if;
 if char_length(coalesce(p_expression,''))>4000 or char_length(v_text) not between 1 and 4000 then raise exception 'invalid expression' using errcode='22023';end if;
 if gf_core.s1_interpret(coalesce(p_expression,'')||' '||v_text)->>'safety_state'='blocked' then return jsonb_build_object('state','safety_referral','items','[]'::jsonb,'message','Este momento necesita acompañamiento humano. No voy a proponerte un cultivo para ese riesgo.');end if;
 v_scan:=lower(v_text);
 v_scan:=regexp_replace(v_scan,'no (quiero|necesito|busco|deseo) [^.;!?]+',' ','g');
 for r in select * from (values
  ('(parar|descans|bajar (el|un) ritmo|bajar un cambio|agotad|cansad|sobrecarg|sin culpa)','Reconocer mis límites y cuidarme','Reconocer señales de cansancio y elegir pausas posibles, sin convertir el descanso en otra exigencia.'),
  ('(presente con|escuchar a|escucharlos|escuchar mejor|mis hijos|mi hij[oa]|crianza)','Estar presente y escuchar','Dar atención a las personas que importan y reconocer sus necesidades sin dejar de cuidar las propias.'),
  ('(poner (un |mis )?l[ií]mites|decir que no|me invade|no respeta)','Expresar mis límites','Reconocer lo que puedo sostener y comunicar un límite con cuidado y firmeza.'),
  ('(estudiar|aprender|comprender|entender mejor)','Aprender con curiosidad','Hacer preguntas, explorar y practicar de una forma que pueda sostener en mis condiciones reales.'),
  ('(crear|creativ|pintar|escribir|componer|imaginar)','Dar lugar a mi creatividad','Explorar y expresar ideas propias, permitiendo pruebas y cambios sin exigir un resultado perfecto.'),
  ('(decidir|decisi[oó]n|discern|elegir|claridad|ordenar mis ideas)','Discernir lo que importa','Distinguir hechos, deseos y alternativas para elegir un paso propio y posible.'),
  ('(reconciliar|pedir perd[oó]n|cuidar (el|un|mi) v[ií]nculo|relacionarme|convivir|amar)','Cuidar mis vínculos','Escuchar, expresar lo que necesito y buscar formas de trato respetuosas y recíprocas.'),
  ('(sentido|prop[oó]sito|valores|trascend|qu[eé] importa)','Reconocer mi dirección','Explorar qué tiene valor para mí y ponerlo en juego en gestos de la vida cotidiana.'),
  ('(constancia|sostener|retomar|persever|h[aá]bito)','Sostener pasos posibles','Repetir y ajustar un gesto elegido, pudiendo cambiar de dirección cuando deja de ayudar.')
 ) x(pattern,label,definition) where v_scan ~ x.pattern limit 3 loop
  v_items:=v_items||jsonb_build_array(jsonb_build_object('identity_id',gen_random_uuid(),'concept_id',null,'label',r.label,'definition',r.definition,'contextual_meaning',r.definition,'origin','lumi','status','accepted','reason','Lo propongo como posibilidad para revisar por estas palabras tuyas: «'||substring(v_text from '(?i)'||r.pattern)||'». No afirma algo sobre vos ni equivale a un concepto de Fuente.'));
 end loop;
 -- Explicit original terms remain candidates, with boundaries and no wildcard matching.
 if jsonb_array_length(v_items)=0 then
  select coalesce(jsonb_agg(jsonb_build_object('identity_id',gen_random_uuid(),'concept_id',c.concept_id,'label',c.label_es,'definition',c.definition_es,'contextual_meaning','Explorar si «'||c.label_es||'» puede contribuir a: '||left(v_text,700),'origin','lumi','status','accepted','source_status',c.editorial_status,'reason','Nombraste este término; su pertinencia para tu Faro sigue siendo una hipótesis.')),'[]'::jsonb) into v_items from (select c.* from gf_core.potential_concepts c where c.editorial_status in('candidate','reviewed') and strpos(' '||regexp_replace(v_scan,'[[:punct:]]',' ','g')||' ',' '||lower(c.label_es)||' ')>0 order by c.label_es limit 3) c;
 end if;
 return jsonb_build_object('state',case when jsonb_array_length(v_items)>0 then 'proposed' else 'needs_person_expression' end,'items',v_items,'message',case when jsonb_array_length(v_items)>0 then 'Elegí lo que te representa. Lo que no aceptes queda fuera del acuerdo.' else 'Todavía no tengo una lectura concreta. Podés nombrar lo que querés nutrir o seguir sin potenciales.' end);
end $$;
revoke all on function public.lumen_s1_accompany_moment(text,text,text,text,uuid,boolean) from public,anon;
revoke all on function public.lumen_s1_review_moment(uuid,text,text[],integer) from public,anon;
revoke all on function public.lumen_faro_review_confirm(uuid,text,jsonb,text[],integer,integer,uuid,text) from public,anon;
revoke all on function public.lumen_faro_potential_proposal(text,text) from public,anon;
grant execute on function public.lumen_s1_accompany_moment(text,text,text,text,uuid,boolean) to authenticated;
grant execute on function public.lumen_s1_review_moment(uuid,text,text[],integer) to authenticated;
grant execute on function public.lumen_faro_review_confirm(uuid,text,jsonb,text[],integer,integer,uuid,text) to authenticated;
grant execute on function public.lumen_faro_potential_proposal(text,text) to authenticated;
