-- A37 · final interpreter calibration for broader Spanish Source+ coverage.
-- Safety remains first. Specific high-frequency life moments precede broad patterns.

create or replace function gf_core.s1_interpret(p_expression text)
returns jsonb language plpgsql immutable security invoker set search_path=''
as $$
declare
  v text:=lower(trim(coalesce(p_expression,'')));
  v_intent text;
  v_needs text[]:='{}';
  v_conf numeric(4,3):=0.25;
  v_clarify boolean:=false;
begin
  if char_length(v)<3 then
    return jsonb_build_object('intent_key',null,'need_keys',jsonb_build_array(),'confidence',0.1,'uncertainty_key','too_little_context','requires_clarification',true,'safety_state','clear','features',jsonb_build_object('ruleset','rules.v2'));
  end if;

  if v ~ '(suicid|matarme|quiero morir|hacerme daño|hacerme dano|self[- ]?harm|kill myself|overdose|sobredosis|violencia grave|abuso grave)' then
    return jsonb_build_object('intent_key','seek_support','need_keys',jsonb_build_array('human_support'),'confidence',0.95,'uncertainty_key',null,'requires_clarification',false,'safety_state','blocked','features',jsonb_build_object('risk_pattern_detected',true,'ruleset','rules.v2'));
  end if;

  if v ~ '(duelo|falleci|murió|murio|muerte de|perdí a|perdi a|extraño a alguien que murió|luto)' then v_intent:='move_through_grief';v_needs:=array['grief'];v_conf:=0.88;
  elsif v ~ '(no puedo dormir|insomnio|dormir mal|me despierto|conciliar el sueño|conciliar el sueno|sueño cortado|sueno cortado)' then v_intent:='rest_better';v_needs:=array['sleep','pause'];v_conf:=0.86;
  elsif v ~ '(plata|dinero|deuda|finanzas|gastos|no llego a fin de mes|vencimiento|económic|economic)' then v_intent:='face_financial_worry';v_needs:=array['financial_calm','clarity'];v_conf:=0.84;
  elsif v ~ '(mudanza|separación|separacion|nuevo trabajo|cambio de vida|transición|transicion|me jubil|me recibí|me recibi)' then v_intent:='navigate_transition';v_needs:=array['change_transition','meaning'];v_conf:=0.82;
  elsif v ~ '(ansiedad|ansioso|ansiosa|angustia|preocupad|preocupa demasiado|nervios|miedo constante|mente no para)' then v_intent:='regulate_anxiety';v_needs:=array['anxiety','pause'];v_conf:=0.84;
  elsif v ~ '(enojad|enfadad|furios|ira|bronca|rabia|explotar|responder en caliente)' then v_intent:='regulate_emotion';v_needs:=array['emotion_regulation'];v_conf:=0.84;
  elsif v ~ '(pelea|discutimos|discusión|discusion|conflicto con|reconciliar|pedir perdón|pedir perdon|disculparme|arreglar con)' then v_intent:='repair_relationship';v_needs:=array['relationship_repair','connection'];v_conf:=0.84;
  elsif v ~ '(poner un límite|poner un limite|decir que no|me invade|se aprovecha|no respeta|necesito un límite|necesito un limite)' then v_intent:='set_boundary';v_needs:=array['boundaries'];v_conf:=0.84;
  elsif v ~ '(me odio|soy un fracaso|culpa|vergüenza|verguenza|me castigo|no me perdono|muy duro conmigo|muy dura conmigo)' then v_intent:='offer_self_compassion';v_needs:=array['self_compassion'];v_conf:=0.82;
  elsif v ~ '(no confío en mí|no confio en mi|insegur|no soy capaz|comparándome|comparandome|autoestima|confianza en mí|confianza en mi)' then v_intent:='restore_confidence';v_needs:=array['confidence','agency'];v_conf:=0.80;
  elsif v ~ '(hábito|habito|rutina|constancia|dejé de|deje de|retomar.*ejercicio|mantener.*costumbre)' then v_intent:='build_habit';v_needs:=array['habit','agency'];v_conf:=0.80;
  elsif v ~ '(trabajo|laburo|jefe|reuniones|burnout|agotamiento laboral|sobrecarga laboral|no desconecto)' then v_intent:='reduce_work_stress';v_needs:=array['work_stress','clarity'];v_conf:=0.80;
  elsif v ~ '(cuido a|cuidador|cuidadora|cuidando a|familiar enfermo|haciendo cargo de)' then v_intent:='sustain_care';v_needs:=array['caregiving','self_compassion'];v_conf:=0.80;
  elsif v ~ '(sin energía|sin energia|apagado|apagada|sedentario|necesito activarme|moverme un poco)' then v_intent:='restore_energy';v_needs:=array['energy','agency'];v_conf:=0.76;
  elsif v ~ '(distraíd|distraid|no me concentro|no puedo concentrarme|pierdo el foco|mil pestañas|mil pestanas)' then v_intent:='regain_focus';v_needs:=array['focus','clarity'];v_conf:=0.78;
  elsif v ~ '(no sé qué hacer|no se que hacer|decidir|decisión|decision|confund|ordenar.*idea|claridad|qué quiero|que quiero)' then v_intent:='gain_clarity';v_needs:=array['clarity'];v_conf:=0.82;
  elsif v ~ '(bloquead|trabado|procrast|empezar|arrancar|primer paso|pequeño paso|pequeno paso)' then v_intent:='move_forward';v_needs:=array['agency'];v_conf:=0.80;
  elsif v ~ '(saturad|abrumad|agotad|cansad|necesito parar|bajar un cambio|demasiado)' then v_intent:='reduce_load';v_needs:=array['pause','clarity'];v_conf:=0.78;
  elsif v ~ '(sentido|propósito|proposito|qué importa|que importa|valores|dirección|direccion)' then v_intent:='reconnect_meaning';v_needs:=array['meaning','clarity'];v_conf:=0.78;
  elsif v ~ '(solo|sola|acompañ|acompan|hablar con alguien|necesito apoyo|conectar con alguien)' then v_intent:='seek_connection';v_needs:=array['connection'];v_conf:=0.76;
  elsif v ~ '(agradec|valorar|apreciar|algo bueno|reconocer lo bueno)' then v_intent:='notice_value';v_needs:=array['appreciation'];v_conf:=0.78;
  else v_intent:='open_expression';v_needs:='{}';v_conf:=0.30;
  end if;

  return jsonb_build_object('intent_key',v_intent,'need_keys',to_jsonb(v_needs),'confidence',v_conf,'uncertainty_key',case when v_conf<0.5 then 'insufficient_coverage_signal' else null end,'requires_clarification',v_clarify,'safety_state','clear','features',jsonb_build_object('fallback','rules.v2','ruleset','rules.v2'));
end $$;

revoke execute on function gf_core.s1_interpret(text) from public,anon;
grant execute on function gf_core.s1_interpret(text) to authenticated;

-- Keep audit metadata honest after the A37 calibration. The live database also records
-- this transition through a37_s1_audit_versions_v2; this assertion documents the contract
-- for future application-boundary migrations.
comment on function gf_core.s1_interpret(text) is 'A37 rules.v2: Spanish 80/20 life-moment interpretation; safety first; Source coverage.v2.';
