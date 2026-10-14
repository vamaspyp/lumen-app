import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const p=read('governance/a69-source-premium-pilot.json');
const a=read('governance/a69-a63-conformity.json');
const context=read('governance/conduction-context.json');
assert.equal(p.act_id,a.act_id);
assert.equal(p.act_id,context.act.id);
assert.equal(p.certification,'IN_PROGRESS','Premium pilot cannot silently certify');
assert.equal(a.certification,'IN_PROGRESS','Embryo pilot cannot silently certify');
for(const c of [a,p]){
 const seen=new Set();
 for(const r of c.requirements){
  assert.ok(!seen.has(r.id),'duplicate '+r.id);
  seen.add(r.id);
  assert.ok(['PASS','GAP','CONTRADICCION','NO_VERIFICADO'].includes(r.status));
 }
}
console.log('A69_CROSS_DOMAIN_GOVERNANCE_PASS: A63 '+a.requirements.length+' requirements; PREMIUM '+p.requirements.length+' candidate controls; both NOT CERTIFIED');
