import { expect, test, type Page } from '@playwright/test'

async function revealAllRoles(page: Page, playerCount = 5): Promise<Map<string, string>> {
  const roles = new Map<string, string>()
  for (let index = 0; index < playerCount; index += 1) {
    const playerName = `玩家 ${index + 1}`
    await page.getByRole('button', { name: `我是 ${playerName}，繼續` }).click()
    const holdButton = page.getByRole('button', { name: '按住以揭露身份' })
    await holdButton.dispatchEvent('pointerdown')
    await page.waitForTimeout(720)
    await expect(page.getByText('PRIVATE INFORMATION')).toBeVisible()
    roles.set(playerName, (await page.locator('.role-card__content h2').textContent())?.trim() ?? '')
    await page.getByRole('button', { name: index === playerCount - 1 ? '我看完了，開始遊戲' : '我看完了，交給下一位' }).click()
  }
  return roles
}

async function completeSuccessfulRound(page: Page, playerCount: number, teamSize: number): Promise<void> {
  const playerButtons = page.locator('.phase-panel .selection-grid button')
  for (let index = 0; index < teamSize; index += 1) await playerButtons.nth(index).click()
  await page.getByRole('button', { name: /確認隊伍/ }).click()
  await page.locator('.choice-card--approve').click()
  await page.getByRole('button', { name: '進入任務' }).click()
  for (let member = 0; member < teamSize; member += 1) {
    await page.getByRole('button', { name: /我是 玩家 \d+，繼續/ }).click()
    await expect(page.getByRole('button', { name: /任務失敗/ })).toBeVisible()
    await page.getByRole('button', { name: /任務成功/ }).click()
  }
  await expect(page.getByRole('heading', { name: '任務成功' })).toBeVisible()
  await page.getByRole('button', { name: '繼續' }).click()
}

test('home and setup stay inside the viewport', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /一部裝置/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth))
  await page.screenshot({ path: `.artifacts/screenshots/playwright-${testInfo.project.name}-home.png` })

  await page.getByRole('link', { name: /阿瓦隆/ }).click()
  await expect(page.getByRole('heading', { name: /召集你的/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth))
  await expect(page.getByRole('link', { name: '回首頁' })).toBeVisible()
  await page.screenshot({ path: `.artifacts/screenshots/playwright-${testInfo.project.name}-setup.png` })
})

test('five players can complete private role distribution', async ({ page }, testInfo) => {
  await page.goto('/#/avalon/setup')
  await page.getByRole('button', { name: '洗牌並分配身份' }).click()

  for (let index = 0; index < 5; index += 1) {
    await page.getByRole('button', { name: /我是 玩家 \d，繼續/ }).click()
    const holdButton = page.getByRole('button', { name: '按住以揭露身份' })
    await holdButton.dispatchEvent('pointerdown')
    await page.waitForTimeout(720)
    await expect(page.getByText('PRIVATE INFORMATION')).toBeVisible()
    if (index === 0) {
      await page.waitForTimeout(650)
      await page.screenshot({ path: `.artifacts/screenshots/playwright-${testInfo.project.name}-reveal.png` })
    }
    await page.getByRole('button', { name: index === 4 ? '我看完了，開始遊戲' : '我看完了，交給下一位' }).click()
  }

  await expect(page.getByRole('heading', { name: /所有身份/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '重新洗牌' })).toBeVisible()
  await page.screenshot({ path: `.artifacts/screenshots/playwright-${testInfo.project.name}-ready.png` })
})

test('cached production app can complete the flow offline', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: /一部裝置/ })).toBeVisible()
  await page.getByRole('link', { name: /阿瓦隆/ }).click()
  await page.getByRole('button', { name: '洗牌並分配身份' }).click()

  for (let index = 0; index < 5; index += 1) {
    await page.getByRole('button', { name: /我是 玩家 \d，繼續/ }).click()
    const holdButton = page.getByRole('button', { name: '按住以揭露身份' })
    await holdButton.dispatchEvent('pointerdown')
    await page.waitForTimeout(720)
    await expect(page.getByText('PRIVATE INFORMATION')).toBeVisible()
    await page.getByRole('button', { name: index === 4 ? '我看完了，開始遊戲' : '我看完了，交給下一位' }).click()
  }

  await expect(page.getByRole('heading', { name: /所有身份/ })).toBeVisible()
})

test('all required viewport sizes remain usable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The viewport matrix only needs one browser project.')
  const viewports = [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1366, height: 1024 }
  ]

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
    await expect(page.getByRole('link', { name: /阿瓦隆/ })).toBeVisible()
    await page.goto('/#/avalon/setup')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
    await expect(page.getByRole('button', { name: '洗牌並分配身份' })).toBeAttached()
  }
})

test('refreshing a secret screen recovers safely without persisting roles', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'One browser project is sufficient for reload recovery.')
  await page.goto('/#/avalon/setup')
  await page.getByRole('button', { name: '洗牌並分配身份' }).click()
  await expect(page.getByRole('button', { name: /我是 玩家 1，繼續/ })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: /召集你的/ })).toBeVisible()
  await expect(page).toHaveURL(/#\/avalon\/setup$/)
})

test('three successful missions lead to assassination and a full review', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The complete match is covered once to keep the suite fast.')
  await page.goto('/#/avalon/setup')
  await page.getByRole('button', { name: '洗牌並分配身份' }).click()
  const roles = await revealAllRoles(page)
  const merlinName = [...roles.entries()].find(([, role]) => role === '梅林')?.[0]
  expect(merlinName).toBeTruthy()

  await page.getByRole('button', { name: '開始第一回合' }).click()
  const teamSizes = [2, 3, 2]
  for (const teamSize of teamSizes) {
    const playerButtons = page.locator('.phase-panel .selection-grid button')
    for (let index = 0; index < teamSize; index += 1) await playerButtons.nth(index).click()
    await page.getByRole('button', { name: /確認隊伍/ }).click()

    await page.locator('.choice-card--approve').click()
    await expect(page.getByRole('heading', { name: '隊伍通過' })).toBeVisible()
    await page.getByRole('button', { name: '進入任務' }).click()

    for (let member = 0; member < teamSize; member += 1) {
      await page.getByRole('button', { name: /我是 玩家 \d，繼續/ }).click()
      await expect(page.getByRole('button', { name: /任務失敗/ })).toBeVisible()
      await page.getByRole('button', { name: /任務成功/ }).click()
    }
    await expect(page.getByRole('heading', { name: '任務成功' })).toBeVisible()
    await page.getByRole('button', { name: '繼續' }).click()
  }

  await page.getByRole('button', { name: /我是 玩家 \d，繼續/ }).click()
  await expect(page.getByRole('heading', { name: /找出梅林/ })).toBeVisible()
  const targets = page.locator('.assassination-panel .selection-grid button')
  const targetCount = await targets.count()
  expect(targetCount).toBe(3)
  const goodRoles = new Set(['梅林', '派西維爾', '亞瑟的忠臣'])
  for (let index = 0; index < targetCount; index += 1) {
    const label = (await targets.nth(index).textContent())?.trim() ?? ''
    const targetName = [...roles.keys()].find((name) => label.includes(name))
    expect(targetName).toBeTruthy()
    expect(goodRoles.has(roles.get(targetName ?? '') ?? '')).toBe(true)
    if (!label.includes(merlinName ?? '')) {
      await targets.nth(index).click()
      break
    }
  }
  await page.getByRole('button', { name: '確認刺殺目標' }).click()
  await page.getByRole('button', { name: '確認刺殺', exact: true }).click()
  await expect(page.getByRole('heading', { name: '正義陣營獲勝' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '身份揭曉' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '任務與投票紀錄' })).toBeVisible()
  await page.screenshot({ path: '.artifacts/screenshots/playwright-mobile-result.png' })

  await page.reload()
  await expect(page.getByRole('heading', { name: /召集你的/ })).toBeVisible()
  await page.getByRole('button', { name: /正義陣營獲勝/ }).click()
  await expect(page.getByRole('heading', { name: '正義陣營獲勝' })).toBeVisible()
})

test('five rejected teams immediately give evil the victory', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The rejection-loss path is covered once.')
  await page.goto('/#/avalon/setup')
  await page.getByRole('button', { name: '洗牌並分配身份' }).click()
  await revealAllRoles(page)
  await page.getByRole('button', { name: '開始第一回合' }).click()

  for (let proposal = 1; proposal <= 5; proposal += 1) {
    const playerButtons = page.locator('.phase-panel .selection-grid button')
    await playerButtons.nth(0).click()
    await playerButtons.nth(1).click()
    await page.getByRole('button', { name: /確認隊伍/ }).click()
    await page.locator('.choice-card--reject').click()
    await expect(page.getByRole('heading', { name: '隊伍遭到否決' })).toBeVisible()
    await page.getByRole('button', { name: proposal === 5 ? '查看遊戲結果' : '交給下一位領袖' }).click()
  }

  await expect(page.getByRole('heading', { name: '邪惡陣營獲勝' })).toBeVisible()
  await expect(page.getByText(/連續五次組隊表決失敗/)).toBeVisible()
})

test('eight-player game can use the Lady of the Lake after round two', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The expansion flow is covered once.')
  test.setTimeout(45_000)
  await page.goto('/#/avalon/setup')
  for (let index = 0; index < 3; index += 1) await page.getByRole('button', { name: '新增玩家' }).click()
  await page.getByRole('checkbox', { name: /湖中女神/ }).check({ force: true })
  await page.getByRole('button', { name: '洗牌並分配身份' }).click()
  await revealAllRoles(page, 8)
  await page.getByRole('button', { name: '開始第一回合' }).click()
  await expect(page.getByText('第 4 回合需 2 張失敗牌才會失敗')).toBeVisible()
  await page.screenshot({ path: '.artifacts/screenshots/playwright-mobile-avalon-board.png' })
  await page.setViewportSize({ width: 320, height: 568 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  await expect(page.getByText('第 4 回合需 2 張失敗牌才會失敗')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })

  await completeSuccessfulRound(page, 8, 3)
  await completeSuccessfulRound(page, 8, 4)
  await expect(page.getByRole('heading', { name: /選擇檢視對象/ })).toBeVisible()
  await page.locator('.phase-panel .selection-grid button:not([disabled])').first().click()
  await page.getByRole('button', { name: /我是 玩家 \d+，繼續/ }).click()
  await expect(page.getByText('LOYALTY REVEALED')).toBeVisible()
  await expect(page.getByRole('heading', { name: /屬於.*陣營/ })).toBeVisible()
  await page.getByRole('button', { name: '我記住了，進入下一回合' }).click()
  await expect(page.getByText('ROUND 3')).toBeVisible()
})

test('undercover can distribute words and resolve an elimination', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The complete undercover match is covered once.')
  await page.goto('/#/undercover/setup')
  await expect(page.getByRole('heading', { name: /一句提示/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /台灣美食/ })).toBeVisible()
  await page.getByRole('button', { name: '抽詞並分配' }).click()

  const wordsByPlayer = new Map<string, string>()
  for (let index = 0; index < 5; index += 1) {
    const playerName = `玩家 ${index + 1}`
    await page.getByRole('button', { name: `我是 ${playerName}，繼續` }).click()
    const holdButton = page.getByRole('button', { name: '按住以揭露身份' })
    await holdButton.dispatchEvent('pointerdown')
    await page.waitForTimeout(720)
    const word = (await page.locator('.secret-word-card__front h1').textContent())?.trim() ?? ''
    wordsByPlayer.set(playerName, word)
    await page.getByRole('button', { name: index === 4 ? '我記住了，開始遊戲' : '我記住了，交給下一位' }).click()
  }

  await expect(page.getByRole('heading', { name: /開始描述/ })).toBeVisible()
  await page.getByRole('button', { name: '描述完成，開始指認' }).click()
  const wordCounts = [...wordsByPlayer.values()].reduce((counts, word) => counts.set(word, (counts.get(word) ?? 0) + 1), new Map<string, number>())
  const undercoverName = [...wordsByPlayer.entries()].find(([, word]) => wordCounts.get(word) === 1)?.[0]
  expect(undercoverName).toBeTruthy()
  if (!undercoverName) throw new Error('The undercover player could not be identified from the distributed words')
  await page.locator('.elimination-grid button').filter({ hasText: undercoverName }).click()
  await page.getByRole('button', { name: new RegExp(`確認淘汰 ${undercoverName}`) }).click()
  await page.getByRole('button', { name: '確認淘汰', exact: true }).click()
  await expect(page.getByRole('heading', { name: new RegExp(`${undercoverName} 是.*臥底`) })).toBeVisible()
  await page.getByRole('button', { name: '查看完整結果' }).click()
  await expect(page.getByRole('heading', { name: '平民陣營獲勝' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '本局詞語' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '身份揭曉' })).toBeVisible()
  await page.screenshot({ path: '.artifacts/screenshots/playwright-mobile-undercover-result.png' })
})

test('undercover can include exactly one blank card', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The optional blank-card flow is covered once.')
  await page.goto('/#/undercover/setup')
  await page.getByText('加入白板', { exact: true }).click()
  await page.getByRole('button', { name: '抽詞並分配' }).click()

  const revealedPrompts: string[] = []
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole('button', { name: `我是 玩家 ${index + 1}，繼續` }).click()
    const holdButton = page.getByRole('button', { name: '按住以揭露身份' })
    await holdButton.dispatchEvent('pointerdown')
    await page.waitForTimeout(720)
    revealedPrompts.push((await page.locator('.secret-word-card__front h1').textContent())?.trim() ?? '')
    await page.getByRole('button', { name: index === 4 ? '我記住了，開始遊戲' : '我記住了，交給下一位' }).click()
  }

  expect(revealedPrompts.filter((prompt) => prompt === '白板')).toHaveLength(1)
  await expect(page.getByText('潛伏').first()).toBeVisible()
})

test('player roster is shared between games', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Cross-game local roster storage is covered once.')
  const names = ['小安', '阿哲', '美玲', '大雄', '小葵']
  await page.goto('/#/undercover/setup')
  const inputs = page.locator('.player-input input')
  for (let index = 0; index < names.length; index += 1) await inputs.nth(index).fill(names[index]!)
  await page.getByRole('button', { name: '抽詞並分配' }).click()

  await page.goto('/#/avalon/setup')
  for (let index = 0; index < names.length; index += 1) await expect(page.locator('.player-input input').nth(index)).toHaveValue(names[index]!)
  await expect(page.getByText(names.join('、'))).toBeVisible()
})

test('party charades reuses the same deck across all three rounds', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The complete three-round charades game is covered once.')
  await page.goto('/#/charades/setup')
  await expect(page.getByRole('heading', { name: /同一個答案/ })).toBeVisible()
  await page.setViewportSize({ width: 320, height: 568 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('textbox', { name: '第一隊隊名' }).fill('珍奶隊')
  await page.getByRole('textbox', { name: '第二隊隊名' }).fill('雞排隊')
  const teamsBeforeShuffle = await page.locator('.charades-team-preview article > span').allTextContents()
  await page.getByRole('button', { name: '打亂重分' }).click()
  const teamsAfterShuffle = await page.locator('.charades-team-preview article > span').allTextContents()
  expect(teamsAfterShuffle).not.toEqual(teamsBeforeShuffle)
  await page.getByRole('button', { name: '24 張' }).click()
  await page.getByRole('button', { name: '建立牌庫並分隊' }).click()
  await expect(page.getByText(/珍奶隊|雞排隊/).first()).toBeVisible()

  for (let round = 1; round <= 3; round += 1) {
    await expect(page.getByText(`PARTY CHARADES · ROUND ${round}/3`)).toBeVisible()
    await page.getByRole('button', { name: '開始計時' }).click()
    for (let card = 0; card < 24; card += 1) await page.getByRole('button', { name: '猜對' }).click()
    if (round < 3) await page.getByRole('button', { name: `進入第 ${round + 1} 輪` }).click()
  }

  await expect(page.getByRole('heading', { name: /獲勝|平手/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: '三輪得分' })).toBeVisible()
  await expect(page.locator('.charades-final-scores').getByText('珍奶隊', { exact: true })).toBeVisible()
  await expect(page.locator('.charades-final-scores').getByText('雞排隊', { exact: true })).toBeVisible()
  await page.screenshot({ path: '.artifacts/screenshots/playwright-mobile-charades-result.png' })
})

test('fake artist completes identity reveal, two drawing passes, voting, and review', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The complete shared-canvas game is covered once.')
  await page.goto('/#/fake-artist/setup')
  await expect(page.getByRole('heading', { name: /大家都會畫/ })).toBeVisible()
  await page.setViewportSize({ width: 320, height: 568 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: '單局決勝' }).click()
  await page.getByRole('button', { name: '抽題並分配身份' }).click()

  let fakeArtistName = ''
  const revealCardFrames: string[] = []
  for (let index = 0; index < 6; index += 1) {
    const playerName = `玩家 ${index + 1}`
    await page.getByRole('button', { name: `我是 ${playerName}，繼續` }).click()
    const holdButton = page.getByRole('button', { name: '按住以揭露身份' })
    await holdButton.dispatchEvent('pointerdown')
    await page.waitForTimeout(720)
    revealCardFrames.push(await page.locator('.fake-role-card').evaluate((element) => {
      const style = getComputedStyle(element)
      return [style.borderColor, style.backgroundImage, style.boxShadow].join('|')
    }))
    if ((await page.locator('.fake-role-card__front h1').textContent())?.trim() === '假畫家') fakeArtistName = playerName
    await page.getByRole('button', { name: index === 5 ? '我記住了，開始作畫' : '我記住了，交給下一位' }).click()
  }
  expect(fakeArtistName).not.toBe('')
  expect(new Set(revealCardFrames).size).toBe(1)

  for (let stroke = 0; stroke < 12; stroke += 1) {
    await page.getByRole('button', { name: /我是 玩家 \d+，繼續/ }).click()
    const canvas = page.locator('.drawing-canvas svg')
    const box = await canvas.boundingBox()
    if (!box) throw new Error('Drawing canvas was not visible')
    const offset = (stroke % 6) * 8
    await page.mouse.move(box.x + 50 + offset, box.y + 60 + offset)
    await page.mouse.down()
    await page.mouse.move(box.x + 120 + offset, box.y + 110 + offset, { steps: 4 })
    await page.mouse.up()
    await page.getByRole('button', { name: '送出這一筆' }).click()
  }

  await expect(page.getByRole('heading', { name: /誰是.*假畫家/ })).toBeVisible()
  await expect(page.locator('.fake-vote-canvas polyline')).toHaveCount(12)
  await page.locator('.fake-suspect-grid button').filter({ hasText: fakeArtistName }).click()
  await page.getByRole('button', { name: '確認指認結果' }).click()
  await page.getByRole('button', { name: new RegExp(`我是 ${fakeArtistName}，繼續`) }).click()
  await page.getByRole('textbox', { name: '輸入你的答案' }).fill('完全猜錯')
  await page.getByRole('button', { name: '鎖定答案' }).click()
  await page.getByRole('button', { name: '猜錯了' }).click()

  await expect(page.getByRole('heading', { name: /獲勝/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: '畫作復盤' })).toBeVisible()
  await expect(page.locator('.fake-gallery polyline')).toHaveCount(12)
  await page.screenshot({ path: '.artifacts/screenshots/playwright-mobile-fake-artist-result.png' })
})
