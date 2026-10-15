-- A68 exception authorized by Pablo 2026-10-03: reference curation only, NOT user assignment or live matching.
-- V46/V53: open revisable distinctions, no mandatory potential_key and no scores.
create table if not exists gf_core.potential_concepts (
 concept_id uuid primary key default gen_random_uuid(),
 concept_code text not null unique,
 label_es text not null,
 definition_es text not null,
 scope_note text not null,
 editorial_status text not null default 'candidate' check(editorial_status in ('candidate','reviewed','retired')),
 provenance jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create table if not exists gf_core.potential_terms (
 term_id uuid primary key default gen_random_uuid(),
 concept_id uuid not null references gf_core.potential_concepts(concept_id),
 term text not null,
 language_tag text not null default 'es',
 relation text not null check(relation in ('preferred','synonym','near','related','historical','translation')),
 note text,
 unique(concept_id,term,language_tag,relation)
);
create table if not exists gf_core.help_potential_links (
 help_version_id uuid not null references gf_core.help_versions(help_version_id),
 concept_id uuid not null references gf_core.potential_concepts(concept_id),
 contribution text not null,
 provenance jsonb not null,
 editorial_status text not null default 'candidate' check(editorial_status in ('candidate','reviewed','rejected')),
 created_at timestamptz not null default now(),
 primary key(help_version_id,concept_id)
);
-- Curatorial tables are backend-only until explicit A67 release; no anon/authenticated direct access.
revoke all on gf_core.potential_concepts,gf_core.potential_terms,gf_core.help_potential_links from public,anon,authenticated;
insert into gf_core.potential_concepts(concept_code,label_es,definition_es,scope_note,provenance) values
('regulation','Regulación emocional','Cultivar respuestas flexibles ante experiencias emocionales y activación, sin exigir supresión de emociones.','Distinguir de tranquilidad como estado y de tratamiento clínico.', '{"basis":"V46 §15; Gross, Handbook of Emotion Regulation; OMS/OPS, En tiempos de estrés","status":"editorial_candidate"}'),
('attention','Atención consciente','Orientar y recuperar deliberadamente la atención hacia lo pertinente en una situación.','La atención sostenida y la conciencia contemplativa no son idénticas.', '{"basis":"V46 §15; Satipatthana Sutta; OMS/OPS, En tiempos de estrés","status":"editorial_candidate"}'),
('agency','Agencia personal','Reconocer posibilidades de acción y ejercer elecciones situadas dentro de condiciones reales.','No confundir con control total ni responsabilizar de obstáculos estructurales.', '{"basis":"V46 §15; Epicteto, Enquiridión; OMS/OPS, En tiempos de estrés","status":"editorial_candidate"}'),
('discernment','Discernimiento','Examinar alternativas, distinguir hechos, interpretaciones y valores para orientar decisiones.','No equivale a inteligencia, diagnóstico ni certeza.', '{"basis":"V46 §15; Epicteto, Enquiridión; Marco Aurelio, Meditaciones","status":"editorial_candidate"}'),
('connection','Conexión relacional','Cultivar presencia, escucha y reciprocidad en relaciones significativas.','No equivale a sociabilidad obligatoria.', '{"basis":"V46 §15; Greater Good in Action, Active Listening","status":"editorial_candidate"}'),
('self_compassion','Autocompasión','Relacionarse con el propio sufrimiento y límites con reconocimiento y amabilidad.','Distinguir de autocomplacencia y de un estado afectivo fijo.', '{"basis":"V46 §15; Greater Good in Action, Self-Compassion Break","status":"editorial_candidate"}'),
('meaning','Orientación de sentido','Reconocer y cultivar aquello que da significado y dirección a la propia vida.','No prescribe valores ni cosmovisión.', '{"basis":"V46 §15; OMS/OPS, En tiempos de estrés; Marco Aurelio, Meditaciones","status":"editorial_candidate"}'),
('appreciation','Apreciación y gratitud','Reconocer lo valioso y expresar agradecimiento cuando resulte auténtico y pertinente.','Gratitud y apreciación son próximas pero no intercambiables en todos los contextos.', '{"basis":"V46 §15; Greater Good in Action, Gratitude Journal/Letter","status":"editorial_candidate"}'),
('adaptation','Adaptabilidad','Reconfigurar respuestas y posibilidades ante circunstancias cambiantes.','No exige resignación ante injusticia ni rendimiento constante.', '{"basis":"V46 §15; A65 coverage baseline; curatorial definition pending source expansion","status":"editorial_candidate"}'),
('integration','Integración de lo vivido','Elaborar experiencias y aprendizajes para disponer de ellos de forma situada en la vida.','Completar un recurso no prueba integración.', '{"basis":"V46 §15; V53 continuidad y transferencia real","status":"editorial_candidate"}')
on conflict(concept_code) do nothing;
insert into gf_core.potential_terms(concept_id,term,relation,note)
select p.concept_id,x.term,x.relation,x.note from (values
('regulation','Regulación emocional','preferred',null),('regulation','Regulación de emociones','synonym',null),('regulation','Autorregulación emocional','near','Puede enfatizar regulación propia'),('regulation','Gestión emocional','near','Ambigüedad contextual'),('regulation','Ecuanimidad','related','Preservar alcance contemplativo'),
('attention','Atención consciente','preferred',null),('attention','Atención plena','near','Mindfulness tiene alcance propio'),('attention','Concentración','related','No equivalente'),
('agency','Agencia personal','preferred',null),('agency','Capacidad de actuar','near','Expresión descriptiva'),('agency','Autonomía','related','No equivalente'),
('discernment','Discernimiento','preferred',null),('discernment','Juicio prudente','near',null),('discernment','Claridad de decisión','near',null),
('connection','Conexión relacional','preferred',null),('connection','Vinculación','near',null),('connection','Escucha activa','related','Manifestación específica'),
('self_compassion','Autocompasión','preferred',null),('self_compassion','Compasión hacia uno mismo','synonym',null),('self_compassion','Autoindulgencia','related','No equivalente'),
('meaning','Orientación de sentido','preferred',null),('meaning','Sentido vital','near',null),('meaning','Propósito','related','Más orientado a dirección'),
('appreciation','Apreciación y gratitud','preferred',null),('appreciation','Agradecimiento','near',null),('appreciation','Gratitud','near','Subdistinción posible'),
('adaptation','Adaptabilidad','preferred',null),('adaptation','Flexibilidad adaptativa','near',null),('adaptation','Resiliencia','related','No equivalente'),
('integration','Integración de lo vivido','preferred',null),('integration','Apropiación de aprendizajes','near',null),('integration','Reflexión','related','Puede contribuir, no equivale')
) x(code,term,relation,note) join gf_core.potential_concepts p on p.concept_code=x.code
on conflict do nothing;
-- Existing legacy applicability is used ONLY as candidate discovery evidence, not as a validated semantic mapping.
insert into gf_core.help_potential_links(help_version_id,concept_id,contribution,provenance,editorial_status)
select distinct ha.help_version_id,p.concept_id,
 'Hipótesis de contribución a revisar contra el contenido íntegro de esta versión de recurso; relación preliminar heredada de aplicabilidad.',
 jsonb_build_object('basis','existing_help_applicability','legacy_capacity_key',ha.capacity_key,'applicability_id',ha.applicability_id,'review_required',true),
 'candidate'
from gf_core.help_applicability ha
join gf_core.potential_concepts p on p.concept_code=ha.capacity_key
on conflict(help_version_id,concept_id) do nothing;
-- Independently grounded multi-potential links for the specific OMS/OPS guide already in Source.
insert into gf_core.help_potential_links(help_version_id,concept_id,contribution,provenance,editorial_status)
select hv.help_version_id,p.concept_id,x.contribution,
 jsonb_build_object('basis','OMS/OPS En tiempos de estrés: haz lo que importa','source_url',hv.detail->>'external_url','review_required',true),'candidate'
from (values
('who_doing_what_matters_es','attention','Ejercicios de anclaje para recuperar contacto con el presente.'),
('who_doing_what_matters_es','meaning','Identificación de valores para orientar acciones que importan.'),
('who_doing_what_matters_es','self_compassion','Prácticas de amabilidad ante experiencias difíciles.'),
('paho_doing_what_matters_latam','attention','Anclaje al presente propuesto por la guía ilustrada.'),
('paho_doing_what_matters_latam','agency','Pequeñas acciones elegidas de acuerdo con valores propios.'),
('paho_doing_what_matters_latam','self_compassion','Prácticas de amabilidad ante dificultades.')
) x(code,potential,contribution)
join gf_core.help_possibilities hp on hp.canonical_code=x.code
join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version
join gf_core.potential_concepts p on p.concept_code=x.potential
on conflict(help_version_id,concept_id) do update set contribution=excluded.contribution,provenance=excluded.provenance;
comment on table gf_core.help_potential_links is 'A68 scoped human exception 2026-10-03: candidate curation, NOT active matching or personal attribution.';