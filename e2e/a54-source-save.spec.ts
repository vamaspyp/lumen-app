import { expect, test, type Page, type Route } from '@playwright/test'

const PROJECT_REF = 'vbuixagaguasejputubp'
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`

async function installSyntheticSession(page: Page) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  await page.addInitScript(({ storageKey, expiresAtValue }) => {
    localStorage.setItem(storageKey, JSON.stringify({
      access_token: 'synthetic-access-token', token_type: 'bearer', expires_in: 3600, expires_at: expiresAtValue,
      refresh_token: 'synthetic-refresh-token',
      user: { id: '10000000-0000-0000-0000-000000000101', aud: 'authenticated', role: 'authenticated', email: 'a54@example.invalid', email_confirmed_at: new Date().toISOString(), app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], created_at: new Date().toISOString() },
    }))
  }, { storageKey: STORAGE_KEY, expiresAtValue: expiresAt })
}

async function fulfillJson(route: Route, body: unknown) {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
}

test('Fuente can save a discovered possibility as a Sanctuary treasure without pretending it is Repertoire', async ({ page }) => {
  await installSyntheticSession(page)
  const calls: string[] = []
  let saveArgs: Record<string, unknown> | null = null

  await page.route(`${SUPABASE_URL}/rest/v1/rpc/**`, async (route) => {
    const name = route.request().url().split('/').pop() || ''
    calls.push(name)
    if (name === 'lumen_bootstrap_person') return fulfillJson(route, { person_id: '90000000-0000-0000-0000-000000000101', preferences: { memory_allowed: false, proactive_allowed: false, evidence_use_allowed: false, sharing_allowed: false, revision: 1 } })
    if (name === 'lumen_source_discover') return fulfillJson(route, [{
      help_id: '71000000-0000-0000-0000-000000000001', canonical_code: 'a54_source_save', help_type: 'reflection', lifecycle: 'active_limited', risk_class: 'low', evidence_class: 'practice_based',
      title: 'Una pregunta para volver', summary: 'Una posibilidad que todavía no sabemos si te ayuda.', content: { prompt: '¿Qué importa acá?' }, duration_minutes: 2, energy: 'low', provider: { name: 'VA+LUMEN · Curaduría inicial', kind: 'internal_curated' }, areas: ['general_life'], capacities: ['discernment'], taxonomy_version: 'life-taxonomy.v1',
    }])
    if (name === 'lumen_source_taxonomy') return fulfillJson(route, { taxonomy_version: 'life-taxonomy.v1', areas: [{ key: 'general_life', label: 'Vida cotidiana' }], capacities: [{ key: 'discernment', label: 'Discernimiento' }] })
    if (name === 'lumen_embryo_health') return fulfillJson(route, { state: 'operational', release_contract: 'embryo.v49.1', slices: {}, canonical_integrity: { status: 'certified', version: 4, authority_set: ['V46','V48','V49','V40','V41','V43'] }, source: { active_possibilities: 60, applicability_relations: 98, semantic_types: 5, taxonomy_version: 'life-taxonomy.v1', coverage_contract: 'coverage.eval.v1' }, evolution: { source_policy_version: 1 }, operations: { providers_ready: 0 }, prelaunch_reset_required: true })
    if (name === 'lumen_s2_snapshot') return fulfillJson(route, { memory_allowed: false, trajectories: [], repertoire: [], sanctuary_count: 0 })
    if (name === 'lumen_s2_set_memory') return fulfillJson(route, { memory_allowed: true, trace_id: '60000000-0000-0000-0000-000000000201' })
    if (name === 'lumen_s2_save_sanctuary') {
      saveArgs = route.request().postDataJSON() as Record<string, unknown>
      return fulfillJson(route, { entry_id: '92000000-0000-0000-0000-000000000201', entry_kind: 'treasure', trace_id: '60000000-0000-0000-0000-000000000202' })
    }
    await route.abort()
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Fuente', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Una pregunta para volver' })).toBeVisible()
  await page.getByRole('button', { name: 'Permitir memoria y guardar' }).click()
  await expect(page.getByText(/Guardé “Una pregunta para volver” en tu Santuario/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guardado en Santuario' })).toBeDisabled()

  expect(calls.indexOf('lumen_s2_set_memory')).toBeGreaterThan(-1)
  expect(calls.indexOf('lumen_s2_save_sanctuary')).toBeGreaterThan(calls.indexOf('lumen_s2_set_memory'))
  expect(saveArgs).toMatchObject({
    p_entry_kind: 'treasure',
    p_title: 'Una pregunta para volver',
    p_content: 'Una posibilidad que todavía no sabemos si te ayuda.',
    p_source_help_id: '71000000-0000-0000-0000-000000000001',
  })
  expect(calls).not.toContain('lumen_s2_add_repertoire')
})
