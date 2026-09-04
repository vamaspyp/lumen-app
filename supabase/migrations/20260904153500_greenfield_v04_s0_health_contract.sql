-- VA+LUMEN Greenfield V0.4 · S0 live health contract
-- Public, non-sensitive health endpoint for deployment/integration certification.

create or replace function public.lumen_foundation_health()
returns jsonb
language sql
security invoker
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'status', 'ok',
    'slice', 'S0',
    'contract_version', 's0.v1'
  );
$$;

revoke execute on function public.lumen_foundation_health() from public;
grant execute on function public.lumen_foundation_health() to anon, authenticated;

comment on function public.lumen_foundation_health() is 'Non-sensitive S0 health contract for live integration certification.';
