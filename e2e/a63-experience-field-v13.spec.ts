import { expect, test } from '@playwright/test'

const PATH = '/a63-lumen-experience-field-v13-complete.html'

test('V55.3 arrival stays relational and free-expression first', async ({ page }) => {
  await page.goto(PATH)
  await expect(page.getByRole('heading', { name: '¿Qué está vivo ahora?' })).toBeVisible()
  await expect(page.getByLabel('Expresión libre')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Quiero explorar' })).toBeVisible()
  await expect(page.getByText('No necesitás elegir una parte de LUMEN ni saber qué pedir.')).toBeVisible()
})

test('Explore opens a living heterogeneous reservoir without becoming the default entrance', async ({ page }) => {
  await page.goto(PATH)
  await page.getByRole('button', { name: 'Quiero explorar' }).click()
  await expect(page.getByRole('heading', { name: '¿Qué podría ser valioso para tu vida ahora?' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Comprender/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Practicar/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Encontrarnos/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Recibir ayuda/ })).toBeVisible()
})

test('Moment can move from expression to possibility to life to return and integration', async ({ page }) => {
  await page.goto(PATH)
  await page.getByLabel('Expresión libre').fill('Estoy muy agobiado y necesito un poco de espacio.')
  await page.getByRole('button', { name: 'Compartir' }).click()
  await expect(page.getByRole('heading', { name: 'Parece que esto está ocupando bastante espacio.' })).toBeVisible()
  await page.getByRole('button', { name: 'Sí, es por ahí' }).click()
  await expect(page.getByRole('heading', { name: 'Hay algo que podría tener sentido ahora.' })).toBeVisible()
  await page.getByRole('button', { name: 'Quiero probarlo' }).click()
  await expect(page.getByRole('heading', { name: 'Volvé al apoyo que ya está acá.' })).toBeVisible()
  await page.getByRole('button', { name: 'Me voy un momento' }).click()
  await expect(page.getByRole('heading', { name: 'Ahora puede tocar vivir.' })).toBeVisible()
  await page.getByRole('button', { name: 'Volví' }).click()
  await page.getByRole('button', { name: 'Algo me ayudó' }).click()
  await expect(page.getByRole('heading', { name: 'Quizá hay algo que valga la pena llevarse.' })).toBeVisible()
})

test('NO_MATCH stays honest and offers safe exits instead of filler', async ({ page }) => {
  await page.goto(PATH)
  await page.getByRole('button', { name: 'Abrir escenarios de prueba' }).click()
  await page.getByLabel('Entrada').selectOption('nomatch')
  await page.getByRole('button', { name: 'Abrir escenario' }).click()
  await expect(page.getByRole('heading', { name: 'No tengo algo suficientemente bueno para ofrecerte ahora.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Buscar ayuda humana/material' })).toBeVisible()
})

test('consented continuity can be resumed, edited or dropped without progress pressure', async ({ page }) => {
  await page.goto(PATH)
  await page.getByRole('button', { name: 'Abrir escenarios de prueba' }).click()
  await page.getByLabel('Entrada').selectOption('faro')
  await page.getByRole('button', { name: 'Abrir escenario' }).click()
  await page.getByRole('button', { name: 'Hay un hilo anterior disponible, si hoy importa.' }).click()
  await expect(page.getByText('No hay porcentaje ni tareas pendientes.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cambiarlo' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Soltar este Faro' })).toBeVisible()
})

test('human encounter makes LUMEN withdraw and preserves exit/report', async ({ page }) => {
  await page.goto(PATH)
  await page.getByRole('button', { name: 'Abrir escenarios de prueba' }).click()
  await page.getByLabel('Entrada').selectOption('human')
  await page.getByRole('button', { name: 'Abrir escenario' }).click()
  await page.getByRole('button', { name: 'Entrar al encuentro' }).click()
  await expect(page.getByRole('heading', { name: 'Ahora, Vida acompaña Vida.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Salir / reportar' })).toBeVisible()
})

test('proactivity exposes its reason and can be disabled immediately', async ({ page }) => {
  await page.goto(PATH)
  await page.getByRole('button', { name: 'Abrir escenarios de prueba' }).click()
  await page.getByLabel('Entrada').selectOption('proactive')
  await page.getByRole('button', { name: 'Abrir escenario' }).click()
  await expect(page.getByText('La razón es visible')).toBeVisible()
  await page.getByRole('button', { name: 'No me recuerdes esto' }).click()
  await expect(page.getByRole('heading', { name: 'Esta continuidad ya no genera recordatorios.' })).toBeVisible()
})