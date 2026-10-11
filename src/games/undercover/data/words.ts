import type { UndercoverDifficultySelection, WordCategory, WordCategorySelection, WordPair } from '../types'
import { foodPairs, dailyPairs, campusPairs, transportPairs, leisurePairs, taiwanPairs, awkwardPairs, relationshipPairs, workplacePairs, internetPairs, animalPairs, objectPairs, peoplePairs, placePairs } from './pairs'

export const wordCategories: readonly WordCategory[] = [
  { id: 'food', name: '台灣美食', description: '小吃、飲料、料理與甜點' },
  { id: 'daily', name: '生活日常', description: '日常行為與生活狀況' },
  { id: 'campus', name: '校園生活', description: '課程、考試與校園回憶' },
  { id: 'transport', name: '交通通勤', description: '交通工具與通勤經驗' },
  { id: 'leisure', name: '休閒娛樂', description: '影音、遊戲、運動與戶外' },
  { id: 'taiwan', name: '台灣文化', description: '習俗、節慶與在地生活' },
  { id: 'awkward', name: '尷尬現場', description: '出糗、社死與意外插曲' },
  { id: 'relationship', name: '感情人際', description: '戀愛、友情與人際互動' },
  { id: 'workplace', name: '職場生活', description: '工作、會議與辦公室日常' },
  { id: 'internet', name: '網路文化', description: '社群、聊天與網路互動' },
  { id: 'animals', name: '動物世界', description: '動物、昆蟲、鳥類與海洋生物' },
  { id: 'objects', name: '日常物品', description: '家電、家具與生活用品' },
  { id: 'people', name: '人物職業', description: '職業、身分與人物類型' },
  { id: 'places', name: '地點自然', description: '公共場所、景點與自然現象' }
]

export const undercoverWordPairs: readonly WordPair[] = [
  ...foodPairs, ...dailyPairs, ...campusPairs, ...transportPairs, ...leisurePairs,
  ...taiwanPairs, ...awkwardPairs, ...relationshipPairs, ...workplacePairs,
  ...internetPairs, ...animalPairs, ...objectPairs, ...peoplePairs, ...placePairs
]

const funnyCategories = new Set(['awkward', 'relationship', 'workplace', 'internet'])

export function normalizeUndercoverCategory(value: unknown): WordCategorySelection {
  if (value === 'sports') return 'leisure'
  if (value === 'mixed' || value === 'funny' || wordCategories.some(category => category.id === value)) return value as WordCategorySelection
  return 'funny'
}

export function normalizeUndercoverDifficulty(value: unknown): UndercoverDifficultySelection {
  return value === 'easy' || value === 'normal' || value === 'hard' ? value : 'all'
}

export function getUndercoverPairs(category: WordCategorySelection, difficulty: UndercoverDifficultySelection = 'all'): WordPair[] {
  return undercoverWordPairs.filter(pair => pair.status === 'reviewed'
    && (difficulty === 'all' || pair.difficulty === difficulty)
    && (category === 'mixed' || (category === 'funny' ? funnyCategories.has(pair.category) : pair.category === category)))
}
