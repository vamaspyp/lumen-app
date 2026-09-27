-- A64 custody hardening discovered during integral certification.
-- Stateful/private continuity RPCs require an authenticated Life.
-- Public read-only Source discovery and operational health remain intentionally available.
revoke execute on function public.lumen_s2_add_path_item(uuid,uuid,text,text,uuid) from anon;
revoke execute on function public.lumen_s2_resolve_cultivation_context(text) from anon;
revoke execute on function public.lumen_s2_reuse_repertoire(uuid,text,uuid) from anon;
revoke execute on function public.lumen_s6_schedule_cultivation_followup(text,timestamptz,uuid,uuid,uuid,text,text,uuid) from anon;
