import { expect, test } from '@playwright/test'

test('S0 greenfield shell is the active runtime', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Foundation Greenfield' })).toBeVisible()
  await expect(page.getByText('Modular monolith · V40')).toBeVisible()
  await expect(page.getByText('M5')).toBeVisible()
  await expect(page.getByText('Sanctuary')).toBeVisible()
  await expect(page.getByText('S0 no implementa todavía acompañamiento')).toBeVisible()
})
