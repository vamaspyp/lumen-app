-- A63 / RV-06 / CF-06. Actual contracts; all synthetic records roll back.
begin;
do $$
declare u uuid:=gen_random_uuid(); u2 uuid:=gen_random_uuid(); h uuid; ep uuid; s jsonb; m jsonb;
begin
 insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at) values(u,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',u::text||'@example.invalid',now(),now());
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 perform public.lumen_bootstrap_person(gen_random_uuid());
 perform public.lumen_s2_set_memory(true,gen_random_uuid());
 select help_id into h from gf_core.help_possibilities where lifecycle='active_limited' limit 1;
 s:=public.lumen_source_begin_experience(h,'es-AR','es',gen_random_uuid()); ep:=(s->>'episode_id')::uuid;
 perform public.lumen_s2_save_experience_position(ep,0,false);
 assert jsonb_array_length(public.lumen_living_map_snapshot()->'lived_experiences')=0,'opening/position must not imply lived';
 perform public.lumen_s2_save_experience_position(ep,1,true);
 m:=public.lumen_living_map_snapshot();
 assert jsonb_array_length(m->'lived_experiences')=1,'completed experience missing without return';
 assert m->'lived_experiences'->0->>'effect' is null,'completion inferred usefulness';
 assert jsonb_array_length(m->'realization')=0 and jsonb_array_length(m->'potential')=0,'completion created feedback/own';
 assert jsonb_array_length(public.lumen_s2_list_sanctuary())=0,'completion implied saving';
 assert (m->'lived_experiences'->0->>'help_id')::uuid=h,'source identity lost';
 perform public.lumen_s1_record_outcome(ep,'helped',true,gen_random_uuid());
 m:=public.lumen_living_map_snapshot();
 assert jsonb_array_length(m->'lived_experiences')=1 and m->'lived_experiences'->0->>'effect'='helped','explicit return duplicated/lost experience';
 insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at) values(u2,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',u2::text||'@example.invalid',now(),now());
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u2,'role','authenticated')::text,true);
 perform public.lumen_bootstrap_person(gen_random_uuid());
 assert jsonb_array_length(public.lumen_living_map_snapshot()->'lived_experiences')=0,'without consent leaked experiences';
 perform public.lumen_s2_set_memory(true,gen_random_uuid());
 assert jsonb_array_length(public.lumen_living_map_snapshot()->'lived_experiences')=0,'cross-person leak';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 perform public.lumen_privacy_forget_personal_memory(true);
 perform public.lumen_s2_set_memory(true,gen_random_uuid());
 assert jsonb_array_length(public.lumen_living_map_snapshot()->'lived_experiences')=0,'forgotten experience resurfaced';
 assert not has_function_privilege('anon','public.lumen_living_map_snapshot()','execute'),'anonymous access';
end $$;
select 'PASS completed without return/save/own; explicit feedback separate; no opened-only entry; ownership, consent, forget, ACL' as result;
rollback;
