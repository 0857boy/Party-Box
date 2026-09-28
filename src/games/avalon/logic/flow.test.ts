import { describe, expect, it } from 'vitest'
import {
  createGameplayState,
  evaluateMission,
  getAssassinationWinner,
  getMissionChoiceOrder,
  getMissionScore,
  getMissionTeamSize,
  getPostMissionState,
  getRequiredFails,
  isRejectionLoss,
  nextPlayerIndex
} from './flow'

describe('Avalon mission flow rules', () => {
  it('uses the official mission team sizes', () => {
    expect([1, 2, 3, 4, 5].map((round) => getMissionTeamSize(5, round))).toEqual([2, 3, 2, 3, 3])
    expect([1, 2, 3, 4, 5].map((round) => getMissionTeamSize(7, round))).toEqual([2, 3, 3, 4, 4])
    expect([1, 2, 3, 4, 5].map((round) => getMissionTeamSize(10, round))).toEqual([3, 4, 4, 5, 5])
  })

  it('requires two failure cards on round four with seven or more players', () => {
    expect(getRequiredFails(6, 4)).toBe(1)
    expect(getRequiredFails(7, 4)).toBe(2)
    expect(evaluateMission(['fail'], 7, 4).outcome).toBe('success')
    expect(evaluateMission(['fail', 'fail'], 7, 4).outcome).toBe('fail')
  })

  it('can place either mission card on the left', () => {
    expect(getMissionChoiceOrder(0)).toEqual(['success', 'fail'])
    expect(getMissionChoiceOrder(1)).toEqual(['fail', 'success'])
  })

  it('counts completed missions only', () => {
    const state = createGameplayState()
    state.proposals = [
      { round: 1, leaderId: '1', teamPlayerIds: [], approved: false },
      { round: 1, leaderId: '2', teamPlayerIds: [], approved: true, outcome: 'success' },
      { round: 2, leaderId: '3', teamPlayerIds: [], approved: true, outcome: 'fail' }
    ]
    expect(getMissionScore(state)).toEqual({ success: 1, fail: 1 })
  })

  it('wraps the leader', () => {
    expect(nextPlayerIndex(4, 5)).toBe(0)
  })

  it('ends after five rejected teams', () => {
    expect(isRejectionLoss(4)).toBe(false)
    expect(isRejectionLoss(5)).toBe(true)
  })

  it('requires assassination after three successful missions and lets Merlin decide the winner', () => {
    const state = createGameplayState()
    state.proposals = [1, 2, 3].map((round) => ({
      round,
      leaderId: '1',
      teamPlayerIds: [],
      approved: true,
      outcome: 'success' as const
    }))
    expect(getPostMissionState(state)).toBe('assassination')
    expect(getAssassinationWinner('merlin')).toBe('evil')
    expect(getAssassinationWinner('percival')).toBe('good')
  })
})
