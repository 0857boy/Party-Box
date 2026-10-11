import { beforeEach, describe, expect, it } from 'vitest'
import {
  beginCharadesTurn, beginNextRound, charadesSession, continueAfterTurn,
  currentClueGiver, currentRound, currentTeam, endCharadesTurn,
  guessCurrentCard, resetCharadesSession, skipCurrentCard, startCharadesGame
} from './session'

beforeEach(() => {
  resetCharadesSession()
  Object.assign(charadesSession.setup, {
    playerNames: ['A', 'B', 'C', 'D', 'E', 'F'],
    teamNames: ['珍奶隊', '雞排隊'], teamAssignments: [0, 1, 0, 1, 0, 1],
    category: 'mixed', difficulty: 'easy', mode: 'quick', clueStyle: 'acting',
    turnsPerTeam: 2, turnSeconds: 45, deckSize: 24
  })
})

describe('Charades timed team match', () => {
  it('alternates equal timed turns, rotates performers and records skips without points', () => {
    startCharadesGame()
    const firstTeam = currentTeam.value!.id
    const firstPerformer = currentClueGiver.value!.id
    for (let turn = 0; turn < 4; turn += 1) {
      expect(currentTeam.value!.id === firstTeam).toBe(turn % 2 === 0)
      expect(currentRound.value?.number).toBe(Math.floor(turn / 2) + 1)
      if (turn === 2) expect(currentClueGiver.value!.id).not.toBe(firstPerformer)
      beginCharadesTurn()
      const skipped = charadesSession.game!.currentCardId!
      skipCurrentCard()
      expect(charadesSession.game!.phase).toBe('playing')
      expect(charadesSession.game!.currentCardId).not.toBe(skipped)
      guessCurrentCard()
      guessCurrentCard()
      endCharadesTurn()
      endCharadesTurn() // A repeated timer callback cannot duplicate a turn.
      expect(charadesSession.game!.turns).toHaveLength(turn + 1)
      expect(charadesSession.game!.turns.at(-1)?.skippedCardIds).toEqual([skipped])
      expect(charadesSession.game!.phase).toBe('turn-result')
      continueAfterTurn()
    }
    expect(charadesSession.game!.phase).toBe('result')
    expect(charadesSession.game!.scores.map(score => score.byRound)).toEqual([[2, 2], [2, 2]])
  })

  it('does not end timed play when the pool is exhausted or every card is skipped', () => {
    startCharadesGame()
    const game = charadesSession.game!
    game.selectedCards = game.selectedCards.slice(0, 2)
    game.remainingCardIds = game.selectedCards.map(card => card.id)
    beginCharadesTurn()
    for (let index = 0; index < 8; index += 1) {
      const previous = game.currentCardId
      expect(skipCurrentCard()).toBe('continue')
      expect(game.currentCardId).not.toBe(previous)
    }
    expect(game.phase).toBe('playing')
    expect(game.scores.flatMap(score => score.byRound)).toEqual([0, 0, 0, 0])
    for (let index = 0; index < 8; index += 1) expect(guessCurrentCard()).toBe('continue')
    endCharadesTurn()
    expect(game.turns[0]?.guessedCardIds).toHaveLength(8)
    expect(game.turns[0]?.skippedCardIds).toHaveLength(8)
  })

  it('snapshots match rules and finishes both teams even when nobody scores', () => {
    charadesSession.setup.turnsPerTeam = 1
    charadesSession.setup.clueStyle = 'describe'
    startCharadesGame()
    charadesSession.setup.mode = 'classic'
    charadesSession.setup.turnsPerTeam = 3
    expect(currentRound.value?.name).toBe('自由描述')
    for (let turn = 0; turn < 2; turn += 1) {
      beginCharadesTurn()
      endCharadesTurn()
      continueAfterTurn()
    }
    expect(charadesSession.game?.phase).toBe('result')
    expect(charadesSession.game?.turns).toHaveLength(2)
  })

  it('retains the optional three-round shared deck and scoring rules', () => {
    charadesSession.setup.mode = 'classic'
    startCharadesGame()
    const game = charadesSession.game!
    const original = [...game.remainingCardIds].sort()
    for (let round = 0; round < 3; round += 1) {
      expect([...game.remainingCardIds].sort()).toEqual(original)
      beginCharadesTurn()
      for (let index = 0; index < original.length; index += 1) guessCurrentCard()
      expect(game.phase).toBe(round === 2 ? 'result' : 'round-result')
      if (round < 2) beginNextRound()
    }
    expect(game.turns).toHaveLength(3)
    expect(game.scores.reduce((sum, score) => sum + score.byRound.reduce((a, b) => a + b, 0), 0)).toBe(72)
  })
})
