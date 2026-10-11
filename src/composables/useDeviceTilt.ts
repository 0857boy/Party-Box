import { onBeforeUnmount, ref } from 'vue'
import { createTiltGesture, screenGravityZ, type TiltAction } from '@/engine/tiltGesture'

type PermissionOrientation = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> }

export function useDeviceTilt(onAction: (action: TiltAction) => void) {
  const enabled = ref(false)
  const receiving = ref(false)
  const message = ref('')
  const pending = ref(false)
  const gesture = createTiltGesture()
  let active = false
  let disposed = false
  let timeout: number | undefined
  let neutralSince: number | undefined
  let lastSampleAt = -Infinity

  function orientation(event: DeviceOrientationEvent): void {
    const z = screenGravityZ(event.beta, event.gamma)
    if (z === null) return
    const now = performance.now()
    lastSampleAt = now
    if (Math.abs(z) < .45) neutralSince ??= now
    else neutralSince = undefined
    receiving.value = true
    message.value = '翻轉已就緒：向下猜對、向上跳過，每次翻完回正。'
    if (active) {
      const action = gesture.sample(z, now)
      if (action) onAction(action)
    }
  }

  async function enable(): Promise<void> {
    if (pending.value || enabled.value) return
    if (!window.isSecureContext) { message.value = '翻轉需要 HTTPS；目前請用滑動或按鈕。'; return }
    const api = window.DeviceOrientationEvent as PermissionOrientation | undefined
    if (!api) { message.value = '此裝置不支援翻轉；仍可用滑動或按鈕。'; return }
    pending.value = true
    try {
      const permission = api.requestPermission ? await api.requestPermission() : 'granted'
      if (disposed) return
      if (permission !== 'granted') { message.value = '未允許動作感測；請用滑動或按鈕，或在瀏覽器設定允許。'; return }
      enabled.value = true
      window.addEventListener('deviceorientation', orientation)
      message.value = '請把手機橫拿放在額頭前，螢幕朝向隊友。'
      timeout = window.setTimeout(() => {
        if (!receiving.value) message.value = '尚未收到感測資料；可先用按鈕或滑動。'
      }, 3000)
    } catch {
      message.value = '無法啟用動作感測；請用滑動或按鈕。'
    } finally { pending.value = false }
  }

  function setActive(value: boolean): void {
    active = value
    const now = performance.now()
    // Preserve a stable upright hold during the countdown so the first flip
    // works immediately. Do not prime from a stale or already tilted sample.
    gesture.reset(value && neutralSince !== undefined && now - neutralSince >= 80 && now - lastSampleAt < 300)
  }
  function disable(): void {
    active = false
    enabled.value = false
    receiving.value = false
    neutralSince = undefined
    lastSampleAt = -Infinity
    gesture.reset()
    window.removeEventListener('deviceorientation', orientation)
    if (timeout !== undefined) window.clearTimeout(timeout)
  }
  onBeforeUnmount(() => { disposed = true; disable() })
  return { enabled, receiving, message, pending, enable, disable, setActive }
}
