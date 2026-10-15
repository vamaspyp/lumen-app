import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import {prepareEvidence} from '../scripts/prepare-conformity-evidence.mjs';
// Full positive path is a controlled protocol fixture, never product certification.
const sha=process.env.CONFORMITY_TARGET_SHA||'c'.repeat(40);
function run(mutate){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'a69-bundle-'));
 try{
  for(const dir of ['scripts','governance','tests'])fs.mkdirSync(path.join(root,dir));
  const scripts=['prepare-conformity-evidence','conformity-proof','check-conformity','check-independent-audit','check-premium-pilot','check-a69-cross-domain','report-conformity'];
  for(const name of scripts)fs.copyFileSync('scripts/'+name+'.mjs',path.join(root,'scripts',name+'.mjs'));
  const contracts={a63:'governance/a69-a63-conformity.json',premium:'governance/a69-source-premium-pilot.json'};
  for(const f of [...Object.values(contracts),'governance/conduction-context.json','governance/pov-snapshot.json'])fs.copyFileSync(f,path.join(root,f));
  fs.writeFileSync(path.join(root,'design.json'),'{"scope":"protocol fixture"}');fs.writeFileSync(path.join(root,'model.json'),'{"works":true}');
  fs.writeFileSync(path.join(root,'tests/fixture.test.mjs'),"import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';test('protocol fixture',()=>assert.equal(JSON.parse(fs.readFileSync('model.json')).works,true));");
  const file_hashes=Object.fromEntries(['design.json','model.json','tests/fixture.test.mjs'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')]));
  const bundle={schema_version:1,target_sha:sha,contracts:{},files:{}};
  for(const [domain,p] of Object.entries(contracts)){
   const c=JSON.parse(fs.readFileSync(path.join(root,p)));bundle.contracts[domain]={certification:'CERTIFIED',release_authorization:{human_actor:'fixture-human',approval_url:'https://example.test/fixture-only'},requirements:[]};
   for(const row of c.requirements){
    const id=row.id,proof=id+'-proof.json',review=id+'-review.json';
    bundle.files[proof]={target_sha:sha,requirement_id:id,status:'PASS',criteria:['protocol only'],file_hashes,test_results:[{path:'tests/fixture.test.mjs',exit_code:0,target_sha:sha}]};
    bundle.files[review]={target_sha:sha,requirement_id:id,reviewer:'fixture-auditor',builder:'fixture-builder',reviewer_type:'agent',execution_id:'fixture-execution',decision:'APPROVED'};
    bundle.contracts[domain].requirements.push({id,status:'PASS',acceptance_criteria:['protocol only'],design:['design.json'],implementation:['model.json'],tests:['tests/fixture.test.mjs'],test_cases:['protocol fixture'],evidence:[{path:proof,sha}],review:{record_path:review,reviewer:'fixture-auditor',builder:'fixture-builder',reviewer_type:'agent',execution_id:'fixture-execution',decision:'APPROVED'}});
   }
  }
  mutate?.(bundle,root);
  const file=path.join(root,'bundle.json');fs.writeFileSync(file,JSON.stringify(bundle));
  const prepared=prepareEvidence(file,sha,root);
  const env={...process.env,CONFORMITY_FILE:prepared.a63,PREMIUM_CONTRACT_FILE:prepared.premium,CONFORMITY_TARGET_SHA:sha};delete env.NODE_TEST_CONTEXT;
  const results=scripts.filter(x=>x.startsWith('check-')).map(name=>spawnSync(process.execPath,['scripts/'+name+'.mjs'],{cwd:root,env,encoding:'utf8'}));
  return results.every(r=>r.status===0);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
}
test('post-commit bundle supports all validators and CERTIFIED positive path in isolated protocol fixture',()=>assert.equal(run(),true));
test('foreign bundle SHA blocked',()=>assert.throws(()=>run(b=>{b.target_sha='d'.repeat(40)}),/foreign SHA/));
test('source text cannot be weakened by evidence overlay',()=>assert.throws(()=>run(b=>{b.contracts.a63.requirements[0].requirement_text='weakened'}),/source mutation/));
test('unrelated domain cannot enter overlay',()=>assert.throws(()=>run(b=>{b.contracts.other={}}),/unknown domain/));
test('path traversal receipt blocked',()=>assert.throws(()=>run(b=>{b.files['../escape.json']={}}),/unsafe evidence/));
test('failed implementation still blocks fully populated post-commit bundle',()=>assert.equal(run((b,root)=>fs.writeFileSync(path.join(root,'model.json'),'{"works":false}')),false));
test('no bundle retains honest canonical inventory inputs',()=>assert.deepEqual(prepareEvidence(undefined,sha),{a63:'governance/a69-a63-conformity.json',premium:'governance/a69-source-premium-pilot.json'}));

test('reserved contract filename cannot replace immutable source',()=>assert.throws(()=>run(b=>{b.files['a63.json']={act_id:'FORGED'}}),/reserved contract/));
