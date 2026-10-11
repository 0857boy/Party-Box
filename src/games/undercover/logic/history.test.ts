import { describe, expect, it } from 'vitest'
import { undercoverWordPairs } from '../data/words'
import { getUndercoverUsedWords, normalizeUndercoverHistory } from './history'
import { normalizeUndercoverSetup } from './setup'
import { validateUndercoverSetup } from './game'

describe('undercover local draw history', () => {
  it('recovers corrupt history and removes unknown IDs and duplicates', () => {
    for (const value of [null, false, 123, 'bad', {}, { usedPairIds: {} }]) {
      expect(normalizeUndercoverHistory(value, undercoverWordPairs)).toEqual({ usedPairIds: [] })
    }
    expect(normalizeUndercoverHistory({ usedPairIds: ['food-01', 'food-01', 'retired-99', null, 42] }, undercoverWordPairs)).toEqual({ usedPairIds: ['food-01'] })
  })

  it('derives normalized used words from IDs without storing any player-word or role mapping', () => {
    const history = normalizeUndercoverHistory({ usedPairIds: ['food-01', 'food-06'] }, undercoverWordPairs)
    expect([...getUndercoverUsedWords(history, undercoverWordPairs)]).toEqual(['雞排', '鹽酥雞', '鍋貼', '水餃'])
    expect(Object.keys(history)).toEqual(['usedPairIds'])
    expect(getUndercoverUsedWords({ usedPairIds: [] }, undercoverWordPairs).size).toBe(0)
  })

  it('accepts old and partial setup data and safely recovers malformed local JSON shapes', () => {
    expect(normalizeUndercoverSetup({ playerNames: ['安', '哲', '葵', '玲', '雄'], category: 'sports', undercoverCount: 1, blankEnabled: true }))
      .toEqual({ playerNames: ['安', '哲', '葵', '玲', '雄'], category: 'leisure', undercoverCount: 1, blankEnabled: true, difficulty: 'all' })
    expect(normalizeUndercoverSetup({ category: 'food', difficulty: 'easy' })).toMatchObject({ category: 'food', difficulty: 'easy' })
    for (const value of [null, [], 'bad', 0, { playerNames: [null, 12, '安', '安', '  '], undercoverCount: 9, blankEnabled: true, category: 'removed' }]) {
      expect(validateUndercoverSetup(normalizeUndercoverSetup(value)).valid).toBe(true)
    }
  })
})
