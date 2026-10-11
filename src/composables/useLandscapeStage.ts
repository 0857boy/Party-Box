import { onBeforeUnmount, ref } from 'vue'

type LockableOrientation = ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> }

// Native locking is best effort. The game also uses a fixed landscape surface
// in CSS, including Safari/rotation-lock devices that cannot lock orientation.
export function useLandscapeStage() {
  const active = ref(false)
  const rotation = ref<90 | -90>(90)
  let ownedFullscreen = false
  let ownedLock = false
  let generation = 0

  function start(): void {
    active.value = true
    const angle = screen.orientation?.angle
    rotation.value = angle === 270 || angle === -90 ? -90 : 90
    const token = ++generation
    const api = screen.orientation as LockableOrientation | undefined
    if (!api?.lock) return
    // This call must start directly from the player's button click. Do not
    // await permission dialogs before requesting fullscreen.
    void (async () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen()
          ownedFullscreen = true
        }
        if (token !== generation || !active.value) { await release(); return }
        await api.lock!('landscape')
        ownedLock = true
        if (token !== generation || !active.value) await release()
      } catch {
        // The CSS surface stays landscape if fullscreen/locking is unavailable.
      }
    })()
  }

  async function release(): Promise<void> {
    if (ownedLock) { try { screen.orientation?.unlock() } catch { /* Optional API. */ } }
    ownedLock = false
    if (ownedFullscreen && document.fullscreenElement) {
      try { await document.exitFullscreen() } catch { /* Browser may already have exited. */ }
    }
    ownedFullscreen = false
  }

  function stop(): void {
    active.value = false
    ++generation
    void release()
  }

  onBeforeUnmount(stop)
  return { active, rotation, start, stop }
}
