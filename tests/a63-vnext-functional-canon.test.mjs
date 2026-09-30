import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
const v=fs.readFileSync('src/app/PremiumVNext.tsx','utf8')
const css=fs.readFileSync('src/app/premium-vnext.css','utf8')
test('V58 offers five persistent human doors and distinct contextual experiences',()=>{
 const nav=v.match(/const nav=\[(.*?)\] as const/s)?.[1]||''
 for(const name of ['Inicio','Mi Vida','Explorar','Tejido','Santuario']) assert.ok(nav.includes(name),name)
 assert.equal((nav.match(/\['/g)||[]).length,5)
 for(const scene of ["scene==='momento'","scene==='mapa'","scene==='faro'","scene==='constelacion'","scene==='explorar'","scene==='vivir'","scene==='retorno'","scene==='santuario'","scene==='territorio'","scene==='tejido'"]) assert.ok(v.includes(scene),scene)
 assert.match(v,/composeMomentConstellation/)
 assert.match(v,/discoverSource/)
 assert.match(v,/presentConstellation/)
 assert.doesNotMatch(v,/composeV58Constellation/)
})
test('V58 makes effect and personal retention separate, editable and verifiable',()=>{
 assert.match(v,/!outcomeRecorded\.current/)
 assert.match(v,/conserveReturn/)
 assert.match(v,/recognizeReturn/)
 assert.doesNotMatch(v,/if\(e\.target\.checked\)setKeepResource\(true\)/)
 assert.match(v,/setFeedback\(''\)/)
 for(const contract of ['deleteSanctuary','updateSanctuary','getContinuitySnapshot','listSanctuary','integrateHelp','reuseRepertoire']) assert.ok(v.includes(contract),contract)
 assert.doesNotMatch(v,/const resources=\[/)
})
test('V58 field is responsive and readable',()=>{
 for(const x of ['.gm-phone','.gm-home','.gm-map','.gm-faro','.gm-list','.gm-return','.gm-territory','.gm-impact']) assert.ok(css.includes(x),x)
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/)
 assert.match(css,/height:100dvh/)
})
test('V58 recognition needs separate helpful returns and can be released by its owner',()=>{
 const migration=fs.readFileSync('supabase/migrations/20260929210948_a63_v58_release_own_resource.sql','utf8')
 assert.match(migration,/count\(distinct o\.episode_id\)/i)
 assert.match(migration,/v_count < 2/i)
 assert.match(migration,/repertoire_id = p_repertoire_id[\s\S]*person_id = v_person/i)
 assert.match(migration,/revoke all on function public\.lumen_s2_release_repertoire\(uuid,uuid\) from public, anon/i)
 assert.match(v,/recordLongitudinalSignal/)
 assert.match(v,/releaseOwnResource/)
})
