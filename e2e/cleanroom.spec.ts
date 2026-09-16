import { expect, test, type Page, type Route } from '@playwright/test'

const PROJECT_REF = 'vbuixagaguasejputubp'
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`

async function installSession(page: Page) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  await page.addInitScript(({ storageKey, expiresAtValue }) => {
    localStorage.setItem(storageKey, JSON.stringify({
      access_token: 'synthetic-access-token', token_type: 'bearer', expires_in: 3600, expires_at: expiresAtValue,
      refresh_token: 'synthetic-refresh-token',
      user: { id: '10000000-0000-0000-0000-000000000101', aud: 'authenticated', role: 'authenticated', email: 'cleanroom@example.invalid', email_confirmed_at: new Date().toISOString(), app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], created_at: new Date().toISOString() },
    }))
  }, { storageKey: STORAGE_KEY, expiresAtValue: expiresAt })
}

const practice = {
  help_id: '70000000-0000-0000-0000-000000000101', help_version_id: '80000000-0000-0000-0000-000000000101', help_type: 'practice',
  title: 'Llegar al cuerpo', summary: 'Una respiración breve para bajar intensidad sin exigir que nada desaparezca.',
  content: { steps: ['Soltá un poco mandíbula y hombros.', 'Inhalá cómodo y exhalá un poco más lento.', 'Repetilo y notá si aparece apenas más espacio.'] },
  duration_minutes: 3, energy: 'low', detail: {}, applicability_confidence: 0.9,
}

function helpScene() {
  return {
    scene_id: 'moment.help', scene_version: 's1.v55', presence_mode: 'P2',
    episode_id: '30000000-0000-0000-0000-000000000101', moment_id: '40000000-0000-0000-0000-000000000101', decision_run_id: '50000000-0000-0000-0000-000000000101',
    semantic_blocks: [{ type: 'help_preview', primary: practice }],
    coverage: { state: 'covered', reason: 'applicable_source_available' }, safety: { state: 'clear' },
  }
}

const sourceItems = [
  {
    help_id: '71000000-0000-0000-0000-000000000001', canonical_code: 'who_doing_what_matters_es', help_type: 'external_resource', lifecycle: 'active_limited', risk_class: 'low', evidence_class: 'institutional_guidance',
    title: 'En tiempos de estrés: haz lo que importa', summary: 'Guía de la OMS con habilidades prácticas para atravesar estrés y adversidad.',
    content: { external_url: 'https://www.who.int/' }, duration_minutes: 10, energy: 'low',
    provider: { name: 'World Health Organization', kind: 'institution' }, areas: ['wellbeing'], capacities: ['regulation'], taxonomy_version: 'life-taxonomy.v1',
  },
  {
    help_id: practice.help_id, help_version_id: practice.help_version_id, canonical_code: 'flagship_breathe_arrive', help_type: 'practice', lifecycle: 'active_limited', risk_class: 'low', evidence_class: 'practice_based',
    title: practice.title, summary: practice.summary, content: practice.content, duration_minutes: practice.duration_minutes, energy: practice.energy,
    provider: { name: 'VA+LUMEN', kind: 'internal' }, areas: ['wellbeing'], capacities: ['regulation'], taxonomy_version: 'life-taxonomy.v1',
  },
]

const taxonomy = {
  taxonomy_version: 'life-taxonomy.v1',
  areas: [{ key: 'wellbeing', label: 'Bienestar' }, { key: 'relationships', label: 'Vínculos' }],
  capacities: [{ key: 'regulation', label: 'Regulación' }, { key: 'meaning', label: 'Sentido' }, { key: 'connection', label: 'Conexión' }, { key: 'attention', label: 'Atención' }, { key: 'agency', label: 'Agencia' }, { key: 'self_compassion', label: 'Autocompasión' }],
}

async function fulfill(route: Route, body: unknown) {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
}

async function installRpcMocks(page: Page, calls: string[]) {
  await page.route(`${SUPABASE_URL}/rest/v1/rpc/**`, async (route) => {
    const name = route.request().url().split('/').pop() || ''
    calls.push(name)
    if (name === 'lumen_bootstrap_person') return fulfill(route, { person_id: '90000000-0000-0000-0000-000000000101', preferences: { proactive_allowed: false, memory_allowed: true, evidence_use_allowed: false, sharing_allowed: false, revision: 1 } })
    if (name === 'lumen_source_taxonomy') return fulfill(route, taxonomy)
    if (name === 'lumen_source_discover') return fulfill(route, sourceItems)
    if (name === 'lumen_s2_snapshot') return fulfill(route, { memory_allowed: true, trajectories: [{ trajectory_id: 't-1', faro_text: 'Vivir con más calma y presencia', status: 'active', path: [] }], repertoire: [{ repertoire_id: 'r-1', help_id: practice.help_id, title: practice.title, summary: practice.summary, times_reused: 2, user_confirmed: true }], sanctuary_count: 1 })
    if (name === 'lumen_s2_list_sanctuary') return fulfill(route, [{ entry_id: 's-1', entry_kind: 'reflection', title: 'Una idea que quiero recordar', content: 'No tengo que resolver todo al mismo tiempo.', source_help_id: null, created_at: new Date().toISOString() }])
    if (name === 'lumen_s5_snapshot') return fulfill(route, [{ space_id: 'c-1', name: 'Círculo de presencia', purpose: 'Un espacio para compartir y practicar.', role: 'member', member_count: 8, contributions: [] }])
    if (name === 'lumen_s1_accompany_moment') return fulfill(route, helpScene())
    if (name === 'lumen_s1_select_help') return fulfill(route, { selection_id: 'sel-1', episode_id: helpScene().episode_id, action: 'selected', help: practice, trace_id: 'trace-1' })
    if (name === 'lumen_s1_record_outcome') return fulfill(route, { selection_id: 'sel-1', episode_id: helpScene().episode_id, effect: 'helped', signal_kind: 'HELPED_NOW', applied: true, trace_id: 'trace-2', semantic_key: 'outcome.thank_and_release' })
    if (name === 'lumen_s2_add_repertoire') return fulfill(route, { repertoire_id: 'r-2', help_id: practice.help_id })
    if (name === 'lumen_s2_set_memory') return fulfill(route, { memory_allowed: false })
    if (name === 'lumen_s2_create_trajectory') return fulfill(route, { trajectory_id: 't-2' })
    if (name === 'lumen_s2_save_sanctuary') return fulfill(route, { entry_id: 's-2' })
    if (name === 'lumen_s5_create_circle') return fulfill(route, { space_id: 'c-2' })
    if (name === 'lumen_s2_export_sanctuary') return fulfill(route, { export_version: '1', generated_at: new Date().toISOString(), sanctuary_entries: [], trajectories: [], personal_repertoire: [] })
    if (name === 'lumen_s2_delete_sanctuary') return fulfill(route, { deleted: true })
    await route.abort()
  })
}

test('approved Premium design is the only public runtime shell', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '¿Cómo estás hoy?' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Espacios de LUMEN' })).toBeVisible()
  await expect(page.getByText('MI VIDA', { exact: true })).toBeVisible()
  await expect(page.getByText('EXPLORAR', { exact: true })).toBeVisible()
  await expect(page.getByText('SANTUARIO', { exact: true })).toBeVisible()
  await expect(page.getByText('TEJIDO', { exact: true })).toBeVisible()
  await expect(page.getByText('ALGUNAS FORMAS', { exact: false })).toBeVisible()
})

test('authenticated person can move through Mi Vida, Explorar, Santuario and Tejido in the same Field', async ({ page }) => {
  const calls: string[] = []
  await installSession(page)
  await installRpcMocks(page, calls)
  await page.goto('/')
  await page.getByRole('button', { name: 'Mi Vida' }).click()
  await expect(page.getByRole('heading', { name: 'Tu vida, aquí y ahora' })).toBeVisible()
  await expect(page.getByText('Vivir con más calma y presencia')).toBeVisible()
  await page.getByRole('button', { name: 'Explorar' }).click()
  await expect(page.getByRole('heading', { name: 'Todo lo que puede ayudarte a vivir una vida más plena.' })).toBeVisible()
  await page.getByRole('button', { name: 'Santuario' }).click()
  await expect(page.getByRole('heading', { name: 'Aquí vive lo que importa.' })).toBeVisible()
  await page.getByRole('button', { name: 'Tejido' }).click()
  await expect(page.getByRole('heading', { name: 'La vida también se vive con otros.' })).toBeVisible()
  expect(calls).toContain('lumen_s2_snapshot')
  expect(calls).toContain('lumen_s5_snapshot')
})

test('Momento resolves end to end through help, experience, return and voluntary repertoire', async ({ page }) => {
  const calls: string[] = []
  await installSession(page)
  await installRpcMocks(page, calls)
  await page.goto('/')
  await page.getByLabel('Lo que te está pasando').fill('Estoy saturada y necesito bajar un poco la intensidad.')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('heading', { name: 'Llegar al cuerpo' })).toBeVisible()
  await page.getByRole('button', { name: 'Vivir esta posibilidad' }).click()
  await expect(page.locator('.experience-practice')).toBeVisible()
  await page.getByRole('button', { name: 'Seguir' }).click()
  await page.getByRole('button', { name: 'Seguir' }).click()
  await page.getByRole('button', { name: 'Terminé' }).click()
  await expect(page.getByRole('heading', { name: '¿Cómo fue para vos?' })).toBeVisible()
  await page.getByRole('button', { name: 'Me ayudó' }).click()
  await expect(page.getByRole('heading', { name: 'Gracias. Con esto alcanza por ahora.' })).toBeVisible()
  await page.getByRole('button', { name: /Guardar .* en mi repertorio/ }).click()
  expect(calls).toContain('lumen_s1_accompany_moment')
  expect(calls).toContain('lumen_s1_select_help')
  expect(calls).toContain('lumen_s1_record_outcome')
  expect(calls).toContain('lumen_s2_add_repertoire')
})

test('Fuente preserves the nature and provenance of an external resource', async ({ page }) => {
  const calls: string[] = []
  await installRpcMocks(page, calls)
  await page.goto('/')
  await page.getByRole('button', { name: 'Explorar' }).click()
  await page.getByRole('button', { name: 'Vivir esta posibilidad' }).first().click()
  await expect(page.getByRole('heading', { name: 'En tiempos de estrés: haz lo que importa' })).toBeVisible()
  await expect(page.getByText('Fuente: World Health Organization')).toBeVisible()
  await expect(page.getByRole('link', { name: /Abrir en su fuente/ })).toBeVisible()
})
