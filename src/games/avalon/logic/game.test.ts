import { describe, expect, it } from 'vitest'
import { roles } from '../data/roles'
import { assignRoles, buildRoleDeck, getRoleInformation, teamComposition, validateRoleConfig } from './game'
import type { AvalonSetup } from '../types'

const setup: AvalonSetup = {
  playerNames: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  enabledRoles: ['merlin', 'percival', 'morgana', 'assassin', 'mordred'],
  ladyOfLakeEnabled: false
}

describe('Avalon rules', () => {
  it('maps every role to a distinct atlas portrait', () => {
    expect(new Set(roles.map((role) => role.atlasPosition)).size).toBe(roles.length)
  })

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

  it('shows Merlin and Morgana to Percival without identifying either', () => {
    const players = assignRoles(setup, () => 0.21)
    const percival = players.find((player) => player.role.id === 'percival')
    const expected = players
      .filter((player) => player.role.id === 'merlin' || player.role.id === 'morgana')
      .map((player) => player.id)
    const information = getRoleInformation(percival!, players)
    expect(information.visiblePlayerIds).toEqual(expected)
    expect(information.ambiguity).toBeTruthy()
  })

  it('keeps Oberon isolated from all evil players', () => {
    const oberonSetup: AvalonSetup = {
      playerNames: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      enabledRoles: ['merlin', 'percival', 'morgana', 'assassin', 'oberon'],
      ladyOfLakeEnabled: false
    }
    const players = assignRoles(oberonSetup, () => 0.63)
    const oberon = players.find((player) => player.role.id === 'oberon')
    const evilAlly = players.find((player) => player.role.team === 'evil' && player.role.id !== 'oberon')
    expect(getRoleInformation(oberon!, players).visiblePlayerIds).toHaveLength(0)
    expect(getRoleInformation(evilAlly!, players).visiblePlayerIds).not.toContain(oberon!.id)
  })

  it('rejects duplicate player names', () => {
    const result = validateRoleConfig({ ...setup, playerNames: ['A', 'A', 'C', 'D', 'E'] })
    expect(result.valid).toBe(false)
  })

  it('requires Morgana or Mordred when using Percival with five players', () => {
    const result = validateRoleConfig({
      playerNames: ['A', 'B', 'C', 'D', 'E'],
      enabledRoles: ['merlin', 'percival', 'assassin'],
      ladyOfLakeEnabled: false
    })
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('摩甘娜或莫德雷德')
  })
})
