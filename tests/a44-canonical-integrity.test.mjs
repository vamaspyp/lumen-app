import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const manifest = JSON.parse(read('governance/canonical-integrity-contracts.json'))
const context = JSON.parse(read('governance/conduction-context.json'))
const gate = read('scripts/check-conduction-gate.mjs')
const s1Client = read('src/greenfield/application/s1.ts')
const embryoClient = read('src/greenfield/application/embryo.ts')
const schemaMigration = read('supabase/migrations/20260911210000_a51_v49_schema_convergence.sql')
const runtimeMigration = read('supabase/migrations/20260911210100_a51_v49_runtime_contracts.sql')

const allowed = new Set(['CONFORME','EXPRESION_EMBRIONARIA_ACEPTABLE','GAP_REAL','DECISION_DE_AUTORIDAD_PENDIENTE'])
const allowedCertificationStates = new Set(['IN_PROGRESS','READY_FOR_FINAL_CHECK','RECONCILING','CERTIFIED'])

test('canonical integrity manifest is structured, current and birth-scoped', () => {
  assert.equal(manifest.scope, 'embryo_birth')
  assert.match(manifest.certification_act, /^A\d+$/)
  if (manifest.certification_status !== 'CERTIFIED') assert.equal(manifest.certification_act, context.act.id, 'an unfinished certification must belong to the current ACTO')
  else assert.notEqual(manifest.certification_act, '', 'a completed certification keeps its historical certification ACTO while POV may advance')
  const currentAuthorities = new Set(context.authorities.map((x) => x.id))
  for (const authority of manifest.authority_set) assert.ok(currentAuthorities.has(authority), `${authority} must be current`)
  for (const superseded of ['V37','V39','V47','V48','V49']) assert.equal(manifest.authority_set.includes(superseded), false)
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
    for (const superseded of ['V37','V39','V47','V48','V49']) assert.equal(contract.authority.includes(superseded), false)
  }
})

test('Conduction Gate still enforces accumulated no-loss integrity', () => {
  assert.match(gate, /canonical-integrity-contracts\.json/)
  assert.match(gate, /blockingContracts/)
  assert.match(gate, /birth-critical canonical integrity blockers remain/)
  assert.match(gate, /certification_status/)
  assert.match(gate, /currentAct !== certificationAct/)
})

test('certification state cannot hide birth-critical blockers', () => {
  const blockers = manifest.contracts.filter((contract) => contract.birth_required === true && ['GAP_REAL','DECISION_DE_AUTORIDAD_PENDIENTE'].includes(contract.status))
  if (['CERTIFIED','READY_FOR_FINAL_CHECK'].includes(manifest.certification_status)) assert.equal(blockers.length, 0)
})

test('S1 has one current public accompaniment contract and no V47 client bridge', () => {
  assert.match(s1Client, /\.rpc\('lumen_s1_accompany_moment'/)
  assert.doesNotMatch(s1Client, /lumen_s1_accompany_moment_v\d|v47_core|intent_key|need_keys/)
  assert.match(s1Client, /taxonomy_version/)
  assert.match(s1Client, /area_keys/)
  assert.match(s1Client, /capacity_keys/)
  assert.match(runtimeMigration, /drop function if exists public\.lumen_s1_accompany_moment_v3/i)
  assert.match(runtimeMigration, /drop function if exists gf_core\.v47_orientation_bridge/i)
})

test('applicability remains separate from coverage', () => {
  assert.match(schemaMigration, /create table if not exists gf_core\.help_applicability/i)
  assert.match(runtimeMigration, /coverage\.eval\.v1/)
  assert.match(runtimeMigration, /drop table if exists gf_core\.coverage_cells/i)
  assert.match(embryoClient, /p_area_key/)
  assert.match(embryoClient, /p_capacity_key/)
  assert.doesNotMatch(embryoClient, /p_need_key|coverage_cells/)
})

test('outcome attribution follows selection and exact help version', () => {
  assert.match(schemaMigration, /help_selections[\s\S]*decision_run_id/i)
  assert.match(schemaMigration, /help_selections[\s\S]*help_version_id/i)
  assert.match(schemaMigration, /outcomes_feedback[\s\S]*selection_id/i)
  assert.match(s1Client, /recordOutcome\([\s\S]*episodeId[\s\S]*effect/)
})
