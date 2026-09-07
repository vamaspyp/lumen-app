-- A44 · Restore V40 LIFE inference ownership without freezing taxonomies.
-- Supports territories/context, values, capabilities, levers, preferences and other
-- partial hypotheses with provenance/confidence/validity. No inference is required.

create table if not exists gf_core.inferences (
  inference_id uuid primary key default gen_random_uuid(),
  person_id uuid not null references gf_core.persons(person_id) on delete cascade,
  moment_id uuid references gf_core.moments(moment_id) on delete cascade,
  trajectory_id uuid references gf_core.trajectories(trajectory_id) on delete cascade,
  interpretation_id uuid references gf_core.moment_interpretations(interpretation_id) on delete set null,
  inference_kind text not null check (char_length(trim(inference_kind)) between 1 and 120),
  value jsonb not null,
  status text not null default 'candidate' check (status in ('candidate','confirmed','superseded','rejected','expired')),
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  source_kind text not null check (source_kind in ('person','interpreter','derived','human_review','external_context')),
  source_version text,
  taxonomy_version text,
  provenance jsonb not null default '{}'::jsonb,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check (revision > 0),
  check (valid_to is null or valid_to > valid_from)
);

create index if not exists inferences_person_kind_status_idx
  on gf_core.inferences(person_id,inference_kind,status,valid_from desc);
create index if not exists inferences_moment_idx on gf_core.inferences(moment_id) where moment_id is not null;
create index if not exists inferences_trajectory_idx on gf_core.inferences(trajectory_id) where trajectory_id is not null;

alter table gf_core.inferences enable row level security;

drop policy if exists inferences_self_select on gf_core.inferences;
create policy inferences_self_select on gf_core.inferences for select to authenticated
using (person_id=gf_core.current_person_id());

drop policy if exists inferences_self_update_confirmed on gf_core.inferences;
create policy inferences_self_update_confirmed on gf_core.inferences for update to authenticated
using (person_id=gf_core.current_person_id())
with check (person_id=gf_core.current_person_id());

-- No generic client INSERT/DELETE contract: creation is mediated so provenance/version are mandatory.
revoke insert,delete on gf_core.inferences from public,anon,authenticated;

create or replace function gf_private.record_life_inference(
  p_person_id uuid,
  p_moment_id uuid,
  p_trajectory_id uuid,
  p_interpretation_id uuid,
  p_inference_kind text,
  p_value jsonb,
  p_status text,
  p_confidence numeric,
  p_source_kind text,
  p_source_version text,
  p_taxonomy_version text,
  p_provenance jsonb
) returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare v_id uuid; begin
  if p_person_id is null then raise exception 'person required'; end if;
  if p_moment_id is not null and not exists(select 1 from gf_core.moments where moment_id=p_moment_id and person_id=p_person_id) then raise exception 'moment/person mismatch'; end if;
  if p_trajectory_id is not null and not exists(select 1 from gf_core.trajectories where trajectory_id=p_trajectory_id and person_id=p_person_id) then raise exception 'trajectory/person mismatch'; end if;
  if p_interpretation_id is not null and not exists(select 1 from gf_core.moment_interpretations where interpretation_id=p_interpretation_id and person_id=p_person_id) then raise exception 'interpretation/person mismatch'; end if;
  insert into gf_core.inferences(person_id,moment_id,trajectory_id,interpretation_id,inference_kind,value,status,confidence,source_kind,source_version,taxonomy_version,provenance)
  values(p_person_id,p_moment_id,p_trajectory_id,p_interpretation_id,trim(p_inference_kind),coalesce(p_value,'{}'::jsonb),coalesce(nullif(trim(p_status),''),'candidate'),p_confidence,p_source_kind,p_source_version,p_taxonomy_version,coalesce(p_provenance,'{}'::jsonb))
  returning inference_id into v_id;
  return v_id;
end $$;

revoke all on function gf_private.record_life_inference(uuid,uuid,uuid,uuid,text,jsonb,text,numeric,text,text,text,jsonb) from public,anon,authenticated;

comment on table gf_core.inferences is 'V40 LIFE inference envelope: open/versioned hypotheses and confirmations with provenance, confidence and validity; taxonomy remains data, not schema.';
