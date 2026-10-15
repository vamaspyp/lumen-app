-- A63 correction: preserve causal ordering of person events inside one transaction.
-- Same contract/payload/ACL; no retained history rewritten.
create or replace function gf_private.emit_person_event(p_type text,p_aggregate text,p_aggregate_id uuid,p_person uuid,p_trace uuid,p_contract text,p_payload jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid:=gen_random_uuid();begin
 insert into gf_ledger.domain_events(event_id,event_type,aggregate_type,aggregate_id,actor_type,actor_id,person_pseudonym,trace_id,contract_version,payload,provenance,occurred_at)
 values(v_id,p_type,p_aggregate,p_aggregate_id,'person',p_person::text,p_person,coalesce(p_trace,gen_random_uuid()),p_contract,coalesce(p_payload,'{}'::jsonb),jsonb_build_object('source','greenfield'),clock_timestamp());
 return v_id;
end $$;
