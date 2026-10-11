import { expect, test } from '@playwright/test'

test('quick team match ends after equal timed turns with short words and rotating performers', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The full timed match is covered once.')
  await page.setViewportSize({ width: 393, height: 700 })
  await page.clock.install()
  await page.goto('/#/charades/setup')
  await page.getByRole('textbox', { name: '第一隊隊名' }).fill('珍奶隊')
  await page.getByRole('textbox', { name: '第二隊隊名' }).fill('雞排隊')
  await page.getByRole('navigation', { name: '設定分頁' }).getByRole('button', { name: /題庫/ }).click()
  await page.getByRole('button', { name: '簡單', exact: true }).click()
  await page.getByRole('combobox', { name: '選擇題目主題' }).selectOption('animals')
  await page.getByRole('navigation', { name: '設定分頁' }).getByRole('button', { name: /節奏/ }).click()
  await expect(page.getByRole('button', { name: /快節奏隊伍賽/ })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('combobox', { name: '每次時間' }).selectOption('30')
  await page.getByRole('combobox', { name: '每隊出場' }).selectOption('2')
  await expect(page.locator('.action-dock')).toContainText('約 2 分鐘')
  await page.getByRole('button', { name: '建立牌庫並分隊' }).click()
  const teams: string[] = []
  const performers: string[] = []
  for (let turn = 0; turn < 4; turn += 1) {
    teams.push((await page.locator('.charades-ready-card > .eyebrow').textContent())!.trim())
    performers.push((await page.locator('.charades-clue-giver h1').textContent())!.trim())
    await page.getByRole('button', { name: '開始計時' }).click()
    await page.clock.runFor(3000)
    const word = page.locator('.charades-word-card h1')
    expect([...(await word.textContent())!.trim()].length).toBeLessThanOrEqual(6)
    await expect(page.locator('.charades-word-card small')).toHaveText('不能說話，只能比動作')
    await expect(page.locator('.charades-word-card > strong')).toHaveCount(0) // No emoji answers.
    await page.getByRole('button', { name: '跳過', exact: true }).click()
    await expect(word).toBeVisible()
    for (let guess = 0; guess < turn + 1; guess += 1) await page.getByRole('button', { name: '猜對', exact: true }).click()
    if (turn === 0) {
      const cardBox = await page.locator('.charades-live .swipe-card').boundingBox()
      expect(cardBox!.width).toBeGreaterThanOrEqual(350)
      const actionBox = await page.getByRole('button', { name: '猜對', exact: true }).boundingBox()
      expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(700)
      await page.screenshot({ path: '.artifacts/screenshots/charades-quick-mobile.png' })
      await page.setViewportSize({ width: 852, height: 393 })
      const landscapeBox = await page.getByRole('button', { name: '猜對', exact: true }).boundingBox()
      expect(landscapeBox!.y + landscapeBox!.height).toBeLessThanOrEqual(393)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(852)
      await page.screenshot({ path: '.artifacts/screenshots/charades-quick-landscape.png' })
      await page.setViewportSize({ width: 393, height: 700 })
    }
    await page.clock.fastForward(30_000)
    await expect(page.getByRole('heading', { name: new RegExp(`${turn + 1} 張`) })).toBeVisible()
    await expect(page.getByText(/跳過 1 題，不扣分/)).toBeVisible()
    await page.getByRole('button', { name: turn === 3 ? '查看最終結果' : '換下一隊' }).click()
  }
  expect(teams[0]).toBe(teams[2])
  expect(teams[1]).toBe(teams[3])
  expect(teams[0]).not.toBe(teams[1])
  expect(performers[0]).not.toBe(performers[2])
  await expect(page.getByRole('heading', { name: '隊伍得分' })).toBeVisible()
  await expect(page.locator('.charades-turn-history > div')).toHaveCount(4)
  await expect(page.locator('.charades-final-scores')).toContainText('珍奶隊')
  await expect(page.locator('.charades-final-scores')).toContainText('雞排隊')
  await page.screenshot({ path: '.artifacts/screenshots/charades-quick-result.png' })
})

test('upgrading keeps team names and supports difficulty, manual teams and short describe mode', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The settings migration is covered once.')
  await page.addInitScript(() => {
    localStorage.setItem('party-box:charades:setup', JSON.stringify({ version: 2, data: {
      playerNames: ['小安', '小葵', '阿哲', '美玲', '大雄', '阿明'],
      teamNames: ['橘子隊', '綠茶隊'], teamAssignments: [0, 1, 0, 1, 0, 1],
      category: 'mixed', deckSize: 32, turnSeconds: 60
    } }))
  })
  await page.clock.install()
  await page.goto('/#/charades/setup')
  await expect(page.getByRole('textbox', { name: '第一隊隊名' })).toHaveValue('橘子隊')
  await page.getByRole('combobox', { name: '玩家 1 隊伍' }).selectOption('1')
  await expect(page.locator('.charades-team-preview--team-b')).toContainText('小安')
  await expect(page.getByRole('button', { name: '建立牌庫並分隊' })).toBeEnabled()
  await page.getByRole('navigation', { name: '設定分頁' }).getByRole('button', { name: /題庫/ }).click()
  await page.getByRole('button', { name: '挑戰', exact: true }).click()
  await page.getByRole('combobox', { name: '選擇題目主題' }).selectOption('idioms')
  await page.getByRole('navigation', { name: '設定分頁' }).getByRole('button', { name: /節奏/ }).click()
  await page.getByRole('button', { name: '自由描述', exact: true }).click()
  await page.getByRole('combobox', { name: '每隊出場' }).selectOption('1')
  await page.getByRole('combobox', { name: '每次時間' }).selectOption('30')
  await page.getByRole('button', { name: '建立牌庫並分隊' }).click()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('party-box:charades:setup')!))
  expect(saved.version).toBe(3)
  expect(saved.data).toMatchObject({ mode: 'quick', difficulty: 'hard', clueStyle: 'describe', turnsPerTeam: 1 })
  for (let turn = 0; turn < 2; turn += 1) {
    await page.getByRole('button', { name: '開始計時' }).click()
    await page.clock.runFor(3000)
    await expect(page.locator('.charades-word-card small')).toHaveText('什麼都能說，不能講答案')
    await page.clock.fastForward(30_000)
    await page.getByRole('button', { name: turn === 1 ? '查看最終結果' : '換下一隊' }).click()
  }
  await expect(page.getByRole('heading', { name: '平手！' })).toBeVisible()
})
