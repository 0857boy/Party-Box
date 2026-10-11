import { expect, test } from '@playwright/test'

test('all five quick-start overviews fit phones and tablets without scrolling defaults', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Responsive matrix is covered once.')
  for (const game of ['avalon', 'undercover', 'charades', 'fake-artist', 'wavelength']) {
    await page.goto(`/#/${game}/setup`)
    for (const viewport of [{ width: 393, height: 852 }, { width: 375, height: 667 }, { width: 852, height: 393 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
      await page.setViewportSize(viewport)
      await page.evaluate(() => window.scrollTo(0, 0))
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
      const start = await page.locator('.setup-flow > .action-dock .game-button').boundingBox()
      expect(start!.y + start!.height, `${game} ${viewport.width}×${viewport.height}`).toBeLessThanOrEqual(viewport.height)
      expect(start!.height).toBeGreaterThanOrEqual(44)
      await expect(page.locator('.setup-editor')).not.toBeVisible()
      if (viewport.width === 393 || viewport.width === 852) await page.screenshot({ path: `.artifacts/screenshots/minimal-${game}-${viewport.width}.png` })
    }
  }
})

test('editor supports browser Back, Escape, confirmation and input Enter without accidental game starts', async ({ page }) => {
  await page.goto('/#/charades/setup')
  const edit = page.getByRole('button', { name: '編輯玩家分隊' })
  await edit.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('button', { name: '關閉設定' })).toBeFocused()
  await page.getByRole('textbox', { name: '玩家 1 名稱' }).fill('珍奶控')
  await page.getByRole('textbox', { name: '玩家 1 名稱' }).press('Enter')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL(/charades\/setup$/)
  await edit.click()
  await expect(page.getByRole('textbox', { name: '玩家 1 名稱' })).toHaveValue('珍奶控')
  await page.goBack()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await edit.click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
})

test('player count changes directly, respects limits and enables shared roster editing only on demand', async ({ page }) => {
  await page.goto('/#/avalon/setup')
  await expect(page.getByRole('button', { name: '減少玩家' })).toBeDisabled()
  for (let count = 5; count < 10; count += 1) await page.getByRole('button', { name: '新增玩家', exact: true }).click()
  await expect(page.getByRole('button', { name: '新增玩家', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: '編輯玩家', exact: true }).click()
  await expect(page.getByRole('textbox', { name: /玩家 \d+ 名稱/ })).toHaveCount(10)
  await page.getByRole('button', { name: '完成', exact: true }).click()
  await expect(page.getByRole('button', { name: '洗牌並分配身份' })).toBeEnabled()
})

test('direct editor link closes onto the overview rather than navigating away', async ({ page }) => {
  await page.goto('/#/charades/setup?setupPanel=0')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: '關閉設定' }).click()
  await expect(page).toHaveURL(/charades\/setup$/)
  await expect(page.getByRole('button', { name: '建立牌庫並分隊' })).toBeVisible()
})
