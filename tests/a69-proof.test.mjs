import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';
// Controlled proof fixture validates the mechanism, never the LUMEN product.
function check(mutate){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'a69-proof-'));const sha='b'.repeat(40);
 try{
  fs.mkdirSync(path.join(root,'scripts'));fs.mkdirSync(path.join(root,'tests'));
  fs.copyFileSync('scripts/conformity-proof.mjs',path.join(root,'scripts/conformity-proof.mjs'));
  const write=(p,c)=>fs.writeFileSync(path.join(root,p),c);
  write('design.json','{"contract":"fixture"}');write('implementation.json','{"persist":true,"sanctuary":true,"lumi":true,"navigation":true,"visual":"approved","rights":true}');
  write('tests/fixture.test.mjs',`import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';test('required behavior',()=>{const c=JSON.parse(fs.readFileSync('implementation.json'));for(const k of ['persist','sanctuary','lumi','navigation','rights'])assert.equal(c[k],true,k);assert.equal(c.visual,'approved')});`);
  const r={id:'FIXTURE-01',acceptance_criteria:['fixture behavior'],design:['design.json'],implementation:['implementation.json'],tests:['tests/fixture.test.mjs'],test_cases:['required behavior'],evidence:[{path:'proof.json',sha}],review:{record_path:'review.json',reviewer:'independent',builder:'builder',decision:'APPROVED',reviewer_type:'agent'}};
  const proof={target_sha:sha,requirement_id:r.id,status:'PASS',criteria:r.acceptance_criteria,file_hashes:{},test_results:[{path:r.tests[0],exit_code:0,target_sha:sha}]};
  const review={target_sha:sha,requirement_id:r.id,reviewer:'independent',builder:'builder',decision:'APPROVED',reviewer_type:'agent',execution_id:'fixture-audit'};
  const model=JSON.parse(fs.readFileSync(path.join(root,'implementation.json')));mutate?.({r,proof,review,model,write});write('implementation.json',JSON.stringify(model));
  for(const p of [...r.design,...r.implementation,...r.tests])if(fs.existsSync(path.join(root,p)))proof.file_hashes[p]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
  write('proof.json',JSON.stringify(proof));write('review.json',JSON.stringify(review));write('contract.json',JSON.stringify(r));
  write('run.mjs',`import fs from 'node:fs';import {validatePass} from './scripts/conformity-proof.mjs';validatePass(JSON.parse(fs.readFileSync('contract.json')),'${sha}');`);
  return spawnSync(process.execPath,['run.mjs'],{cwd:root,encoding:'utf8'}).status===0;
 }finally{fs.rmSync(root,{recursive:true,force:true})}
}
test('successful executed proof is accepted for fixture only',()=>assert.equal(check(),true));
for(const key of ['persist','sanctuary','lumi','navigation','rights'])test('seeded missing '+key+' rejected despite refreshed hashes and forged success',()=>assert.equal(check(({model})=>{model[key]=false}),false));
test('seeded visual mismatch rejected',()=>assert.equal(check(({model})=>{model.visual='different'}),false));
test('uncovered acceptance criterion rejected',()=>assert.equal(check(({proof})=>{proof.criteria=[]}),false));
test('foreign execution SHA rejected',()=>assert.equal(check(({proof})=>{proof.test_results[0].target_sha='a'.repeat(40)}),false));
test('review of another requirement rejected',()=>assert.equal(check(({review})=>{review.requirement_id='other'}),false));
test('deleted test rejected',()=>assert.equal(check(({r})=>{r.tests=['tests/missing.test.mjs']}),false));

test('zero actual tests cannot prove PASS',()=>assert.equal(check(({write})=>write('tests/fixture.test.mjs','// empty file')),false));
test('skipped test cannot prove PASS',()=>assert.equal(check(({write})=>write('tests/fixture.test.mjs',"import test from 'node:test';test.skip('skipped',()=>{});")),false));
test('TODO test cannot prove PASS',()=>assert.equal(check(({write})=>write('tests/fixture.test.mjs',"import test from 'node:test';test.todo('pending');")),false));
