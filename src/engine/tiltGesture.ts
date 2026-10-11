export type TiltAction = 'correct' | 'skip'

// Screen-normal gravity works in both portrait and landscape. A screen facing
// the floor has negative Z, unlike beta alone which fails after rotating a phone.
export function screenGravityZ(beta: number | null, gamma: number | null): number | null {
  if (beta === null || gamma === null || !Number.isFinite(beta) || !Number.isFinite(gamma)) return null
  return Math.cos(beta * Math.PI / 180) * Math.cos(gamma * Math.PI / 180)
}

export function createTiltGesture() {
  let armed = false
  let neutralSince: number | undefined
  let candidate: TiltAction | undefined
  let candidateSince = 0

  function reset(initiallyArmed = false): void {
    armed = initiallyArmed
    neutralSince = undefined
    candidate = undefined
  }

  function sample(z: number | null, now: number): TiltAction | undefined {
    if (z === null || !Number.isFinite(z)) return
    if (Math.abs(z) < .45) {
      neutralSince ??= now
      candidate = undefined
      // Returning to neutral is the debounce. A fixed cooldown made a quick
      // second flip get ignored, forcing the player to repeat the whole motion.
      if (now - neutralSince >= 80) armed = true
      return
    }
    neutralSince = undefined
    if (!armed) return
    const action = z < -.6 ? 'correct' : z > .6 ? 'skip' : undefined
    if (!action) { candidate = undefined; return }
    if (candidate !== action) { candidate = action; candidateSince = now; return }
    if (now - candidateSince < 60) return
    armed = false
    candidate = undefined
    return action
  }

  return { sample, reset }
}
