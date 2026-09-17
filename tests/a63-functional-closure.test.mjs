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
