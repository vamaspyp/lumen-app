-- VA+LUMEN V0.4 · S3 Source autopoiesis + broader curated coverage

create table gf_core.source_lifecycle_events(
  lifecycle_event_id uuid primary key default gen_random_uuid(), help_id uuid not null references gf_core.help_possibilities(help_id) on delete cascade,
  from_state text, to_state text not null, reason_key text not null, actor_ref text not null, created_at timestamptz not null default now()
);
create index source_lifecycle_help_idx on gf_core.source_lifecycle_events(help_id,created_at desc);
revoke all on gf_core.source_lifecycle_events from public,anon,authenticated;

create table gf_private.source_intake_candidates(
  intake_id uuid primary key default gen_random_uuid(), submitted_by text not null, provider_code text not null,
  canonical_code text not null, help_type text not null, candidate jsonb not null,
  status text not null default 'received' check(status in('received','review','accepted','rejected')),
  reviewed_by text, review_note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(canonical_code,status) deferrable initially immediate
);
revoke all on gf_private.source_intake_candidates from public,anon,authenticated;

create or replace function gf_private.source_intake(p_submitted_by text,p_provider_code text,p_canonical_code text,p_help_type text,p_candidate jsonb)
returns uuid language plpgsql security definer set search_path=''
as $$ declare v_id uuid; begin
 if trim(coalesce(p_submitted_by,''))='' or trim(coalesce(p_provider_code,''))='' or trim(coalesce(p_canonical_code,''))='' or trim(coalesce(p_help_type,''))='' then raise exception 'missing source intake fields'; end if;
 insert into gf_private.source_intake_candidates(submitted_by,provider_code,canonical_code,help_type,candidate)
 values(trim(p_submitted_by),trim(p_provider_code),trim(p_canonical_code),trim(p_help_type),coalesce(p_candidate,'{}'::jsonb)) returning intake_id into v_id;
 return v_id;
end $$;
revoke execute on function gf_private.source_intake(text,text,text,text,jsonb) from public,anon,authenticated;

create or replace function gf_private.activate_source_intake(p_intake_id uuid,p_reviewer text,p_target_lifecycle text default 'active_limited')
returns uuid language plpgsql security definer set search_path=''
as $$ declare r gf_private.source_intake_candidates%rowtype;v_provider uuid;v_help uuid;v_version uuid;v_need text;v_state text:=lower(trim(p_target_lifecycle)); begin
 if v_state not in('active_limited','active') then raise exception 'invalid target lifecycle'; end if;
 select * into r from gf_private.source_intake_candidates where intake_id=p_intake_id for update;
 if r.intake_id is null or r.status not in('received','review') then raise exception 'intake unavailable'; end if;
 if not (r.candidate ? 'title' and r.candidate ? 'summary' and r.candidate ? 'external_url' and r.candidate ? 'locale' and r.candidate ? 'need_keys') then raise exception 'candidate incomplete'; end if;
 select provider_id into v_provider from gf_core.providers where provider_code=r.provider_code;
 if v_provider is null then raise exception 'provider not registered'; end if;
 insert into gf_core.help_possibilities(canonical_code,help_type,provider_id,lifecycle,risk_class,evidence_class,conflict_note)
 values(r.canonical_code,r.help_type,v_provider,v_state,coalesce(r.candidate->>'risk_class','low'),coalesce(r.candidate->>'evidence_class','external_curated'),r.candidate->>'conflict_note')
 returning help_id into v_help;
 insert into gf_core.help_versions(help_id,version,mechanism_key,detail,duration_minutes,energy,accessibility)
 values(v_help,1,coalesce(r.candidate->>'mechanism_key','external_resource'),jsonb_build_object('external_url',r.candidate->>'external_url','source_kind','external'),nullif(r.candidate->>'duration_minutes','')::integer,nullif(r.candidate->>'energy',''),coalesce(r.candidate->'accessibility','{}'::jsonb)) returning help_version_id into v_version;
 insert into gf_core.help_localizations(help_version_id,locale,title,summary,content_payload,cultural_scope,provenance)
 values(v_version,r.candidate->>'locale',r.candidate->>'title',r.candidate->>'summary',jsonb_build_object('external_url',r.candidate->>'external_url','cta_label',coalesce(r.candidate->>'cta_label','Abrir recurso')),coalesce(array(select jsonb_array_elements_text(r.candidate->'cultural_scope')),'{}'),jsonb_build_object('provider_code',r.provider_code,'source_url',r.candidate->>'external_url','curated_by',p_reviewer));
 for v_need in select jsonb_array_elements_text(r.candidate->'need_keys') loop
   insert into gf_core.coverage_cells(help_id,need_key,intent_key,status,locale_pattern,priority_hint,reason_key)
   values(v_help,v_need,null,'partial',coalesce(r.candidate->>'locale_pattern','*'),coalesce((r.candidate->>'priority_hint')::smallint,50),'external_curated_fit');
 end loop;
 insert into gf_core.source_lifecycle_events(help_id,from_state,to_state,reason_key,actor_ref) values(v_help,'candidate',v_state,'curation_accepted',p_reviewer);
 update gf_private.source_intake_candidates set status='accepted',reviewed_by=p_reviewer,review_note='activated',updated_at=now() where intake_id=p_intake_id;
 insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,trace_id,contract_version,payload,provenance)
 values('SourcePossibilityActivated','help_possibility',v_help,'operator',p_reviewer,gen_random_uuid(),'s3.v1',jsonb_build_object('canonical_code',r.canonical_code,'lifecycle',v_state,'provider_code',r.provider_code),jsonb_build_object('intake_id',p_intake_id));
 return v_help;
end $$;
revoke execute on function gf_private.activate_source_intake(uuid,text,text) from public,anon,authenticated;

create or replace function gf_private.set_source_lifecycle(p_help_id uuid,p_to_state text,p_reason text,p_actor text)
returns void language plpgsql security definer set search_path=''
as $$ declare v_from text;v_to text:=lower(trim(p_to_state)); begin
 if v_to not in('active_limited','active','restricted','retired') then raise exception 'invalid lifecycle'; end if;
 select lifecycle into v_from from gf_core.help_possibilities where help_id=p_help_id for update;
 if v_from is null then raise exception 'help not found'; end if;
 update gf_core.help_possibilities set lifecycle=v_to,updated_at=now(),revision=revision+1 where help_id=p_help_id;
 insert into gf_core.source_lifecycle_events(help_id,from_state,to_state,reason_key,actor_ref) values(p_help_id,v_from,v_to,coalesce(nullif(trim(p_reason),''),'manual_review'),p_actor);
 insert into gf_ledger.domain_events(event_type,aggregate_type,aggregate_id,actor_type,actor_id,trace_id,contract_version,payload,provenance)
 values(case when v_to='retired' then 'SourcePossibilityRetired' else 'SourcePossibilityLifecycleChanged' end,'help_possibility',p_help_id,'operator',p_actor,gen_random_uuid(),'s3.v1',jsonb_build_object('from',v_from,'to',v_to,'reason',p_reason),'{}'::jsonb);
end $$;
revoke execute on function gf_private.set_source_lifecycle(uuid,text,text,text) from public,anon,authenticated;

create or replace function public.lumen_source_discover(p_need_key text default null,p_help_type text default null,p_locale text default 'es-AR',p_limit integer default 24)
returns jsonb language plpgsql stable security definer set search_path=''
as $$ declare v_result jsonb;v_limit integer:=greatest(1,least(coalesce(p_limit,24),50)); begin
 select coalesce(jsonb_agg(x.item order by x.priority,x.title),'[]'::jsonb) into v_result from (
   select min(cc.priority_hint) priority,hl.title,jsonb_build_object(
     'help_id',hp.help_id,'canonical_code',hp.canonical_code,'help_type',hp.help_type,'lifecycle',hp.lifecycle,'risk_class',hp.risk_class,'evidence_class',hp.evidence_class,
     'title',hl.title,'summary',hl.summary,'content',hl.content_payload,'duration_minutes',hv.duration_minutes,'energy',hv.energy,
     'provider',jsonb_build_object('name',pr.display_name,'kind',pr.provider_kind,'provenance',pr.provenance,'rights',pr.rights),
     'needs',coalesce(jsonb_agg(distinct cc.need_key) filter(where cc.need_key is not null),'[]'::jsonb),
     'localization_provenance',hl.provenance
   ) item
   from gf_core.help_possibilities hp
   join gf_core.providers pr on pr.provider_id=hp.provider_id
   join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version
   join lateral(select h.* from gf_core.help_localizations h where h.help_version_id=hv.help_version_id order by case when h.locale=coalesce(nullif(trim(p_locale),''),'es-AR') then 0 when left(h.locale,2)=left(coalesce(nullif(trim(p_locale),''),'es-AR'),2) then 1 when h.locale='es-AR' then 2 else 3 end limit 1) hl on true
   left join gf_core.coverage_cells cc on cc.help_id=hp.help_id and cc.status in('covered','partial')
   where hp.lifecycle in('active_limited','active') and (p_help_type is null or hp.help_type=p_help_type)
     and (p_need_key is null or exists(select 1 from gf_core.coverage_cells c2 where c2.help_id=hp.help_id and c2.need_key=p_need_key and c2.status in('covered','partial')))
   group by hp.help_id,hp.canonical_code,hp.help_type,hp.lifecycle,hp.risk_class,hp.evidence_class,hv.help_version_id,hv.duration_minutes,hv.energy,hl.title,hl.summary,hl.content_payload,hl.provenance,pr.provider_id,pr.display_name,pr.provider_kind,pr.provenance,pr.rights
   order by min(cc.priority_hint),hl.title limit v_limit
 ) x;
 return v_result;
end $$;
revoke execute on function public.lumen_source_discover(text,text,text,integer) from public;
grant execute on function public.lumen_source_discover(text,text,text,integer) to anon,authenticated;

insert into gf_core.providers(provider_code,display_name,provider_kind,provenance,rights) values
('who','World Health Organization','institution',jsonb_build_object('homepage','https://www.who.int/','curation','external_verified'),jsonb_build_object('linking','allowed','content','source_terms_apply')),
('nhs','NHS','public_health_service',jsonb_build_object('homepage','https://www.nhs.uk/','curation','external_verified'),jsonb_build_object('linking','allowed','content','source_terms_apply')),
('ggsc','Greater Good Science Center · UC Berkeley','research_center',jsonb_build_object('homepage','https://greatergood.berkeley.edu/','curation','external_verified'),jsonb_build_object('linking','allowed','content','source_terms_apply')),
('project_gutenberg','Project Gutenberg','public_domain_library',jsonb_build_object('homepage','https://www.gutenberg.org/','curation','external_verified'),jsonb_build_object('linking','allowed','content','public_domain_or_pg_license_check_jurisdiction'))
on conflict(provider_code) do update set display_name=excluded.display_name,provider_kind=excluded.provider_kind,provenance=excluded.provenance,rights=excluded.rights,updated_at=now(),revision=gf_core.providers.revision+1;

create or replace function gf_private.seed_external_help(p_code text,p_type text,p_provider text,p_mechanism text,p_title text,p_summary text,p_url text,p_needs text[],p_evidence text,p_duration integer,p_energy text,p_cultural text[])
returns void language plpgsql security definer set search_path=''
as $$ declare v_provider uuid;v_help uuid;v_version uuid;v_need text; begin
 select provider_id into v_provider from gf_core.providers where provider_code=p_provider;
 insert into gf_core.help_possibilities(canonical_code,help_type,provider_id,lifecycle,risk_class,evidence_class)
 values(p_code,p_type,v_provider,'active_limited','low',p_evidence) on conflict(canonical_code) do update set provider_id=excluded.provider_id,lifecycle='active_limited',evidence_class=excluded.evidence_class,updated_at=now() returning help_id into v_help;
 if not exists(select 1 from gf_core.help_versions where help_id=v_help and version=1) then
   insert into gf_core.help_versions(help_id,version,mechanism_key,detail,duration_minutes,energy,accessibility)
   values(v_help,1,p_mechanism,jsonb_build_object('external_url',p_url,'delivery','external'),p_duration,p_energy,jsonb_build_object('screen_reader',true,'reduced_motion',true)) returning help_version_id into v_version;
 else select help_version_id into v_version from gf_core.help_versions where help_id=v_help and version=1; end if;
 insert into gf_core.help_localizations(help_version_id,locale,title,summary,content_payload,cultural_scope,provenance)
 values(v_version,'es-AR',p_title,p_summary,jsonb_build_object('external_url',p_url,'cta_label','Abrir recurso original'),coalesce(p_cultural,'{}'),jsonb_build_object('provider_code',p_provider,'source_url',p_url,'editorial_form','metadata_and_link_only'))
 on conflict(help_version_id,locale) do update set title=excluded.title,summary=excluded.summary,content_payload=excluded.content_payload,cultural_scope=excluded.cultural_scope,provenance=excluded.provenance;
 foreach v_need in array p_needs loop
   insert into gf_core.coverage_cells(help_id,need_key,intent_key,status,locale_pattern,priority_hint,reason_key)
   select v_help,v_need,null,'partial','es-%',40,'external_curated_fit' where not exists(select 1 from gf_core.coverage_cells where help_id=v_help and need_key=v_need);
 end loop;
 if not exists(select 1 from gf_core.source_lifecycle_events where help_id=v_help and to_state='active_limited') then insert into gf_core.source_lifecycle_events(help_id,from_state,to_state,reason_key,actor_ref) values(v_help,'candidate','active_limited','initial_external_curation','VA+ editorial'); end if;
end $$;
revoke execute on function gf_private.seed_external_help(text,text,text,text,text,text,text,text[],text,integer,text,text[]) from public,anon,authenticated;

select gf_private.seed_external_help('who_doing_what_matters_es','external_resource','who','stress_self_help','En tiempos de estrés, haz lo que importa','Guía ilustrada de la OMS con habilidades prácticas para atravesar estrés y adversidad.','https://www.who.int/es/publications/b/53604',array['pause','clarity','agency'],'institutional_guidance',10,'low',array['global','es']);
select gf_private.seed_external_help('who_self_help_interventions_2026','external_resource','who','structured_self_help','Intervenciones psicológicas de autoayuda · OMS','Manual 2026 de la OMS sobre intervenciones de autoayuda estructurada y su implementación.','https://www.who.int/publications/i/item/9789240120785',array['agency','clarity'],'evidence_based',15,'medium',array['global']);
select gf_private.seed_external_help('nhs_breathing_for_stress','external_resource','nhs','calming_breath','Respiración para el estrés · NHS','Ejercicio respiratorio breve y accesible publicado por el servicio público de salud británico.','https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/',array['pause'],'institutional_guidance',5,'very_low',array['global']);
select gf_private.seed_external_help('ggia_gratitude_journal','external_resource','ggsc','gratitude_journaling','Diario de gratitud · Greater Good','Práctica de gratitud curada por el Greater Good Science Center de UC Berkeley.','https://ggia.berkeley.edu/practice/gratitude_journal',array['appreciation'],'research_informed',15,'low',array['global']);
select gf_private.seed_external_help('ggia_gratitude_meditation','external_resource','ggsc','gratitude_meditation','Meditación de gratitud · Greater Good','Práctica guiada de gratitud disponible en español en Greater Good in Action.','https://ggia.berkeley.edu/es/practice/gratitude_meditation',array['appreciation','pause'],'research_informed',10,'low',array['global','es']);
select gf_private.seed_external_help('ggia_better_thank_you','external_resource','ggsc','relational_appreciation','Una mejor manera de agradecer · Greater Good','Práctica breve para expresar agradecimiento de una manera que favorezca cercanía y confianza.','https://ggia.berkeley.edu/practice/a_better_way_to_say_thank_you',array['connection','appreciation'],'research_informed',5,'low',array['global']);
select gf_private.seed_external_help('ggia_gratitude_letter','external_resource','ggsc','gratitude_letter','Carta de gratitud · Greater Good','Práctica relacional de escritura para expresar agradecimiento significativo.','https://ggia.berkeley.edu/practice/gratitude_letter',array['connection','appreciation'],'research_informed',15,'medium',array['global']);
select gf_private.seed_external_help('epictetus_enchiridion_pg','reading','project_gutenberg','stoic_discernment','El Enquiridión · Epicteto','Texto clásico estoico sobre discernir la propia agencia y la relación con lo que no controlamos.','https://www.gutenberg.org/ebooks/45109',array['clarity','agency'],'classic_source',15,'medium',array['stoic','classical']);
select gf_private.seed_external_help('marcus_meditations_pg','reading','project_gutenberg','stoic_reflection','Meditaciones · Marco Aurelio','Fuente clásica estoica para reflexión sobre atención, conducta, perspectiva y sentido de la acción.','https://www.gutenberg.org/ebooks/55317',array['clarity','meaning','agency'],'classic_source',15,'medium',array['stoic','classical']);
select gf_private.seed_external_help('dhammapada_pg','reading','project_gutenberg','contemplative_reflection','Dhammapada','Texto clásico de la tradición budista, disponible en edición de dominio público a través de Project Gutenberg.','https://www.gutenberg.org/ebooks/2017',array['pause','meaning'],'classic_source',15,'medium',array['buddhist','classical']);

drop function gf_private.seed_external_help(text,text,text,text,text,text,text,text[],text,integer,text,text[]);
