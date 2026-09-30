import { shuffleItems } from '../../../engine/wordDeck'
import { fakeArtistPrompts } from '../data/prompts'
import type { FakeArtistCategory, FakeArtistPrompt, FakeArtistSetup } from '../types'

export function validateFakeArtistSetup(setup: FakeArtistSetup): string[] {
  const errors: string[] = []
  const names = setup.playerNames.map((name) => name.trim())
  if (names.length < 5 || names.length > 10) errors.push('誰是假畫家需要 5–10 位玩家。')
  if (names.some((name) => !name)) errors.push('每位玩家都需要名稱。')
  if (new Set(names).size !== names.length) errors.push('玩家名稱不可重複。')
  if (![1, 3, 5].includes(setup.targetScore)) errors.push('請選擇有效的勝利分數。')
  return errors
}

export function selectFakeArtistPrompt(category: FakeArtistCategory, excludedId?: string, random: () => number = Math.random): FakeArtistPrompt {
  const pool = fakeArtistPrompts.filter((prompt) => (category === 'mixed' || prompt.category === category) && prompt.id !== excludedId)
  if (!pool.length) throw new Error('No fake artist prompts are available')
  return pool[Math.floor(random() * pool.length) % pool.length]!
}

export function createDrawingOrder(playerIds: readonly string[], random: () => number = Math.random): string[] {
  return shuffleItems(playerIds, random)
}

export function selectFakePlayerId(playerIds: readonly string[], previousId?: string, random: () => number = Math.random): string {
  const pool = playerIds.filter((id) => id !== previousId)
  return pool[Math.floor(random() * pool.length) % pool.length] ?? playerIds[0]!
}
