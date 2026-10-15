-- A63 / V63 B1 B3: conservative reading and flexible composition. No editorial admission.
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
    return jsonb_build_object('taxonomy_version','life-taxonomy.v1','area_keys','[]'::jsonb,'capacity_keys','[]'::jsonb,'confidence',0.10,'uncertainty_key','too_little_context','requires_clarification',true,'safety_state','clear','features',jsonb_build_object('ruleset','orientation.rules.v3','rule_keys','[]'::jsonb));
  end if;
  if v ~ '(suicid|matarme|quiero morir|no quiero seguir viviendo|hacerme daño|hacerme dano|self[- ]?harm|kill myself|overdose|sobredosis|violencia grave|abuso grave)' then
    return jsonb_build_object('taxonomy_version','life-taxonomy.v1','area_keys','[]'::jsonb,'capacity_keys','[]'::jsonb,'confidence',0.95,'requires_clarification',false,'safety_state','blocked','features',jsonb_build_object('ruleset','orientation.rules.v3','risk_pattern_detected',true));
  end if;
  -- Suppress explicit denials of states, without suppressing needs such as "no puedo dormir".
  v:=regexp_replace(v,'(mi |el )?(trabajo|laburo) (va bien|está bien|esta bien|me gusta)',' ','g');
  v:=regexp_replace(v,'no (estoy|estamos|soy|somos|tengo|siento) (ansios[oa]s?|agotad[oa]s?|cansad[oa]s?|angustia|ansiedad|culpa|miedo|bronca|enojad[oa]s?)',' ','g');
  if v ~ '(duelo|falleci|murió|murio|muerte de|perdí a|perdi a|luto|ruptura|vacío enorme|vacio enorme)' then v_areas:=v_areas||array['relationships'];v_caps:=v_caps||array['integration'];v_conf:=greatest(v_conf,0.88);v_rules:=v_rules||'grief'::text;end if;
  if v ~ '(no puedo dormir|insomnio|dormir mal|me despierto|conciliar el sueño|conciliar el sueno|sueño cortado|sueno cortado|me cuesta dormirme)' then v_areas:=v_areas||array['wellbeing'];v_caps:=v_caps||array['regulation'];v_conf:=greatest(v_conf,0.86);v_rules:=v_rules||'sleep'::text;end if;
  if v ~ '(plata|dinero|deuda|finanzas|gastos|fin de mes|vencim|económic|economic|saldo)' then v_areas:=v_areas||array['economy'];v_caps:=v_caps||array['discernment'];v_conf:=greatest(v_conf,0.85);v_rules:=v_rules||'economy'::text;end if;
  if v ~ '(mudanza|me mud[eé]|nuevo trabajo|cambio de vida|transición|transicion|me jubil|me recibí|me recibi|me qued[eé] sin trabajo|perdí el trabajo|perdi el trabajo)' then v_areas:=v_areas||array['general_life'];v_caps:=v_caps||array['adaptation'];v_conf:=greatest(v_conf,0.84);v_rules:=v_rules||'transition'::text;end if;
  if v ~ '(cuido a|persona que cuido|cuidador|cuidadora|cuidando a|familiar enfermo|haciendo cargo de)' then v_areas:=v_areas||array['family_care'];v_caps:=v_caps||array['self_compassion'];v_conf:=greatest(v_conf,0.83);v_rules:=v_rules||'caregiving'::text;end if;
  if v ~ '(poner un límite|poner un limite|decir que no|me invade|se aprovecha|no respeta|necesito un límite|necesito un limite)' then v_areas:=v_areas||array['relationships'];v_caps:=v_caps||array['agency'];v_conf:=greatest(v_conf,0.84);v_rules:=v_rules||'boundaries'::text;end if;
  if v ~ '(ansiedad|ansioso|ansiosa|angustia|preocupad|nervios|miedo constante|mente no para|no dejo de imaginar|pecho apretado|cabeza acelerada|darle vueltas)' then v_areas:=v_areas||array['wellbeing'];v_caps:=v_caps||array['regulation'];v_conf:=greatest(v_conf,0.84);v_rules:=v_rules||'anxiety'::text;end if;
  if v ~ '(enojad|enfadad|furios|\mira\M|bronca|rabia|explotar|responder en caliente)' then v_areas:=v_areas||array['wellbeing'];v_caps:=v_caps||array['regulation'];v_conf:=greatest(v_conf,0.84);v_rules:=v_rules||'emotion_regulation'::text;end if;
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
  if v ~ '(\msolo\M|\msola\M|acompañ|acompan|hablar con alguien|necesito apoyo|conectar con alguien)' then v_areas:=v_areas||array['relationships'];v_caps:=v_caps||array['connection'];v_conf:=greatest(v_conf,0.76);v_rules:=v_rules||'connection'::text;end if;
  if v ~ '(agradec|valorar|apreciar|algo bueno|reconocer lo bueno|gesto.*me hizo muy bien)' then v_areas:=v_areas||array['general_life'];v_caps:=v_caps||array['appreciation'];v_conf:=greatest(v_conf,0.78);v_rules:=v_rules||'appreciation'::text;end if;
  if v ~ '(mis hijos|mi hij[oa]|familia|maternidad|paternidad|crianza|criar)' then v_areas:=v_areas||array['family_care'];end if;
  if v ~ '(estudiar|estudio|aprender|aprendizaje|crear|creativ|pintar|escribir|oficio)' then v_areas:=v_areas||array['learning_growth'];end if;
  if v ~ '(estudiar|estudio|aprender|aprendizaje|comprender)' then v_rules:=v_rules||'learning'::text;end if;
  if v ~ '(crear|creativ|pintar|escribir|componer|imaginar)' then v_rules:=v_rules||'creativity'::text;end if;
  if v ~ '(amar|amor|mi pareja|mis v[ií]nculos|convivir|escuchar a)' then v_areas:=v_areas||array['relationships'];v_rules:=v_rules||'nurture_relationships'::text;end if;
  if v ~ '(celebrar|alegría|alegria|disfrutar)' then v_areas:=v_areas||array['general_life'];v_rules:=v_rules||'celebration'::text;end if;
  if cardinality(v_rules)=0 then v_clarify:=true;end if;
  select coalesce(array_agg(distinct x),'{}') into v_areas from unnest(v_areas) x;
  select coalesce(array_agg(distinct x),'{}') into v_caps from unnest(v_caps) x;
  v_rule:=coalesce(v_rules[1],'open_expression');
return jsonb_build_object('understanding',case when p_expression ~* '\mno (quiero|quisiera|busco|deseo)' then 'Traés esta búsqueda: «'||trim(p_expression)||'». Podés corregir esta lectura.' when v ~ '(quiero|quisiera|me gustaría|me gustaria)' then 'Tal vez lo que querés cuidar ahora es: «'||trim(substring(p_expression from '(?i)(?:quiero|quisiera|me gustaría|me gustaria)\s+(.+)'))||'». Podés corregir esta lectura.' else case v_rule when 'learning' then 'Tal vez querés dar lugar a aprender y comprender.' when 'creativity' then 'Tal vez querés dar lugar a tu creación.' when 'nurture_relationships' then 'Tal vez querés cuidar una forma de amar, escuchar o convivir.' when 'celebration' then 'Tal vez querés darle lugar a algo que celebrás.' when 'grief' then 'Tal vez buscás acompañamiento para atravesar una pérdida.' when 'sleep' then 'Tal vez querés encontrar un poco de descanso.' when 'economy' then 'Tal vez necesitás ordenar una preocupación económica.' when 'transition' then 'Tal vez estás buscando cómo atravesar un cambio.' when 'caregiving' then 'Tal vez necesitás cuidarte mientras cuidás a alguien.' when 'boundaries' then 'Tal vez querés encontrar una forma de poner un límite.' when 'anxiety' then 'Tal vez querés bajar un poco el ruido de las preocupaciones.' when 'emotion_regulation' then 'Tal vez necesitás espacio antes de responder desde el enojo.' when 'relationship_repair' then 'Tal vez querés cuidar o reparar un vínculo.' when 'self_compassion' then 'Tal vez necesitás tratarte con un poco más de amabilidad.' when 'confidence' then 'Tal vez querés recuperar confianza para dar un paso.' when 'habit' then 'Tal vez querés volver a algo que te hace bien.' when 'energy' then 'Tal vez querés recuperar algo de energía.' when 'focus' then 'Tal vez buscás un poco de espacio para concentrarte.' when 'meaning' then 'Tal vez querés acercarte a lo que tiene sentido para vos.' when 'work_stress' then 'Tal vez necesitás una pausa ante lo que te exige el trabajo.' when 'clarity' then 'Tal vez buscás claridad para decidir tu próximo paso.' when 'move_forward' then 'Tal vez querés encontrar un primer paso posible.' when 'overload' then 'Tal vez necesitás bajar un cambio y recuperar espacio.' when 'connection' then 'Tal vez buscás compañía o una forma de conectar.' when 'appreciation' then 'Tal vez querés darle lugar a algo bueno que viviste.' else 'Todavía necesito un poco más de contexto para comprender qué importa ahora.' end end,'taxonomy_version','life-taxonomy.v1','area_keys',to_jsonb(v_areas),'capacity_keys',to_jsonb(v_caps),'confidence',v_conf,'uncertainty_key',case when v_clarify then 'insufficient_orientation' else null end,'requires_clarification',v_clarify,'safety_state',v_safety,'features',jsonb_build_object('ruleset','orientation.rules.v3','rule_key',v_rule,'rule_keys',to_jsonb(v_rules)));
end $function$

;
CREATE OR REPLACE FUNCTION public.lumen_s1_moment_constellation(p_episode_id uuid, p_locale text DEFAULT 'es-AR'::text, p_limit integer DEFAULT 12, p_trace_id uuid DEFAULT NULL::uuid, p_capacity_keys text[] DEFAULT NULL::text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_person uuid:=gf_core.current_person_id(); v_trace uuid:=coalesce(p_trace_id,gen_random_uuid()); v_run uuid; v_moment uuid; v_areas text[]; v_interp_caps text[]; v_caps text[]; v_primary uuid; v_rank integer; v_result jsonb:='[]'::jsonb; v_limit integer:=greatest(1,coalesce(p_limit,3)); v_memory boolean:=false; v_invalid integer; v_kind text:='NEW_HELP'; v_withdraw boolean:=false; v_event uuid; v_control uuid; r record;
begin
  if v_person is null then raise exception 'authentication required' using errcode='28000'; end if;
  select coalesce(memory_allowed,false) into v_memory from gf_core.privacy_preferences where person_id=v_person;
  select dr.decision_run_id,ae.moment_id,mi.area_keys,mi.capacity_keys into v_run,v_moment,v_areas,v_interp_caps
  from gf_core.accompaniment_episodes ae
  join gf_core.decision_runs dr on dr.episode_id=ae.episode_id and dr.person_id=v_person
  join gf_core.moment_interpretations mi on mi.moment_id=ae.moment_id and mi.person_id=v_person
  where ae.episode_id=p_episode_id and ae.person_id=v_person and dr.safety_state<>'blocked' and dr.coverage_state in('covered','partial')
  order by dr.created_at desc,mi.created_at desc limit 1;
  if v_run is null then return jsonb_build_object('episode_id',p_episode_id,'items','[]'::jsonb,'capacity_keys','[]'::jsonb,'area_keys','[]'::jsonb,'trace_id',v_trace); end if;
  v_caps:=case when p_capacity_keys is null or cardinality(p_capacity_keys)=0 then v_interp_caps else p_capacity_keys end;
  select count(*) into v_invalid from unnest(v_caps) cap where not exists(select 1 from gf_core.capacity_terms ct where ct.taxonomy_version='life-taxonomy.v1' and ct.capacity_key=cap and ct.status='active');
  if v_invalid>0 then raise exception 'invalid capacity' using errcode='22023'; end if;
  select array_agg(distinct x order by x) into v_caps from unnest(v_caps) x;
  v_caps:=coalesce(v_caps,v_interp_caps,'{}'::text[]);
  select help_id into v_primary from gf_core.candidate_exposures where decision_run_id=v_run and person_id=v_person order by display_rank limit 1;
  select coalesce(max(display_rank),0) into v_rank from gf_core.candidate_exposures where decision_run_id=v_run;
  for r in
    with eligible as (
      select hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hp.lifecycle,hp.risk_class,hp.evidence_class,
             hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail,hv.accessibility,
             pr.display_name provider_name,pr.provider_kind,pr.provenance provider_provenance,pr.rights provider_rights,
             min(ha.priority_hint) priority_hint,max(ha.applicability_confidence) applicability_confidence,
             array_agg(distinct ha.capacity_key order by ha.capacity_key) matched_capacity_keys,
             array_agg(distinct ha.area_key order by ha.area_key) matched_area_keys,
             array_agg(distinct role) filter(where role is not null) cultivation_roles,
             count(distinct ha.capacity_key) capacity_match_count,
             count(distinct role) filter(where role is not null) role_diversity,
             (v_memory and exists(select 1 from gf_core.personal_repertoire own where own.person_id=v_person and own.help_id=hp.help_id and own.status='active' and own.user_confirmed)) from_own_repertoire,
             (v_memory and exists(select 1 from gf_private.sanctuary_entries se where se.person_id=v_person and se.source_help_id=hp.help_id)) from_sanctuary
      from gf_core.help_applicability ha
      join gf_core.help_versions hv on hv.help_version_id=ha.help_version_id
      join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version
      join gf_core.providers pr on pr.provider_id=hp.provider_id
      join lateral(select hloc.* from gf_core.help_localizations hloc where hloc.help_version_id=hv.help_version_id order by case when hloc.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0 when left(hloc.locale,2)=left(coalesce(nullif(trim(p_locale),''),'es-AR'),2) then 1 when hloc.locale='es-AR' then 2 else 3 end limit 1) hl on true
      left join lateral unnest(ha.cultivation_roles) role on true
      where hp.lifecycle in('active_limited','active') and ha.state in('applicable','partial') and ha.taxonomy_version='life-taxonomy.v1'
        and ha.area_key=any(v_areas) and ha.capacity_key=any(v_caps)
        and (coalesce((select (mi.features->>'available_minutes')::integer from gf_core.moment_interpretations mi where mi.moment_id=v_moment and mi.person_id=v_person order by mi.created_at desc limit 1),0)=0 or hv.duration_minutes<= (select (mi.features->>'available_minutes')::integer from gf_core.moment_interpretations mi where mi.moment_id=v_moment and mi.person_id=v_person order by mi.created_at desc limit 1))
        and (not v_memory or coalesce((select o.signal_kind from gf_core.outcomes_feedback o join gf_core.help_selections sel on sel.selection_id=o.selection_id where o.person_id=v_person and sel.help_id=hp.help_id order by o.created_at desc limit 1),'') not in ('STOPPED_HELPING','NOT_HELPED_NOW'))
      group by hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hp.lifecycle,hp.risk_class,hp.evidence_class,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail,hv.accessibility,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
    )
    select * from eligible order by from_own_repertoire desc,from_sanctuary desc,(help_id=v_primary) desc,capacity_match_count desc,role_diversity desc,applicability_confidence desc,priority_hint,canonical_code limit v_limit
  loop
    if not exists(select 1 from gf_core.decision_candidates where decision_run_id=v_run and help_id=r.help_id) then
      insert into gf_core.decision_candidates(decision_run_id,person_id,help_id,help_version_id,eligibility_status,reason_key,priority_hint)
      values(v_run,v_person,r.help_id,r.help_version_id,'eligible',case when r.from_own_repertoire then 'moment_constellation_own_repertoire' else 'moment_constellation' end,r.priority_hint);
    end if;
    if not exists(select 1 from gf_core.candidate_exposures where decision_run_id=v_run and person_id=v_person and help_id=r.help_id) then
      v_rank:=v_rank+1; insert into gf_core.candidate_exposures(decision_run_id,person_id,help_id,help_version_id,display_rank) values(v_run,v_person,r.help_id,r.help_version_id,v_rank);
    end if;
    if jsonb_array_length(v_result)=0 then
      if r.from_own_repertoire then v_kind:='REUSE_REPERTOIRE';v_withdraw:=true;
      elsif v_memory and exists(select 1 from gf_core.outcomes_feedback o join gf_core.help_selections sel on sel.selection_id=o.selection_id where o.person_id=v_person and sel.help_id=r.help_id and o.effect='helped') then v_kind:='REPEAT';end if;
    end if;
    v_result:=v_result || jsonb_build_array(jsonb_build_object(
      'help_id',r.help_id,'help_version_id',r.help_version_id,'canonical_code',r.canonical_code,'help_type',r.help_type,'lifecycle',r.lifecycle,'risk_class',r.risk_class,'evidence_class',r.evidence_class,
      'title',r.title,'summary',r.summary,'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail,'accessibility',r.accessibility,
      'provider',jsonb_build_object('name',r.provider_name,'kind',r.provider_kind,'provenance',r.provider_provenance,'rights',r.provider_rights),
      'areas',to_jsonb(r.matched_area_keys),'capacities',to_jsonb(r.matched_capacity_keys),'cultivation_roles',to_jsonb(coalesce(r.cultivation_roles,'{}'::text[])),'cultivation_vocab_version','cultivation.v1','taxonomy_version','life-taxonomy.v1',
      'primary_now',jsonb_array_length(v_result)=0,'context_origin',case when r.from_own_repertoire then 'propio' when r.from_sanctuary then 'santuario' when r.help_type in ('professional_support','institutional_service','conversation') then 'tejido' else 'fuente' end,
      'decision_kind',v_kind,'context_reason',case when r.from_own_repertoire then 'Lo reconociste como propio y se relaciona con lo que expresaste hoy.' when v_kind='REPEAT' then 'Esto te ayudó antes y se relaciona con este Momento.' when r.from_sanctuary then 'Elegiste conservarlo y puede volver a servirte ahora.' when r.help_type in ('professional_support','institutional_service','conversation') then 'Una forma de acompañamiento humano relacionada con este Momento.' else 'Una posibilidad relacionada con lo que expresaste hoy.' end,'from_own_repertoire',r.from_own_repertoire,'applicability_confidence',r.applicability_confidence));
    if v_withdraw then exit;end if;
  end loop;
  if jsonb_array_length(v_result)=0 then v_kind:='NO_MATCH';end if;
  select hp.help_id into v_control from gf_core.help_applicability ha join gf_core.help_versions hv on hv.help_version_id=ha.help_version_id join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version where hp.lifecycle in('active_limited','active') and ha.state in('applicable','partial') and ha.area_key=any(v_areas) and ha.capacity_key=any(v_caps) group by hp.help_id,hp.canonical_code order by count(distinct ha.capacity_key) desc,max(ha.applicability_confidence) desc,min(ha.priority_hint),hp.canonical_code limit 1;
  update gf_core.decision_runs set decision_kind=v_kind,decision_reason_key=case when v_withdraw then 'own_resource_sufficient' else decision_reason_key end,
    continuity_context=continuity_context || jsonb_build_object('memory_used',v_memory,'elegida_por',case when v_withdraw then 'repertorio' else 'motor' end,'lumi_withdrawn',v_withdraw,
    'experiment',jsonb_build_object('version','continuity.shadow.v1','arm','live','control_help_id',v_control,'live_help_id',v_result->0->>'help_id','outcome_pending',true),
    'facets_frozen',jsonb_build_object('area_keys',v_areas,'capacity_keys',v_caps)) where decision_run_id=v_run and person_id=v_person;
  perform gf_private.emit_person_event('AccompanimentAdapted','episode',p_episode_id,v_person,v_trace,'s1.a63.v62',jsonb_build_object('decision_run_id',v_run,'decision_kind',v_kind,'help_id',v_result->0->>'help_id','lumi_withdrawn',v_withdraw,'memory_used',v_memory));
  select event_id into v_event from gf_ledger.domain_events where person_pseudonym=v_person and trace_id=v_trace and event_type='AccompanimentAdapted' order by occurred_at desc limit 1;
  perform gf_private.emit_person_event('MomentConstellationExposed','episode',p_episode_id,v_person,v_trace,'s1.a63.v60',jsonb_build_object('decision_run_id',v_run,'item_count',jsonb_array_length(v_result),'capacity_keys',to_jsonb(v_caps),'area_keys',to_jsonb(v_areas),'user_adjusted_capacities',p_capacity_keys is not null));
  return jsonb_build_object('episode_id',p_episode_id,'moment_id',v_moment,'decision_run_id',v_run,'decision_kind',v_kind,'lumi_withdrawn',v_withdraw,'evidence_event_id',v_event,'continuity_message',case when v_withdraw then 'Esto ya es tuyo. Empecemos por lo que reconociste: hoy puedo ocupar menos lugar.' when v_kind='REPEAT' then 'Esto te ayudó antes. Podés volver a probarlo o elegir otra forma.' else null end,'state',case when jsonb_array_length(v_result)>0 then 'success' else 'no_match' end,'items',v_result,'capacity_keys',to_jsonb(v_caps),'area_keys',to_jsonb(v_areas),'trace_id',v_trace);
end $function$

;
CREATE OR REPLACE FUNCTION public.lumen_faro_constellation(p_trajectory_id uuid, p_expected_version integer, p_available_minutes integer DEFAULT 0, p_locale text DEFAULT 'es-AR'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_person uuid:=gf_core.current_person_id();v_agreement jsonb;v_id uuid;v_items jsonb;v_trace uuid:=gen_random_uuid();
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 v_agreement:=public.lumen_faro_agreement_snapshot(p_trajectory_id);
 if v_agreement->>'state'<>'validated' or (v_agreement->>'version')::integer is distinct from p_expected_version then return jsonb_build_object('state','agreement_required','items','[]'::jsonb);end if;
 if p_available_minutes<0 or p_available_minutes>1440 then raise exception 'invalid available time' using errcode='22023';end if;
 select agreement_id into v_id from gf_private.faro_agreement_versions where trajectory_id=p_trajectory_id and person_id=v_person and version=p_expected_version;
 select coalesce(jsonb_agg(x.item order by x.is_own desc,x.is_saved desc,x.title),'[]'::jsonb) into v_items from (
  select distinct h->>'help_id' help_id,h->>'title' title,
   exists(select 1 from gf_core.personal_repertoire r where r.person_id=v_person and r.help_id=(h->>'help_id')::uuid and r.status='active' and r.user_confirmed) is_own,
   exists(select 1 from gf_private.sanctuary_entries s where s.person_id=v_person and s.source_help_id=(h->>'help_id')::uuid) is_saved,
   h||jsonb_build_object('context_origin',case when exists(select 1 from gf_core.personal_repertoire r where r.person_id=v_person and r.help_id=(h->>'help_id')::uuid and r.status='active' and r.user_confirmed) then 'propio' when exists(select 1 from gf_private.sanctuary_entries s where s.person_id=v_person and s.source_help_id=(h->>'help_id')::uuid) then 'santuario' when h->>'help_type' in('conversation','professional_support','institutional_service') then 'tejido' else 'fuente' end,'context_reason','Relación editorial admitida con lo que acordaste nutrir para este Faro.') item
  from jsonb_array_elements(public.lumen_source_discover(null,null,null,p_locale,100)) h
  where exists(select 1 from gf_private.faro_agreement_items i join gf_core.potential_concepts c on c.editorial_status='reviewed' and (c.concept_id=i.concept_id or (i.concept_id is null and nullif(trim(c.scope_note),'') is not null and exists(select 1 from jsonb_array_elements_text(case when jsonb_typeof(c.provenance->'operational_expressions')='array' then c.provenance->'operational_expressions' else '[]'::jsonb end) e(label) where lower(trim(e.label))=lower(trim(i.label))))) join gf_core.help_potential_links l on l.concept_id=c.concept_id and l.editorial_status='reviewed' join gf_core.help_versions hv on hv.help_version_id=l.help_version_id join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version where i.agreement_id=v_id and i.status<>'withdrawn' and hp.help_id=(h->>'help_id')::uuid)
   and (p_available_minutes=0 or (h->>'duration_minutes')::integer<=p_available_minutes)
   and not exists(select 1 from gf_core.outcomes_feedback o join gf_core.help_selections s on s.selection_id=o.selection_id where o.person_id=v_person and s.help_id=(h->>'help_id')::uuid and o.signal_kind in('STOPPED_HELPING','NOT_HELPED_NOW') and o.created_at=(select max(o2.created_at) from gf_core.outcomes_feedback o2 join gf_core.help_selections s2 on s2.selection_id=o2.selection_id where o2.person_id=v_person and s2.help_id=s.help_id))
  order by is_own desc,is_saved desc,title
 ) x;
 perform gf_private.emit_person_event('FaroConstellationRequested','trajectory',p_trajectory_id,v_person,v_trace,'faro.agreement.v1',jsonb_build_object('agreement_version',p_expected_version,'item_count',jsonb_array_length(v_items)));
 return jsonb_build_object('state',case when jsonb_array_length(v_items)>0 then 'success' else 'no_match' end,'items',v_items,'agreement_version',p_expected_version,'message',case when jsonb_array_length(v_items)=0 then 'Para lo que acordamos nutrir, todavía no tengo una relación de Fuente suficientemente revisada. Podés recibir una guía puntual o explorar por tu cuenta.' else null end);
end $function$

;
NOTIFY pgrst, 'reload schema';
