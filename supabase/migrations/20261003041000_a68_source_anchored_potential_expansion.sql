-- Evidence-linked extension of A68 candidate reference catalog. Sources retain their own vocabulary; these are NOT universally equivalent.
create table if not exists gf_core.potential_sources (
 source_code text primary key, source_title text not null, tradition text not null, source_url text, evidence_kind text not null, scope_note text not null, created_at timestamptz not null default now()
);
create table if not exists gf_core.potential_source_distinctions (
 source_code text not null references gf_core.potential_sources(source_code),
 original_term text not null, translated_term_es text not null, concept_id uuid references gf_core.potential_concepts(concept_id),
 mapping_kind text not null check(mapping_kind in ('direct','partial','related','unmapped')),
 curatorial_note text not null,
 primary key(source_code,original_term)
);
revoke all on gf_core.potential_sources,gf_core.potential_source_distinctions from public,anon,authenticated;
insert into gf_core.potential_sources(source_code,source_title,tradition,source_url,evidence_kind,scope_note) values
('via24','VIA Classification of Character Strengths','Psicología del carácter','https://www.viacharacter.org/character-strengths','classification','24 fortalezas; no se convierte en inventario personal obligatorio'),
('casel5','CASEL Framework','Educación socioemocional','https://casel.org/faq/','framework','Cinco competencias amplias, no equivalentes a fortalezas VIA'),
('aristotle_ethics','Nicomachean Ethics','Filosofía griega clásica','https://classics.mit.edu/Aristotle/nicomachaen.html','primary_classical','Virtudes y prudencia; lectura histórica y contextual'),
('buddhist_brahmavihara','Brahmavihāra: cuatro actitudes inconmensurables','Tradición budista',null,'historical_tradition','Mettā, karuṇā, muditā, upekkhā conservan identidad cultural; revisión especialista pendiente'),
('confucian_wuchang','Wǔcháng: cinco virtudes constantes','Tradición confuciana',null,'historical_tradition','Rén, yì, lǐ, zhì, xìn no son traducciones unívocas; revisión especialista pendiente'),
('ubuntu','Ubuntu relational personhood','Filosofías africanas','https://scielo.org.za/scielo.php?pid=S2415-04792025000100003&script=sci_arttext','scholarly_interpretation','Ontología relacional, no reducir a habilidad individual'),
('who_stress','Doing What Matters in Times of Stress','Salud pública OMS/OPS','https://www.paho.org/es/documentos/tiempos-estres-haz-lo-que-importa-guia-ilustrada-version-adaptada-para-america-latina','practice_guide','Prácticas para estrés; no diagnóstico ni prescripción'),
('act_hexaflex','ACT psychological flexibility processes','Psicología clínica contemporánea',null,'clinical_framework','Procesos clínicos; no convertir en etiqueta de usuario')
on conflict(source_code) do nothing;
insert into gf_core.potential_concepts(concept_code,label_es,definition_es,scope_note,provenance)
select x.code,x.label,x.definition,x.scope,jsonb_build_object('source_code',x.source,'original_term',x.original,'status','source_anchored_candidate')
from (values
('creativity','Creatividad','Generar ideas y formas de hacer novedosas y útiles en contexto.','No restringir a producción artística.','via24','Creativity'),
('curiosity','Curiosidad','Interesarse y explorar experiencias, preguntas y conocimientos.','Distinguir del aprendizaje sostenido.','via24','Curiosity'),
('judgment','Juicio crítico','Examinar evidencias y perspectivas antes de concluir.','Próximo a discernimiento; no fusionar sin contraste.','via24','Judgment'),
('love_learning','Amor por aprender','Profundizar de forma sostenida en conocimientos y habilidades.','No equivale a curiosidad ocasional.','via24','Love of Learning'),
('perspective','Perspectiva','Situar hechos y experiencias en marcos más amplios para comprenderlos.','No equivale a relativismo.','via24','Perspective'),
('bravery','Coraje','Actuar ante dificultades o riesgos cuando existen razones significativas.','No exige exposición insegura.','via24','Bravery'),
('perseverance','Perseverancia','Sostener esfuerzos pertinentes ante obstáculos, pudiendo revisar su dirección.','No prescribe persistir en situaciones dañinas.','via24','Perseverance'),
('honesty','Honestidad y autenticidad','Expresarse y actuar con sinceridad y responsabilidad.','Cuidar privacidad y contexto.','via24','Honesty'),
('vitality','Vitalidad','Cultivar una participación animada y disponible en la vida cuando las condiciones lo permiten.','No evaluar salud o discapacidad por entusiasmo.','via24','Zest'),
('love','Amor vincular','Cuidar y recibir cuidado en relaciones cercanas y recíprocas.','No exigir intimidad.','via24','Love'),
('kindness','Amabilidad','Obrar con consideración y ayuda hacia otras personas.','No equivale a complacencia.','via24','Kindness'),
('social_intelligence','Comprensión social','Reconocer señales y necesidades propias y ajenas en situaciones interpersonales.','No implica leer mentes.','via24','Social Intelligence'),
('teamwork','Cooperación','Contribuir responsablemente a tareas y bienes compartidos.','Preservar agencia individual.','via24','Teamwork'),
('fairness','Justicia interpersonal','Considerar imparcialmente a las personas y sus circunstancias.','No reducir justicia estructural a virtud individual.','via24','Fairness'),
('leadership','Liderazgo cuidadoso','Facilitar acción colectiva y relaciones funcionales.','No requiere posición jerárquica.','via24','Leadership'),
('forgiveness','Perdón','Explorar la posibilidad de soltar represalias o resentimiento sin negar daño.','Nunca exigir reconciliación con agresores.','via24','Forgiveness'),
('humility','Humildad','Reconocer límites y aportes propios sin superioridad infundada.','No equivale a autodevaluación.','via24','Humility'),
('prudence','Prudencia','Considerar consecuencias y riesgos antes de actuar.','Distinguir del juicio crítico y del temor.','via24','Prudence'),
('self_regulation','Autorregulación','Orientar impulsos y comportamientos de acuerdo con fines situados.','Más amplio que regulación emocional.','via24','Self-Regulation'),
('beauty','Apreciación de belleza y excelencia','Percibir y valorar belleza, excelencia y destreza en diversos ámbitos.','No reducir a gratitud.','via24','Appreciation of Beauty and Excellence'),
('gratitude','Gratitud','Reconocer y, cuando corresponde, expresar agradecimiento por bienes recibidos.','Diferenciar de apreciación general.','via24','Gratitude'),
('hope','Esperanza activa','Mantener apertura a futuros valiosos y posibilidades de contribuir a ellos.','No exigir optimismo infundado.','via24','Hope'),
('humor','Humor','Reconocer aspectos lúdicos o ligeros de la experiencia de forma respetuosa.','No trivializar sufrimiento.','via24','Humor'),
('spirituality','Orientación trascendente','Explorar significados y vínculos con algo considerado mayor que uno mismo.','No imponer religión ni creencia.','via24','Spirituality'),
('self_awareness','Autoconocimiento','Reconocer emociones, pensamientos, valores y límites propios en contexto.','No es diagnóstico ni identidad fija.','casel5','Self-awareness'),
('relationship_skills','Habilidades relacionales','Comunicar, escuchar, colaborar y manejar desacuerdos de modo respetuoso.','Marco amplio; no duplicar automáticamente conexión.','casel5','Relationship skills'),
('responsible_decisions','Decisión responsable','Considerar bienestar propio y ajeno y consecuencias al elegir.','No sustituye juicio singular de la persona.','casel5','Responsible decision-making'),
('compassion','Compasión','Reconocer sufrimiento ajeno y cultivar una respuesta cuidadosa.','Distinta de autocompasión y de piedad paternalista.','buddhist_brahmavihara','Karuṇā'),
('loving_kindness','Benevolencia amorosa','Cultivar buena voluntad hacia otros seres.','Mettā mantiene su sentido contemplativo.','buddhist_brahmavihara','Mettā'),
('sympathetic_joy','Alegría apreciativa','Cultivar alegría ante el bienestar o logros de otros.','Muditā no es simple gratitud.','buddhist_brahmavihara','Muditā'),
('equanimity','Ecuanimidad','Cultivar una relación equilibrada con experiencias cambiantes.','Upekkhā no es sinónimo de regulación emocional.','buddhist_brahmavihara','Upekkhā'),
('benevolence_ren','Humanidad relacional (rén)','Cultivar consideración humana en relaciones y obligaciones recíprocas.','Término confuciano: traducción parcial.','confucian_wuchang','Rén'),
('righteousness_yi','Rectitud situada (yì)','Discernir y actuar conforme a lo apropiado moralmente en situación.','No equivale directamente a fairness VIA.','confucian_wuchang','Yì'),
('ritual_propriety_li','Cuidado de formas relacionales (lǐ)','Practicar formas compartidas que expresan respeto y orden relacional.','No reducir a etiqueta superficial.','confucian_wuchang','Lǐ'),
('wisdom_zhi','Sabiduría práctica (zhì)','Cultivar comprensión para juzgar y actuar en relación.','No equivalente exacto a phronesis.','confucian_wuchang','Zhì'),
('trustworthiness_xin','Confiabilidad (xìn)','Sostener credibilidad y fidelidad en la palabra y la acción.','No idéntico a honestidad VIA.','confucian_wuchang','Xìn'),
('relational_reciprocity','Reciprocidad comunitaria','Reconocer interdependencia y responsabilidades mutuas en la vida compartida.','Ubuntu es filosofía relacional, no rasgo psicométrico.','ubuntu','Ubuntu'),
('acceptance','Apertura a la experiencia difícil','Hacer espacio a experiencias internas sin lucha innecesaria.','No implica tolerar daño externo.','act_hexaflex','Acceptance'),
('cognitive_defusion','Distanciamiento de pensamientos','Reconocer pensamientos como acontecimientos mentales, no órdenes automáticas.','No implica negar hechos.','act_hexaflex','Cognitive defusion'),
('values_clarity','Claridad de valores','Identificar cualidades elegidas para orientar la acción.','Distinguir de metas y sentido trascendente.','act_hexaflex','Values'),
('committed_action','Acción comprometida','Dar pasos flexibles y sostenidos conforme a valores propios.','No equivale a productividad.','act_hexaflex','Committed action')
) x(code,label,definition,scope,source,original)
on conflict(concept_code) do nothing;
-- Preserve the 24 VIA distinctions separately: previously broad appreciation/regulation concepts are NOT forcibly merged.
insert into gf_core.potential_source_distinctions(source_code,original_term,translated_term_es,concept_id,mapping_kind,curatorial_note)
select x.source,x.original,p.label_es,p.concept_id,'direct','Término conservado de su marco de origen; etiqueta española editorial, sin reclamar equivalencia universal.'
from (values
('via24','Creativity','creativity'),('via24','Curiosity','curiosity'),('via24','Judgment','judgment'),('via24','Love of Learning','love_learning'),('via24','Perspective','perspective'),('via24','Bravery','bravery'),('via24','Perseverance','perseverance'),('via24','Honesty','honesty'),('via24','Zest','vitality'),('via24','Love','love'),('via24','Kindness','kindness'),('via24','Social Intelligence','social_intelligence'),('via24','Teamwork','teamwork'),('via24','Fairness','fairness'),('via24','Leadership','leadership'),('via24','Forgiveness','forgiveness'),('via24','Humility','humility'),('via24','Prudence','prudence'),('via24','Self-Regulation','self_regulation'),('via24','Appreciation of Beauty and Excellence','beauty'),('via24','Gratitude','gratitude'),('via24','Hope','hope'),('via24','Humor','humor'),('via24','Spirituality','spirituality'),
('casel5','Self-awareness','self_awareness'),('casel5','Relationship skills','relationship_skills'),('casel5','Responsible decision-making','responsible_decisions'),
('buddhist_brahmavihara','Karuṇā','compassion'),('buddhist_brahmavihara','Mettā','loving_kindness'),('buddhist_brahmavihara','Muditā','sympathetic_joy'),('buddhist_brahmavihara','Upekkhā','equanimity'),
('confucian_wuchang','Rén','benevolence_ren'),('confucian_wuchang','Yì','righteousness_yi'),('confucian_wuchang','Lǐ','ritual_propriety_li'),('confucian_wuchang','Zhì','wisdom_zhi'),('confucian_wuchang','Xìn','trustworthiness_xin'),
('ubuntu','Ubuntu','relational_reciprocity'),
('act_hexaflex','Acceptance','acceptance'),('act_hexaflex','Cognitive defusion','cognitive_defusion'),('act_hexaflex','Values','values_clarity'),('act_hexaflex','Committed action','committed_action')
) x(source,original,code) join gf_core.potential_concepts p on p.concept_code=x.code
on conflict do nothing;
insert into gf_core.potential_terms(concept_id,term,relation,note)
select p.concept_id,x.term,x.relation,'Término de la fuente '||x.source||'; equivalencia intercultural no presumida'
from (values
('equanimity','Upekkhā','historical','buddhist_brahmavihara'),('compassion','Karuṇā','historical','buddhist_brahmavihara'),('loving_kindness','Mettā','historical','buddhist_brahmavihara'),('sympathetic_joy','Muditā','historical','buddhist_brahmavihara'),
('benevolence_ren','Rén','historical','confucian_wuchang'),('righteousness_yi','Yì','historical','confucian_wuchang'),('ritual_propriety_li','Lǐ','historical','confucian_wuchang'),('wisdom_zhi','Zhì','historical','confucian_wuchang'),('trustworthiness_xin','Xìn','historical','confucian_wuchang'),
('relational_reciprocity','Ubuntu','historical','ubuntu'),('cognitive_defusion','Defusión cognitiva','synonym','act_hexaflex'),('values_clarity','Clarificación de valores','synonym','act_hexaflex'),('committed_action','Acción orientada por valores','near','act_hexaflex')
) x(code,term,relation,source) join gf_core.potential_concepts p on p.concept_code=x.code on conflict do nothing;
-- Extend N:M only where a specifically identifiable existing resource supplies the actual exercise/mechanism.
insert into gf_core.help_potential_links(help_version_id,concept_id,contribution,provenance,editorial_status)
select hv.help_version_id,p.concept_id,x.mechanism,jsonb_build_object('source_code',x.source,'resource_code',x.resource,'basis','named source or clearly identified resource mechanism','review_required',true),'candidate'
from (values
('ggia_gratitude_journal','gratitude','Registro deliberado de bienes recibidos para cultivar gratitud.','via24'),
('ggia_gratitude_letter','gratitude','Expresión explícita de agradecimiento a una persona.','via24'),
('ggia_active_listening_es','relationship_skills','Ejercicio de escucha activa en interacción.','casel5'),
('ggia_forgiveness_steps_es','forgiveness','Pasos de reflexión sobre perdón; sin exigir reconciliación.','via24'),
('flagship_tiny_courage','bravery','Invita a realizar un acto pequeño de coraje situado.','via24'),
('lumen_listen_before_answer','relationship_skills','Práctica de escuchar antes de responder.','casel5'),
('lumen_specific_gratitude','gratitude','Nombrar un agradecimiento concreto.','via24'),
('lumen_values_compass','values_clarity','Reflexión guiada sobre valores elegidos.','act_hexaflex'),
('flagship_values_compass','values_clarity','Reflexión guiada sobre valores elegidos.','act_hexaflex'),
('paho_doing_what_matters_latam','values_clarity','La guía ayuda a identificar aquello que importa.','who_stress'),
('who_doing_what_matters_es','values_clarity','La guía ayuda a identificar aquello que importa.','who_stress'),
('paho_doing_what_matters_latam','cognitive_defusion','Prácticas para tomar distancia de pensamientos difíciles.','who_stress'),
('who_doing_what_matters_es','cognitive_defusion','Prácticas para tomar distancia de pensamientos difíciles.','who_stress'),
('paho_doing_what_matters_latam','acceptance','Ejercicios para hacer espacio a emociones difíciles.','who_stress'),
('who_doing_what_matters_es','acceptance','Ejercicios para hacer espacio a emociones difíciles.','who_stress'),
('paho_doing_what_matters_latam','committed_action','Invitación a acciones pequeñas coherentes con valores.','who_stress'),
('who_doing_what_matters_es','committed_action','Invitación a acciones pequeñas coherentes con valores.','who_stress'),
('lumen_mistake_to_learning','self_awareness','Reflexión sobre una experiencia propia y su aprendizaje.','casel5'),
('lumen_name_emotion_need','self_awareness','Identificación de emoción y necesidad propias.','casel5'),
('lumen_difficult_conversation','relationship_skills','Preparación de una conversación interpersonal difícil.','casel5')
) x(resource,potential,mechanism,source)
join gf_core.help_possibilities hp on hp.canonical_code=x.resource
join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version
join gf_core.potential_concepts p on p.concept_code=x.potential
on conflict(help_version_id,concept_id) do nothing;