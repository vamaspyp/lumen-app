-- A63 / V58 §22.10: private, versioned, explicit Faro–Potential agreement.
-- No candidate Source relation is activated; no legacy capacity aliases.
create table if not exists gf_private.faro_agreement_versions (
  agreement_id uuid primary key default gen_random_uuid(),
  trajectory_id uuid not null references gf_core.trajectories on delete cascade,
  person_id uuid not null references gf_core.persons on delete cascade,
  version integer not null check(version>0),
  faro_text text not null check(char_length(faro_text) between 1 and 280),
  area_keys text[] not null default '{}',
  validated_at timestamptz not null default now(),
  unique(trajectory_id,version)
);
create table if not exists gf_private.faro_agreement_items (
  agreement_id uuid not null references gf_private.faro_agreement_versions on delete cascade,
  identity_id uuid not null,
  concept_id uuid references gf_core.potential_concepts,
  label text not null check(char_length(trim(label)) between 1 and 120),
  definition text not null default '' check(char_length(definition)<=1000),
  contextual_meaning text not null default '' check(char_length(contextual_meaning)<=1000),
  origin text not null check(origin in('person','lumi')),
  status text not null check(status in('accepted','reformulated','withdrawn')),
  position integer not null check(position>=0),
  primary key(agreement_id,identity_id)
);
create index if not exists faro_agreement_person_idx on gf_private.faro_agreement_versions(person_id);
create index if not exists faro_agreement_concept_idx on gf_private.faro_agreement_items(concept_id);
alter table gf_private.faro_agreement_versions enable row level security;
alter table gf_private.faro_agreement_items enable row level security;
revoke all on gf_private.faro_agreement_versions,gf_private.faro_agreement_items from public,anon,authenticated;

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
 return jsonb_build_object('state',case when v_version.agreement_id is null then 'unvalidated' when v_version.faro_text<>v_faro.faro_text then 'stale' else 'validated' end,'version',coalesce(v_version.version,0),'validated_at',v_version.validated_at,'faro_text',v_faro.faro_text,'area_keys',coalesce(v_version.area_keys,'{}'::text[]),'items',v_items,'history',v_history);
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

-- Suggestions are explicit, source-anchored editorial hypotheses, never approved equivalences.
-- Search the current dataset rather than copying the ZIP's closed sample catalogue.
create or replace function public.lumen_faro_potential_proposal(p_expression text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_items jsonb;v_expression text:=lower(trim(coalesce(p_expression,'')));
begin
 if gf_core.current_person_id() is null then raise exception 'authentication required' using errcode='28000';end if;
 if char_length(v_expression) not between 1 and 3000 then raise exception 'invalid expression' using errcode='22023';end if;
 select coalesce(jsonb_agg(jsonb_build_object('identity_id',gen_random_uuid(),'concept_id',c.concept_id,'label',c.label_es,'definition',c.definition_es,'contextual_meaning','','origin','lumi','status','accepted','source_status',c.editorial_status,'reason','Es una hipótesis editorial para revisar a partir de tus palabras.') order by c.label_es),'[]'::jsonb) into v_items from (
  select c.* from gf_core.potential_concepts c where c.editorial_status in('candidate','reviewed') and (
   v_expression like '%'||lower(c.label_es)||'%' or exists(select 1 from gf_core.potential_terms t where t.concept_id=c.concept_id and length(t.term)>=5 and t.language_tag like 'es%' and v_expression like '%'||lower(t.term)||'%')
  ) order by case when c.editorial_status='reviewed' then 0 else 1 end,c.label_es limit 3
 ) c;
 return jsonb_build_object('state',case when jsonb_array_length(v_items)>0 then 'proposed' else 'needs_person_expression' end,'items',v_items,'message',case when jsonb_array_length(v_items)>0 then 'Son hipótesis: podés cambiar o quitar cualquiera.' else 'Todavía no tengo una lectura concreta para proponerte. Podés nombrar con tus palabras lo que querés nutrir.' end);
end $$;

create or replace function public.lumen_faro_constellation(p_trajectory_id uuid,p_expected_version integer,p_available_minutes integer default 0,p_locale text default 'es-AR')
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();v_agreement jsonb;v_id uuid;v_items jsonb;v_trace uuid:=gen_random_uuid();
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 v_agreement:=public.lumen_faro_agreement_snapshot(p_trajectory_id);
 if v_agreement->>'state'<>'validated' or (v_agreement->>'version')::integer is distinct from p_expected_version then return jsonb_build_object('state','agreement_required','items','[]'::jsonb);end if;
 if p_available_minutes<0 or p_available_minutes>1440 then raise exception 'invalid available time' using errcode='22023';end if;
 select agreement_id into v_id from gf_private.faro_agreement_versions where trajectory_id=p_trajectory_id and person_id=v_person and version=p_expected_version;
 select coalesce(jsonb_agg(x.item order by x.is_own desc,x.is_saved desc,x.title),'[]'::jsonb) into v_items from (
  select distinct h->>'help_id' help_id,h->>'title' title,
   exists(select 1 from gf_core.personal_repertoire r where r.person_id=v_person and r.help_id=(h->>'help_id')::uuid and r.status='active' and r.user_confirmed) is_own,
   exists(select 1 from gf_private.sanctuary_entries s where s.person_id=v_person and s.source_help_id=(h->>'help_id')::uuid) is_saved,
   h||jsonb_build_object('context_origin',case when exists(select 1 from gf_core.personal_repertoire r where r.person_id=v_person and r.help_id=(h->>'help_id')::uuid and r.status='active' and r.user_confirmed) then 'propio' when exists(select 1 from gf_private.sanctuary_entries s where s.person_id=v_person and s.source_help_id=(h->>'help_id')::uuid) then 'santuario' when h->>'help_type' in('conversation','professional_support','institutional_service') then 'tejido' else 'fuente' end,'context_reason','Relación editorial admitida con lo que acordaste nutrir para este Faro.') item
  from jsonb_array_elements(public.lumen_source_discover(null,null,null,p_locale,100)) h
  where exists(select 1 from gf_private.faro_agreement_items i join gf_core.potential_concepts c on c.concept_id=i.concept_id and c.editorial_status='reviewed' join gf_core.help_potential_links l on l.concept_id=c.concept_id and l.editorial_status='reviewed' join gf_core.help_versions hv on hv.help_version_id=l.help_version_id join gf_core.help_possibilities hp on hp.help_id=hv.help_id and hp.current_version=hv.version where i.agreement_id=v_id and i.status<>'withdrawn' and hp.help_id=(h->>'help_id')::uuid)
   and (p_available_minutes=0 or (h->>'duration_minutes')::integer<=p_available_minutes)
   and not exists(select 1 from gf_core.outcomes_feedback o join gf_core.help_selections s on s.selection_id=o.selection_id where o.person_id=v_person and s.help_id=(h->>'help_id')::uuid and o.signal_kind='STOPPED_HELPING' and o.created_at=(select max(o2.created_at) from gf_core.outcomes_feedback o2 join gf_core.help_selections s2 on s2.selection_id=o2.selection_id where o2.person_id=v_person and s2.help_id=s.help_id))
  order by is_own desc,is_saved desc,title limit 3
 ) x;
 perform gf_private.emit_person_event('FaroConstellationRequested','trajectory',p_trajectory_id,v_person,v_trace,'faro.agreement.v1',jsonb_build_object('agreement_version',p_expected_version,'item_count',jsonb_array_length(v_items)));
 return jsonb_build_object('state',case when jsonb_array_length(v_items)>0 then 'success' else 'no_match' end,'items',v_items,'agreement_version',p_expected_version,'message',case when jsonb_array_length(v_items)=0 then 'Para lo que acordamos nutrir, todavía no tengo una relación de Fuente suficientemente revisada. Podés recibir una guía puntual o explorar por tu cuenta.' else null end);
end $$;

revoke all on function public.lumen_faro_agreement_snapshot(uuid),public.lumen_faro_agreement_validate(uuid,text,jsonb,text[],integer),public.lumen_faro_potential_proposal(text),public.lumen_faro_constellation(uuid,integer,integer,text) from public,anon;
grant execute on function public.lumen_faro_agreement_snapshot(uuid),public.lumen_faro_agreement_validate(uuid,text,jsonb,text[],integer),public.lumen_faro_potential_proposal(text),public.lumen_faro_constellation(uuid,integer,integer,text) to authenticated;
comment on table gf_private.faro_agreement_versions is 'A63 V58 22.10. Private immutable agreement versions, no person scores. Delete cascades when personal memory is forgotten.';
