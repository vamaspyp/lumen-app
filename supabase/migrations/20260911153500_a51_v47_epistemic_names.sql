-- VA+LUMEN A51 · V47 semantic cleanup
-- Internal knowledge maturity uses K0..K5 so it cannot be confused with strategic OEs E1..E4.

alter table gf_private.knowledge_claims
  drop constraint if exists knowledge_claims_epistemic_level_check;

update gf_private.knowledge_claims
set epistemic_level=case epistemic_level
  when 'E0' then 'K0'
  when 'E1' then 'K1'
  when 'E2' then 'K2'
  when 'E3' then 'K3'
  when 'E4' then 'K4'
  when 'E5' then 'K5'
  else epistemic_level
end
where epistemic_level in('E0','E1','E2','E3','E4','E5');

alter table gf_private.knowledge_claims
  add constraint knowledge_claims_epistemic_level_check
  check(epistemic_level in('K0','K1','K2','K3','K4','K5'));
