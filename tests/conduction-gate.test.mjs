import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = (path) => fs.readFileSync(path, 'utf8');
const context = JSON.parse(read('governance/conduction-context.json'));

test('conduction context is explicit and fail-closed', () => {
  assert.equal(context.schema_version, '1.0');
  assert.equal(context.system?.id, 'V3');
  assert.ok(context.system?.spreadsheet_id);
  assert.match(context.focus?.id ?? '', /^F\d+$/);
  assert.match(context.act?.id ?? '', /^A\d+$/);
  assert.equal(context.act?.status, 'EN CURSO');
  assert.equal(context.fail_closed, true);
  const authorityIds = new Set((context.authorities ?? []).map((x) => x.id));
  assert.ok(authorityIds.has('V41'));
  assert.ok(authorityIds.has('V42'));
  assert.deepEqual(context.required_sequence, [
    'POV_ACTIVOS', 'FOCO', 'ACTO_DOD', 'AUTORIDAD_VIGENTE',
    'REALIDAD_TECNICA', 'EJECUCION', 'EVIDENCIA', 'CIERRE'
  ]);
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

test('push commit identifies the same ACTO as conduction context', () => {
  if (process.env.GITHUB_EVENT_NAME !== 'push') return;
  const message = execFileSync('git', ['log', '-1', '--pretty=%B'], { encoding: 'utf8' });
  assert.match(
    message.toUpperCase(),
    new RegExp(`\\b${context.act.id.toUpperCase()}\\b`),
    `push commit must identify ${context.act.id}; update conduction-context.json from the live POV before changing ACTO`
  );
});
