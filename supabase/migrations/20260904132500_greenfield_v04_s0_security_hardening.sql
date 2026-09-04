-- VA+LUMEN Greenfield V0.4 · S0 security hardening
-- Applied in Supabase as greenfield_v04_s0_security_hardening.

alter function gf_ledger.prevent_mutation() set search_path = pg_catalog;

drop policy if exists persons_self_select on gf_core.persons;
drop policy if exists persons_self_insert on gf_core.persons;
drop policy if exists persons_self_update on gf_core.persons;

create policy persons_self_select on gf_core.persons
for select to authenticated
using (
  auth.uid() = auth_user_id
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
);

create policy persons_self_insert on gf_core.persons
for insert to authenticated
with check (
  auth.uid() = auth_user_id
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
);

create policy persons_self_update on gf_core.persons
for update to authenticated
using (
  auth.uid() = auth_user_id
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
)
with check (
  auth.uid() = auth_user_id
  and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
);

drop policy if exists consent_self_select on gf_core.consent_grants;
drop policy if exists consent_self_insert on gf_core.consent_grants;
drop policy if exists consent_self_update on gf_core.consent_grants;

create policy consent_self_select on gf_core.consent_grants
for select to authenticated
using (
  coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = consent_grants.person_id
      and p.auth_user_id = auth.uid()
  )
);

create policy consent_self_insert on gf_core.consent_grants
for insert to authenticated
with check (
  coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = consent_grants.person_id
      and p.auth_user_id = auth.uid()
  )
);

create policy consent_self_update on gf_core.consent_grants
for update to authenticated
using (
  coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = consent_grants.person_id
      and p.auth_user_id = auth.uid()
  )
)
with check (
  coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = consent_grants.person_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists privacy_self_select on gf_core.privacy_preferences;
drop policy if exists privacy_self_insert on gf_core.privacy_preferences;
drop policy if exists privacy_self_update on gf_core.privacy_preferences;

create policy privacy_self_select on gf_core.privacy_preferences
for select to authenticated
using (
  coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = privacy_preferences.person_id
      and p.auth_user_id = auth.uid()
  )
);

create policy privacy_self_insert on gf_core.privacy_preferences
for insert to authenticated
with check (
  coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = privacy_preferences.person_id
      and p.auth_user_id = auth.uid()
  )
);

create policy privacy_self_update on gf_core.privacy_preferences
for update to authenticated
using (
  coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = privacy_preferences.person_id
      and p.auth_user_id = auth.uid()
  )
)
with check (
  coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from gf_core.persons p
    where p.person_id = privacy_preferences.person_id
      and p.auth_user_id = auth.uid()
  )
);
