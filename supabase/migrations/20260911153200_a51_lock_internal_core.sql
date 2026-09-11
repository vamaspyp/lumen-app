-- A51 security follow-up: only the custody-preserving public wrapper is callable by clients.
revoke execute on function gf_core.v47_orientation_bridge(text,text[]) from authenticated;
revoke execute on function public.lumen_s1_accompany_moment_v47_core(text,text,text,text,uuid) from authenticated;
