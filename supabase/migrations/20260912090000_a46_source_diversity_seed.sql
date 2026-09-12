-- A46 · Source diversity and thin-coverage reinforcement
-- Preserves the certified Source model. Adds curated possibilities through the single intake/activation pipeline.

insert into gf_core.providers(provider_id,provider_code,display_name,provider_kind,provenance,rights)
values
  (gen_random_uuid(),'bcra','Banco Central de la República Argentina','institution',jsonb_build_object('curation','external_verified','homepage','https://www.bcra.gob.ar/'),' {"content":"source_terms_apply","linking":"allowed"}'::jsonb),
  (gen_random_uuid(),'ilo','Organización Internacional del Trabajo','international_organization',jsonb_build_object('curation','external_verified','homepage','https://www.ilo.org/es'),' {"content":"source_terms_apply","linking":"allowed"}'::jsonb),
  (gen_random_uuid(),'argentina_salud_nacion','Salud de la Nación · Argentina','public_health_service',jsonb_build_object('curation','external_verified','homepage','https://www.argentina.gob.ar/salud'),' {"content":"source_terms_apply","linking":"allowed"}'::jsonb),
  (gen_random_uuid(),'argentina_justicia_caj','Centros de Acceso a la Justicia · Argentina','public_service',jsonb_build_object('curation','external_verified','homepage','https://www.argentina.gob.ar/justicia/afianzar/caj'),' {"content":"source_terms_apply","linking":"allowed"}'::jsonb)
on conflict(provider_code) do update set
  display_name=excluded.display_name,
  provider_kind=excluded.provider_kind,
  provenance=gf_core.providers.provenance || excluded.provenance,
  rights=gf_core.providers.rights || excluded.rights,
  updated_at=now();

update gf_core.providers
set rights=rights || '{"content":"source_terms_apply","linking":"allowed"}'::jsonb,
    updated_at=now()
where provider_code in ('medlineplus','paho') and coalesce(rights,'{}'::jsonb)='{}'::jsonb;

create or replace function pg_temp.a46_activate(
  p_provider text,
  p_code text,
  p_type text,
  p_candidate jsonb
) returns void language plpgsql as $$
declare v_intake uuid;
begin
  if exists(select 1 from gf_core.help_possibilities where canonical_code=p_code) then return; end if;
  v_intake := gf_private.source_intake('A46',p_provider,p_code,p_type,p_candidate);
  perform gf_private.activate_source_intake(v_intake,'A46','active_limited');
end $$;

select pg_temp.a46_activate('bcra','bcra_financial_rights_ar','external_resource',jsonb_build_object(
  'title','Tus derechos y herramientas financieras · BCRA',
  'summary','Puerta oficial para entender derechos, consultas, reclamos y herramientas del sistema financiero argentino.',
  'locale','es-AR','external_url','https://www.bcra.gob.ar/herramientas-conocimientos/','cta_label','Abrir BCRA',
  'risk_class','low','evidence_class','institutional_guidance','duration_minutes',10,'energy','low',
  'accessibility',jsonb_build_object('screen_reader',true,'reduced_motion',true,'country','AR'),
  'provenance',jsonb_build_object('curation','A46','verified_on','2026-09-12','source','BCRA official'),
  'applicability',jsonb_build_array(jsonb_build_object('area_key','economy','capacity_key','discernment','state','applicable','confidence',0.90,'priority_hint',72))
));

select pg_temp.a46_activate('medlineplus','medlineplus_caregiver_health_es','external_resource',jsonb_build_object(
  'title','Salud del cuidador · MedlinePlus',
  'summary','Información en español para reconocer sobrecarga del cuidado, pedir ayuda y cuidar también la salud de quien cuida.',
  'locale','es-AR','external_url','https://medlineplus.gov/spanish/caregiverhealth.html','cta_label','Abrir MedlinePlus',
  'risk_class','low','evidence_class','institutional_health_guidance','duration_minutes',10,'energy','low',
  'accessibility',jsonb_build_object('screen_reader',true,'reduced_motion',true,'low_energy',true),
  'provenance',jsonb_build_object('curation','A46','verified_on','2026-09-12','source','MedlinePlus / NLM'),
  'applicability',jsonb_build_array(
    jsonb_build_object('area_key','family_care','capacity_key','self_compassion','state','applicable','confidence',0.91,'priority_hint',74),
    jsonb_build_object('area_key','wellbeing','capacity_key','self_compassion','state','partial','confidence',0.72,'priority_hint',54)
  )
));

select pg_temp.a46_activate('ilo','ilo_psychosocial_work_stress_es','external_resource',jsonb_build_object(
  'title','Riesgos psicosociales y estrés laboral · OIT',
  'summary','Marco institucional para reconocer que carga, control y organización del trabajo también forman parte del problema, no sólo la capacidad individual de aguantar.',
  'locale','es-AR','external_url','https://www.ilo.org/es/resource/gestion-de-los-riesgos-psicosociales-para-prevenir-el-estres-laboral','cta_label','Abrir OIT',
  'risk_class','low','evidence_class','institutional_guidance','duration_minutes',10,'energy','low',
  'accessibility',jsonb_build_object('screen_reader',true,'reduced_motion',true),
  'provenance',jsonb_build_object('curation','A46','verified_on','2026-09-12','source','ILO official'),
  'applicability',jsonb_build_array(jsonb_build_object('area_key','work','capacity_key','regulation','state','applicable','confidence',0.88,'priority_hint',70))
));

select pg_temp.a46_activate('va_lumen_seed','lumen_change_map','tool',jsonb_build_object(
  'title','Mapa mínimo de un cambio',
  'summary','Separar qué cambió, qué permanece y cuál puede ser el próximo punto de apoyo.',
  'locale','es-AR','risk_class','low','evidence_class','practice_based','duration_minutes',8,'energy','low',
  'content_payload',jsonb_build_object('kind','guided_tool','steps',jsonb_build_array('Nombrá en una frase qué cambió.','Anotá dos cosas que todavía permanecen o dependen de vos.','Elegí un punto de apoyo para las próximas 24 horas.')),
  'accessibility',jsonb_build_object('screen_reader',true,'reduced_motion',true,'low_energy',true),
  'provenance',jsonb_build_object('curation','A46','origin','VA+LUMEN original'),
  'applicability',jsonb_build_array(jsonb_build_object('area_key','general_life','capacity_key','adaptation','state','applicable','confidence',0.86,'priority_hint',66))
));

select pg_temp.a46_activate('va_lumen_seed','lumen_financial_snapshot','tool',jsonb_build_object(
  'title','Radiografía financiera de quince minutos',
  'summary','Bajar una preocupación económica a cuatro datos verificables antes de decidir.',
  'locale','es-AR','risk_class','low','evidence_class','practice_based','duration_minutes',15,'energy','medium',
  'content_payload',jsonb_build_object('kind','guided_tool','steps',jsonb_build_array('Anotá dinero disponible hoy.','Anotá compromisos de los próximos 30 días.','Separá lo fijo de lo negociable.','Elegí una sola pregunta que necesite respuesta externa.')),
  'accessibility',jsonb_build_object('screen_reader',true,'reduced_motion',true),
  'provenance',jsonb_build_object('curation','A46','origin','VA+LUMEN original','boundary','No sustituye asesoramiento financiero profesional.'),
  'applicability',jsonb_build_array(jsonb_build_object('area_key','economy','capacity_key','discernment','state','applicable','confidence',0.88,'priority_hint',68))
));

select pg_temp.a46_activate('va_lumen_seed','lumen_care_specific_ask','conversation',jsonb_build_object(
  'title','Pedir una ayuda concreta para cuidar',
  'summary','Transformar “necesito ayuda” en un pedido pequeño que otra persona realmente pueda aceptar.',
  'locale','es-AR','risk_class','low','evidence_class','practice_based','duration_minutes',6,'energy','medium',
  'content_payload',jsonb_build_object('kind','conversation_prompt','prompt','¿Qué tarea concreta podrías delegar esta semana, a quién y por cuánto tiempo?'),
  'accessibility',jsonb_build_object('screen_reader',true,'reduced_motion',true),
  'provenance',jsonb_build_object('curation','A46','origin','VA+LUMEN original'),
  'applicability',jsonb_build_array(jsonb_build_object('area_key','family_care','capacity_key','self_compassion','state','applicable','confidence',0.84,'priority_hint',64))
));

select pg_temp.a46_activate('va_lumen_seed','lumen_workload_conversation','conversation',jsonb_build_object(
  'title','Conversar una carga que ya no entra',
  'summary','Preparar una conversación de trabajo sobre prioridades, capacidad y límites sin convertirla en descarga emocional.',
  'locale','es-AR','risk_class','low','evidence_class','practice_based','duration_minutes',8,'energy','medium',
  'content_payload',jsonb_build_object('kind','conversation_prompt','structure',jsonb_build_array('Qué carga concreta excede capacidad.','Qué impacto observable produce.','Qué priorización, plazo o apoyo necesitás negociar.')),
  'accessibility',jsonb_build_object('screen_reader',true,'reduced_motion',true),
  'provenance',jsonb_build_object('curation','A46','origin','VA+LUMEN original'),
  'applicability',jsonb_build_array(jsonb_build_object('area_key','work','capacity_key','regulation','state','applicable','confidence',0.83,'priority_hint',62))
));

select pg_temp.a46_activate('va_lumen_seed','lumen_attention_protected_block','tool',jsonb_build_object(
  'title','Un bloque protegido de atención',
  'summary','Diseñar veinte minutos donde una sola cosa tenga permiso de existir.',
  'locale','es-AR','risk_class','low','evidence_class','practice_based','duration_minutes',20,'energy','medium',
  'content_payload',jsonb_build_object('kind','guided_tool','steps',jsonb_build_array('Elegí una sola tarea.','Quitá una fuente concreta de interrupción.','Definí qué significa terminar estos veinte minutos.')),
  'accessibility',jsonb_build_object('screen_reader',true,'reduced_motion',true),
  'provenance',jsonb_build_object('curation','A46','origin','VA+LUMEN original'),
  'applicability',jsonb_build_array(jsonb_build_object('area_key','learning_growth','capacity_key','attention','state','applicable','confidence',0.85,'priority_hint',62))
));

select pg_temp.a46_activate('va_lumen_seed','lumen_adaptation_question','question',jsonb_build_object(
  'title','¿Qué sigue siendo tuyo en medio del cambio?',
  'summary','Una pregunta breve para recuperar continuidad personal cuando el contexto se movió.',
  'locale','es-AR','risk_class','low','evidence_class','practice_based','duration_minutes',3,'energy','very_low',
  'content_payload',jsonb_build_object('kind','reflection_question','question','Aunque esto haya cambiado, ¿qué valor, vínculo, capacidad o pequeña rutina sigue siendo tuya?'),
  'accessibility',jsonb_build_object('screen_reader',true,'reduced_motion',true,'low_energy',true),
  'provenance',jsonb_build_object('curation','A46','origin','VA+LUMEN original'),
  'applicability',jsonb_build_array(jsonb_build_object('area_key','general_life','capacity_key','adaptation','state','applicable','confidence',0.84,'priority_hint',61))
));

select pg_temp.a46_activate('va_lumen_seed','lumen_grief_memory_conversation','conversation',jsonb_build_object(
  'title','Hablar de lo que querés conservar',
  'summary','En una pérdida, abrir una conversación sobre lo que merece seguir teniendo lugar sin exigir “cerrar” nada.',
  'locale','es-AR','risk_class','moderate','evidence_class','practice_based','duration_minutes',10,'energy','medium',
  'content_payload',jsonb_build_object('kind','conversation_prompt','prompt','Si te hace bien, ¿qué recuerdo, gesto o aprendizaje de ese vínculo te gustaría conservar y con quién podrías compartirlo?'),
  'accessibility',jsonb_build_object('screen_reader',true,'reduced_motion',true),
  'provenance',jsonb_build_object('curation','A46','origin','VA+LUMEN original','boundary','No prescribe duelo ni reconciliación.'),
  'applicability',jsonb_build_array(jsonb_build_object('area_key','relationships','capacity_key','integration','state','applicable','confidence',0.81,'priority_hint',58))
));

-- Real-world doors are first-class Source possibilities but intentionally have no automatic
-- Area×Capacity applicability yet: realization context (country/urgency/legal need) is discriminative.
select pg_temp.a46_activate('argentina_salud_nacion','argentina_mental_health_0800','professional_support',jsonb_build_object(
  'title','Orientación profesional en salud mental · Argentina',
  'summary','Línea nacional gratuita y confidencial, atendida por profesionales de salud mental, disponible las 24 horas.',
  'locale','es-AR','risk_class','high','evidence_class','official_service','duration_minutes',null,'energy','low',
  'content_payload',jsonb_build_object('kind','professional_support','phone','0800-999-0091','availability','24/7','country','AR','note','Ante una emergencia inmediata, usar los servicios de emergencia de tu jurisdicción.'),
  'accessibility',jsonb_build_object('country','AR','phone',true,'cost','free'),
  'provenance',jsonb_build_object('curation','A46','verified_on','2026-09-12','source_url','https://www.argentina.gob.ar/noticias/la-linea-nacional-de-orientacion-y-apoyo-en-la-urgencia-de-salud-mental-funciona-las-24-0'),
  'applicability','[]'::jsonb
));

select pg_temp.a46_activate('argentina_justicia_caj','argentina_caj_access_to_justice','institutional_service',jsonb_build_object(
  'title','Centros de Acceso a la Justicia · Argentina',
  'summary','Atención legal primaria gratuita y apoyo interdisciplinario para problemas de familia, trabajo, documentación, vivienda y otros derechos.',
  'locale','es-AR','risk_class','low','evidence_class','official_service','duration_minutes',null,'energy','medium',
  'content_payload',jsonb_build_object('kind','institutional_service','external_url','https://www.argentina.gob.ar/justicia/afianzar/caj','country','AR','access','presencial y remoto según centro'),
  'accessibility',jsonb_build_object('country','AR','cost','free','remote_possible',true),
  'provenance',jsonb_build_object('curation','A46','verified_on','2026-09-12','source_url','https://www.argentina.gob.ar/justicia/afianzar/caj'),
  'applicability','[]'::jsonb
));
