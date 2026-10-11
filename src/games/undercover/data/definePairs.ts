import type { UndercoverDifficulty, WordCategoryId, WordPair } from '../types'

// Each row is authored, including its stable ID, difficulty and distinction.
// Moving a pair keeps its ID; replacing BOTH its identity and meaning gets a new ID.
// reviewed = editorial checks, not a claim of player playtesting.
export function definePairs(category: WordCategoryId, tags: readonly string[], entries: string): WordPair[] {
  return entries.trim().split('\n').map(row => {
    const fields = row.trim().split('|')
    if (fields.length !== 6) throw new Error(`Invalid undercover entry: ${row}`)
    const [id, level, first, second, shared, difference] = fields as [string, string, string, string, string, string]
    const levels: Record<string, UndercoverDifficulty> = { E: 'easy', N: 'normal', H: 'hard' }
    const difficulty = levels[level]
    if (!difficulty) throw new Error(`Invalid difficulty: ${id}`)
    return { id, category, words: [first, second], difficulty, tags: [...tags],
      sharedTraits: shared.split('；'), differences: difference.split('；'), status: 'reviewed' }
  })
}
