import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
const original=JSON.parse(fs.readFileSync('governance/a69-source-premium-pilot.json','utf8'));
function run(fn,env={}){const p=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'premium-')),'pilot.json');try{const c=structuredClone(original);fn(c);fs.writeFileSync(p,JSON.stringify(c));return spawnSync(process.execPath,['scripts/check-premium-pilot.mjs'],{env:{...process.env,PREMIUM_CONTRACT_FILE:p,...env}}).status===0}finally{fs.rmSync(path.dirname(p),{recursive:true,force:true})}}
test('honest premium inventory accepted without certification',()=>assert.equal(run(()=>{}),true));
test('premium false PASS blocked',()=>assert.equal(run(c=>{c.requirements[0].status='PASS'}),false));
test('premium false CERTIFIED blocked',()=>assert.equal(run(c=>{c.certification='CERTIFIED'}),false));
test('premium release blocked while unresolved',()=>assert.equal(run(()=>{},{REQUIRE_CONFORMITY_PASS:'true'}),false));
test('premium missing requirement blocked',()=>assert.equal(run(c=>c.requirements=[]),false));
