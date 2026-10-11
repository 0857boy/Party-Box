import { onBeforeUnmount, onMounted, ref } from 'vue'

const fullscreen = ref(false)
const installed = ref(false)
const supported = ref(false)
const pending = ref(false)
const message = ref('')
let attemptedAutomatically = false
let inFlight: Promise<boolean> | undefined

function refresh(): void {
  fullscreen.value = Boolean(document.fullscreenElement)
}

export function enterAppFullscreen(manual = false): Promise<boolean> {
  if (installed.value || document.fullscreenElement) return Promise.resolve(true)
  if (inFlight) return inFlight
  if (!supported.value) {
    if (manual) message.value = '此瀏覽器無法直接全螢幕。可將 Party Box 加入主畫面，再從主畫面開啟。'
    return Promise.resolve(false)
  }
  pending.value = true
  message.value = ''
  // Must run synchronously inside the click handler, not after a timer/await.
  let request: Promise<void>
  try {
    request = document.documentElement.requestFullscreen({ navigationUI: 'hide' })
  } catch {
    pending.value = false
    if (manual) message.value = '瀏覽器未允許全螢幕。可再按一次重試，或加入主畫面使用。'
    return Promise.resolve(false)
  }
  inFlight = request.then(
    () => {
      refresh()
      return true
    },
    () => {
      if (manual) message.value = '瀏覽器未允許全螢幕。可再按一次重試，或加入主畫面使用。'
      return false
    }
  ).finally(() => {
    pending.value = false
    inFlight = undefined
  })
  return inFlight
}

export function useAppFullscreen() {
  async function toggle(): Promise<void> {
    if (pending.value) return
    attemptedAutomatically = true
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); refresh() }
      catch { message.value = '無法退出全螢幕，可使用瀏覽器的返回或退出控制。' }
    } else await enterAppFullscreen(true)
  }
  return { fullscreen, installed, supported, pending, message, toggle }
}

// Owned by AppShell, which stays mounted while moving between games. Exiting
// fullscreen is respected: navigation/next clicks never force the player back.
export function useAutoAppFullscreen() {
  function firstInteraction(event: MouseEvent): void {
    if (attemptedAutomatically || installed.value || !supported.value || !event.isTrusted || event.button !== 0) return
    const target = event.target
    // Don't consume activation needed by sensors, media, sharing or editable
    // controls. Those actions must retain their own native permission gesture.
    if (target instanceof Element && target.closest('input, select, textarea, [contenteditable], [data-fullscreen-skip], .fullscreen-control, .charades-device-options, .charades-ready-card .action-dock, .recording-gallery, canvas, video')) return
    attemptedAutomatically = true
    void enterAppFullscreen()
  }
  onMounted(() => {
    refresh()
    installed.value = !document.fullscreenElement && (
      window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    )
    supported.value = typeof document.documentElement.requestFullscreen === 'function' && document.fullscreenEnabled !== false
    document.addEventListener('click', firstInteraction)
    document.addEventListener('fullscreenchange', refresh)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('click', firstInteraction)
    document.removeEventListener('fullscreenchange', refresh)
  })
}
