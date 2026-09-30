import type { TeamScore } from '../types/gameplay'

export function createScoreboard(teamIds: readonly string[], roundCount: number): TeamScore[] {
  return teamIds.map((teamId) => ({ teamId, byRound: Array.from({ length: roundCount }, () => 0) }))
}

export function awardPoint(scores: TeamScore[], teamId: string, roundIndex: number): void {
  const score = scores.find((item) => item.teamId === teamId)
  if (!score || score.byRound[roundIndex] === undefined) return
  score.byRound[roundIndex] += 1
}

export function totalScore(score: TeamScore): number {
  return score.byRound.reduce((total, value) => total + value, 0)
}
