-- Explicit coverage accounting: absence of a defensible source is a GAP, never fabricated equivalence.
create table if not exists gf_core.potential_coverage_review(
 knowledge_family text primary key, coverage_status text not null check(coverage_status in ('source_mapped','partial','requires_community_review','gap')),
 source_codes text[] not null default '{}', limitation text not null, reviewed_at timestamptz not null default now()
);
revoke all on gf_core.potential_coverage_review from public,anon,authenticated;
insert into gf_core.potential_coverage_review(knowledge_family,coverage_status,source_codes,limitation) values
('Psicología del carácter y fortalezas','source_mapped',array['via24'],'Clasificación fuente identificada; validación intercultural de traducciones pendiente'),
('Educación socioemocional y habilidades para la vida','source_mapped',array['casel5','oecd_ses','who_life_skills','unesco_education'],'Marcos distintos; no equiparar automáticamente dimensiones'),
('Psicología clínica y de emociones','partial',array['act_hexaflex','act_acbs','gross_regulation','neff_compassion','who_stress'],'Requiere cotejo fino de procesos, evidencia y límites'),
('Filosofía grecorromana y estoica','partial',array['aristotle_ethics','epictetus_manual'],'Faltan escuelas, autores y contraste de traducciones'),
('Filosofías indias y yoga','partial',array['yoga_sutras','gita'],'Faltan escuelas védicas/no védicas, comentarios y especialistas'),
('Filosofías chinas','partial',array['analects','confucian_wuchang','dao_de_jing'],'Faltan escuelas, comentarios y traducciones contrastadas'),
('Budismo y tradiciones contemplativas','partial',array['buddhist_brahmavihara','brahmavihara_text'],'No reducir diversidad de escuelas a un único vocabulario'),
('Filosofías africanas','partial',array['ubuntu'],'Ubuntu no representa por sí sola las filosofías africanas'),
('Saberes indígenas de América','requires_community_review',array['unesco_ils'],'No extraer ni universalizar conceptos sin fuentes contextualizadas, participación y custodia'),
('Saberes indígenas de Oceanía','requires_community_review',array['unesco_ils'],'No extraer ni universalizar conceptos sin fuentes contextualizadas, participación y custodia'),
('Filosofías islámicas','gap',array[]::text[],'Falta selección y contraste de fuentes primarias y especialistas'),
('Filosofías judías','gap',array[]::text[],'Falta selección y contraste de fuentes primarias y especialistas'),
('Tradiciones cristianas','gap',array[]::text[],'Falta selección y contraste de fuentes primarias y especialistas'),
('Ciencias sociales, justicia y desarrollo','partial',array['freire_pedagogy','sen_development','martha_nussbaum'],'No convertir capacidades sociales y oportunidades en atributos personales'),
('Aprendizaje, pedagogía y desarrollo','partial',array['dewey_reflection','kolb_learning','unicef_caring'],'Requiere contraste empírico y por ciclo vital'),
('Artes, estética y creatividad','partial',array['via24'],'Falta revisión de tradiciones artísticas y práctica creadora'),
('Neurociencias y medicina','partial',array['who_stress','gross_regulation'],'No extrapolar resultados clínicos a potenciales universales')
on conflict(knowledge_family) do update set coverage_status=excluded.coverage_status,source_codes=excluded.source_codes,limitation=excluded.limitation,reviewed_at=now();
comment on table gf_core.potential_coverage_review is 'Honest scope ledger: no claim of exhaustive universal knowledge; candidate curation only.';