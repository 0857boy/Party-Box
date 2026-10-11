import type { WordPair } from '../types'
import { normalizeUndercoverWord } from '../data/quality'

export interface UndercoverDrawHistory { usedPairIds: string[] }

export function normalizeUndercoverHistory(value: unknown, pairs: readonly WordPair[]): UndercoverDrawHistory {
  const ids = value && typeof value === 'object' && 'usedPairIds' in value ? value.usedPairIds : null
  const validIds = new Set(pairs.map(pair => pair.id))
  return { usedPairIds: Array.isArray(ids) ? [...new Set(ids.filter((id): id is string => typeof id === 'string' && validIds.has(id)))] : [] }
}

export function getUndercoverUsedWords(history: UndercoverDrawHistory, pairs: readonly WordPair[]): Set<string> {
  const ids = new Set(history.usedPairIds)
  return new Set(pairs.filter(pair => ids.has(pair.id)).flatMap(pair => pair.words.map(normalizeUndercoverWord)))
}
