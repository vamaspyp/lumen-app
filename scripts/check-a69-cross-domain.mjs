import fs from 'node:fs';
import {validateInventory} from './conformity-proof.mjs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const p=read(process.env.PREMIUM_CONTRACT_FILE||'governance/a69-source-premium-pilot.json');
const a=read(process.env.CONFORMITY_FILE||'governance/a69-a63-conformity.json');
const context=read('governance/conduction-context.json');
assert.equal(p.act_id,a.act_id);
assert.equal(p.act_id,context.act.id);
const pov=read('governance/pov-snapshot.json');
const active=new Set(pov.active_authorities.filter(x=>x.state==='VIGENTE').map(x=>x.id));
const ids=[['LV',11],['RV',10],['CF',10],['AC',27]].flatMap(([prefix,n])=>Array.from({length:n},(_,i)=>prefix+'-'+String(i+1).padStart(2,'0')));
validateInventory(a,ids,active,process.env.CONFORMITY_TARGET_SHA);
validateInventory(p,['FP-01','FP-02','FP-03','FP-04'],active,process.env.CONFORMITY_TARGET_SHA);
for(const c of [a,p]){
 const seen=new Set();
 for(const r of c.requirements){
  assert.ok(!seen.has(r.id),'duplicate '+r.id);
  seen.add(r.id);
  assert.ok(['PASS','GAP','CONTRADICCION','NO_VERIFICADO'].includes(r.status));
 }
}
console.log('A69_CROSS_DOMAIN_GOVERNANCE_PASS: A63 '+a.requirements.length+' requirements; PREMIUM '+p.requirements.length+' candidate controls; '+(a.certification==='CERTIFIED'&&p.certification==='CERTIFIED'?'VALIDATED CONTRACTS; human release remains separate':'NOT CERTIFIED in at least one domain'));
