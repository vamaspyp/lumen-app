-- A68 scoped reference expansion; source-derived terms remain candidate, never automatic personal attributes.
insert into gf_core.potential_sources(source_code,source_title,tradition,source_url,evidence_kind,scope_note) values
('oecd_ses','OECD Survey on Social and Emotional Skills 2023: Technical Report','Educación y ciencias sociales','https://www.oecd.org/en/about/projects/survey-on-social-and-emotional-skills.html','comparative_framework','Big Five domains; not a universal ontology'),
('who_life_skills','WHO Life Skills Education for Children and Adolescents in Schools','Salud pública y educación','https://iris.who.int/handle/10665/63552','institutional_framework','Ten core life skills; educational framing'),
('sdtheory','Self-Determination Theory','Psicología motivacional','https://selfdeterminationtheory.org/theory/','research_program','Autonomy, competence, relatedness are basic psychological needs, not skills'),
('gross_regulation','The Emerging Field of Emotion Regulation: An Integrative Review (Gross 1998)','Psicología de emociones','https://doi.org/10.1037/1089-2680.2.3.271','peer_reviewed_review','Process model of regulation; strategies not a moral hierarchy'),
('dewey_reflection','How We Think (John Dewey, 1910)','Filosofía y pedagogía','https://www.gutenberg.org/ebooks/37423','primary_modern','Reflective thinking, inquiry and evidence'),
('freire_pedagogy','Pedagogy of the Oppressed (Paulo Freire)','Pedagogía crítica',null,'primary_modern','Dialogic conscientização and praxis; relational/political, not individual deficit'),
('yoga_sutras','Yoga Sūtras of Patañjali','Filosofía india clásica','https://www.sacred-texts.com/hin/yogasutr.htm','historical_text','Eight limbs and yama/niyama; translations contextual'),
('gita','Bhagavad Gītā','Filosofía india clásica','https://www.gutenberg.org/ebooks/2388','historical_text','Dharma, yoga, action and equanimity: retain context'),
('dao_de_jing','Dào Dé Jīng','Filosofía daoísta','https://ctext.org/dao-de-jing','historical_text','Wúwéi, simplicity and relational attunement; translations provisional'),
('analects','Lúnyǔ / Analects','Filosofía confuciana','https://ctext.org/analects','historical_text','Rén, lǐ, learning, reflection and reciprocity'),
('epictetus_manual','Enchiridion (Epictetus)','Estoicismo clásico','https://classics.mit.edu/Epictetus/epicench.html','historical_text','Distinction between what is up to us and not; context-sensitive'),
('martha_nussbaum','Creating Capabilities (Martha Nussbaum)','Enfoque de capacidades',null,'philosophical_framework','Central capabilities are entitlements/opportunities, NOT personal skill scores'),
('unesco_ils','UNESCO Local and Indigenous Knowledge Systems (LINKS)','Sistemas de saber indígena y local','https://www.unesco.org/en/links','knowledge_governance','No appropriation or flattening of community-specific knowledge without participation'),
('act_acbs','Association for Contextual Behavioral Science: ACT','Ciencia conductual contextual','https://contextualscience.org/act','clinical_framework','Psychological flexibility processes; clinical framing'),
('neff_compassion','Self-Compassion (Kristin Neff)','Psicología contemporánea','https://self-compassion.org/the-research/','research_program','Self-kindness, common humanity and mindfulness; conceptual framing'),
('unicef_caring','UNICEF Care for Child Development','Desarrollo humano y cuidado','https://www.unicef.org/documents/care-child-development','institutional_framework','Responsive caregiving and play; relational and developmental'),
('kolb_learning','Experiential Learning (David A. Kolb)','Teoría del aprendizaje',null,'academic_framework','Concrete experience, reflection, conceptualization, experimentation'),
('sen_development','Development as Freedom (Amartya Sen)','Economía y filosofía del desarrollo',null,'philosophical_framework','Real freedoms and conversion factors, not individual ability inventory'),
('unesco_education','UNESCO Learning: The Treasure Within (Delors Report)','Educación internacional','https://unesdoc.unesco.org/ark:/48223/pf0000109590','institutional_framework','Learning to know, do, live together, be'),
('brahmavihara_text','Brahmavihāra teachings','Tradición budista','https://www.accesstoinsight.org/lib/authors/nyanaponika/wheel006.html','historical_interpretation','Loving-kindness, compassion, appreciative joy, equanimity; preserve original terms')
on conflict do nothing;
insert into gf_core.potential_concepts(concept_code,label_es,definition_es,scope_note,provenance)
select x.code,x.label,x.definition,x.scope,jsonb_build_object('source_code',x.source,'original_term',x.term,'status','source_anchored_candidate')
from (values
('empathy','Empatía','Comprender sentimientos y perspectivas ajenas sin presuponer identidad de experiencia.','No confundir con acuerdo ni lectura de mente.','who_life_skills','Empathy'),
('effective_communication','Comunicación eficaz','Expresar necesidades, perspectivas e información con claridad y consideración.','No impone un único estilo cultural de expresión.','who_life_skills','Effective communication'),
('interpersonal_relationships','Construcción de relaciones','Establecer y sostener vínculos pertinentes y respetuosos.','No exigir vínculos inseguros.','who_life_skills','Interpersonal relationship skills'),
('problem_solving','Resolución de problemas','Identificar dificultades, explorar alternativas y probar respuestas.','Distinguir de juicio crítico.','who_life_skills','Problem solving'),
('decision_making','Toma de decisiones','Comparar opciones y consecuencias para elegir en contexto.','No implica certeza ni control total.','who_life_skills','Decision making'),
('coping_stress','Afrontamiento del estrés','Reconocer fuentes de estrés y movilizar respuestas y apoyos pertinentes.','No sustituye atención clínica.','who_life_skills','Coping with stress'),
('coping_emotions','Afrontamiento emocional','Reconocer emociones propias y ajenas y responder de modo adecuado.','Marco de habilidades para la vida, no diagnóstico.','who_life_skills','Coping with emotions'),
('autonomy_need','Autonomía vivida','Experimentar volición y congruencia al actuar en condiciones reales.','Necesidad psicológica, no destreza que se impone.','sdtheory','Autonomy'),
('competence_need','Sentido de competencia','Experimentar efectividad y posibilidades de aprendizaje en interacción con el entorno.','Necesidad psicológica; no equivale a rendimiento.','sdtheory','Competence'),
('relatedness_need','Pertenencia y vinculación','Experimentar cuidado y conexión mutua con otros.','Necesidad psicológica, no sociabilidad obligatoria.','sdtheory','Relatedness'),
('reflective_inquiry','Indagación reflexiva','Suspender conclusiones apresuradas y examinar razones y consecuencias.','Dewey: pensamiento reflexivo, no rumia.','dewey_reflection','Reflective thought'),
('critical_consciousness','Conciencia crítica situada','Reconocer cómo experiencias y posibilidades se relacionan con condiciones sociales.','Freire: proceso dialógico y político, no puntuación individual.','freire_pedagogy','Conscientização'),
('dialogue','Diálogo transformador','Aprender con otras personas mediante palabra, escucha y reflexión compartida.','No reducir la pedagogía de Freire a técnica conversacional.','freire_pedagogy','Dialogue'),
('praxis','Praxis reflexiva','Articular reflexión y acción transformadora en circunstancias concretas.','Concepto contextual y social.','freire_pedagogy','Praxis'),
('non_harming','No dañar (ahiṃsā)','Orientar la conducta hacia la no violencia y el cuidado de seres vivos.','Yama de yoga; alcance histórico/cultural específico.','yoga_sutras','Ahiṃsā'),
('truthfulness_satya','Veracidad (satya)','Cultivar correspondencia responsable entre palabra, comprensión y acción.','Yama; no fusionar automáticamente con honestidad VIA.','yoga_sutras','Satya'),
('non_grasping','No aferramiento (aparigraha)','Revisar la relación de posesión y apego para cultivar libertad interior.','Yama; no confundir con renuncia material obligatoria.','yoga_sutras','Aparigraha'),
('contentment_santosha','Contentamiento (santoṣa)','Cultivar suficiencia y reconocimiento de lo presente.','Niyama; no equivale a resignación ante injusticia.','yoga_sutras','Santoṣa'),
('self_study_svadhyaya','Estudio de sí (svādhyāya)','Examinarse mediante estudio y práctica en una tradición.','Niyama; no equivalente a introspección clínica.','yoga_sutras','Svādhyāya'),
('disciplined_practice','Disciplina de práctica (tapas)','Sostener práctica intencional y esfuerzo proporcionado.','Niyama; no justificar autoexigencia dañina.','yoga_sutras','Tapas'),
('dharma_action','Acción conforme al deber situado (dharma)','Examinar responsabilidades y actuar con integridad en situación.','Bhagavad Gītā: concepto histórico plural; no prescribir roles sociales.','gita','Dharma'),
('non_attachment_fruits','Desapego del resultado','Actuar responsablemente sin identificar todo el valor personal con el resultado.','No supone indiferencia a consecuencias.','gita','Karma yoga / fruits of action'),
('wu_wei','Acción sin forzamiento (wúwéi)','Reconocer cuándo actuar sin imponer control excesivo a procesos.','Daoísmo: no equivale a pasividad.','dao_de_jing','Wúwéi'),
('simplicity_pu','Simplicidad (pǔ)','Cultivar una relación menos artificiosa y más sencilla con la experiencia.','Concepto daoísta de traducción disputada.','dao_de_jing','Pǔ'),
('reciprocity_shu','Reciprocidad ética (shù)','Considerar a otras personas al orientar el propio trato.','Confucianismo: conservar el marco relacional.','analects','Shù'),
('learning_reflection','Aprendizaje y reflexión','Relacionar estudio, práctica y examen de lo aprendido.','Analectas: no equivale a escolarización formal.','analects','Xué / sī'),
('control_distinction','Discernimiento de lo controlable','Distinguir elecciones propias de acontecimientos no gobernables.','Estoicismo: no negar estructuras ni obligaciones colectivas.','epictetus_manual','What is up to us'),
('reflective_observation','Observación reflexiva','Examinar lo ocurrido antes de extraer conclusiones o actuar de nuevo.','Fase de ciclo de aprendizaje, no rasgo estable.','kolb_learning','Reflective observation'),
('active_experimentation','Experimentación situada','Probar comprensiones en nuevas acciones y revisar resultados.','Fase del aprendizaje experiencial.','kolb_learning','Active experimentation'),
('living_together','Aprender a convivir','Cultivar comprensión, colaboración y resolución pacífica de conflictos.','Pilar educativo, no competencia aislada.','unesco_education','Learning to live together'),
('learning_to_be','Aprender a ser','Ampliar desarrollo personal integral, expresión y autonomía.','Pilar educativo abierto; no imponer ideal humano único.','unesco_education','Learning to be'),
('responsive_care','Cuidado responsivo','Responder a señales y necesidades de otros de manera situada y respetuosa.','Especialmente contextual en desarrollo infantil; no generalizar sin cautela.','unicef_caring','Responsive caregiving'),
('psychological_flexibility','Flexibilidad psicológica','Permanecer en contacto con el presente y actuar según valores aun con experiencias difíciles.','ACT: constructo integrador, no duplicar sin más sus seis procesos.','act_acbs','Psychological flexibility'),
('common_humanity','Humanidad compartida','Reconocer la dificultad como parte de la experiencia humana sin borrar singularidades.','Componente de autocompasión según Neff.','neff_compassion','Common humanity'),
('self_kindness','Amabilidad hacia sí','Responder a dificultades propias con cuidado y consideración.','Componente de autocompasión; no autoindulgencia.','neff_compassion','Self-kindness')
) x(code,label,definition,scope,source,term)
on conflict(concept_code) do nothing;
insert into gf_core.potential_source_distinctions(source_code,original_term,translated_term_es,concept_id,mapping_kind,curatorial_note)
select x.source,x.term,p.label_es,p.concept_id,'direct','Anclaje a marco nombrado; traducción editorial candidata y alcance específico preservado.'
from (values
('who_life_skills','Empathy','empathy'),('who_life_skills','Effective communication','effective_communication'),('who_life_skills','Interpersonal relationship skills','interpersonal_relationships'),('who_life_skills','Problem solving','problem_solving'),('who_life_skills','Decision making','decision_making'),('who_life_skills','Coping with stress','coping_stress'),('who_life_skills','Coping with emotions','coping_emotions'),('who_life_skills','Creative thinking','creativity'),('who_life_skills','Critical thinking','judgment'),('who_life_skills','Self-awareness','self_awareness'),
('sdtheory','Autonomy','autonomy_need'),('sdtheory','Competence','competence_need'),('sdtheory','Relatedness','relatedness_need'),
('dewey_reflection','Reflective thought','reflective_inquiry'),('freire_pedagogy','Conscientização','critical_consciousness'),('freire_pedagogy','Dialogue','dialogue'),('freire_pedagogy','Praxis','praxis'),
('yoga_sutras','Ahiṃsā','non_harming'),('yoga_sutras','Satya','truthfulness_satya'),('yoga_sutras','Aparigraha','non_grasping'),('yoga_sutras','Santoṣa','contentment_santosha'),('yoga_sutras','Svādhyāya','self_study_svadhyaya'),('yoga_sutras','Tapas','disciplined_practice'),
('gita','Dharma','dharma_action'),('gita','Karma yoga / fruits of action','non_attachment_fruits'),
('dao_de_jing','Wúwéi','wu_wei'),('dao_de_jing','Pǔ','simplicity_pu'),
('analects','Shù','reciprocity_shu'),('analects','Xué / sī','learning_reflection'),
('epictetus_manual','What is up to us','control_distinction'),
('kolb_learning','Reflective observation','reflective_observation'),('kolb_learning','Active experimentation','active_experimentation'),
('unesco_education','Learning to live together','living_together'),('unesco_education','Learning to be','learning_to_be'),
('unicef_caring','Responsive caregiving','responsive_care'),('act_acbs','Psychological flexibility','psychological_flexibility'),('neff_compassion','Common humanity','common_humanity'),('neff_compassion','Self-kindness','self_kindness'),
('oecd_ses','Task performance','perseverance'),('oecd_ses','Open-mindedness','curiosity'),('oecd_ses','Collaboration','teamwork'),('oecd_ses','Emotional regulation','regulation')
) x(source,term,code) join gf_core.potential_concepts p on p.concept_code=x.code on conflict do nothing;
insert into gf_core.potential_terms(concept_id,term,relation,note)
select p.concept_id,x.term,'historical','Conservar forma original; no equivalencia automática con otros marcos.'
from (values
('non_harming','Ahiṃsā'),('truthfulness_satya','Satya'),('non_grasping','Aparigraha'),('contentment_santosha','Santoṣa'),('self_study_svadhyaya','Svādhyāya'),('disciplined_practice','Tapas'),('dharma_action','Dharma'),('wu_wei','Wúwéi'),('simplicity_pu','Pǔ'),('reciprocity_shu','Shù'),('critical_consciousness','Conscientização'),('psychological_flexibility','Psychological flexibility'),('common_humanity','Common humanity'),('self_kindness','Self-kindness')
) x(code,term) join gf_core.potential_concepts p on p.concept_code=x.code on conflict do nothing;
-- Curated additional N:M links only to named help whose title indicates the relevant practice.
insert into gf_core.help_potential_links(help_version_id,concept_id,contribution,provenance,editorial_status)
select hv.help_version_id,p.concept_id,x.mechanism,jsonb_build_object('source_code',x.source,'resource_code',x.resource,'review_required',true),'candidate'
from (values
('lumen_difficult_conversation','effective_communication','Ensayar la expresión clara en una conversación difícil.','who_life_skills'),
('lumen_difficult_conversation','empathy','Considerar perspectiva ajena al preparar el diálogo.','who_life_skills'),
('lumen_workload_conversation','effective_communication','Preparar comunicación de carga de trabajo y necesidades.','who_life_skills'),
('lumen_financial_snapshot','problem_solving','Hacer visible un problema material antes de explorar opciones.','who_life_skills'),
('lumen_uncertainty_circles','control_distinction','Distinguir qué puede y qué no puede gobernarse en la incertidumbre.','epictetus_manual'),
('epictetus_enchiridion_pg','control_distinction','Texto fuente sobre la distinción entre lo que depende de uno y lo que no.','epictetus_manual'),
('lumen_mistake_to_learning','reflective_observation','Examinar un error como experiencia susceptible de aprendizaje.','kolb_learning'),
('flagship_evening_integration','reflective_observation','Revisar lo vivido para integrar aprendizajes.','kolb_learning'),
('lumen_restart_after_lapse','active_experimentation','Retomar con un nuevo intento tras una interrupción.','kolb_learning'),
('lumen_name_emotion_need','coping_emotions','Reconocer emoción y necesidad antes de responder.','who_life_skills'),
('lumen_grounding_senses','coping_stress','Práctica breve de anclaje en situación de estrés.','who_life_skills'),
('ggia_self_compassion_break_es','self_kindness','Práctica explícita de amabilidad hacia sí.','neff_compassion'),
('ggia_self_compassion_break_es','common_humanity','Práctica de reconocimiento de humanidad compartida.','neff_compassion'),
('lumen_self_compassion_minute','self_kindness','Práctica breve de amabilidad hacia sí.','neff_compassion'),
('flagship_kind_inner_voice','self_kindness','Ejercicio de diálogo interior amable.','neff_compassion'),
('lumen_listen_before_answer','empathy','Escuchar antes de reaccionar facilita considerar perspectiva ajena.','who_life_skills'),
('lumen_apology_prepare','relationship_skills','Preparar reparación de un vínculo interpersonal.','casel5'),
('lumen_work_triage','problem_solving','Organizar problemas y priorizar respuestas posibles.','who_life_skills'),
('lumen_values_compass','committed_action','Conectar dirección valiosa con una acción concreta.','act_acbs')
) x(resource,potential,mechanism,source)
join gf_core.help_possibilities hp on hp.canonical_code=x.resource
join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version
join gf_core.potential_concepts p on p.concept_code=x.potential
on conflict(help_version_id,concept_id) do nothing;