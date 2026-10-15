import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('A63 mounts one PREMIUM entry on the root route', async () => {
  const main = await read('src/main.tsx')
  assert.match(main, /premium-vnext|PremiumVNext/)
  assert.match(main, /<PremiumVNext\s*\/>/)
  assert.doesNotMatch(main, /vnext\s*=|<App\s*\/>/)
})

test('A63 premium field keeps Inicio deliberately quiet and resource cards homogeneous', async () => {
  const css = await read('src/app/premium-v4.css')
  assert.match(css, /\.preview-grid\s*\{\s*display:none!important;/)
  assert.match(css, /\.hero-shortcuts\s*\{\s*display:none!important;/)
  assert.match(css, /\.source-grid>article,\s*\n\.repertoire-grid>article,\s*\n\.constellation-cards>article/)
  assert.match(css, /\.faro-large-grid\s*\{\s*display:flex!important;/)
  assert.match(css, /\.life-view \.space-hero/)
})

test('LUMI stays available throughout the organism without becoming a chat-first shell', async () => {
  const lumi = await read('src/app/LumiPresence.tsx')
  assert.match(lumi, /className="lumi-orb"/)
  assert.match(lumi, /Vos marcás el ritmo/)
  assert.match(lumi, /Contarme qué está presente/)
  assert.doesNotMatch(lumi, /chatbot|asistente virtual/i)
})
