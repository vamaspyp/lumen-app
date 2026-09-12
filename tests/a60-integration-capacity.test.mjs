import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('A60 models constellations as projections, never as a new domain table', async () => {
  const sql = await read('supabase/migrations/20260912144000_a60_integration_capacity_metabolism.sql')
  const alignment = await read('supabase/migrations/20260912170528_a60_final_contract_alignment.sql')
  assert.match(sql, /lumen_source_constellation/i)
  assert.match(sql, /cultivation_roles/i)
  assert.match(alignment, /p_context jsonb default '\{\}'::jsonb/i)
  assert.match(alignment, /max_duration_minutes/i)
  assert.match(alignment, /allowed_energy/i)
  assert.doesNotMatch(`${sql}\n${alignment}`, /create\s+table\s+[^;]*constellation/i)
})

test('A60 never creates personal capability scores or habit tracking', async () => {
  const migrations = [
    await read('supabase/migrations/20260912144000_a60_integration_capacity_metabolism.sql'),
    await read('supabase/migrations/20260912145000_a60_constellation_diversity.sql'),
    await read('supabase/migrations/20260912150000_a60_continuity_snapshots.sql'),
    await read('supabase/migrations/20260912151500_a60_natural_continuity.sql'),
    await read('supabase/migrations/20260912170528_a60_final_contract_alignment.sql'),
  ].join('\n')
  assert.doesNotMatch(migrations, /create\s+table\s+[^;]*(capability_score|habit|streak)/i)
  assert.doesNotMatch(migrations, /capability_(score|level)|progress_score/i)
})

test('A60 preserves voluntary repertoire integration before longitudinal reuse', async () => {
  const sql = await read('supabase/migrations/20260912144000_a60_integration_capacity_metabolism.sql')
  assert.match(sql, /a helped outcome is required before integration/i)
  assert.match(sql, /user_confirmed\s*,\s*integration_context/i)
  assert.match(sql, /user_confirmed\s*=\s*true/i)
  assert.match(sql, /lumen_s2_reuse_repertoire/i)
  assert.match(sql, /status='active' and user_confirmed=true/i)
})

test('A60 differentiates punctual help from longitudinal incorporation evidence', async () => {
  const sql = await read('supabase/migrations/20260912144000_a60_integration_capacity_metabolism.sql')
  for (const signal of ['HELPED_NOW','REUSED','REPEATED','VARIED','APPLIED_OTHER_CONTEXT','ADAPTED','RECOGNIZED_AS_OWN','NO_REMINDER_NEEDED','STOPPED_HELPING']) assert.match(sql, new RegExp(signal))
  assert.match(sql, /longitudinal_signal/i)
  assert.match(sql, /decision_kind/i)
  assert.match(sql, /WITHDRAW/i)
})

test('A60 withdrawal is autonomy, not disengagement inference', async () => {
  const sql = await read('supabase/migrations/20260912144000_a60_integration_capacity_metabolism.sql')
  assert.match(sql, /NO_REMINDER_NEEDED/)
  assert.match(sql, /own_resource_sufficient_no_reminder/)
  assert.match(sql, /LumiWithdrew/)
  assert.doesNotMatch(sql, /days_since_last_login|inactive_user|engagement_score/i)
})

test('A60 proactivity remains consent-gated and cultivation-linked', async () => {
  const sql = await read('supabase/migrations/20260912144000_a60_integration_capacity_metabolism.sql')
  assert.match(sql, /proactivity consent required/i)
  assert.match(sql, /CultivationFollowupScheduled/)
  assert.match(sql, /p_cultivation_move/)
})

test('A60 application and public contracts expose cultivation metabolism', async () => {
  const app = await read('src/greenfield/application/embryo.ts')
  const alignment = await read('supabase/migrations/20260912170528_a60_final_contract_alignment.sql')
  assert.match(app, /discoverConstellation/)
  assert.match(app, /reuseRepertoire/)
  assert.match(app, /recordLongitudinalSignal/)
  assert.match(app, /scheduleCultivationFollowup/)
  assert.match(alignment, /lumen_s2_resolve_cultivation_context/i)
  assert.match(alignment, /cultivation-context\.v53\.1/i)
})

test('A60 Path can carry an optional cultivation intention without becoming a program', async () => {
  const alignment = await read('supabase/migrations/20260912170528_a60_final_contract_alignment.sql')
  assert.match(alignment, /p_cultivation_move text default null/i)
  assert.match(alignment, /insert into gf_core\.path_items\(path_id,person_id,help_id,label,position,cultivation_move\)/i)
  assert.match(alignment, /s2\.v53\.1/i)
  assert.doesNotMatch(alignment, /curriculum|streak|progress_score/i)
})

test('A60 cultivation context is minimized and does not duplicate intimate memory', async () => {
  const alignment = await read('supabase/migrations/20260912170528_a60_final_contract_alignment.sql')
  assert.match(alignment, /ResolveCultivationContext is a minimized longitudinal projection/i)
  assert.match(alignment, /personal_repertoire/i)
  assert.match(alignment, /trajectories/i)
  assert.match(alignment, /outcomes_feedback/i)
  assert.match(alignment, /followups/i)
  assert.doesNotMatch(alignment, /from gf_private\.sanctuary_entries/i)
  assert.doesNotMatch(alignment, /moment_originals/i)
})

test('A60 certification remains bound to V51 V52 V53 after current POV advances', async () => {
  const context = JSON.parse(await read('governance/conduction-context.json'))
  const manifest = JSON.parse(await read('governance/canonical-integrity-contracts.json'))
  assert.equal(manifest.certification_act, 'A60')
  assert.equal(manifest.certification_status, 'CERTIFIED')
  assert.deepEqual(manifest.authority_set.filter((id) => ['V51','V52','V53'].includes(id)), ['V51','V52','V53'])
  assert.deepEqual(context.authorities.filter((x) => ['V51','V52','V53'].includes(x.id)).map((x) => x.id), ['V51','V52','V53'])
  assert.match(context.construction_rule, /tabla Constelación/i)
  assert.match(context.construction_rule, /scores/i)
})
