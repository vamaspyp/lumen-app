-- A63 V63 B1/B2/B3: real DB execution; fixtures and editorial witnesses rolled back.
begin;
do $$
declare u uuid:=gen_random_uuid();p uuid;s jsonb;c jsonb;a jsonb;t uuid;r jsonb;item jsonb;concept uuid;hv uuid;label text;definition text;rev integer;
begin
 assert gf_core.s1_interpret('Mi trabajo va bien. Quiero celebrar la llegada de mi hija.')->'capacity_keys'='[]'::jsonb;
 assert gf_core.s1_interpret('Mi trabajo va bien. Quiero celebrar la llegada de mi hija.')->>'understanding' not ilike '%exige el trabajo%';
 assert gf_core.s1_interpret('No estoy agotada; quiero aprender a pintar.')->>'requires_clarification'='false';
 assert gf_core.s1_interpret('Quiero amar mejor y recuperar el juego con mi pareja.')->>'requires_clarification'='false';
 assert not (gf_core.s1_interpret('Quiero respirar.')->'features'->'rule_keys' ? 'emotion_regulation');
 insert into auth.users(id,aud,role,email) values(u,'authenticated','authenticated','b123-'||u||'@example.invalid');
 insert into gf_core.persons(auth_user_id) values(u) returning person_id into p;
 insert into gf_core.privacy_preferences(person_id,memory_allowed) values(p,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 r:=public.lumen_faro_potential_proposal('No quiero descansar, pero quiero aprender a pintar.');
 assert r->'items' @> '[{"label":"Aprender con curiosidad"}]'::jsonb,'positive clause after negation was lost';
 s:=public.lumen_s1_accompany_moment('Estoy agotada del trabajo y necesito bajar un cambio.','es-AR','es','web',gen_random_uuid(),true);
 perform public.lumen_s1_review_moment((s->>'episode_id')::uuid,s->>'understanding','{work,wellbeing}',0);
 c:=public.lumen_s1_moment_constellation((s->>'episode_id')::uuid,'es-AR',8,gen_random_uuid(),null);
 assert jsonb_array_length(c->'items')>3,'B3 backend still caps three';
 assert jsonb_array_length(c->'items')<=8;
 select pc.concept_id,l.help_version_id,pc.label_es,pc.definition_es into concept,hv,label,definition from gf_core.potential_concepts pc join gf_core.help_potential_links l on l.concept_id=pc.concept_id join gf_core.help_versions v on v.help_version_id=l.help_version_id join gf_core.help_possibilities hp on hp.help_id=v.help_id and hp.current_version=v.version where hp.lifecycle in('active','active_limited') limit 1;
 item:=jsonb_build_array(jsonb_build_object('identity_id',gen_random_uuid(),'concept_id',null,'label','Una expresión humana revisada','definition','','contextual_meaning','En este Faro','origin','person','status','accepted'));
 a:=public.lumen_faro_review_confirm(null,'Cuidar mi dirección',item,'{}',0,null,null,'active');t:=(a->>'trajectory_id')::uuid;
 r:=public.lumen_faro_constellation(t,1,0,'es-AR');assert r->>'state'='no_match';
 -- Explicitly scoped editorial witness, never retained/admitted by this test.
 update gf_core.potential_concepts set editorial_status='reviewed',scope_note='Alcance transaccional de prueba, sin equivalencia global',provenance=provenance||jsonb_build_object('operational_expressions',jsonb_build_array('Una expresión humana revisada')) where concept_id=concept;
 update gf_core.help_potential_links set editorial_status='reviewed' where concept_id=concept and help_version_id=hv;
 r:=public.lumen_faro_constellation(t,1,0,'es-AR');assert r->>'state'='success','scoped reviewed expression did not connect';
 s:=public.lumen_s1_accompany_moment('Una expresión humana revisada','es-AR','es','web',gen_random_uuid(),true);
 assert s->'interpretation'->'capacity_keys'='[]'::jsonb;
 perform public.lumen_s1_review_moment((s->>'episode_id')::uuid,'Una expresión humana revisada','{}',0);
 c:=public.lumen_s1_moment_constellation((s->>'episode_id')::uuid,'es-AR',6,gen_random_uuid(),null);
 assert c->>'state'='success','reviewed semantic path still requires capacity seed';
 assert c->'capacity_keys'='[]'::jsonb;

 item:=jsonb_set(item,'{0,label}','"Otra expresión no admitida"');
 a:=public.lumen_faro_agreement_validate(t,'Cuidar mi dirección',item,'{}',1);
 r:=public.lumen_faro_constellation(t,2,0,'es-AR');assert r->>'state'='no_match','unreviewed expression was equated';
end $$;
select 'PASS V63: faithful explicit goals, negated state, no lexical anger, >3 composition, scoped reviewed link only, NO_MATCH; rollback all fixtures' result;
rollback;
