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
      user: { id: '10000000-0000-0000-0000-000000000101', aud: 'authenticated', role: 'authenticated', email: 'embryo-preview@example.invalid', email_confirmed_at: new Date().toISOString(), app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], created_at: new Date().toISOString() },
    }))
  }, { storageKey: STORAGE_KEY, expiresAtValue: expiresAt })
}

function helpScene() {
  return {
    scene_id: 'moment.help', scene_version: 's1.v1', presence_mode: 'P2', human_intent: 'move_forward',
    episode_id: '30000000-0000-0000-0000-000000000101', moment_id: '40000000-0000-0000-0000-000000000101', decision_run_id: '50000000-0000-0000-0000-000000000101', trace_id: '60000000-0000-0000-0000-000000000101',
    semantic_blocks: [
      { type: 'lumi_line', semantic_key: 'help.offer_humble' },
      { type: 'help_preview', primary: { help_id: '70000000-0000-0000-0000-000000000101', help_version_id: '80000000-0000-0000-0000-000000000101', help_type: 'practice', title: 'Un paso más pequeño', summary: 'Convertir algo trabado en una acción que sí pueda empezar.', content: { intro: 'No hace falta resolver todo. Busquemos el próximo gesto posible.', steps: ['Nombrá lo que querés mover.', 'Reducilo hasta una acción de menos de diez minutos.', 'Elegí: hacerlo ahora o dejar definido cuándo.'] }, duration_minutes: 3, energy: 'low', detail: {} }, alternative: null },
    ],
    available_actions: [{ id: 'try_primary', intent: 'select_help', payload: { help_id: '70000000-0000-0000-0000-000000000101' } }, { id: 'not_this', intent: 'reject_help' }],
    safety: { state: 'clear' }, coverage: { state: 'covered' }, interpretation: { intent_key: 'move_forward', confidence: 0.8, uncertainty_key: null },
  }
}

const sourceItems = [
  {
    help_id: '71000000-0000-0000-0000-000000000001', canonical_code: 'who_doing_what_matters_es', help_type: 'external_resource', lifecycle: 'active_limited', risk_class: 'low', evidence_class: 'institutional_guidance',
    title: 'En tiempos de estrés, haz lo que importa', summary: 'Guía ilustrada de la OMS con habilidades prácticas para atravesar estrés y adversidad.', content: { external_url: 'https://www.who.int/es/publications/b/53604' }, duration_minutes: 10, energy: 'low', provider: { name: 'World Health Organization', kind: 'institution' }, needs: ['pause', 'clarity', 'agency'],
  },
  {
    help_id: '71000000-0000-0000-0000-000000000002', canonical_code: 'pause_quiet_2m', help_type: 'practice', lifecycle: 'active_limited', risk_class: 'low', evidence_class: 'practice_based',
    title: 'Dos minutos de pausa', summary: 'Bajar un poco el ruido antes de decidir qué sigue.', content: { steps: ['Apoyate como estés cómodo.'] }, duration_minutes: 2, energy: 'very_low', provider: { name: 'VA+LUMEN · Curaduría inicial', kind: 'internal_curated' }, needs: ['pause'],
  },
]

function bootstrapState() {
  return { person_id: '90000000-0000-0000-0000-000000000101', preferences: { proactive_allowed: false, memory_allowed: false, evidence_use_allowed: false, sharing_allowed: false, revision: 1 } }
}

function health() {
  return { state: 'operational', release_contract: 'embryo.v0.4', slices: { s0: 'closed', s1: 'closed', s2: 'closed', s3: 'closed', s4: 'closed', s5: 'closed', s6: 'closed', s7: 'closed' }, source: { active_possibilities: 16, coverage_cells: 28, semantic_types: 5 }, evolution: { source_policy_version: 1 }, operations: { providers_ready: 0 }, prelaunch_reset_required: true }
}

async function fulfillJson(route: Route, body: unknown) {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
}

async function installEmbryoRpcMocks(page: Page, calls: string[]) {
  await page.route(`${SUPABASE_URL}/rest/v1/rpc/**`, async (route) => {
    const name = route.request().url().split('/').pop() || ''
    calls.push(name)
    if (name === 'lumen_bootstrap_person') return fulfillJson(route, bootstrapState())
    if (name === 'lumen_source_discover') return fulfillJson(route, sourceItems)
    if (name === 'lumen_embryo_health') return fulfillJson(route, health())
    if (name === 'lumen_s2_snapshot') return fulfillJson(route, { memory_allowed: false, trajectories: [], repertoire: [], sanctuary_count: 0 })
    if (name === 'lumen_s2_list_sanctuary') return fulfillJson(route, [])
    if (name === 'lumen_s5_snapshot') return fulfillJson(route, [])
    if (name === 'lumen_s6_snapshot') return fulfillJson(route, { proactive_allowed: false, settings: { quiet_start_hour: 22, quiet_end_hour: 8, timezone: 'America/Argentina/Buenos_Aires', custody_blocked: false }, followups: [] })
    if (name === 'lumen_s1_accompany_moment') return fulfillJson(route, helpScene())
    if (name === 'lumen_s1_select_help') return fulfillJson(route, { episode_id: helpScene().episode_id, action: 'selected', help: (helpScene().semantic_blocks[1] as { primary: Record<string, unknown> }).primary, trace_id: '60000000-0000-0000-0000-000000000102' })
    if (name === 'lumen_s1_record_outcome') return fulfillJson(route, { episode_id: helpScene().episode_id, effect: 'helped', applied: true, trace_id: '60000000-0000-0000-0000-000000000103', semantic_key: 'outcome.thank_and_release' })
    if (name === 'lumen_s2_add_repertoire') return fulfillJson(route, { repertoire_id: '91000000-0000-0000-0000-000000000101', help_id: '70000000-0000-0000-0000-000000000101' })
    await route.abort()
  })
}

test('Home exposes free expression before progressive authentication', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Estoy acá.' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Espacios de LUMEN' })).toBeVisible()
  await expect(page.getByLabel('Lo que te está pasando')).toBeVisible()
  await expect(page.getByText('No hace falta elegir una categoría.')).toBeVisible()
  await page.getByLabel('Lo que te está pasando').fill('Tengo demasiadas cosas en la cabeza y no sé por dónde empezar.')
  await page.getByRole('button', { name: 'Ver qué podría ayudarme' }).click()
  await expect(page.getByRole('heading', { name: 'Antes de seguir' })).toBeVisible()
  await expect(page.getByText('sin mezclar vidas')).toBeVisible()
  await expect(page.getByLabel('Tu correo')).toBeVisible()
})

test('public Fuente is explorable without identity and exposes provenance', async ({ page }) => {
  const calls: string[] = []
  await installEmbryoRpcMocks(page, calls)
  await page.goto('/')
  await page.getByRole('button', { name: 'Fuente', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Algo del patrimonio humano, cuando haga falta.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'En tiempos de estrés, haz lo que importa' })).toBeVisible()
  await expect(page.getByText('Origen: World Health Organization')).toBeVisible()
  await expect(page.getByText('16 posibilidades activas limitadas')).toBeVisible()
  expect(calls).toContain('lumen_source_discover')
  expect(calls).toContain('lumen_embryo_health')
})

test('authenticated embryo exposes the five canonical living spaces', async ({ page }) => {
  await installSyntheticSession(page)
  const calls: string[] = []
  await installEmbryoRpcMocks(page, calls)
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible()

  await page.getByRole('button', { name: 'Trayectoria' }).click()
  await expect(page.getByRole('heading', { name: 'Dirección sin convertir la vida en un plan.' })).toBeVisible()
  await expect(page.getByLabel('Un Faro que hoy te importe')).toBeVisible()

  await page.getByRole('button', { name: 'Fuente', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Algo del patrimonio humano, cuando haga falta.' })).toBeVisible()

  await page.getByRole('button', { name: 'Santuario' }).click()
  await expect(page.getByRole('heading', { name: 'Lo que es tuyo sigue siendo tuyo.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Permitir guardar' })).toBeVisible()

  await page.getByRole('button', { name: 'Tejido' }).click()
  await expect(page.getByRole('heading', { name: 'La vida también puede circular entre personas.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Crear un Círculo' })).toBeVisible()
  await expect(page.getByText('Todavía no pertenecés a ningún Círculo. Tejido puede empezar pequeño.')).toBeVisible()

  expect(calls).toContain('lumen_bootstrap_person')
  expect(calls).toContain('lumen_s2_snapshot')
  expect(calls).toContain('lumen_s5_snapshot')
})

test('Preview completes Momento → Ayuda → Retorno → Repertorio', async ({ page }) => {
  await installSyntheticSession(page)
  const calls: string[] = []
  await installEmbryoRpcMocks(page, calls)
  await page.goto('/')

  await page.getByLabel('Lo que te está pasando').fill('Estoy bloqueado y no sé por dónde empezar.')
  await page.getByRole('button', { name: 'Ver qué podría ayudarme' }).click()
  await expect(page.getByRole('heading', { name: 'Quizá podamos empezar por acá.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Un paso más pequeño' })).toBeVisible()
  await page.getByRole('button', { name: 'Quiero probarlo' }).click()
  await expect(page.getByText('Nombrá lo que querés mover.')).toBeVisible()
  await page.getByRole('button', { name: 'Terminé' }).click()
  await expect(page.getByRole('heading', { name: '¿Te ayudó algo de esto?' })).toBeVisible()
  await page.getByRole('button', { name: 'Sí, un poco' }).click()
  await expect(page.getByRole('heading', { name: 'Gracias. Con esto alcanza por ahora.' })).toBeVisible()
  await page.getByRole('button', { name: /Guardar “Un paso más pequeño” en mi repertorio/ }).click()
  await expect(page.getByText('Quedó en tu repertorio.')).toBeVisible()

  expect(calls.filter((name) => name.startsWith('lumen_s1_'))).toEqual(['lumen_s1_accompany_moment', 'lumen_s1_select_help', 'lumen_s1_record_outcome'])
  expect(calls).toContain('lumen_s2_add_repertoire')
})
