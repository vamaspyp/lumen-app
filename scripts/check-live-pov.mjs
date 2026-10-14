// A69: live POV read-through. No cached snapshot can authorize release.
import fs from 'node:fs';
const fail=(m)=>{throw new Error('LIVE_POV_BLOCK: '+m)};
const snapshot=JSON.parse(fs.readFileSync('governance/pov-snapshot.json','utf8'));
const token=process.env.POV_GOOGLE_ACCESS_TOKEN;
if(!token)fail('missing read-only Google credential');
const sid=snapshot.source?.spreadsheet_id;
if(!/^[\w-]{20,}$/.test(sid||''))fail('invalid spreadsheet');
const fetchRange=async(range)=>{
 const url='https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(sid)+'/values/'+encodeURIComponent(range);
 const res=await fetch(url,{headers:{Authorization:'Bearer '+token}});
 if(!res.ok)fail('Google Sheets inaccessible: HTTP '+res.status);
 const payload=await res.json();if(!Array.isArray(payload.values))fail('invalid Sheets payload');
 return payload.values;
};
const [acts,assets]=await Promise.all([fetchRange('ACTOS!A4:I1000'),fetchRange('ACTIVOS!A4:H1000')]);
const actRows=acts.slice(1).filter(x=>x[0]===snapshot.act.id);
if(actRows.length!==1)fail('live ACTO missing/duplicated');
const a=actRows[0];
if(a[1]!==snapshot.focus.id||a[7]!==snapshot.act.status||a[4]!==snapshot.act.dod)fail('live ACTO/FOCO/DoD disagrees');
const live=new Map();
for(const row of assets.slice(1)){if(!row[0])continue;if(live.has(row[0]))fail('duplicate authority '+row[0]);live.set(row[0],row)}
for(const item of snapshot.active_authorities||[]){
 const row=live.get(item.id);
 if(!row||row[6]!=='VIGENTE'||row[1]!==item.name)fail('live authority changed '+item.id);
}
console.log('LIVE_POV_PASS: '+snapshot.act.id+' / '+snapshot.focus.id+' / '+snapshot.active_authorities.length+' authorities confirmed directly from Sheets');
