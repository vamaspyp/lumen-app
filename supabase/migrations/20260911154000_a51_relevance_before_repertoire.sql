-- A51 · V46/V47 decision order correction
-- Personal continuity/repertoire may refine a relevant set, but cannot outrank semantic relevance.
do $$
declare
  v_oid oid;
  v_def text;
begin
  select p.oid into v_oid
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='lumen_s1_accompany_moment_v47_core';

  select pg_get_functiondef(v_oid) into v_def;
  if position('order by repertoire_rank,applicability_rank,intent_rank,status_rank,priority_hint,canonical_code limit 2' in lower(v_def))=0 then
    raise exception 'expected A51 ranking clause not found';
  end if;

  v_def:=replace(
    v_def,
    'order by repertoire_rank,applicability_rank,intent_rank,status_rank,priority_hint,canonical_code limit 2',
    'order by applicability_rank,intent_rank,repertoire_rank,status_rank,priority_hint,canonical_code limit 2'
  );
  execute v_def;
end $$;
