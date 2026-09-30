import type { PartyTeam } from '../types/gameplay'

export function createAlternatingTeams(playerIds: readonly string[], names: readonly [string, string] = ['閃電隊', '火箭隊']): PartyTeam[] {
  return [
    { id: 'team-a', name: names[0], playerIds: playerIds.filter((_, index) => index % 2 === 0) },
    { id: 'team-b', name: names[1], playerIds: playerIds.filter((_, index) => index % 2 === 1) }
  ]
}

export function createTeamsFromAssignments(
  playerIds: readonly string[],
  assignments: readonly (0 | 1)[],
  names: readonly [string, string]
): PartyTeam[] {
  return [
    { id: 'team-a', name: names[0], playerIds: playerIds.filter((_, index) => assignments[index] === 0) },
    { id: 'team-b', name: names[1], playerIds: playerIds.filter((_, index) => assignments[index] === 1) }
  ]
}

export function createRandomTeamAssignments(playerCount: number, random: () => number = Math.random): Array<0 | 1> {
  const assignments: Array<0 | 1> = Array.from({ length: playerCount }, (_, index) => index % 2 as 0 | 1)
  for (let index = assignments.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    const current = assignments[index]
    const replacement = assignments[target]
    if (current !== undefined && replacement !== undefined) [assignments[index], assignments[target]] = [replacement, current]
  }
  return assignments
}

export function nextTeamMember(team: PartyTeam, currentPlayerId?: string): string {
  if (!team.playerIds.length) throw new Error('A team needs at least one player')
  const index = currentPlayerId ? team.playerIds.indexOf(currentPlayerId) : -1
  return team.playerIds[(index + 1) % team.playerIds.length]!
}
