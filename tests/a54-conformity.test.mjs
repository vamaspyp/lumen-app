import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('A54 Repertoire keeps outcome attribution normalized through Selection', async () => {
  const sql = await read('supabase/migrations/20260911204500_a54_repertoire_selection_attribution.sql')
  assert.match(sql, /join gf_core\.help_selections s/i)
  assert.match(sql, /s\.selection_id\s*=\s*o\.selection_id/i)
  assert.match(sql, /s\.help_id\s*=\s*p_help_id/i)
  assert.doesNotMatch(sql, /o\.help_id/i)
})

test('A54 Knowledge can create a provisional claim under the vigente K0..K5 contract', async () => {
  const sql = await read('supabase/migrations/20260911210000_a54_knowledge_epistemic_default.sql')
  assert.match(sql, /alter column epistemic_level set default 'K0'/i)
  assert.match(sql, /'K0'/)
  assert.match(sql, /'provisional'/)
  assert.match(sql, /eligible evidence not found/i)
})

test('A54 Source intake stays one type-neutral pipeline', async () => {
  const sql = await read('supabase/migrations/20260911212000_a54_source_intake_typed_payload.sql')
  assert.match(sql, /r\.help_type='external_resource'/)
  assert.match(sql, /external resource requires external_url/)
  assert.match(sql, /native possibility requires content_payload/)
  assert.match(sql, /r\.candidate->'content_payload'/)
  assert.match(sql, /gf_core\.help_applicability/)
})

test('Source exploration can save without conflating Sanctuary with Repertoire', async () => {
  const app = await read('src/App.tsx')
  const source = app.slice(app.indexOf('function SourceSpace'), app.indexOf('function TrajectorySpace'))
  assert.match(source, /saveSanctuary\('treasure'/)
  assert.match(source, /setMemory\(true\)/)
  assert.match(source, /Esto no lo convierte en parte de tu repertorio/)
  assert.doesNotMatch(source, /integrateHelp\(/)
})

test('regression gate executes every E2E spec instead of a handpicked legacy file', async () => {
  const pkg = JSON.parse(await read('package.json'))
  assert.equal(pkg.scripts['test:regression'], 'playwright test')
})
