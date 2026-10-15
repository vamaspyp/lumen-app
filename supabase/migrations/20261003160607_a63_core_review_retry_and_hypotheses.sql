-- Hypotheses have no accepted state until explicit review. Retry is addressable without a new table.
create or replace function public.lumen_faro_potential_proposal(p_expression text,p_faro_text text default null)
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
  v_items:=v_items||jsonb_build_array(jsonb_build_object('identity_id',gen_random_uuid(),'concept_id',null,'label',r.label,'definition',r.definition,'contextual_meaning',r.definition,'origin','lumi','status','proposed','reason','Lo propongo como posibilidad para revisar por estas palabras tuyas: «'||substring(v_text from '(?i)'||r.pattern)||'». No afirma algo sobre vos ni equivale a un concepto de Fuente.'));
 end loop;
 -- Explicit original terms remain candidates, with boundaries and no wildcard matching.
 if jsonb_array_length(v_items)=0 then
  select coalesce(jsonb_agg(jsonb_build_object('identity_id',gen_random_uuid(),'concept_id',c.concept_id,'label',c.label_es,'definition',c.definition_es,'contextual_meaning','Explorar si «'||c.label_es||'» puede contribuir a: '||left(v_text,700),'origin','lumi','status','proposed','source_status',c.editorial_status,'reason','Nombraste este término; su pertinencia para tu Faro sigue siendo una hipótesis.')),'[]'::jsonb) into v_items from (select c.* from gf_core.potential_concepts c where c.editorial_status in('candidate','reviewed') and strpos(' '||regexp_replace(v_scan,'[[:punct:]]',' ','g')||' ',' '||lower(c.label_es)||' ')>0 order by c.label_es limit 3) c;
 end if;
 return jsonb_build_object('state',case when jsonb_array_length(v_items)>0 then 'proposed' else 'needs_person_expression' end,'items',v_items,'message',case when jsonb_array_length(v_items)>0 then 'Elegí lo que te representa. Lo que no aceptes queda fuera del acuerdo.' else 'Todavía no tengo una lectura concreta. Podés nombrar lo que querés nutrir o seguir sin potenciales.' end);
end $$;

drop function public.lumen_faro_review_confirm(uuid,text,jsonb,text[],integer,integer,uuid,text);
create or replace function public.lumen_faro_review_confirm(p_trajectory_id uuid,p_faro_text text,p_items jsonb,p_area_keys text[],p_expected_version integer,p_expected_revision integer,p_origin_moment_id uuid,p_status text,p_episode_id uuid default null,p_understanding text default null,p_request_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();v_id uuid:=p_trajectory_id;v_faro gf_core.trajectories;v_agreement jsonb;v_created jsonb;v_path uuid;v_personal jsonb;
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then raise exception 'memory consent required' using errcode='42501';end if;
 if gf_core.s1_interpret(p_faro_text)->>'safety_state'='blocked' then raise exception 'human help required' using errcode='42501';end if;
 if v_id is null then
  if p_expected_version<>0 or p_expected_revision is not null then raise exception 'invalid new agreement' using errcode='22023';end if;
  if p_request_id is not null then
   select * into v_faro from gf_core.trajectories where trajectory_id=p_request_id and person_id=v_person for update;
   if found then
    v_agreement:=public.lumen_faro_agreement_snapshot(p_request_id);
    select coalesce(jsonb_agg(i-'source_status' order by ord),'[]') into v_personal from jsonb_array_elements(v_agreement->'items') with ordinality x(i,ord);
    if v_faro.faro_text=trim(p_faro_text) and v_agreement->>'state'='validated' and (v_agreement->>'version')::integer=1 and v_personal=p_items and v_agreement->'area_keys'=to_jsonb(coalesce(p_area_keys,'{}'::text[])) then return jsonb_build_object('trajectory_id',p_request_id,'agreement',v_agreement);end if;
    raise exception 'creation changed; reread before confirming' using errcode='40001';
   end if;
   v_id:=p_request_id;
   insert into gf_core.trajectories(trajectory_id,person_id,faro_text) values(v_id,v_person,trim(p_faro_text));
   insert into gf_core.paths(trajectory_id,person_id) values(v_id,v_person) returning path_id into v_path;
   perform gf_private.emit_person_event('TrajectoryCreated','trajectory',v_id,v_person,p_request_id,'s2.a63.review.v1',jsonb_build_object('status','active'));
  else v_created:=public.lumen_s2_create_trajectory(p_faro_text,gen_random_uuid());v_id:=(v_created->>'trajectory_id')::uuid;end if;
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
 if p_episode_id is not null then perform public.lumen_s1_review_moment(p_episode_id,p_understanding,p_area_keys,0);end if;
 perform public.lumen_s2_update_trajectory(v_id,p_faro_text,p_status,gen_random_uuid());
 v_agreement:=public.lumen_faro_agreement_validate(v_id,p_faro_text,p_items,p_area_keys,p_expected_version);
 return jsonb_build_object('trajectory_id',v_id,'agreement',v_agreement);
end $$;


revoke all on function public.lumen_faro_review_confirm(uuid,text,jsonb,text[],integer,integer,uuid,text,uuid,text,uuid) from public,anon;
grant execute on function public.lumen_faro_review_confirm(uuid,text,jsonb,text[],integer,integer,uuid,text,uuid,text,uuid) to authenticated;
