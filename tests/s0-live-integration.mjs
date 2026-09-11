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
const integrity = JSON.parse(await readFile('governance/canonical-integrity-contracts.json', 'utf8'))
const url = env.VITE_LUMEN_SUPABASE_URL
const key = env.VITE_LUMEN_SUPABASE_PUBLISHABLE_KEY
const finalCertification = integrity.certification_status === 'CERTIFIED'

assert.match(url ?? '', /^https:\/\/vbuixagaguasejputubp\.supabase\.co$/)
assert.match(key ?? '', /^sb_publishable_/)

const authSettings = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
assert.equal(authSettings.status, 200, 'Supabase Auth settings endpoint must be reachable with publishable key')

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

const { data: foundation, error: foundationError } = await supabase.rpc('lumen_foundation_health')
assert.equal(foundationError, null, `Foundation health RPC failed: ${foundationError?.message ?? 'unknown'}`)
assert.deepEqual(foundation, { status: 'ok', slice: 'S0', contract_version: 's0.v1' })

const { data: embryo, error: embryoError } = await supabase.rpc('lumen_embryo_health')
assert.equal(embryoError, null, `Embryo health RPC failed: ${embryoError?.message ?? 'unknown'}`)
assert.equal(embryo?.state, finalCertification ? 'operational' : 'forming')
assert.equal(embryo?.release_contract, 'embryo.v49.1')
assert.deepEqual(Object.keys(embryo ?? {}).sort(), ['canonical_integrity', 'evolution', 'operations', 'prelaunch_reset_required', 'release_contract', 'slices', 'source', 'state'].sort(), 'Public health must remain a narrow operational projection')
assert.equal(embryo?.canonical_integrity?.status, finalCertification ? 'certified' : 'reconciling')
assert.equal(embryo?.canonical_integrity?.version, finalCertification ? 4 : 3)
assert.deepEqual(embryo?.canonical_integrity?.authority_set, ['V46', 'V48', 'V49', 'V40', 'V41', 'V43'])
assert.deepEqual(embryo?.slices, {
  s0: 'implemented', s1: 'implemented', s2: 'implemented', s3: 'implemented',
  s4: 'implemented', s5: 'implemented', s6: 'implemented', s7: 'implemented',
}, 'Public health reports implementation state; ACTO closure state remains governed by the POV')
assert.ok(embryo?.source?.active_possibilities >= 60, 'Source must preserve at least 60 active possibilities')
assert.ok(embryo?.source?.applicability_relations >= 90, 'Source must preserve broad Area×Capacity applicability')
assert.ok(embryo?.source?.semantic_types >= 4, 'Source must expose several semantic help types')
assert.equal(embryo?.source?.taxonomy_version, 'life-taxonomy.v1')
assert.equal(embryo?.source?.coverage_contract, 'coverage.eval.v1')
assert.equal(embryo?.prelaunch_reset_required, true, 'Synthetic construction data must still be reset before real users')

const { data: taxonomy, error: taxonomyError } = await supabase.rpc('lumen_source_taxonomy')
assert.equal(taxonomyError, null, `Source taxonomy failed: ${taxonomyError?.message ?? 'unknown'}`)
assert.equal(taxonomy?.taxonomy_version, 'life-taxonomy.v1')
assert.ok(Array.isArray(taxonomy?.areas) && taxonomy.areas.length >= 8)
assert.ok(Array.isArray(taxonomy?.capacities) && taxonomy.capacities.length >= 10)

const { data: source, error: sourceError } = await supabase.rpc('lumen_source_discover', {
  p_area_key: null,
  p_capacity_key: null,
  p_help_type: null,
  p_locale: 'es-AR',
  p_limit: 50,
})
assert.equal(sourceError, null, `Public Source discovery failed: ${sourceError?.message ?? 'unknown'}`)
assert.ok(Array.isArray(source), 'Source discovery must return an array')
assert.equal(source.length, 50, 'Broad discovery should reach the public hard cap')

const allowedSourceKeys = new Set(['help_id', 'canonical_code', 'help_type', 'lifecycle', 'risk_class', 'evidence_class', 'title', 'summary', 'content', 'duration_minutes', 'energy', 'provider', 'areas', 'capacities', 'taxonomy_version', 'localization_provenance'])
for (const item of source) {
  for (const field of Object.keys(item ?? {})) assert.ok(allowedSourceKeys.has(field), `Unexpected public Source field: ${field}`)
  assert.equal(Object.hasOwn(item ?? {}, 'person_id'), false, 'Public Source must never expose person_id')
  assert.equal(item?.taxonomy_version, 'life-taxonomy.v1')
  assert.ok(Array.isArray(item?.areas))
  assert.ok(Array.isArray(item?.capacities))
}

const providers = new Set(source.map((item) => item?.provider?.name).filter(Boolean))
const helpTypes = new Set(source.map((item) => item?.help_type).filter(Boolean))
assert.ok(providers.size >= 5, `Expected diverse Source provenance, got ${providers.size} providers in capped discovery`)
assert.ok(helpTypes.size >= 4, `Expected several semantic help types, got ${helpTypes.size}`)
assert.ok(source.some((item) => typeof item?.content?.external_url === 'string'), 'Source must include at least one traceable external resource')

const representativeApplicability = [
  ['wellbeing', 'regulation'],
  ['relationships', 'connection'],
  ['general_life', 'agency'],
  ['economy', 'discernment'],
  ['work', 'regulation'],
  ['learning_growth', 'attention'],
  ['meaning_spirituality', 'meaning'],
  ['family_care', 'self_compassion'],
]
for (const [area, capacity] of representativeApplicability) {
  const { data, error } = await supabase.rpc('lumen_source_discover', {
    p_area_key: area,
    p_capacity_key: capacity,
    p_help_type: null,
    p_locale: 'es-AR',
    p_limit: 10,
  })
  assert.equal(error, null, `Source discovery failed for ${area}×${capacity}: ${error?.message ?? 'unknown'}`)
  assert.ok(Array.isArray(data) && data.length >= 1, `Source must cover representative applicability ${area}×${capacity}`)
}

const { data: privateData, error: privateError } = await supabase.rpc('lumen_s2_snapshot')
assert.equal(privateData, null, 'Anonymous callers must never receive personal continuity data')
assert.ok(privateError, 'Anonymous personal RPC must be rejected')

console.log(`Embryo live integration PASS: health=${embryo.state}; canonical=${embryo.canonical_integrity.status}; source-active=${embryo.source.active_possibilities}; applicability=${embryo.source.applicability_relations}; representative-pairs=${representativeApplicability.length}; capped-discovery=${source.length}; providers=${providers.size}; types=${helpTypes.size}; anon-personal=blocked`)
