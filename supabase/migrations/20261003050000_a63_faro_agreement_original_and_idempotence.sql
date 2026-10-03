-- A63: preserve original expression and avoid duplicate unchanged agreement versions.
create or replace function public.lumen_faro_agreement_snapshot(p_trajectory_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();v_faro gf_core.trajectories;v_version gf_private.faro_agreement_versions;v_items jsonb;v_history jsonb;
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then return jsonb_build_object('state','without_memory','version',0,'items','[]'::jsonb,'history','[]'::jsonb);end if;
 select * into v_faro from gf_core.trajectories where trajectory_id=p_trajectory_id and person_id=v_person;
 if not found then raise exception 'Faro unavailable' using errcode='P0002';end if;
 select * into v_version from gf_private.faro_agreement_versions where trajectory_id=p_trajectory_id and person_id=v_person order by version desc limit 1;
 select coalesce(jsonb_agg(jsonb_build_object('identity_id',i.identity_id,'concept_id',i.concept_id,'label',i.label,'definition',i.definition,'contextual_meaning',i.contextual_meaning,'origin',i.origin,'status',i.status,'source_status',c.editorial_status) order by i.position),'[]'::jsonb) into v_items from gf_private.faro_agreement_items i left join gf_core.potential_concepts c on c.concept_id=i.concept_id where i.agreement_id=v_version.agreement_id;
 select coalesce(jsonb_agg(jsonb_build_object('version',a.version,'faro_text',a.faro_text,'validated_at',a.validated_at,'items',(select coalesce(jsonb_agg(jsonb_build_object('label',i.label,'status',i.status) order by i.position),'[]'::jsonb) from gf_private.faro_agreement_items i where i.agreement_id=a.agreement_id)) order by a.version desc),'[]'::jsonb) into v_history from gf_private.faro_agreement_versions a where a.trajectory_id=p_trajectory_id and a.person_id=v_person;
 return jsonb_build_object('state',case when v_version.agreement_id is null then 'unvalidated' when v_version.faro_text<>v_faro.faro_text then 'stale' else 'validated' end,'version',coalesce(v_version.version,0),'original_expression',(select expression_text from gf_private.moment_originals where moment_id=v_faro.origin_moment_id and person_id=v_person),'validated_at',v_version.validated_at,'faro_text',v_faro.faro_text,'area_keys',coalesce(v_version.area_keys,'{}'::text[]),'items',v_items,'history',v_history);
end $$;

create or replace function public.lumen_faro_agreement_validate(p_trajectory_id uuid,p_faro_text text,p_items jsonb,p_area_keys text[] default '{}',p_expected_version integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();v_faro gf_core.trajectories;v_current integer;v_id uuid;v_item jsonb;v_index integer:=0;v_concept uuid;v_trace uuid:=gen_random_uuid();
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then raise exception 'memory consent required' using errcode='42501';end if;
 select * into v_faro from gf_core.trajectories where trajectory_id=p_trajectory_id and person_id=v_person for update;
 if not found then raise exception 'Faro unavailable' using errcode='P0002';end if;
 if v_faro.faro_text<>trim(coalesce(p_faro_text,'')) then raise exception 'Faro changed; reread before confirming' using errcode='40001';end if;
 select coalesce(max(version),0) into v_current from gf_private.faro_agreement_versions where trajectory_id=p_trajectory_id;
 if p_expected_version is distinct from v_current then raise exception 'agreement changed; reread before confirming' using errcode='40001';end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)>24 then raise exception 'invalid agreement items' using errcode='22023';end if;
 if exists(select 1 from unnest(coalesce(p_area_keys,'{}'::text[])) k where not exists(select 1 from gf_core.area_terms a where a.area_key=k and a.status='active')) then raise exception 'invalid area' using errcode='22023';end if;
 if v_current>0 and exists(select 1 from gf_private.faro_agreement_versions a where a.trajectory_id=p_trajectory_id and a.version=v_current and a.faro_text=v_faro.faro_text and a.area_keys=coalesce(p_area_keys,'{}'::text[]) and (select coalesce(jsonb_agg(jsonb_build_object('identity_id',i.identity_id,'concept_id',i.concept_id,'label',i.label,'definition',i.definition,'contextual_meaning',i.contextual_meaning,'origin',i.origin,'status',i.status) order by i.position),'[]'::jsonb) from gf_private.faro_agreement_items i where i.agreement_id=a.agreement_id)=(select coalesce(jsonb_agg(value-'source_status'-'reason' order by ord),'[]'::jsonb) from jsonb_array_elements(p_items) with ordinality as input(value,ord))) then return public.lumen_faro_agreement_snapshot(p_trajectory_id);end if;
 insert into gf_private.faro_agreement_versions(trajectory_id,person_id,version,faro_text,area_keys) values(p_trajectory_id,v_person,v_current+1,v_faro.faro_text,coalesce(p_area_keys,'{}'::text[])) returning agreement_id into v_id;
 for v_item in select value from jsonb_array_elements(p_items) loop
  v_concept:=nullif(v_item->>'concept_id','')::uuid;
  if v_concept is not null and not exists(select 1 from gf_core.potential_concepts where concept_id=v_concept and editorial_status in('candidate','reviewed')) then raise exception 'concept unavailable' using errcode='22023';end if;
  insert into gf_private.faro_agreement_items(agreement_id,identity_id,concept_id,label,definition,contextual_meaning,origin,status,position) values(v_id,coalesce(nullif(v_item->>'identity_id','')::uuid,gen_random_uuid()),v_concept,trim(coalesce(v_item->>'label','')),coalesce(v_item->>'definition',''),coalesce(v_item->>'contextual_meaning',''),case when v_concept is null then 'person' else coalesce(v_item->>'origin','person') end,coalesce(v_item->>'status','accepted'),v_index);
  v_index:=v_index+1;
 end loop;
 perform gf_private.emit_person_event('FaroPotentialAgreementValidated','trajectory',p_trajectory_id,v_person,v_trace,'faro.agreement.v1',jsonb_build_object('version',v_current+1,'item_count',v_index));
 return public.lumen_faro_agreement_snapshot(p_trajectory_id);
end $$;

