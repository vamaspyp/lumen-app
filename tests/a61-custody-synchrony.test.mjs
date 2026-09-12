import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const registry = json('governance/custody-registry.json')
const findings = json('governance/custody-findings.json')
const context = json('governance/conduction-context.json')
const snapshot = json('governance/pov-snapshot.json')

test('V54 custody is subordinate and cannot become parallel authority', () => {
  assert.equal(registry.system_id, 'V54')
  assert.equal(registry.authority_model.creates_authority, false)
  assert.equal(registry.authority_model.mutates_without_act, false)
  assert.equal(registry.authority_model.source_of_truth, 'V3/POV+ACTIVOS')
  assert.equal(context.act.id, 'A61')
  assert.ok(context.authorities.some((x) => x.id === 'V54'))
  assert.ok(snapshot.active_authorities.some((x) => x.id === 'V54' && x.state === 'VIGENTE'))
})

test('custodian topology covers organism and every critical organ without duplicates', () => {
  const ids = registry.custodians.map((x) => x.id)
  assert.deepEqual(ids, ['C0','C1','C2','C3','C4','C5','C6','C7','C8'])
  assert.equal(new Set(ids).size, ids.length)
  for (const custodian of registry.custodians) {
    assert.ok(custodian.scope.length > 0)
    assert.ok(custodian.authorities.length > 0)
    assert.ok(custodian.invariants.length > 0)
    assert.equal(custodian.can_block, true)
    assert.ok(custodian.decision_owner)
  }
})

test('custody evaluates synchrony instead of isolated local quality', () => {
  assert.deepEqual(registry.synchrony_dimensions.map((x) => x.id), ['NORTE','FISIOLOGIA','PERSONA','ORGANISMO','EVOLUCION'])
  const integral = registry.custodians.find((x) => x.id === 'C0')
  assert.ok(integral.invariants.includes('no_local_optimization_harming_whole'))
  assert.ok(integral.invariants.includes('north_alignment'))
  assert.ok(integral.invariants.includes('e1_e4_integrity'))
})

test('source and experience increment has the required cross-organ custodians', () => {
  const review = new Set(registry.review_sets.source_experience_increment)
  for (const id of ['C0','C1','C2','C3','C7','C8']) assert.ok(review.has(id), `missing ${id}`)
  const source = registry.custodians.find((x) => x.id === 'C1')
  assert.ok(source.invariants.includes('quality_over_volume'))
  assert.ok(source.invariants.includes('diversity'))
  assert.ok(source.invariants.includes('capacity_depth'))
  const experience = registry.custodians.find((x) => x.id === 'C2')
  assert.ok(experience.invariants.includes('no_dependency_design'))
})

test('normalized findings support evidence-led escalation and hard blocks', () => {
  assert.deepEqual(registry.normalized_results, ['PASS','GAP','RIESGO','DECISION_HUMANA'])
  assert.deepEqual(registry.severities, ['INFO','WARN','BLOCK'])
  assert.ok(registry.hard_blockers.some((x) => /privacy or safety regression/i.test(x)))
  assert.ok(registry.hard_blockers.some((x) => /ownership duplication/i.test(x)))
  assert.equal(findings.current_review.act_id, 'A61')
})

test('standalone custody gate passes', () => {
  execFileSync(process.execPath, ['scripts/check-custody-gate.mjs'], { stdio: 'pipe' })
})
