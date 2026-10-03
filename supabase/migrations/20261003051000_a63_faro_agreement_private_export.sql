-- Preserve personal export custody for the new normalized agreement history.
create or replace function public.lumen_s2_export_sanctuary()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_person uuid;v_entries jsonb;v_trajectories jsonb;v_repertoire jsonb;v_agreements jsonb;
begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then raise exception 'person unavailable' using errcode='P0002';end if;
 select coalesce(jsonb_agg(jsonb_build_object('entry_id',entry_id,'entry_kind',entry_kind,'title',title,'content',content_text,'source_help_id',source_help_id,'created_at',created_at,'updated_at',updated_at) order by created_at),'[]'::jsonb) into v_entries from gf_private.sanctuary_entries where person_id=v_person;
 select coalesce(jsonb_agg(jsonb_build_object('trajectory_id',trajectory_id,'faro_text',faro_text,'status',status,'created_at',created_at,'updated_at',updated_at) order by created_at),'[]'::jsonb) into v_trajectories from gf_core.trajectories where person_id=v_person;
 select coalesce(jsonb_agg(jsonb_build_object('repertoire_id',repertoire_id,'help_id',help_id,'source_outcome_id',source_outcome_id,'status',status,'times_reused',times_reused,'created_at',created_at,'updated_at',updated_at) order by created_at),'[]'::jsonb) into v_repertoire from gf_core.personal_repertoire where person_id=v_person;
 select coalesce(jsonb_agg(jsonb_build_object('trajectory_id',a.trajectory_id,'version',a.version,'faro_text',a.faro_text,'area_keys',a.area_keys,'validated_at',a.validated_at,'items',(select coalesce(jsonb_agg(jsonb_build_object('identity_id',i.identity_id,'concept_id',i.concept_id,'label',i.label,'definition',i.definition,'contextual_meaning',i.contextual_meaning,'origin',i.origin,'status',i.status) order by i.position),'[]'::jsonb) from gf_private.faro_agreement_items i where i.agreement_id=a.agreement_id)) order by a.trajectory_id,a.version),'[]'::jsonb) into v_agreements from gf_private.faro_agreement_versions a where a.person_id=v_person;
 return jsonb_build_object('export_version','sanctuary.v1','generated_at',now(),'sanctuary_entries',v_entries,'trajectories',v_trajectories,'personal_repertoire',v_repertoire,'faro_potential_agreements',v_agreements);
end $$;
revoke all on function public.lumen_s2_export_sanctuary() from public,anon;
grant execute on function public.lumen_s2_export_sanctuary() to authenticated;
