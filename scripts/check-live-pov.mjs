// A69: authenticated read-through. Cached snapshots never authorize release.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const fail=m=>{throw Error('LIVE_POV_BLOCK: '+m)};
export async function verifyLivePov(snapshot,token,fetcher=fetch) {
 if(!token)fail('missing read-only Google credential');
 const sid=snapshot.source?.spreadsheet_id;
 if(!/^[\w-]{20,}$/.test(sid||''))fail('invalid spreadsheet');
 const fetchRange=async range=>{
  const url='https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(sid)+'/values/'+encodeURIComponent(range);
  const res=await fetcher(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
  if(!res.ok){
   // Only structured provider codes, never raw messages, response bodies or tokens.
   let body={};try{body=await res.json()}catch{ /* non-JSON failure remains blocked */ }
   const details=(body.error?.details||[]).map(x=>({reason:x.reason,domain:x.domain,service:x.metadata?.service}));
   fail('Google Sheets inaccessible: HTTP '+res.status+' '+JSON.stringify({status:body.error?.status,details}));
  }
  const payload=await res.json();if(!Array.isArray(payload.values))fail('invalid Sheets payload');return payload.values;
 };
 const [acts,assets,focuses]=await Promise.all([fetchRange('ACTOS!A4:I1000'),fetchRange('ACTIVOS!A4:H1000'),fetchRange('FOCOS!A9:L1000')]);
 const unique=(rows,id,label)=>{const found=rows.slice(1).filter(r=>r[0]===id);if(found.length!==1)fail('live '+label+' missing/duplicated');return found[0]};
 const a=unique(acts,snapshot.act.id,'ACTO');
 if(a[1]!==snapshot.focus.id||a[2]!==snapshot.act.name||a[7]!==snapshot.act.status||a[4]!==snapshot.act.dod)fail('live ACTO/FOCO/DoD disagrees');
 const f=unique(focuses,snapshot.focus.id,'FOCO');
 if(f[1]!==snapshot.focus.name||f[4]!=='ACTIVO'||f[4]!==snapshot.focus.status)fail('live FOCO inactive or changed');
 for(const item of snapshot.active_authorities||[]){
  const row=unique(assets,item.id,'authority '+item.id);
  if(row[6]!=='VIGENTE'||row[1]!==item.name||!item.location||row[4]!==item.location||row[7]!==item.verified)fail('live authority changed '+item.id);
 }
 return {status:'PASS',act_id:snapshot.act.id,focus_id:snapshot.focus.id,authority_count:snapshot.active_authorities.length,verified_at:new Date().toISOString(),target_sha:process.env.CONFORMITY_TARGET_SHA||null};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const out='test-results/a69-live-pov.json';fs.mkdirSync('test-results',{recursive:true});
 try {
  const result=await verifyLivePov(JSON.parse(fs.readFileSync('governance/pov-snapshot.json','utf8')),process.env.POV_GOOGLE_ACCESS_TOKEN);
  fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log('LIVE_POV_PASS: '+result.act_id+' / '+result.focus_id+' / '+result.authority_count+' authorities confirmed directly from Sheets');
 }catch(e){fs.writeFileSync(out,JSON.stringify({status:'BLOCK',target_sha:process.env.CONFORMITY_TARGET_SHA||null,diagnostic:e.message},null,2)+'\n');throw e;}
}
