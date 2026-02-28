import { test, expect } from '@playwright/test'

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/')
  
  await expect(page).toHaveTitle(/Mobilidade Urbana/)
  await expect(page.locator('h1')).toContainText('Sistema de Mobilidade Urbana')
})

