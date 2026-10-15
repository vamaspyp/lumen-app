-- A63 CF06: one effect plus independently explicit longitudinal signals.
drop index gf_core.outcomes_feedback_one_per_selection_idx;
create unique index outcomes_feedback_one_per_selection_idx on gf_core.outcomes_feedback(selection_id) where not coalesce((signal_context->>'longitudinal')::boolean,false);
create unique index outcomes_feedback_longitudinal_signal_idx on gf_core.outcomes_feedback(selection_id,signal_kind) where coalesce((signal_context->>'longitudinal')::boolean,false);
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
  values(p_episode_id,v_person,v_selection.selection_id,v_effect,true,v_signal,jsonb_build_object('longitudinal',true)) on conflict do nothing returning outcome_id into v_outcome;
 if v_outcome is null then select outcome_id into v_outcome from gf_core.outcomes_feedback where selection_id=v_selection.selection_id and signal_kind=v_signal and coalesce((signal_context->>'longitudinal')::boolean,false);return jsonb_build_object('outcome_id',v_outcome,'episode_id',p_episode_id,'signal_kind',v_signal,'state','already_recorded');end if;
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
$function$;
create or replace function public.lumen_recurring_practice_set(p_help_id uuid,p_days integer,p_local_time text,p_timezone text,p_conditions text,p_trajectory_id uuid default null,p_entry_id uuid default null,p_followup_id uuid default null,p_action text default 'schedule')
returns jsonb language plpgsql security definer set search_path='' as $$
declare p uuid:=gf_core.current_person_id();f gf_core.followups%rowtype;next_time timestamptz;meta jsonb;
begin
 if p is null then raise exception 'authentication required' using errcode='28000';end if;
 if p_followup_id is not null then select * into f from gf_core.followups where followup_id=p_followup_id and person_id=p for update;if not found or f.recurrence is null then raise exception 'practice unavailable' using errcode='42501';end if;end if;
 if p_followup_id is null and p_action='schedule' then select * into f from gf_core.followups where person_id=p and related_help_id=p_help_id and related_trajectory_id is not distinct from p_trajectory_id and recurrence is not null and not coalesce((recurrence->>'revoked')::boolean,false) order by created_at desc limit 1 for update;end if;
 if p_action in('pause','stop','postpone') then
  if f.followup_id is null then raise exception 'practice required' using errcode='22023';end if;
  update gf_core.followups set status=case when p_action='postpone' and not coalesce((f.recurrence->>'paused')::boolean,false) then 'scheduled' else 'cancelled' end,due_at=case when p_action='postpone' then greatest(due_at,now())+interval '1 day' else due_at end,recurrence=recurrence||jsonb_build_object('paused',p_action='pause' or (p_action='postpone' and coalesce((f.recurrence->>'paused')::boolean,false)),'revoked',p_action='stop'),updated_at=now() where followup_id=f.followup_id returning * into f;
 else
  if p_action not in('schedule','resume') or p_days not between 1 and 90 or p_local_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or not exists(select 1 from pg_timezone_names where name=p_timezone) or char_length(coalesce(p_conditions,''))>700 then raise exception 'invalid rhythm' using errcode='22023';end if;
  if not coalesce((select memory_allowed and proactive_allowed from gf_core.privacy_preferences where person_id=p),false) or coalesce((select custody_blocked from gf_core.proactivity_settings where person_id=p),false) then raise exception 'consent required' using errcode='42501';end if;
  if p_trajectory_id is not null and not exists(select 1 from gf_core.trajectories where trajectory_id=p_trajectory_id and person_id=p and status='active') then raise exception 'active Faro unavailable' using errcode='42501';end if;
  if p_entry_id is not null and not exists(select 1 from gf_private.sanctuary_entries where entry_id=p_entry_id and person_id=p and composition->>'trajectory_id'=p_trajectory_id::text) then raise exception 'composition unavailable' using errcode='42501';end if;
  if not exists(select 1 from gf_core.help_selections s join gf_core.accompaniment_episodes e on e.episode_id=s.episode_id where s.person_id=p and s.help_id=p_help_id and s.action='selected' and (e.status='completed' or coalesce((e.experience_position->>'finished')::boolean,false))) or not exists(select 1 from gf_core.help_possibilities where help_id=p_help_id and lifecycle in('active','active_limited')) then raise exception 'choose and experience this resource first' using errcode='42501';end if;
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
   v_refs:=v_refs||jsonb_build_array(jsonb_build_object('help_id',h.help_id,'help_version_id',case when p_restore_version is not null then (select help_version_id from gf_core.help_versions where help_id=h.help_id and help_version_id=(r->>'help_version_id')::uuid) else (select help_version_id from gf_core.help_versions where help_id=h.help_id and version=h.current_version) end,'origin',case when r->>'origin' in('fuente','tejido','propio','santuario') then r->>'origin' else 'fuente' end,'reason',left(coalesce(r->>'reason','Elegida por vos.'),700)));
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
create or replace function gf_private.cultivation_personal_priority(p_person uuid,p_help uuid)
returns integer language sql stable set search_path='' as $$
 select coalesce((select case when o.effect='helped' then 1 else 0 end from gf_core.outcomes_feedback o join gf_core.help_selections s on s.selection_id=o.selection_id where o.person_id=p_person and s.help_id=p_help order by o.created_at desc limit 1),0);
$$;
revoke all on function gf_private.cultivation_personal_priority(uuid,uuid) from public,anon,authenticated;
CREATE OR REPLACE FUNCTION public.lumen_s1_moment_constellation(p_episode_id uuid, p_locale text DEFAULT 'es-AR'::text, p_limit integer DEFAULT 12, p_trace_id uuid DEFAULT NULL::uuid, p_capacity_keys text[] DEFAULT NULL::text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_person uuid:=gf_core.current_person_id(); v_trace uuid:=coalesce(p_trace_id,gen_random_uuid()); v_run uuid; v_moment uuid; v_areas text[]; v_interp_caps text[]; v_reviewed_text text; v_caps text[]; v_primary uuid; v_rank integer; v_result jsonb:='[]'::jsonb; v_limit integer:=greatest(1,coalesce(p_limit,3)); v_memory boolean:=false; v_invalid integer; v_kind text:='NEW_HELP'; v_withdraw boolean:=false; v_event uuid; v_control uuid; r record;
begin
  if v_person is null then raise exception 'authentication required' using errcode='28000'; end if;
  select coalesce(memory_allowed,false) into v_memory from gf_core.privacy_preferences where person_id=v_person;
  select dr.decision_run_id,ae.moment_id,mi.area_keys,mi.capacity_keys into v_run,v_moment,v_areas,v_interp_caps
  from gf_core.accompaniment_episodes ae
  join gf_core.decision_runs dr on dr.episode_id=ae.episode_id and dr.person_id=v_person
  join gf_core.moment_interpretations mi on mi.moment_id=ae.moment_id and mi.person_id=v_person
  where ae.episode_id=p_episode_id and ae.person_id=v_person and dr.safety_state<>'blocked' 
  order by dr.created_at desc,mi.created_at desc limit 1;
  if v_run is null then return jsonb_build_object('episode_id',p_episode_id,'items','[]'::jsonb,'capacity_keys','[]'::jsonb,'area_keys','[]'::jsonb,'trace_id',v_trace); end if;
  select coalesce(mi.features->>'reviewed_understanding','') into v_reviewed_text from gf_core.moment_interpretations mi where mi.moment_id=v_moment and mi.person_id=v_person order by mi.created_at desc limit 1;
  v_caps:=case when p_capacity_keys is null or cardinality(p_capacity_keys)=0 then v_interp_caps else p_capacity_keys end;
  select count(*) into v_invalid from unnest(v_caps) cap where not exists(select 1 from gf_core.capacity_terms ct where ct.taxonomy_version='life-taxonomy.v1' and ct.capacity_key=cap and ct.status='active');
  if v_invalid>0 then raise exception 'invalid capacity' using errcode='22023'; end if;
  select array_agg(distinct x order by x) into v_caps from unnest(v_caps) x;
  v_caps:=coalesce(v_caps,v_interp_caps,'{}'::text[]);
  select help_id into v_primary from gf_core.candidate_exposures where decision_run_id=v_run and person_id=v_person order by display_rank limit 1;
  select coalesce(max(display_rank),0) into v_rank from gf_core.candidate_exposures where decision_run_id=v_run;
  for r in
    with eligible as (
      select hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hp.lifecycle,hp.risk_class,hp.evidence_class,
             hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail,hv.accessibility,
             pr.display_name provider_name,pr.provider_kind,pr.provenance provider_provenance,pr.rights provider_rights,
             min(ha.priority_hint) priority_hint,max(ha.applicability_confidence) applicability_confidence,
             array_agg(distinct ha.capacity_key order by ha.capacity_key) matched_capacity_keys,
             array_agg(distinct ha.area_key order by ha.area_key) matched_area_keys,
             array_agg(distinct role) filter(where role is not null) cultivation_roles,
             count(distinct ha.capacity_key) capacity_match_count,
             count(distinct role) filter(where role is not null) role_diversity,
             (v_memory and exists(select 1 from gf_core.personal_repertoire own where own.person_id=v_person and own.help_id=hp.help_id and own.status='active' and own.user_confirmed)) from_own_repertoire,
             (v_memory and exists(select 1 from gf_private.sanctuary_entries se where se.person_id=v_person and se.source_help_id=hp.help_id)) from_sanctuary
      from gf_core.help_applicability ha
      join gf_core.help_versions hv on hv.help_version_id=ha.help_version_id
      join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version
      join gf_core.providers pr on pr.provider_id=hp.provider_id
      join lateral(select hloc.* from gf_core.help_localizations hloc where hloc.help_version_id=hv.help_version_id order by case when hloc.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0 when left(hloc.locale,2)=left(coalesce(nullif(trim(p_locale),''),'es-AR'),2) then 1 when hloc.locale='es-AR' then 2 else 3 end limit 1) hl on true
      left join lateral unnest(ha.cultivation_roles) role on true
      where hp.lifecycle in('active_limited','active') and ha.state in('applicable','partial') and ha.taxonomy_version='life-taxonomy.v1'
        and (ha.area_key=any(v_areas) and ha.capacity_key=any(v_caps) or gf_core.reviewed_expression_matches(hv.help_version_id,v_reviewed_text))
        and (coalesce((select (mi.features->>'available_minutes')::integer from gf_core.moment_interpretations mi where mi.moment_id=v_moment and mi.person_id=v_person order by mi.created_at desc limit 1),0)=0 or hv.duration_minutes<= (select (mi.features->>'available_minutes')::integer from gf_core.moment_interpretations mi where mi.moment_id=v_moment and mi.person_id=v_person order by mi.created_at desc limit 1))
        and (not v_memory or coalesce((select o.signal_kind from gf_core.outcomes_feedback o join gf_core.help_selections sel on sel.selection_id=o.selection_id where o.person_id=v_person and sel.help_id=hp.help_id order by o.created_at desc limit 1),'') not in ('STOPPED_HELPING','NOT_HELPED_NOW'))
      group by hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hp.lifecycle,hp.risk_class,hp.evidence_class,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail,hv.accessibility,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
    )
    select * from eligible order by from_own_repertoire desc,from_sanctuary desc,(case when v_memory then gf_private.cultivation_personal_priority(v_person,help_id) else 0 end) desc,gf_private.cultivation_collective_priority(help_id) desc,(help_id=v_primary) desc,capacity_match_count desc,role_diversity desc,applicability_confidence desc,priority_hint,canonical_code limit v_limit
  loop
    if not exists(select 1 from gf_core.decision_candidates where decision_run_id=v_run and help_id=r.help_id) then
      insert into gf_core.decision_candidates(decision_run_id,person_id,help_id,help_version_id,eligibility_status,reason_key,priority_hint)
      values(v_run,v_person,r.help_id,r.help_version_id,'eligible',case when r.from_own_repertoire then 'moment_constellation_own_repertoire' else 'moment_constellation' end,r.priority_hint);
    end if;
    if not exists(select 1 from gf_core.candidate_exposures where decision_run_id=v_run and person_id=v_person and help_id=r.help_id) then
      v_rank:=v_rank+1; insert into gf_core.candidate_exposures(decision_run_id,person_id,help_id,help_version_id,display_rank) values(v_run,v_person,r.help_id,r.help_version_id,v_rank);
    end if;
    if jsonb_array_length(v_result)=0 then
      if r.from_own_repertoire then v_kind:='REUSE_REPERTOIRE';v_withdraw:=true;
      elsif v_memory and exists(select 1 from gf_core.outcomes_feedback o join gf_core.help_selections sel on sel.selection_id=o.selection_id where o.person_id=v_person and sel.help_id=r.help_id and o.effect='helped') then v_kind:='REPEAT';end if;
    end if;
    v_result:=v_result || jsonb_build_array(jsonb_build_object(
      'help_id',r.help_id,'help_version_id',r.help_version_id,'canonical_code',r.canonical_code,'help_type',r.help_type,'lifecycle',r.lifecycle,'risk_class',r.risk_class,'evidence_class',r.evidence_class,
      'title',r.title,'summary',r.summary,'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail,'accessibility',r.accessibility,
      'provider',jsonb_build_object('name',r.provider_name,'kind',r.provider_kind,'provenance',r.provider_provenance,'rights',r.provider_rights),
      'areas',to_jsonb(r.matched_area_keys),'capacities',to_jsonb(r.matched_capacity_keys),'cultivation_roles',to_jsonb(coalesce(r.cultivation_roles,'{}'::text[])),'cultivation_vocab_version','cultivation.v1','taxonomy_version','life-taxonomy.v1',
      'primary_now',jsonb_array_length(v_result)=0,'context_origin',case when r.from_own_repertoire then 'propio' when r.from_sanctuary then 'santuario' when r.help_type in ('professional_support','institutional_service','conversation') then 'tejido' else 'fuente' end,
      'decision_kind',v_kind,'context_reason',case when r.from_own_repertoire then 'Lo reconociste como propio y se relaciona con lo que expresaste hoy.' when v_kind='REPEAT' then 'Esto te ayudó antes y se relaciona con este Momento.' when r.from_sanctuary then 'Elegiste conservarlo y puede volver a servirte ahora.' when r.help_type in ('professional_support','institutional_service','conversation') then 'Una forma de acompañamiento humano relacionada con este Momento.' else 'Una posibilidad relacionada con lo que expresaste hoy.' end,'from_own_repertoire',r.from_own_repertoire,'applicability_confidence',r.applicability_confidence));
    if v_withdraw then exit;end if;
  end loop;
  if jsonb_array_length(v_result)=0 then v_kind:='NO_MATCH';end if;
  select hp.help_id into v_control from gf_core.help_applicability ha join gf_core.help_versions hv on hv.help_version_id=ha.help_version_id join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version where hp.lifecycle in('active_limited','active') and ha.state in('applicable','partial') and (ha.area_key=any(v_areas) and ha.capacity_key=any(v_caps) or gf_core.reviewed_expression_matches(hv.help_version_id,v_reviewed_text)) group by hp.help_id,hp.canonical_code order by count(distinct ha.capacity_key) desc,max(ha.applicability_confidence) desc,min(ha.priority_hint),hp.canonical_code limit 1;
  update gf_core.decision_runs set decision_kind=v_kind,decision_reason_key=case when v_withdraw then 'own_resource_sufficient' else decision_reason_key end,
    continuity_context=continuity_context || jsonb_build_object('memory_used',v_memory,'elegida_por',case when v_withdraw then 'repertorio' else 'motor' end,'lumi_withdrawn',v_withdraw,
    'experiment',jsonb_build_object('version','continuity.shadow.v1','arm','live','control_help_id',v_control,'live_help_id',v_result->0->>'help_id','outcome_pending',true),
    'facets_frozen',jsonb_build_object('area_keys',v_areas,'capacity_keys',v_caps)) where decision_run_id=v_run and person_id=v_person;
  perform gf_private.emit_person_event('AccompanimentAdapted','episode',p_episode_id,v_person,v_trace,'s1.a63.v62',jsonb_build_object('decision_run_id',v_run,'decision_kind',v_kind,'help_id',v_result->0->>'help_id','lumi_withdrawn',v_withdraw,'memory_used',v_memory));
  select event_id into v_event from gf_ledger.domain_events where person_pseudonym=v_person and trace_id=v_trace and event_type='AccompanimentAdapted' order by occurred_at desc limit 1;
  perform gf_private.emit_person_event('MomentConstellationExposed','episode',p_episode_id,v_person,v_trace,'s1.a63.v60',jsonb_build_object('decision_run_id',v_run,'item_count',jsonb_array_length(v_result),'capacity_keys',to_jsonb(v_caps),'area_keys',to_jsonb(v_areas),'user_adjusted_capacities',p_capacity_keys is not null));
  return jsonb_build_object('episode_id',p_episode_id,'moment_id',v_moment,'decision_run_id',v_run,'decision_kind',v_kind,'lumi_withdrawn',v_withdraw,'evidence_event_id',v_event,'continuity_message',case when v_withdraw then 'Esto ya es tuyo. Empecemos por lo que reconociste: hoy puedo ocupar menos lugar.' when v_kind='REPEAT' then 'Esto te ayudó antes. Podés volver a probarlo o elegir otra forma.' else null end,'state',case when jsonb_array_length(v_result)>0 then 'success' else 'no_match' end,'items',v_result,'capacity_keys',to_jsonb(v_caps),'area_keys',to_jsonb(v_areas),'trace_id',v_trace);
end $function$

;

