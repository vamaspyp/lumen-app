-- A51 · V46/V47 decision order correction
-- Personal continuity/repertoire may refine a relevant set, but cannot outrank semantic relevance.
do $$
declare
  v_oid oid;
  v_def text;
  v_old text:='order by repertoire_rank,applicability_rank,intent_rank,status_rank,priority_hint,canonical_code limit 2';
  v_new text:='order by applicability_rank,intent_rank,repertoire_rank,status_rank,priority_hint,canonical_code limit 2';
begin
  select p.oid into v_oid
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='lumen_s1_accompany_moment_v47_core';

  select pg_get_functiondef(v_oid) into v_def;
  if position(v_old in lower(v_def))>0 then
    v_def:=replace(v_def,v_old,v_new);
    execute v_def;
  elsif position(v_new in lower(v_def))>0 then
    null; -- already correct: safe/idempotent
  else
    raise exception 'expected A51 ranking clause not found';
  end if;
end $$;
