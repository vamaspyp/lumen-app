-- VA+LUMEN A51 · V47 applicability delta
-- Additive/reversible bridge from intent/need matching to Possibility × Area × Capacity.

create table if not exists gf_core.area_terms(
  taxonomy_version text not null,
  area_key text not null,
  display_name text not null,
  status text not null default 'active' check(status in('active','retired')),
  created_at timestamptz not null default now(),
  primary key(taxonomy_version,area_key)
);

create table if not exists gf_core.capacity_terms(
  taxonomy_version text not null,
  capacity_key text not null,
  display_name text not null,
  status text not null default 'active' check(status in('active','retired')),
  created_at timestamptz not null default now(),
  primary key(taxonomy_version,capacity_key)
);

alter table gf_core.area_terms enable row level security;
alter table gf_core.area_terms force row level security;
alter table gf_core.capacity_terms enable row level security;
alter table gf_core.capacity_terms force row level security;
grant select on gf_core.area_terms,gf_core.capacity_terms to authenticated;
create policy area_terms_read on gf_core.area_terms for select to authenticated using(status='active');
create policy capacity_terms_read on gf_core.capacity_terms for select to authenticated using(status='active');

insert into gf_core.area_terms(taxonomy_version,area_key,display_name) values
('v47.taxonomy.v1','general_life','Vida cotidiana'),
('v47.taxonomy.v1','wellbeing','Bienestar y salud cotidiana'),
('v47.taxonomy.v1','relationships','Vínculos'),
('v47.taxonomy.v1','family_care','Familia y cuidado'),
('v47.taxonomy.v1','work','Trabajo'),
('v47.taxonomy.v1','economy','Economía'),
('v47.taxonomy.v1','learning_growth','Aprendizaje y crecimiento'),
('v47.taxonomy.v1','meaning_spirituality','Sentido y espiritualidad')
on conflict do nothing;

insert into gf_core.capacity_terms(taxonomy_version,capacity_key,display_name) values
('v47.taxonomy.v1','discernment','Discernimiento'),
('v47.taxonomy.v1','regulation','Regulación'),
('v47.taxonomy.v1','agency','Agencia'),
('v47.taxonomy.v1','connection','Conexión'),
('v47.taxonomy.v1','self_compassion','Autocompasión'),
('v47.taxonomy.v1','attention','Atención'),
('v47.taxonomy.v1','meaning','Sentido'),
('v47.taxonomy.v1','adaptation','Adaptación'),
('v47.taxonomy.v1','appreciation','Apreciación'),
('v47.taxonomy.v1','integration','Integración')
on conflict do nothing;

alter table gf_core.moment_interpretations
  add column if not exists taxonomy_version text,
  add column if not exists area_keys text[] not null default '{}',
  add column if not exists capacity_keys text[] not null default '{}';

alter table gf_core.coverage_cells
  add column if not exists taxonomy_version text,
  add column if not exists area_key text,
  add column if not exists capacity_key text,
  add column if not exists applicability_confidence numeric(4,3) not null default 0.600 check(applicability_confidence between 0 and 1),
  add column if not exists evidence_count integer not null default 0 check(evidence_count>=0),
  add column if not exists last_evidence_at timestamptz;

update gf_core.coverage_cells
set taxonomy_version='v47.taxonomy.v1',
    area_key=case need_key
      when 'anxiety' then 'wellbeing'
      when 'emotion_regulation' then 'wellbeing'
      when 'energy' then 'wellbeing'
      when 'pause' then 'wellbeing'
      when 'self_compassion' then 'wellbeing'
      when 'sleep' then 'wellbeing'
      when 'boundaries' then 'relationships'
      when 'connection' then 'relationships'
      when 'grief' then 'relationships'
      when 'relationship_repair' then 'relationships'
      when 'caregiving' then 'family_care'
      when 'work_stress' then 'work'
      when 'financial_calm' then 'economy'
      when 'focus' then 'learning_growth'
      when 'meaning' then 'meaning_spirituality'
      else 'general_life'
    end,
    capacity_key=case need_key
      when 'agency' then 'agency'
      when 'anxiety' then 'regulation'
      when 'appreciation' then 'appreciation'
      when 'boundaries' then 'agency'
      when 'caregiving' then 'self_compassion'
      when 'change_transition' then 'adaptation'
      when 'clarity' then 'discernment'
      when 'confidence' then 'agency'
      when 'connection' then 'connection'
      when 'emotion_regulation' then 'regulation'
      when 'energy' then 'agency'
      when 'financial_calm' then 'discernment'
      when 'focus' then 'attention'
      when 'grief' then 'integration'
      when 'habit' then 'agency'
      when 'meaning' then 'meaning'
      when 'pause' then 'regulation'
      when 'relationship_repair' then 'connection'
      when 'self_compassion' then 'self_compassion'
      when 'sleep' then 'regulation'
      when 'work_stress' then 'regulation'
      else 'discernment'
    end,
    applicability_confidence=case when status='covered' then 0.650 else 0.500 end,
    contract_version='coverage.v4'
where taxonomy_version is null or area_key is null or capacity_key is null or contract_version<>'coverage.v4';

alter table gf_core.coverage_cells alter column taxonomy_version set not null;
alter table gf_core.coverage_cells alter column area_key set not null;
alter table gf_core.coverage_cells alter column capacity_key set not null;

alter table gf_core.coverage_cells
  add constraint coverage_area_term_fk foreign key(taxonomy_version,area_key)
    references gf_core.area_terms(taxonomy_version,area_key),
  add constraint coverage_capacity_term_fk foreign key(taxonomy_version,capacity_key)
    references gf_core.capacity_terms(taxonomy_version,capacity_key);

create index if not exists idx_coverage_applicability
  on gf_core.coverage_cells(area_key,capacity_key,status,locale_pattern,priority_hint);
create index if not exists idx_moment_interpretation_area_keys on gf_core.moment_interpretations using gin(area_keys);
create index if not exists idx_moment_interpretation_capacity_keys on gf_core.moment_interpretations using gin(capacity_keys);

create or replace function gf_core.v47_orientation_bridge(p_intent text,p_needs text[])
returns jsonb language sql immutable security invoker set search_path=''
as $$
  with mapped as (
    select distinct
      case n
        when 'anxiety' then 'wellbeing'
        when 'emotion_regulation' then 'wellbeing'
        when 'energy' then 'wellbeing'
        when 'pause' then 'wellbeing'
        when 'self_compassion' then 'wellbeing'
        when 'sleep' then 'wellbeing'
        when 'boundaries' then 'relationships'
        when 'connection' then 'relationships'
        when 'grief' then 'relationships'
        when 'relationship_repair' then 'relationships'
        when 'caregiving' then 'family_care'
        when 'work_stress' then 'work'
        when 'financial_calm' then 'economy'
        when 'focus' then 'learning_growth'
        when 'meaning' then 'meaning_spirituality'
        else 'general_life'
      end as area_key,
      case n
        when 'agency' then 'agency'
        when 'anxiety' then 'regulation'
        when 'appreciation' then 'appreciation'
        when 'boundaries' then 'agency'
        when 'caregiving' then 'self_compassion'
        when 'change_transition' then 'adaptation'
        when 'clarity' then 'discernment'
        when 'confidence' then 'agency'
        when 'connection' then 'connection'
        when 'emotion_regulation' then 'regulation'
        when 'energy' then 'agency'
        when 'financial_calm' then 'discernment'
        when 'focus' then 'attention'
        when 'grief' then 'integration'
        when 'habit' then 'agency'
        when 'meaning' then 'meaning'
        when 'pause' then 'regulation'
        when 'relationship_repair' then 'connection'
        when 'self_compassion' then 'self_compassion'
        when 'sleep' then 'regulation'
        when 'work_stress' then 'regulation'
        when 'human_support' then 'connection'
        else 'discernment'
      end as capacity_key
    from unnest(coalesce(p_needs,'{}'::text[])) n
  )
  select jsonb_build_object(
    'taxonomy_version','v47.taxonomy.v1',
    'area_keys',coalesce((select jsonb_agg(distinct area_key order by area_key) from mapped),'[]'::jsonb),
    'capacity_keys',coalesce((select jsonb_agg(distinct capacity_key order by capacity_key) from mapped),'[]'::jsonb),
    'bridge_version','v47.bridge.v1',
    'legacy_intent_key',p_intent,
    'legacy_need_keys',to_jsonb(coalesce(p_needs,'{}'::text[]))
  );
$$;
revoke execute on function gf_core.v47_orientation_bridge(text,text[]) from public,anon;
grant execute on function gf_core.v47_orientation_bridge(text,text[]) to authenticated;

create or replace function public.lumen_s1_accompany_moment_v47_core(
  p_expression text,p_locale text,p_language text,p_surface text,p_trace_id uuid
)
returns jsonb language plpgsql security invoker set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_person uuid;
  v_trace uuid:=coalesce(p_trace_id,gen_random_uuid());
  v_expression text:=trim(coalesce(p_expression,''));
  v_interp jsonb;
  v_orientation jsonb;
  v_moment uuid;
  v_episode uuid;
  v_run uuid;
  v_needs text[];
  v_intent text;
  v_areas text[]:='{}';
  v_capacities text[]:='{}';
  v_safety text;
  v_candidate_count integer:=0;
  v_primary jsonb;
  v_alt jsonb;
  v_rank integer:=0;
  v_memory boolean:=false;
  v_context jsonb:='{}'::jsonb;
  v_active_trajectory_ids jsonb:='[]'::jsonb;
  v_repertoire_help_ids jsonb:='[]'::jsonb;
  v_repertoire_available boolean:=false;
  r record;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'persistent accompaniment requires a non-anonymous account' using errcode='42501'; end if;
  if char_length(v_expression)=0 or char_length(v_expression)>4000 then raise exception 'expression must contain 1..4000 characters' using errcode='22023'; end if;

  perform set_config('app.trace_id',v_trace::text,true);
  perform public.lumen_bootstrap_person(v_trace);
  v_person:=gf_core.current_person_id();
  if v_person is null then raise exception 'person unavailable'; end if;

  select coalesce(memory_allowed,false) into v_memory from gf_core.privacy_preferences where person_id=v_person;
  if v_memory then
    select coalesce(jsonb_agg(trajectory_id order by updated_at desc),'[]'::jsonb) into v_active_trajectory_ids
      from gf_core.trajectories where person_id=v_person and status='active';
    select coalesce(jsonb_agg(help_id order by updated_at desc),'[]'::jsonb) into v_repertoire_help_ids
      from gf_core.personal_repertoire where person_id=v_person and status='active';
  end if;

  insert into gf_core.moments(person_id,locale,language,surface,expression_length,original_retention)
  values(v_person,coalesce(nullif(trim(p_locale),''),'es-AR'),coalesce(nullif(trim(p_language),''),'es'),coalesce(nullif(trim(p_surface),''),'web'),char_length(v_expression),'ephemeral')
  returning moment_id into v_moment;

  v_interp:=gf_core.s1_interpret(v_expression);
  v_safety:=v_interp->>'safety_state';
  v_intent:=v_interp->>'intent_key';
  v_needs:=array(select jsonb_array_elements_text(v_interp->'need_keys'));
  v_orientation:=gf_core.v47_orientation_bridge(v_intent,v_needs);
  v_areas:=array(select jsonb_array_elements_text(v_orientation->'area_keys'));
  v_capacities:=array(select jsonb_array_elements_text(v_orientation->'capacity_keys'));

  v_context:=jsonb_build_object(
    'memory_used',v_memory,
    'active_trajectory_ids',v_active_trajectory_ids,
    'repertoire_help_ids',v_repertoire_help_ids,
    'taxonomy_version','v47.taxonomy.v1',
    'area_keys',to_jsonb(v_areas),
    'capacity_keys',to_jsonb(v_capacities),
    'orientation_bridge','v47.bridge.v1'
  );

  insert into gf_core.moment_interpretations(
    moment_id,person_id,interpreter_version,intent_key,need_keys,confidence,uncertainty_key,
    requires_clarification,safety_state,features,taxonomy_version,area_keys,capacity_keys
  ) values(
    v_moment,v_person,'rules.v3+v47.bridge.v1',v_intent,v_needs,(v_interp->>'confidence')::numeric,
    v_interp->>'uncertainty_key',coalesce((v_interp->>'requires_clarification')::boolean,false),v_safety,
    coalesce(v_interp->'features','{}'::jsonb),'v47.taxonomy.v1',v_areas,v_capacities
  );

  if coalesce((v_interp->>'requires_clarification')::boolean,false) then
    insert into gf_core.accompaniment_episodes(person_id,moment_id,status) values(v_person,v_moment,'clarification_needed') returning episode_id into v_episode;
    update gf_core.moments set status='clarification_needed' where moment_id=v_moment;
    return jsonb_build_object(
      'scene_id','moment.clarify','scene_version','s1.v4','presence_mode','P3','human_intent',v_intent,
      'episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,
      'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','clarify.more_context')),
      'available_actions',jsonb_build_array(jsonb_build_object('id','tell_more','intent','continue_expression')),
      'safety',jsonb_build_object('state',v_safety),'coverage',jsonb_build_object('state','unknown'),
      'interpretation',jsonb_build_object('intent_key',v_intent,'area_keys',to_jsonb(v_areas),'capacity_keys',to_jsonb(v_capacities),'confidence',v_interp->'confidence','uncertainty_key',v_interp->'uncertainty_key')
    );
  end if;

  insert into gf_core.accompaniment_episodes(person_id,moment_id,status)
  values(v_person,v_moment,case when v_safety='blocked' then 'no_match' else 'proposed' end)
  returning episode_id into v_episode;

  if v_safety='blocked' then
    insert into gf_core.no_match_events(episode_id,person_id,reason_code,coverage_state,coverage_gap)
    values(v_episode,v_person,'safety_scope','restricted',false);
    update gf_core.moments set status='decided' where moment_id=v_moment;
    return jsonb_build_object(
      'scene_id','moment.safety_referral','scene_version','s1.v4','presence_mode','P4','human_intent','seek_support',
      'episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,
      'semantic_blocks',jsonb_build_array(jsonb_build_object('type','safety_referral','semantic_key','safety.human_help_now')),
      'available_actions',jsonb_build_array(jsonb_build_object('id','seek_human_help','intent','seek_human_help'),jsonb_build_object('id','close','intent','close')),
      'safety',jsonb_build_object('state','blocked'),'coverage',jsonb_build_object('state','restricted','reason','safety_scope')
    );
  end if;

  select count(distinct hp.help_id) into v_candidate_count
  from gf_core.coverage_cells cc
  join gf_core.help_possibilities hp on hp.help_id=cc.help_id
  where hp.lifecycle in('active_limited','active')
    and cc.status in('covered','partial')
    and cc.area_key=any(v_areas)
    and cc.capacity_key=any(v_capacities)
    and (cc.locale_pattern='*' or coalesce(nullif(trim(p_locale),''),'es-AR') like replace(cc.locale_pattern,'*','%'));

  if v_candidate_count=0 then
    insert into gf_core.no_match_events(episode_id,person_id,reason_code,coverage_state,coverage_gap)
    values(v_episode,v_person,'no_sufficient_applicability','not_covered',true);
    update gf_core.accompaniment_episodes set status='no_match',completed_at=now() where episode_id=v_episode;
    update gf_core.moments set status='decided' where moment_id=v_moment;
    return jsonb_build_object(
      'scene_id','moment.no_match','scene_version','s1.v4','presence_mode','P2','human_intent',v_intent,
      'episode_id',v_episode,'moment_id',v_moment,'trace_id',v_trace,
      'semantic_blocks',jsonb_build_array(jsonb_build_object('type','lumi_line','semantic_key','no_match.honest')),
      'available_actions',jsonb_build_array(jsonb_build_object('id','rephrase','intent','rephrase'),jsonb_build_object('id','close','intent','close')),
      'safety',jsonb_build_object('state','clear'),'coverage',jsonb_build_object('state','not_covered','reason','no_sufficient_applicability'),
      'interpretation',jsonb_build_object('intent_key',v_intent,'area_keys',to_jsonb(v_areas),'capacity_keys',to_jsonb(v_capacities),'confidence',v_interp->'confidence')
    );
  end if;

  if v_memory then
    select exists(
      select 1 from gf_core.personal_repertoire pr
      join gf_core.coverage_cells cc on cc.help_id=pr.help_id
      join gf_core.help_possibilities hp on hp.help_id=pr.help_id
      where pr.person_id=v_person and pr.status='active' and hp.lifecycle in('active_limited','active')
        and cc.status in('covered','partial') and cc.area_key=any(v_areas) and cc.capacity_key=any(v_capacities)
        and (cc.locale_pattern='*' or coalesce(nullif(trim(p_locale),''),'es-AR') like replace(cc.locale_pattern,'*','%'))
    ) into v_repertoire_available;
  end if;

  insert into gf_core.decision_runs(
    episode_id,person_id,policy_version,interpreter_version,coverage_version,safety_state,
    coverage_state,eligible_count,decision_reason_key,continuity_context
  ) values(
    v_episode,v_person,'decision.v4','rules.v3+v47.bridge.v1','coverage.v4',v_safety,'covered',v_candidate_count,
    case when v_repertoire_available then 'continuity_repertoire_available' else 'area_capacity_applicability_match' end,v_context
  ) returning decision_run_id into v_run;

  for r in
    with eligible as (
      select hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hl.title,hl.summary,hl.content_payload,
             hv.duration_minutes,hv.energy,hv.detail,
             min(case when cc.area_key=any(v_areas) and cc.capacity_key=any(v_capacities) then 0 else 1 end) applicability_rank,
             min(case when cc.intent_key=v_intent then 0 when cc.intent_key is null then 1 else 2 end) intent_rank,
             min(case cc.status when 'covered' then 0 else 1 end) status_rank,
             min(cc.priority_hint) priority_hint,
             max(cc.applicability_confidence) applicability_confidence,
             case when v_memory and exists(
               select 1 from gf_core.personal_repertoire pr where pr.person_id=v_person and pr.help_id=hp.help_id and pr.status='active'
             ) then 0 else 1 end repertoire_rank
      from gf_core.coverage_cells cc
      join gf_core.help_possibilities hp on hp.help_id=cc.help_id
      join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version
      join lateral(
        select hloc.* from gf_core.help_localizations hloc where hloc.help_version_id=hv.help_version_id
        order by case when hloc.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0
                      when left(hloc.locale,2)=left(coalesce(nullif(trim(p_language),''),'es'),2) then 1
                      when hloc.locale='es-AR' then 2 else 3 end limit 1
      ) hl on true
      where hp.lifecycle in('active_limited','active') and cc.status in('covered','partial')
        and cc.area_key=any(v_areas) and cc.capacity_key=any(v_capacities)
        and (cc.locale_pattern='*' or coalesce(nullif(trim(p_locale),''),'es-AR') like replace(cc.locale_pattern,'*','%'))
      group by hp.help_id,hv.help_version_id,hp.help_type,hp.canonical_code,hl.title,hl.summary,hl.content_payload,hv.duration_minutes,hv.energy,hv.detail
    )
    select * from eligible
    order by repertoire_rank,applicability_rank,intent_rank,status_rank,priority_hint,canonical_code limit 2
  loop
    v_rank:=v_rank+1;
    insert into gf_core.decision_candidates(decision_run_id,person_id,help_id,help_version_id,eligibility_status,reason_key,priority_hint)
    values(
      v_run,v_person,r.help_id,r.help_version_id,'eligible',
      case when r.repertoire_rank=0 then 'own_repertoire_relevant'
           when r.intent_rank=0 then 'area_capacity_plus_legacy_intent'
           else 'area_capacity_applicability' end,
      r.priority_hint
    );
    insert into gf_core.candidate_exposures(decision_run_id,person_id,help_id,help_version_id,display_rank)
    values(v_run,v_person,r.help_id,r.help_version_id,v_rank);

    if v_rank=1 then
      v_primary:=jsonb_build_object(
        'help_id',r.help_id,'help_version_id',r.help_version_id,'help_type',r.help_type,'title',r.title,'summary',r.summary,
        'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail,
        'from_own_repertoire',r.repertoire_rank=0,'applicability_confidence',r.applicability_confidence
      );
    elsif v_rank=2 then
      v_alt:=jsonb_build_object(
        'help_id',r.help_id,'help_version_id',r.help_version_id,'help_type',r.help_type,'title',r.title,'summary',r.summary,
        'content',r.content_payload,'duration_minutes',r.duration_minutes,'energy',r.energy,'detail',r.detail,
        'from_own_repertoire',r.repertoire_rank=0,'applicability_confidence',r.applicability_confidence
      );
    end if;
  end loop;

  update gf_core.moments set status='decided' where moment_id=v_moment;
  return jsonb_build_object(
    'scene_id','moment.help','scene_version','s1.v4','presence_mode','P2','human_intent',v_intent,
    'episode_id',v_episode,'moment_id',v_moment,'decision_run_id',v_run,'trace_id',v_trace,
    'semantic_blocks',jsonb_build_array(
      jsonb_build_object('type','lumi_line','semantic_key','help.offer_humble'),
      jsonb_build_object('type','help_preview','primary',v_primary,'alternative',v_alt),
      jsonb_build_object('type','continuity_hint','semantic_key',case when coalesce((v_primary->>'from_own_repertoire')::boolean,false) then 'continuity.own_repertoire' else 'continuity.none' end)
    ),
    'available_actions',jsonb_build_array(
      jsonb_build_object('id','try_primary','intent','select_help','payload',jsonb_build_object('help_id',v_primary->>'help_id')),
      jsonb_build_object('id','not_this','intent','reject_help')
    ),
    'safety',jsonb_build_object('state','clear'),'coverage',jsonb_build_object('state','covered'),
    'interpretation',jsonb_build_object('intent_key',v_intent,'area_keys',to_jsonb(v_areas),'capacity_keys',to_jsonb(v_capacities),'confidence',v_interp->'confidence','uncertainty_key',v_interp->'uncertainty_key'),
    'continuity',jsonb_build_object('memory_used',v_memory,'own_repertoire_reused',coalesce((v_primary->>'from_own_repertoire')::boolean,false),'active_trajectory_count',jsonb_array_length(v_active_trajectory_ids)),
    'delivery',jsonb_build_object('pattern','prepare_possibility_integrate','optional',true,'prepare_semantic_key','help.offer_humble','integrate_semantic_key','outcome.thank_and_release')
  );
end $$;
revoke execute on function public.lumen_s1_accompany_moment_v47_core(text,text,text,text,uuid) from public,anon;
grant execute on function public.lumen_s1_accompany_moment_v47_core(text,text,text,text,uuid) to authenticated;

create or replace function public.lumen_s1_accompany_moment_v4(
  p_expression text,p_locale text,p_language text,p_surface text,p_trace_id uuid
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_scene jsonb;
  v_moment uuid;
  v_person uuid;
  v_expression text:=trim(coalesce(p_expression,''));
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'persistent accompaniment requires a non-anonymous account' using errcode='42501'; end if;
  if char_length(v_expression) not between 1 and 4000 then raise exception 'expression must contain 1..4000 characters' using errcode='22023'; end if;

  v_scene:=public.lumen_s1_accompany_moment_v47_core(v_expression,p_locale,p_language,p_surface,p_trace_id);
  v_moment:=nullif(v_scene->>'moment_id','')::uuid;
  v_person:=gf_core.current_person_id();
  if v_moment is null or v_person is null then raise exception 'moment/person unavailable after accompaniment'; end if;

  insert into gf_private.moment_originals(moment_id,person_id,expression_text)
  values(v_moment,v_person,v_expression)
  on conflict(moment_id) do update set expression_text=excluded.expression_text,updated_at=now(),revision=gf_private.moment_originals.revision+1;

  update gf_core.moments set original_retention='private_ref',contract_version='s1.v4',revision=revision+1
  where moment_id=v_moment and person_id=v_person;

  perform gf_private.emit_person_event(
    'MomentOriginalPreserved','moment',v_moment,v_person,coalesce(p_trace_id,(v_scene->>'trace_id')::uuid),'s1.v4',
    jsonb_build_object('original_retention','private_ref','retention_policy','private_reclassifiable.v1')
  );

  return v_scene||jsonb_build_object('privacy',jsonb_build_object('original_retention','private_ref','retention_policy','private_reclassifiable.v1','shared_learning',false));
end $$;
revoke execute on function public.lumen_s1_accompany_moment_v4(text,text,text,text,uuid) from public,anon;
grant execute on function public.lumen_s1_accompany_moment_v4(text,text,text,text,uuid) to authenticated;

create or replace function public.lumen_source_discover(
  p_need_key text default null,p_help_type text default null,p_locale text default 'es-AR',p_limit integer default 24
)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_result jsonb;v_limit integer:=greatest(1,least(coalesce(p_limit,24),50));v_external_boost integer:=0;
begin
  select coalesce((config->>'external_boost')::integer,0) into v_external_boost from gf_private.runtime_policies where policy_key='source_discovery';
  select coalesce(jsonb_agg(x.item order by x.effective_priority,x.title),'[]'::jsonb) into v_result
  from (
    select min(cc.priority_hint)+case when pr.provider_kind='internal_curated' then 0 else v_external_boost end effective_priority,
           hl.title,
           jsonb_build_object(
             'help_id',hp.help_id,'canonical_code',hp.canonical_code,'help_type',hp.help_type,'lifecycle',hp.lifecycle,
             'risk_class',hp.risk_class,'evidence_class',hp.evidence_class,'title',hl.title,'summary',hl.summary,
             'content',hl.content_payload,'duration_minutes',hv.duration_minutes,'energy',hv.energy,
             'provider',jsonb_build_object('name',pr.display_name,'kind',pr.provider_kind,'provenance',pr.provenance,'rights',pr.rights),
             'areas',coalesce(jsonb_agg(distinct cc.area_key) filter(where cc.area_key is not null),'[]'::jsonb),
             'capacities',coalesce(jsonb_agg(distinct cc.capacity_key) filter(where cc.capacity_key is not null),'[]'::jsonb),
             'needs',coalesce(jsonb_agg(distinct cc.need_key) filter(where cc.need_key is not null),'[]'::jsonb),
             'taxonomy_version','v47.taxonomy.v1','localization_provenance',hl.provenance
           ) item
    from gf_core.help_possibilities hp
    join gf_core.providers pr on pr.provider_id=hp.provider_id
    join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version
    join lateral(
      select h.* from gf_core.help_localizations h where h.help_version_id=hv.help_version_id
      order by case when h.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0
                    when left(h.locale,2)=left(coalesce(nullif(trim(p_locale),''),'es-AR'),2) then 1
                    when h.locale='es-AR' then 2 else 3 end limit 1
    ) hl on true
    left join gf_core.coverage_cells cc on cc.help_id=hp.help_id and cc.status in('covered','partial')
    where hp.lifecycle in('active_limited','active') and (p_help_type is null or hp.help_type=p_help_type)
      and (p_need_key is null or exists(select 1 from gf_core.coverage_cells c2 where c2.help_id=hp.help_id and c2.need_key=p_need_key and c2.status in('covered','partial')))
    group by hp.help_id,hp.canonical_code,hp.help_type,hp.lifecycle,hp.risk_class,hp.evidence_class,hv.help_version_id,
             hv.duration_minutes,hv.energy,hl.title,hl.summary,hl.content_payload,hl.provenance,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
    order by effective_priority,hl.title limit v_limit
  ) x;
  return v_result;
end $$;

create or replace function gf_private.capture_outcome_evidence()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  v_trace uuid:=gen_random_uuid();
  v_run gf_core.decision_runs%rowtype;
  v_eligible jsonb:='[]'::jsonb;
  v_exposed jsonb:='[]'::jsonb;
  v_area_keys text[]:='{}';
  v_capacity_keys text[]:='{}';
  v_taxonomy text;
begin
  if coalesce((select evidence_use_allowed from gf_core.privacy_preferences where person_id=new.person_id),false) then
    select * into v_run from gf_core.decision_runs where episode_id=new.episode_id and person_id=new.person_id order by created_at desc limit 1;
    if v_run.decision_run_id is not null then
      select coalesce(jsonb_agg(jsonb_build_object('help_id',dc.help_id,'help_version_id',dc.help_version_id,'eligibility_status',dc.eligibility_status,'reason_key',dc.reason_key,'priority_hint',dc.priority_hint) order by dc.priority_hint,dc.created_at),'[]'::jsonb)
      into v_eligible from gf_core.decision_candidates dc where dc.decision_run_id=v_run.decision_run_id;
      select coalesce(jsonb_agg(jsonb_build_object('help_id',ce.help_id,'help_version_id',ce.help_version_id,'display_rank',ce.display_rank) order by ce.display_rank),'[]'::jsonb)
      into v_exposed from gf_core.candidate_exposures ce where ce.decision_run_id=v_run.decision_run_id;
    end if;

    select mi.area_keys,mi.capacity_keys,mi.taxonomy_version
      into v_area_keys,v_capacity_keys,v_taxonomy
    from gf_core.accompaniment_episodes ae
    join lateral(
      select x.area_keys,x.capacity_keys,x.taxonomy_version
      from gf_core.moment_interpretations x
      where x.moment_id=ae.moment_id and x.person_id=new.person_id
      order by x.created_at desc limit 1
    ) mi on true
    where ae.episode_id=new.episode_id and ae.person_id=new.person_id;

    insert into gf_private.evidence_units(person_pseudonym,source_kind,source_id,signal_type,signal_value,context,contract_version)
    values(
      new.person_id,'outcome',new.outcome_id,'help_effect',new.effect,
      jsonb_build_object(
        'help_id',new.help_id,'applied',new.applied,'episode_id',new.episode_id,'decision_run_id',v_run.decision_run_id,
        'policy_version',v_run.policy_version,'interpreter_version',v_run.interpreter_version,'coverage_version',v_run.coverage_version,
        'coverage_state',v_run.coverage_state,'decision_reason_key',v_run.decision_reason_key,'continuity_context',coalesce(v_run.continuity_context,'{}'::jsonb),
        'taxonomy_version',v_taxonomy,'area_keys',to_jsonb(coalesce(v_area_keys,'{}'::text[])),'capacity_keys',to_jsonb(coalesce(v_capacity_keys,'{}'::text[])),
        'eligible_candidates',v_eligible,'exposed_candidates',v_exposed
      ),'evidence.v3'
    );

    update gf_core.coverage_cells cc
      set evidence_count=cc.evidence_count+1,last_evidence_at=now()
    where cc.help_id=new.help_id
      and cc.area_key=any(coalesce(v_area_keys,'{}'::text[]))
      and cc.capacity_key=any(coalesce(v_capacity_keys,'{}'::text[]));

    insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance)
    values(
      'EvidenceUnitCaptured','evidence_unit',new.outcome_id,'system','evidence-capture',new.person_id,v_trace,'s4.v3',
      jsonb_build_object('source_kind','outcome','effect',new.effect,'help_id',new.help_id,'decision_run_id',v_run.decision_run_id,'taxonomy_version',v_taxonomy),
      '{}'::jsonb
    );
  end if;
  return new;
end $$;

update gf_private.runtime_policies
set version=2,
    config=jsonb_set(jsonb_set(jsonb_set(config,'{status}','"reconciling"'::jsonb,true),'{authority_set}','["V46","V47","V40","V41","V43"]'::jsonb,true),'{certification_act}','"A51"'::jsonb,true),
    updated_at=now()
where policy_key='canonical_integrity';

create or replace function public.lumen_embryo_health()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare
  v_source integer;v_coverage integer;v_types integer;v_policy integer;v_provider_ready integer;
  v_integrity_status text;v_integrity_version integer;v_authority_set jsonb;v_state text;v_applicability integer;
begin
  select count(*) into v_source from gf_core.help_possibilities where lifecycle in('active_limited','active');
  select count(*) into v_coverage from gf_core.coverage_cells where status in('covered','partial');
  select count(*) into v_applicability from gf_core.coverage_cells where status in('covered','partial') and area_key is not null and capacity_key is not null;
  select count(distinct help_type) into v_types from gf_core.help_possibilities where lifecycle in('active_limited','active');
  select version into v_policy from gf_private.runtime_policies where policy_key='source_discovery';
  select count(*) into v_provider_ready from gf_private.provider_runtime_status where status='ready';
  select config->>'status',version,config->'authority_set' into v_integrity_status,v_integrity_version,v_authority_set from gf_private.runtime_policies where policy_key='canonical_integrity';
  v_integrity_status:=coalesce(v_integrity_status,'uncertified');
  v_authority_set:=coalesce(v_authority_set,'[]'::jsonb);
  v_state:=case when v_source>=16 and v_coverage>=18 and v_applicability=v_coverage and v_types>=4 and v_integrity_status='certified' then 'operational' else 'forming' end;
  return jsonb_build_object(
    'state',v_state,'release_contract','embryo.v1.0',
    'slices',jsonb_build_object('s0','implemented','s1','implemented','s2','implemented','s3','implemented','s4','implemented','s5','implemented','s6','implemented','s7','implemented'),
    'canonical_integrity',jsonb_build_object('status',v_integrity_status,'version',v_integrity_version,'authority_set',v_authority_set),
    'source',jsonb_build_object('active_possibilities',v_source,'coverage_cells',v_coverage,'applicability_cells',v_applicability,'semantic_types',v_types,'taxonomy_version','v47.taxonomy.v1'),
    'evolution',jsonb_build_object('source_policy_version',coalesce(v_policy,1)),
    'operations',jsonb_build_object('providers_ready',v_provider_ready),'prelaunch_reset_required',true
  );
end $$;
