-- A63 / V60: point to unchanged official media. New versions retain previous attribution.
do $$
declare r record; old_id uuid; new_id uuid; next_version integer; patch jsonb;
begin
 for r in select * from (values
 ('paho_grounding_audio_es','https://terrance.who.int/mediacentre/audio/MSD/Doing_What_Matters_Spanish/WHO-AUDIO_Stress_Management_Grounding_Exercise_2_2_minutes_SPANISH_22OCT2020.mp3'),
 ('paho_leave_space_audio_es','https://terrance.who.int/mediacentre/audio/MSD/Doing_What_Matters_Spanish/WHO-AUDIO_Stress_Management_Making_Room_SPANISH_22OCT2020.mp3'),
 ('bbva_castellanos_breathing_brain_es','https://www.youtube-nocookie.com/embed/us7cYvIJV0I?cc_load_policy=1&cc_lang_pref=es&rel=0')
 ) as x(code,url)
 loop
  select v.help_version_id,v.version+1 into old_id,next_version from gf_core.help_possibilities h join gf_core.help_versions v on v.help_id=h.help_id and v.version=h.current_version where h.canonical_code=r.code;
  if old_id is null then raise exception 'missing representative %',r.code; end if;
  if r.code like 'paho_%' then patch:=jsonb_build_object('audio_url',r.url,'source_text_url','https://www.paho.org/es/documentos/tiempos-estres-haz-lo-que-importa-guia-ilustrada-version-adaptada-para-america-latina');
  else patch:=jsonb_build_object('video_embed_url',r.url,'source_text_url','https://aprendemosjuntos.bbva.com/especial/si-el-cerebro-fuera-una-orquesta-la-respiracion-seria-el-director-nazareth-castellanos/','external_url','https://www.youtube.com/watch?v=us7cYvIJV0I','source_selection','Si el cerebro es una orquesta, la respiración es su director · video oficial'); end if;
  if exists(select 1 from gf_core.help_localizations where help_version_id=old_id and content_payload @> patch) then continue; end if;
  insert into gf_core.help_versions(help_id,version,mechanism_key,detail,duration_minutes,energy,accessibility)
   select help_id,next_version,mechanism_key,detail,duration_minutes,energy,accessibility from gf_core.help_versions where help_version_id=old_id returning help_version_id into new_id;
  insert into gf_core.help_localizations(help_version_id,locale,title,summary,content_payload,cultural_scope,provenance)
   select new_id,locale,title,summary,content_payload||patch,cultural_scope,provenance||jsonb_build_object('media_verified_at','2026-09-30','act','A63','media_unchanged',true) from gf_core.help_localizations where help_version_id=old_id;
  insert into gf_core.help_applicability(help_version_id,taxonomy_version,area_key,capacity_key,state,priority_hint,applicability_confidence,evidence_count,last_evidence_at,provenance,cultivation_roles,cultivation_vocab_version)
   select new_id,taxonomy_version,area_key,capacity_key,state,priority_hint,applicability_confidence,evidence_count,last_evidence_at,provenance,cultivation_roles,cultivation_vocab_version from gf_core.help_applicability where help_version_id=old_id;
  update gf_core.help_possibilities set current_version=next_version,updated_at=now() where canonical_code=r.code;
 end loop;
end $$;
