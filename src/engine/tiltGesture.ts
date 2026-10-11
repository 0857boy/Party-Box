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
  let lastActionAt = -Infinity

  function reset(): void {
    armed = false
    neutralSince = undefined
    candidate = undefined
    lastActionAt = -Infinity
  }

  function sample(z: number | null, now: number): TiltAction | undefined {
    if (z === null || !Number.isFinite(z)) return
    if (Math.abs(z) < .35) {
      neutralSince ??= now
      candidate = undefined
      if (now - neutralSince >= 200 && now - lastActionAt >= 850) armed = true
      return
    }
    neutralSince = undefined
    if (!armed) return
    const action = z < -.65 ? 'correct' : z > .65 ? 'skip' : undefined
    if (!action) { candidate = undefined; return }
    if (candidate !== action) { candidate = action; candidateSince = now; return }
    if (now - candidateSince < 120) return
    armed = false
    candidate = undefined
    lastActionAt = now
    return action
  }

  return { sample, reset }
}
