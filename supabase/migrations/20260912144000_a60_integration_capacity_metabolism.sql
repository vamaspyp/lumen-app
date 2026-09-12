-- A60 · Embrión V1.1 · Integración y capacidad propia
-- V53 target: deep longitudinal physiology, minimum anatomy.

alter table gf_core.help_applicability
  add column if not exists cultivation_roles text[] not null default '{}'::text[],
  add column if not exists cultivation_vocab_version text not null default 'cultivation.v1';

alter table gf_core.help_applicability
  drop constraint if exists help_applicability_cultivation_roles_check;
alter table gf_core.help_applicability
  add constraint help_applicability_cultivation_roles_check
  check (cultivation_roles <@ array['UNDERSTAND','PRACTICE','APPLY','VARY','REFLECT','INTEGRATE','CONNECT','SUSTAIN']::text[]);

alter table gf_core.decision_runs
  add column if not exists decision_kind text not null default 'NEW_HELP';
alter table gf_core.decision_runs
  drop constraint if exists decision_runs_decision_kind_check;
alter table gf_core.decision_runs
  add constraint decision_runs_decision_kind_check
  check (decision_kind in ('NEW_HELP','REUSE_REPERTOIRE','REPEAT','VARY','APPLY_IN_CONTEXT','REFLECT','INTEGRATE','CONTINUE_PATH','CONNECT_HUMAN','WITHDRAW','CLARIFY','DERIVE','NO_MATCH'));

alter table gf_core.outcomes_feedback
  add column if not exists signal_kind text not null default 'UNKNOWN',
  add column if not exists signal_context jsonb not null default '{}'::jsonb;
alter table gf_core.outcomes_feedback
  drop constraint if exists outcomes_feedback_signal_kind_check;
alter table gf_core.outcomes_feedback
  add constraint outcomes_feedback_signal_kind_check
  check (signal_kind in ('HELPED_NOW','NOT_HELPED_NOW','REUSED','REPEATED','VARIED','APPLIED_OTHER_CONTEXT','ADAPTED','RECOGNIZED_AS_OWN','NO_REMINDER_NEEDED','STOPPED_HELPING','UNKNOWN'));

update gf_core.outcomes_feedback
set signal_kind = case effect
  when 'helped' then 'HELPED_NOW'
  when 'not_helped' then 'NOT_HELPED_NOW'
  else 'UNKNOWN'
end
where signal_kind = 'UNKNOWN';

alter table gf_core.personal_repertoire
  add column if not exists last_used_at timestamptz,
  add column if not exists capability_keys text[] not null default '{}'::text[],
  add column if not exists user_confirmed boolean not null default false,
  add column if not exists integration_context jsonb not null default '{}'::jsonb;

-- Existing repertoire rows were only created through the explicit AddRepertoire action.
update gf_core.personal_repertoire
set user_confirmed = true
where status='active' and user_confirmed=false;

alter table gf_core.path_items
  add column if not exists cultivation_move text;
alter table gf_core.path_items
  drop constraint if exists path_items_cultivation_move_check;
alter table gf_core.path_items
  add constraint path_items_cultivation_move_check
  check (cultivation_move is null or cultivation_move in ('REUSE_REPERTOIRE','REPEAT','VARY','APPLY_IN_CONTEXT','REFLECT','INTEGRATE','CONTINUE_PATH','CONNECT_HUMAN'));

alter table gf_core.followups
  add column if not exists cultivation_move text,
  add column if not exists capacity_key text,
  add column if not exists repertoire_id uuid references gf_core.personal_repertoire(repertoire_id) on delete set null;
alter table gf_core.followups
  drop constraint if exists followups_cultivation_move_check;
alter table gf_core.followups
  add constraint followups_cultivation_move_check
  check (cultivation_move is null or cultivation_move in ('REUSE_REPERTOIRE','REPEAT','VARY','APPLY_IN_CONTEXT','REFLECT','INTEGRATE','CONTINUE_PATH'));

-- Initial curated priors. They are deliberately broad priors by form, not learned truths.
update gf_core.help_applicability ha
set cultivation_roles = case hp.help_type
  when 'practice' then array['PRACTICE','APPLY']::text[]
  when 'reflection' then array['REFLECT','INTEGRATE']::text[]
  when 'reading' then array['UNDERSTAND','REFLECT']::text[]
  when 'external_resource' then array['UNDERSTAND']::text[]
  when 'human_action' then array['CONNECT','APPLY']::text[]
  when 'conversation' then array['CONNECT','REFLECT']::text[]
  when 'tool' then array['PRACTICE','APPLY']::text[]
  when 'question' then array['REFLECT','INTEGRATE']::text[]
  when 'professional_support' then array['CONNECT','SUSTAIN']::text[]
  when 'institutional_service' then array['CONNECT','SUSTAIN']::text[]
  else array['UNDERSTAND']::text[]
end,
provenance = coalesce(ha.provenance,'{}'::jsonb) || jsonb_build_object('cultivation_roles_basis','curated_help_type_prior.v1'),
updated_at=now()
from gf_core.help_versions hv
join gf_core.help_possibilities hp on hp.help_id=hv.help_id
where ha.help_version_id=hv.help_version_id
  and cardinality(ha.cultivation_roles)=0;

create or replace function public.lumen_source_taxonomy()
returns jsonb language sql stable security definer set search_path=''
as $$
select jsonb_build_object(
  'taxonomy_version','life-taxonomy.v1',
  'cultivation_vocab_version','cultivation.v1',
  'areas',coalesce((select jsonb_agg(jsonb_build_object('key',area_key,'label',display_name) order by display_name) from gf_core.area_terms where taxonomy_version='life-taxonomy.v1' and status='active'),'[]'::jsonb),
  'capacities',coalesce((select jsonb_agg(jsonb_build_object('key',capacity_key,'label',display_name) order by display_name) from gf_core.capacity_terms where taxonomy_version='life-taxonomy.v1' and status='active'),'[]'::jsonb),
  'help_types',coalesce((select jsonb_agg(jsonb_build_object('key',help_type,'label',case help_type when 'practice' then 'Práctica' when 'reflection' then 'Reflexión' when 'reading' then 'Lectura' when 'external_resource' then 'Recurso externo' when 'human_action' then 'Acción humana' when 'conversation' then 'Conversación' when 'tool' then 'Herramienta' when 'question' then 'Pregunta' when 'professional_support' then 'Apoyo profesional' when 'institutional_service' then 'Servicio institucional' else initcap(replace(help_type,'_',' ')) end) order by help_type) from (select distinct hp.help_type from gf_core.help_possibilities hp where hp.lifecycle in ('active_limited','active')) t),'[]'::jsonb),
  'cultivation_roles',jsonb_build_array(
    jsonb_build_object('key','UNDERSTAND','label','Comprender'),
    jsonb_build_object('key','PRACTICE','label','Practicar'),
    jsonb_build_object('key','APPLY','label','Aplicar'),
    jsonb_build_object('key','VARY','label','Variar'),
    jsonb_build_object('key','REFLECT','label','Reflexionar'),
    jsonb_build_object('key','INTEGRATE','label','Integrar'),
    jsonb_build_object('key','CONNECT','label','Conectar'),
    jsonb_build_object('key','SUSTAIN','label','Sostener')
  )
);
$$;

create or replace function public.lumen_source_constellation(
  p_capacity_key text,
  p_area_key text default null,
  p_locale text default 'es-AR',
  p_limit integer default 16
) returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare v_result jsonb; v_limit integer:=greatest(1,least(coalesce(p_limit,16),32));
begin
 if p_capacity_key is null or not exists(select 1 from gf_core.capacity_terms where taxonomy_version='life-taxonomy.v1' and capacity_key=p_capacity_key and status='active') then
   raise exception 'active capacity required' using errcode='22023';
 end if;
 if p_area_key is not null and not exists(select 1 from gf_core.area_terms where taxonomy_version='life-taxonomy.v1' and area_key=p_area_key and status='active') then
   raise exception 'invalid area' using errcode='22023';
 end if;

 select coalesce(jsonb_agg(item order by role_diversity desc,type_diversity desc,priority_hint,title),'[]'::jsonb)
 into v_result
 from (
   select min(ha.priority_hint) priority_hint,
          count(distinct role) role_diversity,
          1 type_diversity,
          hl.title,
          jsonb_build_object(
            'help_id',hp.help_id,'help_version_id',hv.help_version_id,'canonical_code',hp.canonical_code,
            'help_type',hp.help_type,'lifecycle',hp.lifecycle,'risk_class',hp.risk_class,'evidence_class',hp.evidence_class,
            'title',hl.title,'summary',hl.summary,'content',hl.content_payload,'duration_minutes',hv.duration_minutes,'energy',hv.energy,'accessibility',hv.accessibility,
            'provider',jsonb_build_object('name',pr.display_name,'kind',pr.provider_kind,'provenance',pr.provenance,'rights',pr.rights),
            'area_key',p_area_key,'capacity_key',p_capacity_key,
            'cultivation_roles',coalesce(jsonb_agg(distinct role) filter(where role is not null),'[]'::jsonb),
            'cultivation_vocab_version','cultivation.v1','taxonomy_version','life-taxonomy.v1'
          ) item
   from gf_core.help_applicability ha
   join gf_core.help_versions hv on hv.help_version_id=ha.help_version_id
   join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version
   join gf_core.providers pr on pr.provider_id=hp.provider_id
   join lateral(select h.* from gf_core.help_localizations h where h.help_version_id=hv.help_version_id order by case when h.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0 when left(h.locale,2)=left(coalesce(nullif(trim(p_locale),''),'es-AR'),2) then 1 when h.locale='es-AR' then 2 else 3 end limit 1) hl on true
   left join lateral unnest(ha.cultivation_roles) role on true
   where hp.lifecycle in('active_limited','active')
     and ha.state in('applicable','partial')
     and ha.taxonomy_version='life-taxonomy.v1'
     and ha.capacity_key=p_capacity_key
     and (p_area_key is null or ha.area_key=p_area_key)
   group by hp.help_id,hv.help_version_id,hp.canonical_code,hp.help_type,hp.lifecycle,hp.risk_class,hp.evidence_class,hv.duration_minutes,hv.energy,hv.accessibility,hl.title,hl.summary,hl.content_payload,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
   order by role_diversity desc, min(ha.priority_hint), hl.title
   limit v_limit
 ) q;
 return v_result;
end $$;

revoke all on function public.lumen_source_constellation(text,text,text,integer) from public;
grant execute on function public.lumen_source_constellation(text,text,text,integer) to anon, authenticated;

create or replace function public.lumen_s2_add_repertoire(p_help_id uuid,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_outcome uuid;v_rep uuid;v_caps text[]:='{}';
begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then raise exception 'person unavailable' using errcode='P0002';end if;
 select o.outcome_id,coalesce(mi.capacity_keys,'{}'::text[]) into v_outcome,v_caps
 from gf_core.outcomes_feedback o
 join gf_core.help_selections s on s.selection_id=o.selection_id and s.person_id=o.person_id
 join gf_core.accompaniment_episodes ae on ae.episode_id=o.episode_id
 left join lateral(select capacity_keys from gf_core.moment_interpretations where moment_id=ae.moment_id and person_id=v_person order by created_at desc limit 1) mi on true
 where o.person_id=v_person and s.help_id=p_help_id and s.action='selected' and o.effect='helped'
 order by o.created_at desc limit 1;
 if v_outcome is null then raise exception 'a helped outcome is required before integration' using errcode='42501';end if;
 insert into gf_core.personal_repertoire(person_id,help_id,source_outcome_id,capability_keys,user_confirmed,integration_context)
 values(v_person,p_help_id,v_outcome,coalesce(v_caps,'{}'::text[]),true,jsonb_build_object('integration_source','explicit_after_helped_outcome','contract_version','s2.v53.1'))
 on conflict(person_id,help_id) do update set status='active',source_outcome_id=excluded.source_outcome_id,capability_keys=case when cardinality(excluded.capability_keys)>0 then excluded.capability_keys else gf_core.personal_repertoire.capability_keys end,user_confirmed=true,integration_context=excluded.integration_context,updated_at=now()
 returning repertoire_id into v_rep;
 perform gf_private.emit_person_event('RepertoireConfirmed','repertoire',v_rep,v_person,v_trace,'s2.v53.1',jsonb_build_object('help_id',p_help_id,'source_outcome_id',v_outcome,'capability_keys',to_jsonb(coalesce(v_caps,'{}'::text[]))));
 return jsonb_build_object('repertoire_id',v_rep,'help_id',p_help_id,'source_outcome_id',v_outcome,'capability_keys',to_jsonb(coalesce(v_caps,'{}'::text[])),'user_confirmed',true,'trace_id',v_trace);
end $$;

create or replace function public.lumen_s2_reuse_repertoire(p_repertoire_id uuid,p_move text,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_move text:=upper(trim(coalesce(p_move,'')));v_rep gf_core.personal_repertoire%rowtype;v_help_version uuid;v_locale text:='es-AR';v_moment uuid;v_episode uuid;v_run uuid;v_selection uuid;v_help jsonb;
begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then raise exception 'person unavailable' using errcode='P0002';end if;
 if v_move not in('REUSE_REPERTOIRE','REPEAT','VARY','APPLY_IN_CONTEXT','REFLECT','INTEGRATE') then raise exception 'invalid cultivation move' using errcode='22023';end if;
 select * into v_rep from gf_core.personal_repertoire where repertoire_id=p_repertoire_id and person_id=v_person and status='active' and user_confirmed=true;
 if not found then raise exception 'repertoire unavailable' using errcode='P0002';end if;
 select hv.help_version_id into v_help_version from gf_core.help_possibilities hp join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version where hp.help_id=v_rep.help_id and hp.lifecycle in('active_limited','active');
 if v_help_version is null then raise exception 'help unavailable' using errcode='P0002';end if;
 select coalesce((select locale from gf_core.moments where person_id=v_person order by received_at desc limit 1),'es-AR') into v_locale;
 perform set_config('app.trace_id',v_trace::text,true);
 insert into gf_core.moments(person_id,locale,language,surface,expression_length,original_retention,status,contract_version)
 values(v_person,v_locale,split_part(v_locale,'-',1),'continuity',0,'ephemeral','decided','s1.v53.1') returning moment_id into v_moment;
 insert into gf_core.accompaniment_episodes(person_id,moment_id,status,contract_version) values(v_person,v_moment,'selected','s1.v53.1') returning episode_id into v_episode;
 insert into gf_core.decision_runs(episode_id,person_id,policy_version,interpreter_version,coverage_version,safety_state,coverage_state,eligible_count,decision_reason_key,continuity_context,decision_kind)
 values(v_episode,v_person,'decision.v53.1','continuity.repertoire.v1','coverage.eval.v1','clear','covered',1,'own_repertoire_cultivation',jsonb_build_object('repertoire_id',v_rep.repertoire_id,'help_id',v_rep.help_id,'capability_keys',to_jsonb(v_rep.capability_keys),'times_reused_before',v_rep.times_reused),v_move)
 returning decision_run_id into v_run;
 insert into gf_core.decision_candidates(decision_run_id,person_id,help_id,help_version_id,eligibility_status,reason_key,priority_hint) values(v_run,v_person,v_rep.help_id,v_help_version,'eligible','own_repertoire_cultivation',1);
 insert into gf_core.candidate_exposures(decision_run_id,person_id,help_id,help_version_id,display_rank) values(v_run,v_person,v_rep.help_id,v_help_version,1);
 insert into gf_core.help_selections(episode_id,person_id,decision_run_id,help_id,help_version_id,action) values(v_episode,v_person,v_run,v_rep.help_id,v_help_version,'selected') returning selection_id into v_selection;
 update gf_core.personal_repertoire set times_reused=times_reused+1,last_used_at=now(),updated_at=now() where repertoire_id=v_rep.repertoire_id;
 perform gf_private.emit_person_event('RepertoireReused','repertoire',v_rep.repertoire_id,v_person,v_trace,'s2.v53.1',jsonb_build_object('move',v_move,'episode_id',v_episode,'decision_run_id',v_run,'selection_id',v_selection,'help_id',v_rep.help_id));
 select jsonb_build_object('help_id',hp.help_id,'help_version_id',hv.help_version_id,'help_type',hp.help_type,'title',hl.title,'summary',hl.summary,'content',hl.content_payload,'duration_minutes',hv.duration_minutes,'energy',hv.energy,'detail',hv.detail,'from_own_repertoire',true) into v_help
 from gf_core.help_versions hv join gf_core.help_possibilities hp on hp.help_id=hv.help_id join lateral(select h.* from gf_core.help_localizations h where h.help_version_id=hv.help_version_id order by case when h.locale=v_locale then 0 when left(h.locale,2)=left(v_locale,2) then 1 when h.locale='es-AR' then 2 else 3 end limit 1) hl on true where hv.help_version_id=v_help_version;
 return jsonb_build_object('scene_id','continuity.cultivate','scene_version','s2.v53.1','presence_mode','P2','episode_id',v_episode,'moment_id',v_moment,'decision_run_id',v_run,'selection_id',v_selection,'decision_kind',v_move,'help',v_help,'trace_id',v_trace,'semantic_key',case v_move when 'REPEAT' then 'continuity.repeat' when 'VARY' then 'continuity.vary' when 'APPLY_IN_CONTEXT' then 'continuity.apply_elsewhere' when 'REFLECT' then 'continuity.reflect' when 'INTEGRATE' then 'continuity.integrate' else 'continuity.return_to_own' end);
end $$;

revoke all on function public.lumen_s2_reuse_repertoire(uuid,text,uuid) from public;
grant execute on function public.lumen_s2_reuse_repertoire(uuid,text,uuid) to authenticated;

create or replace function public.lumen_s2_record_longitudinal_signal(p_episode_id uuid,p_signal_kind text,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_person uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_signal text:=upper(trim(coalesce(p_signal_kind,'')));v_selection gf_core.help_selections%rowtype;v_effect text;v_outcome uuid;v_rep uuid;v_withdraw_run uuid;
begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then raise exception 'person unavailable' using errcode='P0002';end if;
 if v_signal not in('REUSED','REPEATED','VARIED','APPLIED_OTHER_CONTEXT','ADAPTED','RECOGNIZED_AS_OWN','NO_REMINDER_NEEDED','STOPPED_HELPING','UNKNOWN') then raise exception 'invalid longitudinal signal' using errcode='22023';end if;
 select * into v_selection from gf_core.help_selections where episode_id=p_episode_id and person_id=v_person and action='selected' order by created_at desc limit 1;
 if not found then raise exception 'selected help unavailable' using errcode='42501';end if;
 v_effect:=case when v_signal='STOPPED_HELPING' then 'not_helped' when v_signal='UNKNOWN' then 'unsure' else 'helped' end;
 perform set_config('app.trace_id',v_trace::text,true);
 insert into gf_core.outcomes_feedback(episode_id,person_id,selection_id,effect,applied,signal_kind,signal_context)
 values(p_episode_id,v_person,v_selection.selection_id,v_effect,true,v_signal,jsonb_build_object('longitudinal',true)) returning outcome_id into v_outcome;
 update gf_core.accompaniment_episodes set status='completed',completed_at=now() where episode_id=p_episode_id and person_id=v_person;
 select repertoire_id into v_rep from gf_core.personal_repertoire where person_id=v_person and help_id=v_selection.help_id and status='active';
 if v_rep is not null then update gf_core.personal_repertoire set last_used_at=now(),updated_at=now(),user_confirmed=case when v_signal='RECOGNIZED_AS_OWN' then true else user_confirmed end where repertoire_id=v_rep;end if;
 if v_signal='NO_REMINDER_NEEDED' then
   update gf_core.followups set status='cancelled',cancelled_at=now(),updated_at=now() where person_id=v_person and related_help_id=v_selection.help_id and status in('scheduled','due');
   insert into gf_core.decision_runs(episode_id,person_id,policy_version,interpreter_version,coverage_version,safety_state,coverage_state,eligible_count,decision_reason_key,continuity_context,decision_kind)
   values(p_episode_id,v_person,'decision.v53.1','continuity.autonomy.v1','coverage.eval.v1','clear','covered',0,'own_resource_sufficient_no_reminder',jsonb_build_object('signal_kind',v_signal,'repertoire_id',v_rep,'help_id',v_selection.help_id),'WITHDRAW') returning decision_run_id into v_withdraw_run;
   perform gf_private.emit_person_event('LumiWithdrew','repertoire',coalesce(v_rep,v_selection.help_id),v_person,v_trace,'s2.v53.1',jsonb_build_object('signal_kind',v_signal,'episode_id',p_episode_id,'decision_run_id',v_withdraw_run,'help_id',v_selection.help_id));
 end if;
 perform gf_private.emit_person_event('LongitudinalSignalRecorded','outcome',v_outcome,v_person,v_trace,'s2.v53.1',jsonb_build_object('signal_kind',v_signal,'effect',v_effect,'episode_id',p_episode_id,'help_id',v_selection.help_id,'repertoire_id',v_rep));
 return jsonb_build_object('outcome_id',v_outcome,'episode_id',p_episode_id,'signal_kind',v_signal,'effect',v_effect,'decision_kind',case when v_signal='NO_REMINDER_NEEDED' then 'WITHDRAW' else null end,'withdraw_decision_run_id',v_withdraw_run,'semantic_key',case when v_signal='NO_REMINDER_NEEDED' then 'continuity.you_have_this' when v_signal='RECOGNIZED_AS_OWN' then 'continuity.becoming_yours' when v_signal='STOPPED_HELPING' then 'continuity.release' else 'continuity.thank_and_learn' end,'trace_id',v_trace);
end $$;

revoke all on function public.lumen_s2_record_longitudinal_signal(uuid,text,uuid) from public;
grant execute on function public.lumen_s2_record_longitudinal_signal(uuid,text,uuid) to authenticated;

create or replace function public.lumen_s1_record_outcome(p_episode_id uuid,p_effect text,p_applied boolean,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_person uuid:=gf_core.current_person_id();v_effect text:=lower(trim(p_effect));v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_selection uuid;v_signal text;
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if v_effect not in('helped','not_helped','unsure') then raise exception 'invalid effect' using errcode='22023';end if;
 select selection_id into v_selection from gf_core.help_selections where episode_id=p_episode_id and person_id=v_person and action='selected' order by created_at desc limit 1;
 if v_selection is null then raise exception 'selected help unavailable' using errcode='42501';end if;
 v_signal:=case v_effect when 'helped' then 'HELPED_NOW' when 'not_helped' then 'NOT_HELPED_NOW' else 'UNKNOWN' end;
 perform set_config('app.trace_id',v_trace::text,true);
 insert into gf_core.outcomes_feedback(episode_id,person_id,selection_id,effect,applied,signal_kind) values(p_episode_id,v_person,v_selection,v_effect,p_applied,v_signal);
 update gf_core.accompaniment_episodes set status='completed',completed_at=now() where episode_id=p_episode_id and person_id=v_person;
 return jsonb_build_object('selection_id',v_selection,'episode_id',p_episode_id,'effect',v_effect,'signal_kind',v_signal,'applied',p_applied,'trace_id',v_trace,'semantic_key','outcome.thank_and_release');
end $$;

create or replace function gf_private.capture_outcome_evidence()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_trace uuid:=gen_random_uuid();v_run gf_core.decision_runs%rowtype;v_selection gf_core.help_selections%rowtype;v_eligible jsonb:='[]'::jsonb;v_exposed jsonb:='[]'::jsonb;v_area_keys text[]:='{}';v_capacity_keys text[]:='{}';v_taxonomy text;v_signal_type text;
begin
 if coalesce((select evidence_use_allowed from gf_core.privacy_preferences where person_id=new.person_id),false) then
   select * into v_selection from gf_core.help_selections where selection_id=new.selection_id and person_id=new.person_id;
   select * into v_run from gf_core.decision_runs where decision_run_id=v_selection.decision_run_id;
   select coalesce(jsonb_agg(jsonb_build_object('help_id',dc.help_id,'help_version_id',dc.help_version_id,'eligibility_status',dc.eligibility_status,'reason_key',dc.reason_key,'priority_hint',dc.priority_hint) order by dc.priority_hint,dc.created_at),'[]'::jsonb) into v_eligible from gf_core.decision_candidates dc where dc.decision_run_id=v_run.decision_run_id;
   select coalesce(jsonb_agg(jsonb_build_object('help_id',ce.help_id,'help_version_id',ce.help_version_id,'display_rank',ce.display_rank) order by ce.display_rank),'[]'::jsonb) into v_exposed from gf_core.candidate_exposures ce where ce.decision_run_id=v_run.decision_run_id;
   select mi.area_keys,mi.capacity_keys,mi.taxonomy_version into v_area_keys,v_capacity_keys,v_taxonomy from gf_core.accompaniment_episodes ae left join lateral(select x.area_keys,x.capacity_keys,x.taxonomy_version from gf_core.moment_interpretations x where x.moment_id=ae.moment_id and x.person_id=new.person_id order by x.created_at desc limit 1) mi on true where ae.episode_id=new.episode_id and ae.person_id=new.person_id;
   if v_taxonomy is null then v_taxonomy:='life-taxonomy.v1'; v_capacity_keys:=array(select jsonb_array_elements_text(coalesce(v_run.continuity_context->'capability_keys','[]'::jsonb))); end if;
   v_signal_type:=case when new.signal_kind in('HELPED_NOW','NOT_HELPED_NOW','UNKNOWN') then 'help_effect' else 'longitudinal_signal' end;
   insert into gf_private.evidence_units(person_pseudonym,source_kind,source_id,signal_type,signal_value,context,contract_version)
   values(new.person_id,'outcome',new.outcome_id,v_signal_type,new.signal_kind,jsonb_build_object('effect',new.effect,'signal_kind',new.signal_kind,'signal_context',new.signal_context,'selection_id',new.selection_id,'help_id',v_selection.help_id,'help_version_id',v_selection.help_version_id,'applied',new.applied,'episode_id',new.episode_id,'decision_run_id',v_run.decision_run_id,'decision_kind',v_run.decision_kind,'policy_version',v_run.policy_version,'interpreter_version',v_run.interpreter_version,'coverage_version',v_run.coverage_version,'coverage_state',v_run.coverage_state,'decision_reason_key',v_run.decision_reason_key,'continuity_context',coalesce(v_run.continuity_context,'{}'::jsonb),'taxonomy_version',v_taxonomy,'area_keys',to_jsonb(coalesce(v_area_keys,'{}'::text[])),'capacity_keys',to_jsonb(coalesce(v_capacity_keys,'{}'::text[])),'eligible_candidates',v_eligible,'exposed_candidates',v_exposed),'evidence.v53.1');
   update gf_core.help_applicability ha set evidence_count=ha.evidence_count+1,last_evidence_at=now(),updated_at=now() where ha.help_version_id=v_selection.help_version_id and ha.taxonomy_version=v_taxonomy and ha.area_key=any(coalesce(v_area_keys,'{}'::text[])) and ha.capacity_key=any(coalesce(v_capacity_keys,'{}'::text[]));
   insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance)
   values('EvidenceUnitCaptured','evidence_unit',new.outcome_id,'system','evidence-capture',new.person_id,v_trace,'s4.v53.1',jsonb_build_object('source_kind','outcome','signal_type',v_signal_type,'signal_kind',new.signal_kind,'effect',new.effect,'selection_id',new.selection_id,'help_id',v_selection.help_id,'help_version_id',v_selection.help_version_id,'decision_run_id',v_run.decision_run_id,'decision_kind',v_run.decision_kind,'taxonomy_version',v_taxonomy),'{}'::jsonb);
 end if;
 return new;
end $$;

-- Keep the existing proactivity API but make cultivation context first-class without creating a second scheduler.
create or replace function public.lumen_s6_schedule_cultivation_followup(p_reason_code text,p_due_at timestamptz,p_trajectory_id uuid,p_help_id uuid,p_repertoire_id uuid,p_capacity_key text,p_cultivation_move text,p_trace_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_person uuid;v_followup uuid;v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());v_reason text:=lower(trim(p_reason_code));v_move text:=upper(trim(coalesce(p_cultivation_move,'')));
begin
 if v_uid is null then raise exception 'authentication required';end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if not coalesce((select proactive_allowed from gf_core.privacy_preferences where person_id=v_person),false) then raise exception 'proactivity consent required' using errcode='42501';end if;
 if coalesce((select custody_blocked from gf_core.proactivity_settings where person_id=v_person),false) then raise exception 'proactivity blocked by custody' using errcode='42501';end if;
 if v_reason not in('trajectory_checkin','practice_return','self_chosen') then raise exception 'invalid reason';end if;
 if v_move not in('REUSE_REPERTOIRE','REPEAT','VARY','APPLY_IN_CONTEXT','REFLECT','INTEGRATE','CONTINUE_PATH') then raise exception 'invalid cultivation move';end if;
 if p_due_at<=now() or p_due_at>now()+interval '90 days' then raise exception 'invalid due time';end if;
 if p_trajectory_id is not null and not exists(select 1 from gf_core.trajectories where trajectory_id=p_trajectory_id and person_id=v_person) then raise exception 'trajectory unavailable';end if;
 if p_help_id is not null and not exists(select 1 from gf_core.help_possibilities where help_id=p_help_id and lifecycle in('active_limited','active')) then raise exception 'help unavailable';end if;
 if p_repertoire_id is not null and not exists(select 1 from gf_core.personal_repertoire where repertoire_id=p_repertoire_id and person_id=v_person and status='active') then raise exception 'repertoire unavailable';end if;
 if p_capacity_key is not null and not exists(select 1 from gf_core.capacity_terms where taxonomy_version='life-taxonomy.v1' and capacity_key=p_capacity_key and status='active') then raise exception 'capacity unavailable';end if;
 insert into gf_core.followups(person_id,reason_code,related_trajectory_id,related_help_id,due_at,cultivation_move,capacity_key,repertoire_id)
 values(v_person,v_reason,p_trajectory_id,p_help_id,p_due_at,v_move,p_capacity_key,p_repertoire_id) returning followup_id into v_followup;
 perform gf_private.emit_person_event('CultivationFollowupScheduled','followup',v_followup,v_person,v_trace,'s6.v53.1',jsonb_build_object('reason_code',v_reason,'due_at',p_due_at,'cultivation_move',v_move,'capacity_key',p_capacity_key,'repertoire_id',p_repertoire_id,'help_id',p_help_id));
 insert into gf_ledger.outbox(event_type,payload,idempotency_key) values('CultivationFollowupScheduled',jsonb_build_object('followup_id',v_followup,'due_at',p_due_at,'cultivation_move',v_move),'followup:cultivation:'||v_followup::text) on conflict(idempotency_key) do nothing;
 return jsonb_build_object('followup_id',v_followup,'reason_code',v_reason,'due_at',p_due_at,'channel','in_app','cultivation_move',v_move,'capacity_key',p_capacity_key,'repertoire_id',p_repertoire_id,'trace_id',v_trace);
end $$;

revoke all on function public.lumen_s6_schedule_cultivation_followup(text,timestamptz,uuid,uuid,uuid,text,text,uuid) from public;
grant execute on function public.lumen_s6_schedule_cultivation_followup(text,timestamptz,uuid,uuid,uuid,text,text,uuid) to authenticated;
