import { describe, expect, it } from 'vitest'
import { spectrumCards } from '../data/spectra'
import { clampPosition, isWavelengthGameOver, scoreDirection, scoreGuess, selectSpectrumCard, validateWavelengthSetup } from './game'
import type { WavelengthGame } from '../types'

describe('same frequency', () => {
  it('has a broad, nonduplicated spectrum deck', () => {
    expect(spectrumCards.length).toBeGreaterThanOrEqual(70)
    expect(new Set(spectrumCards.map((card) => `${card.left}|${card.right}`)).size).toBe(spectrumCards.length)
    const first = selectSpectrumCard([], () => 0)
    expect(selectSpectrumCard([first.id], () => 0).id).not.toBe(first.id)
  })

  it('scores target zones and the opposing direction', () => {
    expect([0, 4, 9, 16, 17].map((distance) => scoreGuess(50, 50 + distance))).toEqual([4, 4, 3, 2, 0])
    expect(scoreDirection(40, 50, 'left', 2)).toBe(1)
    expect(scoreDirection(40, 50, 'right', 2)).toBe(0)
    expect(scoreDirection(40, 50, 'left', 4)).toBe(0)
    expect(scoreDirection(50, 50, 'left', 4)).toBe(0)
    expect(clampPosition(-9)).toBe(0)
    expect(clampPosition(109)).toBe(100)
  })

  it('requires unique names and two people per team', () => {
    const base = { playerNames: ['甲', '乙', '丙', '丁'], teamNames: ['一隊', '二隊'] as [string, string], teamAssignments: [0, 1, 0, 1] as Array<0 | 1> }
    expect(validateWavelengthSetup(base)).toEqual([])
    expect(validateWavelengthSetup({ ...base, playerNames: ['甲', '甲', '丙', '丁'] })).toContain('玩家名稱不能重複。')
    expect(validateWavelengthSetup({ ...base, teamAssignments: [0, 0, 0, 1] })).toContain('每隊至少需要 2 人。')
  })

  it('waits for both teams to take equal turns before ending and continues a tie', () => {
    const round = { number: 1, card: spectrumCards[0]!, target: 50, guess: 50, clue: '線索', clueGiverId: 'a', activeTeam: 0 as const, opponentGuess: 'left' as const, earned: 4, bonus: 0 }
    const game: WavelengthGame = { mode: 'teams', phase: 'reveal', players: [], teamNames: ['甲', '乙'], scores: [12, 9], round, history: [], usedCardIds: [] }
    expect(isWavelengthGameOver(game)).toBe(false)
    game.round.number = 2
    expect(isWavelengthGameOver(game)).toBe(true)
    game.scores = [12, 12]
    expect(isWavelengthGameOver(game)).toBe(false)
    game.mode = 'co-op'
    game.round.number = 6
    expect(isWavelengthGameOver(game)).toBe(true)
  })
})
