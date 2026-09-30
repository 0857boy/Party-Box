import type { WordDeckCard } from '../types/gameplay'

export function shuffleItems<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    const current = result[index]
    const replacement = result[target]
    if (current !== undefined && replacement !== undefined) [result[index], result[target]] = [replacement, current]
  }
  return result
}

export function createWordDeck(cards: readonly WordDeckCard[], size: number, random: () => number = Math.random): WordDeckCard[] {
  if (size < 1 || size > cards.length) throw new Error('Invalid word deck size')
  return shuffleItems(cards, random).slice(0, size)
}
