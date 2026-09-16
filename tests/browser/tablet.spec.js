import { test, expect } from '@playwright/test'

for (const browserName of ['chromium', 'webkit']) {
  test.describe(`${browserName} tablet touch`, () => {
    test('tap input once, tap card and destination, rotate without losing the game', async ({ playwright }) => {
      const browser = await playwright[browserName].launch()
      const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173', viewport: { width: 768, height: 1024 }, hasTouch: true })
      const page = await context.newPage()
      try {
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto('/?local=1')
      await page.getByRole('button', { name: '시작 →' }).first().tap()
      await expect(page.locator('.coin-overlay')).toBeHidden()
      const target = page.getByRole('button', { name: '내 목표 0' })
      if (await target.isVisible()) await target.tap()
      await expect(page.locator('.setup-hand')).toBeVisible()
      await page.locator('.setup-value-card').first().tap()
      await expect(page.getByRole('button', { name: '입력 확정' })).toBeEnabled()
      await page.getByRole('button', { name: '입력 확정' }).tap()
      const card = page.locator('.current-hand .logic-card:enabled').first()
      await expect(card).toBeEnabled()
      await card.tap()
      const slot = page.locator('.card-slot.legal').first()
      const id = await slot.getAttribute('data-slot-id')
      await slot.tap()
      await expect(page.locator(`[data-slot-id="${id}"]`)).toHaveClass(/filled/)
      await expect(page.locator('.board-canvas')).not.toHaveClass(/has-node-focus/)
      await page.setViewportSize({ width: 1024, height: 768 })
      await expect(page.locator(`[data-slot-id="${id}"]`)).toHaveClass(/filled/)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      expect(errors).toEqual([])
      } finally { await browser.close() }
    })
  })
}
