import { validateInventory } from './conformity-proof.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const fail = (why) => { console.error('INDEPENDENT_AUDIT_BLOCK: '+why); process.exitCode=1; };
const contract=JSON.parse(fs.readFileSync(process.env.CONFORMITY_FILE||'governance/a69-a63-conformity.json','utf8'));
const context=JSON.parse(fs.readFileSync('governance/conduction-context.json','utf8'));
const snapshot=JSON.parse(fs.readFileSync('governance/pov-snapshot.json','utf8'));
if(contract.act_id!=='A69'||context.act.id!=='A69'||snapshot.act.id!=='A69') fail('governance conflict');
const req=contract.requirements||[];
const expected=[['LV',11],['RV',10],['CF',10],['AC',27]].flatMap(([p,n])=>Array.from({length:n},(_,i)=>p+'-'+String(i+1).padStart(2,'0')));
validateInventory(contract,expected,new Set((snapshot.active_authorities||[]).filter(x=>x.state==='VIGENTE').map(x=>x.id)),process.env.CONFORMITY_TARGET_SHA);
for(const r of req){
 if(r.status==='PASS'){
   if(!r.authority||!r.tests?.length||!r.evidence?.length||!r.implementation?.length) fail('unsupported implementation proof '+r.id);
   if(!r.review?.reviewer||!r.review?.builder||r.review.reviewer===r.review.builder) fail('builder reviewed own work '+r.id);
   if(!['human','agent'].includes(r.review.reviewer_type)) fail('reviewer type undeclared '+r.id);
   if(r.review.reviewer_type==='agent' && !r.review.execution_id) fail('agent audit execution missing '+r.id);
   if(r.review.reviewer_type==='human' && !r.review.approval_url) fail('human approval evidence missing '+r.id);
   if(r.review?.decision!=='APPROVED') fail('no independent approval '+r.id);
   if(!r.requirement_text?.trim()||!r.acceptance_criteria?.length) fail('missing source requirement text '+r.id);
   for(const path of r.implementation) if(typeof path!=='string'||!fs.existsSync(path)) fail('nonexistent implementation '+r.id);
 }
}
const unresolved=req.filter(r=>r.status!=='PASS');
if(contract.certification==='CERTIFIED' && unresolved.length) fail('contract has unresolved requirements');
if(contract.certification==='CERTIFIED' && req.some(r=>!r.review||r.review.decision!=='APPROVED')) fail('unreviewed certification');
if(contract.certification==='CERTIFIED' && !contract.release_authorization?.human_actor) fail('human release authorization missing');
if(contract.certification==='CERTIFIED' && !contract.release_authorization?.approval_url) fail('human release decision evidence missing');
if(process.env.REQUIRE_CONFORMITY_PASS==='true' && unresolved.length) fail('release blocked');
if(!process.exitCode)console.log('INDEPENDENT_AUDIT_INVENTORY_PASS: '+req.length+' examined; '+unresolved.length+' unresolved, no completion certified');
