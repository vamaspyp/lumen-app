-- VA+LUMEN A38 · Stress experiencial · rules.v3
-- Broad real-language families discovered by a 48-moment synthetic experiential matrix.
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
  if char_length(v)<3 or v ~ '^(no sé|no se|ni idea|qué sé yo|que se yo)[.! ]*$' then
    return jsonb_build_object('intent_key',null,'need_keys',jsonb_build_array(),'confidence',0.1,'uncertainty_key','too_little_context','requires_clarification',true,'safety_state','clear','features',jsonb_build_object('ruleset','rules.v3'));
  end if;
  if v ~ '(suicid|matarme|quiero morir|no quiero seguir viviendo|hacerme daño|hacerme dano|self[- ]?harm|kill myself|overdose|sobredosis|violencia grave|abuso grave)' then
    return jsonb_build_object('intent_key','seek_support','need_keys',jsonb_build_array('human_support'),'confidence',0.95,'uncertainty_key',null,'requires_clarification',false,'safety_state','blocked','features',jsonb_build_object('risk_pattern_detected',true,'ruleset','rules.v3'));
  end if;

  if v ~ '(duelo|falleci|murió|murio|muerte de|perdí a|perdi a|luto|terminamos una relación|terminamos una relacion|ruptura|se terminó la relación|se termino la relacion|vacío enorme|vacio enorme)' then v_intent:='move_through_grief';v_needs:=array['grief'];v_conf:=0.88;
  elsif v ~ '(no puedo dormir|insomnio|dormir mal|me despierto|conciliar el sueño|conciliar el sueno|sueño cortado|sueno cortado|me cuesta dormirme|varias noches.*dorm|me acost[eé].*(cabeza|pendiente)|cama.*pendiente)' then v_intent:='rest_better';v_needs:=array['sleep','pause'];v_conf:=0.86;
  elsif v ~ '(plata|dinero|deuda|finanzas|gastos|fin de mes|vencim|económic|economic|mirar la cuenta|saldo)' then v_intent:='face_financial_worry';v_needs:=array['financial_calm','clarity'];v_conf:=0.85;
  elsif v ~ '(mudanza|me mud[eé]|nuevo trabajo|empec[eé] un trabajo nuevo|cambio de vida|transición|transicion|me jubil|me recibí|me recibi|me qued[eé] sin trabajo|perdí el trabajo|perdi el trabajo)' then v_intent:='navigate_transition';v_needs:=array['change_transition','meaning'];v_conf:=0.84;
  elsif v ~ '(cuido a|persona que cuido|cuidador|cuidadora|cuidando a|familiar enfermo|haciendo cargo de)' then v_intent:='sustain_care';v_needs:=array['caregiving','self_compassion'];v_conf:=0.83;
  elsif v ~ '(poner un límite|poner un limite|decir que no|me invade|se aprovecha|no respeta|necesito un límite|necesito un limite|frenar esto|me hablen así|me hablen asi)' then v_intent:='set_boundary';v_needs:=array['boundaries'];v_conf:=0.84;
  elsif v ~ '(ansiedad|ansioso|ansiosa|angustia|preocupad|preocupa demasiado|nervios|miedo constante|mente no para|no dejo de imaginar|todo lo que puede salir mal|pecho apretado|cabeza acelerada|darle vueltas|incertidumbre.*cabeza)' then v_intent:='regulate_anxiety';v_needs:=array['anxiety','pause'];v_conf:=0.84;
  elsif v ~ '(enojad|enfadad|furios|ira|bronca|rabia|explotar|responder en caliente|mandarl[oa] al carajo|contestarle cualquier cosa)' then v_intent:='regulate_emotion';v_needs:=array['emotion_regulation'];v_conf:=0.84;
  elsif v ~ '(pelea|discutimos|discusión|discusion|conflicto con|reconciliar|pedir perdón|pedir perdon|disculparme|arreglar con|arreglar las cosas)' then v_intent:='repair_relationship';v_needs:=array['relationship_repair','connection'];v_conf:=0.84;
  elsif v ~ '(me odio|soy un fracaso|culpa|vergüenza|verguenza|me castigo|castigando|no me perdono|muy duro conmigo|muy dura conmigo|metí la pata|meti la pata)' then v_intent:='offer_self_compassion';v_needs:=array['self_compassion'];v_conf:=0.82;
  elsif v ~ '(no confío en mí|no confio en mi|insegur|no soy capaz|comparándome|comparandome|autoestima|confianza en mí|confianza en mi|no estoy a la altura|voy atrasad|no soy tan bueno|no soy tan buena|se van a dar cuenta)' then v_intent:='restore_confidence';v_needs:=array['confidence','agency'];v_conf:=0.82;
  elsif v ~ '(hábito|habito|rutina|constancia|dejé de|deje de|retomar.*ejercicio|mantener.*costumbre|todos los días.*sostengo|todos los dias.*sostengo)' then v_intent:='build_habit';v_needs:=array['habit','agency'];v_conf:=0.80;
  elsif v ~ '(sin energía|sin energia|sin ganas de nada|apagado|apagada|sedentario|necesito activarme|moverme un poco)' then v_intent:='restore_energy';v_needs:=array['energy','agency'];v_conf:=0.79;
  elsif v ~ '(distraíd|distraid|no me concentro|no puedo concentrarme|no logro concentrarme|pierdo el foco|mil pestañas|mil pestanas|a los .*minutos.*otra cosa|teléfono cada|telefono cada)' then v_intent:='regain_focus';v_needs:=array['focus','clarity'];v_conf:=0.80;
  elsif v ~ '(en automático|en automatico|para qué hago todo|para que hago todo|sentido|propósito|proposito|qué importa|que importa|valores|dirección|direccion)' then v_intent:='reconnect_meaning';v_needs:=array['meaning','clarity'];v_conf:=0.80;
  elsif v ~ '(trabajo|laburo|jefe|reuniones|burnout|agotamiento laboral|sobrecarga laboral|no desconecto|tapado de trabajo|mentalmente en la oficina)' then v_intent:='reduce_work_stress';v_needs:=array['work_stress','clarity'];v_conf:=0.80;
  elsif v ~ '(no sé qué hacer|no se que hacer|no sé si|no se si|decidir|decisión|decision|confund|ordenar.*idea|claridad|qué quiero|que quiero)' then v_intent:='gain_clarity';v_needs:=array['clarity'];v_conf:=0.82;
  elsif v ~ '(bloquead|trabado|procrast|pateándolo|pateandolo|posterg|empezar|arrancar|primer paso|pequeño paso|pequeno paso)' then v_intent:='move_forward';v_needs:=array['agency'];v_conf:=0.80;
  elsif v ~ '(saturad|abrumad|agotad|cansad|necesito parar|bajar un cambio|demasiado|veinte cosas|cosas abiertas|no me entra una más|no me entra una mas)' then v_intent:='reduce_load';v_needs:=array['pause','clarity'];v_conf:=0.78;
  elsif v ~ '(solo|sola|acompañ|acompan|hablar con alguien|necesito apoyo|conectar con alguien)' then v_intent:='seek_connection';v_needs:=array['connection'];v_conf:=0.76;
  elsif v ~ '(agradec|valorar|apreciar|algo bueno|reconocer lo bueno|gesto conmigo.*hizo.*bien|gesto.*me hizo muy bien)' then v_intent:='notice_value';v_needs:=array['appreciation'];v_conf:=0.78;
  else v_intent:='open_expression';v_needs:='{}';v_conf:=0.30;
  end if;

  return jsonb_build_object('intent_key',v_intent,'need_keys',to_jsonb(v_needs),'confidence',v_conf,'uncertainty_key',case when v_conf<0.5 then 'insufficient_coverage_signal' else null end,'requires_clarification',v_clarify,'safety_state','clear','features',jsonb_build_object('fallback','rules.v3','ruleset','rules.v3'));
end $$;
revoke execute on function gf_core.s1_interpret(text) from public,anon;
grant execute on function gf_core.s1_interpret(text) to authenticated;
