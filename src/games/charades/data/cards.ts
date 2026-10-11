import type { CharadesCard, CharadesCategory } from '../types'
import { animalCards } from './animals'
import { foodCards } from './food'
import { lifeCards } from './life'
import { jobCards } from './jobs'
import { sportCards } from './sports'
import { thingCards } from './things'
import { characterCards } from './characters'
import { idiomCards } from './idioms'
import { emotionCards } from './emotions'
import { celebrityCards } from './celebrities'

export const charadesCategories: readonly { id: CharadesCategory; name: string; description: string }[] = [
  { id: 'mixed', name: '歡樂混合', description: '從全部十類抽題，不另外存一份混合題庫' },
  { id: 'animals', name: '動物世界', description: '常見動物、昆蟲、鳥類與海洋生物' },
  { id: 'food', name: '美食飲料', description: '料理、夜市小吃、水果、甜點與飲料' },
  { id: 'life', name: '日常生活', description: '日常動作與生活情境，不含職業和運動' },
  { id: 'jobs', name: '職業達人', description: '常見工作與有代表性的職業動作' },
  { id: 'sports', name: '運動挑戰', description: '運動項目、球場動作與健身活動' },
  { id: 'things', name: '日常物品', description: '可以看見、使用或接觸的具體物品' },
  { id: 'characters', name: '經典角色', description: '動畫、童話、影視與神話的虛構角色' },
  { id: 'idioms', name: '成語挑戰', description: '教育部《成語典》核對過、適合表演的成語' },
  { id: 'emotions', name: '表情情緒', description: '情緒、表情與心理反應，暖場也能玩' },
  { id: 'celebrities', name: '名人明星', description: '真實人物，涵蓋藝人、運動員與歷史人物' }
]

export const charadesCards: readonly CharadesCard[] = [
  ...animalCards, ...foodCards, ...lifeCards, ...jobCards, ...sportCards,
  ...thingCards, ...characterCards, ...idiomCards, ...emotionCards, ...celebrityCards
]

export function getCharadesCards(category: CharadesCategory): CharadesCard[] {
  return category === 'mixed' ? [...charadesCards] : charadesCards.filter(card => card.category === category)
}

// Existing preferences keep their meaning; unknown categories fall back safely.
export function normalizeCharadesCategory(category: unknown): CharadesCategory {
  return charadesCategories.find(item => item.id === category)?.id ?? 'mixed'
}
