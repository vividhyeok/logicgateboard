import { test, expect } from '@playwright/test'

async function prepare(page, level = 1, index = 0) {
  await page.goto('/?local=1')
  await page.getByRole('button', { name: `난이도 ${level}`, exact: false }).click()
  await page.getByRole('button', { name: '시작 →' }).nth(index).click()
  await expect(page.locator('.coin-overlay')).toBeHidden()
  const target = page.getByRole('button', { name: '내 목표 0' })
  if (await target.isVisible()) await target.click()
  await expect(page.locator('.setup-hand')).toBeVisible()
  const choices = page.locator('.setup-pair')
  const count = await choices.count()
  for (let i = 0; i < count; i++) {
    const choice = choices.nth(i)
    const id = await choice.locator(':scope > b').textContent()
    await choice.getByRole('button', { name: `${id} 입력 0 카드` }).click()
    await expect(page.getByRole('button', { name: `입력 ${id} 값 0`, exact: true })).toBeVisible()
    // Replacing a draft is one click too; it does not commit the input.
    await choice.getByRole('button', { name: `${id} 입력 1 카드` }).click()
    await expect(page.getByRole('button', { name: `입력 ${id} 값 1`, exact: true })).toBeVisible()
  }
  await page.getByRole('button', { name: '입력 확정' }).click()
  await expect(page.locator('.current-hand .logic-card:enabled').first()).toBeEnabled()
}

async function completeGame(page) {
  for (let turn = 0; turn < 10; turn++) {
    if (await page.locator('.result-overlay').count()) return
    const card = page.locator('.current-hand .logic-card:enabled').first()
    await expect(async () => {
      expect(await page.locator('.result-overlay').count() || await card.count()).toBeTruthy()
    }).toPass({ timeout: 20000 })
    if (await page.locator('.result-overlay').count()) return
    await card.click()
    const slot = page.locator('.card-slot.legal').first()
    await expect(slot).toBeVisible()
    await slot.click()
  }
  throw new Error('Game did not finish')
}

for (const viewport of [{ width: 1366, height: 768 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport, hasTouch: viewport.width <= 1024 })
    for (const level of [1, 2]) for (let map = 0; map < 3; map++) {
      test(`level ${level} map ${map + 1}: setup, play, inspect and replay`, async ({ page }, info) => {
        const errors = []
        page.on('pageerror', error => errors.push(error.message))
        await prepare(page, level, map)
        const box = await page.locator('.board-frame').boundingBox()
        expect(box.width).toBeGreaterThan(620)
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
        const hand = await page.locator('.current-hand').boundingBox()
        expect(hand.y + hand.height).toBeLessThanOrEqual(viewport.height)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        await page.screenshot({ path: info.outputPath('table.png'), fullPage: true })
        // Help closes with Escape and returns focus without changing play state.
        await page.getByRole('button', { name: '게임 방법' }).click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(page.getByRole('dialog')).toBeHidden()
        await completeGame(page)
        await page.getByRole('button', { name: '보드 살펴보기' }).click()
        await expect(page.locator('.result-overlay')).toBeHidden()
        await expect(page.locator('.board-wire-signal').first()).toBeVisible()
        await page.getByRole('button', { name: '결과 다시 보기' }).click()
        await page.keyboard.press('Shift+Tab')
        expect(await page.locator('.result-overlay').evaluate(element => element.contains(document.activeElement))).toBe(true)
        await page.getByRole('button', { name: '다시 하기', exact: true }).click()
        await expect(page.locator('.coin-overlay')).toBeVisible()
        expect(errors).toEqual([])
      })
    }
  })
}

test('wild flip selects the new face; Escape cancels; drag places exactly once', async ({ page }) => {
  await prepare(page)
  const flip = page.locator('.wild-flip-button')
  if (await flip.count()) {
    await flip.click()
    await expect(page.locator('.wild-card.selected')).toHaveAttribute('aria-label', '와일드 통과 카드')
    await expect(page.locator('.card-slot.legal')).toHaveCount(2)
    await page.keyboard.press('Escape')
    await expect(page.locator('.card-slot.legal')).toHaveCount(0)
  }
  const card = page.locator('.current-hand .logic-card:enabled').first()
  await card.click()
  const target = page.locator('.card-slot.legal').first()
  const id = await target.getAttribute('data-slot-id')
  const from = await card.boundingBox(), to = await target.boundingBox()
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 24 })
  await page.mouse.up()
  await expect(page.locator(`[data-slot-id="${id}"]`)).toHaveClass(/filled/)
})

test('storage denial does not prevent starting a game', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('denied') }; Storage.prototype.setItem = () => { throw new Error('denied') } })
  await prepare(page)
  await expect(page.locator('.board-frame')).toBeVisible()
})

test('reduced motion retains setup and keyboard placement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await prepare(page)
  const card = page.locator('.current-hand .logic-card:enabled').first()
  await card.focus()
  await page.keyboard.press('Enter')
  const slot = page.locator('.card-slot.legal').first()
  const id = await slot.getAttribute('data-slot-id')
  await slot.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator(`[data-slot-id="${id}"]`)).toHaveClass(/filled/)
})
