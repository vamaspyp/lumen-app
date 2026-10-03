-- A63 / V46: non-exhaustive editorial examples, NOT a person profile or matching taxonomy.
create table if not exists gf_core.potential_reference_examples (
 example_id text primary key,
 label_es text not null,
 editorial_note text not null,
 provenance text not null,
 status text not null default 'illustrative' check(status='illustrative'),
 created_at timestamptz not null default now()
);
revoke all on gf_core.potential_reference_examples from public,anon,authenticated;
insert into gf_core.potential_reference_examples(example_id,label_es,editorial_note,provenance) values
('presencia','Presencia','Ejemplo abierto de lo que una persona podría cultivar o poner en juego.','V46 §15'),
('regulacion','Regulación','Ejemplo abierto; no equivale a diagnóstico ni escala.','V46 §15'),
('discernimiento','Discernimiento','Ejemplo abierto; pertinencia siempre contextual y revisable.','V46 §15'),
('agencia','Agencia','Ejemplo abierto; no define identidad ni nivel personal.','V46 §15'),
('conexion','Conexión','Ejemplo abierto; no se asigna automáticamente a una persona.','V46 §15'),
('creatividad','Creatividad','Ejemplo abierto; no constituye requisito de matching.','V46 §15'),
('perseverancia','Perseverancia','Ejemplo abierto; no constituye objetivo obligatorio.','V46 §15'),
('apertura','Apertura','Ejemplo abierto; la persona puede reformularlo o descartarlo.','V46 §15'),
('compasion','Compasión','Ejemplo abierto; no implica evaluación de la persona.','V46 §15'),
('sentido','Sentido','Ejemplo abierto; no impone interpretación de la vida.','V46 §15')
on conflict(example_id) do update set label_es=excluded.label_es,editorial_note=excluded.editorial_note,provenance=excluded.provenance;
create or replace function public.lumen_potential_reference_examples()
returns jsonb language sql stable security definer set search_path to ''
as $$
select coalesce(jsonb_agg(jsonb_build_object('id',example_id,'label',label_es,'note',editorial_note,'provenance',provenance) order by example_id),'[]'::jsonb)
from gf_core.potential_reference_examples where status='illustrative'
$$;
revoke all on function public.lumen_potential_reference_examples() from public,anon;
grant execute on function public.lumen_potential_reference_examples() to authenticated;
comment on function public.lumen_potential_reference_examples() is 'Non-exhaustive editorial examples from V46 §15; never automatically assigned to a person or used as canonical matching keys.';