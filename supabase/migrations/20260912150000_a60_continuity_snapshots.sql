-- A60 · surface the longitudinal state already owned by Repertoire and Followups.
create or replace function public.lumen_s2_snapshot()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_person uuid;v_memory boolean:=false;v_trajectories jsonb;v_repertoire jsonb;v_sanctuary_count integer;
begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 if v_person is null then return jsonb_build_object('memory_allowed',false,'trajectories','[]'::jsonb,'repertoire','[]'::jsonb,'sanctuary_count',0);end if;
 select coalesce(memory_allowed,false) into v_memory from gf_core.privacy_preferences where person_id=v_person;
 select coalesce(jsonb_agg(jsonb_build_object('trajectory_id',t.trajectory_id,'faro_text',t.faro_text,'status',t.status,'path',coalesce((select jsonb_agg(jsonb_build_object('path_item_id',pi.path_item_id,'help_id',pi.help_id,'label',pi.label,'position',pi.position,'status',pi.status,'cultivation_move',pi.cultivation_move) order by pi.position) from gf_core.path_items pi join gf_core.paths p on p.path_id=pi.path_id where p.trajectory_id=t.trajectory_id),'[]'::jsonb)) order by t.updated_at desc),'[]'::jsonb) into v_trajectories from gf_core.trajectories t where t.person_id=v_person;
 select coalesce(jsonb_agg(jsonb_build_object('repertoire_id',r.repertoire_id,'help_id',r.help_id,'title',hl.title,'summary',hl.summary,'times_reused',r.times_reused,'last_used_at',r.last_used_at,'capability_keys',to_jsonb(r.capability_keys),'user_confirmed',r.user_confirmed) order by r.updated_at desc),'[]'::jsonb) into v_repertoire
 from gf_core.personal_repertoire r join gf_core.help_possibilities hp on hp.help_id=r.help_id join gf_core.help_versions hv on hv.help_id=hp.help_id and hv.version=hp.current_version join lateral(select title,summary from gf_core.help_localizations where help_version_id=hv.help_version_id order by case when locale='es-AR' then 0 else 1 end limit 1) hl on true where r.person_id=v_person and r.status='active';
 select count(*) into v_sanctuary_count from gf_private.sanctuary_entries where person_id=v_person;
 return jsonb_build_object('memory_allowed',coalesce(v_memory,false),'trajectories',v_trajectories,'repertoire',v_repertoire,'sanctuary_count',v_sanctuary_count);
end $$;

create or replace function public.lumen_s6_snapshot()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_person uuid;v_allowed boolean:=false;v_settings jsonb;v_followups jsonb;
begin
 if v_uid is null then raise exception 'authentication required';end if;
 select person_id into v_person from gf_core.persons where auth_user_id=v_uid;
 select coalesce(proactive_allowed,false) into v_allowed from gf_core.privacy_preferences where person_id=v_person;
 select jsonb_build_object('quiet_start_hour',quiet_start_hour,'quiet_end_hour',quiet_end_hour,'timezone',timezone,'custody_blocked',custody_blocked) into v_settings from gf_core.proactivity_settings where person_id=v_person;
 select coalesce(jsonb_agg(jsonb_build_object('followup_id',followup_id,'reason_code',reason_code,'due_at',due_at,'status',status,'channel',channel,'related_trajectory_id',related_trajectory_id,'related_help_id',related_help_id,'cultivation_move',cultivation_move,'capacity_key',capacity_key,'repertoire_id',repertoire_id) order by due_at),'[]'::jsonb) into v_followups from gf_core.followups where person_id=v_person and status in('scheduled','due');
 return jsonb_build_object('proactive_allowed',coalesce(v_allowed,false),'settings',coalesce(v_settings,jsonb_build_object('quiet_start_hour',22,'quiet_end_hour',8,'timezone','America/Argentina/Buenos_Aires','custody_blocked',false)),'followups',v_followups);
end $$;
