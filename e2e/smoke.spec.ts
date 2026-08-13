import { test, expect } from '@playwright/test'

test('LUMEN arranca y renderiza la experiencia inicial', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('/')

  // BottomNav (src/components/BottomNav.tsx) renderiza este botón desde el
  // primer render de App, independiente de la respuesta de Supabase: es
  // evidencia estable de que la app montó su shell principal.
  await expect(page.getByRole('button', { name: 'LUMI' })).toBeVisible()

  expect(pageErrors).toEqual([])
})
