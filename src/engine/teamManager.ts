import type { PartyTeam } from '../types/gameplay'

export function createAlternatingTeams(playerIds: readonly string[], names: readonly [string, string] = ['閃電隊', '火箭隊']): PartyTeam[] {
  return [
    { id: 'team-a', name: names[0], playerIds: playerIds.filter((_, index) => index % 2 === 0) },
    { id: 'team-b', name: names[1], playerIds: playerIds.filter((_, index) => index % 2 === 1) }
  ]
}

export function nextTeamMember(team: PartyTeam, currentPlayerId?: string): string {
  if (!team.playerIds.length) throw new Error('A team needs at least one player')
  const index = currentPlayerId ? team.playerIds.indexOf(currentPlayerId) : -1
  return team.playerIds[(index + 1) % team.playerIds.length]!
}
