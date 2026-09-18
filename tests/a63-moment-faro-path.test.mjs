import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const app = fs.readFileSync('src/app/App.tsx', 'utf8')
const embryo = fs.readFileSync('src/greenfield/application/embryo.ts', 'utf8')
const moment = fs.readFileSync('src/greenfield/application/moment.ts', 'utf8')
const migration = fs.readFileSync('supabase/migrations/20260917174500_a63_moment_faro_constellation_path.sql', 'utf8')

test('open Moment restores LUMI and composes a real singular constellation', () => {
  assert.match(app, /LUMI ·/)
  assert.match(app, /composeMomentConstellation/)
  assert.match(moment, /lumen_s1_moment_constellation/)
  assert.match(app, /PARA AHORA/)
  assert.match(app, /UNA CONSTELACIÓN PARA ESTE MOMENTO/)
})

test('Faro creation is voluntary and capacities stay editable without scores', () => {
  assert.match(app, /Conservar como Faro/)
  assert.match(app, /CapabilityPicker/)
  assert.match(app, /setTrajectoryCapabilities/)
  assert.match(embryo, /createTrajectoryFromMoment/)
  assert.match(migration, /capability_keys text\[\]/)
  assert.doesNotMatch(migration, /capability_score|progress_score|skill_level/i)
})

test('constellation is not persisted as anatomy and becomes an editable Path', () => {
  assert.doesNotMatch(migration, /create\s+table\s+[^;]*constellation/i)
  assert.match(app, /Conservar selección como mi Camino/)
  assert.match(app, /removePathItem/)
  assert.match(app, /reorderPathItem/)
  for (const source of ['source','repertoire','sanctuary','tissue','custom']) assert.match(migration, new RegExp(`'${source}'`))
})

test('Moment constellation remains selectable through the existing episode decision trace', () => {
  assert.match(migration, /decision_candidates/)
  assert.match(migration, /candidate_exposures/)
  assert.match(app, /selectHelp\(scene\.episode_id,item\.help_id,'selected'\)/)
})
