import { getUndercoverPairs } from '../data/words'
import { normalizeUndercoverWord } from '../data/quality'
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
  if (setup.blankEnabled && names.length < 5) errors.push('白板模式至少需要 5 位玩家。')
  if (setup.undercoverCount + (setup.blankEnabled ? 1 : 0) >= Math.ceil(names.length / 2)) {
    errors.push('臥底與白板總數必須少於玩家人數的一半。')
  }
  if (!getUndercoverPairs(setup.category, setup.difficulty ?? 'all').length) errors.push('此主題與難度沒有可用詞組，請更換設定。')
  return { valid: errors.length === 0, errors }
}

export function selectWordPair(setup: UndercoverSetup, random: () => number = Math.random): WordPair {
  const pool = getUndercoverPairs(setup.category, setup.difficulty ?? 'all')
  if (!pool.length) throw new Error('No undercover word pairs are available')
  return pool[randomIndex(pool.length, random)]!
}

// Never silently reuse a pair. Word reuse is allowed only when no word-fresh
// unseen pair remains in this filtered pool. History is shared across themes.
export function pickUndercoverPair(
  pairs: readonly WordPair[], usedPairIds: Set<string>, usedWords: Set<string>,
  random: () => number = Math.random
): WordPair | null {
  const normalizedUsedWords = new Set([...usedWords].map(normalizeUndercoverWord))
  const unseen = pairs.filter(pair => pair.status === 'reviewed' && !usedPairIds.has(pair.id))
  const fresh = unseen.filter(pair => pair.words.every(word => !normalizedUsedWords.has(normalizeUndercoverWord(word))))
  const pool = fresh.length ? fresh : unseen
  if (!pool.length) return null
  const pair = pool[randomIndex(pool.length, random)]!
  usedPairIds.add(pair.id)
  pair.words.forEach(word => usedWords.add(normalizeUndercoverWord(word)))
  return pair
}

function randomIndex(length: number, random: () => number): number {
  return Math.min(length - 1, Math.max(0, Math.floor(random() * length)))
}

export function assignUndercoverPlayers(
  setup: UndercoverSetup,
  pair: WordPair,
  random: () => number = Math.random
): UndercoverPlayer[] {
  const roles: UndercoverRole[] = setup.playerNames.map((_, index) => {
    if (index < setup.undercoverCount) return 'undercover'
    if (setup.blankEnabled && index === setup.undercoverCount) return 'blank'
    return 'civilian'
  })
  shuffleInPlace(roles, random)
  const flipped = random() >= 0.5
  const civilianWord = pair.words[flipped ? 1 : 0]
  const undercoverWord = pair.words[flipped ? 0 : 1]
  return setup.playerNames.map((name, index) => ({
    id: `undercover-player-${index + 1}`,
    name: name.trim(),
    role: roles[index]!,
    word: roles[index] === 'blank' ? '' : roles[index] === 'undercover' ? undercoverWord : civilianWord,
    alive: true
  }))
}

export function getUndercoverWinner(players: readonly UndercoverPlayer[]): UndercoverWinner {
  const alive = players.filter((player) => player.alive)
  const undercoverCount = alive.filter((player) => player.role === 'undercover').length
  const blankCount = alive.filter((player) => player.role === 'blank').length
  const hiddenCount = undercoverCount + blankCount
  const civilianCount = alive.length - hiddenCount
  if (hiddenCount === 0) return 'civilian'
  if (hiddenCount >= civilianCount) return 'undercover'
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
