import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const manifest = JSON.parse(fs.readFileSync('governance/canonical-integrity-contracts.json', 'utf8'))
const gate = fs.readFileSync('scripts/check-conduction-gate.mjs', 'utf8')

const allowed = new Set([
  'CONFORME',
  'EXPRESION_EMBRIONARIA_ACEPTABLE',
  'GAP_REAL',
  'DECISION_DE_AUTORIDAD_PENDIENTE',
])

test('A44 canonical integrity manifest is structured and birth-scoped', () => {
  assert.equal(manifest.scope, 'embryo_birth')
  assert.equal(manifest.certification_act, 'A44')
  assert.deepEqual(manifest.authority_set, ['V37', 'V39', 'V40', 'V41', 'V43'])
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

test('A44 cannot claim certification while blockers remain', () => {
  const blockers = manifest.contracts.filter((contract) =>
    contract.birth_required === true &&
    ['GAP_REAL', 'DECISION_DE_AUTORIDAD_PENDIENTE'].includes(contract.status)
  )
  if (manifest.certification_status === 'CERTIFIED') {
    assert.equal(blockers.length, 0)
  } else {
    assert.equal(manifest.certification_status, 'IN_PROGRESS')
  }
})
