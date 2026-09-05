import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('A37 curation manifest is broad, Spanish, unique and traceable', async () => {
  const manifest = JSON.parse(await read('source/a37-source-es.json'))
  assert.equal(manifest.act, 'A37')
  assert.equal(manifest.locale, 'es-AR')
  assert.equal(manifest.items.length, 44)

  const codes = manifest.items.map((item) => item.code)
  assert.equal(new Set(codes).size, codes.length, 'A37 canonical codes must be unique')

  const needs = new Set(manifest.items.flatMap((item) => item.needs ?? []))
  for (const need of ['grief', 'sleep', 'anxiety', 'relationship_repair', 'boundaries', 'self_compassion', 'confidence', 'habit', 'work_stress', 'financial_calm', 'caregiving', 'change_transition', 'energy', 'focus']) {
    assert.ok(needs.has(need), `A37 manifest must cover ${need}`)
  }

  const external = manifest.items.filter((item) => item.kind === 'external')
  assert.equal(external.length, 10)
  for (const item of external) {
    assert.match(item.url ?? '', /^https:\/\//)
    assert.equal(item.linked_not_copied, true)
  }

  const providers = new Set(manifest.items.map((item) => item.provider))
  for (const provider of ['va_lumen_seed', 'who', 'paho', 'medlineplus', 'ggsc']) {
    assert.ok(providers.has(provider), `A37 must preserve provider ${provider}`)
  }
})

test('rules.v2 preserves safety-first and specific-before-broad precedence', async () => {
  const sql = await read('supabase/migrations/20260905120500_a37_rules_v2_final.sql')
  const safety = sql.indexOf("v ~ '(suicid|")
  const grief = sql.indexOf("v_intent:='move_through_grief'")
  const financial = sql.indexOf("v_intent:='face_financial_worry'")
  const anxiety = sql.indexOf("v_intent:='regulate_anxiety'")
  const transition = sql.indexOf("v_intent:='navigate_transition'")
  const work = sql.indexOf("v_intent:='reduce_work_stress'")

  for (const position of [safety, grief, financial, anxiety, transition, work]) assert.ok(position >= 0)
  assert.ok(safety < grief, 'safety must be evaluated before ordinary matching')
  assert.ok(financial < anxiety, 'financial worry must precede generic anxiety')
  assert.ok(transition < work, 'life transition must precede generic work stress')
  assert.match(sql, /rules\.v2/)
})
