import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import test from 'node:test'

const ROOT = process.cwd()
const GREENFIELD = join(ROOT, 'src', 'greenfield')

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path))
    else files.push(path)
  }
  return files
}

test('greenfield runtime has no business imports from legacy src', async () => {
  const files = [join(ROOT, 'src', 'App.tsx'), ...await walk(GREENFIELD)]
  const forbidden = [
    '/components/',
    '/lib/',
    "from './components",
    "from './lib",
    "from '../components",
    "from '../lib",
  ]

  for (const file of files) {
    const source = await readFile(file, 'utf8')
    for (const marker of forbidden) {
      assert.equal(source.includes(marker), false, `${relative(ROOT, file)} imports legacy via ${marker}`)
    }
  }
})

test('V40 bounded contexts are represented exactly once', async () => {
  const source = await readFile(join(GREENFIELD, 'kernel', 'modules.ts'), 'utf8')
  for (let i = 0; i <= 9; i += 1) {
    const matches = source.match(new RegExp(`id: 'M${i}'`, 'g')) ?? []
    assert.equal(matches.length, 1, `M${i} must appear exactly once`)
  }
})

test('irrecoverable foundation and decision events have canonical names', async () => {
  const source = await readFile(join(GREENFIELD, 'kernel', 'events.ts'), 'utf8')
  for (const event of ['PersonBootstrapped', 'ConsentChanged', 'MomentReceived', 'CandidateSetGenerated', 'CandidateExposed', 'NoMatchDeclared', 'OutcomeReported', 'CoverageGapDetected', 'PolicyRolledBack']) {
    assert.match(source, new RegExp(`'${event}'`))
  }
})
