import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const app = fs.readFileSync('src/app/App.tsx','utf8')
const experience = fs.readFileSync('src/app/Experience.tsx','utf8')
const migration = fs.readFileSync('supabase/migrations/20260917173000_a63_repertoire_retire_on_stopped_helping.sql','utf8')

test('longitudinal reuse returns to the person before recording what happened', () => {
  assert.match(experience, /onFeedback \|\| !parentOwnsOutcome/)
  assert.match(app, /onFeedback=\{\(effect\)=>longitudinalFeedback\(effect\)\}/)
  assert.match(app, /signalForReturn/)
  assert.match(app, /STOPPED_HELPING/)
  assert.match(app, /UNKNOWN/)
})

test('appropriation and autonomy remain explicit user declarations', () => {
  assert.match(app, /Ya lo siento propio/)
  assert.match(app, /Ya no necesito recordatorios/)
  assert.match(app, /RECOGNIZED_AS_OWN/)
  assert.match(app, /NO_REMINDER_NEEDED/)
  assert.match(app, /WITHDRAW/)
})

test('stopped helping retires repertoire instead of silently keeping it active', () => {
  assert.match(migration, /status=case when v_signal='STOPPED_HELPING' then 'retired'/)
  assert.match(migration, /LongitudinalSignalRecorded/)
  assert.doesNotMatch(migration, /create table/i)
})

test('consented continuity can be scheduled and cancelled', () => {
  assert.match(app, /scheduleCultivationFollowup/)
  assert.match(app, /Acordar retorno/)
  assert.match(app, /cancelFollowup/)
})

test('Sanctuary and Tissue expose the real existing contracts', () => {
  assert.match(app, /updateSanctuary/)
  assert.match(app, /Crear invitación/)
  assert.match(app, /joinCircle/)
  assert.match(app, /shareHelp/)
  assert.match(app, /leaveCircle/)
  assert.match(app, /reportCircle/)
})

test('Moment and Explore render Source possibilities through one canonical Premium resource card', () => {
  assert.match(app, /function ResourceCard/)
  assert.match(app, /function SourceCard[\s\S]*<ResourceCard/)
  assert.match(app, /moment-source-grid[\s\S]*<ResourceCard item=\{primary\}/)
  assert.match(app, /rest\.map\(\(item,index\)=>\s*<ResourceCard/)
  assert.doesNotMatch(app, /<article className="medicine-now"/)
  assert.doesNotMatch(app, /<div className="constellation-cards"/)
})

test('Fuente exploration restores hidden deliberate filters without becoming a permanent control wall', () => {
  assert.match(app, /function SourceFilters/)
  assert.match(app, /aria-expanded=\{open\}/)
  assert.match(app, />Filtros\{activeCount/)
  assert.match(app, /aria-label="Duración"/)
  assert.match(app, /aria-label="Formato"/)
  assert.match(app, /aria-label="Energía"/)
  assert.match(app, /Con información de accesibilidad/)
  assert.match(app, /matchesSourceFilters/)
})
