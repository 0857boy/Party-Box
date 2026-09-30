import { describe, expect, it } from 'vitest'
import { undercoverWordPairs, wordCategories } from '../data/words'
import type { UndercoverSetup } from '../types'
import {
  assignUndercoverPlayers,
  getUndercoverWinner,
  nextAlivePlayerId,
  recommendedUndercoverCount,
  selectWordPair,
  validateUndercoverSetup
} from './game'

const setup: UndercoverSetup = {
  playerNames: ['A', 'B', 'C', 'D', 'E'],
  category: 'food',
  undercoverCount: 1,
  blankEnabled: false
}

describe('Undercover rules', () => {
  it('ships a substantial Taiwanese vocabulary library', () => {
    expect(undercoverWordPairs.length).toBeGreaterThanOrEqual(300)
    expect(new Set(undercoverWordPairs.map((pair) => pair.id)).size).toBe(undercoverWordPairs.length)
    expect(wordCategories.every((category) => undercoverWordPairs.some((pair) => pair.category === category.id))).toBe(true)
  })

  it('recommends two undercovers for large groups', () => {
    expect(recommendedUndercoverCount(8)).toBe(1)
    expect(recommendedUndercoverCount(9)).toBe(2)
  })

  it('validates player names and role balance', () => {
    expect(validateUndercoverSetup(setup).valid).toBe(true)
    expect(validateUndercoverSetup({ ...setup, playerNames: ['A', 'A', 'B', 'C'] }).valid).toBe(false)
    expect(validateUndercoverSetup({ ...setup, undercoverCount: 3 }).valid).toBe(false)
  })

  it('selects from the requested category and assigns every player', () => {
    const pair = selectWordPair(setup, () => 0)
    expect(pair.category).toBe('food')
    const players = assignUndercoverPlayers(setup, pair, () => 0)
    expect(players).toHaveLength(5)
    expect(players.filter((player) => player.role === 'undercover')).toHaveLength(1)
    expect(new Set(players.map((player) => player.word)).size).toBe(2)
  })

  it('keeps the funny mix inside the four comedy categories', () => {
    const pair = selectWordPair({ ...setup, category: 'funny' }, () => 0.75)
    expect(['awkward', 'relationship', 'workplace', 'internet']).toContain(pair.category)
  })

  it('ends when all undercovers leave or reach parity', () => {
    const pair = selectWordPair(setup, () => 0)
    const players = assignUndercoverPlayers(setup, pair, () => 0)
    const undercover = players.find((player) => player.role === 'undercover')!
    undercover.alive = false
    expect(getUndercoverWinner(players)).toBe('civilian')
    undercover.alive = true
    players.filter((player) => player.role === 'civilian').slice(0, 3).forEach((player) => { player.alive = false })
    expect(getUndercoverWinner(players)).toBe('undercover')
  })

  it('assigns an optional blank card and counts it with the hidden side', () => {
    const pair = selectWordPair(setup, () => 0)
    const players = assignUndercoverPlayers({ ...setup, playerNames: [...setup.playerNames, 'F'], blankEnabled: true }, pair, () => 0)
    const blank = players.find((player) => player.role === 'blank')
    expect(blank?.word).toBe('')
    expect(players.filter((player) => player.role === 'blank')).toHaveLength(1)
  })

  it('requires both the undercover and blank card to be eliminated', () => {
    const pair = selectWordPair(setup, () => 0)
    const players = assignUndercoverPlayers({ ...setup, playerNames: [...setup.playerNames, 'F'], blankEnabled: true }, pair, () => 0)
    const undercover = players.find((player) => player.role === 'undercover')!
    const blank = players.find((player) => player.role === 'blank')!
    undercover.alive = false
    expect(getUndercoverWinner(players)).toBeNull()
    blank.alive = false
    expect(getUndercoverWinner(players)).toBe('civilian')
  })

  it('rotates to the next living speaker', () => {
    const pair = selectWordPair(setup, () => 0)
    const players = assignUndercoverPlayers(setup, pair, () => 0)
    players[1]!.alive = false
    expect(nextAlivePlayerId(players, players[0]!.id)).toBe(players[2]!.id)
  })
})
