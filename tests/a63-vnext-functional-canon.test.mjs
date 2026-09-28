import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
const v=fs.readFileSync('src/app/PremiumVNext.tsx','utf8')
const css=fs.readFileSync('src/app/premium-vnext.css','utf8')
test('A63 golden master contains the ten approved surfaces',()=>{
 for(const x of ['Una vida más tuya.','¿Qué estás viviendo hoy?','Mi Mapa Vivo','Mi Faro','Tu Constelación','chosen?.title','¿Cómo fue?','Mi Santuario','Explorar el Territorio','Impacto y Aprendizaje']) assert.ok(v.includes(x),x)
})
test('A63 golden master preserves approved canonical sequence and navigation',()=>{
 for(const x of ["go('momento')","go('mapa')","go('faro')","go('constelacion')","go('vivir')","go('retorno')","go('santuario')"]) assert.ok(v.includes(x),x)
 for(const x of ['Inicio','Explorar','Mi Vida','Comunidad','Biblioteca']) assert.ok(v.includes(x),x)
})
test('A63 golden master carries approved copy and live Source resources',()=>{
 for(const x of ['Lo que importa','Lo que puedes desplegar','Lo que habilita o restringe','Lo que vives hoy','Próximos pasos sugeridos','Guardar en mi Santuario','Tu camino no solo transforma tu vida. También ilumina el camino de otros.']) assert.ok(v.includes(x),x)
 assert.ok(v.includes('liveResources.filter('))
 assert.doesNotMatch(v,/const resources=\[/)
})
test('A63 clean slate does not reintroduce rejected ambient or legacy UI',()=>{
 assert.doesNotMatch(v,/LumiPresence|Mi proceso|CapabilityPicker|RECURSO PROPIO/)
})
test('A63 stylesheet is a single golden-master grammar',()=>{
 for(const x of ['.gm-phone','.gm-home','.gm-moment','.gm-map','.gm-faro','.gm-list','.gm-live','.gm-return','.gm-territory','.gm-impact']) assert.ok(css.includes(x),x)
 assert.doesNotMatch(css,/\\.vx-/)
})
