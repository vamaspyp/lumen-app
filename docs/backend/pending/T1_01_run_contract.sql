-- T1 · Check-in → Match → Run · 01/02
-- Estado: PREPRODUCCIÓN / NO APLICAR SIN AUTORIZACIÓN.
-- Autoridad: Especificación Funcional Embrión V2 + E2 Técnica V1
--            + T1-precondicion-contrato-checkin-match-run-2026-08-31.md
-- Principio: sessions = Momento; session_events = journal; experience_runs = ejecución real.
-- MATCH NO crea RUN.

begin;

-- ---------------------------------------------------------------------------
-- 1. experience_runs: semántica canónica aditiva
-- ---------------------------------------------------------------------------

alter table public.experience_runs
  add column if not exists selection_source text,
  add column if not exists served_capability_key text,
  add column if not exists realization_type text,
  add column if not exists offer_snapshot jsonb;

do $ddl$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.experience_runs'::regclass
      and conname = 'experience_runs_selection_source_check'
  ) then
    alter table public.experience_runs
      add constraint experience_runs_selection_source_check
      check (
        selection_source is null
        or selection_source in ('motor','fuente','sanctuary','tejido','derrame','mercado','other')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.experience_runs'::regclass
      and conname = 'experience_runs_realization_type_check'
  ) then
    alter table public.experience_runs
      add constraint experience_runs_realization_type_check
      check (
        realization_type is null
        or realization_type in ('source','sanctuary','weave','spill','market','other')
      );
  end if;
end
$ddl$;

-- Idempotencia del acto "Empezar": el token nace en la PRE y se materializa
-- recién cuando la persona acepta/inicia. No se crea tabla pending_offers.
create unique index if not exists experience_runs_offer_token_uidx
  on public.experience_runs ((offer_snapshot->>'offer_token'))
  where nullif(offer_snapshot->>'offer_token', '') is not null;

-- ---------------------------------------------------------------------------
-- 2. Backfill conservador: sólo equivalencias verificables
-- ---------------------------------------------------------------------------
-- No se inventa offer_snapshot histórico.
-- No se rellena served_capability cuando la equivalencia es ambigua.

update public.experience_runs
set selection_source = case hypothesis_json->>'source'
  when 'lumi_motor'       then 'motor'
  when 'fuente'           then 'fuente'
  when 'sanctuary'        then 'sanctuary'
  when 'sanctuary_replay' then 'sanctuary'
  else selection_source
end
where selection_source is null
  and hypothesis_json is not null;

update public.experience_runs
set realization_type = case selection_source
  when 'motor'     then 'source'
  when 'fuente'    then 'source'
  when 'sanctuary' then 'sanctuary'
  else realization_type
end
where realization_type is null;

-- primary_capability_key es la equivalencia más fuerte ya normalizada.
update public.experience_runs
set served_capability_key = primary_capability_key
where served_capability_key is null
  and nullif(primary_capability_key, '') is not null;

-- En runs del motor antiguo el selector exigía selected = expected. Sólo en
-- esa igualdad verificable se completa el hueco; el resto queda NULL.
update public.experience_runs
set served_capability_key = selected_capability_key
where served_capability_key is null
  and selection_source = 'motor'
  and nullif(selected_capability_key, '') is not null
  and selected_capability_key = expected_capability_key;

-- ---------------------------------------------------------------------------
-- 3. Normalizador existente: canonical-first, legacy fallback
-- ---------------------------------------------------------------------------
-- Se conserva el trigger vivo, pero deja de derivar metadata primero desde
-- hypothesis_json cuando ya existe semántica canónica.

create or replace function public.lumi_normalize_experience_run_context()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  new.metadata :=
    coalesce(new.metadata, '{}'::jsonb)
    || jsonb_build_object(
      'source_hint',
        coalesce(
          new.metadata->>'source_hint',
          new.selection_source,
          new.offer_snapshot->>'selection_source',
          new.hypothesis_json->>'source',
          case
            when new.session_id is null then 'direct_open_or_replay'
            else 'lumi_motor'
          end
        ),
      'checkin_time_bucket',
        coalesce(
          new.metadata->>'checkin_time_bucket',
          new.offer_snapshot->>'time_bucket',
          new.hypothesis_json->>'time_bucket'
        )
    );

  return new;
end;
$function$;

commit;
