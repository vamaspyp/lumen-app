-- A63 · V62 · live definitions inspected before replacement.
CREATE OR REPLACE FUNCTION public.lumen_s1_moment_constellation(p_episode_id uuid, p_locale text DEFAULT 'es-AR'::text, p_limit integer DEFAULT 12, p_trace_id uuid DEFAULT NULL::uuid, p_capacity_keys text[] DEFAULT NULL::text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_person uuid:=gf_core.current_person_id(); v_trace uuid:=coalesce(p_trace_id,gen_random_uuid()); v_run uuid; v_moment uuid; v_areas text[]; v_interp_caps text[]; v_caps text[]; v_primary uuid; v_rank integer; v_result jsonb:='[]'::jsonb; v_limit integer:=least(3,greatest(1,coalesce(p_limit,3))); v_memory boolean:=false; v_invalid integer; v_kind text:='NEW_HELP'; v_withdraw boolean:=false; v_event uuid; v_control uuid; r record;
begin
  if v_person is null then raise exception 'authentication required' using errcode='28000'; end if;
  select coalesce(memory_allowed,false) into v_memory from gf_core.privacy_preferences where person_id=v_person;
  select dr.decision_run_id,ae.moment_id,mi.area_keys,mi.capacity_keys into v_run,v_moment,v_areas,v_interp_caps
  from gf_core.accompaniment_episodes ae
  join gf_core.decision_runs dr on dr.episode_id=ae.episode_id and dr.person_id=v_person
  join gf_core.moment_interpretations mi on mi.moment_id=ae.moment_id and mi.person_id=v_person
  where ae.episode_id=p_episode_id and ae.person_id=v_person and dr.safety_state<>'blocked' and dr.coverage_state in('covered','partial')
  order by dr.created_at desc,mi.created_at desc limit 1;
  if v_run is null then return jsonb_build_object('episode_id',p_episode_id,'items','[]'::jsonb,'capacity_keys','[]'::jsonb,'area_keys','[]'::jsonb,'trace_id',v_trace); end if;
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
        and ha.area_key=any(v_areas) and ha.capacity_key=any(v_caps)
        and (not v_memory or coalesce((select o.signal_kind from gf_core.outcomes_feedback o join gf_core.help_selections sel on sel.selection_id=o.selection_id where o.person_id=v_person and sel.help_id=hp.help_id order by o.created_at desc limit 1),'') not in ('STOPPED_HELPING','NOT_HELPED_NOW'))
      group by hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hp.lifecycle,hp.risk_class,hp.evidence_class,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail,hv.accessibility,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
    )
    select * from eligible order by from_own_repertoire desc,from_sanctuary desc,(help_id=v_primary) desc,capacity_match_count desc,role_diversity desc,applicability_confidence desc,priority_hint,canonical_code limit v_limit
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
      'decision_kind',v_kind,'context_reason',case when r.from_own_repertoire then 'Lo reconociste como propio y se relaciona con lo que expresaste hoy.' when r.from_sanctuary then 'Elegiste conservarlo y puede volver a servirte ahora.' when r.help_type in ('professional_support','institutional_service','conversation') then 'Una forma de acompañamiento humano relacionada con este Momento.' else 'Una posibilidad relacionada con lo que expresaste hoy.' end,'from_own_repertoire',r.from_own_repertoire,'applicability_confidence',r.applicability_confidence));
    if v_withdraw then exit;end if;
  end loop;
  if jsonb_array_length(v_result)=0 then v_kind:='NO_MATCH';end if;
  select hp.help_id into v_control from gf_core.help_applicability ha join gf_core.help_versions hv on hv.help_version_id=ha.help_version_id join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version where hp.lifecycle in('active_limited','active') and ha.state in('applicable','partial') and ha.area_key=any(v_areas) and ha.capacity_key=any(v_caps) group by hp.help_id,hp.canonical_code order by count(distinct ha.capacity_key) desc,max(ha.applicability_confidence) desc,min(ha.priority_hint),hp.canonical_code limit 1;
  update gf_core.decision_runs set decision_kind=v_kind,decision_reason_key=case when v_withdraw then 'own_resource_sufficient' else decision_reason_key end,
    continuity_context=continuity_context || jsonb_build_object('memory_used',v_memory,'elegida_por',case when v_withdraw then 'repertorio' else 'motor' end,'lumi_withdrawn',v_withdraw,
    'experiment',jsonb_build_object('version','continuity.shadow.v1','arm','live','control_help_id',v_control,'live_help_id',v_result->0->>'help_id','outcome_pending',true),
    'facets_frozen',jsonb_build_object('area_keys',v_areas,'capacity_keys',v_caps)) where decision_run_id=v_run and person_id=v_person;
  perform gf_private.emit_person_event('AccompanimentAdapted','episode',p_episode_id,v_person,v_trace,'s1.a63.v62',jsonb_build_object('decision_run_id',v_run,'decision_kind',v_kind,'help_id',v_result->0->>'help_id','lumi_withdrawn',v_withdraw,'memory_used',v_memory));
  select event_id into v_event from gf_ledger.domain_events where person_pseudonym=v_person and trace_id=v_trace and event_type='AccompanimentAdapted' order by occurred_at desc limit 1;
  perform gf_private.emit_person_event('MomentConstellationExposed','episode',p_episode_id,v_person,v_trace,'s1.a63.v60',jsonb_build_object('decision_run_id',v_run,'item_count',jsonb_array_length(v_result),'capacity_keys',to_jsonb(v_caps),'area_keys',to_jsonb(v_areas),'user_adjusted_capacities',p_capacity_keys is not null));
  return jsonb_build_object('episode_id',p_episode_id,'moment_id',v_moment,'decision_run_id',v_run,'decision_kind',v_kind,'lumi_withdrawn',v_withdraw,'evidence_event_id',v_event,'continuity_message',case when v_withdraw then 'Esto ya es tuyo. Empecemos por lo que reconociste: hoy puedo ocupar menos lugar.' when v_kind='REPEAT' then 'Esto te ayudó antes. Podés volver a probarlo o elegir otra forma.' else null end,'state',case when jsonb_array_length(v_result)>0 then 'success' else 'no_match' end,'items',v_result,'capacity_keys',to_jsonb(v_caps),'area_keys',to_jsonb(v_areas),'trace_id',v_trace);
end $function$;


CREATE OR REPLACE FUNCTION public.lumen_s2_add_repertoire(p_help_id uuid, p_trace_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_person uuid := gf_core.current_person_id();
  v_trace uuid := coalesce(p_trace_id, gen_random_uuid());
  v_outcome uuid;
  v_rep uuid;
  v_count integer;
  v_caps text[] := '{}';
begin
  if v_person is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then raise exception 'memory consent required' using errcode='42501';end if;
  select count(distinct o.episode_id) into v_count
    from gf_core.outcomes_feedback o
    join gf_core.help_selections s on s.selection_id=o.selection_id and s.person_id=o.person_id
   where o.person_id=v_person and s.help_id=p_help_id and s.action='selected' and o.effect='helped';
  if v_count < 2 then
    raise exception 'Para reconocerlo como propio, volvé a esta ayuda y registrá al menos dos retornos en ocasiones distintas.' using errcode='P0001';
  end if;
  select o.outcome_id, coalesce(mi.capacity_keys,'{}'::text[]) into v_outcome,v_caps
    from gf_core.outcomes_feedback o
    join gf_core.help_selections s on s.selection_id=o.selection_id and s.person_id=o.person_id
    join gf_core.accompaniment_episodes ae on ae.episode_id=o.episode_id
    left join lateral (
      select capacity_keys from gf_core.moment_interpretations
       where moment_id=ae.moment_id and person_id=v_person order by created_at desc limit 1
    ) mi on true
   where o.person_id=v_person and s.help_id=p_help_id and s.action='selected' and o.effect='helped'
   order by o.created_at desc limit 1;
  insert into gf_core.personal_repertoire
    (person_id,help_id,source_outcome_id,capability_keys,user_confirmed,integration_context)
  values
    (v_person,p_help_id,v_outcome,coalesce(v_caps,'{}'::text[]),true,
     jsonb_build_object('integration_source','explicit_after_repeated_helped_outcomes','contract_version','s2.v58.1'))
  on conflict(person_id,help_id) do update
    set status='active',source_outcome_id=excluded.source_outcome_id,
        capability_keys=case when cardinality(excluded.capability_keys)>0 then excluded.capability_keys else gf_core.personal_repertoire.capability_keys end,
        user_confirmed=true,integration_context=excluded.integration_context,updated_at=now()
  returning repertoire_id into v_rep;
  perform gf_private.emit_person_event(
    'RepertoireConfirmed','repertoire',v_rep,v_person,v_trace,'s2.v58.1',
    jsonb_build_object('help_id',p_help_id,'source_outcome_id',v_outcome,
                       'capability_keys',to_jsonb(coalesce(v_caps,'{}'::text[])))
  );
  return jsonb_build_object('repertoire_id',v_rep,'help_id',p_help_id,'source_outcome_id',v_outcome,
                            'capability_keys',to_jsonb(coalesce(v_caps,'{}'::text[])),
                            'user_confirmed',true,'trace_id',v_trace);
end $function$;


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



do $$declare r record;begin
 for r in select n.nspname,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('gf_private','gf_ledger') and c.relkind='r' loop
  execute format('alter table %I.%I enable row level security',r.nspname,r.relname);
 end loop;
end $$;

-- Human observations stay private and are never interpreted as an inventory.
create table if not exists gf_private.life_context (
 person_id uuid primary key references gf_core.persons(person_id),
 adjustable text not null default '', external text not null default '', potential text not null default '',
 updated_at timestamptz not null default now(),
 check(char_length(adjustable)<=1000 and char_length(external)<=1000 and char_length(potential)<=1000)
);
alter table gf_private.life_context enable row level security;
revoke all on gf_private.life_context from public,anon,authenticated;

create or replace function public.lumen_s2_set_life_context(p_adjustable text,p_external text,p_potential text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then raise exception 'memory consent required' using errcode='42501';end if;
 insert into gf_private.life_context(person_id,adjustable,external,potential) values(v_person,trim(coalesce(p_adjustable,'')),trim(coalesce(p_external,'')),trim(coalesce(p_potential,'')))
 on conflict(person_id) do update set adjustable=excluded.adjustable,external=excluded.external,potential=excluded.potential,updated_at=now();
 perform gf_private.emit_person_event('LifeContextCorrected','person',v_person,v_person,gen_random_uuid(),'s2.a63.v62','{}'::jsonb);
 return jsonb_build_object('state','success');end $$;
revoke all on function public.lumen_s2_set_life_context(text,text,text) from public,anon;
grant execute on function public.lumen_s2_set_life_context(text,text,text) to authenticated;

-- Derive a small meaningful movement from actual events, never a complete activity feed.
create or replace function public.lumen_s2_movement_snapshot()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();v_items jsonb;v_context jsonb;v_changes jsonb;v_withdraw boolean;begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then return jsonb_build_object('state','without_memory','items','[]'::jsonb,'changes','[]'::jsonb,'context','{}'::jsonb,'withdrawn',false);end if;
 select to_jsonb(c)-'person_id'-'updated_at' into v_context from gf_private.life_context c where person_id=v_person;
 select coalesce(jsonb_agg(q.item order by q.at desc),'[]'::jsonb) into v_items from (
  select e.occurred_at at,jsonb_build_object('event_id',e.event_id,'help_id',e.payload->>'help_id','at',e.occurred_at,
    'text',case e.event_type when 'RepertoireConfirmed' then 'Reconociste este recurso como propio.' when 'RepertoireReused' then 'Volviste a un recurso que ya conocés.' when 'LumiWithdrew' then 'Elegiste que no te lo recordemos. LUMEN se retiró de ese recordatorio.'
    when 'LongitudinalSignalRecorded' then case e.payload->>'signal_kind' when 'REPEATED' then 'Lo repetiste.' when 'ADAPTED' then 'Lo adaptaste a tu manera.' when 'VARIED' then 'Probaste otra forma.' when 'APPLIED_OTHER_CONTEXT' then 'Lo llevaste a otra situación de tu vida.' when 'STOPPED_HELPING' then 'Nos dijiste que dejó de ayudar. Volvemos a buscar otra forma.' else 'Compartiste cómo siguió esta experiencia.' end end) item
  from gf_ledger.domain_events e where e.person_pseudonym=v_person and e.occurred_at>coalesce((select max(forgot.occurred_at) from gf_ledger.domain_events forgot where forgot.person_pseudonym=v_person and forgot.event_type='PersonalMemoryForgotten'),'-infinity'::timestamptz) and e.event_type in ('RepertoireConfirmed','RepertoireReused','LumiWithdrew','LongitudinalSignalRecorded') order by e.occurred_at desc limit 8
 ) q;
 select coalesce(jsonb_agg(q.item order by q.at desc),'[]'::jsonb) into v_changes from (
  select e.occurred_at at,jsonb_build_object('event_id',e.event_id,'help_id',e.payload->>'help_id','at',e.occurred_at,
    'text','Al principio te acercamos una ayuda. Hoy empezamos por lo que vos reconociste como propio; por eso te propusimos menos y LUMI se corrió.') item
  from gf_ledger.domain_events e where e.person_pseudonym=v_person and e.occurred_at>coalesce((select max(forgot.occurred_at) from gf_ledger.domain_events forgot where forgot.person_pseudonym=v_person and forgot.event_type='PersonalMemoryForgotten'),'-infinity'::timestamptz) and e.event_type='AccompanimentAdapted' and e.payload->>'decision_kind'='REUSE_REPERTOIRE'
  and exists(select 1 from gf_ledger.domain_events prior where prior.person_pseudonym=v_person and prior.event_type='RepertoireConfirmed' and prior.payload->>'help_id'=e.payload->>'help_id' and prior.occurred_at<=e.occurred_at)
  order by e.occurred_at desc limit 3
 ) q;
 select exists(select 1 from gf_ledger.domain_events e where e.person_pseudonym=v_person and e.occurred_at>coalesce((select max(forgot.occurred_at) from gf_ledger.domain_events forgot where forgot.person_pseudonym=v_person and forgot.event_type='PersonalMemoryForgotten'),'-infinity'::timestamptz) and e.event_type='LumiWithdrew') into v_withdraw;
 return jsonb_build_object('state','success','items',v_items,'changes',v_changes,'context',coalesce(v_context,'{}'::jsonb),'withdrawn',v_withdraw);end $$;
revoke all on function public.lumen_s2_movement_snapshot() from public,anon;
grant execute on function public.lumen_s2_movement_snapshot() to authenticated;

alter table gf_core.accompaniment_episodes add column if not exists experience_position jsonb;
create or replace function public.lumen_s2_save_experience_position(p_episode_id uuid,p_step integer,p_finished boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if p_step<0 or p_step>10000 then raise exception 'invalid position' using errcode='22023';end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then return jsonb_build_object('state','without_memory');end if;
 update gf_core.accompaniment_episodes set experience_position=jsonb_build_object('step',p_step,'finished',p_finished,'saved_at',now()) where episode_id=p_episode_id and person_id=v_person;
 if not found then raise exception 'experience unavailable' using errcode='42501';end if;
 return jsonb_build_object('state','success','step',p_step,'finished',p_finished);end $$;
revoke all on function public.lumen_s2_save_experience_position(uuid,integer,boolean) from public,anon;
grant execute on function public.lumen_s2_save_experience_position(uuid,integer,boolean) to authenticated;

create or replace function public.lumen_s2_resume_experience()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();v_result jsonb;begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then return jsonb_build_object('state','without_memory');end if;
 select jsonb_build_object('state','success','episode_id',e.episode_id,'moment_id',e.moment_id,'help_id',s.help_id,'position',e.experience_position)
 into v_result from gf_core.accompaniment_episodes e join gf_core.help_selections s on s.episode_id=e.episode_id and s.person_id=e.person_id and s.action='selected'
 where e.person_id=v_person and e.experience_position is not null and not exists(select 1 from gf_core.outcomes_feedback o where o.episode_id=e.episode_id and o.person_id=v_person)
 order by (e.experience_position->>'saved_at')::timestamptz desc,s.created_at desc limit 1;
 return coalesce(v_result,jsonb_build_object('state','empty'));end $$;
revoke all on function public.lumen_s2_resume_experience() from public,anon;
grant execute on function public.lumen_s2_resume_experience() to authenticated;

-- This endpoint runs only after the person's explicit destructive confirmation.
create or replace function public.lumen_privacy_forget_personal_memory(p_confirm boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if p_confirm is distinct from true then raise exception 'explicit confirmation required' using errcode='22023';end if;
 perform public.lumen_s2_set_memory(false,gen_random_uuid());
 delete from gf_private.sanctuary_entries where person_id=v_person;
 delete from gf_private.life_context where person_id=v_person;
 delete from gf_core.personal_repertoire where person_id=v_person;
 delete from gf_core.followups where person_id=v_person;
 delete from gf_core.trajectories where person_id=v_person;
 update gf_private.knowledge_claims k set valid_to=now(),uncertainty=coalesce(uncertainty,'{}'::jsonb)||jsonb_build_object('evidence_withdrawn',true) where exists(select 1 from gf_private.claim_evidence ce join gf_private.evidence_units eu on eu.evidence_unit_id=ce.evidence_unit_id where ce.claim_id=k.claim_id and eu.person_pseudonym=v_person);
 delete from gf_private.evidence_units where person_pseudonym=v_person;
 delete from gf_core.moments where person_id=v_person;
 perform gf_private.emit_person_event('PersonalMemoryForgotten','privacy',v_person,v_person,gen_random_uuid(),'privacy.a63.v62','{}'::jsonb);
 return jsonb_build_object('state','success','memory_allowed',false);end $$;
revoke all on function public.lumen_privacy_forget_personal_memory(boolean) from public,anon;
grant execute on function public.lumen_privacy_forget_personal_memory(boolean) to authenticated;
