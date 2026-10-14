import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('live POV verifier fails closed without Google credentials',()=>{
 const env={...process.env};
 delete env.POV_GOOGLE_ACCESS_TOKEN;
 const p=spawnSync(process.execPath,['scripts/check-live-pov.mjs'],{env,encoding:'utf8'});
 assert.notEqual(p.status,0);
 assert.match(p.stderr,/LIVE_POV_BLOCK: missing read-only Google credential/);
});
