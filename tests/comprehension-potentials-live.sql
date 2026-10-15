-- Real SQL; all people and editorial witnesses rolled back.
begin;
do $$
declare u uuid:=gen_random_uuid();u2 uuid:=gen_random_uuid();p uuid;p2 uuid;s jsonb;r jsonb;items jsonb;concept uuid;hv uuid;target uuid;denied boolean;moment uuid;
begin
 insert into auth.users(id,aud,role,email) values(u,'authenticated','authenticated','review-'||u||'@example.invalid'),(u2,'authenticated','authenticated','review-'||u2||'@example.invalid');
 insert into gf_core.persons(auth_user_id) values(u) returning person_id into p;insert into gf_core.persons(auth_user_id) values(u2) returning person_id into p2;
 insert into gf_core.privacy_preferences(person_id,memory_allowed) values(p,false),(p2,false);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 s:=public.lumen_s1_accompany_moment('Estoy agotada del trabajo y quiero escuchar mejor a mis hijos.','es-AR','es','web',gen_random_uuid(),true);moment:=(s->>'moment_id')::uuid;
 items:=jsonb_build_array(jsonb_build_object('identity_id',gen_random_uuid(),'concept_id',null,'label','Escuchar de una forma propia','definition','Dar atención sin exigir perfección','contextual_meaning','Escuchar sin el teléfono','origin','person','status','reformulated'));
 r:=public.lumen_s1_review_moment((s->>'episode_id')::uuid,s->>'understanding','{family_care}',0,items);
 assert (select features->'reviewed_potentials'->0->>'contextual_meaning'='Escuchar sin el teléfono' from gf_core.moment_interpretations where moment_id=moment order by created_at desc limit 1);
 assert (select expression_text='Estoy agotada del trabajo y quiero escuchar mejor a mis hijos.' from gf_private.moment_originals where moment_id=moment);
 assert not exists(select 1 from gf_core.trajectories where person_id=p),'punctual review created Faro';
 r:=public.lumen_s1_moment_constellation((s->>'episode_id')::uuid,'es-AR',3,gen_random_uuid(),null);assert jsonb_array_length(r->'items')=0,'legacy capability bypassed accepted potentials';
 denied:=false;begin perform public.lumen_s1_review_moment((s->>'episode_id')::uuid,s->>'understanding','{family_care}',0,jsonb_set(items,'{0,status}','"proposed"'));exception when invalid_parameter_value then denied:=true;end;assert denied,'unaccepted hypothesis entered review';
 select l.concept_id,l.help_version_id,hp.help_id into concept,hv,target from gf_core.help_potential_links l join gf_core.help_versions v on v.help_version_id=l.help_version_id join gf_core.help_possibilities hp on hp.help_id=v.help_id and hp.current_version=v.version where hp.lifecycle in('active','active_limited') limit 1;
 update gf_core.potential_concepts set editorial_status='reviewed',scope_note='Transacción sintética sin admisión',provenance=provenance||jsonb_build_object('operational_expressions',jsonb_build_array('Escuchar de una forma propia')) where concept_id=concept;
 update gf_core.help_potential_links set editorial_status='reviewed' where concept_id=concept and help_version_id=hv;
 r:=public.lumen_s1_moment_constellation((s->>'episode_id')::uuid,'es-AR',3,gen_random_uuid(),null);assert r->'items' @> jsonb_build_array(jsonb_build_object('help_id',target)),'accepted potential did not affect matching';
 -- Old four-argument contract still works and preserves the accepted review.
 perform public.lumen_s1_review_moment((s->>'episode_id')::uuid,s->>'understanding','{family_care}',5);
 assert (select jsonb_array_length(features->'reviewed_potentials')=1 from gf_core.moment_interpretations where moment_id=moment order by created_at desc limit 1);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u2,'role','authenticated')::text,true);denied:=false;
 begin perform public.lumen_s1_review_moment((s->>'episode_id')::uuid,'Invadir','{}',0,items);exception when insufficient_privilege then denied:=true;end;assert denied,'cross-owner review accepted';
 assert not has_function_privilege('anon','public.lumen_s1_review_moment(uuid,text,text[],integer,jsonb)','execute');
end $$;
select 'PASS: potentials reviewed without Faro/memory, original intact, accepted context persisted, proposed rejected, no legacy bypass, reviewed N:M affects future selection, old arity preserved, ownership/ACL; all fixtures rolled back' result;
rollback;
