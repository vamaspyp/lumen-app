CREATE OR REPLACE FUNCTION public.lumen_faro_potential_proposal(p_expression text, p_faro_text text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_text text:=trim(coalesce(nullif(trim(p_faro_text),''),p_expression,''));v_scan text;v_items jsonb:='[]';r record;
begin
 if gf_core.current_person_id() is null then raise exception 'authentication required' using errcode='28000';end if;
 if char_length(coalesce(p_expression,''))>4000 or char_length(v_text) not between 1 and 4000 then raise exception 'invalid expression' using errcode='22023';end if;
 if gf_core.s1_interpret(coalesce(p_expression,'')||' '||v_text)->>'safety_state'='blocked' then return jsonb_build_object('state','safety_referral','items','[]'::jsonb,'message','Este momento necesita acompañamiento humano. No voy a proponerte un cultivo para ese riesgo.');end if;
 v_scan:=lower(v_text);
 v_scan:=regexp_replace(v_scan,'no (quiero|necesito|busco|deseo) (?:(?!\m(pero|sino|aunque)\M)[^.;!?])+',' ','g');
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
  v_items:=v_items||jsonb_build_array(jsonb_build_object('identity_id',gen_random_uuid(),'concept_id',null,'label',r.label,'definition',r.definition,'contextual_meaning',r.definition,'origin','lumi','status','proposed','reason','Lo propongo como posibilidad para revisar por estas palabras tuyas: «'||substring(v_text from '(?i)'||r.pattern)||'». No afirma algo sobre vos ni equivale a un concepto de Fuente.'));
 end loop;
 -- Explicit original terms remain candidates, with boundaries and no wildcard matching.
 if jsonb_array_length(v_items)=0 then
  select coalesce(jsonb_agg(jsonb_build_object('identity_id',gen_random_uuid(),'concept_id',c.concept_id,'label',c.label_es,'definition',c.definition_es,'contextual_meaning','Explorar si «'||c.label_es||'» puede contribuir a: '||left(v_text,700),'origin','lumi','status','proposed','source_status',c.editorial_status,'reason','Nombraste este término; su pertinencia para tu Faro sigue siendo una hipótesis.')),'[]'::jsonb) into v_items from (select c.* from gf_core.potential_concepts c where c.editorial_status in('candidate','reviewed') and strpos(' '||regexp_replace(v_scan,'[[:punct:]]',' ','g')||' ',' '||lower(c.label_es)||' ')>0 order by c.label_es limit 3) c;
 end if;
 return jsonb_build_object('state',case when jsonb_array_length(v_items)>0 then 'proposed' else 'needs_person_expression' end,'items',v_items,'message',case when jsonb_array_length(v_items)>0 then 'Elegí lo que te representa. Lo que no aceptes queda fuera del acuerdo.' else 'Todavía no tengo una lectura concreta. Podés nombrar lo que querés nutrir o seguir sin potenciales.' end);
end $function$
