import fs from 'node:fs'

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'))
const registry = readJson('governance/custody-registry.json')
const findings = readJson('governance/custody-findings.json')
const context = readJson('governance/conduction-context.json')
const snapshot = readJson('governance/pov-snapshot.json')

const fail = (message) => {
  console.error(`CUSTODY_GATE_FAIL: ${message}`)
  process.exit(1)
}

if (registry.system_id !== 'V54') fail('registry must be owned by V54')
if (registry.mode !== 'lean_fail_closed') fail('custody must remain lean fail-closed')
if (registry.authority_model?.creates_authority !== false) fail('custodians cannot create authority')
if (registry.authority_model?.mutates_without_act !== false) fail('custodians cannot mutate without an ACTO')

const expectedCustodians = ['C0','C1','C2','C3','C4','C5','C6','C7','C8']
const actualCustodians = registry.custodians?.map((x) => x.id) ?? []
if (JSON.stringify(actualCustodians) !== JSON.stringify(expectedCustodians)) fail('custodian topology must be C0..C8 exactly once')

const authorityIds = new Set((context.authorities ?? []).map((x) => x.id))
if (!authorityIds.has('V54')) fail('V54 must be present in governed execution context')
const activeIds = new Set((snapshot.active_authorities ?? []).filter((x) => x.state === 'VIGENTE').map((x) => x.id))
if (!activeIds.has('V54')) fail('V54 must be VIGENTE in POV snapshot')
if (context.act?.id !== snapshot.act?.id) fail('context and POV must agree on current ACTO')
if (context.act?.id !== 'A61') fail('A61 must own custody materialization while this gate is introduced')

for (const custodian of registry.custodians ?? []) {
  if (!Array.isArray(custodian.scope) || custodian.scope.length === 0) fail(`${custodian.id} missing scope`)
  if (!Array.isArray(custodian.authorities) || custodian.authorities.length === 0) fail(`${custodian.id} missing authorities`)
  if (!Array.isArray(custodian.invariants) || custodian.invariants.length === 0) fail(`${custodian.id} missing invariants`)
  if (custodian.can_block !== true) fail(`${custodian.id} must declare blocking capability explicitly`)
  if (!custodian.decision_owner) fail(`${custodian.id} missing decision owner`)
  for (const authority of custodian.authorities) {
    if (!activeIds.has(authority) && authority !== 'V54') fail(`${custodian.id} references non-current authority ${authority}`)
  }
}

const sourceReview = registry.review_sets?.source_experience_increment ?? []
for (const required of ['C0','C1','C2','C3','C7','C8']) {
  if (!sourceReview.includes(required)) fail(`source experience review set missing ${required}`)
}

const validResults = new Set(registry.normalized_results ?? [])
for (const required of ['PASS','GAP','RIESGO','DECISION_HUMANA']) if (!validResults.has(required)) fail(`missing normalized result ${required}`)
const validSeverities = new Set(registry.severities ?? [])
for (const required of ['INFO','WARN','BLOCK']) if (!validSeverities.has(required)) fail(`missing severity ${required}`)

for (const finding of findings.findings ?? []) {
  if (!validResults.has(finding.result)) fail(`finding ${finding.id ?? '?'} has invalid result`)
  if (!validSeverities.has(finding.severity)) fail(`finding ${finding.id ?? '?'} has invalid severity`)
  if (finding.severity === 'BLOCK' && finding.status !== 'RESOLVED' && finding.status !== 'ACCEPTED_BY_HUMAN') {
    fail(`unresolved BLOCK finding ${finding.id ?? '?'}`)
  }
}

console.log(`CUSTODY_GATE_PASS: ${actualCustodians.length} custodians · ACTO ${context.act.id} · no unresolved BLOCK findings`)
