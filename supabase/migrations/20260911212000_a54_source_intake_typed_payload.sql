-- A54 · Source autopoiesis must admit the common HelpPossibility envelope,
-- not only external resources. External resources require a URL; native types
-- carry typed content_payload. One intake pipeline, no per-type ontology.

create or replace function gf_private.activate_source_intake(
  p_intake_id uuid,
  p_reviewer text,
  p_target_lifecycle text default 'active_limited'
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  r gf_private.source_intake_candidates%rowtype;
  v_provider uuid;
  v_help uuid;
  v_version uuid;
  v_state text := lower(trim(p_target_lifecycle));
  v_app jsonb;
  v_area text;
  v_cap text;
  v_app_state text;
  v_content jsonb;
  v_detail jsonb;
  v_external_url text;
begin
  if v_state not in('active_limited','active') then
    raise exception 'invalid target lifecycle';
  end if;

  select * into r
  from gf_private.source_intake_candidates
  where intake_id=p_intake_id
  for update;

  if r.intake_id is null or r.status not in('received','review') then
    raise exception 'intake unavailable';
  end if;

  if not (r.candidate ? 'title' and r.candidate ? 'summary' and r.candidate ? 'locale' and r.candidate ? 'applicability')
     or jsonb_typeof(r.candidate->'applicability') <> 'array' then
    raise exception 'candidate incomplete';
  end if;

  v_external_url := nullif(trim(r.candidate->>'external_url'),'');
  v_content := coalesce(r.candidate->'content_payload','{}'::jsonb);

  if r.help_type='external_resource' then
    if v_external_url is null then
      raise exception 'external resource requires external_url';
    end if;
    v_content := v_content || jsonb_build_object(
      'external_url',v_external_url,
      'cta_label',coalesce(r.candidate->>'cta_label','Abrir recurso')
    );
  elsif v_content='{}'::jsonb then
    raise exception 'native possibility requires content_payload';
  end if;

  select provider_id into v_provider
  from gf_core.providers
  where provider_code=r.provider_code;

  if v_provider is null then
    raise exception 'provider not registered';
  end if;

  insert into gf_core.help_possibilities(
    canonical_code,help_type,provider_id,lifecycle,risk_class,evidence_class,conflict_note
  )
  values(
    r.canonical_code,r.help_type,v_provider,v_state,
    coalesce(r.candidate->>'risk_class','low'),
    coalesce(r.candidate->>'evidence_class',case when r.help_type='external_resource' then 'external_curated' else 'practice_based' end),
    r.candidate->>'conflict_note'
  )
  returning help_id into v_help;

  v_detail := coalesce(r.candidate->'detail','{}'::jsonb)
    || jsonb_build_object('source_kind',case when r.help_type='external_resource' then 'external' else 'native' end);
  if v_external_url is not null then
    v_detail := v_detail || jsonb_build_object('external_url',v_external_url);
  end if;

  insert into gf_core.help_versions(
    help_id,version,mechanism_key,detail,duration_minutes,energy,accessibility
  )
  values(
    v_help,1,coalesce(r.candidate->>'mechanism_key',r.help_type),v_detail,
    nullif(r.candidate->>'duration_minutes','')::integer,
    nullif(r.candidate->>'energy',''),
    coalesce(r.candidate->'accessibility','{}'::jsonb)
  )
  returning help_version_id into v_version;

  insert into gf_core.help_localizations(
    help_version_id,locale,title,summary,content_payload,cultural_scope,provenance
  )
  values(
    v_version,
    r.candidate->>'locale',
    r.candidate->>'title',
    r.candidate->>'summary',
    v_content,
    coalesce(array(select jsonb_array_elements_text(coalesce(r.candidate->'cultural_scope','[]'::jsonb))),'{}'),
    coalesce(r.candidate->'provenance','{}'::jsonb)
      || jsonb_build_object(
        'provider_code',r.provider_code,
        'reviewed_by',p_reviewer,
        'source_url',v_external_url
      )
  );

  for v_app in select * from jsonb_array_elements(r.candidate->'applicability') loop
    v_area := v_app->>'area_key';
    v_cap := v_app->>'capacity_key';
    v_app_state := coalesce(v_app->>'state','partial');

    if v_app_state not in('applicable','partial','restricted') then
      raise exception 'invalid applicability state';
    end if;
    if not exists(select 1 from gf_core.area_terms where taxonomy_version='life-taxonomy.v1' and area_key=v_area and status='active') then
      raise exception 'unknown area %',v_area;
    end if;
    if not exists(select 1 from gf_core.capacity_terms where taxonomy_version='life-taxonomy.v1' and capacity_key=v_cap and status='active') then
      raise exception 'unknown capacity %',v_cap;
    end if;

    insert into gf_core.help_applicability(
      help_version_id,taxonomy_version,area_key,capacity_key,state,
      priority_hint,applicability_confidence,provenance
    )
    values(
      v_version,'life-taxonomy.v1',v_area,v_cap,v_app_state,
      coalesce((v_app->>'priority_hint')::smallint,50),
      coalesce((v_app->>'confidence')::numeric,0.500),
      jsonb_build_object('source','source_intake','reviewed_by',p_reviewer)
    );
  end loop;

  insert into gf_core.source_lifecycle_events(help_id,from_state,to_state,reason_key,actor_ref)
  values(v_help,'candidate',v_state,'curation_accepted',p_reviewer);

  update gf_private.source_intake_candidates
  set status='accepted',reviewed_by=p_reviewer,review_note='activated',updated_at=now()
  where intake_id=p_intake_id;

  insert into gf_ledger.domain_events(
    event_type,aggregate_type,aggregate_id,actor_type,actor_id,
    trace_id,contract_version,payload,provenance
  )
  values(
    'SourcePossibilityActivated','help_possibility',v_help,'operator',p_reviewer,
    gen_random_uuid(),'s3.v49.1',
    jsonb_build_object(
      'canonical_code',r.canonical_code,'help_type',r.help_type,
      'lifecycle',v_state,'provider_code',r.provider_code
    ),
    jsonb_build_object('intake_id',p_intake_id)
  );

  return v_help;
end
$function$;
