// A69 shared proof validation. Repository assertions are not runtime evidence.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
const digest = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const reject = m => { throw Error('PROOF_BLOCK: '+m); };
const file = p => {
 if(typeof p !== 'string' || path.isAbsolute(p) || p.split(/[\\/]/).includes('..') || !fs.existsSync(p) || !fs.statSync(p).isFile()) reject('invalid repository file '+p);
 return p;
};
export function validatePass(r, target) {
 if(!/^[a-f0-9]{40}$/.test(target||'')) reject('exact target SHA required '+r.id);
 for(const field of ['acceptance_criteria','design','implementation','tests','test_cases','evidence']) {
  if(!Array.isArray(r[field]) || !r[field].length) reject('missing '+field+' '+r.id);
 }
 if(r.acceptance_criteria.some(x=>typeof x!=='string'||!x.trim()) || new Set(r.acceptance_criteria).size!==r.acceptance_criteria.length) reject('invalid acceptance criteria '+r.id);
 for(const p of [...r.design,...r.implementation]) file(p);
 for(const p of r.tests) {
  file(p);
  if(!/^tests\/.*\.(test|spec)\.mjs$/.test(p)) reject('not an executable test '+p);
 }
 const review=r.review;
 if(!review?.reviewer || !review.builder || review.reviewer===review.builder || review.decision!=='APPROVED' || !['human','agent'].includes(review.reviewer_type)) reject('independent review missing '+r.id);
 const reviewRecord=JSON.parse(fs.readFileSync(file(review.record_path),'utf8'));
 if(reviewRecord.target_sha!==target || reviewRecord.requirement_id!==r.id || reviewRecord.reviewer!==review.reviewer || reviewRecord.builder!==review.builder || reviewRecord.decision!=='APPROVED' || reviewRecord.reviewer_type!==review.reviewer_type) reject('review not bound to requirement/SHA '+r.id);
 if(review.reviewer_type==='agent' && !reviewRecord.execution_id) reject('audit execution missing '+r.id);
 if(review.reviewer_type==='human' && !/^https:\/\//.test(reviewRecord.approval_url||'')) reject('human approval reference missing '+r.id);
 const covered=new Set();
 for(const e of r.evidence) {
  if(e.sha!==target) reject('foreign SHA '+r.id);
  const proof=JSON.parse(fs.readFileSync(file(e.path),'utf8'));
  if(proof.target_sha!==target || proof.requirement_id!==r.id || proof.status!=='PASS' || !Array.isArray(proof.criteria)) reject('unrelated or unsuccessful evidence '+r.id);
  for(const criterion of proof.criteria) { if(!r.acceptance_criteria.includes(criterion)) reject('unknown criterion '+r.id);covered.add(criterion); }
  for(const p of [...r.design,...r.implementation,...r.tests]) if(proof.file_hashes?.[p]!==digest(p)) reject('stale/unbound file '+p);
  if(!Array.isArray(proof.test_results)) reject('test execution absent '+r.id);
  for(const p of r.tests) if(!proof.test_results.some(x=>x.path===p&&x.exit_code===0&&x.target_sha===target)) reject('test not successful on target '+p);
 }
 if(r.acceptance_criteria.some(x=>!covered.has(x))) reject('unproven criterion '+r.id);
 if(r.test_cases.some(x=>typeof x!=='string'||!x.trim()) || new Set(r.test_cases).size!==r.test_cases.length) reject('invalid named test cases '+r.id);
 // Re-run the declared tests rather than accepting a hand-authored success flag.
 const env={...process.env};delete env.NODE_TEST_CONTEXT;
 const result=spawnSync(process.execPath,['--test','--test-reporter=tap',...r.tests],{env,encoding:'utf8',timeout:120000,maxBuffer:1024*1024});
 if(result.status!==0) reject('declared tests fail '+r.id);
 for(const name of r.test_cases) if(!result.stdout.split('\n').some(line=>line.trim()==='# Subtest: '+name)) reject('declared test case not executed '+name);
 const count=name=>{const match=result.stdout.match(new RegExp('^# '+name+' ([0-9]+)$','m'));return match?Number(match[1]):null};
 if(!(count('tests')>0&&count('pass')>0&&count('fail')===0&&count('cancelled')===0&&count('skipped')===0&&count('todo')===0)) reject('tests absent or not executed '+r.id);
}
export function validateInventory(c, expected, active, target) {
 if(!['IN_PROGRESS','CERTIFIED'].includes(c.certification) || !Array.isArray(c.requirements)) reject('invalid contract');
 const ids=new Set();
 for(const r of c.requirements) {
  if(ids.has(r.id)||!expected.includes(r.id)) reject('duplicate/unexpected requirement '+r.id);ids.add(r.id);
  if(!active.has(r.authority)||!r.source_section||typeof r.requirement_text!=='string'||r.requirement_text.length<30||!/^https:\/\//.test(r.source_url||'')||!['PASS','GAP','CONTRADICCION','NO_VERIFICADO'].includes(r.status)) reject('invalid authority/source/status '+r.id);
  if(r.status==='PASS') validatePass(r,target);
 }
 if(ids.size!==expected.length) reject('incomplete inventory');
 if(c.certification==='CERTIFIED' && c.requirements.some(r=>r.status!=='PASS')) reject('unresolved certification');
}
