-- A51 · privacy export must reflect the current V49 interpretation contract.
create or replace function public.lumen_privacy_export_moment_originals()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_person uuid;
  v_items jsonb;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'identified account required' using errcode='42501';end if;
  select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
  if v_person is null then raise exception 'person unavailable' using errcode='P0002';end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'moment_id',mo.moment_id,
      'expression',mo.expression_text,
      'retention_policy',mo.retention_policy,
      'received_at',m.received_at,
      'locale',m.locale,
      'language',m.language,
      'surface',m.surface,
      'interpreter_version',mi.interpreter_version,
      'taxonomy_version',mi.taxonomy_version,
      'area_keys',coalesce(to_jsonb(mi.area_keys),'[]'::jsonb),
      'capacity_keys',coalesce(to_jsonb(mi.capacity_keys),'[]'::jsonb),
      'confidence',mi.confidence,
      'uncertainty_key',mi.uncertainty_key
    ) order by m.received_at
  ),'[]'::jsonb) into v_items
  from gf_private.moment_originals mo
  join gf_core.moments m on m.moment_id=mo.moment_id and m.person_id=v_person
  left join lateral(
    select x.interpreter_version,x.taxonomy_version,x.area_keys,x.capacity_keys,x.confidence,x.uncertainty_key
    from gf_core.moment_interpretations x
    where x.moment_id=mo.moment_id and x.person_id=v_person
    order by x.created_at desc limit 1
  ) mi on true
  where mo.person_id=v_person;

  return jsonb_build_object(
    'export_version','moment-originals.v49.1',
    'generated_at',now(),
    'shared_learning_default',false,
    'items',v_items
  );
end $$;

revoke execute on function public.lumen_privacy_export_moment_originals() from public,anon;
grant execute on function public.lumen_privacy_export_moment_originals() to authenticated;
