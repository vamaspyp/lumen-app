import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('../src/AppE63.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/lumen-premium-v21.css', import.meta.url), 'utf8')
const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8')

test('Premium v2.1 exposes the canonical five navigation labels', () => {
  const nav = app.slice(app.indexOf('function PremiumNav'), app.indexOf('function PrivateGate'))
  for (const label of ['Inicio','Explorar','Mi proceso','Comunidad','Santuario']) {
    assert.match(nav, new RegExp(`label: '${label}'`))
  }
  assert.doesNotMatch(nav, /label: '(Fuente|Tejido|Mi Vida|Biblioteca)'/)
})

test('Premium v2.1 acceptance layer is loaded last', () => {
  const unified = main.indexOf("import './premium-unified.css'")
  const v21 = main.indexOf("import './lumen-premium-v21.css'")
  assert.ok(unified >= 0 && v21 > unified)
})

test('Premium v2.1 keeps canonical palette and horizontal phone resource cards', () => {
  for (const token of ['#FAF8F3','#EAE4D7','#A7B096','#55624A','#6B6B68','#DCC9A3']) {
    assert.ok(css.includes(token), `missing canonical token ${token}`)
  }
  assert.match(css, /@media\(max-width:560px\)[\s\S]*?\.possibility-preview\{grid-template-columns:36% 1fr!important\}/)
})

test('Premium v2.1 uses real photographic surfaces instead of synthetic-only visual placeholders', () => {
  assert.match(css, /--visual-woman:url\('https:\/\/images\.unsplash\.com\//)
  assert.match(css, /--visual-journal:url\('https:\/\/images\.unsplash\.com\//)
  assert.match(css, /--visual-community:url\('https:\/\/images\.unsplash\.com\//)
})
