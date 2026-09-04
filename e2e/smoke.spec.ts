import { expect, test } from '@playwright/test'

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
