import { expect, test, type Page } from '@playwright/test'

async function swipe(page: Page, direction: number, touch = false) {
  const card = page.locator('.swipe-card')
  const box = await card.boundingBox()
  const axis = await card.evaluate(element => {
    let matrix = new DOMMatrix()
    let parent = element.parentElement
    while (parent) {
      const transform = getComputedStyle(parent).transform
      if (transform !== 'none') matrix = new DOMMatrix(transform).multiply(matrix)
      parent = parent.parentElement
    }
    return { x: matrix.a, y: matrix.b }
  })
  const x = box!.x + box!.width / 2
  const y = box!.y + box!.height / 2
  if (touch) {
    const client = await page.context().newCDPSession(page)
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let step = 1; step <= 5; step += 1) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + axis.x * direction * 22 * step, y: y + axis.y * direction * 22 * step }] })
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await client.detach()
  } else {
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + axis.x * direction * 110, y + axis.y * direction * 110, { steps: 5 })
    await page.mouse.up()
  }
}

test('large-word stage uses real swipe gestures and optional buttons without clipping words', async ({ page }) => {
  await page.clock.install()
  await page.goto('/#/charades/setup')
  await page.getByRole('button', { name: '建立牌庫並分隊' }).click()
  await page.getByRole('button', { name: '開始計時' }).click()
  await page.clock.runFor(3000)
  await expect(page.getByRole('button', { name: '猜對', exact: true })).toHaveCount(0)
  await swipe(page, 1, true)
  await expect(page.locator('.charades-card-score')).toContainText('✓ 1')
  await swipe(page, -1)
  await expect(page.locator('.charades-card-score')).toContainText('× 1')
  await page.getByRole('button', { name: '顯示作答按鈕' }).click()
  await page.getByRole('button', { name: '猜對', exact: true }).click()
  await expect(page.locator('.charades-card-score')).toContainText('✓ 2')
  await page.getByRole('button', { name: '隱藏作答按鈕' }).click()
  await expect(page.getByRole('button', { name: '猜對', exact: true })).toHaveCount(0)
  for (const viewport of [{ width: 320, height: 568 }, { width: 393, height: 852 }, { width: 852, height: 393 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport)
    for (let count = 0; count < 12; count += 1) {
      const word = page.locator('.charades-word-card h1')
      const dimensions = await word.evaluate(element => {
        const card = element.closest('.swipe-card')!.getBoundingClientRect()
        const word = element.getBoundingClientRect()
        return { cardWidth: card.width, cardHeight: card.height, wordWidth: word.width, wordHeight: word.height, font: parseFloat(getComputedStyle(element).fontSize), length: [...element.textContent!].length }
      })
      expect(dimensions.wordWidth).toBeLessThanOrEqual(dimensions.cardWidth)
      expect(dimensions.wordHeight).toBeLessThanOrEqual(dimensions.cardHeight - 44)
      if (dimensions.length <= 3) expect(dimensions.font).toBeGreaterThan(70)
      await page.locator('.swipe-card').press('ArrowRight')
    }
  }
})

test('both CSS landscape directions keep swipes aligned with the displayed card', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Rotated gesture geometry is covered once.')
  await page.addInitScript(() => {
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { configurable: true, value: async () => 'granted' })
    Object.defineProperty(screen.orientation, 'lock', { configurable: true, value: undefined })
  })
  await page.clock.install()
  await page.goto('/#/charades/setup')
  await page.getByRole('button', { name: '建立牌庫並分隊' }).click()
  await page.getByRole('button', { name: '啟用翻轉操作' }).click()
  await page.getByRole('button', { name: '開始計時' }).click()
  await page.clock.runFor(3000)
  for (const rotation of [90, -90]) {
    await page.locator('.charades-play-page').evaluate((element, value) => (element as HTMLElement).style.setProperty('--stage-rotation', `${value}deg`), rotation)
    await swipe(page, 1, true)
    await swipe(page, -1, true)
  }
  await expect(page.locator('.charades-card-score')).toContainText('✓ 2')
  await expect(page.locator('.charades-card-score')).toContainText('× 2')
})
