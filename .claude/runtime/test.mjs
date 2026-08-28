import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const runtime = new URL('./run.mjs', import.meta.url).pathname;
const fixture = new URL('../work/A1.json', import.meta.url).pathname;

const prepared = JSON.parse(execFileSync(process.execPath, [runtime, 'prepare', fixture], { encoding: 'utf8' }));
assert.equal(prepared.status, 'READY');
assert.equal(prepared.actor, 'chatgpt-conductor-alternate');
assert.equal(prepared.routing.evaluated.find(x => x.id === 'claude-code').reason, 'unavailable');

const blockedPkg = JSON.parse(fs.readFileSync(fixture, 'utf8'));
for (const candidate of blockedPkg.candidates) candidate.available = false;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumen-runtime-'));
const blockedPath = path.join(dir, 'blocked.json');
fs.writeFileSync(blockedPath, JSON.stringify(blockedPkg));
const blocked = spawnSync(process.execPath, [runtime, 'prepare', blockedPath], { encoding: 'utf8' });
assert.equal(blocked.status, 2);
assert.equal(JSON.parse(blocked.stdout).status, 'BLOQUEADO');

const unauthorized = JSON.parse(fs.readFileSync(fixture, 'utf8'));
unauthorized.requested_actions.push({
  id: 'prod-write', target: 'production:write', reversible: false,
  destructive: false, touches_secrets: false, production: true, irreversible: true,
  explicit_authorization: false
});
const unauthorizedPath = path.join(dir, 'unauthorized.json');
fs.writeFileSync(unauthorizedPath, JSON.stringify(unauthorized));
const rejected = spawnSync(process.execPath, [runtime, 'prepare', unauthorizedPath], { encoding: 'utf8' });
assert.equal(rejected.status, 1);
assert.match(rejected.stderr, /requiere autorización explícita/);

console.log('runtime tests: PASS');
