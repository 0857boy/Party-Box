import { expect, test } from '@playwright/test'

test('all eleven themes are available directly, counts follow difficulty and every category can start', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Content combinations are covered once.')
  await page.goto('/#/charades/setup')
  const category = page.getByRole('combobox', { name: '選擇題目主題' })
  const difficulty = page.getByRole('combobox', { name: '題目難度' })
  await expect(category.locator('option')).toHaveCount(11)
  await expect(category).not.toContainText('動作職業')
  await expect(category).not.toContainText('成語表情')
  for (const level of ['easy', 'normal', 'hard']) {
    await difficulty.selectOption(level)
    for (const theme of ['mixed', 'animals', 'food', 'life', 'jobs', 'sports', 'things', 'characters', 'idioms', 'emotions', 'celebrities']) {
      await category.selectOption(theme)
      await expect(page.getByRole('button', { name: '建立牌庫並分隊' })).toBeEnabled()
      const text = await category.locator(`option[value="${theme}"]`).textContent()
      expect(Number(text!.match(/(\d+) 題/)![1])).toBeGreaterThanOrEqual(20)
    }
  }
  await difficulty.selectOption('easy')
  await category.selectOption('jobs')
  await expect(category.locator('option[value="jobs"]')).toHaveText('職業達人 · 30 題')
  await page.reload()
  await expect(category).toHaveValue('jobs')
  await page.screenshot({ path: '.artifacts/screenshots/charades-category-overview.png' })
  await page.clock.install()
  await page.getByRole('button', { name: '建立牌庫並分隊' }).click()
  await page.getByRole('button', { name: '開始計時' }).click()
  await page.clock.runFor(3000)
  await expect(page.locator('.charades-word-card h1')).toBeVisible()
  expect([...(await page.locator('.charades-word-card h1').textContent())!.trim()].length).toBeLessThanOrEqual(6)
  await page.locator('.swipe-card').press('ArrowRight')
  await expect(page.locator('.charades-card-score')).toContainText('1')
})

test('unknown saved theme safely falls back without discarding teams or difficulty', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Migration is covered once.')
  await page.addInitScript(() => localStorage.setItem('party-box:charades:setup', JSON.stringify({ version: 3, data: {
    playerNames: ['小安', '小葵', '阿哲', '美玲'], teamNames: ['橘子隊', '綠茶隊'], teamAssignments: [0, 1, 0, 1],
    category: 'old-unknown-theme', deckSize: 32, turnSeconds: 60, mode: 'quick', difficulty: 'hard', clueStyle: 'describe', turnsPerTeam: 1
  } })))
  await page.goto('/#/charades/setup')
  await expect(page.getByRole('combobox', { name: '選擇題目主題' })).toHaveValue('mixed')
  await expect(page.getByRole('combobox', { name: '題目難度' })).toHaveValue('hard')
  await expect(page.getByRole('combobox', { name: '提示方式' })).toHaveValue('describe')
  await page.getByRole('button', { name: '編輯玩家分隊' }).click()
  await expect(page.getByRole('textbox', { name: '第一隊隊名' })).toHaveValue('橘子隊')
  await expect(page.getByRole('textbox', { name: '第二隊隊名' })).toHaveValue('綠茶隊')
})

test('new themes remain usable offline with the original MOE usage notices cached', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Offline coverage is shared across viewports.')
  await page.goto('/#/charades/setup')
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  // Prompt-style service workers control a new navigation, not necessarily
  // the first page. Navigate once online before exercising cached resources.
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('combobox', { name: '選擇題目主題' }).selectOption('emotions')
  await expect(page.getByRole('button', { name: '建立牌庫並分隊' })).toBeEnabled()
  const notices = await page.evaluate(async () => Promise.all(['moe-idioms-public-license.pdf', 'moe-concised-public-license.pdf'].map(async file => {
    const response = await fetch(`./licenses/${file}`)
    return { status: response.status, header: new TextDecoder().decode((await response.arrayBuffer()).slice(0, 5)) }
  })))
  expect(notices).toEqual([{ status: 200, header: '%PDF-' }, { status: 200, header: '%PDF-' }])
  await page.getByRole('button', { name: '建立牌庫並分隊' }).click()
  await expect(page.getByRole('button', { name: '開始計時' })).toBeVisible()
})
