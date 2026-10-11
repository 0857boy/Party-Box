import { expect, test, type Page } from '@playwright/test'

async function mockFullscreen(page: Page, mode: 'supported' | 'unsupported' | 'reject' | 'throw' | 'installed' = 'supported') {
  await page.addInitScript(mode => {
    const state = { requests: 0, exits: 0, fullscreen: false }
    ;(window as Window & { testFullscreen?: typeof state }).testFullscreen = state
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, get: () => mode !== 'unsupported' })
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => state.fullscreen ? document.documentElement : null })
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { configurable: true, value: mode === 'unsupported' ? undefined : () => {
      state.requests += 1
      if (mode === 'throw') throw new DOMException('Denied', 'NotAllowedError')
      if (mode === 'reject') return Promise.reject(new DOMException('Denied', 'NotAllowedError'))
      state.fullscreen = true
      document.dispatchEvent(new Event('fullscreenchange'))
      return Promise.resolve()
    } })
    document.exitFullscreen = async () => {
      state.exits += 1
      state.fullscreen = false
      document.dispatchEvent(new Event('fullscreenchange'))
    }
    if (mode === 'installed') Object.defineProperty(navigator, 'standalone', { configurable: true, value: true })
  }, mode)
}

const state = (page: Page) => page.evaluate(() => (window as Window & { testFullscreen?: { requests: number; exits: number; fullscreen: boolean } }).testFullscreen)

test('first trusted click enters fullscreen, manual exit is respected across routes and re-entry works', async ({ page }) => {
  await mockFullscreen(page)
  await page.goto('/')
  expect(await state(page)).toMatchObject({ requests: 0, fullscreen: false })
  await page.getByRole('link', { name: 'Party Box 首頁' }).click()
  await expect(page.getByRole('button', { name: '退出全螢幕' })).toBeVisible()
  expect(await state(page)).toMatchObject({ requests: 1, fullscreen: true })
  await page.getByRole('button', { name: '退出全螢幕' }).click()
  await page.locator('.game-tile').first().click()
  expect(await state(page)).toMatchObject({ requests: 1, exits: 1, fullscreen: false })
  await page.goto('/#/')
  await page.getByRole('button', { name: '進入全螢幕' }).click()
  expect(await state(page)).toMatchObject({ requests: 2, fullscreen: true })
})

for (const mode of ['unsupported', 'reject', 'throw'] as const) {
  test(`${mode} fullscreen falls back gracefully and manual retry never stays disabled`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Fallback cases covered once.')
    await mockFullscreen(page, mode)
    await page.goto('/')
    await page.getByRole('link', { name: 'Party Box 首頁' }).click()
    await page.getByRole('button', { name: '進入全螢幕' }).click()
    await expect(page.locator('.fullscreen-control__message')).toContainText('加入主畫面')
    await expect(page.getByRole('button', { name: '進入全螢幕' })).toBeEnabled()
    await page.getByRole('button', { name: '關閉全螢幕提示' }).click()
    await page.getByRole('button', { name: '進入全螢幕' }).click()
    await expect(page.locator('.fullscreen-control__message')).toContainText('加入主畫面')
    expect((await state(page))?.requests).toBe(mode === 'unsupported' ? 0 : 3)
  })
}

test('installed app avoids fullscreen prompts and manifest prefers fullscreen with standalone fallback', async ({ page }) => {
  await mockFullscreen(page, 'installed')
  await page.goto('/')
  await expect(page.locator('.fullscreen-control')).toHaveCount(0)
  await page.getByRole('link', { name: 'Party Box 首頁' }).click()
  expect((await state(page))?.requests).toBe(0)
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!
    return (await fetch(link.href)).json()
  })
  expect(manifest.display).toBe('fullscreen')
  expect(manifest.display_override).toEqual(['fullscreen', 'standalone'])
})

test('compact home fits narrow phones and touch policy disables double-tap without banning pinch zoom', async ({ page }) => {
  await mockFullscreen(page, 'unsupported')
  await page.goto('/')
  for (const width of [320, 375, 393, 430, 768]) {
    await page.setViewportSize({ width, height: 852 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    const brand = await page.locator('.home-brand').boundingBox()
    const actions = await page.locator('.home-nav__actions').boundingBox()
    expect(brand!.x + brand!.width).toBeLessThanOrEqual(actions!.x)
    expect(actions!.x + actions!.width).toBeLessThanOrEqual(width)
  }
  expect(await page.locator('html').evaluate(element => getComputedStyle(element).touchAction)).toBe('manipulation')
  expect(await page.getByRole('button', { name: '進入全螢幕' }).evaluate(element => getComputedStyle(element).touchAction)).toBe('manipulation')
  expect(await page.locator('meta[name="viewport"]').getAttribute('content')).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/)
  const button = await page.getByRole('button', { name: '進入全螢幕' }).boundingBox()
  await page.touchscreen.tap(button!.x + button!.width / 2, button!.y + button!.height / 2)
  await page.touchscreen.tap(button!.x + button!.width / 2, button!.y + button!.height / 2)
  expect(await page.evaluate(() => window.visualViewport?.scale)).toBe(1)
  await page.setViewportSize({ width: 393, height: 852 })
  await page.screenshot({ path: `.artifacts/screenshots/fullscreen-home.png` })
})
