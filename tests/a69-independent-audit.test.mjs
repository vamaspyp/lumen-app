import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,copyFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
const source=['governance/a69-a63-conformity.json','governance/conduction-context.json','governance/pov-snapshot.json','scripts/check-independent-audit.mjs'];
function run(mutate){
 const root=mkdtempSync(join(tmpdir(),'a69-audit-'));
 try{
  for(const f of source){const dest=join(root,f);mkdirSync(dirname(dest),{recursive:true});copyFileSync(f,dest)}
  const path=join(root,source[0]),c=JSON.parse(readFileSync(path,'utf8'));mutate(c);writeFileSync(path,JSON.stringify(c));
  return spawnSync(process.execPath,['scripts/check-independent-audit.mjs'],{cwd:root}).status===0;
 }finally{rmSync(root,{recursive:true,force:true})}
}
test('unverified inventory is never interpreted as certified',()=>assert.equal(run(()=>{}),true));
test('independent auditor rejects false certification',()=>assert.equal(run(c=>c.certification='CERTIFIED'),false));
test('independent auditor rejects self-approved PASS',()=>assert.equal(run(c=>{const r=c.requirements[0];r.status='PASS';r.tests=['x'];r.evidence=['x'];r.implementation=['x'];r.review={reviewer:'agent',builder:'agent',decision:'APPROVED'}}),false));

test('rejects machine-only certification without human release authorization',()=>assert.equal(run(c=>{c.certification='CERTIFIED';c.release_authorization={actor_type:'agent'}}),false));
