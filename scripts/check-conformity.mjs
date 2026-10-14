import fs from 'node:fs';
const contractPath = process.env.CONFORMITY_FILE || 'governance/a69-a63-conformity.json';
const c = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const reject = m => { throw new Error('CONFORMITY_BLOCK: ' + m); };
if (c.act_id !== 'A69' || c.application_act !== 'A63') reject('ACTO mismatch');
if (!Array.isArray(c.requirements)) reject('requirements absent');
const expected = [['LV',11],['RV',10],['CF',10],['AC',27]].flatMap(([p,n]) => Array.from({length:n},(_,i)=>p+'-'+String(i+1).padStart(2,'0')));
const rows = new Map();
for(const r of c.requirements){
 if(rows.has(r.id)) reject('duplicate '+r.id);
 rows.set(r.id,r);
 if(!['PASS','GAP','CONTRADICCION','NO_VERIFICADO'].includes(r.status)) reject('invalid status '+r.id);
 if(r.status==='PASS'){
  if(!Array.isArray(r.tests)||r.tests.length===0||!Array.isArray(r.evidence)||r.evidence.length===0) reject('unsupported PASS '+r.id);
  for(const p of r.tests) if(!fs.existsSync(p)) reject('missing test '+p);
  for(const e of r.evidence) {
   if(!e.path||!fs.existsSync(e.path)||!/^[a-f0-9]{40}$/.test(e.sha||'')) reject('missing evidence or SHA '+r.id);
   // Release certification must be bound to the exact checked commit, not a historic artifact.
   if(process.env.CONFORMITY_TARGET_SHA && e.sha!==process.env.CONFORMITY_TARGET_SHA) reject('foreign SHA evidence '+r.id);
  }
 }
}
for(const id of expected) if(!rows.has(id)) reject('missing '+id);
if(rows.size!==expected.length) reject('unexpected requirement IDs');
const outstanding=[...rows.values()].filter(r=>r.status!=='PASS');
if(c.certification==='CERTIFIED' && outstanding.length) reject('false certification');
if(c.certification==='CERTIFIED' && !process.env.CONFORMITY_TARGET_SHA) reject('CERTIFIED requires verified target SHA');
if(process.env.REQUIRE_CONFORMITY_PASS==='true' && (c.certification!=='CERTIFIED'||outstanding.length)) reject('promotion prohibited');
console.log('CONFORMITY_INVENTORY_PASS '+rows.size+' mapped, '+outstanding.length+' unresolved; certification='+c.certification);
