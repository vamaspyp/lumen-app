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

assert.equal(integrity.certification_status, 'CERTIFIED', 'A60 branch must not declare Pauli-ready before V1.1 certification is complete')
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
assert.equal(embryo?.state, 'operational')
assert.equal(embryo?.release_contract, 'embryo.v53.1')
assert.deepEqual(Object.keys(embryo ?? {}).sort(), ['canonical_integrity', 'evolution', 'operations', 'prelaunch_reset_required', 'release_contract', 'slices', 'source', 'state'].sort(), 'Public health must remain a narrow operational projection')
assert.equal(embryo?.canonical_integrity?.status, 'integrally_certified')
assert.equal(embryo?.canonical_integrity?.version, 7)
assert.deepEqual(embryo?.canonical_integrity?.authority_set, ['V46', 'V51', 'V52', 'V53', 'V40', 'V41', 'V43'])
assert.deepEqual(embryo?.slices, {
  s0: 'implemented', s1: 'implemented', s2: 'implemented', s3: 'implemented',
  s4: 'implemented', s5: 'implemented', s6: 'implemented', s7: 'implemented',
}, 'Public health reports implementation state; ACTO closure state remains governed by the POV')
assert.ok(embryo?.source?.active_possibilities >= 72, 'Source must preserve the A46 exposure seed')
assert.ok(embryo?.source?.applicability_relations >= 109, 'Source must preserve governed Area×Capacity applicability')
assert.ok(embryo?.source?.semantic_types >= 10, 'Source must expose all ten current semantic help forms')
assert.equal(embryo?.source?.taxonomy_version, 'life-taxonomy.v1')
assert.equal(embryo?.source?.coverage_contract, 'coverage.eval.v1')
assert.equal(embryo?.prelaunch_reset_required, true, 'Synthetic construction data must still be reset before real users')

const { data: taxonomy, error: taxonomyError } = await supabase.rpc('lumen_source_taxonomy')
assert.equal(taxonomyError, null, `Source taxonomy failed: ${taxonomyError?.message ?? 'unknown'}`)
assert.equal(taxonomy?.taxonomy_version, 'life-taxonomy.v1')
assert.equal(taxonomy?.cultivation_vocab_version, 'cultivation.v1')
assert.ok(Array.isArray(taxonomy?.areas) && taxonomy.areas.length >= 8)
assert.ok(Array.isArray(taxonomy?.capacities) && taxonomy.capacities.length >= 10)
assert.ok(Array.isArray(taxonomy?.help_types) && taxonomy.help_types.length >= 10, 'Source taxonomy must expose dynamic semantic forms')
assert.ok(Array.isArray(taxonomy?.cultivation_roles) && taxonomy.cultivation_roles.length >= 8, 'Source taxonomy must expose the versioned cultivation vocabulary')

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

const allowedSourceKeys = new Set(['help_id', 'canonical_code', 'help_type', 'lifecycle', 'risk_class', 'evidence_class', 'title', 'summary', 'content', 'duration_minutes', 'energy', 'accessibility', 'provider', 'areas', 'capacities', 'taxonomy_version', 'localization_provenance'])
for (const item of source) {
  for (const field of Object.keys(item ?? {})) assert.ok(allowedSourceKeys.has(field), `Unexpected public Source field: ${field}`)
  assert.equal(Object.hasOwn(item ?? {}, 'person_id'), false, 'Public Source must never expose person_id')
  assert.equal(item?.taxonomy_version, 'life-taxonomy.v1')
  assert.ok(Array.isArray(item?.areas))
  assert.ok(Array.isArray(item?.capacities))
  assert.equal(typeof item?.accessibility, 'object')
}

const providers = new Set(source.map((item) => item?.provider?.name).filter(Boolean))
const helpTypes = new Set(source.map((item) => item?.help_type).filter(Boolean))
assert.ok(providers.size >= 5, `Expected diverse Source provenance, got ${providers.size} providers in capped discovery`)
assert.ok(helpTypes.size >= 10, `Expected all current semantic help forms in broad browse, got ${helpTypes.size}`)
assert.ok(source.some((item) => typeof item?.content?.external_url === 'string'), 'Source must include at least one traceable external resource')

const mentalHealthDoor = source.find((item) => item?.canonical_code === 'argentina_mental_health_0800')
const justiceDoor = source.find((item) => item?.canonical_code === 'argentina_caj_access_to_justice')
assert.ok(mentalHealthDoor, 'Professional mental-health support must be visible in broad Source browse')
assert.ok(justiceDoor, 'Access-to-justice service must be visible in broad Source browse')
assert.deepEqual(mentalHealthDoor.areas, [], 'Context-dependent professional support must not gain fake Motor applicability')
assert.deepEqual(mentalHealthDoor.capacities, [], 'Context-dependent professional support must not gain fake Motor applicability')
assert.deepEqual(justiceDoor.areas, [], 'Context-dependent institutional service must not gain fake Motor applicability')
assert.deepEqual(justiceDoor.capacities, [], 'Context-dependent institutional service must not gain fake Motor applicability')

const representativeApplicability = [
  ['wellbeing', 'regulation', 1],
  ['relationships', 'connection', 1],
  ['general_life', 'agency', 1],
  ['economy', 'discernment', 3],
  ['work', 'regulation', 3],
  ['learning_growth', 'attention', 3],
  ['meaning_spirituality', 'meaning', 1],
  ['family_care', 'self_compassion', 3],
  ['general_life', 'adaptation', 3],
]
for (const [area, capacity, minResults] of representativeApplicability) {
  const { data, error } = await supabase.rpc('lumen_source_discover', {
    p_area_key: area,
    p_capacity_key: capacity,
    p_help_type: null,
    p_locale: 'es-AR',
    p_limit: 10,
  })
  assert.equal(error, null, `Source discovery failed for ${area}×${capacity}: ${error?.message ?? 'unknown'}`)
  assert.ok(Array.isArray(data) && data.length >= minResults, `Source must expose at least ${minResults} possibilities for ${area}×${capacity}`)
}

const seedCapabilities = ['regulation', 'discernment', 'agency', 'connection', 'self_compassion']
for (const capacity of seedCapabilities) {
  const { data, error } = await supabase.rpc('lumen_source_constellation', {
    p_capacity_key: capacity,
    p_area_key: null,
    p_context: {},
    p_locale: 'es-AR',
    p_limit: 16,
  })
  assert.equal(error, null, `Constellation failed for ${capacity}: ${error?.message ?? 'unknown'}`)
  assert.ok(Array.isArray(data) && data.length >= 4, `Constellation ${capacity} must have real depth`)
  const types = new Set(data.map((item) => item?.help_type).filter(Boolean))
  const constellationProviders = new Set(data.map((item) => item?.provider?.name).filter(Boolean))
  const roles = new Set(data.flatMap((item) => item?.cultivation_roles ?? []))
  assert.ok(types.size >= 3, `${capacity} must have diverse help types`)
  assert.ok(constellationProviders.size >= 2, `${capacity} must have diverse provenance`)
  assert.ok(roles.size >= 4, `${capacity} must have diverse cultivation roles`)
}

const { data: contextualConstellation, error: contextualError } = await supabase.rpc('lumen_source_constellation', {
  p_capacity_key: 'regulation',
  p_area_key: null,
  p_context: { max_duration_minutes: 8, allowed_energy: ['low', 'very_low'] },
  p_locale: 'es-AR',
  p_limit: 16,
})
assert.equal(contextualError, null, `Context-aware constellation failed: ${contextualError?.message ?? 'unknown'}`)
assert.ok(Array.isArray(contextualConstellation) && contextualConstellation.length > 0, 'Realization context must preserve useful options')
assert.ok(contextualConstellation.every((item) => item.duration_minutes == null || item.duration_minutes <= 8), 'Constellation must honor max duration realization constraint')
assert.ok(contextualConstellation.every((item) => item.energy == null || ['low', 'very_low'].includes(item.energy)), 'Constellation must honor energy realization constraint')

const { data: privateData, error: privateError } = await supabase.rpc('lumen_s2_snapshot')
assert.equal(privateData, null, 'Anonymous callers must never receive personal continuity data')
assert.ok(privateError, 'Anonymous personal RPC must be rejected')

const { data: cultivationContext, error: cultivationContextError } = await supabase.rpc('lumen_s2_resolve_cultivation_context', { p_capacity_key: 'regulation' })
assert.equal(cultivationContext, null, 'Anonymous callers must never receive longitudinal cultivation context')
assert.ok(cultivationContextError, 'Anonymous cultivation context must be rejected')

console.log(`Embryo live integration PASS: health=${embryo.state}; release=${embryo.release_contract}; canonical=${embryo.canonical_integrity.status}/v${embryo.canonical_integrity.version}; source-active=${embryo.source.active_possibilities}; applicability=${embryo.source.applicability_relations}; seed-constellations=${seedCapabilities.length}; capped-discovery=${source.length}; providers=${providers.size}; types=${helpTypes.size}; anon-personal=blocked`)
