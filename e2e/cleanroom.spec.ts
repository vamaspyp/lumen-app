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
    interpretation: { taxonomy_version: 'life-taxonomy.v1', area_keys: ['wellbeing'], capacity_keys: ['regulation'], confidence: 0.88 },
  }
}

const sourceItems = [
  {
    help_id: '71000000-0000-0000-0000-000000000001', canonical_code: 'who_doing_what_matters_es', help_type: 'external_resource', lifecycle: 'active_limited', risk_class: 'low', evidence_class: 'institutional_guidance',
    title: 'En tiempos de estrés: haz lo que importa', summary: 'Guía de la OMS con habilidades prácticas para atravesar estrés y adversidad.',
    content: { external_url: 'https://www.who.int/' }, duration_minutes: 10, energy: 'low',
    provider: { name: 'World Health Organization', kind: 'institution' }, areas: ['wellbeing'], capacities: ['regulation'], cultivation_roles: ['UNDERSTAND'], taxonomy_version: 'life-taxonomy.v1',
  },
  {
    help_id: practice.help_id, help_version_id: practice.help_version_id, canonical_code: 'flagship_breathe_arrive', help_type: 'practice', lifecycle: 'active_limited', risk_class: 'low', evidence_class: 'practice_based',
    title: practice.title, summary: practice.summary, content: practice.content, duration_minutes: practice.duration_minutes, energy: practice.energy,
    provider: { name: 'VA+LUMEN', kind: 'internal' }, areas: ['wellbeing'], capacities: ['regulation'], cultivation_roles: ['PRACTICE','APPLY'], taxonomy_version: 'life-taxonomy.v1',
  },
  {
    help_id: '71000000-0000-0000-0000-000000000003', canonical_code: 'public_support', help_type: 'institutional_service', lifecycle: 'active_limited', risk_class: 'low', evidence_class: 'institutional_guidance',
    title: 'Orientación pública de bienestar', summary: 'Una puerta institucional cuando hace falta apoyo concreto.', content: {}, duration_minutes: null, energy: 'low',
    provider: { name: 'Institución pública', kind: 'institution' }, areas: ['wellbeing'], capacities: ['regulation'], cultivation_roles: ['CONNECT'], taxonomy_version: 'life-taxonomy.v1',
  },
]


const premiumSourceItems = [
  ['paho_doing_what_matters_latam','En tiempos de estrés: haz lo que importa','illustrated_guide','foundation_guide','OPS/OMS'],
  ['paho_grounding_audio_es','Poner los pies en la tierra · audio OPS/OMS','audio_practice','practice_now','OPS/OMS'],
  ['paho_leave_space_audio_es','Dejar espacio · audio OPS/OMS','audio_practice','acceptance_practice','OPS/OMS'],
  ['plum_village_mindful_breathing_es','Respiración consciente · Plum Village','contemplative_reading_audio','contemplative_practice','Plum Village · Tradición de Thich Nhat Hanh'],
  ['marcus_aurelius_meditations_pd_es','Meditaciones · Marco Aurelio','classic_reading','philosophical_perspective','textos.info · Biblioteca digital'],
  ['bbva_castellanos_breathing_brain_es','Si el cerebro fuera una orquesta, la respiración sería el director','video_or_audio_visual_sequence','understand_science','BBVA · Aprendemos Juntos 2030'],
  ['medlineplus_anxiety_es','Ansiedad · MedlinePlus','health_reference','health_understanding','MedlinePlus en español'],
].map(([code,title,family,role,provider],index)=>({
  help_id:`72000000-0000-0000-0000-00000000000${index+1}`,
  canonical_code:code, help_type:'external_resource', lifecycle:'active_limited', risk_class:'low', evidence_class:'institutional_guidance',
  title, summary:`Posibilidad testigo PREMIUM para Regulación · ${title}.`,
  content:{ external_url:`https://example.invalid/${code}` }, duration_minutes:index===1||index===2?5:12, energy:'low',
  detail:{ constellation_key:'regulation_premium_v1', collection:'regulation_premium_v1', premium_family:family, constellation_role:role, premium_wrapper:true, source_fidelity:'external_original_unchanged', external_url:`https://example.invalid/${code}` },
  provider:{ name:provider, kind:'external' }, areas:['wellbeing'], capacities:['regulation'], capacity_key:'regulation',
  cultivation_roles:index===1?['PRACTICE','APPLY']:['UNDERSTAND'], taxonomy_version:'life-taxonomy.v1',
}))

const allSourceItems = [...sourceItems,...premiumSourceItems]

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
    if (name === 'lumen_source_discover') return fulfill(route, allSourceItems)
    if (name === 'lumen_source_constellation') return fulfill(route, sourceItems)
    if (name === 'lumen_s2_snapshot') return fulfill(route, { memory_allowed: true, trajectories: [{ trajectory_id: 't-1', faro_text: 'Vivir con más calma y presencia', status: 'active', capability_keys: ['regulation'], origin_moment_id: null, path: [] }], repertoire: [{ repertoire_id: 'r-1', help_id: practice.help_id, title: practice.title, summary: practice.summary, times_reused: 2, user_confirmed: true }], sanctuary_count: 1 })
    if (name === 'lumen_s2_list_sanctuary') return fulfill(route, [{ entry_id: 's-1', entry_kind: 'reflection', title: 'Una idea que quiero recordar', content: 'No tengo que resolver todo al mismo tiempo.', source_help_id: practice.help_id, created_at: new Date().toISOString() }])
    if (name === 'lumen_s5_snapshot') return fulfill(route, [{ space_id: 'c-1', name: 'Círculo de presencia', purpose: 'Un espacio para compartir y practicar.', role: 'member', member_count: 8, contributions: [] }])
    if (name === 'lumen_s6_snapshot') return fulfill(route, { proactive_allowed: false, settings: { quiet_start_hour: 22, quiet_end_hour: 8, timezone: 'America/Buenos_Aires', custody_blocked: false }, followups: [] })
    if (name === 'lumen_source_begin_experience') return fulfill(route, { episode_id:'ep-direct-premium', moment_id:'m-direct-premium', decision_run_id:'d-direct-premium', selection_id:'sel-direct-premium', help_id:premiumSourceItems[1].help_id, help_version_id:'hv-direct-premium', trace_id:'trace-direct-premium' })
    if (name === 'lumen_s1_accompany_moment') return fulfill(route, helpScene())
    if (name === 'lumen_s1_moment_constellation') return fulfill(route, { episode_id: helpScene().episode_id, moment_id: helpScene().moment_id, decision_run_id: helpScene().decision_run_id, capacity_keys: ['regulation'], area_keys: ['wellbeing'], trace_id: 'trace-constellation', items: sourceItems.map((item) => ({ ...item, primary_now: item.help_id === practice.help_id })) })
    if (name === 'lumen_s1_select_help') return fulfill(route, { selection_id: 'sel-1', episode_id: helpScene().episode_id, action: 'selected', help: practice, trace_id: 'trace-1' })
    if (name === 'lumen_s1_record_outcome') return fulfill(route, { selection_id: 'sel-1', episode_id: helpScene().episode_id, effect: 'helped', signal_kind: 'HELPED_NOW', applied: true, trace_id: 'trace-2', semantic_key: 'outcome.thank_and_release' })
    if (name === 'lumen_s2_add_repertoire') return fulfill(route, { repertoire_id: 'r-2', help_id: practice.help_id })
    if (name === 'lumen_s2_set_memory') return fulfill(route, { memory_allowed: false })
    if (name === 'lumen_s2_create_trajectory') return fulfill(route, { trajectory_id: 't-2' })
    if (name === 'lumen_s2_create_trajectory_from_moment') return fulfill(route, { trajectory_id: 't-moment', path_id: 'path-moment', faro_text: 'Vivir con más calma', status: 'active', capability_keys: ['regulation'], origin_moment_id: helpScene().moment_id })
    if (name === 'lumen_s2_set_trajectory_capabilities') return fulfill(route, { trajectory_id: 't-1', capability_keys: ['regulation','attention'] })
    if (name === 'lumen_s2_save_constellation_to_path') return fulfill(route, { trajectory_id: 't-moment', added_count: 2 })
    if (name === 'lumen_s2_add_path_reference') return fulfill(route, { path_item_id: 'p-ref' })
    if (name === 'lumen_s2_remove_path_item') return fulfill(route, { path_item_id: 'p-ref', removed: true })
    if (name === 'lumen_s2_reorder_path_item') return fulfill(route, { path_item_id: 'p-ref', position: 1 })
    if (name === 'lumen_s2_update_trajectory') return fulfill(route, { trajectory_id: 't-1', status: 'paused' })
    if (name === 'lumen_s2_add_path_item') return fulfill(route, { path_item_id: 'p-1' })
    if (name === 'lumen_s2_reuse_repertoire') return fulfill(route, { scene_id: 'continuity.cultivate', scene_version: 'v1', episode_id: 'ep-reuse', moment_id: 'm-reuse', decision_run_id: 'd-reuse', selection_id: 'sel-reuse', decision_kind: 'REPEAT', help: { ...practice, from_own_repertoire: true }, semantic_key: 'continuity.repeat', trace_id: 'trace-reuse' })
    if (name === 'lumen_s2_record_longitudinal_signal') return fulfill(route, { outcome_id: 'o-long', episode_id: 'ep-reuse', signal_kind: 'REPEATED', effect: 'helped', decision_kind: null, withdraw_decision_run_id: null, semantic_key: 'continuity.signal', trace_id: 'trace-long' })
    if (name === 'lumen_s6_set_proactivity') return fulfill(route, { proactive_allowed: true })
    if (name === 'lumen_s6_cancel_followup') return fulfill(route, { cancelled: true })
    if (name === 'lumen_s6_schedule_cultivation_followup') return fulfill(route, { followup_id: 'f-1' })
    if (name === 'lumen_s2_save_sanctuary') return fulfill(route, { entry_id: 's-2' })
    if (name === 'lumen_s2_update_sanctuary') return fulfill(route, { entry_id: 's-1', updated: true })
    if (name === 'lumen_s5_create_circle') return fulfill(route, { space_id: 'c-2' })
    if (name === 'lumen_s5_create_invite') return fulfill(route, { invite_token: '00000000-0000-0000-0000-000000000001' })
    if (name === 'lumen_s5_join_circle') return fulfill(route, { joined: true })
    if (name === 'lumen_s5_share_help') return fulfill(route, { shared: true })
    if (name === 'lumen_s5_leave_circle') return fulfill(route, { left: true })
    if (name === 'lumen_s5_report_circle') return fulfill(route, { reported: true })
    if (name === 'lumen_s2_export_sanctuary') return fulfill(route, { export_version: '1', generated_at: new Date().toISOString(), sanctuary_entries: [], trajectories: [], personal_repertoire: [] })
    if (name === 'lumen_s2_delete_sanctuary') return fulfill(route, { deleted: true })
    await route.abort()
  })
}

function nav(page: Page) { return page.getByRole('navigation', { name: 'Espacios de LUMEN' }) }
function utilities(page: Page) { return page.getByRole('navigation', { name: 'Utilidades' }) }

test('approved Premium design is the only public runtime shell', async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 1024 })
  await installRpcMocks(page, [])
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '¿Cómo estás hoy?' })).toBeVisible()
  await expect(nav(page)).toBeVisible()
  await expect(nav(page).getByRole('button', { name: 'Mi Vida', exact: true })).toBeVisible()
  await expect(nav(page).getByRole('button', { name: 'Explorar', exact: true })).toBeVisible()
  await expect(nav(page).getByRole('button', { name: 'Santuario', exact: true })).toBeVisible()
  await expect(nav(page).getByRole('button', { name: 'Tejido', exact: true })).toBeVisible()
  await expect(page.getByText('ALGUNAS FORMAS', { exact: false })).toBeVisible()
  await page.screenshot({ path: 'test-results/cleanroom-home.png', fullPage: true })
})

test('authenticated person can move through Mi Vida, Explorar, Santuario and Tejido in the same Field', async ({ page }) => {
  const calls: string[] = []
  await installSession(page)
  await installRpcMocks(page, calls)
  await page.goto('/')
  await nav(page).getByRole('button', { name: 'Mi Vida', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tu vida, aquí y ahora' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Vivir con más calma y presencia', exact: true })).toBeVisible()
  await nav(page).getByRole('button', { name: 'Explorar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Todo lo que puede ayudarte a vivir una vida más plena.' })).toBeVisible()
  await nav(page).getByRole('button', { name: 'Santuario', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Aquí vive lo que importa.' })).toBeVisible()
  await nav(page).getByRole('button', { name: 'Tejido', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'La vida también se vive con otros.' })).toBeVisible()
  expect(calls).toContain('lumen_s2_snapshot')
  expect(calls).toContain('lumen_s5_snapshot')
  expect(calls).toContain('lumen_s6_snapshot')
})

test('Momento composes singular constellation with LUMI, immediate help and voluntary continuity', async ({ page }) => {
  const calls: string[] = []
  await installSession(page)
  await installRpcMocks(page, calls)
  await page.goto('/')
  await page.getByLabel('Lo que te está pasando').fill('Estoy saturada y necesito bajar un poco la intensidad.')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('LUMI · P2')).toBeVisible()
  await expect(page.getByText('UNA CONSTELACIÓN PARA ESTE MOMENTO')).toBeVisible()
  await expect(page.getByText(/PARA AHORA/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Llegar al cuerpo' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'En tiempos de estrés: haz lo que importa' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Regulación' }).first()).toHaveClass(/active/)
  await page.getByRole('button', { name: 'Vivir esta posibilidad' }).first().click()
  await expect(page.locator('.experience-practice')).toBeVisible()
  await page.getByRole('button', { name: 'Seguir' }).click()
  await page.getByRole('button', { name: 'Seguir' }).click()
  await page.getByRole('button', { name: 'Terminé' }).click()
  await expect(page.getByRole('heading', { name: '¿Cómo fue para vos?' })).toBeVisible()
  await page.getByRole('button', { name: 'Me ayudó', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Gracias. Con esto alcanza por ahora.' })).toBeVisible()
  await page.getByRole('button', { name: /Guardar .* en mi repertorio/ }).click()
  await expect.poll(() => calls.includes('lumen_s2_add_repertoire')).toBe(true)
  expect(calls).toContain('lumen_s1_accompany_moment')
  expect(calls).toContain('lumen_s1_moment_constellation')
  expect(calls).toContain('lumen_s1_select_help')
  expect(calls).toContain('lumen_s1_record_outcome')
})

test('Fuente preserves the nature and provenance of an external resource', async ({ page }) => {
  const calls: string[] = []
  await installRpcMocks(page, calls)
  await page.goto('/')
  await nav(page).getByRole('button', { name: 'Explorar', exact: true }).click()
  await page.getByRole('button', { name: 'Vivir esta posibilidad' }).first().click()
  await expect(page.getByRole('heading', { name: 'En tiempos de estrés: haz lo que importa' })).toBeVisible()
  await expect(page.getByText('Fuente: World Health Organization')).toBeVisible()
  await expect(page.getByRole('link', { name: /Abrir en su fuente/ })).toBeVisible()
})

test('Capacidades compose a real constellation instead of filtering a painted catalogue', async ({ page }) => {
  const calls: string[] = []
  await installRpcMocks(page, calls)
  await page.goto('/')
  await nav(page).getByRole('button', { name: 'Explorar', exact: true }).click()
  await page.getByRole('button', { name: /Regulación.*Componer constelación/ }).click()
  await expect(page.getByRole('heading', { name: 'Constelación para Regulación' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Comprender' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Practicar' })).toBeVisible()
  expect(calls).toContain('lumen_source_constellation')
})

test('Explore keeps duration and format filters hidden until the person asks for them', async ({ page }) => {
  await installRpcMocks(page, [])
  await page.goto('/')
  await nav(page).getByRole('button', { name: 'Explorar', exact: true }).click()
  const toggle = page.getByRole('button', { name: 'Filtros', exact: true })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.click()
  await expect(page.getByLabel('Duración')).toBeVisible()
  await expect(page.getByLabel('Formato')).toBeVisible()
  await page.getByLabel('Duración').selectOption('quick')
  await expect(page.getByRole('heading', { name: 'Llegar al cuerpo' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'En tiempos de estrés: haz lo que importa' })).toHaveCount(0)
  await page.getByLabel('Duración').selectOption('all')
  await page.getByLabel('Formato').selectOption('practice')
  await expect(page.getByRole('heading', { name: 'Llegar al cuerpo' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Orientación pública de bienestar' })).toHaveCount(0)
})

test('Repertoire can be reused longitudinally through repeat and explicit signal', async ({ page }) => {
  const calls: string[] = []
  await installSession(page)
  await installRpcMocks(page, calls)
  await page.goto('/')
  await nav(page).getByRole('button', { name: 'Mi Vida', exact: true }).click()
  await page.getByRole('button', { name: 'Repetir', exact: true }).click()
  await expect(page.locator('.experience-practice')).toBeVisible()
  await page.getByRole('button', { name: 'Seguir' }).click()
  await page.getByRole('button', { name: 'Seguir' }).click()
  await page.getByRole('button', { name: 'Terminé' }).click()
  await expect(page.getByRole('heading', { name: '¿Cómo fue para vos?' })).toBeVisible()
  await page.getByRole('button', { name: 'Me ayudó', exact: true }).click()
  await expect.poll(() => calls.includes('lumen_s2_record_longitudinal_signal')).toBe(true)
  expect(calls).toContain('lumen_s2_reuse_repertoire')
})

test('Sidebar utilities are functional rather than inert controls', async ({ page }) => {
  const calls: string[] = []
  await installSession(page)
  await installRpcMocks(page, calls)
  await page.goto('/')
  await utilities(page).getByRole('button', { name: 'Buscar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Encontrar sin perderte en un catálogo.' })).toBeVisible()
  await page.getByPlaceholder('¿Qué estás buscando?').fill('estrés')
  await expect(page.getByText(/resultados/)).toBeVisible()
  await utilities(page).getByRole('button', { name: 'Ajustes', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tu soberanía también se configura.' })).toBeVisible()
  await expect(page.getByLabel('Memoria')).toBeVisible()
  await utilities(page).getByRole('button', { name: 'Notificaciones', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Continuidad sin perseguirte.' })).toBeVisible()
})


test('Inicio and LUMI circulate contextual value across the existing organism', async ({ page }) => {
  await installSession(page)
  await installRpcMocks(page, [])
  await page.goto('/')
  await expect(page.getByText('Tu Faro sigue disponible', { exact: true })).toBeVisible()
  await expect(page.getByText('Relacionado con tu Faro', { exact: true })).toBeVisible()
  await page.getByText('Tu Faro sigue disponible', { exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tu vida, aquí y ahora' })).toBeVisible()

  await nav(page).getByRole('button', { name: 'Explorar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Relacionado con tu Faro' })).toBeVisible()
  await page.getByRole('button', { name: 'Abrir LUMI' }).click()
  await expect(page.getByText('LUMI · EXPLORAR', { exact: true })).toBeVisible()
  await expect(page.getByText('Fuente no es un catálogo.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar LUMI' }).click()

  await nav(page).getByRole('button', { name: 'Santuario', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Conexiones con tu Faro' })).toBeVisible()

  await nav(page).getByRole('button', { name: 'Tejido', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Relacionado con tu Faro' })).toBeVisible()
})


test('regulation_premium_v1 is visible and can be lived end to end inside the LUMEN field', async ({ page }) => {
  await installSession(page)
  const calls:string[]=[]
  await installRpcMocks(page,calls)
  await page.goto('/')
  await nav(page).getByRole('button',{name:'Explorar',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Constelaciones destacadas'})).toBeVisible()
  const premium=page.getByRole('button',{name:/CONSTELACIÓN PREMIUM.*Regulación/i})
  await expect(premium).toBeVisible()
  await premium.click()
  await expect(page.getByText('CONSTELACIÓN PREMIUM · FUENTE',{exact:true})).toBeVisible()
  for (const item of premiumSourceItems) await expect(page.getByRole('heading',{name:item.title,exact:true})).toBeVisible()
  await page.getByRole('heading',{name:'Poner los pies en la tierra · audio OPS/OMS',exact:true}).locator('..').getByRole('button',{name:'Vivir esta posibilidad'}).click()
  await expect(page.getByText('PRÁCTICA GUIADA · FUENTE ORIGINAL',{exact:true})).toBeVisible()
  await expect(page.getByRole('link',{name:'Escuchar en su fuente ↗'})).toHaveAttribute('href',/paho_grounding_audio_es/)
  await page.getByRole('button',{name:'Volver a la constelación'}).click()
  await expect(page.getByRole('heading',{name:'¿Cómo fue para vos?'})).toBeVisible()
  await page.getByRole('button',{name:'Me ayudó'}).click()
  await expect(page.getByText('CONSTELACIÓN PREMIUM · FUENTE',{exact:true})).toBeVisible()
  expect(calls).toContain('lumen_source_begin_experience')
  expect(calls).toContain('lumen_s1_record_outcome')
})

test('Santuario filters operate on sovereign stored entries', async ({ page }) => {
  await installSession(page)
  await installRpcMocks(page, [])
  await page.goto('/')
  await nav(page).getByRole('button', { name: 'Santuario', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Una idea que quiero recordar' })).toBeVisible()
  await page.getByRole('button', { name: 'Notas', exact: true }).click()
  await expect(page.getByText('No hay elementos de este tipo.')).toBeVisible()
  await page.getByRole('button', { name: 'Reflexiones', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Una idea que quiero recordar' })).toBeVisible()
})
