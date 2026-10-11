import { describe, expect, it } from 'vitest'
import { createTiltGesture, screenGravityZ } from './tiltGesture'

describe('forehead tilt gesture', () => {
  it('measures screen direction in portrait and landscape, without alpha or wrap-around', () => {
    expect(screenGravityZ(90, 0)).toBeCloseTo(0)
    expect(screenGravityZ(0, 90)).toBeCloseTo(0)
    expect(screenGravityZ(0, -90)).toBeCloseTo(0)
    expect(screenGravityZ(180, 0)).toBeCloseTo(-1)
    expect(screenGravityZ(-180, 0)).toBeCloseTo(-1)
    expect(screenGravityZ(0, 0)).toBeCloseTo(1)
    expect(screenGravityZ(null, 0)).toBeNull()
    expect(screenGravityZ(NaN, 0)).toBeNull()
  })

  it('requires neutral and a held flip but never needs a fixed cooldown', () => {
    const detector = createTiltGesture()
    expect(detector.sample(-1, 0)).toBeUndefined()
    detector.sample(0, 100)
    detector.sample(0, 310)
    detector.sample(-1, 400)
    expect(detector.sample(-1, 450)).toBeUndefined()
    expect(detector.sample(-1, 470)).toBe('correct')
    expect(detector.sample(-1, 2000)).toBeUndefined()
    expect(detector.sample(1, 2100)).toBeUndefined()
    detector.sample(0, 2200)
    detector.sample(0, 2410)
    detector.sample(1, 2500)
    expect(detector.sample(1, 2630)).toBe('skip')
    detector.reset()
    expect(detector.sample(1, 5000)).toBeUndefined()
  })

  it('rejects small movements, short spikes and immediate bouncing', () => {
    const detector = createTiltGesture()
    detector.sample(0, 0)
    detector.sample(0, 210)
    expect(detector.sample(.5, 300)).toBeUndefined()
    detector.sample(-1, 400)
    detector.sample(-.5, 480)
    detector.sample(-1, 500)
    expect(detector.sample(-1, 630)).toBe('correct')
    detector.sample(0, 650)
    detector.sample(0, 690) // Too brief to re-arm.
    detector.sample(1, 700)
    expect(detector.sample(1, 770)).toBeUndefined()
    expect(detector.sample(null, 1200)).toBeUndefined()
  })

  it('accepts a second intentional flip within 300ms instead of dropping it', () => {
    const detector = createTiltGesture()
    detector.reset(true) // Already upright during the countdown.
    detector.sample(-1, 0)
    expect(detector.sample(-1, 65)).toBe('correct')
    detector.sample(0, 100)
    detector.sample(0, 185)
    detector.sample(1, 200)
    expect(detector.sample(1, 265)).toBe('skip')
    expect(detector.sample(1, 500)).toBeUndefined()
  })
})
