import { computed, onBeforeUnmount, ref } from 'vue'

export function useCountdownTimer(initialSeconds: number, onFinished: () => void) {
  const secondsLeft = ref(initialSeconds)
  const running = ref(false)
  let intervalId: number | undefined
  let deadline = 0

  const progress = computed(() => Math.max(0, Math.min(1, secondsLeft.value / initialSeconds)))

  function start(): void {
    stopInterval()
    secondsLeft.value = initialSeconds
    deadline = Date.now() + initialSeconds * 1000
    running.value = true
    intervalId = window.setInterval(tick, 200)
  }

  function finish(): void {
    if (!running.value) return
    running.value = false
    stopInterval()
    secondsLeft.value = 0
    onFinished()
  }

  function stop(): void {
    running.value = false
    stopInterval()
  }

  function tick(): void {
    secondsLeft.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
    if (deadline <= Date.now()) finish()
  }

  function stopInterval(): void {
    if (intervalId !== undefined) window.clearInterval(intervalId)
    intervalId = undefined
  }

  onBeforeUnmount(stopInterval)
  return { secondsLeft, running, progress, start, stop, finish }
}
