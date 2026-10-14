import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const original=JSON.parse(readFileSync('governance/a69-a63-conformity.json','utf8'));
const check = (change, env={}) => {
 const dir=mkdtempSync(join(tmpdir(),'a69-'));
 const file=join(dir,'contract.json');
 try {
  const copy=structuredClone(original);change(copy);
  writeFileSync(file,JSON.stringify(copy));
  const r=spawnSync(process.execPath,['scripts/check-conformity.mjs'],{env:{...process.env,CONFORMITY_FILE:file,...env},encoding:'utf8'});
  return {ok:r.status===0,message:r.stderr};
 } finally {rmSync(dir,{recursive:true,force:true});}
};
test('honest inventory is accepted without certification',()=>assert.equal(check(()=>{}).ok,true));
test('missing requirement blocks',()=>assert.equal(check(c=>c.requirements.splice(0,1)).ok,false));
test('false PASS blocks',()=>assert.equal(check(c=>{c.requirements[0].status='PASS'}).ok,false));
test('false CERTIFIED blocks',()=>assert.equal(check(c=>{c.certification='CERTIFIED'}).ok,false));
test('release request blocks unresolved contract',()=>assert.equal(check(()=>{},{REQUIRE_CONFORMITY_PASS:'true'}).ok,false));
