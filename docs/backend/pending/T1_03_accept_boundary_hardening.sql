-- T1 · Check-in → Match → Run · hardening final de frontera Empezar
-- Estado: PREPRODUCCIÓN / NO APLICAR SIN AUTORIZACIÓN.
-- Aplicar DESPUÉS de T1_01 y T1_02.
-- Esta definición de lumi_open_resource_viewer es la autoritativa de T1.
--
-- Correcciones respecto de la primera pasada:
-- 1) experience_id por sí solo NO crea Run: exige offer_token emitido por PRE.
--    Evita que estado cliente antiguo/stale materialice una experiencia.
-- 2) evita records condicionales no asignados; usa escalares para origen/Hypothesis.
-- 3) siempre recarga el recurso antes de renderizar el viewer.

begin;

create or replace function public.lumi_open_resource_viewer(p_params jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id               uuid;
  v_session_id            uuid;
  v_resource_id           uuid;
  v_experience_id         uuid;
  v_run_id                uuid;
  v_offer_token           text;
  v_source                text;
  v_selection_source      text;
  v_realization_type      text;
  v_node                  jsonb;
  v_resource              record;
  v_experience            record;
  v_hypothesis            record;
  v_legacy_hypothesis_id  uuid;
  v_source_kind           text;
  v_served_capability     text;
  v_session_hemisphere    text;
  v_session_area          text;
  v_session_state         text;
  v_session_faro_key      text;
  v_session_uaf_id        uuid;
  v_session_faro_text     text;
  v_session_capability    text;
  v_session_time          text;
  v_session_format        text;
  v_max_mins              integer := 999;
  v_sanctuary_item_id     uuid;
  v_origin_run_id         uuid;
  v_origin_hemisphere     text;
  v_origin_area           text;
  v_origin_state          text;
  v_origin_faro_key       text;
  v_origin_uaf_id         uuid;
  v_origin_faro_text      text;
  v_origin_served_cap     text;
  v_origin_primary_cap    text;
  v_origin_selected_cap   text;
  v_origin_expected_cap   text;
  v_offer_snapshot        jsonb;
  v_legacy_hypothesis     jsonb;
  v_created_run           boolean := false;
begin
  p_params := public.lumi_normalize_params(coalesce(p_params, '{}'::jsonb));

  v_user_id := nullif(trim(coalesce(p_params->>'user_id', '')), '')::uuid;
  v_session_id := nullif(trim(coalesce(p_params->>'session_id', '')), '')::uuid;
  v_resource_id := nullif(trim(coalesce(p_params->>'resource_id', '')), '')::uuid;
  v_experience_id := nullif(trim(coalesce(p_params->>'experience_id', '')), '')::uuid;
  v_run_id := nullif(trim(coalesce(p_params->>'experience_run_id', p_params->>'currentExperienceRunId', '')), '')::uuid;
  v_offer_token := nullif(trim(coalesce(p_params->>'value', p_params->>'offer_token', '')), '');
  v_source := coalesce(nullif(trim(coalesce(p_params->>'source', '')), ''), 'lumi');
  v_sanctuary_item_id := nullif(trim(coalesce(
    p_params->>'sanctuary_item_id',
    p_params->>'currentSanctuaryItemId',
    ''
  )), '')::uuid;

  if v_user_id is null then
    return public.lumi_get_node('HOME_DEFAULT')
      || jsonb_build_object('ok', false, 'error', 'user_id_requerido', 'state', '{}'::jsonb);
  end if;

  -- Run ya existente: sólo se reutiliza si pertenece a la persona.
  if v_run_id is not null then
    select er.experience_id, er.resource_id
    into v_experience_id, v_resource_id
    from public.experience_runs er
    where er.id = v_run_id
      and er.user_id = v_user_id;

    if not found then
      return public.lumi_get_node('HOME_DEFAULT')
        || jsonb_build_object('ok', false, 'error', 'experience_run_no_valido', 'state', '{}'::jsonb);
    end if;
  end if;

  -- Frontera canónica T1: sólo PRE emitida por backend (experience + token)
  -- puede materializar un Run nuevo.
  if v_run_id is null
     and v_experience_id is not null
     and v_offer_token is not null then

    select
      e.id,
      e.code,
      e.title,
      e.pre_text,
      e.post_text,
      e.primary_resource_id,
      e.expected_capability_key,
      e.primary_capability_key,
      e.primary_life_area_key,
      e.hemisphere_key
    into v_experience
    from public.experiences e
    where e.id = v_experience_id
      and e.active = true
      and e.editorial_status in ('core_mvp', 'enrichment_mvp');

    if not found then
      return public.lumi_get_node('HOME_DEFAULT')
        || jsonb_build_object('ok', false, 'error', 'experiencia_no_visible_en_mvp', 'state', '{}'::jsonb);
    end if;

    if v_resource_id is not null
       and v_resource_id <> v_experience.primary_resource_id then
      return public.lumi_get_node('HOME_DEFAULT')
        || jsonb_build_object('ok', false, 'error', 'offer_resource_mismatch', 'state', '{}'::jsonb);
    end if;

    v_resource_id := v_experience.primary_resource_id;

    select r.id, r.title, r.url, r.source_kind, r.format, r.duration_min, r.metadata
    into v_resource
    from public.resources r
    where r.id = v_resource_id
      and r.is_active = true
      and r.status = 'active';

    if not found then
      return public.lumi_get_node('HOME_DEFAULT')
        || jsonb_build_object('ok', false, 'error', 'resource_not_found_or_inactive', 'state', '{}'::jsonb);
    end if;

    -- Idempotencia: un mismo token de PRE representa un único inicio.
    select er.id
    into v_run_id
    from public.experience_runs er
    where er.user_id = v_user_id
      and er.experience_id = v_experience_id
      and er.offer_snapshot->>'offer_token' = v_offer_token
    limit 1;

    if v_run_id is null then
      v_selection_source := case v_source
        when 'lumi'      then 'motor'
        when 'motor'     then 'motor'
        when 'fuente'    then 'fuente'
        when 'sanctuary' then 'sanctuary'
        when 'tejido'    then 'tejido'
        when 'derrame'   then 'derrame'
        when 'mercado'   then 'mercado'
        else 'other'
      end;

      v_realization_type := case v_selection_source
        when 'motor'     then 'source'
        when 'fuente'    then 'source'
        when 'sanctuary' then 'sanctuary'
        when 'tejido'    then 'weave'
        when 'derrame'   then 'spill'
        when 'mercado'   then 'market'
        else 'other'
      end;

      if v_selection_source = 'motor' then
        if v_session_id is null then
          return public.lumi_get_node('HOME_DEFAULT')
            || jsonb_build_object('ok', false, 'error', 'session_id_requerido_para_motor', 'state', '{}'::jsonb);
        end if;

        select
          s.hemisphere_key,
          s.area::text,
          s.state_key,
          s.faro_key,
          s.user_area_faro_id,
          coalesce(nullif(uaf.faro_text, ''), faro_uc.short_label, s.faro_key),
          s.selected_capability_key,
          s.time_bucket::text,
          s.current_format_preference
        into
          v_session_hemisphere,
          v_session_area,
          v_session_state,
          v_session_faro_key,
          v_session_uaf_id,
          v_session_faro_text,
          v_session_capability,
          v_session_time,
          v_session_format
        from public.sessions s
        left join public.user_area_faros uaf
          on uaf.id = s.user_area_faro_id
        left join public.ui_copy faro_uc
          on faro_uc.domain = 'faro'
         and faro_uc.lang = 'es'
         and faro_uc.key = s.faro_key
        where s.id = v_session_id
          and s.user_id = v_user_id;

        if not found or nullif(v_session_capability, '') is null then
          v_node := public.lumi_get_node('NO_MATCH_HONEST');
          return v_node || jsonb_build_object(
            'ok', true,
            'code', 'NO_MATCH_HONEST',
            'content_type', 'empty_presence',
            'content', jsonb_build_object('type', 'empty_presence'),
            'state', jsonb_build_object(
              'currentSessionId', v_session_id::text,
              'currentExperienceRunId', '',
              'currentExperienceId', ''
            )
          );
        end if;

        if v_session_time is not null then
          begin
            v_max_mins := public.lumi_max_minutes(v_session_time::public.time_bucket);
          exception when others then
            v_max_mins := 999;
          end;
        end if;

        -- Revalida la OFERTA específica ya mostrada. No rerankea y no consulta
        -- session_experience_shown, porque allí justamente ya quedó registrada.
        select eh.*
        into v_hypothesis
        from public.experience_hypotheses eh
        where eh.active = true
          and eh.experience_id = v_experience_id
          and eh.hemisphere_key = v_session_hemisphere
          and (eh.life_area_key = v_session_area or eh.life_area_key is null)
          and eh.capability_key = v_session_capability
          and eh.expected_capability_key = v_session_capability
          and (
            case
              when v_session_hemisphere = 'H1' then (eh.state_key = v_session_state or eh.state_key is null)
              when v_session_hemisphere = 'H2' then (eh.faro_key = v_session_faro_key or eh.faro_key is null)
              else false
            end
          )
          and v_resource.duration_min <= v_max_mins
          and (
            v_session_format is null
            or v_session_format = ''
            or v_resource.format::text = v_session_format
          )
          and not exists (
            select 1
            from public.experience_runs er
            where er.user_id = v_user_id
              and er.experience_id = v_experience_id
              and er.help_signal = 'no_era_para_mi'
              and er.started_at > now() - interval '30 days'
          )
        order by
          (
            case when eh.life_area_key is not null then 1 else 0 end
            + case when eh.state_key is not null or eh.faro_key is not null then 1 else 0 end
          ) desc,
          eh.priority desc
        limit 1;

        if v_hypothesis is null then
          insert into public.session_events(
            session_id, user_id, action_type, metadata, created_at
          ) values (
            v_session_id,
            v_user_id,
            'no_match',
            jsonb_strip_nulls(jsonb_build_object(
              'reason', 'offer_stale_on_accept',
              'selector_source', 'lumi_open_resource_viewer',
              'selector_contract', 't1_checkin_match_run_v1',
              'experience_id', v_experience_id,
              'hemisphere', v_session_hemisphere,
              'life_area_key', v_session_area,
              'state_key', v_session_state,
              'faro_key', v_session_faro_key,
              'capability_key', v_session_capability,
              'time_bucket', v_session_time,
              'format_preference', v_session_format
            )),
            now()
          );

          v_node := public.lumi_get_node('NO_MATCH_HONEST');
          return v_node || jsonb_build_object(
            'ok', true,
            'code', 'NO_MATCH_HONEST',
            'content_type', 'empty_presence',
            'content', jsonb_build_object('type', 'empty_presence'),
            'state', jsonb_build_object(
              'currentSessionId', v_session_id::text,
              'currentExperienceRunId', '',
              'currentExperienceId', ''
            )
          );
        end if;

        v_legacy_hypothesis_id := v_hypothesis.id;
        v_served_capability := v_session_capability;

      elsif v_selection_source = 'sanctuary' then
        if v_sanctuary_item_id is null then
          select si.id
          into v_sanctuary_item_id
          from public.sanctuary_items si
          where si.user_id = v_user_id
            and si.experience_id = v_experience_id
            and si.experience_run_id is not null
          order by si.created_at desc
          limit 1;
        end if;

        select
          er.id,
          er.hemisphere_key,
          er.life_area_key,
          er.state_key,
          er.faro_key,
          er.user_area_faro_id,
          er.faro_text_snapshot,
          er.served_capability_key,
          er.primary_capability_key,
          er.selected_capability_key,
          er.expected_capability_key
        into
          v_origin_run_id,
          v_origin_hemisphere,
          v_origin_area,
          v_origin_state,
          v_origin_faro_key,
          v_origin_uaf_id,
          v_origin_faro_text,
          v_origin_served_cap,
          v_origin_primary_cap,
          v_origin_selected_cap,
          v_origin_expected_cap
        from public.sanctuary_items si
        join public.experience_runs er on er.id = si.experience_run_id
        where si.id = v_sanctuary_item_id
          and si.user_id = v_user_id
          and coalesce(si.experience_id, er.experience_id) = v_experience_id
        limit 1;

        if not found then
          return public.lumi_get_node('HOME_DEFAULT')
            || jsonb_build_object('ok', false, 'error', 'sanctuary_origin_no_valido', 'state', '{}'::jsonb);
        end if;

        v_session_hemisphere := coalesce(v_origin_hemisphere, v_experience.hemisphere_key);
        v_session_area := coalesce(v_origin_area, v_experience.primary_life_area_key);
        v_session_state := v_origin_state;
        v_session_faro_key := v_origin_faro_key;
        v_session_uaf_id := v_origin_uaf_id;
        v_session_faro_text := v_origin_faro_text;
        v_served_capability := coalesce(
          v_origin_served_cap,
          v_origin_primary_cap,
          v_origin_selected_cap,
          v_origin_expected_cap,
          v_experience.primary_capability_key,
          v_experience.expected_capability_key
        );

      else
        -- Fuente y puertas futuras sin contexto específico: la sesión, aunque
        -- exista técnicamente, no se vuelve autoridad sobre la oferta autónoma.
        v_session_hemisphere := v_experience.hemisphere_key;
        v_session_area := v_experience.primary_life_area_key;
        v_served_capability := coalesce(
          v_experience.primary_capability_key,
          v_experience.expected_capability_key
        );
      end if;

      v_offer_snapshot := jsonb_strip_nulls(jsonb_build_object(
        'contract', 't1_checkin_match_run_v1',
        'offer_token', v_offer_token,
        'selection_source', v_selection_source,
        'realization_type', v_realization_type,
        'experience_id', v_experience_id,
        'resource_id', v_resource_id,
        'served_capability_key', v_served_capability,
        'hemisphere_key', v_session_hemisphere,
        'life_area_key', v_session_area,
        'state_key', v_session_state,
        'faro_key', v_session_faro_key,
        'time_bucket', v_session_time,
        'format_preference', v_session_format,
        'legacy_hypothesis_id', v_legacy_hypothesis_id,
        'sanctuary_item_id', case when v_selection_source = 'sanctuary' then v_sanctuary_item_id else null end,
        'origin_run_id', v_origin_run_id,
        'accepted_at', now()
      ));

      -- Compatibilidad transitoria: lectores existentes aún buscan source/time
      -- en hypothesis_json. Se replica sólo eso; offer_snapshot es autoridad.
      v_legacy_hypothesis := jsonb_strip_nulls(jsonb_build_object(
        'source', case v_selection_source
          when 'motor' then 'lumi_motor'
          when 'sanctuary' then 'sanctuary_replay'
          else v_selection_source
        end,
        'canonical_offer_snapshot', true,
        'offer_token', v_offer_token,
        'time_bucket', v_session_time,
        'sanctuary_item_id', case when v_selection_source = 'sanctuary' then v_sanctuary_item_id else null end
      ));

      begin
        insert into public.experience_runs (
          user_id,
          session_id,
          experience_id,
          resource_id,
          state_key,
          life_area_key,
          hemisphere_key,
          faro_key,
          faro_text_snapshot,
          expected_capability_key,
          selected_capability_key,
          user_area_faro_id,
          primary_capability_key,
          primary_life_area_key,
          current_format_preference,
          hypothesis_json,
          selection_source,
          served_capability_key,
          realization_type,
          offer_snapshot,
          started_at,
          saved_to_sanctuary
        ) values (
          v_user_id,
          v_session_id,
          v_experience_id,
          v_resource_id,
          v_session_state,
          v_session_area,
          v_session_hemisphere,
          v_session_faro_key,
          v_session_faro_text,
          v_experience.expected_capability_key,
          v_served_capability,
          v_session_uaf_id,
          v_experience.primary_capability_key,
          v_experience.primary_life_area_key,
          v_session_format,
          v_legacy_hypothesis,
          v_selection_source,
          v_served_capability,
          v_realization_type,
          v_offer_snapshot,
          now(),
          false
        )
        returning id into v_run_id;

        v_created_run := true;
      exception when unique_violation then
        select er.id
        into v_run_id
        from public.experience_runs er
        where er.user_id = v_user_id
          and er.experience_id = v_experience_id
          and er.offer_snapshot->>'offer_token' = v_offer_token
        limit 1;

        if v_run_id is null then
          raise;
        end if;
      end;

      -- Journal accesorio enlazado al Run. No duplica Retorno/capacidad percibida.
      if v_created_run and v_session_id is not null then
        insert into public.session_events (
          session_id,
          user_id,
          action_type,
          resource_id,
          experience_id,
          experience_run_id,
          metadata,
          created_at
        ) values (
          v_session_id,
          v_user_id,
          'opened',
          v_resource_id,
          v_experience_id,
          v_run_id,
          jsonb_build_object(
            'src', 't1_canonical_run_start',
            'selection_source', v_selection_source,
            'offer_token', v_offer_token
          ),
          now()
        );
      end if;
    end if;
  end if;

  if v_resource_id is null then
    return public.lumi_get_node('HOME_DEFAULT')
      || jsonb_build_object('ok', false, 'error', 'resource_id_requerido', 'state', '{}'::jsonb);
  end if;

  -- Siempre recargar: cubre Run existente, Run nuevo y viewer legacy.
  select r.id, r.title, r.url, r.source_kind, r.format, r.duration_min, r.metadata
  into v_resource
  from public.resources r
  where r.id = v_resource_id;

  if not found then
    return public.lumi_get_node('HOME_DEFAULT')
      || jsonb_build_object('ok', false, 'error', 'resource_not_found', 'state', '{}'::jsonb);
  end if;

  v_source_kind := coalesce(
    nullif(trim(coalesce(v_resource.source_kind, '')), ''),
    'external_url'
  );

  -- Viewer legacy sin token ni Run: se conserva el adaptador viejo, sin
  -- convertirlo en contrato canónico nuevo.
  if v_run_id is null
     and v_offer_token is null
     and v_session_id is not null then
    begin
      perform public.gaia_submit_session_action(
        p_session_id := v_session_id,
        p_chosen_resource_id := v_resource_id,
        p_feedback := null,
        p_saved := false,
        p_action := 'opened'
      );
    exception when others then
      null;
    end;
  end if;

  v_node := public.lumi_get_node('RESOURCE_VIEWER_ACTIVE');

  return jsonb_build_object(
    'ok', true,
    'code', 'RESOURCE_VIEWER_ACTIVE',
    'message', coalesce(v_node->>'message', 'Tomá el tiempo que necesitás.'),
    'actions', coalesce(v_node->'actions', jsonb_build_array(
      jsonb_build_object('label', 'Listo', 'value', '', 'action', 'close_resource_viewer')
    )),
    'content_type', 'resource_viewer',
    'content', jsonb_build_object(
      'type', 'resource_viewer',
      'title', coalesce(v_resource.title, ''),
      'url', coalesce(v_resource.url, ''),
      'activeUrl', coalesce(v_resource.url, ''),
      'source_kind', v_source_kind,
      'format', coalesce(v_resource.format::text, ''),
      'duration_min', coalesce(v_resource.duration_min, 0),
      'resource_id', v_resource_id::text,
      'experience_id', coalesce(v_experience_id::text, ''),
      'experience_run_id', coalesce(v_run_id::text, ''),
      'run_id', coalesce(v_run_id::text, ''),
      'source', v_source,
      'metadata', coalesce(v_resource.metadata, '{}'::jsonb)
    ),
    'state', jsonb_build_object(
      'currentResourceId', v_resource_id::text,
      'currentExperienceId', coalesce(v_experience_id::text, ''),
      'currentExperienceRunId', coalesce(v_run_id::text, ''),
      'resourceSourceKind', v_source_kind,
      'activeUrl', coalesce(v_resource.url, ''),
      'contentSource', v_source
    )
  );
end;
$function$;

commit;
