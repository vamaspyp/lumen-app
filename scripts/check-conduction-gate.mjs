import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = (path) => fs.readFileSync(path, 'utf8');
const json = (path) => JSON.parse(read(path));
const fail = (message) => {
  console.error(`CONDUCTION_GATE_FAIL: ${message}`);
  process.exit(1);
};

const context = json('governance/conduction-context.json');
const snapshot = json('governance/pov-snapshot.json');
const integrity = json('governance/canonical-integrity-contracts.json');
const gate = read('governance/CONDUCTION_GATE.md');

if (context.fail_closed !== true) fail('context must be fail-closed');
if (snapshot.integrity?.fail_closed !== true) fail('POV snapshot must be fail-closed');
if (snapshot.source?.system_id !== 'V3') fail('snapshot must derive from Sistema de Conducción V3');
if (snapshot.source?.spreadsheet_id !== context.system?.spreadsheet_id) fail('snapshot/context spreadsheet mismatch');
if (snapshot.focus?.status !== 'ACTIVO') fail(`focus ${snapshot.focus?.id ?? '?'} is not ACTIVO`);
if (snapshot.act?.status !== 'EN CURSO') fail(`act ${snapshot.act?.id ?? '?'} is not EN CURSO`);
if (snapshot.focus?.id !== context.focus?.id) fail('focus mismatch between live-verified snapshot and context');
if (snapshot.act?.id !== context.act?.id) fail('act mismatch between live-verified snapshot and context');
if (!snapshot.act?.dod) fail('ACTO DoD missing from POV snapshot');

const activeAuthorities = new Set(
  (snapshot.active_authorities ?? [])
    .filter((x) => x.state === 'VIGENTE')
    .map((x) => x.id)
);
for (const authority of context.authorities ?? []) {
  if (!activeAuthorities.has(authority.id)) fail(`authority ${authority.id} is not VIGENTE in POV snapshot`);
}
for (const required of ['V3', 'V41', 'V42']) {
  if (!activeAuthorities.has(required)) fail(`required authority ${required} missing or not VIGENTE`);
}

const verifiedAt = Date.parse(snapshot.source?.verified_at ?? '');
if (!Number.isFinite(verifiedAt)) fail('POV snapshot verified_at is invalid');
const maxAgeHours = snapshot.integrity?.snapshot_max_age_hours ?? 72;
const ageHours = (Date.now() - verifiedAt) / 3_600_000;
if (ageHours < -1) fail('POV snapshot is timestamped in the future');
if (ageHours > maxAgeHours) fail(`POV snapshot is stale (${ageHours.toFixed(1)}h > ${maxAgeHours}h); refresh from live POV before material change`);

if (!/Fail closed/i.test(gate)) fail('canonical gate no longer declares fail-closed behavior');
if (!/POV\/ACTIVOS → FOCO → ACTO\/DoD/i.test(gate)) fail('canonical sequence missing');

for (const path of ['AGENTS.md', 'CLAUDE.md', '.github/copilot-instructions.md']) {
  const text = read(path);
  if (!/CONDUCTION_GATE\.md/i.test(text)) fail(`${path} does not inherit Conduction Gate`);
  if (!/conduction-context\.json/i.test(text)) fail(`${path} does not require conduction context`);
  if (!/FAIL CLOSED/i.test(text)) fail(`${path} does not declare fail-closed behavior`);
}

// A44: accumulated no-loss gate. Local ACTO completion is never enough if a
// birth-critical canonical contract remains unresolved. During the certification
// ACTO itself, unresolved contracts are allowed so they can be repaired or
// escalated. Every other ACTO fails closed until the certification is clean.
if (integrity.scope !== 'embryo_birth') fail('canonical integrity scope must be embryo_birth');
if (!Array.isArray(integrity.authority_set) || integrity.authority_set.length === 0) fail('canonical integrity authority_set missing');
for (const authorityId of integrity.authority_set) {
  if (!activeAuthorities.has(authorityId)) fail(`canonical integrity authority ${authorityId} is not VIGENTE`);
}

const allowedContractStates = new Set([
  'CONFORME',
  'EXPRESION_EMBRIONARIA_ACEPTABLE',
  'GAP_REAL',
  'DECISION_DE_AUTORIDAD_PENDIENTE',
]);
for (const contract of integrity.contracts ?? []) {
  if (!contract.id) fail('canonical integrity contract without id');
  if (!allowedContractStates.has(contract.status)) fail(`canonical integrity contract ${contract.id} has invalid status ${contract.status}`);
  if (!Array.isArray(contract.authority) || contract.authority.length === 0) fail(`canonical integrity contract ${contract.id} has no authority`);
  for (const authorityId of contract.authority) {
    if (!activeAuthorities.has(authorityId)) fail(`contract ${contract.id} cites non-vigente authority ${authorityId}`);
  }
}

const blockingContracts = (integrity.contracts ?? []).filter(
  (contract) => contract.birth_required === true &&
    ['GAP_REAL', 'DECISION_DE_AUTORIDAD_PENDIENTE'].includes(contract.status)
);
const certificationAct = String(integrity.certification_act ?? '');
const currentAct = String(context.act?.id ?? '');
if (!certificationAct) fail('canonical integrity certification_act missing');
if (blockingContracts.length > 0 && currentAct !== certificationAct) {
  fail(`birth-critical canonical integrity blockers remain: ${blockingContracts.map((c) => c.id).join(', ')}`);
}
if (integrity.certification_status === 'CERTIFIED' && blockingContracts.length > 0) {
  fail('canonical integrity cannot be CERTIFIED while birth-critical blockers remain');
}
if (currentAct !== certificationAct && integrity.certification_status !== 'CERTIFIED') {
  fail(`canonical integrity must be CERTIFIED before leaving ${certificationAct}`);
}

if (process.env.GITHUB_EVENT_NAME === 'push') {
  const message = execFileSync('git', ['log', '-1', '--pretty=%B'], { encoding: 'utf8' });
  const actId = String(context.act?.id ?? '').toUpperCase();
  if (!actId || !new RegExp(`\\b${actId}\\b`).test(message.toUpperCase())) {
    fail(`push commit must identify ${actId || 'current ACTO'} from live-verified conduction context`);
  }
}

console.log(`CONDUCTION_GATE_PASS focus=${context.focus.id} act=${context.act.id} authorities=${[...activeAuthorities].join(',')} integrity_blockers=${blockingContracts.length} snapshot_age_h=${ageHours.toFixed(2)}`);
