import { describe, expect, it } from 'vitest'
import { fakeArtistPrompts } from '../data/prompts'
import type { FakeArtistSetup } from '../types'
import { createDrawingOrder, selectFakeArtistPrompt, selectFakePlayerId, validateFakeArtistSetup } from './game'

const setup: FakeArtistSetup = {
  playerNames: ['A', 'B', 'C', 'D', 'E'],
  category: 'mixed',
  targetScore: 5
}

describe('Fake artist rules', () => {
  it('ships a large draw-friendly prompt library', () => {
    expect(fakeArtistPrompts).toHaveLength(100)
    expect(new Set(fakeArtistPrompts.map((prompt) => prompt.id)).size).toBe(100)
  })

  it('validates the official player range', () => {
    expect(validateFakeArtistSetup(setup)).toEqual([])
    expect(validateFakeArtistSetup({ ...setup, playerNames: ['A', 'B', 'C', 'D'] })).toContain('誰是偽畫家需要 5–10 位玩家。')
  })

  it('filters topics and avoids the previous topic', () => {
    const first = selectFakeArtistPrompt('animals', undefined, () => 0)
    const second = selectFakeArtistPrompt('animals', first.id, () => 0)
    expect(first.category).toBe('animals')
    expect(second.id).not.toBe(first.id)
  })

  it('avoids assigning the same fake artist twice in a row', () => {
    expect(selectFakePlayerId(['1', '2', '3'], '1', () => 0)).toBe('2')
    expect(createDrawingOrder(['1', '2', '3'], () => 0)).toHaveLength(3)
  })
})
