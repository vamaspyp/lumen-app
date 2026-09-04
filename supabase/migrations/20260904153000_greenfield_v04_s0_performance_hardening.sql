-- VA+LUMEN Greenfield V0.4 · S0 performance hardening
-- Preserve RLS semantics while allowing Postgres initPlan caching.

create index if not exists consent_grants_person_id_idx
  on gf_core.consent_grants(person_id);

drop policy if exists persons_self_select on gf_core.persons;
drop policy if exists persons_self_insert on gf_core.persons;
drop policy if exists persons_self_update on gf_core.persons;

create policy persons_self_select on gf_core.persons
for select to authenticated
using (
  (select auth.uid()) = auth_user_id
  and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
);

create policy persons_self_insert on gf_core.persons
for insert to authenticated
with check (
  (select auth.uid()) = auth_user_id
  and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
);

create policy persons_self_update on gf_core.persons
for update to authenticated
using (
  (select auth.uid()) = auth_user_id
  and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
)
with check (
  (select auth.uid()) = auth_user_id
  and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
);

drop policy if exists consent_self_select on gf_core.consent_grants;
drop policy if exists consent_self_insert on gf_core.consent_grants;
drop policy if exists consent_self_update on gf_core.consent_grants;

create policy consent_self_select on gf_core.consent_grants
for select to authenticated
using (
  coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = consent_grants.person_id
      and p.auth_user_id = (select auth.uid())
  )
);

create policy consent_self_insert on gf_core.consent_grants
for insert to authenticated
with check (
  coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = consent_grants.person_id
      and p.auth_user_id = (select auth.uid())
  )
);

create policy consent_self_update on gf_core.consent_grants
for update to authenticated
using (
  coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = consent_grants.person_id
      and p.auth_user_id = (select auth.uid())
  )
)
with check (
  coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = consent_grants.person_id
      and p.auth_user_id = (select auth.uid())
  )
);

drop policy if exists privacy_self_select on gf_core.privacy_preferences;
drop policy if exists privacy_self_insert on gf_core.privacy_preferences;
drop policy if exists privacy_self_update on gf_core.privacy_preferences;

create policy privacy_self_select on gf_core.privacy_preferences
for select to authenticated
using (
  coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = privacy_preferences.person_id
      and p.auth_user_id = (select auth.uid())
  )
);

create policy privacy_self_insert on gf_core.privacy_preferences
for insert to authenticated
with check (
  coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = privacy_preferences.person_id
      and p.auth_user_id = (select auth.uid())
  )
);

create policy privacy_self_update on gf_core.privacy_preferences
for update to authenticated
using (
  coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = privacy_preferences.person_id
      and p.auth_user_id = (select auth.uid())
  )
)
with check (
  coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = privacy_preferences.person_id
      and p.auth_user_id = (select auth.uid())
  )
);
