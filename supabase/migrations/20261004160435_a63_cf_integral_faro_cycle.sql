-- A63 / V58 §22.12. G98: extend existing Sanctuary, followups and episodes.
-- No new organism/table; immutable version snapshots contain references, not works.
alter table gf_private.sanctuary_entries add column if not exists composition jsonb;
alter table gf_core.followups add column if not exists recurrence jsonb;
alter table gf_core.accompaniment_episodes add column if not exists cultivation_context jsonb;

create or replace function public.lumen_faro_composition_save(p_trajectory_id uuid,p_agreement_version integer,p_items jsonb,p_entry_id uuid default null,p_expected_version integer default 0,p_restore_version integer default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();a jsonb;old gf_private.sanctuary_entries%rowtype;v_snapshot jsonb;v_refs jsonb:='[]';r jsonb;h gf_core.help_possibilities%rowtype;v_version integer;v_entry uuid;v_payload jsonb;
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then raise exception 'memory consent required' using errcode='42501';end if;
 a:=public.lumen_faro_agreement_snapshot(p_trajectory_id);
 if a->>'state'<>'validated' or (a->>'version')::integer is distinct from p_agreement_version then raise exception 'validated agreement required' using errcode='40001';end if;
 if p_entry_id is not null then
  select * into old from gf_private.sanctuary_entries where entry_id=p_entry_id and person_id=v_person for update;
  if not found or old.composition is null or old.composition->>'trajectory_id'<>p_trajectory_id::text then raise exception 'composition unavailable' using errcode='42501';end if;
 end if;
 v_version:=coalesce((old.composition->>'version')::integer,0);
 if v_version<>p_expected_version then raise exception 'composition changed' using errcode='40001';end if;
 if p_restore_version is not null then
  select x into v_snapshot from jsonb_array_elements(old.composition->'versions') x where (x->>'version')::integer=p_restore_version;
  if v_snapshot is null then raise exception 'version unavailable' using errcode='22023';end if;
  p_items:=v_snapshot->'items';
 end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)>100 or octet_length(p_items::text)>100000 then raise exception 'invalid references' using errcode='22023';end if;
 for r in select x from jsonb_array_elements(p_items) x loop
  if nullif(r->>'help_id','') is not null then
   select * into h from gf_core.help_possibilities where help_id=(r->>'help_id')::uuid;
   if not found then raise exception 'source reference unavailable' using errcode='22023';end if;
   -- Historical unavailable references may survive restore; new additions must be active.
   if h.lifecycle not in('active','active_limited') and not exists(select 1 from jsonb_array_elements(coalesce(old.composition->'versions'->-1->'items','[]')) x where x->>'help_id'=h.help_id::text) then raise exception 'source unavailable' using errcode='22023';end if;
   if v_refs @> jsonb_build_array(jsonb_build_object('help_id',h.help_id)) then continue;end if;
   v_refs:=v_refs||jsonb_build_array(jsonb_build_object('help_id',h.help_id,'help_version_id',(select help_version_id from gf_core.help_versions where help_id=h.help_id and version=h.current_version),'origin',case when r->>'origin' in('fuente','tejido','propio','santuario') then r->>'origin' else 'fuente' end,'reason',left(coalesce(r->>'reason','Elegida por vos.'),700)));
  elsif nullif(r->>'entry_id','') is not null then
   if not exists(select 1 from gf_private.sanctuary_entries where entry_id=(r->>'entry_id')::uuid and person_id=v_person and composition is null) then raise exception 'private reference unavailable' using errcode='42501';end if;
   if v_refs @> jsonb_build_array(jsonb_build_object('entry_id',r->>'entry_id')) then continue;end if;
   v_refs:=v_refs||jsonb_build_array(jsonb_build_object('entry_id',r->>'entry_id','origin','santuario','reason','Elegida por vos.'));
  else raise exception 'invalid reference' using errcode='22023';end if;
 end loop;
 v_snapshot:=jsonb_build_object('version',v_version+1,'saved_at',now(),'agreement',case when p_restore_version is null then a-'history' else v_snapshot->'agreement' end,'items',v_refs,'restored_from',p_restore_version);
 v_payload:=jsonb_build_object('trajectory_id',p_trajectory_id,'version',v_version+1,'versions',coalesce(old.composition->'versions','[]')||jsonb_build_array(v_snapshot));
 if old.entry_id is null then
  insert into gf_private.sanctuary_entries(person_id,entry_kind,title,content_text,composition) values(v_person,'treasure',left(a->>'faro_text',200),'Composición que elegiste conservar. Guardar no significa hacer propio.',v_payload) returning entry_id into v_entry;
 else
  update gf_private.sanctuary_entries set composition=v_payload,title=left(a->>'faro_text',200),updated_at=now() where entry_id=old.entry_id returning entry_id into v_entry;
 end if;
 perform gf_private.emit_person_event('FaroCompositionConserved','sanctuary_entry',v_entry,v_person,gen_random_uuid(),'cultivation.cf.v1',jsonb_build_object('version',v_version+1,'agreement_version',p_agreement_version,'reference_count',jsonb_array_length(v_refs),'restored_from',p_restore_version));
 return jsonb_build_object('entry_id',v_entry,'composition',v_payload);
end $$;
revoke all on function public.lumen_faro_composition_save(uuid,integer,jsonb,uuid,integer,integer) from public,anon;
grant execute on function public.lumen_faro_composition_save(uuid,integer,jsonb,uuid,integer,integer) to authenticated;

create or replace function public.lumen_cultivation_bind_experience(p_episode_id uuid,p_trajectory_id uuid,p_entry_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=gf_core.current_person_id();a jsonb;c jsonb;
begin
 if p is null or not exists(select 1 from gf_core.accompaniment_episodes where episode_id=p_episode_id and person_id=p) then raise exception 'experience unavailable' using errcode='42501';end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=p),false) then raise exception 'memory consent required' using errcode='42501';end if;
 a:=public.lumen_faro_agreement_snapshot(p_trajectory_id);if a->>'state'<>'validated' then raise exception 'agreement required' using errcode='40001';end if;
 if p_entry_id is not null then select composition into c from gf_private.sanctuary_entries where entry_id=p_entry_id and person_id=p and composition->>'trajectory_id'=p_trajectory_id::text;if c is null then raise exception 'composition unavailable' using errcode='42501';end if;end if;
 update gf_core.accompaniment_episodes set cultivation_context=jsonb_build_object('trajectory_id',p_trajectory_id,'agreement_version',a->'version','composition_entry_id',p_entry_id,'composition_version',c->'version') where episode_id=p_episode_id and person_id=p;
 perform gf_private.emit_person_event('CultivationExperienceChosen','episode',p_episode_id,p,gen_random_uuid(),'cultivation.cf.v1',jsonb_build_object('trajectory_id',p_trajectory_id,'composition_entry_id',p_entry_id));
 return jsonb_build_object('state','success');
end $$;
revoke all on function public.lumen_cultivation_bind_experience(uuid,uuid,uuid) from public,anon;
grant execute on function public.lumen_cultivation_bind_experience(uuid,uuid,uuid) to authenticated;

create or replace function public.lumen_recurring_practice_set(p_help_id uuid,p_days integer,p_local_time text,p_timezone text,p_conditions text,p_trajectory_id uuid default null,p_entry_id uuid default null,p_followup_id uuid default null,p_action text default 'schedule')
returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=gf_core.current_person_id();f gf_core.followups%rowtype;next_time timestamptz;meta jsonb;
begin
 if p is null then raise exception 'authentication required' using errcode='28000';end if;
 if p_followup_id is not null then select * into f from gf_core.followups where followup_id=p_followup_id and person_id=p for update;if not found or f.recurrence is null then raise exception 'practice unavailable' using errcode='42501';end if;end if;
 if p_action in('pause','stop','postpone') then
  if f.followup_id is null then raise exception 'practice required' using errcode='22023';end if;
  update gf_core.followups set status=case when p_action='postpone' then 'scheduled' else 'cancelled' end,due_at=case when p_action='postpone' then greatest(due_at,now())+interval '1 day' else due_at end,recurrence=recurrence||jsonb_build_object('paused',p_action='pause','revoked',p_action='stop'),updated_at=now() where followup_id=f.followup_id returning * into f;
 else
  if p_action not in('schedule','resume') or p_days not between 1 and 90 or p_local_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or not exists(select 1 from pg_timezone_names where name=p_timezone) or char_length(coalesce(p_conditions,''))>700 then raise exception 'invalid rhythm' using errcode='22023';end if;
  if not coalesce((select memory_allowed and proactive_allowed from gf_core.privacy_preferences where person_id=p),false) or coalesce((select custody_blocked from gf_core.proactivity_settings where person_id=p),false) then raise exception 'consent required' using errcode='42501';end if;
  if p_trajectory_id is not null and not exists(select 1 from gf_core.trajectories where trajectory_id=p_trajectory_id and person_id=p and status='active') then raise exception 'active Faro unavailable' using errcode='42501';end if;
  if p_entry_id is not null and not exists(select 1 from gf_private.sanctuary_entries where entry_id=p_entry_id and person_id=p and composition->>'trajectory_id'=p_trajectory_id::text) then raise exception 'composition unavailable' using errcode='42501';end if;
  if not exists(select 1 from gf_core.help_selections where person_id=p and help_id=p_help_id and action='selected') or not exists(select 1 from gf_core.help_possibilities where help_id=p_help_id and lifecycle in('active','active_limited')) then raise exception 'choose and experience this resource first' using errcode='42501';end if;
  if (select signal_kind from gf_core.outcomes_feedback o join gf_core.help_selections s on s.selection_id=o.selection_id where o.person_id=p and s.help_id=p_help_id order by o.created_at desc limit 1) in('STOPPED_HELPING','NO_REMINDER_NEEDED','NOT_HELPED_NOW') then raise exception 'this resource is withdrawn' using errcode='42501';end if;
  next_time:=(((now() at time zone p_timezone)::date+p_days)+p_local_time::time) at time zone p_timezone;
  meta:=jsonb_build_object('days',p_days,'local_time',p_local_time,'timezone',p_timezone,'conditions',coalesce(p_conditions,''),'composition_entry_id',p_entry_id,'paused',false,'revoked',false,'explicitly_accepted_at',now());
  if f.followup_id is null then
   insert into gf_core.followups(person_id,reason_code,related_trajectory_id,related_help_id,due_at,channel,status,recurrence) values(p,'practice_return',p_trajectory_id,p_help_id,next_time,'in_app','scheduled',meta) returning * into f;
  else
   update gf_core.followups set related_help_id=p_help_id,related_trajectory_id=p_trajectory_id,due_at=next_time,status='scheduled',recurrence=meta,updated_at=now() where followup_id=f.followup_id returning * into f;
  end if;
 end if;
 perform gf_private.emit_person_event('RecurringPracticeChanged','followup',f.followup_id,p,gen_random_uuid(),'cultivation.cf.v1',jsonb_build_object('action',p_action,'channel','in_app','due_at',f.due_at));
 return jsonb_build_object('followup_id',f.followup_id,'status',f.status,'due_at',f.due_at,'recurrence',f.recurrence);
end $$;
revoke all on function public.lumen_recurring_practice_set(uuid,integer,text,text,text,uuid,uuid,uuid,text) from public,anon;
grant execute on function public.lumen_recurring_practice_set(uuid,integer,text,text,text,uuid,uuid,uuid,text) to authenticated;

create or replace function public.lumen_recurring_practice_snapshot()
returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=gf_core.current_person_id();out jsonb;
begin
 if p is null then raise exception 'authentication required' using errcode='28000';end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=p),false) then return '[]'::jsonb;end if;
 select coalesce(jsonb_agg(jsonb_build_object('followup_id',f.followup_id,'help_id',f.related_help_id,'trajectory_id',f.related_trajectory_id,'due_at',f.due_at,'status',f.status,'recurrence',f.recurrence,'reminder_allowed',coalesce(pr.proactive_allowed,false) and not coalesce(ps.custody_blocked,false),'relevant',f.status='scheduled' and coalesce(pr.proactive_allowed,false) and not coalesce(ps.custody_blocked,false) and (f.related_trajectory_id is null or t.status='active') and f.due_at<=now() and h.lifecycle in('active','active_limited') and coalesce((select signal_kind from gf_core.outcomes_feedback o join gf_core.help_selections s on s.selection_id=o.selection_id where o.person_id=p and s.help_id=f.related_help_id order by o.created_at desc limit 1),'') not in('STOPPED_HELPING','NO_REMINDER_NEEDED','NOT_HELPED_NOW'),'title',l.title) order by f.due_at),'[]') into out
 from gf_core.followups f left join gf_core.privacy_preferences pr on pr.person_id=p left join gf_core.proactivity_settings ps on ps.person_id=p left join gf_core.trajectories t on t.trajectory_id=f.related_trajectory_id left join gf_core.help_possibilities h on h.help_id=f.related_help_id left join gf_core.help_versions v on v.help_id=h.help_id and v.version=h.current_version left join lateral(select title from gf_core.help_localizations where help_version_id=v.help_version_id order by (locale='es-AR') desc limit 1) l on true where f.person_id=p and f.recurrence is not null and not coalesce((f.recurrence->>'revoked')::boolean,false);
 return out;
end $$;
revoke all on function public.lumen_recurring_practice_snapshot() from public,anon;
grant execute on function public.lumen_recurring_practice_snapshot() to authenticated;

-- Collective learning uses the existing governed policy lifecycle (proposal, activation,
-- refutation/withdrawal and rollback). It can only reorder already eligible pieces.
create or replace function gf_private.cultivation_collective_priority(p_help_id uuid)
returns numeric language sql stable set search_path='' as $$
 select coalesce((select least(0.1,greatest(0,(rp.config->'help_priority'->>p_help_id::text)::numeric))
 from gf_private.runtime_policies rp join gf_private.policy_versions pv on pv.policy_version_id=rp.policy_version_id and pv.status='active'
 join gf_private.knowledge_claims k on k.claim_id=(pv.evidence_summary->>'claim_id')::uuid
 where rp.policy_key='cultivation_selection' and k.status<>'rejected' and k.valid_to is null
 and not coalesce((k.uncertainty->>'evidence_withdrawn')::boolean,false)
 and jsonb_typeof(k.provenance)='object' and k.provenance ? 'created_by'
 and (select count(distinct e.person_pseudonym) from gf_private.claim_evidence ce join gf_private.evidence_units e on e.evidence_unit_id=ce.evidence_unit_id join gf_core.privacy_preferences pr on pr.person_id=e.person_pseudonym and pr.evidence_use_allowed where ce.claim_id=k.claim_id and e.learning_eligible and ce.relation='supports' and e.context->>'help_id'=p_help_id::text)>=3
 and not exists(select 1 from gf_private.claim_evidence ce join gf_private.evidence_units e on e.evidence_unit_id=ce.evidence_unit_id where ce.claim_id=k.claim_id and ce.relation='contradicts' and e.learning_eligible)
 limit 1),0);
$$;
revoke all on function gf_private.cultivation_collective_priority(uuid) from public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.lumen_s2_list_sanctuary()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare v_uid uuid:=auth.uid();v_person uuid;v_result jsonb; begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then return jsonb_build_array(); end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then return '[]'::jsonb;end if;
 select coalesce(jsonb_agg(jsonb_build_object('entry_id',s.entry_id,'entry_kind',s.entry_kind,'title',s.title,'content',s.content_text,'source_help_id',s.source_help_id,'created_at',s.created_at,'composition',s.composition) order by s.created_at desc),'[]'::jsonb) into v_result from gf_private.sanctuary_entries s where s.person_id=v_person;
 return v_result;
end $function$

;

CREATE OR REPLACE FUNCTION public.lumen_s2_export_sanctuary()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid:=auth.uid();v_person uuid;v_entries jsonb;v_trajectories jsonb;v_repertoire jsonb;v_agreements jsonb;
begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then raise exception 'person unavailable' using errcode='P0002';end if;
 select coalesce(jsonb_agg(jsonb_build_object('entry_id',entry_id,'entry_kind',entry_kind,'title',title,'content',content_text,'source_help_id',source_help_id,'created_at',created_at,'updated_at',updated_at,'composition',composition) order by created_at),'[]'::jsonb) into v_entries from gf_private.sanctuary_entries where person_id=v_person;
 select coalesce(jsonb_agg(jsonb_build_object('trajectory_id',trajectory_id,'faro_text',faro_text,'status',status,'created_at',created_at,'updated_at',updated_at) order by created_at),'[]'::jsonb) into v_trajectories from gf_core.trajectories where person_id=v_person;
 select coalesce(jsonb_agg(jsonb_build_object('repertoire_id',repertoire_id,'help_id',help_id,'source_outcome_id',source_outcome_id,'status',status,'times_reused',times_reused,'created_at',created_at,'updated_at',updated_at) order by created_at),'[]'::jsonb) into v_repertoire from gf_core.personal_repertoire where person_id=v_person;
 select coalesce(jsonb_agg(jsonb_build_object('trajectory_id',a.trajectory_id,'version',a.version,'faro_text',a.faro_text,'area_keys',a.area_keys,'validated_at',a.validated_at,'items',(select coalesce(jsonb_agg(jsonb_build_object('identity_id',i.identity_id,'concept_id',i.concept_id,'label',i.label,'definition',i.definition,'contextual_meaning',i.contextual_meaning,'origin',i.origin,'status',i.status) order by i.position),'[]'::jsonb) from gf_private.faro_agreement_items i where i.agreement_id=a.agreement_id)) order by a.trajectory_id,a.version),'[]'::jsonb) into v_agreements from gf_private.faro_agreement_versions a where a.person_id=v_person;
 return jsonb_build_object('export_version','sanctuary.v1','generated_at',now(),'sanctuary_entries',v_entries,'trajectories',v_trajectories,'personal_repertoire',v_repertoire,'faro_potential_agreements',v_agreements,'recurring_practices',(select coalesce(jsonb_agg(to_jsonb(f)-'person_id'),'[]') from gf_core.followups f where f.person_id=v_person and recurrence is not null));
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
 select coalesce(jsonb_agg(x.item order by x.is_own desc,x.is_saved desc,x.personal_helped desc,x.collective_priority desc,x.title),'[]'::jsonb) into v_items from (
  select distinct coalesce((select case when o.effect='helped' then 1 else 0 end from gf_core.outcomes_feedback o join gf_core.help_selections sel on sel.selection_id=o.selection_id where o.person_id=v_person and sel.help_id=(h->>'help_id')::uuid order by o.created_at desc limit 1),0) personal_helped, gf_private.cultivation_collective_priority((h->>'help_id')::uuid) collective_priority,h->>'help_id' help_id,h->>'title' title,
   exists(select 1 from gf_core.personal_repertoire r where r.person_id=v_person and r.help_id=(h->>'help_id')::uuid and r.status='active' and r.user_confirmed) is_own,
   exists(select 1 from gf_private.sanctuary_entries s where s.person_id=v_person and s.source_help_id=(h->>'help_id')::uuid) is_saved,
   h||jsonb_build_object('context_origin',case when exists(select 1 from gf_core.personal_repertoire r where r.person_id=v_person and r.help_id=(h->>'help_id')::uuid and r.status='active' and r.user_confirmed) then 'propio' when exists(select 1 from gf_private.sanctuary_entries s where s.person_id=v_person and s.source_help_id=(h->>'help_id')::uuid) then 'santuario' when h->>'help_type' in('conversation','professional_support','institutional_service') then 'tejido' else 'fuente' end,'context_reason','Relación editorial admitida con lo que acordaste nutrir para este Faro.') item
  from jsonb_array_elements(public.lumen_source_discover(null,null,null,p_locale,100)) h
  where exists(select 1 from gf_private.faro_agreement_items i join gf_core.potential_concepts c on c.editorial_status='reviewed' and (c.concept_id=i.concept_id or (i.concept_id is null and nullif(trim(c.scope_note),'') is not null and exists(select 1 from jsonb_array_elements_text(case when jsonb_typeof(c.provenance->'operational_expressions')='array' then c.provenance->'operational_expressions' else '[]'::jsonb end) e(label) where lower(trim(e.label))=lower(trim(i.label))))) join gf_core.help_potential_links l on l.concept_id=c.concept_id and l.editorial_status='reviewed' join gf_core.help_versions hv on hv.help_version_id=l.help_version_id join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version where i.agreement_id=v_id and i.status<>'withdrawn' and hp.help_id=(h->>'help_id')::uuid)
   and (p_available_minutes=0 or (h->>'duration_minutes')::integer<=p_available_minutes)
   and not exists(select 1 from gf_core.outcomes_feedback o join gf_core.help_selections s on s.selection_id=o.selection_id where o.person_id=v_person and s.help_id=(h->>'help_id')::uuid and o.signal_kind in('STOPPED_HELPING','NOT_HELPED_NOW') and o.created_at=(select max(o2.created_at) from gf_core.outcomes_feedback o2 join gf_core.help_selections s2 on s2.selection_id=o2.selection_id where o2.person_id=v_person and s2.help_id=s.help_id))
  order by is_own desc,is_saved desc,personal_helped desc,collective_priority desc,title
 ) x;
 perform gf_private.emit_person_event('FaroConstellationExposed','trajectory',p_trajectory_id,v_person,v_trace,'faro.agreement.v1',jsonb_build_object('agreement_version',p_expected_version,'item_count',jsonb_array_length(v_items),'exposed_help_ids',(select coalesce(jsonb_agg(x->>'help_id'),'[]') from jsonb_array_elements(v_items) x),'learning_policy_version',(select version from gf_private.runtime_policies where policy_key='cultivation_selection')));
 return jsonb_build_object('state',case when jsonb_array_length(v_items)>0 then 'success' else 'no_match' end,'items',v_items,'agreement_version',p_expected_version,'message',case when jsonb_array_length(v_items)=0 then 'Para lo que acordamos nutrir, todavía no tengo una relación de Fuente suficientemente revisada. Podés recibir una guía puntual o explorar por tu cuenta.' else null end);
end $function$

;

CREATE OR REPLACE FUNCTION gf_private.capture_outcome_evidence()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare v_trace uuid:=gen_random_uuid();v_run gf_core.decision_runs%rowtype;v_selection gf_core.help_selections%rowtype;v_eligible jsonb:='[]'::jsonb;v_exposed jsonb:='[]'::jsonb;v_area_keys text[]:='{}';v_capacity_keys text[]:='{}';v_taxonomy text;v_signal_type text;begin if coalesce((select evidence_use_allowed from gf_core.privacy_preferences where person_id=new.person_id),false) then select * into v_selection from gf_core.help_selections where selection_id=new.selection_id and person_id=new.person_id;select * into v_run from gf_core.decision_runs where decision_run_id=v_selection.decision_run_id;select coalesce(jsonb_agg(jsonb_build_object('help_id',dc.help_id,'help_version_id',dc.help_version_id,'eligibility_status',dc.eligibility_status,'reason_key',dc.reason_key,'priority_hint',dc.priority_hint) order by dc.priority_hint,dc.created_at),'[]'::jsonb) into v_eligible from gf_core.decision_candidates dc where dc.decision_run_id=v_run.decision_run_id;select coalesce(jsonb_agg(jsonb_build_object('help_id',ce.help_id,'help_version_id',ce.help_version_id,'display_rank',ce.display_rank) order by ce.display_rank),'[]'::jsonb) into v_exposed from gf_core.candidate_exposures ce where ce.decision_run_id=v_run.decision_run_id;select mi.area_keys,mi.capacity_keys,mi.taxonomy_version into v_area_keys,v_capacity_keys,v_taxonomy from gf_core.accompaniment_episodes ae left join lateral(select x.area_keys,x.capacity_keys,x.taxonomy_version from gf_core.moment_interpretations x where x.moment_id=ae.moment_id and x.person_id=new.person_id order by x.created_at desc limit 1) mi on true where ae.episode_id=new.episode_id and ae.person_id=new.person_id;if v_taxonomy is null then v_taxonomy:='life-taxonomy.v1';v_capacity_keys:=array(select jsonb_array_elements_text(coalesce(v_run.continuity_context->'capability_keys','[]'::jsonb)));end if;v_signal_type:=case when new.signal_kind in('HELPED_NOW','NOT_HELPED_NOW','UNKNOWN') then 'help_effect' else 'longitudinal_signal' end;insert into gf_private.evidence_units(person_pseudonym,source_kind,source_id,signal_type,signal_value,context,contract_version) values(new.person_id,'outcome',new.outcome_id,v_signal_type,new.signal_kind,jsonb_build_object('effect',new.effect,'signal_kind',new.signal_kind,'signal_context',jsonb_build_object('longitudinal',new.signal_context->'longitudinal'),'selection_id',new.selection_id,'help_id',v_selection.help_id,'help_version_id',v_selection.help_version_id,'applied',new.applied,'episode_id',new.episode_id,'decision_run_id',v_run.decision_run_id,'decision_kind',v_run.decision_kind,'policy_version',v_run.policy_version,'interpreter_version',v_run.interpreter_version,'coverage_version',v_run.coverage_version,'coverage_state',v_run.coverage_state,'decision_reason_key',v_run.decision_reason_key,'cultivation_context',(select jsonb_build_object('agreement_version',cultivation_context->'agreement_version','composition_version',cultivation_context->'composition_version') from gf_core.accompaniment_episodes where episode_id=new.episode_id),'continuity_context',jsonb_build_object('decision_kind',v_run.decision_kind),'taxonomy_version',v_taxonomy,'area_keys',to_jsonb(coalesce(v_area_keys,'{}'::text[])),'capacity_keys',to_jsonb(coalesce(v_capacity_keys,'{}'::text[])),'eligible_candidates',v_eligible,'exposed_candidates',v_exposed),'evidence.v53.1');update gf_core.help_applicability ha set evidence_count=ha.evidence_count+1,last_evidence_at=now(),updated_at=now() where ha.help_version_id=v_selection.help_version_id and ha.taxonomy_version=v_taxonomy and ha.area_key=any(coalesce(v_area_keys,'{}'::text[])) and ha.capacity_key=any(coalesce(v_capacity_keys,'{}'::text[]));insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance) values('EvidenceUnitCaptured','evidence_unit',new.outcome_id,'system','evidence-capture',new.person_id,v_trace,'s4.v53.1',jsonb_build_object('source_kind','outcome','signal_type',v_signal_type,'signal_kind',new.signal_kind,'effect',new.effect,'selection_id',new.selection_id,'help_id',v_selection.help_id,'help_version_id',v_selection.help_version_id,'decision_run_id',v_run.decision_run_id,'decision_kind',v_run.decision_kind,'taxonomy_version',v_taxonomy),'{}'::jsonb);end if;return new;end $function$

;

CREATE OR REPLACE FUNCTION public.lumen_s2_record_longitudinal_signal(p_episode_id uuid, p_signal_kind text, p_trace_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid:=auth.uid();
  v_person uuid;
  v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());
  v_signal text:=upper(trim(coalesce(p_signal_kind,'')));
  v_selection gf_core.help_selections%rowtype;
  v_effect text;
  v_outcome uuid;
  v_rep uuid;
  v_withdraw_run uuid;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
  select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
  if v_person is null then raise exception 'person unavailable' using errcode='P0002'; end if;
  if v_signal not in('HELPED_NOW','REUSED','REPEATED','VARIED','APPLIED_OTHER_CONTEXT','ADAPTED','RECOGNIZED_AS_OWN','NO_REMINDER_NEEDED','STOPPED_HELPING','UNKNOWN') then raise exception 'invalid longitudinal signal' using errcode='22023'; end if;
  select * into v_selection from gf_core.help_selections where episode_id=p_episode_id and person_id=v_person and action='selected' order by created_at desc limit 1;
  if not found then raise exception 'selected help unavailable' using errcode='42501'; end if;
  if v_signal<>'UNKNOWN' and not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then raise exception 'memory consent required' using errcode='42501';end if;
  if v_signal='RECOGNIZED_AS_OWN' then perform public.lumen_s2_add_repertoire(v_selection.help_id,v_trace);end if;
  v_effect:=case when v_signal='STOPPED_HELPING' then 'not_helped' when v_signal='UNKNOWN' then 'unsure' else 'helped' end;
  perform set_config('app.trace_id',v_trace::text,true);
  insert into gf_core.outcomes_feedback(episode_id,person_id,selection_id,effect,applied,signal_kind,signal_context)
  values(p_episode_id,v_person,v_selection.selection_id,v_effect,true,v_signal,jsonb_build_object('longitudinal',true)) returning outcome_id into v_outcome;
  update gf_core.accompaniment_episodes set status='completed',completed_at=now() where episode_id=p_episode_id and person_id=v_person;
  select repertoire_id into v_rep from gf_core.personal_repertoire where person_id=v_person and help_id=v_selection.help_id and status='active';
  if v_rep is not null then
    update gf_core.personal_repertoire
       set last_used_at=now(),updated_at=now(),user_confirmed=case when v_signal='RECOGNIZED_AS_OWN' then true else user_confirmed end,
           status=case when v_signal='STOPPED_HELPING' then 'retired' else status end
     where repertoire_id=v_rep;
  end if;
  if v_signal in('STOPPED_HELPING','NO_REMINDER_NEEDED') then update gf_core.followups set status='cancelled',recurrence=recurrence||jsonb_build_object('revoked',true),updated_at=now() where person_id=v_person and related_help_id=v_selection.help_id and recurrence is not null;end if;
  if v_signal='NO_REMINDER_NEEDED' then
    update gf_core.followups set status='cancelled',cancelled_at=now(),updated_at=now() where person_id=v_person and related_help_id=v_selection.help_id and status in('scheduled','due');
    insert into gf_core.decision_runs(episode_id,person_id,policy_version,interpreter_version,coverage_version,safety_state,coverage_state,eligible_count,decision_reason_key,continuity_context,decision_kind)
    values(p_episode_id,v_person,'decision.v53.1','continuity.autonomy.v1','coverage.eval.v1','clear','covered',0,'own_resource_sufficient_no_reminder',jsonb_build_object('signal_kind',v_signal,'repertoire_id',v_rep,'help_id',v_selection.help_id),'WITHDRAW') returning decision_run_id into v_withdraw_run;
    perform gf_private.emit_person_event('LumiWithdrew','repertoire',coalesce(v_rep,v_selection.help_id),v_person,v_trace,'s2.v53.1',jsonb_build_object('signal_kind',v_signal,'episode_id',p_episode_id,'decision_run_id',v_withdraw_run,'help_id',v_selection.help_id));
  end if;
  perform gf_private.emit_person_event('LongitudinalSignalRecorded','outcome',v_outcome,v_person,v_trace,'s2.v53.1',jsonb_build_object('signal_kind',v_signal,'effect',v_effect,'episode_id',p_episode_id,'help_id',v_selection.help_id,'repertoire_id',v_rep));
  return jsonb_build_object('outcome_id',v_outcome,'episode_id',p_episode_id,'signal_kind',v_signal,'effect',v_effect,'decision_kind',case when v_signal='NO_REMINDER_NEEDED' then 'WITHDRAW' else null end,'withdraw_decision_run_id',v_withdraw_run,'semantic_key',case when v_signal='NO_REMINDER_NEEDED' then 'continuity.you_have_this' when v_signal='RECOGNIZED_AS_OWN' then 'continuity.becoming_yours' when v_signal='STOPPED_HELPING' then 'continuity.release' else 'continuity.thank_and_learn' end,'trace_id',v_trace);
end
$function$

;

CREATE OR REPLACE FUNCTION public.lumen_s1_record_outcome(p_episode_id uuid, p_effect text, p_applied boolean, p_trace_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare v_person uuid:=gf_core.current_person_id();v_effect text:=lower(trim(p_effect));v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_selection gf_core.help_selections%rowtype;v_signal text;v_rep uuid;begin if v_person is null then raise exception 'authentication required' using errcode='28000';end if;if v_effect not in('helped','not_helped','unsure') then raise exception 'invalid effect' using errcode='22023';end if;select * into v_selection from gf_core.help_selections where episode_id=p_episode_id and person_id=v_person and action='selected' order by created_at desc limit 1;if not found then raise exception 'selected help unavailable' using errcode='42501';end if;select repertoire_id into v_rep from gf_core.personal_repertoire where person_id=v_person and help_id=v_selection.help_id and status='active' and user_confirmed=true;v_signal:=case when v_effect='helped' and v_rep is not null then 'REUSED' when v_effect='helped' then 'HELPED_NOW' when v_effect='not_helped' then 'NOT_HELPED_NOW' else 'UNKNOWN' end;perform set_config('app.trace_id',v_trace::text,true);insert into gf_core.outcomes_feedback(episode_id,person_id,selection_id,effect,applied,signal_kind,signal_context) values(p_episode_id,v_person,v_selection.selection_id,v_effect,p_applied,v_signal,case when v_rep is not null then jsonb_build_object('repertoire_id',v_rep,'natural_return',true) else '{}'::jsonb end);if v_rep is not null then update gf_core.personal_repertoire set times_reused=times_reused+1,last_used_at=now(),updated_at=now() where repertoire_id=v_rep;end if;update gf_core.accompaniment_episodes set status='completed',completed_at=now() where episode_id=p_episode_id and person_id=v_person;if v_signal='REUSED' then perform gf_private.emit_person_event('RepertoireReused','repertoire',v_rep,v_person,v_trace,'s2.v53.1',jsonb_build_object('episode_id',p_episode_id,'help_id',v_selection.help_id,'selection_id',v_selection.selection_id,'natural_return',true));end if;update gf_core.followups set status=case when v_effect='not_helped' then 'cancelled' else 'scheduled' end,recurrence=recurrence||jsonb_build_object('paused',v_effect='not_helped'),due_at=(((now() at time zone (recurrence->>'timezone'))::date+(recurrence->>'days')::integer)+(recurrence->>'local_time')::time) at time zone (recurrence->>'timezone'),updated_at=now() where person_id=v_person and related_help_id=v_selection.help_id and recurrence is not null and status in('scheduled','due');
 return jsonb_build_object('selection_id',v_selection.selection_id,'episode_id',p_episode_id,'effect',v_effect,'signal_kind',v_signal,'applied',p_applied,'repertoire_id',v_rep,'trace_id',v_trace,'semantic_key',case when v_signal='REUSED' then 'outcome.repertoire_helped_again' else 'outcome.thank_and_release' end);end $function$

;
