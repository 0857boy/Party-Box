import { expect, test, type Page } from '@playwright/test'

async function ready(page: Page) {
  await page.goto('/#/charades/setup')
  await page.getByRole('navigation', { name: '設定分頁' }).getByRole('button', { name: /節奏/ }).click()
  await page.getByRole('combobox', { name: '每次時間' }).selectOption('30')
  await page.getByRole('button', { name: '建立牌庫並分隊' }).click()
}

async function orientation(page: Page, beta: number, gamma = 0) {
  await page.evaluate(([b, g]) => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta: b, gamma: g })), [beta, gamma])
}

test('permission rejection preserves touch play, the full timer starts only after countdown and feedback is explicit', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Permission fallback is covered once.')
  await page.addInitScript(() => {
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { value: async () => 'denied', configurable: true })
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => { throw new DOMException('Denied', 'NotAllowedError') }, configurable: true })
  })
  await page.clock.install()
  await ready(page)
  await page.getByRole('button', { name: '啟用翻轉操作' }).click()
  await expect(page.getByText(/未允許動作感測/)).toBeVisible()
  await page.getByRole('checkbox', { name: '錄影本回合（前鏡頭）' }).check()
  await page.getByRole('button', { name: '開始計時' }).click()
  await expect(page.locator('.charades-countdown > strong')).toHaveText('3')
  await expect(page.locator('.charades-word-card')).toHaveCount(0)
  await page.clock.runFor(2000)
  await expect(page.locator('.charades-countdown > strong')).toHaveText('1')
  await expect(page.locator('.charades-word-card')).toHaveCount(0)
  await page.screenshot({ path: '.artifacts/screenshots/charades-device-countdown.png' })
  await page.clock.runFor(1000)
  await expect(page.getByRole('timer')).toHaveAttribute('aria-label', '剩餘 30 秒')
  await expect(page.locator('.charades-rec')).toHaveCount(0)
  await page.getByRole('button', { name: '猜對', exact: true }).click()
  await expect(page.locator('.charades-feedback--correct')).toHaveText('✓ 猜對 +1')
  await expect(page.locator('.charades-card-score')).toContainText('✓ 1')
  await page.screenshot({ path: '.artifacts/screenshots/charades-device-green.png' })
  await page.clock.runFor(600)
  await expect(page.locator('.charades-feedback')).toHaveCount(0)
  await page.getByRole('button', { name: '跳過', exact: true }).click()
  await expect(page.locator('.charades-feedback--skip')).toHaveText('× 跳過')
  await page.setViewportSize({ width: 852, height: 393 })
  await page.screenshot({ path: '.artifacts/screenshots/charades-device-landscape.png' })
  for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 430, height: 932 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
    const button = await page.getByRole('button', { name: '猜對', exact: true }).boundingBox()
    expect(button!.y + button!.height).toBeLessThanOrEqual(viewport.height)
    expect(button!.height).toBeGreaterThanOrEqual(44)
    if (viewport.width === 320 || viewport.width === 768) await page.screenshot({ path: `.artifacts/screenshots/charades-device-${viewport.width}.png` })
  }
  await page.clock.fastForward(30_000)
  await expect(page.getByText(/未取得相機／麥克風/)).toBeVisible()
  await expect(page.getByRole('button', { name: '換下一隊' })).toBeEnabled()
})

test('gyro triggers one answer per flip, requires neutral, and does not act outside live play', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Sensor events are covered once.')
  await page.addInitScript(() => {
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { value: async () => 'granted', configurable: true })
    Object.defineProperty(screen.orientation, 'lock', { value: undefined, configurable: true }) // Safari fallback.
  })
  await page.clock.install()
  await ready(page)
  await page.getByRole('button', { name: '啟用翻轉操作' }).click()
  await orientation(page, 90)
  await expect(page.getByText(/翻轉已就緒/)).toBeVisible()
  await orientation(page, 180)
  await page.getByRole('button', { name: '開始計時' }).click()
  await orientation(page, 180)
  await page.clock.runFor(3000)
  await expect(page.locator('.charades-play-page')).toHaveClass(/charades-play-page--landscape/)
  const stageSize = await page.locator('.charades-play-page').evaluate(element => ({ width: (element as HTMLElement).offsetWidth, height: (element as HTMLElement).offsetHeight }))
  expect(stageSize.width).toBeGreaterThan(stageSize.height)
  await page.screenshot({ path: '.artifacts/screenshots/charades-locked-portrait.png' })
  await expect(page.locator('.charades-card-score')).toContainText('✓ 0')
  await orientation(page, 90)
  await page.clock.runFor(210)
  await orientation(page, 90)
  await orientation(page, 180)
  await page.clock.runFor(130)
  await orientation(page, 180)
  await expect(page.locator('.charades-card-score')).toContainText('✓ 1')
  await page.clock.runFor(1000)
  await orientation(page, 180)
  await orientation(page, 0)
  await expect(page.locator('.charades-card-score')).toContainText('✓ 1')
  await page.setViewportSize({ width: 852, height: 393 })
  await page.screenshot({ path: '.artifacts/screenshots/charades-locked-landscape.png' })
  await orientation(page, 0, 90)
  await page.clock.runFor(210)
  await orientation(page, 0, 90)
  await orientation(page, 0)
  await page.clock.runFor(130)
  await orientation(page, 0)
  await expect(page.locator('.charades-card-score')).toContainText('× 1')
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { get: () => true, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.getByText(/本回合已提前結束/)).toBeVisible()
  await expect(page.locator('.charades-play-page')).not.toHaveClass(/charades-play-page--landscape/)
  await orientation(page, 180)
  await expect(page.getByRole('heading', { name: /1 張/ })).toBeVisible()
})

test('fast flips change text immediately without remounting the card or waiting for feedback', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Fast sensor cadence is covered once.')
  await page.addInitScript(() => {
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { value: async () => 'granted', configurable: true })
    Object.defineProperty(screen.orientation, 'lock', { value: undefined, configurable: true })
  })
  await page.clock.install()
  await ready(page)
  await page.getByRole('button', { name: '啟用翻轉操作' }).click()
  await page.getByRole('button', { name: '開始計時' }).click()
  await page.clock.runFor(2800)
  await orientation(page, 90)
  await page.clock.runFor(85)
  await orientation(page, 90)
  await page.clock.runFor(115)
  const word = await page.locator('.charades-word-card h1').textContent()
  await page.evaluate(() => {
    const surface = document.querySelector('.swipe-card')!
    ;(window as Window & { testCardSurface?: Element }).testCardSurface = surface
  })
  await orientation(page, 180)
  await page.clock.runFor(65)
  await orientation(page, 180) // Primed during countdown: no live neutral wait.
  await expect(page.locator('.charades-card-score')).toContainText('✓ 1')
  await expect(page.locator('.charades-word-card h1')).not.toHaveText(word!)
  await expect(page.locator('.charades-feedback--correct')).toBeVisible()
  await orientation(page, 90)
  await page.clock.runFor(85)
  await orientation(page, 90)
  await orientation(page, 0)
  await page.clock.runFor(65)
  await orientation(page, 0) // Second answer just 150ms after the first.
  await expect(page.locator('.charades-card-score')).toContainText('× 1')
  expect(await page.evaluate(() => document.querySelector('.swipe-card') === (window as Window & { testCardSurface?: Element }).testCardSurface)).toBe(true)
  await page.clock.runFor(225)
  await expect(page.locator('.charades-feedback')).toHaveCount(0)
  // A cancelled touch must not submit an answer when the OS handles rotation.
  const card = page.locator('.swipe-card')
  await card.dispatchEvent('pointerdown', { pointerId: 1, clientX: 200 })
  await card.dispatchEvent('pointermove', { pointerId: 1, clientX: 80 })
  await card.dispatchEvent('pointercancel', { pointerId: 1 })
  await expect(page.locator('.charades-card-score')).toContainText('× 1')
  await page.setViewportSize({ width: 852, height: 393 })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.charades-play-page')).toHaveClass(/charades-play-page--landscape/)
  await expect(page.getByRole('timer')).toHaveAttribute('aria-label', '剩餘 30 秒')
})

test('native orientation lock is released after the turn without exiting app fullscreen', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Native lock lifecycle is covered once.')
  await page.addInitScript(() => {
    const state = { fullscreen: false, locks: [] as string[], unlocks: 0 }
    ;(window as Window & { testOrientationState?: typeof state }).testOrientationState = state
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { value: async () => 'granted', configurable: true })
    HTMLElement.prototype.requestFullscreen = async () => { state.fullscreen = true }
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => state.fullscreen ? document.documentElement : null })
    document.exitFullscreen = async () => { state.fullscreen = false }
    Object.defineProperty(screen.orientation, 'lock', { configurable: true, value: async (direction: string) => { state.locks.push(direction) } })
    screen.orientation.unlock = () => { state.unlocks += 1 }
  })
  await page.clock.install()
  await ready(page)
  await page.getByRole('button', { name: '啟用翻轉操作' }).click()
  await page.getByRole('button', { name: '開始計時' }).click()
  const locking = await page.evaluate(() => (window as Window & { testOrientationState?: { locks: string[] } }).testOrientationState?.locks)
  expect(locking).toEqual(['landscape'])
  await page.clock.runFor(3000)
  await page.getByRole('button', { name: '提前結束回合' }).click()
  expect(await page.evaluate(() => (window as Window & { testOrientationState?: { fullscreen: boolean; unlocks: number } }).testOrientationState)).toMatchObject({ fullscreen: true, unlocks: 1 })
})

test('real MediaRecorder saves a local video, releases camera, survives reload and supports export/delete', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Recording lifecycle is covered once using synthetic camera frames.')
  await page.addInitScript(() => {
    // Real MediaRecorder, fake camera: no access to the user's camera or mic.
    const tracks: MediaStreamTrack[] = []
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 320; canvas.height = 240
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#48bf91'; ctx.fillRect(0, 0, 320, 240)
      const stream = canvas.captureStream(0)
      tracks.push(...stream.getTracks())
      ;(window as Window & { testCameraTracks?: MediaStreamTrack[] }).testCameraTracks = tracks
      ;(window as Window & { testCameraFrame?: () => void }).testCameraFrame = () => {
        ctx.fillStyle = '#3388dd'; ctx.fillRect(0, 0, 320, 240)
        ;(stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack).requestFrame()
      }
      return stream
    } })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false })
  })
  await ready(page)
  await page.getByRole('checkbox', { name: '錄影本回合（前鏡頭）' }).check()
  await page.getByRole('checkbox', { name: '一併錄製聲音' }).uncheck()
  await page.getByRole('button', { name: '開始計時' }).click()
  await expect(page.locator('.charades-countdown')).toBeVisible()
  await expect(page.locator('.charades-rec')).toBeVisible()
  await page.evaluate(() => (window as Window & { testCameraFrame?: () => void }).testCameraFrame?.())
  await page.waitForTimeout(450) // Let the encoder produce real frames (not a mocked Blob).
  await page.getByRole('button', { name: '提前結束回合' }).click()
  await expect(page.getByText(/已保存在此裝置/)).toBeVisible()
  const cameraStopped = await page.evaluate(() => (window as Window & { testCameraTracks?: MediaStreamTrack[] }).testCameraTracks?.every(track => track.readyState === 'ended'))
  expect(cameraStopped).toBe(true)
  await page.getByText('回看／分享這回合錄影', { exact: true }).click()
  const chooser = page.getByRole('combobox', { name: '選擇錄影片段' })
  const clipId = await chooser.locator('option').nth(1).getAttribute('value')
  await chooser.selectOption(clipId!)
  await expect(page.locator('.recording-gallery video')).toBeVisible()
  await page.getByRole('button', { name: '分享影片' }).click()
  await expect(page.getByText(/請先下載/)).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '下載影片' }).click()
  expect((await download).suggestedFilename()).toMatch(/PartyBox-\d+\.(mp4|webm)$/)
  await page.reload()
  await page.getByText('裝置錄影中心', { exact: true }).click()
  await expect(page.getByRole('combobox', { name: '選擇錄影片段' }).locator('option')).toHaveCount(2)
  await page.getByRole('combobox', { name: '選擇錄影片段' }).selectOption(clipId!)
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '刪除片段' }).click()
  await expect(page.getByText('錄影已從此裝置刪除。')).toBeVisible()
  await expect(page.locator('.recording-gallery video')).toHaveCount(0)
})

test('cancel countdown never exposes a word or starts recording, including late camera permission', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Cancellation is covered once.')
  await page.clock.install()
  await ready(page)
  await page.getByRole('button', { name: '開始計時' }).click()
  await page.clock.runFor(1000)
  await page.getByRole('button', { name: '取消倒數' }).click()
  await page.clock.runFor(5000)
  await expect(page.getByRole('button', { name: '開始計時' })).toBeVisible()
  await expect(page.locator('.charades-word-card')).toHaveCount(0)
  await page.evaluate(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: () => new Promise<MediaStream>(resolve => {
      ;(window as Window & { allowLateCamera?: () => void }).allowLateCamera = () => {
        const canvas = document.createElement('canvas')
        const stream = canvas.captureStream()
        ;(window as Window & { lateCameraTrack?: MediaStreamTrack }).lateCameraTrack = stream.getVideoTracks()[0]
        resolve(stream)
      }
    }) })
  })
  await page.getByRole('checkbox', { name: '錄影本回合（前鏡頭）' }).check()
  await page.getByRole('button', { name: '開始計時' }).click()
  await expect(page.getByRole('button', { name: '等待相機權限…' })).toBeDisabled()
  await page.getByRole('button', { name: '不錄影，取消等待' }).click()
  await page.evaluate(() => (window as Window & { allowLateCamera?: () => void }).allowLateCamera?.())
  expect(await page.evaluate(() => (window as Window & { lateCameraTrack?: MediaStreamTrack }).lateCameraTrack?.readyState)).toBe('ended')
  await expect(page.getByRole('button', { name: '開始計時' })).toBeVisible()
  await expect(page.locator('.charades-countdown')).toHaveCount(0)
})
