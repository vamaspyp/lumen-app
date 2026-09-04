import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('repository keeps an explicit regression gate in package scripts', async () => {
  const pkg = JSON.parse(await read('package.json'))
  assert.equal(typeof pkg.scripts?.['test:regression'], 'string')
  assert.match(pkg.scripts['test:regression'], /playwright test/)
  assert.match(pkg.scripts?.verify ?? '', /test:regression/)
})

test('CI preserves verify plus live backend certification', async () => {
  const workflow = await read('.github/workflows/ci.yml')
  assert.match(workflow, /npm run verify/)
  assert.match(workflow, /npm run test:live/)
})

test('engineering guardrails codify bug-to-regression and correct-layer rules', async () => {
  const guardrails = await read('docs/ENGINEERING_GUARDRAILS.md')
  assert.match(guardrails, /Bug relevante = regresión permanente/)
  assert.match(guardrails, /Fix en la capa correcta/)
  assert.match(guardrails, /CI es gate de cierre/)
})
