// Governed PRs consume a successful same-SHA trusted push probe; no wider Google federation.
import fs from 'node:fs';import {spawnSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
const fail=m=>{throw Error('POV_ATTESTATION_BLOCK: '+m)};
export async function verifyPushAttestation({repo,sourceRepo,sha,branch,token,fetcher=fetch,pause=ms=>new Promise(r=>setTimeout(r,ms)),attempts=24,expectedAct,expectedFocus}) {
 if(!/^[\w.-]+\/[\w.-]+$/.test(repo||'')||sourceRepo!==repo||!/^[a-f0-9]{40}$/.test(sha||'')||!branch||!token)fail('untrusted source or missing identity');
 const api=async suffix=>{const r=await fetcher('https://api.github.com/repos/'+repo+suffix,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(15000)});if(!r.ok)fail('GitHub API HTTP '+r.status);return r};
 for(let attempt=0;attempt<attempts;attempt++){
  const data=await (await api('/actions/runs?head_sha='+sha+'&event=push&branch='+encodeURIComponent(branch)+'&per_page=20')).json();
  const candidates=(data.workflow_runs||[]).filter(r=>r.event==='push'&&r.head_sha===sha&&r.head_branch===branch&&r.path==='.github/workflows/ci.yml'&&r.repository?.full_name===repo);
  // Retry only the newest exact-source attempt; never fall back to an older green run.
  const run=candidates.sort((a,b)=>b.id-a.id)[0];
  if(run){
   const jobs=await (await api('/actions/runs/'+run.id+'/jobs')).json();
   const job=(jobs.jobs||[]).find(j=>j.name==='Conformity Gate');
   if(job?.status==='completed'){
    if(job.conclusion!=='success')fail('trusted push conformity gate failed');
    const response=await (await api('/actions/runs/'+run.id+'/artifacts')).json();
    const artifact=(response.artifacts||[]).find(a=>a.name==='a69-conformity-report'&&!a.expired&&a.workflow_run?.head_sha===sha);
    if(!artifact)fail('same-SHA artifact absent');
    const zip=Buffer.from(await (await api('/actions/artifacts/'+artifact.id+'/zip')).arrayBuffer());if(zip.length>5*1024*1024)fail('oversize artifact');
    const extracted=spawnSync('python3',['-c',"import io,sys,zipfile; z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); b=z.read('a69-live-pov.json'); assert len(b)<65536; sys.stdout.buffer.write(b)"],{input:zip,maxBuffer:65536});
    if(extracted.status!==0)fail('invalid probe artifact');
    const proof=JSON.parse(extracted.stdout.toString());
    if(proof.status!=='PASS'||proof.target_sha!==sha||proof.act_id!==(expectedAct||JSON.parse(fs.readFileSync('governance/pov-snapshot.json','utf8')).act.id)||proof.focus_id!==(expectedFocus||JSON.parse(fs.readFileSync('governance/pov-snapshot.json','utf8')).focus.id)||!Number.isFinite(Date.parse(proof.verified_at))||Math.abs(Date.now()-Date.parse(proof.verified_at))>3600000)fail('probe unsuccessful, stale or foreign');
    return {...proof,attestation_source:'trusted_push_artifact',source_run_id:run.id,source_artifact_id:artifact.id};
   }
  }
  if(attempt+1<attempts)await pause(5000);
 }
 fail('no successful exact-SHA trusted push probe');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const out='test-results/a69-live-pov.json';fs.mkdirSync('test-results',{recursive:true});
 try{const proof=await verifyPushAttestation({repo:process.env.GITHUB_REPOSITORY,sourceRepo:process.env.POV_SOURCE_REPO,sha:process.env.CONFORMITY_TARGET_SHA,branch:process.env.POV_TRUSTED_BRANCH,token:process.env.GH_TOKEN});fs.writeFileSync(out,JSON.stringify(proof,null,2)+'\n');console.log('POV_ATTESTATION_PASS: trusted push '+proof.source_run_id+' / '+proof.target_sha)}catch(e){fs.writeFileSync(out,JSON.stringify({status:'BLOCK',target_sha:process.env.CONFORMITY_TARGET_SHA,diagnostic:e.message},null,2)+'\n');throw e;}
}
