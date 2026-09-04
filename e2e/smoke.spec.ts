import { expect, test, type Page } from '@playwright/test'

const PROJECT_REF = 'vbuixagaguasejputubp'
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`

async function installSyntheticSession(page: Page) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  await page.addInitScript(({ storageKey, expiresAtValue }) => {
    localStorage.setItem(storageKey, JSON.stringify({
      access_token: 'synthetic-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: expiresAtValue,
      refresh_token: 'synthetic-refresh-token',
      user: {
        id: '10000000-0000-0000-0000-000000000101',
        aud: 'authenticated',
        role: 'authenticated',
        email: 's1-preview@example.invalid',
        email_confirmed_at: new Date().toISOString(),
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {},
        identities: [],
        created_at: new Date().toISOString(),
      },
    }))
  }, { storageKey: STORAGE_KEY, expiresAtValue: expiresAt })
}

function helpScene() {
  return {
    scene_id: 'moment.help',
    scene_version: 's1.v1',
    presence_mode: 'P2',
    human_intent: 'move_forward',
    episode_id: '30000000-0000-0000-0000-000000000101',
    moment_id: '40000000-0000-0000-0000-000000000101',
    decision_run_id: '50000000-0000-0000-0000-000000000101',
    trace_id: '60000000-0000-0000-0000-000000000101',
    semantic_blocks: [
      { type: 'lumi_line', semantic_key: 'help.offer_humble' },
      {
        type: 'help_preview',
        primary: {
          help_id: '70000000-0000-0000-0000-000000000101',
          help_version_id: '80000000-0000-0000-0000-000000000101',
          help_type: 'practice',
          title: 'Un paso más pequeño',
          summary: 'Convertir algo trabado en una acción que sí pueda empezar.',
          content: {
            intro: 'No hace falta resolver todo. Busquemos el próximo gesto posible.',
            steps: [
              'Nombrá lo que querés mover.',
              'Reducilo hasta una acción de menos de diez minutos.',
              'Elegí: hacerlo ahora o dejar definido cuándo.',
            ],
          },
          duration_minutes: 3,
          energy: 'low',
          detail: {},
        },
        alternative: null,
      },
    ],
    available_actions: [
      { id: 'try_primary', intent: 'select_help', payload: { help_id: '70000000-0000-0000-0000-000000000101' } },
      { id: 'not_this', intent: 'reject_help' },
    ],
    safety: { state: 'clear' },
    coverage: { state: 'covered' },
    interpretation: { intent_key: 'move_forward', confidence: 0.8, uncertainty_key: null },
  }
}

test('S1 Home exposes free expression before progressive authentication', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Estoy acá.' })).toBeVisible()
  await expect(page.getByLabel('Lo que te está pasando')).toBeVisible()
  await expect(page.getByText('No hace falta elegir una categoría.')).toBeVisible()

  await page.getByLabel('Lo que te está pasando').fill('Tengo demasiadas cosas en la cabeza y no sé por dónde empezar.')
  await page.getByRole('button', { name: 'Ver qué podría ayudarme' }).click()

  await expect(page.getByRole('heading', { name: 'Antes de seguir' })).toBeVisible()
  await expect(page.getByText('sin mezclar vidas')).toBeVisible()
  await expect(page.getByLabel('Tu correo')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ahora no' })).toBeVisible()
})

test('S1 Preview completes visible Momento → Ayuda → Retorno using the public RPC contract', async ({ page }) => {
  await installSyntheticSession(page)

  const calls: string[] = []
  await page.route(`${SUPABASE_URL}/rest/v1/rpc/**`, async (route) => {
    const url = route.request().url()
    const name = url.split('/').pop() || ''
    calls.push(name)

    if (name === 'lumen_s1_accompany_moment') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(helpScene()) })
      return
    }

    if (name === 'lumen_s1_select_help') {
      const primary = (helpScene().semantic_blocks[1] as { primary: Record<string, unknown> }).primary
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          episode_id: helpScene().episode_id,
          action: 'selected',
          help: primary,
          trace_id: '60000000-0000-0000-0000-000000000102',
        }),
      })
      return
    }

    if (name === 'lumen_s1_record_outcome') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          episode_id: helpScene().episode_id,
          effect: 'helped',
          applied: true,
          trace_id: '60000000-0000-0000-0000-000000000103',
          semantic_key: 'outcome.thank_and_release',
        }),
      })
      return
    }

    await route.abort()
  })

  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible()

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
  expect(calls).toEqual([
    'lumen_s1_accompany_moment',
    'lumen_s1_select_help',
    'lumen_s1_record_outcome',
  ])
})
