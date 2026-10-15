import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

function transition(change=()=>{}) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'governed-transition-'));
 try {
  fs.cpSync('scripts',path.join(dir,'scripts'),{recursive:true});
  fs.cpSync('governance',path.join(dir,'governance'),{recursive:true});
  const files=['conduction-context.json','pov-snapshot.json','a69-a63-conformity.json','a69-source-premium-pilot.json'];
  const docs=Object.fromEntries(files.map(name=>[name,JSON.parse(fs.readFileSync(path.join(dir,'governance',name)))]));
  for(const name of files) {const d=docs[name];if(d.act)d.act.id='A70';else d.act_id='A70';}
  change(docs);
  for(const [name,d] of Object.entries(docs))fs.writeFileSync(path.join(dir,'governance',name),JSON.stringify(d));
  return ['check-conformity.mjs','check-independent-audit.mjs','check-premium-pilot.mjs','check-a69-cross-domain.mjs'].map(script=>spawnSync(process.execPath,['scripts/'+script],{cwd:dir,encoding:'utf8',env:{...process.env,CONFORMITY_FILE:'',PREMIUM_CONTRACT_FILE:''}}));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('governed next ACTO preserves both inventories and passes all four validators',()=>{
 for(const r of transition())assert.equal(r.status,0,r.stderr);
});
test('obsolete contract ACTO is rejected after execution transitions',()=>{
 const results=transition(d=>d['a69-a63-conformity.json'].act_id='A69');
 assert.notEqual(results[0].status,0);assert.notEqual(results[1].status,0);assert.notEqual(results[3].status,0);
});
test('transition cannot discard inherited requirement coverage',()=>{
 const results=transition(d=>d['a69-a63-conformity.json'].requirements.pop());
 assert.notEqual(results[0].status,0);assert.notEqual(results[1].status,0);assert.notEqual(results[3].status,0);
});
test('transition cannot retain a superseded requirement authority',()=>{
 const results=transition(d=>d['pov-snapshot.json'].active_authorities=d['pov-snapshot.json'].active_authorities.filter(x=>x.id!=='V58'));
 assert.notEqual(results[0].status,0);assert.notEqual(results[1].status,0);assert.notEqual(results[3].status,0);
});
