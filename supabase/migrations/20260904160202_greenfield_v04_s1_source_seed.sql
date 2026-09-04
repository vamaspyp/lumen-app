-- VA+LUMEN S1 · calibration Source seed (small, low-risk, reversible)
insert into gf_core.providers(provider_code,display_name,provider_kind,provenance,rights)
values('va_lumen_seed','VA+LUMEN · Curaduría inicial','internal_curated',jsonb_build_object('source','V39/V43 calibration seed','version','s1.v1'),jsonb_build_object('use','internal_original','redistribution','allowed'))
on conflict(provider_code) do nothing;

insert into gf_core.help_possibilities(canonical_code,help_type,provider_id,lifecycle,risk_class,evidence_class)
select 'pause_quiet_2m','practice',provider_id,'active_limited','low','practice_based' from gf_core.providers where provider_code='va_lumen_seed' on conflict(canonical_code) do nothing;
insert into gf_core.help_versions(help_id,version,mechanism_key,detail,duration_minutes,energy,accessibility)
select help_id,1,'attention_pause',jsonb_build_object('steps',jsonb_build_array('stop','notice_support','choose_next')),2,'very_low',jsonb_build_object('screen_reader',true,'reduced_motion',true,'low_energy',true)
from gf_core.help_possibilities hp where hp.canonical_code='pause_quiet_2m' and not exists(select 1 from gf_core.help_versions hv where hv.help_id=hp.help_id and hv.version=1);
insert into gf_core.help_localizations(help_version_id,locale,title,summary,content_payload,cultural_scope,provenance)
select hv.help_version_id,'es-AR','Dos minutos de pausa','Bajar un poco el ruido antes de decidir qué sigue.',jsonb_build_object('intro','No hace falta resolver nada ahora. Probá dos minutos sin sumar estímulos.','steps',jsonb_build_array('Apoyate como estés cómodo.','Notá tres cosas que ya están sosteniéndote: una superficie, un sonido, una temperatura.','Cuando termine, elegí sólo qué merece tu atención después.')),array['es-AR','latam'],jsonb_build_object('author','VA+LUMEN','version','s1.v1')
from gf_core.help_possibilities hp join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=1 where hp.canonical_code='pause_quiet_2m' and not exists(select 1 from gf_core.help_localizations hl where hl.help_version_id=hv.help_version_id and hl.locale='es-AR');

insert into gf_core.help_possibilities(canonical_code,help_type,provider_id,lifecycle,risk_class,evidence_class)
select 'one_small_step','practice',provider_id,'active_limited','low','practice_based' from gf_core.providers where provider_code='va_lumen_seed' on conflict(canonical_code) do nothing;
insert into gf_core.help_versions(help_id,version,mechanism_key,detail,duration_minutes,energy,accessibility)
select help_id,1,'agency_small_action',jsonb_build_object('steps',jsonb_build_array('name_one_next_step','make_it_smaller','start_now_or_schedule')),3,'low',jsonb_build_object('screen_reader',true,'reduced_motion',true,'low_energy',true)
from gf_core.help_possibilities hp where hp.canonical_code='one_small_step' and not exists(select 1 from gf_core.help_versions hv where hv.help_id=hp.help_id and hv.version=1);
insert into gf_core.help_localizations(help_version_id,locale,title,summary,content_payload,cultural_scope,provenance)
select hv.help_version_id,'es-AR','Un paso más pequeño','Convertir algo trabado en una acción que sí pueda empezar.',jsonb_build_object('intro','No hace falta resolver todo. Busquemos el próximo gesto posible.','steps',jsonb_build_array('Nombrá lo que querés mover.','Reducilo hasta una acción de menos de diez minutos.','Elegí: hacerlo ahora o dejar definido cuándo.')),array['es-AR','latam'],jsonb_build_object('author','VA+LUMEN','version','s1.v1')
from gf_core.help_possibilities hp join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=1 where hp.canonical_code='one_small_step' and not exists(select 1 from gf_core.help_localizations hl where hl.help_version_id=hv.help_version_id and hl.locale='es-AR');

insert into gf_core.help_possibilities(canonical_code,help_type,provider_id,lifecycle,risk_class,evidence_class)
select 'name_what_matters','reflection',provider_id,'active_limited','low','practice_based' from gf_core.providers where provider_code='va_lumen_seed' on conflict(canonical_code) do nothing;
insert into gf_core.help_versions(help_id,version,mechanism_key,detail,duration_minutes,energy,accessibility)
select help_id,1,'values_clarity',jsonb_build_object('prompt_key','reflection.what_matters_now'),4,'low',jsonb_build_object('screen_reader',true,'reduced_motion',true,'low_energy',true)
from gf_core.help_possibilities hp where hp.canonical_code='name_what_matters' and not exists(select 1 from gf_core.help_versions hv where hv.help_id=hp.help_id and hv.version=1);
insert into gf_core.help_localizations(help_version_id,locale,title,summary,content_payload,cultural_scope,provenance)
select hv.help_version_id,'es-AR','Nombrar qué importa ahora','Una breve reflexión para recuperar dirección sin forzar una respuesta definitiva.',jsonb_build_object('prompt','Si por un momento sacaras ruido, expectativas y urgencias: ¿qué te gustaría cuidar en esta situación?'),array['es-AR','latam'],jsonb_build_object('author','VA+LUMEN','version','s1.v1')
from gf_core.help_possibilities hp join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=1 where hp.canonical_code='name_what_matters' and not exists(select 1 from gf_core.help_localizations hl where hl.help_version_id=hv.help_version_id and hl.locale='es-AR');

insert into gf_core.help_possibilities(canonical_code,help_type,provider_id,lifecycle,risk_class,evidence_class)
select 'write_three_lines','reflection',provider_id,'active_limited','low','practice_based' from gf_core.providers where provider_code='va_lumen_seed' on conflict(canonical_code) do nothing;
insert into gf_core.help_versions(help_id,version,mechanism_key,detail,duration_minutes,energy,accessibility)
select help_id,1,'externalize_thoughts',jsonb_build_object('prompt_keys',jsonb_build_array('what_is_happening','what_matters','what_next')),5,'low',jsonb_build_object('screen_reader',true,'reduced_motion',true,'low_energy',true)
from gf_core.help_possibilities hp where hp.canonical_code='write_three_lines' and not exists(select 1 from gf_core.help_versions hv where hv.help_id=hp.help_id and hv.version=1);
insert into gf_core.help_localizations(help_version_id,locale,title,summary,content_payload,cultural_scope,provenance)
select hv.help_version_id,'es-AR','Tres líneas para ordenar','Sacar algo de la cabeza y ponerlo delante, sin convertirlo en un análisis interminable.',jsonb_build_object('prompts',jsonb_build_array('¿Qué está pasando, en una línea?','¿Qué es lo más importante de esto para vos?','¿Cuál sería un próximo paso suficientemente bueno?')),array['es-AR','latam'],jsonb_build_object('author','VA+LUMEN','version','s1.v1')
from gf_core.help_possibilities hp join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=1 where hp.canonical_code='write_three_lines' and not exists(select 1 from gf_core.help_localizations hl where hl.help_version_id=hv.help_version_id and hl.locale='es-AR');

insert into gf_core.help_possibilities(canonical_code,help_type,provider_id,lifecycle,risk_class,evidence_class)
select 'reach_someone_trusted','human_action',provider_id,'active_limited','low','practice_based' from gf_core.providers where provider_code='va_lumen_seed' on conflict(canonical_code) do nothing;
insert into gf_core.help_versions(help_id,version,mechanism_key,detail,duration_minutes,energy,accessibility)
select help_id,1,'human_connection',jsonb_build_object('action_key','contact_trusted_person'),5,'medium',jsonb_build_object('screen_reader',true,'reduced_motion',true)
from gf_core.help_possibilities hp where hp.canonical_code='reach_someone_trusted' and not exists(select 1 from gf_core.help_versions hv where hv.help_id=hp.help_id and hv.version=1);
insert into gf_core.help_localizations(help_version_id,locale,title,summary,content_payload,cultural_scope,provenance)
select hv.help_version_id,'es-AR','Acercarte a alguien','Cuando lo humano puede ayudar más que otra idea.',jsonb_build_object('intro','Tal vez no necesites resolver esto solo.','steps',jsonb_build_array('Pensá en una persona con la que puedas estar un poco más acompañado.','Mandale un mensaje simple y concreto.','No hace falta explicar todo: podés empezar por pedir un rato para hablar.')),array['es-AR','latam'],jsonb_build_object('author','VA+LUMEN','version','s1.v1')
from gf_core.help_possibilities hp join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=1 where hp.canonical_code='reach_someone_trusted' and not exists(select 1 from gf_core.help_localizations hl where hl.help_version_id=hv.help_version_id and hl.locale='es-AR');

insert into gf_core.help_possibilities(canonical_code,help_type,provider_id,lifecycle,risk_class,evidence_class)
select 'notice_one_good','reflection',provider_id,'active_limited','low','practice_based' from gf_core.providers where provider_code='va_lumen_seed' on conflict(canonical_code) do nothing;
insert into gf_core.help_versions(help_id,version,mechanism_key,detail,duration_minutes,energy,accessibility)
select help_id,1,'appreciation_attention',jsonb_build_object('prompt_key','reflection.notice_one_good'),2,'very_low',jsonb_build_object('screen_reader',true,'reduced_motion',true,'low_energy',true)
from gf_core.help_possibilities hp where hp.canonical_code='notice_one_good' and not exists(select 1 from gf_core.help_versions hv where hv.help_id=hp.help_id and hv.version=1);
insert into gf_core.help_localizations(help_version_id,locale,title,summary,content_payload,cultural_scope,provenance)
select hv.help_version_id,'es-AR','Reconocer algo que sí está','Una pausa breve para registrar algo valioso sin negar lo difícil.',jsonb_build_object('prompt','¿Qué cosa pequeña —persona, gesto, capacidad, lugar o momento— merece ser reconocida hoy?'),array['es-AR','latam'],jsonb_build_object('author','VA+LUMEN','version','s1.v1')
from gf_core.help_possibilities hp join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=1 where hp.canonical_code='notice_one_good' and not exists(select 1 from gf_core.help_localizations hl where hl.help_version_id=hv.help_version_id and hl.locale='es-AR');

insert into gf_core.coverage_cells(help_id,need_key,intent_key,status,locale_pattern,priority_hint,reason_key)
select help_id,'pause','reduce_load','covered','es-%',10,'seed_low_risk_fit' from gf_core.help_possibilities hp where canonical_code='pause_quiet_2m' and not exists(select 1 from gf_core.coverage_cells cc where cc.help_id=hp.help_id and cc.need_key='pause');
insert into gf_core.coverage_cells(help_id,need_key,intent_key,status,locale_pattern,priority_hint,reason_key)
select help_id,'clarity','reduce_load','covered','es-%',30,'seed_low_risk_fit' from gf_core.help_possibilities hp where canonical_code='write_three_lines' and not exists(select 1 from gf_core.coverage_cells cc where cc.help_id=hp.help_id and cc.need_key='clarity' and cc.intent_key='reduce_load');
insert into gf_core.coverage_cells(help_id,need_key,intent_key,status,locale_pattern,priority_hint,reason_key)
select help_id,'clarity','gain_clarity','covered','es-%',10,'seed_low_risk_fit' from gf_core.help_possibilities hp where canonical_code='name_what_matters' and not exists(select 1 from gf_core.coverage_cells cc where cc.help_id=hp.help_id and cc.need_key='clarity' and cc.intent_key='gain_clarity');
insert into gf_core.coverage_cells(help_id,need_key,intent_key,status,locale_pattern,priority_hint,reason_key)
select help_id,'clarity','gain_clarity','covered','es-%',20,'seed_low_risk_fit' from gf_core.help_possibilities hp where canonical_code='write_three_lines' and not exists(select 1 from gf_core.coverage_cells cc where cc.help_id=hp.help_id and cc.need_key='clarity' and cc.intent_key='gain_clarity');
insert into gf_core.coverage_cells(help_id,need_key,intent_key,status,locale_pattern,priority_hint,reason_key)
select help_id,'agency','move_forward','covered','es-%',10,'seed_low_risk_fit' from gf_core.help_possibilities hp where canonical_code='one_small_step' and not exists(select 1 from gf_core.coverage_cells cc where cc.help_id=hp.help_id and cc.need_key='agency');
insert into gf_core.coverage_cells(help_id,need_key,intent_key,status,locale_pattern,priority_hint,reason_key)
select help_id,'meaning','reconnect_meaning','covered','es-%',10,'seed_low_risk_fit' from gf_core.help_possibilities hp where canonical_code='name_what_matters' and not exists(select 1 from gf_core.coverage_cells cc where cc.help_id=hp.help_id and cc.need_key='meaning');
insert into gf_core.coverage_cells(help_id,need_key,intent_key,status,locale_pattern,priority_hint,reason_key)
select help_id,'connection','seek_connection','covered','es-%',10,'seed_low_risk_fit' from gf_core.help_possibilities hp where canonical_code='reach_someone_trusted' and not exists(select 1 from gf_core.coverage_cells cc where cc.help_id=hp.help_id and cc.need_key='connection');
insert into gf_core.coverage_cells(help_id,need_key,intent_key,status,locale_pattern,priority_hint,reason_key)
select help_id,'appreciation','notice_value','covered','es-%',10,'seed_low_risk_fit' from gf_core.help_possibilities hp where canonical_code='notice_one_good' and not exists(select 1 from gf_core.coverage_cells cc where cc.help_id=hp.help_id and cc.need_key='appreciation');