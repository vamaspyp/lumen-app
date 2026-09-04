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

test('Supabase SDK is confined to vendor adapter', async () => {
  for (const file of (await walk(GREENFIELD)).filter((p) => /\.(?:ts|tsx)$/.test(p))) {
    const source = await readFile(file, 'utf8')
    if (source.includes('@supabase/supabase-js')) {
      assert.match(relative(ROOT, file), /^src\/greenfield\/adapters\/supabase\//)
    }
  }
})

test('greenfield Supabase config is namespaced away from legacy variables', async () => {
  const source = await readFile(join(GREENFIELD, 'adapters', 'supabase', 'client.ts'), 'utf8')
  assert.match(source, /VITE_LUMEN_SUPABASE_URL/)
  assert.match(source, /VITE_LUMEN_SUPABASE_PUBLISHABLE_KEY/)
  assert.doesNotMatch(source, /env\('VITE_SUPABASE_URL'\)/)
  assert.doesNotMatch(source, /env\('VITE_SUPABASE_(?:ANON_KEY|PUBLISHABLE_KEY)'\)/)
})

test('locale and surface contracts keep semantic identity independent from display copy', async () => {
  const source = await readFile(join(GREENFIELD, 'kernel', 'i18n.ts'), 'utf8')
  for (const token of ['LocaleContext', 'SurfaceKind', 'SemanticAction']) assert.match(source, new RegExp(token))
  assert.doesNotMatch(source, /label:\s*['"]/)
})
