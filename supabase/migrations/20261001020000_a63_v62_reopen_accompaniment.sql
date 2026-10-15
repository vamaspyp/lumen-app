create or replace function public.lumen_s2_movement_snapshot()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_person uuid:=gf_core.current_person_id();v_items jsonb;v_context jsonb;v_changes jsonb;v_withdraw boolean;begin
 if v_person is null then raise exception 'authentication required' using errcode='28000';end if;
 if not coalesce((select memory_allowed from gf_core.privacy_preferences where person_id=v_person),false) then return jsonb_build_object('state','without_memory','items','[]'::jsonb,'changes','[]'::jsonb,'context','{}'::jsonb,'withdrawn',false);end if;
 select to_jsonb(c)-'person_id'-'updated_at' into v_context from gf_private.life_context c where person_id=v_person;
 select coalesce(jsonb_agg(q.item order by q.at desc),'[]'::jsonb) into v_items from (
  select e.occurred_at at,jsonb_build_object('event_id',e.event_id,'help_id',e.payload->>'help_id','at',e.occurred_at,
    'text',case e.event_type when 'RepertoireConfirmed' then 'Reconociste este recurso como propio.' when 'RepertoireReused' then 'Volviste a un recurso que ya conocés.' when 'LumiWithdrew' then 'Elegiste que no te lo recordemos. LUMEN se retiró de ese recordatorio.'
    when 'LongitudinalSignalRecorded' then case e.payload->>'signal_kind' when 'REPEATED' then 'Lo repetiste.' when 'ADAPTED' then 'Lo adaptaste a tu manera.' when 'VARIED' then 'Probaste otra forma.' when 'APPLIED_OTHER_CONTEXT' then 'Lo llevaste a otra situación de tu vida.' when 'STOPPED_HELPING' then 'Nos dijiste que dejó de ayudar. Volvemos a buscar otra forma.' else 'Compartiste cómo siguió esta experiencia.' end end) item
  from gf_ledger.domain_events e where e.person_pseudonym=v_person and e.occurred_at>coalesce((select max(forgot.occurred_at) from gf_ledger.domain_events forgot where forgot.person_pseudonym=v_person and forgot.event_type='PersonalMemoryForgotten'),'-infinity'::timestamptz) and e.event_type in ('RepertoireConfirmed','RepertoireReused','LumiWithdrew','LongitudinalSignalRecorded') order by e.occurred_at desc limit 8
 ) q;
 select coalesce(jsonb_agg(q.item order by q.at desc),'[]'::jsonb) into v_changes from (
  select e.occurred_at at,jsonb_build_object('event_id',e.event_id,'help_id',e.payload->>'help_id','at',e.occurred_at,
    'text','Al principio te acercamos una ayuda. Hoy empezamos por lo que vos reconociste como propio; por eso te propusimos menos y LUMI se corrió.') item
  from gf_ledger.domain_events e where e.person_pseudonym=v_person and e.occurred_at>coalesce((select max(forgot.occurred_at) from gf_ledger.domain_events forgot where forgot.person_pseudonym=v_person and forgot.event_type='PersonalMemoryForgotten'),'-infinity'::timestamptz) and e.event_type='AccompanimentAdapted' and e.payload->>'decision_kind'='REUSE_REPERTOIRE'
  and exists(select 1 from gf_ledger.domain_events prior where prior.person_pseudonym=v_person and prior.event_type='RepertoireConfirmed' and prior.payload->>'help_id'=e.payload->>'help_id' and prior.occurred_at<=e.occurred_at)
  order by e.occurred_at desc limit 3
 ) q;
 select coalesce((select case when e.event_type='LumiWithdrew' then true when e.event_type='AccompanimentAdapted' then coalesce((e.payload->>'lumi_withdrawn')::boolean,false) else false end from gf_ledger.domain_events e where e.person_pseudonym=v_person and e.occurred_at>coalesce((select max(forgot.occurred_at) from gf_ledger.domain_events forgot where forgot.person_pseudonym=v_person and forgot.event_type='PersonalMemoryForgotten'),'-infinity'::timestamptz) and (e.event_type in ('LumiWithdrew','AccompanimentAdapted') or (e.event_type='LongitudinalSignalRecorded' and e.payload->>'signal_kind'='STOPPED_HELPING')) order by e.occurred_at desc limit 1),false) into v_withdraw;
 return jsonb_build_object('state','success','items',v_items,'changes',v_changes,'context',coalesce(v_context,'{}'::jsonb),'withdrawn',v_withdraw);end $$;
