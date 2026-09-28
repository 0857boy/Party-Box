import { describe, expect, it } from 'vitest'
import { assignRoles, buildRoleDeck, getRoleInformation, teamComposition, validateRoleConfig } from './game'
import type { AvalonSetup } from '../types'

const setup: AvalonSetup = {
  playerNames: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  enabledRoles: ['merlin', 'percival', 'morgana', 'assassin', 'mordred']
}

describe('Avalon rules', () => {
  it('builds the correct team composition', () => {
    const deck = buildRoleDeck(setup)
    expect(deck.filter((role) => role.team === 'good')).toHaveLength(teamComposition[7]?.good ?? 0)
    expect(deck.filter((role) => role.team === 'evil')).toHaveLength(teamComposition[7]?.evil ?? 0)
  })

  it('assigns exactly one role to every player', () => {
    const players = assignRoles(setup, () => 0.42)
    expect(players).toHaveLength(7)
    expect(players.every((player) => player.role)).toBe(true)
  })

  it('hides Mordred from Merlin', () => {
    const players = assignRoles(setup, () => 0.37)
    const merlin = players.find((player) => player.role.id === 'merlin')
    const mordred = players.find((player) => player.role.id === 'mordred')
    expect(merlin).toBeDefined()
    expect(mordred).toBeDefined()
    expect(getRoleInformation(merlin!, players).visiblePlayerIds).not.toContain(mordred!.id)
  })

  it('rejects duplicate player names', () => {
    const result = validateRoleConfig({ ...setup, playerNames: ['A', 'A', 'C', 'D', 'E'] })
    expect(result.valid).toBe(false)
  })
})
