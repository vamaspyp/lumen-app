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

if (process.env.GITHUB_EVENT_NAME === 'push') {
  const message = execFileSync('git', ['log', '-1', '--pretty=%B'], { encoding: 'utf8' });
  const actId = String(context.act?.id ?? '').toUpperCase();
  if (!actId || !new RegExp(`\\b${actId}\\b`).test(message.toUpperCase())) {
    fail(`push commit must identify ${actId || 'current ACTO'} from live-verified conduction context`);
  }
}

console.log(`CONDUCTION_GATE_PASS focus=${context.focus.id} act=${context.act.id} authorities=${[...activeAuthorities].join(',')} snapshot_age_h=${ageHours.toFixed(2)}`);
