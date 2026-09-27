import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read=(p)=>fs.readFileSync(p,'utf8')
const vnext=read('src/app/PremiumVNext.tsx')
const experience=read('src/app/Experience.tsx')
const lumi=read('src/app/LumiPresence.tsx')
const moment=read('src/greenfield/application/moment.ts')
const embryo=read('src/greenfield/application/embryo.ts')
const accessibility=read('src/app/accessibility.css')
const custody=JSON.parse(read('governance/custody-registry.json'))

test('A63 VNext keeps the complete Life to LUMEN to Life physiology connected',()=>{
  for(const contract of ['accompanyMoment','composeMomentConstellation','selectHelp','recordOutcome','saveSanctuary','getContinuitySnapshot','reuseRepertoire','recordLongitudinalSignal','getTissueSnapshot','getProactivitySnapshot','scheduleFollowup']) assert.match(vnext,new RegExp(contract))
  assert.match(moment,/lumen_s1_moment_constellation/)
  assert.match(vnext,/safety\.state/)
  assert.match(vnext,/coverage\.state/)
  assert.match(vnext,/NO MATCH/)
})

test('A63 VNext expresses the clean canon without reintroducing legacy anatomy',()=>{
  for(const lens of ['Dirección','Potencial','Condiciones','Realización']) assert.match(vnext,new RegExp(lens))
  assert.match(vnext,/MI FARO/)
  assert.match(vnext,/Editable\. No es una meta impuesta/)
  assert.doesNotMatch(vnext,/CapabilityPicker|potential_key|Mi proceso|mi Camino|Repertorio/)
})

test('A63 VNext exposes sovereign continuity, Santuario, Tejido and consented proactivity',()=>{
  for(const contract of ['setMemory','setProactivity','exportSanctuary','deleteSanctuary','createCircle','joinCircle']) assert.match(vnext,new RegExp(contract))
  assert.match(vnext,/RECURSO PROPIO · VOLVER A USAR/)
  assert.match(vnext,/Recordármelo mañana/)
  assert.match(vnext,/La vida también se vive con otros/)
  assert.match(vnext,/Vos decidís qué recuerda LUMEN/)
})

test('A63 Premium Source preserves differentiated experience families, provenance and accessibility',()=>{
  for(const family of ['editorial','practice','audio','video','external','human','group','action','quiet']) assert.match(experience,new RegExp("'"+family+"'"))
  assert.match(experience,/function SourcePanel/)
  assert.match(experience,/LUMEN contextualiza; no sustituye ni reescribe la fuente/)
  assert.match(experience,/Abrir en su fuente/)
  assert.match(experience,/GUÍA ESENCIAL · FUENTE ORIGINAL/)
  assert.match(accessibility,/prefers-reduced-motion/)
})

test('A63 VNext reuses existing organism contracts instead of inventing a parallel backend',()=>{
  for(const rpc of ['lumen_s2_snapshot','lumen_s5_snapshot','lumen_s6_snapshot','lumen_s2_list_sanctuary']) assert.match(embryo,new RegExp(rpc))
  const review=new Set(custody.review_sets.source_experience_increment)
  for(const id of ['C0','C1','C2','C3','C7','C8']) assert.ok(review.has(id),'missing '+id)
})


test('A63 VNext keeps LUMI globally available and contextually connected to Santuario',()=>{
  assert.match(vnext,/import \{ LumiPresence \}/)
  assert.match(vnext,/<LumiPresence onNavigate=\{lumiNavigate\}/)
  assert.match(vnext,/scene==='santuario'\?'sanctuary'/)
  assert.match(lumi,/SANTUARIO/)
  assert.match(lumi,/Esto es tuyo\./)
  assert.match(lumi,/onNavigate/)
})
