import fs from 'node:fs';
const fail=m=>{throw Error('PREMIUM_CONFORMITY_BLOCK: '+m)};
const c=JSON.parse(fs.readFileSync(process.env.PREMIUM_CONTRACT_FILE||'governance/a69-source-premium-pilot.json','utf8'));
const pov=JSON.parse(fs.readFileSync('governance/pov-snapshot.json','utf8'));
if(c.act_id!==pov.act?.id || c.application_domain!=='FUENTE_PREMIUM')fail('wrong governed pilot');
if(!Array.isArray(c.requirements)||c.requirements.length===0)fail('no coverage inventory');
const ids=new Set(),active=new Set((pov.active_authorities||[]).filter(a=>a.state==='VIGENTE').map(a=>a.id));
for(const r of c.requirements){
 if(!r.id||ids.has(r.id))fail('duplicate/missing id');ids.add(r.id);
 if(!active.has(r.authority))fail('obsolete authority '+r.id);
 if(!r.source_section||!r.name)fail('source or text missing '+r.id);
 if(!['PASS','GAP','CONTRADICCION','NO_VERIFICADO'].includes(r.status))fail('invalid status '+r.id);
 if(r.status==='PASS' && (!r.tests?.length||!r.evidence?.length||!r.review?.decision||r.review.decision!=='APPROVED'))fail('false PASS '+r.id);
}
const unresolved=c.requirements.filter(r=>r.status!=='PASS');
if(c.certification==='CERTIFIED' && unresolved.length)fail('false certification');
if(process.env.REQUIRE_CONFORMITY_PASS==='true' && (c.certification!=='CERTIFIED'||unresolved.length))fail('release blocked');
console.log('PREMIUM_PILOT_INVENTORY_PASS '+ids.size+' mapped, '+unresolved.length+' unresolved; not a release certification');
