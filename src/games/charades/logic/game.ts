import { createWordDeck, shuffleItems } from '../../../engine/wordDeck'
import { charadesCards } from '../data/cards'
import type { CharadesCategory, CharadesSetup } from '../types'

export function validateCharadesSetup(setup: CharadesSetup): string[] {
  const errors: string[] = []
  const names = setup.playerNames.map((name) => name.trim())
  if (names.length < 4 || names.length > 16) errors.push('爆笑猜詞需要 4–16 位玩家。')
  if (names.some((name) => !name)) errors.push('每位玩家都需要名稱。')
  if (new Set(names).size !== names.length) errors.push('玩家名稱不可重複。')
  if (![24, 32, 40].includes(setup.deckSize)) errors.push('請選擇有效的牌庫張數。')
  if (![30, 45, 60, 90].includes(setup.turnSeconds)) errors.push('請選擇有效的回合時間。')
  if (cardsForCategory(setup.category).length < setup.deckSize) errors.push('這個主題的詞語不足以建立牌庫。')
  return errors
}

export function cardsForCategory(category: CharadesCategory) {
  if (category === 'mixed') return charadesCards
  return charadesCards.filter((card) => card.category === category)
}

export function selectCharadesDeck(setup: CharadesSetup, random: () => number = Math.random) {
  return createWordDeck(cardsForCategory(setup.category), setup.deckSize, random)
}

export function rebuildRoundDeck(cardIds: readonly string[], random: () => number = Math.random): string[] {
  return shuffleItems(cardIds, random)
}
