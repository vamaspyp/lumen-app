import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
const v=fs.readFileSync('src/app/PremiumVNext.tsx','utf8')
const css=fs.readFileSync('src/app/premium-vnext.css','utf8')
test('V57 offers five persistent human doors and distinct contextual experiences',()=>{
 const nav=v.match(/const nav=\[(.*?)\] as const/s)?.[1]||''
 for(const name of ['Inicio','Mi Vida','Explorar','Tejido','Santuario']) assert.ok(nav.includes(name),name)
 assert.equal((nav.match(/\['/g)||[]).length,5)
 for(const scene of ["scene==='momento'","scene==='mapa'","scene==='faro'","scene==='constelacion'","scene==='explorar'","scene==='vivir'","scene==='retorno'","scene==='santuario'","scene==='territorio'","scene==='tejido'"]) assert.ok(v.includes(scene),scene)
 assert.match(v,/discoverConstellation/)
 assert.match(v,/composeMomentConstellation/)
 assert.match(v,/discoverSource/)
 assert.match(v,/constellationItems/)
})
test('V57 makes effect and personal retention separate, editable and verifiable',()=>{
 assert.match(v,/feedback&&!*outcomeRecorded/)
 assert.match(v,/note\.trim\(\)\|\|keepResource/)
 assert.match(v,/setFeedback\(''\)/)
 for(const contract of ['deleteSanctuary','updateSanctuary','getContinuitySnapshot','listSanctuary','integrateHelp','reuseRepertoire']) assert.ok(v.includes(contract),contract)
 assert.doesNotMatch(v,/const resources=\[/)
})
test('V57 field is responsive and readable',()=>{
 for(const x of ['.gm-phone','.gm-home','.gm-map','.gm-faro','.gm-list','.gm-return','.gm-territory','.gm-impact']) assert.ok(css.includes(x),x)
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/)
 assert.match(css,/height:100dvh/)
})
