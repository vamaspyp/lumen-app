-- Real database contracts. All people, editorial witnesses, policies and evidence rolled back.
begin;
do $$
declare u uuid:=gen_random_uuid();p uuid;u2 uuid:=gen_random_uuid();p2 uuid;t uuid;a jsonb;s jsonb;r jsonb;c jsonb;entry uuid;help uuid;help2 uuid;v uuid;rev integer;denied boolean;claim uuid;policy uuid;execution uuid;ev uuid;evs uuid[]:='{}';x integer;priority numeric;learning_faro uuid;concept uuid;target uuid;baseline uuid;ordered jsonb;
begin
 insert into auth.users(id,aud,role,email) values(u,'authenticated','authenticated','cf-'||u||'@example.invalid'),(u2,'authenticated','authenticated','cf-'||u2||'@example.invalid');
 insert into gf_core.persons(auth_user_id) values(u) returning person_id into p;
 insert into gf_core.persons(auth_user_id) values(u2) returning person_id into p2;
 insert into gf_core.privacy_preferences(person_id,memory_allowed,proactive_allowed,evidence_use_allowed) values(p,true,true,true),(p2,true,true,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 a:=public.lumen_faro_review_confirm(null,'Quiero aprender a crear con calma','[]','{wellbeing}',0,null,null,'active');t:=(a->>'trajectory_id')::uuid;
 select help_id into help from gf_core.help_possibilities where lifecycle in('active','active_limited') order by canonical_code limit 1;
 select help_id into help2 from gf_core.help_possibilities where lifecycle in('active','active_limited') and help_id<>help order by canonical_code limit 1;
 c:=public.lumen_faro_composition_save(t,1,jsonb_build_array(jsonb_build_object('help_id',help,'origin','fuente','reason','Elegida en Explorar')),null,0,null);entry:=(c->>'entry_id')::uuid;
 assert c->'composition'->>'version'='1';
 assert (c->'composition'->'versions'->0->'agreement'->>'faro_text')='Quiero aprender a crear con calma';
 assert not exists(select 1 from gf_core.personal_repertoire where person_id=p),'conservation inferred ownership';
 c:=public.lumen_faro_composition_save(t,1,jsonb_build_array(jsonb_build_object('help_id',help2),jsonb_build_object('help_id',help)),entry,1,null);
 assert jsonb_array_length(c->'composition'->'versions')=2;
 assert c->'composition'->'versions'->0->'items'->0->>'help_id'=help::text;
 assert c->'composition'->'versions'->1->'items'->0->>'help_id'=help2::text;
 c:=public.lumen_faro_composition_save(t,1,'[]',entry,2,1);
 assert c->'composition'->>'version'='3' and c->'composition'->'versions'->2->>'restored_from'='1';
 assert jsonb_array_length(c->'composition'->'versions'->2->'items')=1;
 denied:=false;begin perform public.lumen_faro_composition_save(t,1,'[]',entry,1,null);exception when sqlstate '40001' then denied:=true;end;assert denied,'stale write accepted';
 r:=public.lumen_s2_export_sanctuary();assert r->'sanctuary_entries'->0->'composition'->>'version'='3';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u2,'role','authenticated')::text,true);
 denied:=false;begin perform public.lumen_faro_composition_save(t,1,'[]',entry,3,null);exception when others then denied:=true;end;assert denied,'cross-owner write accepted';
 assert not(public.lumen_s2_list_sanctuary() @> jsonb_build_array(jsonb_build_object('entry_id',entry)));
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 s:=public.lumen_source_begin_experience(help,'es-AR','es',gen_random_uuid());
 perform public.lumen_cultivation_bind_experience((s->>'episode_id')::uuid,t,entry);
 perform public.lumen_s1_record_outcome((s->>'episode_id')::uuid,'helped',true,gen_random_uuid());
 assert not exists(select 1 from gf_private.evidence_units where person_pseudonym=p and (context::text like '%Quiero aprender%' or context ? 'original_expression')),'private expression leaked into collective evidence';
 r:=public.lumen_recurring_practice_set(help,7,'09:00','America/Argentina/Buenos_Aires','Si tengo un momento tranquilo',t,entry,null,'schedule');v:=(r->>'followup_id')::uuid;
 assert r->>'status'='scheduled';assert not exists(select 1 from gf_core.personal_repertoire where person_id=p);
 update gf_core.followups set due_at=now()-interval '1 hour' where followup_id=v;
 assert public.lumen_recurring_practice_snapshot()->0->>'relevant'='true';
 perform public.lumen_recurring_practice_set(help,7,'09:00','America/Argentina/Buenos_Aires','',t,entry,v,'pause');
 assert public.lumen_recurring_practice_snapshot()->0->>'relevant'='false';
 perform public.lumen_recurring_practice_set(help,3,'10:00','America/Argentina/Buenos_Aires','',t,entry,v,'resume');
 assert public.lumen_recurring_practice_snapshot()->0->'recurrence'->>'days'='3';
 perform public.lumen_recurring_practice_set(help,3,'10:00','America/Argentina/Buenos_Aires','',t,entry,v,'postpone');
 perform public.lumen_s2_record_longitudinal_signal((s->>'episode_id')::uuid,'NO_REMINDER_NEEDED',gen_random_uuid());
 assert public.lumen_recurring_practice_snapshot()='[]'::jsonb;
 assert (select status='cancelled' from gf_core.followups where followup_id=v);
 -- Only transactional editorial witnesses; no catalog admission survives.
 select l.concept_id into concept from gf_core.help_potential_links l join gf_core.help_versions hv on hv.help_version_id=l.help_version_id join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version where hp.lifecycle in('active','active_limited') group by l.concept_id having count(distinct hp.help_id)>=2 limit 1;
 assert concept is not null;
 update gf_core.potential_concepts set editorial_status='reviewed',scope_note='Test transaccional, no admisión',provenance=provenance||jsonb_build_object('operational_expressions',jsonb_build_array('Cultivo sintético verificable')) where concept_id=concept;
 update gf_core.help_potential_links set editorial_status='reviewed' where concept_id=concept;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u2,'role','authenticated')::text,true);
 a:=public.lumen_faro_review_confirm(null,'Cultivo de prueba',jsonb_build_array(jsonb_build_object('identity_id',gen_random_uuid(),'concept_id',null,'label','Cultivo sintético verificable','definition','','contextual_meaning','Prueba aislada','origin','person','status','accepted')),'{}',0,null,null,'active');learning_faro:=(a->>'trajectory_id')::uuid;
 ordered:=public.lumen_faro_constellation(learning_faro,1,0,'es-AR');assert jsonb_array_length(ordered->'items')>=2;
 baseline:=(ordered->'items'->0->>'help_id')::uuid;target:=(ordered->'items'->-1->>'help_id')::uuid;assert target<>baseline;
 -- Collective policy proposal is never activated by a person's return or by this migration.
 -- Three independent consented witnesses establish a bounded, refutable ordering test only.
 for x in 1..3 loop
  insert into gf_private.evidence_units(person_pseudonym,source_kind,signal_type,signal_value,context) values(case when x=1 then p when x=2 then p2 else null end,'test','help_effect','HELPED_NOW',jsonb_build_object('help_id',target)) returning evidence_unit_id into ev;evs:=array_append(evs,ev);
 end loop;
 -- NULL witness cannot count: two lives are insufficient.
 policy:=gf_private.create_policy_version('cultivation_selection',jsonb_build_object('help_priority',jsonb_build_object(target::text,0.1)),evs,'cf-test-'||u,'Una hipótesis situada, no causal ni universal.','transactional-test');
 execution:=gf_private.activate_policy_version(policy,'transactional-test');
 assert gf_private.cultivation_collective_priority(target)=0,'insufficient evidence changed ordering';
 select claim_id into claim from gf_private.knowledge_claims where claim_key='cf-test-'||u;
 select evidence_unit_id into ev from gf_private.evidence_units where evidence_unit_id=any(evs) and person_pseudonym is null;
 -- Third synthetic person, isolated and rolled back.
 insert into auth.users(id,aud,role,email) values(gen_random_uuid(),'authenticated','authenticated','cf-third-'||u||'@example.invalid') returning id into u2;
 insert into gf_core.persons(auth_user_id) values(u2) returning person_id into p2;
 insert into gf_core.privacy_preferences(person_id,evidence_use_allowed) values(p2,true);
 update gf_private.evidence_units set person_pseudonym=p2 where evidence_unit_id=ev;
 assert gf_private.cultivation_collective_priority(target)=0.1,'sufficient admitted policy did not change future ordering';
 ordered:=public.lumen_faro_constellation(learning_faro,1,0,'es-AR');assert ordered->'items'->0->>'help_id'=target::text,'actual future composition did not change';
 update gf_private.claim_evidence set relation='contradicts' where claim_id=claim and evidence_unit_id=ev;
 assert gf_private.cultivation_collective_priority(target)=0,'refutation did not stop ordering change';
 ordered:=public.lumen_faro_constellation(learning_faro,1,0,'es-AR');assert ordered->'items'->0->>'help_id'=baseline::text,'refutation did not restore actual order';
 perform gf_private.rollback_policy_execution(execution,'transactional-test');
 assert gf_private.cultivation_collective_priority(target)=0,'policy rollback did not restore baseline';
 s:=public.lumen_source_begin_experience(target,'es-AR','es',gen_random_uuid());perform public.lumen_s1_record_outcome((s->>'episode_id')::uuid,'helped',true,gen_random_uuid());
 ordered:=public.lumen_faro_constellation(learning_faro,1,0,'es-AR');assert ordered->'items'->0->>'help_id'=target::text,'individual feedback did not change future composition';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 perform public.lumen_privacy_forget_personal_memory(true);
 assert public.lumen_s2_list_sanctuary()='[]';assert public.lumen_recurring_practice_snapshot()='[]';
 assert not has_function_privilege('anon','public.lumen_faro_composition_save(uuid,integer,jsonb,uuid,integer,integer)','execute');
 assert not has_function_privilege('authenticated','gf_private.cultivation_collective_priority(uuid)','execute');
end $$;
select 'PASS CF04–08: conservation, immutable history, order, restoration, ownership, export/forget, recurrence consent/pause/revoke, separated evidence, insufficient evidence, refutation and rollback; all fixtures reverted' result;
rollback;
