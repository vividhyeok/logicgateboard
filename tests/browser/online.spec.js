import { test, expect } from '@playwright/test'

// Opt-in: creates one temporary room in the configured Firebase database.
test('two real clients: invite, private inputs, game, inspection, rematch and leave', async ({ browser }) => {
  test.skip(process.env.RUN_LIVE_ONLINE !== '1', 'Set RUN_LIVE_ONLINE=1 to exercise the configured database')
  test.setTimeout(180000)
  const hostContext = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const guestContext = await browser.newContext({ viewport: { width: 768, height: 1024 }, hasTouch: true })
  const host = await hostContext.newPage(), guest = await guestContext.newPage()
  const errors = []
  for (const page of [host, guest]) page.on('pageerror', error => errors.push(error.message))
  try {
    await host.goto('/?online=1')
    await host.getByRole('button', { name: '방 만들기', exact: true }).click()
    const code = await host.locator('.lobby-card h1').textContent()
    await guest.goto(`/?online=1&room=${code}`)
    await expect(host.getByRole('button', { name: '교차 합류형 시작' })).toBeEnabled({ timeout: 45000 })
    await host.getByRole('button', { name: '교차 합류형 시작' }).click()
    for (const page of [host, guest]) await expect(page.locator('.coin-overlay')).toBeHidden()
    for (const page of [host, guest]) {
      const target = page.getByRole('button', { name: '내 목표 0' })
      if (await target.isVisible()) await target.click()
    }
    for (const page of [host, guest]) {
      await expect(page.locator('.setup-hand')).toBeVisible()
      await page.locator('.setup-value-card').first().click()
      await page.getByRole('button', { name: '입력 확정' }).click()
    }
    await expect(host.locator('.setup-hand')).toBeHidden()
    await expect(guest.locator('.setup-hand')).toBeHidden()
    for (const page of [host, guest]) {
      const opponent = page === host ? 2 : 1
      await expect(page.locator(`.input-value-card.owner-${opponent} .value-card-back strong`)).toHaveText('?')
    }
    for (let turn = 0; turn < 4; turn++) {
      await expect(async () => {
        const available = await host.locator('.current-hand .logic-card:enabled').count() + await guest.locator('.current-hand .logic-card:enabled').count()
        expect(available).toBeGreaterThan(0)
      }).toPass({ timeout: 20000 })
      const active = await host.locator('.current-hand .logic-card:enabled').count() ? host : guest
      if (turn === 0) {
        // Dropping a gate on a wild slot must not send an invalid command
        // that leaves the guest stuck in the syncing state.
        const card = active.locator('.current-hand .logic-card:enabled').first()
        await card.click()
        const from = await card.boundingBox(), to = await active.locator('.wild-slot').first().boundingBox()
        await active.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
        await active.mouse.down()
        await active.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 })
        await active.mouse.up()
        await expect(active.locator('.sync-banner')).toHaveCount(0)
        await expect(active.locator('.card-slot.filled')).toHaveCount(0)
        await active.keyboard.press('Escape')
      }
      await active.locator('.current-hand .logic-card:enabled').first().click()
      await active.locator('.card-slot.legal').first().click()
      await expect(host.locator('.card-slot.filled')).toHaveCount(turn < 3 ? turn + 1 : 5)
      await expect(guest.locator('.card-slot.filled')).toHaveCount(turn < 3 ? turn + 1 : 5)
    }
    for (const page of [host, guest]) await expect(page.locator('.online-result-overlay')).toBeVisible({ timeout: 20000 })
    expect(await host.locator('.result-output-orb strong').textContent()).toBe(await guest.locator('.result-output-orb strong').textContent())
    await guest.getByRole('button', { name: '보드 살펴보기' }).click()
    await guest.getByRole('button', { name: '결과 다시 보기' }).click()
    await host.getByRole('button', { name: '이 맵 다시 하기' }).click()
    await expect(guest.locator('.coin-overlay')).toBeVisible()
    expect(errors).toEqual([])
  } finally {
    // Only close the room created by this test.
    host.on('dialog', dialog => dialog.accept())
    await host.locator('.coin-overlay').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
    const leave = host.getByRole('button', { name: '← 나가기' })
    if (await leave.isVisible()) await leave.click()
    else if (await host.getByRole('button', { name: '처음으로', exact: true }).isVisible()) await host.getByRole('button', { name: '처음으로', exact: true }).click()
    await expect(host.locator('.launcher-page')).toBeVisible()
    await hostContext.close()
    await guestContext.close()
  }
})
