-- A51 · V49 clean convergence · data model
-- Direct target from V46 -> V48 -> V49. No permanent compatibility layer.

create table if not exists gf_core.area_terms (
  taxonomy_version text not null,
  area_key text not null,
  display_name text not null,
  status text not null default 'active' check (status in ('active','retired')),
  created_at timestamptz not null default now(),
  primary key (taxonomy_version, area_key)
);

create table if not exists gf_core.capacity_terms (
  taxonomy_version text not null,
  capacity_key text not null,
  display_name text not null,
  status text not null default 'active' check (status in ('active','retired')),
  created_at timestamptz not null default now(),
  primary key (taxonomy_version, capacity_key)
);

insert into gf_core.area_terms(taxonomy_version,area_key,display_name,status) values
('life-taxonomy.v1','economy','Economía','active'),
('life-taxonomy.v1','family_care','Familia y cuidado','active'),
('life-taxonomy.v1','general_life','Vida cotidiana','active'),
('life-taxonomy.v1','learning_growth','Aprendizaje y crecimiento','active'),
('life-taxonomy.v1','meaning_spirituality','Sentido y espiritualidad','active'),
('life-taxonomy.v1','relationships','Vínculos','active'),
('life-taxonomy.v1','wellbeing','Bienestar y salud cotidiana','active'),
('life-taxonomy.v1','work','Trabajo','active')
on conflict (taxonomy_version,area_key) do update set display_name=excluded.display_name,status=excluded.status;

insert into gf_core.capacity_terms(taxonomy_version,capacity_key,display_name,status) values
('life-taxonomy.v1','adaptation','Adaptación','active'),
('life-taxonomy.v1','agency','Agencia','active'),
('life-taxonomy.v1','appreciation','Apreciación','active'),
('life-taxonomy.v1','attention','Atención','active'),
('life-taxonomy.v1','connection','Conexión','active'),
('life-taxonomy.v1','discernment','Discernimiento','active'),
('life-taxonomy.v1','integration','Integración','active'),
('life-taxonomy.v1','meaning','Sentido','active'),
('life-taxonomy.v1','regulation','Regulación','active'),
('life-taxonomy.v1','self_compassion','Autocompasión','active')
on conflict (taxonomy_version,capacity_key) do update set display_name=excluded.display_name,status=excluded.status;

alter table gf_core.moment_interpretations
  add column if not exists taxonomy_version text,
  add column if not exists area_keys text[] not null default '{}',
  add column if not exists capacity_keys text[] not null default '{}';

-- Reclassify existing synthetic interpretations into the durable Area/Capacity vocabulary.
with mapped as (
  select mi.interpretation_id,
         array_agg(distinct case n
           when 'financial_calm' then 'economy'
           when 'caregiving' then 'family_care'
           when 'focus' then 'learning_growth'
           when 'meaning' then 'meaning_spirituality'
           when 'boundaries' then 'relationships'
           when 'connection' then 'relationships'
           when 'grief' then 'relationships'
           when 'relationship_repair' then 'relationships'
           when 'work_stress' then 'work'
           when 'anxiety' then 'wellbeing'
           when 'emotion_regulation' then 'wellbeing'
           when 'energy' then 'wellbeing'
           when 'pause' then 'wellbeing'
           when 'self_compassion' then 'wellbeing'
           when 'sleep' then 'wellbeing'
           else 'general_life' end order by case n
           when 'financial_calm' then 'economy'
           when 'caregiving' then 'family_care'
           when 'focus' then 'learning_growth'
           when 'meaning' then 'meaning_spirituality'
           when 'boundaries' then 'relationships'
           when 'connection' then 'relationships'
           when 'grief' then 'relationships'
           when 'relationship_repair' then 'relationships'
           when 'work_stress' then 'work'
           when 'anxiety' then 'wellbeing'
           when 'emotion_regulation' then 'wellbeing'
           when 'energy' then 'wellbeing'
           when 'pause' then 'wellbeing'
           when 'self_compassion' then 'wellbeing'
           when 'sleep' then 'wellbeing'
           else 'general_life' end) as areas,
         array_agg(distinct case n
           when 'agency' then 'agency'
           when 'anxiety' then 'regulation'
           when 'appreciation' then 'appreciation'
           when 'boundaries' then 'agency'
           when 'caregiving' then 'self_compassion'
           when 'change_transition' then 'adaptation'
           when 'clarity' then 'discernment'
           when 'confidence' then 'agency'
           when 'connection' then 'connection'
           when 'emotion_regulation' then 'regulation'
           when 'energy' then 'agency'
           when 'financial_calm' then 'discernment'
           when 'focus' then 'attention'
           when 'grief' then 'integration'
           when 'habit' then 'agency'
           when 'meaning' then 'meaning'
           when 'pause' then 'regulation'
           when 'relationship_repair' then 'connection'
           when 'self_compassion' then 'self_compassion'
           when 'sleep' then 'regulation'
           when 'work_stress' then 'regulation'
           when 'human_support' then 'connection'
           else 'discernment' end order by case n
           when 'agency' then 'agency'
           when 'anxiety' then 'regulation'
           when 'appreciation' then 'appreciation'
           when 'boundaries' then 'agency'
           when 'caregiving' then 'self_compassion'
           when 'change_transition' then 'adaptation'
           when 'clarity' then 'discernment'
           when 'confidence' then 'agency'
           when 'connection' then 'connection'
           when 'emotion_regulation' then 'regulation'
           when 'energy' then 'agency'
           when 'financial_calm' then 'discernment'
           when 'focus' then 'attention'
           when 'grief' then 'integration'
           when 'habit' then 'agency'
           when 'meaning' then 'meaning'
           when 'pause' then 'regulation'
           when 'relationship_repair' then 'connection'
           when 'self_compassion' then 'self_compassion'
           when 'sleep' then 'regulation'
           when 'work_stress' then 'regulation'
           when 'human_support' then 'connection'
           else 'discernment' end) as capacities
  from gf_core.moment_interpretations mi
  cross join lateral unnest(coalesce(mi.need_keys,'{}'::text[])) n
  group by mi.interpretation_id
)
update gf_core.moment_interpretations mi
set taxonomy_version='life-taxonomy.v1',
    area_keys=case when cardinality(mi.area_keys)>0 then mi.area_keys else mapped.areas end,
    capacity_keys=case when cardinality(mi.capacity_keys)>0 then mi.capacity_keys else mapped.capacities end
from mapped where mapped.interpretation_id=mi.interpretation_id;

update gf_core.moment_interpretations
set taxonomy_version='life-taxonomy.v1'
where taxonomy_version is distinct from 'life-taxonomy.v1';

create table if not exists gf_core.help_applicability (
  applicability_id uuid primary key default gen_random_uuid(),
  help_version_id uuid not null references gf_core.help_versions(help_version_id) on delete cascade,
  taxonomy_version text not null,
  area_key text not null,
  capacity_key text not null,
  state text not null check (state in ('applicable','partial','restricted')),
  priority_hint smallint not null default 50 check (priority_hint between 1 and 100),
  applicability_confidence numeric(4,3) not null default 0.500 check (applicability_confidence between 0 and 1),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  last_evidence_at timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint help_applicability_area_fk foreign key (taxonomy_version,area_key) references gf_core.area_terms(taxonomy_version,area_key),
  constraint help_applicability_capacity_fk foreign key (taxonomy_version,capacity_key) references gf_core.capacity_terms(taxonomy_version,capacity_key),
  constraint help_applicability_unique unique (help_version_id,taxonomy_version,area_key,capacity_key)
);

alter table gf_core.help_applicability enable row level security;
create index if not exists help_applicability_lookup_idx on gf_core.help_applicability(taxonomy_version,area_key,capacity_key,state,priority_hint);
create index if not exists help_applicability_help_version_idx on gf_core.help_applicability(help_version_id);

-- Seed the clean applicability relation from the previous synthetic coverage catalogue.
insert into gf_core.help_applicability(
  help_version_id,taxonomy_version,area_key,capacity_key,state,priority_hint,applicability_confidence,provenance
)
select distinct hv.help_version_id,
       'life-taxonomy.v1',
       case cc.need_key
         when 'financial_calm' then 'economy'
         when 'caregiving' then 'family_care'
         when 'focus' then 'learning_growth'
         when 'meaning' then 'meaning_spirituality'
         when 'boundaries' then 'relationships'
         when 'connection' then 'relationships'
         when 'grief' then 'relationships'
         when 'relationship_repair' then 'relationships'
         when 'work_stress' then 'work'
         when 'anxiety' then 'wellbeing'
         when 'emotion_regulation' then 'wellbeing'
         when 'energy' then 'wellbeing'
         when 'pause' then 'wellbeing'
         when 'self_compassion' then 'wellbeing'
         when 'sleep' then 'wellbeing'
         else 'general_life' end,
       case cc.need_key
         when 'agency' then 'agency'
         when 'anxiety' then 'regulation'
         when 'appreciation' then 'appreciation'
         when 'boundaries' then 'agency'
         when 'caregiving' then 'self_compassion'
         when 'change_transition' then 'adaptation'
         when 'clarity' then 'discernment'
         when 'confidence' then 'agency'
         when 'connection' then 'connection'
         when 'emotion_regulation' then 'regulation'
         when 'energy' then 'agency'
         when 'financial_calm' then 'discernment'
         when 'focus' then 'attention'
         when 'grief' then 'integration'
         when 'habit' then 'agency'
         when 'meaning' then 'meaning'
         when 'pause' then 'regulation'
         when 'relationship_repair' then 'connection'
         when 'self_compassion' then 'self_compassion'
         when 'sleep' then 'regulation'
         when 'work_stress' then 'regulation'
         when 'human_support' then 'connection'
         else 'discernment' end,
       case cc.status when 'covered' then 'applicable' when 'partial' then 'partial' else 'restricted' end,
       cc.priority_hint,
       case cc.status when 'covered' then 0.700 when 'partial' then 0.500 else 0.300 end,
       jsonb_build_object('source','coverage_cells_migration','legacy_need_key',cc.need_key)
from gf_core.coverage_cells cc
join gf_core.help_possibilities hp on hp.help_id=cc.help_id
join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version
where cc.status <> 'not_covered'
on conflict (help_version_id,taxonomy_version,area_key,capacity_key) do update
set state=excluded.state,
    priority_hint=least(gf_core.help_applicability.priority_hint,excluded.priority_hint),
    applicability_confidence=greatest(gf_core.help_applicability.applicability_confidence,excluded.applicability_confidence),
    provenance=gf_core.help_applicability.provenance || excluded.provenance,
    updated_at=now();

-- Selection becomes the immutable link between a decision, an exact help version and an outcome.
alter table gf_core.help_selections
  add column if not exists decision_run_id uuid,
  add column if not exists help_version_id uuid;

with ranked as (
  select hs.selection_id,ce.decision_run_id,ce.help_version_id,
         row_number() over(partition by hs.selection_id order by ce.created_at desc) as rn
  from gf_core.help_selections hs
  join gf_core.decision_runs dr on dr.episode_id=hs.episode_id and dr.person_id=hs.person_id
  join gf_core.candidate_exposures ce on ce.decision_run_id=dr.decision_run_id and ce.person_id=hs.person_id and ce.help_id=hs.help_id
), picked as (
  select selection_id,decision_run_id,help_version_id from ranked where rn=1
)
update gf_core.help_selections hs
set decision_run_id=picked.decision_run_id,
    help_version_id=picked.help_version_id
from picked
where hs.selection_id=picked.selection_id and (hs.decision_run_id is null or hs.help_version_id is null);

do $$
begin
  if exists(select 1 from gf_core.help_selections where decision_run_id is null or help_version_id is null) then
    raise exception 'A51 cannot trace all existing selections to decision/help version';
  end if;
end $$;

alter table gf_core.help_selections alter column decision_run_id set not null;
alter table gf_core.help_selections alter column help_version_id set not null;

do $$
begin
  if not exists(select 1 from pg_constraint where conname='help_selections_decision_run_id_fkey' and conrelid='gf_core.help_selections'::regclass) then
    alter table gf_core.help_selections add constraint help_selections_decision_run_id_fkey foreign key(decision_run_id) references gf_core.decision_runs(decision_run_id);
  end if;
  if not exists(select 1 from pg_constraint where conname='help_selections_help_version_id_fkey' and conrelid='gf_core.help_selections'::regclass) then
    alter table gf_core.help_selections add constraint help_selections_help_version_id_fkey foreign key(help_version_id) references gf_core.help_versions(help_version_id);
  end if;
end $$;

create unique index if not exists help_selections_one_selected_per_episode_idx
  on gf_core.help_selections(episode_id,person_id) where action='selected';

alter table gf_core.outcomes_feedback add column if not exists selection_id uuid;

with ranked as (
  select o.outcome_id,hs.selection_id,
         row_number() over(partition by o.outcome_id order by hs.created_at desc) as rn
  from gf_core.outcomes_feedback o
  join gf_core.help_selections hs on hs.episode_id=o.episode_id and hs.person_id=o.person_id and hs.help_id=o.help_id and hs.action='selected'
), picked as (
  select outcome_id,selection_id from ranked where rn=1
)
update gf_core.outcomes_feedback o
set selection_id=picked.selection_id
from picked
where o.outcome_id=picked.outcome_id and o.selection_id is null;

do $$
begin
  if exists(select 1 from gf_core.outcomes_feedback where selection_id is null) then
    raise exception 'A51 cannot trace all existing outcomes to a selection';
  end if;
end $$;

alter table gf_core.outcomes_feedback alter column selection_id set not null;

do $$
begin
  if not exists(select 1 from pg_constraint where conname='outcomes_feedback_selection_id_fkey' and conrelid='gf_core.outcomes_feedback'::regclass) then
    alter table gf_core.outcomes_feedback add constraint outcomes_feedback_selection_id_fkey foreign key(selection_id) references gf_core.help_selections(selection_id);
  end if;
end $$;

create unique index if not exists outcomes_feedback_one_per_selection_idx on gf_core.outcomes_feedback(selection_id);
