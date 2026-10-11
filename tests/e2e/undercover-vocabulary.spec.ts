import { expect, test } from '@playwright/test'
import { getUndercoverPairs, undercoverWordPairs, wordCategories } from '../../src/games/undercover/data/words'

test('fourteen themes plus derived mixes support every difficulty directly in the compact setup', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'All content combinations are covered once.')
  await page.goto('/#/undercover/setup')
  const theme = page.getByRole('combobox', { name: '選擇題目主題' })
  const difficulty = page.getByRole('combobox', { name: '配對難度' })
  await expect(theme.locator('option')).toHaveCount(16)
  await expect(theme).not.toContainText('動物自然')
  await expect(theme).not.toContainText('運動活動')
  for (const level of ['all', 'easy', 'normal', 'hard'] as const) {
    await difficulty.selectOption(level)
    for (const category of ['mixed', 'funny', ...wordCategories.map(item => item.id)] as const) {
      await theme.selectOption(category)
      const count = getUndercoverPairs(category, level).length
      await expect(page.locator('.setup-mode-hint')).toContainText(`${count} / ${count} 組未玩`)
      await expect(page.getByRole('button', { name: '抽詞並分配' })).toBeEnabled()
    }
  }
  await page.screenshot({ path: '.artifacts/screenshots/undercover-vocabulary-setup.png' })
})

test('legacy sports preferences migrate without losing names or whiteboard mode', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Migration is covered once.')
  await page.addInitScript(() => localStorage.setItem('party-box:undercover:setup', JSON.stringify({ version: 3, data: {
    playerNames: ['珍奶控', '阿哲', '小葵', '大雄', '美玲'], category: 'sports', undercoverCount: 1, blankEnabled: true
  } })))
  await page.goto('/#/undercover/setup')
  await expect(page.getByRole('combobox', { name: '選擇題目主題' })).toHaveValue('leisure')
  await expect(page.getByRole('combobox', { name: '配對難度' })).toHaveValue('all')
  await page.getByRole('button', { name: '編輯玩家', exact: true }).click()
  await expect(page.getByRole('textbox', { name: '玩家 1 名稱' })).toHaveValue('珍奶控')
  await page.getByRole('button', { name: '完成', exact: true }).click()
  await expect(page.getByRole('navigation', { name: '設定細項' }).getByRole('button', { name: /進階規則/ })).toContainText('＋白板')
})

test('draw history survives reloads and theme changes without storing roles or rendering deduction notes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Local history and role privacy are covered once.')
  await page.goto('/#/undercover/setup')
  const usedIds = new Set<string>()
  const usedWords = new Set<string>()
  for (let draw = 0; draw < 8; draw++) {
    const category = draw % 2 ? 'mixed' : 'food'
    await page.getByRole('combobox', { name: '選擇題目主題' }).selectOption(category)
    await page.getByRole('combobox', { name: '配對難度' }).selectOption('normal')
    const fresh = getUndercoverPairs(category, 'normal').filter(pair => !usedIds.has(pair.id) && pair.words.every(word => !usedWords.has(word)))
    await page.getByRole('button', { name: '抽詞並分配' }).click()
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('party-box:undercover:draw-history')!).data)
    expect(Object.keys(stored)).toEqual(['usedPairIds'])
    expect(stored.usedPairIds).toHaveLength(draw + 1)
    const pair = undercoverWordPairs.find(item => item.id === stored.usedPairIds.at(-1))!
    expect(usedIds.has(pair.id)).toBe(false)
    if (fresh.length) expect(pair.words.every(word => !usedWords.has(word))).toBe(true)
    usedIds.add(pair.id)
    pair.words.forEach(word => usedWords.add(word))
    await page.getByRole('button', { name: '我是 玩家 1，繼續' }).click()
    await page.getByRole('button', { name: '按住以揭露身份' }).dispatchEvent('pointerdown')
    await expect(page.locator('.secret-word-card__front h1')).toBeVisible()
    expect(pair.words).toContain((await page.locator('.secret-word-card__front h1').textContent())!.trim())
    const body = await page.locator('body').textContent()
    for (const note of [...pair.sharedTraits, ...pair.differences]) expect(body).not.toContain(note)
    await page.reload()
    await expect(page).toHaveURL(/undercover\/setup$/)
    await expect(page.getByRole('combobox', { name: '配對難度' })).toHaveValue('normal')
  }
})

test('an exhausted deck requires explicit confirmation and resets only its filtered history', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Exhaustion is covered once.')
  const foodIds = getUndercoverPairs('food', 'easy').map(pair => pair.id)
  const otherId = getUndercoverPairs('animals', 'normal')[0]!.id
  await page.goto('/#/undercover/setup')
  await page.evaluate(({ foodIds, otherId }) => {
    localStorage.setItem('party-box:undercover:draw-history', JSON.stringify({ version: 1, data: { usedPairIds: [...foodIds, otherId] } }))
    const saved = JSON.parse(localStorage.getItem('party-box:undercover:setup') || '{"version":3,"data":{}}')
    saved.data.category = 'food'; saved.data.difficulty = 'easy'
    localStorage.setItem('party-box:undercover:setup', JSON.stringify(saved))
  }, { foodIds, otherId })
  await page.reload()
  await expect(page.getByRole('button', { name: '抽詞並分配' })).toBeDisabled()
  await page.getByRole('button', { name: '重新洗這份題庫' }).click()
  await page.getByRole('button', { name: '先不要' }).click()
  await expect(page.getByRole('button', { name: '抽詞並分配' })).toBeDisabled()
  await page.getByRole('button', { name: '重新洗這份題庫' }).click()
  await page.getByRole('button', { name: '確認重洗' }).click()
  await expect(page.getByRole('button', { name: '抽詞並分配' })).toBeEnabled()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('party-box:undercover:draw-history')!).data.usedPairIds)).toEqual([otherId])
})

test('new vocabulary and repeat protection work offline; corrupt history recovers safely', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Offline behavior is covered once.')
  await page.goto('/#/undercover/setup')
  await page.evaluate(async () => {
    localStorage.setItem('party-box:undercover:draw-history', JSON.stringify({ version: 1, data: { usedPairIds: 'corrupt' } }))
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('combobox', { name: '選擇題目主題' }).selectOption('internet')
  await page.getByRole('combobox', { name: '配對難度' }).selectOption('hard')
  await page.getByRole('button', { name: '抽詞並分配' }).click()
  await expect(page.getByRole('button', { name: '我是 玩家 1，繼續' })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('party-box:undercover:draw-history')!).data.usedPairIds.length)).toBe(1)
})
