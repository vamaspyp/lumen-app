import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const seed = read('supabase/migrations/20260912184500_a62_worldclass_flagship_source.sql')
const app = read('src/App.tsx')
const css = read('src/worldclass.css')
const main = read('src/main.tsx')
const custody = JSON.parse(read('governance/custody-registry.json'))

const flagshipCodes = [
  'flagship_breathe_arrive','flagship_ground_present','flagship_values_compass','flagship_two_chairs',
  'flagship_tiny_courage','flagship_kind_inner_voice','flagship_listen_deeper','flagship_repair_bridge',
  'flagship_body_reset','flagship_evening_integration','flagship_meaning_thread','flagship_adapt_next_version',
]

test('A62 ships a deliberately diverse flagship collection, not filler volume', () => {
  for (const code of flagshipCodes) assert.match(seed, new RegExp(code))
  for (const type of ['practice','reflection','conversation','human_action','tool']) assert.match(seed, new RegExp(`'${type}'`))
  for (const capacity of ['regulation','discernment','agency','self_compassion','connection','attention','integration','meaning','adaptation']) assert.match(seed, new RegExp(`'${capacity}'`))
})

test('A62 flagship experiences express the V52 cultivation grammar without programs or scores', () => {
  for (const role of ['UNDERSTAND','PRACTICE','APPLY','VARY','REFLECT','INTEGRATE','CONNECT','SUSTAIN']) assert.match(seed, new RegExp(role))
  assert.doesNotMatch(seed, /capability_score|progress_score|streak|curriculum/i)
  assert.match(seed, /flagship\.v1/)
  assert.match(seed, /screen_reader/)
  assert.match(seed, /reduced_motion/)
})

test('A62 preserves Fuente as possibilities and constellation projection', () => {
  assert.match(app, /No es un feed/)
  assert.match(app, /No estás viendo un programa/)
  assert.match(app, /cultivation_roles/)
  assert.doesNotMatch(seed, /create\s+table\s+[^;]*constellation/i)
})

test('A62 raises visible product quality while preserving accessibility', () => {
  assert.match(main, /worldclass\.css/)
  assert.match(css, /source-card:hover/)
  assert.match(css, /experience-scene/)
  assert.match(css, /practice-steps li::before/)
  assert.match(css, /prefers-reduced-motion/)
  assert.match(css, /grid-template-columns: repeat\(3/)
})

test('A62 is reviewed by the cross-organ custody set', () => {
  const review = new Set(custody.review_sets.source_experience_increment)
  for (const id of ['C0','C1','C2','C3','C7','C8']) assert.ok(review.has(id), `missing ${id}`)
})
