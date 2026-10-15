import fs from 'node:fs';
const c=JSON.parse(fs.readFileSync(process.env.CONFORMITY_FILE||'governance/a69-a63-conformity.json','utf8'));
const premium=JSON.parse(fs.readFileSync(process.env.PREMIUM_CONTRACT_FILE||'governance/a69-source-premium-pilot.json','utf8'));
const premiumStates=Object.fromEntries(['PASS','GAP','CONTRADICCION','NO_VERIFICADO'].map(k=>[k,premium.requirements.filter(x=>x.status===k).length]));
const states=['PASS','GAP','CONTRADICCION','NO_VERIFICADO'];
const counts=Object.fromEntries(states.map(k=>[k,c.requirements.filter(x=>x.status===k).length]));
const coverage=c.requirements.filter(x=>x.requirement_text && x.source_url && x.source_section).length;
let live={status:'NOT_RUN'};try{live=JSON.parse(fs.readFileSync('test-results/a69-live-pov.json','utf8'))}catch{}
const target=process.env.CONFORMITY_TARGET_SHA||process.env.GITHUB_SHA||'LOCAL_UNATTESTED';
const liveVerified=live.status==='PASS'&&live.target_sha===target;
const result={schema_version:'1',act_id:c.act_id,application_act:c.application_act,git_sha:target,run_id:process.env.GITHUB_RUN_ID||'LOCAL_UNATTESTED',inventory_size:c.requirements.length,source_mapped:coverage,counts,certification:c.certification,final_verdict:c.certification==='CERTIFIED'?'DECLARED_CERTIFICATION_REQUIRES_GATE':'OPEN_NOT_CERTIFIED',premium_pilot:{domain:premium.application_domain,certification:premium.certification,counts:premiumStates,requirements:premium.requirements.map(x=>({id:x.id,status:x.status,authority:x.authority,source_section:x.source_section}))},limitations:{live_pov_authenticated:liveVerified,live_pov_status:live.status,human_review_documented:false,experience_validated:false},requirements:c.requirements.map(x=>({id:x.id,status:x.status,authority:x.authority,source_section:x.source_section,source_url:x.source_url,tests:x.tests,evidence:x.evidence}))};
fs.mkdirSync('test-results',{recursive:true});
fs.writeFileSync('test-results/a69-conformity-report.json',JSON.stringify(result,null,2)+'\n');
const lines=['# A69 · Conformidad verificable','',`ACTO: ${result.act_id}; Piloto: ${result.application_act}; SHA: ${result.git_sha}; CI: ${result.run_id}`,'',`Inventario: ${result.inventory_size}; Mapeo documental: ${coverage}; PASS: ${counts.PASS}; GAP: ${counts.GAP}; CONTRADICCIÓN: ${counts.CONTRADICCION}; NO VERIFICADO: ${counts.NO_VERIFICADO}`,'',`**Veredicto: ${result.final_verdict}**`,'','| Requisito | Autoridad | Estado | Prueba |','|---|---|---|---|',...result.requirements.map(x=>`| ${x.id} | ${x.authority} ${x.source_section||''} | ${x.status} | ${(x.tests||[]).length} |`),'',`Piloto Fuente PREMIUM: ${premium.requirements.length} controles; ${premiumStates.NO_VERIFICADO} NO_VERIFICADO; certificación: ${premium.certification}.`,'',`**POV online autenticada:** ${liveVerified?'PASS sobre este SHA':'NO ACREDITADA ('+live.status+')'}. **Aprobación humana y experiencia real:** no acreditadas.`,'','**Este reporte no sustituye auditoría humana, revisión visual ni evidencia live.**'];
fs.writeFileSync('test-results/a69-conformity-report.md',lines.join('\n')+'\n');
console.log('A69_REPORT: '+result.final_verdict+'; '+coverage+'/'+result.inventory_size+' requisitos con fuente');
