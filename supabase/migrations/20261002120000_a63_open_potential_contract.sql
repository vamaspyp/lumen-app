-- A63 / V46 V52 V53 V58: Potencial is open, revisable and owned by the person.
-- Additive API. No mandatory potential_key, no new taxonomy, no change to legacy Source matching.
create or replace function public.lumen_potential_snapshot()
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_person uuid := gf_core.current_person_id(); v_allowed boolean; v_text text; v_items jsonb;
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000'; end if;
 select coalesce(memory_allowed,false) into v_allowed from gf_core.privacy_preferences where person_id=v_person;
 if not coalesce(v_allowed,false) then return jsonb_build_object('memory_allowed',false,'potential',null,'manifestations','[]'::jsonb); end if;
 select lc.potential into v_text from gf_private.life_context lc where lc.person_id=v_person;
 select coalesce(jsonb_agg(jsonb_build_object('id',i.inference_id,'text',i.value->>'text','status',i.status,'source_kind',i.source_kind,'revision',i.revision,'updated_at',i.updated_at) order by i.updated_at desc),'[]'::jsonb)
 into v_items from gf_core.inferences i where i.person_id=v_person and i.inference_kind='potential_manifestation' and i.status in ('candidate','confirmed');
 return jsonb_build_object('memory_allowed',true,'potential',v_text,'manifestations',v_items);
end $$;
create or replace function public.lumen_potential_manifestation_set(p_text text,p_inference_id uuid default null,p_reject boolean default false)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_person uuid:=gf_core.current_person_id(); v_allowed boolean; v_id uuid; v_status text;
begin
 if v_person is null then raise exception 'authentication required' using errcode='28000'; end if;
 select coalesce(memory_allowed,false) into v_allowed from gf_core.privacy_preferences where person_id=v_person;
 if not coalesce(v_allowed,false) then raise exception 'memory consent required' using errcode='42501'; end if;
 if not p_reject and (char_length(trim(coalesce(p_text,''))) < 1 or char_length(trim(p_text)) > 500) then raise exception 'manifestation must contain 1..500 characters' using errcode='22023'; end if;
 if p_inference_id is null then
  if p_reject then raise exception 'id required to reject' using errcode='22023'; end if;
  insert into gf_core.inferences(person_id,inference_kind,value,status,source_kind,source_version,provenance)
  values(v_person,'potential_manifestation',jsonb_build_object('text',trim(p_text)),'confirmed','person','potential.open.v1',jsonb_build_object('person_correctable',true))
  returning inference_id,status into v_id,v_status;
 else
  update gf_core.inferences i set value=case when p_reject then i.value else jsonb_build_object('text',trim(p_text)) end,
  status=case when p_reject then 'rejected' else 'confirmed' end,source_kind='person',source_version='potential.open.v1',revision=i.revision+1,updated_at=now(),valid_to=case when p_reject then now() else null end
  where i.inference_id=p_inference_id and i.person_id=v_person and i.inference_kind='potential_manifestation' and i.status in ('candidate','confirmed')
  returning i.inference_id,i.status into v_id,v_status;
  if v_id is null then raise exception 'manifestation unavailable' using errcode='22023'; end if;
 end if;
 perform gf_private.emit_person_event('PotentialManifestationCorrected','person',v_person,v_person,gen_random_uuid(),'a63.potential.open.v1',jsonb_build_object('inference_id',v_id,'status',v_status));
 return jsonb_build_object('state','success','id',v_id,'status',v_status);
end $$;
revoke all on function public.lumen_potential_snapshot() from public,anon;
revoke all on function public.lumen_potential_manifestation_set(text,uuid,boolean) from public,anon;
grant execute on function public.lumen_potential_snapshot() to authenticated;
grant execute on function public.lumen_potential_manifestation_set(text,uuid,boolean) to authenticated;
comment on function public.lumen_potential_manifestation_set(text,uuid,boolean) is 'A63 V53: user-confirmed open manifestation; not a capability score, taxonomy or Source matching key.';