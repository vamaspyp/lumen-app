-- VA+LUMEN Greenfield V0.4 · S0 Foundation
-- Canonical migration already applied to Supabase as greenfield_v04_s0_foundation.
-- Invariant: this migration has no dependency on legacy business objects in public.

create schema if not exists gf_core;
create schema if not exists gf_private;
create schema if not exists gf_ledger;

revoke all on schema gf_private from public, anon, authenticated;
revoke all on schema gf_ledger from public, anon, authenticated;
grant usage on schema gf_core to authenticated;

create table gf_core.persons (
  person_id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0)
);

create table gf_core.consent_grants (
  consent_id uuid primary key default gen_random_uuid(),
  person_id uuid not null references gf_core.persons(person_id) on delete cascade,
  scope text not null,
  granted boolean not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  terms_version text not null,
  created_at timestamptz not null default now(),
  check ((granted and revoked_at is null) or (not granted))
);

create table gf_core.privacy_preferences (
  person_id uuid primary key references gf_core.persons(person_id) on delete cascade,
  proactive_allowed boolean not null default false,
  memory_allowed boolean not null default false,
  evidence_use_allowed boolean not null default false,
  sharing_allowed boolean not null default false,
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0)
);

alter table gf_core.persons enable row level security;
alter table gf_core.persons force row level security;
alter table gf_core.consent_grants enable row level security;
alter table gf_core.consent_grants force row level security;
alter table gf_core.privacy_preferences enable row level security;
alter table gf_core.privacy_preferences force row level security;

grant select, insert, update on gf_core.persons to authenticated;
grant select, insert, update on gf_core.consent_grants to authenticated;
grant select, insert, update on gf_core.privacy_preferences to authenticated;

create policy persons_self_select on gf_core.persons
for select to authenticated
using (auth.uid() = auth_user_id);

create policy persons_self_insert on gf_core.persons
for insert to authenticated
with check (auth.uid() = auth_user_id);

create policy persons_self_update on gf_core.persons
for update to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

create policy consent_self_select on gf_core.consent_grants
for select to authenticated
using (exists (
  select 1 from gf_core.persons p
  where p.person_id = consent_grants.person_id
    and p.auth_user_id = auth.uid()
));

create policy consent_self_insert on gf_core.consent_grants
for insert to authenticated
with check (exists (
  select 1 from gf_core.persons p
  where p.person_id = consent_grants.person_id
    and p.auth_user_id = auth.uid()
));

create policy consent_self_update on gf_core.consent_grants
for update to authenticated
using (exists (
  select 1 from gf_core.persons p
  where p.person_id = consent_grants.person_id
    and p.auth_user_id = auth.uid()
))
with check (exists (
  select 1 from gf_core.persons p
  where p.person_id = consent_grants.person_id
    and p.auth_user_id = auth.uid()
));

create policy privacy_self_select on gf_core.privacy_preferences
for select to authenticated
using (exists (
  select 1 from gf_core.persons p
  where p.person_id = privacy_preferences.person_id
    and p.auth_user_id = auth.uid()
));

create policy privacy_self_insert on gf_core.privacy_preferences
for insert to authenticated
with check (exists (
  select 1 from gf_core.persons p
  where p.person_id = privacy_preferences.person_id
    and p.auth_user_id = auth.uid()
));

create policy privacy_self_update on gf_core.privacy_preferences
for update to authenticated
using (exists (
  select 1 from gf_core.persons p
  where p.person_id = privacy_preferences.person_id
    and p.auth_user_id = auth.uid()
))
with check (exists (
  select 1 from gf_core.persons p
  where p.person_id = privacy_preferences.person_id
    and p.auth_user_id = auth.uid()
));

create table gf_ledger.domain_events (
  event_id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid,
  actor_type text not null,
  actor_id text,
  person_pseudonym uuid,
  trace_id uuid not null,
  causation_id uuid,
  correlation_id uuid,
  contract_version text not null,
  model_version text,
  policy_version text,
  payload jsonb not null default '{}'::jsonb,
  provenance jsonb not null default '{}'::jsonb
);

create table gf_ledger.outbox (
  outbox_id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  processed_at timestamptz,
  dead_letter_at timestamptz,
  last_error text
);

revoke all on all tables in schema gf_ledger from public, anon, authenticated;

create or replace function gf_ledger.prevent_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'gf_ledger.domain_events is append-only';
end;
$$;

create trigger domain_events_no_update
before update on gf_ledger.domain_events
for each row execute function gf_ledger.prevent_mutation();

create trigger domain_events_no_delete
before delete on gf_ledger.domain_events
for each row execute function gf_ledger.prevent_mutation();

create table gf_private.sanctuary_private_stub (
  entry_id uuid primary key default gen_random_uuid(),
  person_id uuid not null,
  created_at timestamptz not null default now(),
  content_ref text,
  sensitivity text not null default 'private',
  check (sensitivity in ('private','highly_sensitive'))
);

revoke all on all tables in schema gf_private from public, anon, authenticated;

comment on schema gf_core is 'VA+LUMEN greenfield v0.4 foundation - user-owned core data';
comment on schema gf_private is 'VA+LUMEN greenfield v0.4 foundation - server-only sensitive data';
comment on schema gf_ledger is 'VA+LUMEN greenfield v0.4 foundation - append-only domain ledger and outbox';
