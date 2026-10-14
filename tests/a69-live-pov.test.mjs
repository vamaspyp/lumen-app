import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('live POV verifier fails closed without Google credentials',()=>{
 const env={...process.env};
 delete env.POV_GOOGLE_ACCESS_TOKEN;
 const p=spawnSync(process.execPath,['scripts/check-live-pov.mjs'],{env,encoding:'utf8'});
 assert.notEqual(p.status,0);
 assert.match(p.stderr,/LIVE_POV_BLOCK: missing read-only Google credential/);
});
import {verifyLivePov} from '../scripts/check-live-pov.mjs';
const snapshot={source:{spreadsheet_id:'a'.repeat(30)},act:{id:'A69',name:'tool',status:'EN CURSO',dod:'DoD'},focus:{id:'F6',name:'birth',status:'ACTIVO'},active_authorities:[{id:'V3',name:'governance',location:'approved-url',verified:'today'}]};
const rows={ACTOS:[[],['A69','F6','tool','','DoD','','','EN CURSO']],ACTIVOS:[[],['V3','governance','','','approved-url','','VIGENTE','today']],FOCOS:[[],['F6','birth','','','ACTIVO']]};
const reader=change=>async url=>{const key=decodeURIComponent(url).split('/values/')[1].split('!')[0];const values=structuredClone(rows[key]);change?.(key,values);return {ok:true,json:async()=>({values})}};
test('positive live protocol validates ACTO, FOCO and authority with controlled HTTP fixture',async()=>{const r=await verifyLivePov(snapshot,'fixture-token',reader());assert.equal(r.status,'PASS')});
test('inactive focus blocks even with unchanged ACTO',async()=>{await assert.rejects(verifyLivePov(snapshot,'fixture-token',reader((k,v)=>{if(k==='FOCOS')v[1][4]='SUPERADO'})),/FOCO inactive/)});
test('authority location change blocks',async()=>{await assert.rejects(verifyLivePov(snapshot,'fixture-token',reader((k,v)=>{if(k==='ACTIVOS')v[1][4]='other'})),/authority changed/)});
test('authority revision date change blocks',async()=>{await assert.rejects(verifyLivePov(snapshot,'fixture-token',reader((k,v)=>{if(k==='ACTIVOS')v[1][7]='later'})),/authority changed/)});
test('duplicate focus blocks',async()=>{await assert.rejects(verifyLivePov(snapshot,'fixture-token',reader((k,v)=>{if(k==='FOCOS')v.push(v[1])})),/missing\/duplicated/)});
test('HTTP 403 exposes only structured reason and never provider raw token',async()=>{
 await assert.rejects(verifyLivePov(snapshot,'SECRET',async()=>({ok:false,status:403,json:async()=>({error:{status:'PERMISSION_DENIED',message:'SECRET',details:[{reason:'SERVICE_DISABLED',domain:'googleapis.com',metadata:{service:'sheets.googleapis.com',token:'SECRET'}}]}})})),e=>/SERVICE_DISABLED/.test(e.message)&&!e.message.includes('SECRET'));
});
