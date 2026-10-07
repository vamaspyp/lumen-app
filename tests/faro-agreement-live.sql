-- Execute through the authorized database connector. All synthetic rows roll back.
begin;
do $$
declare u uuid:=gen_random_uuid();u2 uuid:=gen_random_uuid();p uuid;p2 uuid;t uuid;a jsonb;items jsonb;denied boolean:=false;
begin
 insert into auth.users(id,aud,role,email) values(u,'authenticated','authenticated','a63-'||u||'@example.invalid'),(u2,'authenticated','authenticated','a63-'||u2||'@example.invalid');
 insert into gf_core.persons(auth_user_id) values(u) returning person_id into p;
 insert into gf_core.persons(auth_user_id) values(u2) returning person_id into p2;
 insert into gf_core.privacy_preferences(person_id,memory_allowed) values(p,false),(p2,true);
 insert into gf_core.trajectories(person_id,faro_text) values(p,'Cuidar mi descanso') returning trajectory_id into t;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 a:=public.lumen_faro_agreement_snapshot(t);assert a->>'state'='without_memory';
 begin perform public.lumen_faro_agreement_validate(t,'Cuidar mi descanso','[]','{}',0);exception when insufficient_privilege then denied:=true;end;assert denied;
 update gf_core.privacy_preferences set memory_allowed=true where person_id=p;
 a:=public.lumen_faro_constellation(t,0);assert a->>'state'='agreement_required';
 items:=jsonb_build_array(jsonb_build_object('identity_id',gen_random_uuid(),'concept_id',null,'label','Parar a tiempo','definition','','contextual_meaning','Descansar sin culpa','origin','person','status','accepted'));
 a:=public.lumen_faro_agreement_validate(t,'Cuidar mi descanso',items,'{}',0);assert a->>'state'='validated';assert (a->>'version')::int=1;assert a->'items'->0->>'label'='Parar a tiempo';
 a:=public.lumen_faro_agreement_validate(t,'Cuidar mi descanso',items,'{}',1);assert (a->>'version')::int=1; -- unchanged is idempotent
 a:=public.lumen_faro_constellation(t,1);assert a->>'state'='no_match'; -- current editorial links remain candidates
 items:=jsonb_set(items,'{0,status}','"withdrawn"');a:=public.lumen_faro_agreement_validate(t,'Cuidar mi descanso',items,'{}',1);assert (a->>'version')::int=2;assert jsonb_array_length(a->'history')=2;
 a:=public.lumen_s2_export_sanctuary();assert jsonb_array_length(a->'faro_potential_agreements')=2;
 denied:=false;begin perform public.lumen_faro_agreement_validate(t,'Cuidar mi descanso',items,'{}',1);exception when serialization_failure then denied:=true;end;assert denied;
 update gf_core.trajectories set faro_text='Cuidar mi descanso ahora' where trajectory_id=t;
 a:=public.lumen_faro_agreement_snapshot(t);assert a->>'state'='stale';a:=public.lumen_faro_constellation(t,2);assert a->>'state'='agreement_required';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u2,'role','authenticated')::text,true);
 denied:=false;begin perform public.lumen_faro_agreement_snapshot(t);exception when sqlstate 'P0002' then denied:=true;end;assert denied;
 denied:=false;begin perform public.lumen_faro_agreement_validate(t,'Cuidar mi descanso ahora',items,'{}',2);exception when sqlstate 'P0002' then denied:=true;end;assert denied;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 delete from gf_core.trajectories where trajectory_id=t;assert not exists(select 1 from gf_private.faro_agreement_versions where trajectory_id=t);
 assert not has_function_privilege('anon','public.lumen_faro_agreement_validate(uuid,text,jsonb,text[],integer)','execute');
 assert not has_table_privilege('authenticated','gf_private.faro_agreement_items','select');
 assert (select relrowsecurity from pg_class where oid='gf_private.faro_agreement_items'::regclass);
end $$;
select 'PASS: live consent, ownership/read-write, version/history/idempotence, export, conflict, stale gate, no_match, cascade, ACL and RLS; all synthetic data rolled back' as result;
rollback;
