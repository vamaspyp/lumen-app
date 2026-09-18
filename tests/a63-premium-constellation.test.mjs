import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const app=fs.readFileSync('src/app/App.tsx','utf8')
const exp=fs.readFileSync('src/app/Experience.tsx','utf8')
const semantic=fs.readFileSync('src/app/premium-source.ts','utf8')
const css=fs.readFileSync('src/app/premium-source.css','utf8')
const migration=fs.readFileSync('supabase/migrations/20260918104000_a63_premium_constellation_render.sql','utf8')

test('A63 profile never impersonates the person with a stock portrait',()=>{
  assert.match(app,/user_metadata/)
  assert.match(app,/avatar_url/)
  assert.match(app,/profile-initials/)
  const profileBody=app.slice(app.indexOf('function Profile'),app.indexOf('function HomeHero'))
  assert.doesNotMatch(profileBody,/IMG\.portrait/)
})

test('A63 keeps Inicio populated without turning it into a dashboard',()=>{
  assert.match(app,/\[\.\.\.contextualItems,\.\.\.genericItems\]\.slice\(0,6\)/)
  assert.match(app,/Algo de tu vida \+ otras puertas/)
})

test('A63 premium constellation is semantic, discoverable and visually part of the same house',()=>{
  assert.match(semantic,/constellation_key/)
  assert.match(semantic,/premium_family/)
  assert.match(app,/Constelaciones destacadas/)
  assert.match(app,/CONSTELACIÓN PREMIUM · FUENTE/)
  assert.match(app,/constellation-hero/)
  assert.match(css,/premium-constellation-showcase/)
  assert.match(css,/constellation-hero/)
})

test('A63 premium Source uses family renderers and preserves external authorship',()=>{
  for(const family of ['illustrated_guide','audio_practice','contemplative_reading_audio','classic_reading','video_or_audio_visual_sequence','health_reference']){
    assert.match(semantic,new RegExp(family))
  }
  for(const family of ['audio_practice','contemplative_reading_audio','classic_reading','video_or_audio_visual_sequence','health_reference']){
    assert.match(exp,new RegExp(family))
  }
  assert.match(exp,/GUÍA ESENCIAL · FUENTE ORIGINAL/)
  assert.match(exp,/LUMEN contextualiza; no sustituye ni reescribe la fuente/)
  assert.match(exp,/Volver a la constelación/)
  assert.match(exp,/Abrir en su fuente/)
})

test('A63 Source contracts expose premium metadata without new anatomy',()=>{
  assert.match(migration,/'detail',hv\.detail/)
  assert.match(migration,/regulation/)
  assert.match(migration,/paho_grounding_audio_es/)
  assert.match(migration,/plum_village_mindful_breathing_es/)
  assert.match(migration,/bbva_castellanos_breathing_brain_es/)
  assert.doesNotMatch(migration,/create\s+table/i)
})
