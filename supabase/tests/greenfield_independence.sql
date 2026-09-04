-- S0 invariant gate: greenfield database objects may depend only on greenfield/system schemas.
-- Run against the target DB after migrations. Expected result: zero rows.
with greenfield_oids as (
  select c.oid
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname like 'gf\_%' escape '\'
  union
  select p.oid
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname like 'gf\_%' escape '\'
), violations as (
  select distinct
    dep_ns.nspname as dependent_schema,
    coalesce(dep_class.relname, dep_proc.proname, d.objid::text) as dependent_object,
    ref_ns.nspname as referenced_schema,
    coalesce(ref_class.relname, ref_proc.proname, d.refobjid::text) as referenced_object
  from pg_depend d
  left join pg_class dep_class on dep_class.oid = d.objid
  left join pg_proc dep_proc on dep_proc.oid = d.objid
  left join pg_namespace dep_ns on dep_ns.oid = coalesce(dep_class.relnamespace, dep_proc.pronamespace)
  left join pg_class ref_class on ref_class.oid = d.refobjid
  left join pg_proc ref_proc on ref_proc.oid = d.refobjid
  left join pg_namespace ref_ns on ref_ns.oid = coalesce(ref_class.relnamespace, ref_proc.pronamespace)
  where d.objid in (select oid from greenfield_oids)
    and ref_ns.nspname is not null
    and ref_ns.nspname not like 'gf\_%' escape '\'
    and ref_ns.nspname not in ('pg_catalog', 'information_schema', 'auth')
)
select * from violations order by dependent_schema, dependent_object, referenced_schema, referenced_object;
