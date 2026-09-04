import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=')
        return [line.slice(0, separator), line.slice(separator + 1)]
      }),
  )
}

const env = parseEnv(await readFile('.env.production', 'utf8'))
const url = env.VITE_LUMEN_SUPABASE_URL
const key = env.VITE_LUMEN_SUPABASE_PUBLISHABLE_KEY

assert.match(url ?? '', /^https:\/\/vbuixagaguasejputubp\.supabase\.co$/)
assert.match(key ?? '', /^sb_publishable_/)

const authSettings = await fetch(`${url}/auth/v1/settings`, {
  headers: { apikey: key },
})
assert.equal(authSettings.status, 200, 'Supabase Auth settings endpoint must be reachable with publishable key')

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

const { data: foundation, error: foundationError } = await supabase.rpc('lumen_foundation_health')
assert.equal(foundationError, null, `Foundation health RPC failed: ${foundationError?.message ?? 'unknown'}`)
assert.deepEqual(foundation, { status: 'ok', slice: 'S0', contract_version: 's0.v1' })

const { data: embryo, error: embryoError } = await supabase.rpc('lumen_embryo_health')
assert.equal(embryoError, null, `Embryo health RPC failed: ${embryoError?.message ?? 'unknown'}`)
assert.equal(embryo?.state, 'operational')
assert.equal(embryo?.release_contract, 'embryo.v0.4')
assert.deepEqual(Object.keys(embryo ?? {}).sort(), ['evolution', 'operations', 'prelaunch_reset_required', 'release_contract', 'slices', 'source', 'state'].sort(), 'Public health must remain a narrow operational projection')
assert.deepEqual(embryo?.slices, {
  s0: 'closed', s1: 'closed', s2: 'closed', s3: 'closed',
  s4: 'closed', s5: 'closed', s6: 'closed', s7: 'closed',
})
assert.ok(embryo?.source?.active_possibilities >= 16, 'Source must expose at least 16 active possibilities')
assert.ok(embryo?.source?.coverage_cells >= 18, 'Source coverage must remain above the embryo floor')
assert.ok(embryo?.source?.semantic_types >= 4, 'Source must expose several semantic help types')
assert.equal(embryo?.prelaunch_reset_required, true, 'Synthetic construction data must still be reset before real users')

const { data: source, error: sourceError } = await supabase.rpc('lumen_source_discover', {
  p_need_key: null,
  p_help_type: null,
  p_locale: 'es-AR',
  p_limit: 50,
})
assert.equal(sourceError, null, `Public Source discovery failed: ${sourceError?.message ?? 'unknown'}`)
assert.ok(Array.isArray(source), 'Source discovery must return an array')
assert.ok(source.length >= 16, `Expected at least 16 discoverable possibilities, got ${source.length}`)
assert.ok(source.length <= 50, 'Public Source discovery must enforce its hard result cap')

const allowedSourceKeys = new Set(['help_id', 'canonical_code', 'help_type', 'lifecycle', 'risk_class', 'evidence_class', 'title', 'summary', 'content', 'duration_minutes', 'energy', 'provider', 'needs', 'localization_provenance'])
for (const item of source) {
  for (const field of Object.keys(item ?? {})) assert.ok(allowedSourceKeys.has(field), `Unexpected public Source field: ${field}`)
  assert.equal(Object.hasOwn(item ?? {}, 'person_id'), false, 'Public Source must never expose person_id')
}

const providers = new Set(source.map((item) => item?.provider?.name).filter(Boolean))
const helpTypes = new Set(source.map((item) => item?.help_type).filter(Boolean))
assert.ok(providers.size >= 4, `Expected diverse Source provenance, got ${providers.size} providers`)
assert.ok(helpTypes.size >= 4, `Expected several semantic help types, got ${helpTypes.size}`)
assert.ok(source.some((item) => typeof item?.content?.external_url === 'string'), 'Source must include at least one traceable external resource')

const { data: privateData, error: privateError } = await supabase.rpc('lumen_s2_snapshot')
assert.equal(privateData, null, 'Anonymous callers must never receive personal continuity data')
assert.ok(privateError, 'Anonymous personal RPC must be rejected')

console.log(`Embryo live integration PASS: health=${embryo.state}; source=${source.length}; providers=${providers.size}; types=${helpTypes.size}; anon-personal=blocked`)
