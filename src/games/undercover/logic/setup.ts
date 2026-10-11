import { normalizeUndercoverCategory, normalizeUndercoverDifficulty } from '../data/words'
import type { UndercoverSetup } from '../types'

const defaultNames = ['玩家 1', '玩家 2', '玩家 3', '玩家 4', '玩家 5']

// Accept the existing version-3 setup while validating untrusted local JSON.
// Adding difficulty must not discard the group's names or whiteboard preference.
export function normalizeUndercoverSetup(value: unknown): UndercoverSetup {
  const saved = value && typeof value === 'object' ? value as Partial<UndercoverSetup> : {}
  const names = Array.isArray(saved.playerNames)
    ? saved.playerNames.filter((name): name is string => typeof name === 'string').map(name => name.trim()).filter(Boolean).slice(0, 12)
    : [...defaultNames]
  const playerNames = [...new Set(names)]
  let next = 1
  while (playerNames.length < 4) {
    const name = `玩家 ${next++}`
    if (!playerNames.includes(name)) playerNames.push(name)
  }
  const requestedCount = saved.undercoverCount
  const undercoverCount = (requestedCount === 1 || requestedCount === 2) && requestedCount < Math.ceil(playerNames.length / 2)
    ? requestedCount : playerNames.length >= 9 ? 2 : 1
  const blankEnabled = saved.blankEnabled === true && playerNames.length >= 5
    && undercoverCount + 1 < Math.ceil(playerNames.length / 2)
  return { playerNames, category: normalizeUndercoverCategory(saved.category),
    difficulty: normalizeUndercoverDifficulty(saved.difficulty), undercoverCount, blankEnabled }
}
