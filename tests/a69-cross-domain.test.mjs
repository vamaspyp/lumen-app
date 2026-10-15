import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const p=spawnSync(process.execPath,['scripts/check-a69-cross-domain.mjs'],{encoding:'utf8'});
test('cross-domain governance checker succeeds with unverified truthful inventories',()=>{assert.equal(p.status,0,p.stderr);assert.match(p.stdout,/NOT CERTIFIED/);});
