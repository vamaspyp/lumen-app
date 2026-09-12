import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('A46 reinforces thin Source coverage without introducing a parallel Source model', async () => {
  const sql = await read('supabase/migrations/20260912090000_a46_source_diversity_seed.sql')
  for (const code of ['bcra_financial_rights_ar','medlineplus_caregiver_health_es','ilo_psychosocial_work_stress_es','lumen_change_map','lumen_financial_snapshot','lumen_care_specific_ask','lumen_workload_conversation','lumen_attention_protected_block','lumen_adaptation_question','lumen_grief_memory_conversation','argentina_mental_health_0800','argentina_caj_access_to_justice']) assert.match(sql, new RegExp(code))
  assert.match(sql, /gf_private\.source_intake/)
  assert.match(sql, /gf_private\.activate_source_intake/)
  assert.doesNotMatch(sql, /create table/i)
})

test('A46 keeps real-world doors browseable without inventing matching applicability', async () => {
  const seed = await read('supabase/migrations/20260912090000_a46_source_diversity_seed.sql')
  const browse = await read('supabase/migrations/20260912092500_a46_real_world_browse_visibility.sql')
  assert.match(seed, /'argentina_mental_health_0800'[\s\S]*?'applicability','\[\]'::jsonb/)
  assert.match(seed, /'argentina_caj_access_to_justice'[\s\S]*?'applicability','\[\]'::jsonb/)
  assert.match(browse, /browse_priority/)
  assert.doesNotMatch(browse, /help_applicability/i)
})

test('A46 Source taxonomy exposes semantic forms dynamically', async () => {
  const sql = await read('supabase/migrations/20260912091000_a46_source_exploration_contract.sql')
  assert.match(sql, /'help_types'/)
  assert.match(sql, /select distinct hp\.help_type/)
  for (const type of ['conversation','tool','question','professional_support','institutional_service']) assert.match(sql, new RegExp(type))
})

test('A46 health reads canonical integrity from the governed active policy owner', async () => {
  const sql = await read('supabase/migrations/20260912094500_a46_health_policy_ownership.sql')
  assert.match(sql, /from gf_private\.policy_versions/)
  assert.match(sql, /policy_key='canonical_integrity'/)
  assert.match(sql, /status='active'/)
  assert.match(sql, /integrally_certified/)
  assert.doesNotMatch(sql, /canonical_integrity'[\s\S]*from gf_private\.runtime_policies/i)
})

test('historical and superseded authorities remain non-normative after A46', async () => {
  const context = JSON.parse(await read('governance/conduction-context.json'))
  const snapshot = JSON.parse(await read('governance/pov-snapshot.json'))
  assert.equal(context.act.status, 'EN CURSO')
  for (const id of ['V37','V39','V47','V48','V49']) assert.ok(snapshot.superseded_authorities.includes(id))
  const current = new Set(context.authorities.map((x) => x.id))
  for (const id of ['V37','V39','V47','V48','V49']) assert.equal(current.has(id), false)
})
