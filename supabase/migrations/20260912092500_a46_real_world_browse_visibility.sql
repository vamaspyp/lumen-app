-- A46 · Ensure context-dependent real-world doors are visible in default Source browse.
-- Matching remains unchanged because these possibilities still have zero HelpApplicability rows.
update gf_core.help_versions hv
set detail = hv.detail || jsonb_build_object('browse_priority',9)
from gf_core.help_possibilities hp
where hv.help_id=hp.help_id
  and hv.version=hp.current_version
  and hp.canonical_code in ('argentina_mental_health_0800','argentina_caj_access_to_justice');
