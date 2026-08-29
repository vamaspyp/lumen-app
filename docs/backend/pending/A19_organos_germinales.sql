-- A19 · Construir y verificar los cuatro órganos germinales
-- Estado: PENDIENTE DE AUTORIZACIÓN PARA APLICAR EN SUPABASE REAL.
-- Autoridad: V4 · Especificación vigente del Embrión + A19.
-- Principio: organismo completo conceptualmente, mínimo operacionalmente.
-- Alcance: Mercado, Comunidad, Círculos y Común en forma germinal; sin pagos,
-- feed social, participantes reales obligatorios ni publicación del Común.
--
-- Diseño de seguridad:
-- - persistencia A19 en schema private, no expuesto al Data API;
-- - RLS también habilitado en tablas privadas como defensa en profundidad;
-- - sólo RPCs de lectura/acción necesarios quedan en public para el dispatcher;
-- - mutaciones administrativas de Círculos y Común quedan en private + service_role;
-- - submit_contribution completa una acción visible ya existente y exige session_id válido;
-- - SECURITY DEFINER fija search_path vacío y califica todos los objetos.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

-- ---------------------------------------------------------------------------
-- 1. MERCADO · una oferta/proveedor elegible y conexión externa, sin pagos
-- ---------------------------------------------------------------------------

create table if not exists private.lumen_market_offers (
  id uuid primary key default gen_random_uuid(),
  source_resource_id uuid not null references public.resources(id),
  provider_name text not null,
  offer_title text not null,
  description text,
  connection_url text not null,
  status text not null default 'available'
    check (status in ('available', 'paused', 'closed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_resource_id)
);

alter table private.lumen_market_offers enable row level security;
revoke all privileges on table private.lumen_market_offers from public, anon, authenticated;
grant all privileges on table private.lumen_market_offers to service_role;

-- Semilla real y ya curada en Fuente: proveedor externo + URL existente.
insert into private.lumen_market_offers (
  source_resource_id,
  provider_name,
  offer_title,
  description,
  connection_url,
  status,
  metadata
)
select
  r.id,
  r.provider,
  r.title,
  coalesce(r.description_short, r.when_it_helps, 'Oferta externa curada por LUMEN.'),
  r.url,
  'available',
  jsonb_build_object(
    'act', 'A19',
    'germinal', true,
    'connection_mode', 'external',
    'source_kind', r.source_kind,
    'resource_kind', r.resource_kind
  )
from public.resources r
where r.id = '93d49a58-ceca-43f5-9321-635363b7b2a6'::uuid
  and r.is_active is true
  and nullif(trim(r.provider), '') is not null
  and nullif(trim(r.url), '') is not null
on conflict (source_resource_id) do update
set provider_name = excluded.provider_name,
    offer_title = excluded.offer_title,
    description = excluded.description,
    connection_url = excluded.connection_url,
    status = excluded.status,
    metadata = private.lumen_market_offers.metadata || excluded.metadata,
    updated_at = now();

create or replace function public.lumi_open_mercado(p_params jsonb default '{}'::jsonb)
returns jsonb
language sql
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'ok', true,
    'code', 'MERCADO_ENTRY',
    'message', 'Opciones externas que pueden ayudarte, sin compra dentro de LUMEN.',
    'actions', '[]'::jsonb,
    'content_type', 'item_list',
    'content', jsonb_build_object(
      'type', 'item_list',
      'source', 'mercado',
      'items', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', mo.id::text,
            'title', mo.offer_title,
            'subtitle', mo.provider_name,
            'action', 'open_resource',
            'resource_id', mo.source_resource_id::text,
            'source', 'mercado'
          ) order by mo.created_at asc
        )
        from private.lumen_market_offers mo
        where mo.status = 'available'
      ), '[]'::jsonb)
    ),
    'state', jsonb_build_object('contentSource', 'mercado')
  );
$function$;

revoke execute on function public.lumi_open_mercado(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.lumi_open_mercado(jsonb) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. COMUNIDAD · puerta mínima de contribución, sin feed/likes/rankings
-- ---------------------------------------------------------------------------

create table if not exists private.lumen_community_contributions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id),
  user_id uuid references public.users(id),
  title text not null,
  url text,
  why text,
  status text not null default 'received'
    check (status in ('received', 'reviewed', 'accepted', 'rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table private.lumen_community_contributions enable row level security;
revoke all privileges on table private.lumen_community_contributions from public, anon, authenticated;
grant all privileges on table private.lumen_community_contributions to service_role;

create or replace function public.lumi_open_comunidad(p_params jsonb default '{}'::jsonb)
returns jsonb
language sql
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'ok', true,
    'code', 'COMMUNITY_ENTRY',
    'message', 'Si conocés algo que podría ayudar a otra persona, podés acercarlo.',
    'actions', jsonb_build_array(
      jsonb_build_object('label', 'Enviar propuesta', 'action', 'submit_contribution', 'variant', 'solid'),
      jsonb_build_object('label', 'Ahora no', 'action', 'go_home', 'variant', 'ghost')
    ),
    'content_type', 'contribution_form',
    'content', jsonb_build_object(
      'type', 'contribution_form',
      'form_kind', 'resource_contribution',
      'source', 'community'
    ),
    'state', jsonb_build_object('contentSource', 'community')
  );
$function$;

create or replace function public.lumi_submit_contribution(p_params jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_session_id uuid;
  v_user_id uuid;
  v_title text;
  v_url text;
  v_why text;
  v_id uuid;
begin
  p_params := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));

  begin
    v_session_id := nullif(trim(coalesce(p_params->>'session_id', '')), '')::uuid;
  exception when invalid_text_representation then
    v_session_id := null;
  end;

  v_title := nullif(left(trim(coalesce(p_params->>'contribution_title', '')), 180), '');
  v_url := nullif(left(trim(coalesce(p_params->>'contribution_url', '')), 1000), '');
  v_why := nullif(left(trim(coalesce(p_params->>'contribution_why', '')), 2000), '');

  if v_session_id is null or v_title is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'CONTRIBUTION_ERROR',
      'error', 'session_id y contribution_title son requeridos',
      'message', 'Necesito una sesión válida y un título para recibir la propuesta.',
      'actions', jsonb_build_array(
        jsonb_build_object('label', 'Volver', 'action', 'open_comunidad', 'variant', 'outline')
      ),
      'content_type', 'empty_presence',
      'content', jsonb_build_object('type', 'empty_presence', 'source', 'community'),
      'state', jsonb_build_object('contentSource', 'community')
    );
  end if;

  select s.user_id
    into v_user_id
  from public.sessions s
  where s.id = v_session_id;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'code', 'CONTRIBUTION_ERROR',
      'error', 'session_not_found',
      'message', 'No pude vincular esta contribución a una sesión válida.',
      'actions', jsonb_build_array(
        jsonb_build_object('label', 'Volver', 'action', 'open_comunidad', 'variant', 'outline')
      ),
      'content_type', 'empty_presence',
      'content', jsonb_build_object('type', 'empty_presence', 'source', 'community'),
      'state', jsonb_build_object('contentSource', 'community')
    );
  end if;

  insert into private.lumen_community_contributions (
    session_id, user_id, title, url, why, metadata
  ) values (
    v_session_id,
    v_user_id,
    v_title,
    v_url,
    v_why,
    jsonb_build_object('act', 'A19', 'germinal', true)
  ) returning id into v_id;

  return jsonb_build_object(
    'ok', true,
    'code', 'CONTRIBUTION_SUBMITTED',
    'message', 'Gracias. Lo recibimos para revisarlo con cuidado.',
    'actions', jsonb_build_array(
      jsonb_build_object('label', 'Volver al inicio', 'action', 'go_home', 'variant', 'solid')
    ),
    'content_type', 'empty_presence',
    'content', jsonb_build_object('type', 'empty_presence', 'source', 'community'),
    'state', jsonb_build_object('contentSource', 'community'),
    'contribution_id', v_id::text
  );
end;
$function$;

revoke execute on function public.lumi_open_comunidad(jsonb) from public, anon, authenticated, service_role;
revoke execute on function public.lumi_submit_contribution(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.lumi_open_comunidad(jsonb) to anon, authenticated, service_role;
grant execute on function public.lumi_submit_contribution(jsonb) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. CÍRCULOS · pequeño, cerrado, temporal y gestionable en entorno controlado
-- ---------------------------------------------------------------------------

create table if not exists private.lumen_circles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  purpose text,
  status text not null default 'draft'
    check (status in ('draft', 'open', 'closed')),
  starts_at timestamptz,
  ends_at timestamptz not null,
  max_people integer not null default 8
    check (max_people between 2 and 12),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  check (starts_at is null or ends_at > starts_at)
);

alter table private.lumen_circles enable row level security;
revoke all privileges on table private.lumen_circles from public, anon, authenticated;
grant all privileges on table private.lumen_circles to service_role;

create or replace function private.lumen_create_circle(p_params jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_title text;
  v_purpose text;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_max_people integer;
  v_id uuid;
begin
  v_title := nullif(left(trim(coalesce(p_params->>'title', '')), 180), '');
  v_purpose := nullif(left(trim(coalesce(p_params->>'purpose', '')), 1000), '');

  begin
    v_starts_at := nullif(trim(coalesce(p_params->>'starts_at', '')), '')::timestamptz;
    v_ends_at := nullif(trim(coalesce(p_params->>'ends_at', '')), '')::timestamptz;
    v_max_people := greatest(2, least(12, coalesce((p_params->>'max_people')::integer, 8)));
  exception when invalid_text_representation or datetime_field_overflow then
    return jsonb_build_object('ok', false, 'error', 'parámetros temporales o max_people inválidos');
  end;

  if v_title is null or v_ends_at is null then
    return jsonb_build_object('ok', false, 'error', 'title y ends_at son requeridos');
  end if;

  if v_starts_at is not null and v_ends_at <= v_starts_at then
    return jsonb_build_object('ok', false, 'error', 'ends_at debe ser posterior a starts_at');
  end if;

  insert into private.lumen_circles (
    title, purpose, status, starts_at, ends_at, max_people, metadata
  ) values (
    v_title,
    v_purpose,
    'open',
    v_starts_at,
    v_ends_at,
    v_max_people,
    coalesce(p_params->'metadata', '{}'::jsonb) || jsonb_build_object('act', 'A19', 'germinal', true)
  ) returning id into v_id;

  return jsonb_build_object('ok', true, 'circle_id', v_id::text, 'status', 'open');
end;
$function$;

create or replace function private.lumen_close_circle(p_params jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_id uuid;
  v_changed integer;
begin
  begin
    v_id := nullif(trim(coalesce(p_params->>'circle_id', '')), '')::uuid;
  exception when invalid_text_representation then
    v_id := null;
  end;

  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'circle_id requerido');
  end if;

  update private.lumen_circles
  set status = 'closed',
      closed_at = now(),
      updated_at = now()
  where id = v_id
    and status <> 'closed';

  get diagnostics v_changed = row_count;

  return jsonb_build_object(
    'ok', v_changed = 1,
    'circle_id', v_id::text,
    'status', case when v_changed = 1 then 'closed' else 'not_changed' end
  );
end;
$function$;

create or replace function public.lumi_get_circulos_activities(p_filter_area text default '')
returns jsonb
language sql
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'type', 'item_list',
    'source', 'circulos',
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id::text,
          'title', c.title,
          'subtitle', coalesce(c.purpose, 'Círculo pequeño y temporal'),
          'action', 'open_circulos',
          'value', c.id::text,
          'source', 'circulos'
        ) order by c.created_at desc
      )
      from private.lumen_circles c
      where c.status = 'open'
        and c.ends_at > now()
    ), '[]'::jsonb)
  );
$function$;

revoke execute on function private.lumen_create_circle(jsonb) from public, anon, authenticated, service_role;
revoke execute on function private.lumen_close_circle(jsonb) from public, anon, authenticated, service_role;
grant execute on function private.lumen_create_circle(jsonb) to service_role;
grant execute on function private.lumen_close_circle(jsonb) to service_role;
revoke execute on function public.lumi_get_circulos_activities(text) from public, anon, authenticated, service_role;
grant execute on function public.lumi_get_circulos_activities(text) to anon, authenticated, service_role;

-- Los nodos ya existen pero estaban dormidos. Se activa sólo entrada/vacío germinal.
update public.lumen_nodes
set active = true,
    updated_at = now()
where code in ('CIRCULOS_ENTRY', 'CIRCULOS_EMPTY');

-- ---------------------------------------------------------------------------
-- 4. COMÚN · evidencia/aprendizaje interno estructurado, no publicación abierta
-- ---------------------------------------------------------------------------

create table if not exists private.lumen_common_entries (
  id uuid primary key default gen_random_uuid(),
  experience_run_id uuid not null references public.experience_runs(id) on delete cascade,
  entry_key text not null,
  summary text not null,
  evidence jsonb not null default '{}'::jsonb,
  shareable boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (experience_run_id, entry_key)
);

alter table private.lumen_common_entries enable row level security;
revoke all privileges on table private.lumen_common_entries from public, anon, authenticated;
grant all privileges on table private.lumen_common_entries to service_role;

create or replace function private.lumen_capture_common_learning(p_params jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_run_id uuid;
  v_entry_key text;
  v_summary text;
  v_evidence jsonb;
  v_id uuid;
begin
  begin
    v_run_id := nullif(trim(coalesce(p_params->>'experience_run_id', '')), '')::uuid;
  exception when invalid_text_representation then
    v_run_id := null;
  end;

  v_entry_key := nullif(left(trim(coalesce(p_params->>'entry_key', '')), 120), '');
  v_summary := nullif(left(trim(coalesce(p_params->>'summary', '')), 1000), '');
  v_evidence := coalesce(p_params->'evidence', '{}'::jsonb);

  if v_run_id is null or v_entry_key is null or v_summary is null then
    return jsonb_build_object('ok', false, 'error', 'experience_run_id, entry_key y summary son requeridos');
  end if;

  if not exists (select 1 from public.experience_runs er where er.id = v_run_id) then
    return jsonb_build_object('ok', false, 'error', 'experience_run_not_found');
  end if;

  insert into private.lumen_common_entries (
    experience_run_id, entry_key, summary, evidence, shareable, metadata
  ) values (
    v_run_id,
    v_entry_key,
    v_summary,
    v_evidence,
    false,
    jsonb_build_object('act', 'A19', 'germinal', true, 'contains_private_text', false)
  )
  on conflict (experience_run_id, entry_key) do update
  set summary = excluded.summary,
      evidence = excluded.evidence,
      shareable = false,
      metadata = private.lumen_common_entries.metadata || excluded.metadata,
      updated_at = now()
  returning id into v_id;

  return jsonb_build_object('ok', true, 'common_entry_id', v_id::text, 'shareable', false);
end;
$function$;

create or replace function private.lumen_get_common_learning(p_experience_run_id uuid)
returns jsonb
language sql
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'ok', true,
    'experience_run_id', p_experience_run_id::text,
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', ce.id::text,
          'entry_key', ce.entry_key,
          'summary', ce.summary,
          'evidence', ce.evidence,
          'shareable', ce.shareable,
          'created_at', ce.created_at
        ) order by ce.created_at asc
      )
      from private.lumen_common_entries ce
      where ce.experience_run_id = p_experience_run_id
    ), '[]'::jsonb)
  );
$function$;

revoke execute on function private.lumen_capture_common_learning(jsonb) from public, anon, authenticated, service_role;
revoke execute on function private.lumen_get_common_learning(uuid) from public, anon, authenticated, service_role;
grant execute on function private.lumen_capture_common_learning(jsonb) to service_role;
grant execute on function private.lumen_get_common_learning(uuid) to service_role;

commit;
