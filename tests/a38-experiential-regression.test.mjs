import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('A38 interpreter keeps rules.v3 and critical real-language families', async () => {
  const sql = await read('supabase/migrations/20260905162000_a38_interpreter_rules_v3_real_language.sql')
  assert.match(sql, /rules\.v3/)
  for (const fragment of [
    'me cuesta dormirme', 'fin de mes', 'me mud', 'persona que cuido', 'no estoy a la altura',
    'pateándolo', 'en automático', 'teléfono cada', 'no quiero seguir viviendo',
  ]) assert.ok(sql.includes(fragment), `missing A38 real-language family: ${fragment}`)
})

test('A38 matching ranks intent before generic need and deduplicates helps', async () => {
  const sql = await read('supabase/migrations/20260905162500_a38_intent_aware_matching_v3.sql')
  assert.match(sql, /cc\.intent_key=v_intent/)
  assert.match(sql, /count\(distinct hp\.help_id\)/)
  assert.match(sql, /group by hp\.help_id/)
  assert.match(sql, /intent_coverage_match/)
  assert.match(sql, /decision\.v2/)
  assert.match(sql, /coverage\.v3/)
})
