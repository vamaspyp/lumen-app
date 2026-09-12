-- A46 · Default browse should visibly express Source plurality without changing Motor matching.
-- Representative browse priorities are editorial for exploration only.
update gf_core.help_versions hv
set detail = hv.detail || jsonb_build_object('browse_priority',9)
from gf_core.help_possibilities hp
where hv.help_id=hp.help_id
  and hv.version=hp.current_version
  and hp.canonical_code in (
    'lumen_change_map',
    'lumen_care_specific_ask',
    'lumen_adaptation_question',
    'dhammapada_pg',
    'marcus_meditations_pg'
  );
