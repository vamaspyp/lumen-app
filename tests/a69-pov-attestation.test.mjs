import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {verifyPushAttestation} from '../scripts/check-pov-attestation.mjs';
const sha='a'.repeat(40),repo='vamaspyp/lumen-app',branch='acto/A69-conformidad-ejecutable';
async function run(change){
 const state={run:{id:1,event:'push',head_sha:sha,head_branch:branch,path:'.github/workflows/ci.yml',repository:{full_name:repo}},job:{name:'Conformity Gate',status:'completed',conclusion:'success'},artifact:{id:2,name:'a69-conformity-report',expired:false,workflow_run:{head_sha:sha}},proof:{status:'PASS',target_sha:sha,act_id:'A69',focus_id:'F6',verified_at:new Date().toISOString()}};change?.(state);
 const zip=spawnSync('python3',['-c',"import io,zipfile,sys; b=io.BytesIO(); z=zipfile.ZipFile(b,'w'); z.writestr('a69-live-pov.json',sys.stdin.read()); z.close(); sys.stdout.buffer.write(b.getvalue())"],{input:JSON.stringify(state.proof)}).stdout;
 const fetcher=async url=>({ok:true,json:async()=>url.includes('/jobs')?{jobs:[state.job]}:url.includes('/artifacts')?{artifacts:[state.artifact]}:{workflow_runs:[state.run]},arrayBuffer:async()=>zip});
 return verifyPushAttestation({repo,sourceRepo:repo,sha,branch,token:'fixture-token',fetcher,pause:async()=>{},attempts:1});
}
test('PR accepts authenticated same-SHA successful trusted push artifact (HTTP fixture)',async()=>assert.equal((await run()).attestation_source,'trusted_push_artifact'));
for(const [name,change] of [['foreign SHA',s=>s.proof.target_sha='b'.repeat(40)],['failed gate',s=>s.job.conclusion='failure'],['expired artifact',s=>s.artifact.expired=true],['stale probe',s=>s.proof.verified_at='2000-01-01'],['foreign repository',s=>s.run.repository.full_name='other/repo'],['PR event cannot attest',s=>s.run.event='pull_request']])test('attestation rejects '+name,async()=>assert.rejects(run(change)));
test('fork source is rejected before any API call',async()=>assert.rejects(verifyPushAttestation({repo,sourceRepo:'fork/repo',sha,branch,token:'fixture-token'}),/untrusted source/));
