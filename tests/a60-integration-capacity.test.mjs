import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('A60 models constellations as projections, never as a new domain table', async () => {
  const sql = await read('supabase/migrations/20260912144000_a60_integration_capacity_metabolism.sql')
  assert.match(sql, /lumen_source_constellation/i)
  assert.match(sql, /cultivation_roles/i)
  assert.doesNotMatch(sql, /create\s+table\s+[^;]*constellation/i)
})

test('A60 never creates personal capability scores or habit tracking', async () => {
  const migrations = [await read('supabase/migrations/20260912144000_a60_integration_capacity_metabolism.sql'),await read('supabase/migrations/20260912145000_a60_constellation_diversity.sql'),await read('supabase/migrations/20260912150000_a60_continuity_snapshots.sql')].join('\n')
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
  for (const signal of ['HELPED_NOW','REUSED','REPEATED','VARIED','APPLIED_OTHER_CONTEXT','RECOGNIZED_AS_OWN','NO_REMINDER_NEEDED','STOPPED_HELPING']) assert.match(sql, new RegExp(signal))
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

test('A60 application layer exposes constellation, reuse and longitudinal return contracts', async () => {
  const app = await read('src/greenfield/application/embryo.ts')
  assert.match(app, /discoverConstellation/)
  assert.match(app, /reuseRepertoire/)
  assert.match(app, /recordLongitudinalSignal/)
  assert.match(app, /scheduleCultivationFollowup/)
})

test('A60 governed context points to V51 V52 V53 and forbids inflated anatomy', async () => {
  const context = JSON.parse(await read('governance/conduction-context.json'))
  assert.equal(context.act.id, 'A60')
  assert.deepEqual(context.authorities.filter((x) => ['V51','V52','V53'].includes(x.id)).map((x) => x.id), ['V51','V52','V53'])
  assert.match(context.construction_rule, /tabla Constelación/i)
  assert.match(context.construction_rule, /scores/i)
})
