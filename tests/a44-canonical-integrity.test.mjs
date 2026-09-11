import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const manifest = JSON.parse(read('governance/canonical-integrity-contracts.json'))
const gate = read('scripts/check-conduction-gate.mjs')
const s1Client = read('src/greenfield/application/s1.ts')
const originalMigration = read('supabase/migrations/20260907123000_a44_preserve_original_expression.sql')
const lifeInferenceMigration = read('supabase/migrations/20260907131500_a44_life_inferences_envelope.sql')

const allowed = new Set([
  'CONFORME',
  'EXPRESION_EMBRIONARIA_ACEPTABLE',
  'GAP_REAL',
  'DECISION_DE_AUTORIDAD_PENDIENTE',
])

const allowedCertificationStates = new Set([
  'IN_PROGRESS',
  'READY_FOR_FINAL_CHECK',
  'CERTIFIED',
])

test('canonical integrity manifest is structured and birth-scoped', () => {
  assert.equal(manifest.scope, 'embryo_birth')
  assert.ok(manifest.certification_act)
  assert.ok(Array.isArray(manifest.authority_set) && manifest.authority_set.length > 0)
  assert.ok(allowedCertificationStates.has(manifest.certification_status))
  assert.ok(Array.isArray(manifest.contracts))
  assert.ok(manifest.contracts.length >= 18)

  const ids = new Set()
  for (const contract of manifest.contracts) {
    assert.ok(contract.id)
    assert.equal(ids.has(contract.id), false, `duplicate contract ${contract.id}`)
    ids.add(contract.id)
    assert.equal(contract.birth_required, true)
    assert.ok(allowed.has(contract.status), `invalid status for ${contract.id}`)
    assert.ok(Array.isArray(contract.authority) && contract.authority.length > 0)
    assert.ok(Array.isArray(contract.evidence) && contract.evidence.length > 0)
  }
})

test('Conduction Gate enforces accumulated no-loss integrity', () => {
  assert.match(gate, /canonical-integrity-contracts\.json/)
  assert.match(gate, /blockingContracts/)
  assert.match(gate, /birth-critical canonical integrity blockers remain/)
  assert.match(gate, /certification_status/)
  assert.match(gate, /currentAct !== certificationAct/)
})

test('certification state cannot hide birth-critical blockers', () => {
  const blockers = manifest.contracts.filter((contract) =>
    contract.birth_required === true &&
    ['GAP_REAL', 'DECISION_DE_AUTORIDAD_PENDIENTE'].includes(contract.status)
  )
  if (['CERTIFIED', 'READY_FOR_FINAL_CHECK'].includes(manifest.certification_status)) assert.equal(blockers.length, 0)
})

test('custody-preserving V4 is the only S1 client entrypoint', () => {
  assert.match(s1Client, /lumen_s1_accompany_moment_v4/)
  assert.doesNotMatch(s1Client, /\.rpc\('lumen_s1_accompany_moment'/)
  assert.doesNotMatch(s1Client, /lumen_s1_accompany_moment_v47_core/)
  assert.match(originalMigration, /gf_private\.moment_originals/)
  assert.match(originalMigration, /original_retention='private_ref'/)
  assert.match(originalMigration, /shared_learning[^\n]*false/i)
  assert.match(originalMigration, /revoke execute on function public\.lumen_s1_accompany_moment\(/i)
})

test('LIFE keeps an open versionable inference envelope instead of a rigid profile', () => {
  assert.match(lifeInferenceMigration, /create table if not exists gf_core\.inferences/i)
  assert.match(lifeInferenceMigration, /inference_kind/i)
  assert.match(lifeInferenceMigration, /confidence/i)
  assert.match(lifeInferenceMigration, /valid_from/i)
  assert.match(lifeInferenceMigration, /valid_to/i)
  assert.match(lifeInferenceMigration, /provenance/i)
})
