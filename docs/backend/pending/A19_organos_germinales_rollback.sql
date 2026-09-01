-- A19 · ROLLBACK · órganos germinales
-- Usar sólo si se decide revertir integralmente el delta A19 aplicado.

begin;

-- Restaurar estado previo observado de Círculos: entrada/vacío inactivos.
update public.lumen_nodes
set active = false,
    updated_at = now()
where code in ('CIRCULOS_ENTRY', 'CIRCULOS_EMPTY');

-- Superficie pública agregada por A19.
drop function if exists public.lumi_open_mercado(jsonb);
drop function if exists public.lumi_open_comunidad(jsonb);
drop function if exists public.lumi_submit_contribution(jsonb);
drop function if exists public.lumi_get_circulos_activities(text);

-- Helpers internos agregados por A19.
drop function if exists private.lumen_create_circle(jsonb);
drop function if exists private.lumen_close_circle(jsonb);
drop function if exists private.lumen_capture_common_learning(jsonb);
drop function if exists private.lumen_get_common_learning(uuid);

-- Persistencia agregada por A19.
drop table if exists private.lumen_common_entries;
drop table if exists private.lumen_circles;
drop table if exists private.lumen_community_contributions;
drop table if exists private.lumen_market_offers;

-- No se elimina el schema private: queda como frontera técnica reutilizable.
commit;
