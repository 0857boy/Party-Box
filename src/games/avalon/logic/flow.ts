import type {
  AvalonGameplayState,
  MissionChoice,
  MissionOutcome,
  RoleId,
  Team
} from '../types'

const missionSizes: Readonly<Record<number, readonly number[]>> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5]
}

export function getMissionTeamSize(playerCount: number, round: number): number {
  const size = missionSizes[playerCount]?.[round - 1]
  if (!size) throw new Error('Invalid Avalon player count or round')
  return size
}

export function getRequiredFails(playerCount: number, round: number): number {
  return playerCount >= 7 && round === 4 ? 2 : 1
}

export function evaluateMission(
  choices: readonly MissionChoice[],
  playerCount: number,
  round: number
): { outcome: MissionOutcome; failures: number; requiredFails: number } {
  const failures = choices.filter((choice) => choice === 'fail').length
  const requiredFails = getRequiredFails(playerCount, round)
  return { outcome: failures >= requiredFails ? 'fail' : 'success', failures, requiredFails }
}

export function getMissionChoiceOrder(randomValue?: number): MissionChoice[] {
  const value = randomValue ?? (crypto.getRandomValues(new Uint32Array(1))[0] ?? 0)
  return value % 2 === 0 ? ['success', 'fail'] : ['fail', 'success']
}

export function getMissionScore(state: AvalonGameplayState): { success: number; fail: number } {
  const completed = state.proposals.filter((proposal) => proposal.outcome)
  return {
    success: completed.filter((proposal) => proposal.outcome === 'success').length,
    fail: completed.filter((proposal) => proposal.outcome === 'fail').length
  }
}

export function nextPlayerIndex(currentIndex: number, playerCount: number): number {
  return (currentIndex + 1) % playerCount
}

export function shouldUseLadyAfterRound(round: number): boolean {
  return round >= 2 && round <= 4
}

export function isRejectionLoss(rejectionCount: number): boolean {
  return rejectionCount >= 5
}

export function getPostMissionState(state: AvalonGameplayState): 'evil-wins' | 'assassination' | 'continue' {
  const score = getMissionScore(state)
  if (score.fail >= 3) return 'evil-wins'
  if (score.success >= 3) return 'assassination'
  return 'continue'
}

export function getAssassinationWinner(targetRoleId: RoleId): Team {
  return targetRoleId === 'merlin' ? 'evil' : 'good'
}

export function createGameplayState(): AvalonGameplayState {
  return {
    phase: 'team-selection',
    round: 1,
    leaderIndex: 0,
    rejectionCount: 0,
    selectedTeamIds: [],
    missionOrderIds: [],
    missionIndex: 0,
    missionChoiceOrder: ['success', 'fail'],
    missionChoices: [],
    proposals: [],
    winner: null,
    winReason: '',
    ladyEnabled: false,
    ladySeenPlayerIds: [],
    ladyHistory: []
  }
}
