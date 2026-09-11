import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = (path) => fs.readFileSync(path, 'utf8');
const context = JSON.parse(read('governance/conduction-context.json'));
const snapshot = JSON.parse(read('governance/pov-snapshot.json'));

test('conduction context is explicit and fail-closed', () => {
  assert.equal(context.schema_version, '1.1');
  assert.equal(context.system?.id, 'V3');
  assert.ok(context.system?.spreadsheet_id);
  assert.match(context.focus?.id ?? '', /^F\d+$/);
  assert.match(context.act?.id ?? '', /^A\d+$/);
  assert.equal(context.act?.status, 'EN CURSO');
  assert.equal(context.fail_closed, true);
  const authorityIds = new Set((context.authorities ?? []).map((x) => x.id));
  for (const required of ['V46', 'V48', 'V49', 'V41', 'V42']) assert.ok(authorityIds.has(required));
  assert.match(context.construction_rule ?? '', /runtime.*preserva.*ajusta.*reemplaza/i);
  assert.match(context.construction_rule ?? '', /bridges permanentes/i);
  assert.deepEqual(context.required_sequence, [
    'POV_ACTIVOS', 'FOCO', 'ACTO_DOD', 'AUTORIDAD_VIGENTE',
    'REALIDAD_TECNICA', 'EJECUCION', 'EVIDENCIA', 'CIERRE'
  ]);
});

test('POV snapshot and execution context agree', () => {
  assert.equal(snapshot.source?.system_id, 'V3');
  assert.equal(snapshot.source?.spreadsheet_id, context.system?.spreadsheet_id);
  assert.equal(snapshot.focus?.id, context.focus?.id);
  assert.equal(snapshot.focus?.status, 'ACTIVO');
  assert.equal(snapshot.act?.id, context.act?.id);
  assert.equal(snapshot.act?.status, 'EN CURSO');
  assert.ok(snapshot.act?.dod);
  assert.equal(snapshot.integrity?.fail_closed, true);
  assert.equal(snapshot.integrity?.implementation_is_not_authority, true);
  assert.equal(snapshot.integrity?.target_precedes_runtime_diff, true);
  assert.equal(snapshot.integrity?.permanent_bridges_forbidden, true);
  const active = new Set((snapshot.active_authorities ?? []).filter((x) => x.state === 'VIGENTE').map((x) => x.id));
  for (const authority of context.authorities ?? []) assert.ok(active.has(authority.id), `${authority.id} must be VIGENTE in POV snapshot`);
});

test('official agent entrypoints inherit the conduction gate', () => {
  for (const path of ['AGENTS.md', 'CLAUDE.md', '.github/copilot-instructions.md']) {
    const text = read(path);
    assert.match(text, /CONDUCTION_GATE\.md/i, `${path} must point to the gate`);
    assert.match(text, /FAIL CLOSED/i, `${path} must be fail-closed`);
    assert.match(text, /conduction-context\.json/i, `${path} must require current context`);
  }
});

test('gate forbids memory/history/implementation from becoming authority', () => {
  const gate = read('governance/CONDUCTION_GATE.md');
  assert.match(gate, /POV\/ACTIVOS → FOCO → ACTO\/DoD/i);
  assert.match(gate, /fuente histórica/i);
  assert.match(gate, /implementación tampoco es autoridad/i);
  assert.match(gate, /Fail closed/i);
});

test('governance enforcement surfaces have human custody', () => {
  const owners = read('.github/CODEOWNERS');
  for (const target of [
    '/governance/', '/.github/workflows/', '/scripts/check-conduction-gate.mjs',
    '/tests/conduction-gate.test.mjs', '/AGENTS.md', '/CLAUDE.md'
  ]) assert.match(owners, new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(owners, /@vamaspyp/);

  const workflow = read('.github/workflows/ci.yml');
  assert.match(workflow, /conduction-gate:/);
  assert.match(workflow, /node scripts\/check-conduction-gate\.mjs/);
  assert.match(workflow, /needs: conduction-gate/);
});

test('standalone conduction gate check passes', () => {
  execFileSync(process.execPath, ['scripts/check-conduction-gate.mjs'], {
    stdio: 'pipe',
    env: { ...process.env, GITHUB_EVENT_NAME: '' }
  });
});

test('push commit identifies the same ACTO as conduction context', () => {
  if (process.env.GITHUB_EVENT_NAME !== 'push') return;
  const message = execFileSync('git', ['log', '-1', '--pretty=%B'], { encoding: 'utf8' });
  assert.match(
    message.toUpperCase(),
    new RegExp(`\\b${context.act.id.toUpperCase()}\\b`),
    `push commit must identify ${context.act.id}; update conduction-context.json from the live POV before changing ACTO`
  );
});
