import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import test from 'node:test'

const ROOT = process.cwd()
const GREENFIELD = join(ROOT, 'src', 'greenfield')
const MIGRATIONS = join(ROOT, 'supabase', 'migrations')

async function walk(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    const files = []
    for (const entry of entries) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) files.push(...await walk(path))
      else files.push(path)
    }
    return files
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw error
  }
}

test('greenfield source never imports legacy application folders', async () => {
  const files = await walk(GREENFIELD)
  const forbidden = [
    /(?:^|\/)components(?:\/|$)/,
    /(?:^|\/)lib(?:\/|$)/,
    /(?:^|\/)legacy(?:\/|$)/,
  ]

  for (const file of files.filter((p) => /\.(?:ts|tsx|js|mjs)$/.test(p))) {
    const source = await readFile(file, 'utf8')
    const imports = [...source.matchAll(/(?:from\s+|import\s*\()(['"])([^'"]+)\1/g)].map((m) => m[2])
    for (const specifier of imports) {
      for (const pattern of forbidden) {
        assert.equal(pattern.test(specifier), false, `${relative(ROOT, file)} imports forbidden legacy path ${specifier}`)
      }
    }
  }
})

test('greenfield migrations do not reference legacy public business objects', async () => {
  const files = (await walk(MIGRATIONS)).filter((p) => p.endsWith('.sql') && /greenfield|gf_/i.test(p))
  assert.ok(files.length > 0, 'at least one greenfield migration must be versioned in the repository')

  const allowedPublicRefs = new Set(['public', 'anon', 'authenticated'])
  for (const file of files) {
    const sql = await readFile(file, 'utf8')
    for (const match of sql.matchAll(/\bpublic\.([a-zA-Z_][a-zA-Z0-9_]*)/g)) {
      assert.fail(`${relative(ROOT, file)} references legacy public object public.${match[1]}`)
    }
    for (const match of sql.matchAll(/\b(?:references|from|join|update|into|delete\s+from)\s+([a-zA-Z_][a-zA-Z0-9_]*)\./gi)) {
      const schema = match[1].toLowerCase()
      assert.ok(schema.startsWith('gf_') || allowedPublicRefs.has(schema), `${relative(ROOT, file)} crosses into schema ${schema}`)
    }
  }
})

test('runtime entrypoints depend only on greenfield or framework code', async () => {
  for (const path of [join(ROOT, 'src', 'main.tsx'), join(ROOT, 'src', 'App.tsx')]) {
    const source = await readFile(path, 'utf8')
    assert.equal(/['"]\.\/?components\//.test(source), false, `${relative(ROOT, path)} imports legacy components`)
    assert.equal(/['"]\.\/?lib\//.test(source), false, `${relative(ROOT, path)} imports legacy lib`)
  }
})
