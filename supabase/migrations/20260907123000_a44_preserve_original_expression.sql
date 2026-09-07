-- A44 · preserve original Moment expression without leaking intimacy.
-- Canonical intent: expression original + interpretation/version remain reclassifiable,
-- while raw text stays private and outside Ledger/Knowledge by default.

create table if not exists gf_private.moment_originals (
  moment_id uuid primary key references gf_core.moments(moment_id) on delete cascade,
  person_id uuid not null references gf_core.persons(person_id) on delete cascade,
  expression_text text not null check (char_length(expression_text) between 1 and 4000),
  retention_policy text not null default 'private_reclassifiable.v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0)
);

create index if not exists moment_originals_person_created_idx
  on gf_private.moment_originals(person_id, created_at desc);

alter table gf_private.moment_originals enable row level security;
revoke all on table gf_private.moment_originals from public, anon, authenticated;

create or replace function public.lumen_s1_accompany_moment_v3(
  p_expression text,
  p_locale text,
  p_language text,
  p_surface text,
  p_trace_id uuid
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_scene jsonb;
  v_moment uuid;
  v_person uuid;
  v_expression text := trim(coalesce(p_expression,''));
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode='28000';
  end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'persistent accompaniment requires a non-anonymous account' using errcode='42501';
  end if;
  if char_length(v_expression) not between 1 and 4000 then
    raise exception 'expression must contain 1..4000 characters' using errcode='22023';
  end if;

  -- Keep the already certified S1 decision flow as the single implementation.
  v_scene := public.lumen_s1_accompany_moment(
    v_expression, p_locale, p_language, p_surface, p_trace_id
  );

  v_moment := nullif(v_scene->>'moment_id','')::uuid;
  v_person := gf_core.current_person_id();
  if v_moment is null or v_person is null then
    raise exception 'moment/person unavailable after accompaniment';
  end if;

  insert into gf_private.moment_originals(moment_id,person_id,expression_text)
  values(v_moment,v_person,v_expression)
  on conflict(moment_id) do update
    set expression_text=excluded.expression_text,
        updated_at=now(),
        revision=gf_private.moment_originals.revision+1;

  update gf_core.moments
     set original_retention='private_ref',
         contract_version='s1.v3',
         revision=revision+1
   where moment_id=v_moment and person_id=v_person;

  -- Ledger records existence/policy only, never raw text.
  perform gf_private.emit_person_event(
    'MomentOriginalPreserved','moment',v_moment,v_person,
    coalesce(p_trace_id,(v_scene->>'trace_id')::uuid),
    's1.v3',
    jsonb_build_object('original_retention','private_ref','retention_policy','private_reclassifiable.v1')
  );

  return v_scene || jsonb_build_object(
    'privacy',jsonb_build_object(
      'original_retention','private_ref',
      'retention_policy','private_reclassifiable.v1',
      'shared_learning',false
    )
  );
end
$$;

comment on function public.lumen_s1_accompany_moment_v3(text,text,text,text,uuid)
  is 'A44 canonical S1 entrypoint. Preserves original expression in gf_private for future reclassification; raw text never enters Ledger/Knowledge by default.';

-- The old entrypoint remains an internal implementation detail so clients cannot bypass retention.
revoke execute on function public.lumen_s1_accompany_moment(text,text,text,text,uuid) from public, anon, authenticated;
revoke all on function public.lumen_s1_accompany_moment_v3(text,text,text,text,uuid) from public, anon;
grant execute on function public.lumen_s1_accompany_moment_v3(text,text,text,text,uuid) to authenticated;

create or replace function public.lumen_privacy_export_moment_originals()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_person uuid;
  v_items jsonb;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'identified account required' using errcode='42501'; end if;
  select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
  if v_person is null then raise exception 'person unavailable' using errcode='P0002'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'moment_id',mo.moment_id,
    'expression',mo.expression_text,
    'retention_policy',mo.retention_policy,
    'received_at',m.received_at,
    'locale',m.locale,
    'language',m.language,
    'surface',m.surface,
    'interpreter_version',mi.interpreter_version,
    'intent_key',mi.intent_key,
    'need_keys',mi.need_keys,
    'confidence',mi.confidence,
    'uncertainty_key',mi.uncertainty_key
  ) order by m.received_at),'[]'::jsonb)
  into v_items
  from gf_private.moment_originals mo
  join gf_core.moments m on m.moment_id=mo.moment_id and m.person_id=v_person
  left join lateral (
    select x.interpreter_version,x.intent_key,x.need_keys,x.confidence,x.uncertainty_key
      from gf_core.moment_interpretations x
     where x.moment_id=mo.moment_id and x.person_id=v_person
     order by x.created_at desc
     limit 1
  ) mi on true
  where mo.person_id=v_person;

  return jsonb_build_object(
    'export_version','moment-originals.v1',
    'generated_at',now(),
    'shared_learning_default',false,
    'items',v_items
  );
end
$$;

revoke all on function public.lumen_privacy_export_moment_originals() from public, anon;
grant execute on function public.lumen_privacy_export_moment_originals() to authenticated;

create or replace function public.lumen_privacy_delete_moment_originals(p_trace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_person uuid;
  v_trace uuid := coalesce(p_trace_id,gen_random_uuid());
  v_count integer;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'identified account required' using errcode='42501'; end if;
  select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
  if v_person is null then raise exception 'person unavailable' using errcode='P0002'; end if;

  with deleted as (
    delete from gf_private.moment_originals
     where person_id=v_person
     returning moment_id
  ) select count(*) into v_count from deleted;

  update gf_core.moments
     set original_retention='ephemeral', revision=revision+1
   where person_id=v_person and original_retention='private_ref'
     and not exists(select 1 from gf_private.moment_originals mo where mo.moment_id=gf_core.moments.moment_id);

  perform gf_private.emit_person_event(
    'MomentOriginalsDeleted','privacy',v_person,v_person,v_trace,'s1.v3',
    jsonb_build_object('deleted_count',v_count)
  );

  return jsonb_build_object('deleted_count',v_count,'trace_id',v_trace);
end
$$;

revoke all on function public.lumen_privacy_delete_moment_originals(uuid) from public, anon;
grant execute on function public.lumen_privacy_delete_moment_originals(uuid) to authenticated;
