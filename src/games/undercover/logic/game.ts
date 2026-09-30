import { taiwanWordPairs } from '../data/words'
import type {
  UndercoverPlayer,
  UndercoverRole,
  UndercoverSetup,
  UndercoverValidationResult,
  UndercoverWinner,
  WordPair
} from '../types'

export function recommendedUndercoverCount(playerCount: number): number {
  return playerCount >= 9 ? 2 : 1
}

export function validateUndercoverSetup(setup: UndercoverSetup): UndercoverValidationResult {
  const errors: string[] = []
  const names = setup.playerNames.map((name) => name.trim())
  if (names.length < 4 || names.length > 12) errors.push('誰是臥底需要 4–12 位玩家。')
  if (names.some((name) => !name)) errors.push('每位玩家都需要名稱。')
  if (new Set(names).size !== names.length) errors.push('玩家名稱不可重複。')
  if (setup.undercoverCount < 1 || setup.undercoverCount >= Math.ceil(names.length / 2)) {
    errors.push('臥底人數必須至少 1 人，且少於玩家人數的一半。')
  }
  return { valid: errors.length === 0, errors }
}

export function selectWordPair(setup: UndercoverSetup, random: () => number = Math.random): WordPair {
  const funnyCategories = new Set(['awkward', 'relationship', 'workplace', 'internet'])
  const pool = setup.category === 'mixed'
    ? taiwanWordPairs
    : setup.category === 'funny'
      ? taiwanWordPairs.filter((pair) => funnyCategories.has(pair.category))
      : taiwanWordPairs.filter((pair) => pair.category === setup.category)
  if (!pool.length) throw new Error('No undercover word pairs are available')
  return pool[Math.floor(random() * pool.length) % pool.length]!
}

export function assignUndercoverPlayers(
  setup: UndercoverSetup,
  pair: WordPair,
  random: () => number = Math.random
): UndercoverPlayer[] {
  const roles: UndercoverRole[] = setup.playerNames.map((_, index) => index < setup.undercoverCount ? 'undercover' : 'civilian')
  shuffleInPlace(roles, random)
  const flipped = random() >= 0.5
  const civilianWord = pair.words[flipped ? 1 : 0]
  const undercoverWord = pair.words[flipped ? 0 : 1]
  return setup.playerNames.map((name, index) => ({
    id: `undercover-player-${index + 1}`,
    name: name.trim(),
    role: roles[index]!,
    word: roles[index] === 'undercover' ? undercoverWord : civilianWord,
    alive: true
  }))
}

export function getUndercoverWinner(players: readonly UndercoverPlayer[]): UndercoverWinner {
  const alive = players.filter((player) => player.alive)
  const undercoverCount = alive.filter((player) => player.role === 'undercover').length
  const civilianCount = alive.length - undercoverCount
  if (undercoverCount === 0) return 'civilian'
  if (undercoverCount >= civilianCount) return 'undercover'
  return null
}

export function nextAlivePlayerId(players: readonly UndercoverPlayer[], currentId: string): string {
  const currentIndex = players.findIndex((player) => player.id === currentId)
  for (let offset = 1; offset <= players.length; offset += 1) {
    const candidate = players[(currentIndex + offset + players.length) % players.length]
    if (candidate?.alive) return candidate.id
  }
  return currentId
}

function shuffleInPlace<T>(values: T[], random: () => number): void {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    const currentValue = values[index]
    const targetValue = values[target]
    if (currentValue !== undefined && targetValue !== undefined) [values[index], values[target]] = [targetValue, currentValue]
  }
}
