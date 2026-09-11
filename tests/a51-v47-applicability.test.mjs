import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const migration = read('supabase/migrations/20260911153000_a51_v47_applicability_delta.sql')
const lock = read('supabase/migrations/20260911153200_a51_lock_internal_core.sql')
const epistemic = read('supabase/migrations/20260911153500_a51_v47_epistemic_names.sql')
const client = read('src/greenfield/application/s1.ts')
const manifest = JSON.parse(read('governance/canonical-integrity-contracts.json'))

test('V47 uses existing coverage as Possibility × Area × Capacity applicability', () => {
  assert.match(migration, /alter table gf_core\.coverage_cells/i)
  assert.match(migration, /area_key text/i)
  assert.match(migration, /capacity_key text/i)
  assert.match(migration, /applicability_confidence/i)
  assert.match(migration, /evidence_count/i)
  assert.match(migration, /v47\.taxonomy\.v1/i)
  assert.doesNotMatch(migration, /create table[^;]+help_applicability/i)
})

test('legacy intent/need remains a bridge, not the primary decision contract', () => {
  assert.match(migration, /v47_orientation_bridge/i)
  assert.match(migration, /decision\.v4/i)
  assert.match(migration, /coverage\.v4/i)
  assert.match(migration, /area_capacity_applicability_match/i)
  assert.match(migration, /legacy_intent_key/i)
  assert.match(migration, /legacy_need_keys/i)
})

test('delivery is a pattern, not a new entity', () => {
  assert.match(migration, /prepare_possibility_integrate/i)
  assert.match(client, /delivery\?:/)
  assert.doesNotMatch(migration, /create table[^;]+gesto/i)
  assert.doesNotMatch(migration, /create table[^;]+unidad_de_acompanamiento/i)
  assert.doesNotMatch(migration, /create table[^;]+sobre/i)
})

test('raw expression custody cannot be bypassed by the internal V47 core', () => {
  assert.match(client, /lumen_s1_accompany_moment_v4/)
  assert.match(lock, /revoke execute[^;]+v47_orientation_bridge[^;]+authenticated/i)
  assert.match(lock, /revoke execute[^;]+lumen_s1_accompany_moment_v47_core[^;]+authenticated/i)
})

test('knowledge maturity uses K0-K5, distinct from strategic E1-E4', () => {
  assert.match(epistemic, /K0/)
  assert.match(epistemic, /K5/)
  assert.match(epistemic, /knowledge_claims_epistemic_level_check/i)
})

test('canonical integrity now resolves V46/V47 and supersedes V37/V39', () => {
  assert.deepEqual(manifest.authority_set, ['V46', 'V47', 'V40', 'V41', 'V43'])
  assert.equal(manifest.certification_act, 'A51')
  assert.equal(manifest.authority_set.includes('V37'), false)
  assert.equal(manifest.authority_set.includes('V39'), false)
})
