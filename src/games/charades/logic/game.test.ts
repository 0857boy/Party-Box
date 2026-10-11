import { describe, expect, it } from 'vitest'
import { createScoreboard, awardPoint, totalScore } from '../../../engine/scoreManager'
import { createAlternatingTeams, createRandomTeamAssignments, createTeamsFromAssignments, nextTeamMember } from '../../../engine/teamManager'
import { classicGuessingRounds, lowerScoringTeamIndex } from '../../../engine/roundManager'
import { charadesCards, charadesCategories } from '../data/cards'
import type { CharadesSetup } from '../types'
import { cardsForCategory, quickPlaySeconds, roundsForSettings, selectCharadesDeck, validateCharadesSetup } from './game'

const setup: CharadesSetup = {
  playerNames: ['A', 'B', 'C', 'D', 'E', 'F'],
  teamNames: ['閃電隊', '火箭隊'],
  teamAssignments: [0, 1, 0, 1, 0, 1],
  category: 'mixed',
  deckSize: 32,
  turnSeconds: 60,
  mode: 'classic',
  difficulty: 'normal',
  clueStyle: 'acting',
  turnsPerTeam: 2
}

describe('Charades game engine', () => {
  it('ships enough original cards for every deck option', () => {
    expect(charadesCards.length).toBeGreaterThanOrEqual(400)
    expect(new Set(charadesCards.map((card) => card.id)).size).toBe(charadesCards.length)
    expect(new Set(charadesCards.map(card => card.label)).size).toBe(charadesCards.length)
    expect(charadesCards.every(card => [...card.label].length <= 6 && !/[，。！？\s]/u.test(card.label))).toBe(true)
  })

  it('filters real content by difficulty and theme, including every supported combination', () => {
    for (const category of charadesCategories) {
      for (const difficulty of ['easy', 'normal', 'hard'] as const) {
        const pool = cardsForCategory(category.id, difficulty)
        expect(pool.length).toBeGreaterThanOrEqual(20)
        expect(pool.every(card => category.id === 'mixed' || card.category === category.id)).toBe(true)
        if (difficulty === 'easy') expect(pool.every(card => card.difficulty === 'easy')).toBe(true)
        if (difficulty === 'normal') expect(pool.every(card => card.difficulty !== 'hard')).toBe(true)
        if (difficulty === 'hard') expect(pool.every(card => card.difficulty !== 'easy')).toBe(true)
      }
    }
    expect(cardsForCategory('mixed', 'easy').some(card => card.label === '企鵝')).toBe(true)
    expect(cardsForCategory('mixed', 'easy').some(card => card.label === '黔驢技窮')).toBe(false)
  })

  it('uses the full pool in timed play and caps a classic deck to available short words', () => {
    expect(selectCharadesDeck({ ...setup, mode: 'quick' })).toHaveLength(cardsForCategory('mixed', 'normal').length)
    const limited = { ...setup, category: 'idioms' as const, difficulty: 'easy' as const, deckSize: 40 }
    expect(validateCharadesSetup(limited)).toEqual([])
    expect(selectCharadesDeck(limited)).toHaveLength(cardsForCategory('idioms', 'easy').length)
    expect(roundsForSettings({ ...setup, mode: 'quick', turnsPerTeam: 1 })).toHaveLength(1)
    expect(quickPlaySeconds({ ...setup, mode: 'quick', turnsPerTeam: 2, turnSeconds: 45 })).toBe(180)
  })

  it('validates setup and selects a unique deck', () => {
    expect(validateCharadesSetup(setup)).toEqual([])
    expect(validateCharadesSetup({ ...setup, playerNames: ['A', 'A', 'B', 'C'] }).length).toBeGreaterThan(0)
    const deck = selectCharadesDeck(setup, () => 0.5)
    expect(deck).toHaveLength(32)
    expect(new Set(deck.map((card) => card.id)).size).toBe(32)
  })

  it('alternates teams and clue givers', () => {
    const teams = createAlternatingTeams(['1', '2', '3', '4', '5', '6'])
    expect(teams[0]?.playerIds).toEqual(['1', '3', '5'])
    expect(teams[1]?.playerIds).toEqual(['2', '4', '6'])
    expect(nextTeamMember(teams[0]!, '5')).toBe('1')
  })

  it('randomizes balanced teams while keeping custom names', () => {
    const assignments = createRandomTeamAssignments(7, () => 0)
    const teams = createTeamsFromAssignments(['1', '2', '3', '4', '5', '6', '7'], assignments, ['珍奶隊', '雞排隊'])
    expect(teams.map((team) => team.name)).toEqual(['珍奶隊', '雞排隊'])
    expect(Math.abs(teams[0]!.playerIds.length - teams[1]!.playerIds.length)).toBe(1)
  })

  it('tracks one point per guessed card and starts the trailing team', () => {
    const scores = createScoreboard(['a', 'b'], classicGuessingRounds.length)
    awardPoint(scores, 'a', 0)
    awardPoint(scores, 'a', 0)
    awardPoint(scores, 'b', 0)
    expect(totalScore(scores[0]!)).toBe(2)
    expect(lowerScoringTeamIndex(scores, 0)).toBe(1)
  })
})
