import { expect, test } from '@playwright/test'

test('same frequency keeps the target private through clue, discussion and opposing guess', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'tablet') await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto('/#/wavelength/setup')
  await expect(page.getByRole('heading', { name: /你說的那個/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth))
  await page.getByRole('button', { name: '開始調頻' }).click()

  await page.getByRole('button', { name: '我是 玩家 1，繼續' }).click()
  await expect(page.getByText('目標已遮住')).toBeVisible()
  await expect(page.getByText('目標就在亮色區域中央')).toHaveCount(0)
  await page.getByRole('button', { name: '按住查看目標' }).dispatchEvent('pointerdown')
  await page.waitForTimeout(720)
  await expect(page.getByText('目標就在亮色區域中央')).toBeVisible()
  await page.getByRole('button', { name: '我記住了，隱藏目標' }).click()

  await page.getByRole('textbox', { name: '你的線索' }).fill('珍珠奶茶')
  await page.getByRole('button', { name: /公開線索/ }).click()
  await expect(page.getByText('「珍珠奶茶」')).toBeVisible()
  await expect(page.getByText('目標就在亮色區域中央')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth))
  await page.screenshot({ path: `.artifacts/screenshots/playwright-${testInfo.project.name}-wavelength-discuss.png` })

  await page.getByRole('slider', { name: '調整指針' }).focus()
  await page.keyboard.press('ArrowRight')
  await page.getByRole('button', { name: '鎖定指針' }).click()
  await page.getByRole('button', { name: '目標在左邊' }).click()
  await expect(page.getByText('真正目標尚未揭曉')).toBeVisible()
  await page.getByRole('button', { name: '揭曉目標' }).click()
  await expect(page.locator('.wavelength-awards')).toBeVisible()
  await expect(page.locator('.spectrum-dial path[stroke="#ffe18b"]').first()).toBeVisible()
  await page.screenshot({ path: `.artifacts/screenshots/playwright-${testInfo.project.name}-wavelength-reveal.png`, animations: 'disabled' })
  await page.getByRole('button', { name: '下一回合' }).click()
  await expect(page.getByRole('button', { name: '我是 玩家 2，繼續' })).toBeVisible()
})

test('two players complete the six round cooperative game', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The cooperative ending is covered once.')
  await page.goto('/#/wavelength/setup')
  for (let number = 6; number > 2; number -= 1) await page.getByRole('button', { name: `移除玩家 ${number}` }).click()
  await page.getByRole('navigation', { name: '設定分頁' }).getByRole('button', { name: /隊伍/ }).click()
  await expect(page.getByText('合作模式', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '開始調頻' }).click()

  for (let round = 1; round <= 6; round += 1) {
    await page.getByRole('button', { name: /我是 玩家 [12]，繼續/ }).click()
    await page.getByRole('button', { name: '按住查看目標' }).dispatchEvent('pointerdown')
    await page.waitForTimeout(720)
    const label = await page.locator('.spectrum-dial').getAttribute('aria-label')
    const target = Number(label?.match(/目標位置 (\d+)/)?.[1])
    expect(target).toBeGreaterThan(0)
    await page.getByRole('button', { name: '我記住了，隱藏目標' }).click()
    await page.getByRole('textbox', { name: '你的線索' }).fill(`第 ${round} 次線索`)
    await page.getByRole('button', { name: /公開線索/ }).click()
    await page.getByRole('slider', { name: '調整指針' }).evaluate((element, position) => {
      const slider = element as HTMLInputElement
      slider.value = String(position)
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    }, target)
    await page.getByRole('button', { name: '鎖定指針' }).click()
    await expect(page.getByRole('button', { name: '揭曉目標' })).toBeVisible()
    await page.getByRole('button', { name: '揭曉目標' }).click()
    if (round === 6) {
      await expect(page.locator('.wavelength-awards')).toBeVisible()
      await expect(page.getByRole('heading', { name: '你們真的很有默契！' })).toHaveCount(0)
    }
    await page.getByRole('button', { name: round < 6 ? '下一回合' : '查看最終結果' }).click()
  }

  await expect(page.getByRole('heading', { name: '你們真的很有默契！' })).toBeVisible()
  await expect(page.locator('.wavelength-history article')).toHaveCount(6)
  await expect(page.getByText('24', { exact: true })).toBeVisible()
})
