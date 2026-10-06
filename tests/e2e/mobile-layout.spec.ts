import { expect, test, type Locator, type Page } from '@playwright/test'

async function expectOnScreen(page: Page, locator: Locator): Promise<void> {
  await expect(locator).toBeVisible()
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  const viewport = page.viewportSize()!
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
}

test('phone setup keeps actions reachable while switching and editing long settings', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Phone-specific layout is covered once.')
  await page.setViewportSize({ width: 393, height: 700 })
  const setups = [
    { game: 'avalon', action: '洗牌並分配身份' },
    { game: 'undercover', action: '抽詞並分配' },
    { game: 'charades', action: '建立牌庫並分隊' },
    { game: 'fake-artist', action: '抽題並分配身份' },
    { game: 'wavelength', action: '開始調頻' }
  ]
  for (const setup of setups) {
    await page.goto(`/#/${setup.game}/setup`)
    const start = page.getByRole('button', { name: setup.action, exact: true })
    await expectOnScreen(page, start)
    await expect(page.locator('.setup-flow > .setup-panel:visible')).toHaveCount(1)
    const tabs = page.getByRole('navigation', { name: '設定分頁' }).getByRole('button')
    for (let index = 1; index < await tabs.count(); index += 1) {
      await tabs.nth(index).click()
      await expect(tabs.nth(index)).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('.setup-flow > .setup-panel:visible')).toHaveCount(1)
      await expectOnScreen(page, start)
    }
    await tabs.first().click()
    await page.getByRole('textbox', { name: '玩家 1 名稱' }).fill('這是一個很長的玩家名稱')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expectOnScreen(page, start)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393)
    const canvasColor = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--game-background').trim())
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', canvasColor)
  }

  await page.goto('/#/undercover/setup')
  await page.getByRole('navigation', { name: '設定分頁' }).getByRole('button', { name: /主題/ }).click()
  const categories = page.getByRole('combobox', { name: '選擇題目主題' })
  await categories.selectOption({ label: '台灣美食' })
  await expect(page.locator('.action-dock')).toContainText('台灣美食')
  await page.setViewportSize({ width: 393, height: 852 })
  await page.screenshot({ path: '.artifacts/screenshots/mobile-category-compact.png' })
  await page.setViewportSize({ width: 768, height: 1024 })
  await expect(page.getByRole('button', { name: /台灣美食/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.setup-flow > .setup-panel:visible')).toHaveCount(3)
})

test('phone identity prioritizes the role and private intel without pushing the action away', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Phone identity layout is covered once.')
  await page.setViewportSize({ width: 393, height: 700 })
  await page.goto('/#/avalon/setup')
  await page.getByRole('button', { name: '洗牌並分配身份' }).click()
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole('button', { name: `我是 玩家 ${index + 1}，繼續` }).click()
    const hold = page.getByRole('button', { name: '按住以揭露身份' })
    await expectOnScreen(page, hold)
    await hold.hover()
    await page.mouse.down()
    await page.waitForTimeout(720)
    await page.mouse.up()
    const next = page.getByRole('button', { name: index === 4 ? '我看完了，開始遊戲' : '我看完了，交給下一位' })
    await expect(next).toBeVisible()
    await page.waitForTimeout(300)
    await expectOnScreen(page, next)
    await expectOnScreen(page, page.locator('.intel-box'))
    await expect(page.locator('.identity-card-area')).toBeHidden()
    await expect(page.locator('.identity-details .ability-copy')).toBeHidden()
    await page.getByText('角色能力與說明', { exact: true }).click()
    await expect(page.locator('.identity-details .ability-copy')).toBeVisible()
    await expectOnScreen(page, next)
    const role = await page.locator('.identity-info h1').textContent()
    if (role?.includes('梅林')) {
      await page.getByText('角色能力與說明', { exact: true }).click()
      await page.setViewportSize({ width: 393, height: 852 })
      await page.waitForTimeout(250)
      await page.screenshot({ path: '.artifacts/screenshots/mobile-merlin-compact.png' })
      await page.setViewportSize({ width: 393, height: 700 })
    }
    await next.click()
  }
  await expect(page.getByRole('heading', { name: /所有身份/ })).toBeVisible()
})
