-- T2 · CONTINUIDAD · 01 PERSISTENCIA
-- A2 · Cerrar el delta del recorrido completo
-- Contrato: continuidad elegida, sin rachas, score ni penalización.
-- `due` se calcula desde due_at; no se mantiene como estado mutable.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists public.lumen_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  origin_run_id uuid not null references public.experience_runs(id) on delete restrict,
  user_area_faro_id uuid null references public.user_area_faros(id) on delete set null,
  capability_key text null,
  due_at timestamptz not null,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz null,
  constraint lumen_commitments_status_check
    check (status in ('active','returned','cancelled'))
);

create index if not exists lumen_commitments_user_due_idx
  on public.lumen_commitments (user_id, due_at)
  where status = 'active';

create index if not exists lumen_commitments_faro_idx
  on public.lumen_commitments (user_id, user_area_faro_id, status, created_at desc);

create unique index if not exists lumen_commitments_one_active_per_run_uidx
  on public.lumen_commitments (user_id, origin_run_id)
  where status = 'active';

create table if not exists public.lumen_returns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  commitment_id uuid not null references public.lumen_commitments(id) on delete restrict,
  origin_run_id uuid not null references public.experience_runs(id) on delete restrict,
  outcome text not null,
  reflection_text text null,
  barrier_text text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint lumen_returns_outcome_check
    check (outcome in ('did','could_not','did_differently')),
  constraint lumen_returns_commitment_uidx unique (commitment_id)
);

create index if not exists lumen_returns_user_created_idx
  on public.lumen_returns (user_id, created_at desc);

create table if not exists public.faro_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  user_area_faro_id uuid not null references public.user_area_faros(id) on delete cascade,
  measurement_kind text not null,
  value smallint not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint faro_measurements_kind_check
    check (measurement_kind in ('baseline','remeasurement')),
  constraint faro_measurements_value_check
    check (value between 0 and 10)
);

create unique index if not exists faro_measurements_one_baseline_uidx
  on public.faro_measurements (user_area_faro_id)
  where measurement_kind = 'baseline';

create index if not exists faro_measurements_user_faro_created_idx
  on public.faro_measurements (user_id, user_area_faro_id, created_at desc);

-- Las tablas viven en `public` porque son evidencia personal canónica, pero
-- el cliente no las consume directamente: el contrato normal es RPC.
alter table public.lumen_commitments enable row level security;
alter table public.lumen_returns enable row level security;
alter table public.faro_measurements enable row level security;

revoke all on table public.lumen_commitments from public, anon, authenticated;
revoke all on table public.lumen_returns from public, anon, authenticated;
revoke all on table public.faro_measurements from public, anon, authenticated;

grant select, insert, update, delete on table public.lumen_commitments to service_role;
grant select, insert, update, delete on table public.lumen_returns to service_role;
grant select, insert, update, delete on table public.faro_measurements to service_role;

-- Defensa en profundidad: si en el futuro se habilitan grants directos, las
-- filas continúan limitadas al dueño. Hoy estos policies no sustituyen RPC.
drop policy if exists lumen_commitments_own_select on public.lumen_commitments;
create policy lumen_commitments_own_select
  on public.lumen_commitments for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists lumen_commitments_own_insert on public.lumen_commitments;
create policy lumen_commitments_own_insert
  on public.lumen_commitments for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists lumen_commitments_own_update on public.lumen_commitments;
create policy lumen_commitments_own_update
  on public.lumen_commitments for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists lumen_commitments_own_delete on public.lumen_commitments;
create policy lumen_commitments_own_delete
  on public.lumen_commitments for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists lumen_returns_own_select on public.lumen_returns;
create policy lumen_returns_own_select
  on public.lumen_returns for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists lumen_returns_own_insert on public.lumen_returns;
create policy lumen_returns_own_insert
  on public.lumen_returns for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists faro_measurements_own_select on public.faro_measurements;
create policy faro_measurements_own_select
  on public.faro_measurements for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists faro_measurements_own_insert on public.faro_measurements;
create policy faro_measurements_own_insert
  on public.faro_measurements for insert to authenticated
  with check ((select auth.uid()) = user_id);

commit;
