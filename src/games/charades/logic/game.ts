import { shuffleItems } from '../../../engine/wordDeck'
import { charadesCards } from '../data/cards'
import { classicGuessingRounds } from '../../../engine/roundManager'
import type { CharadesCategory, CharadesDifficulty, CharadesMatchSettings, CharadesSetup } from '../types'

export const charadesDifficulties: readonly { id: CharadesDifficulty; name: string; description: string }[] = [
  { id: 'easy', name: '簡單', description: '具體好演的常見詞，親友、長輩都能加入' },
  { id: 'normal', name: '標準', description: '加入更多角色、職業與成語，適合朋友聚會' },
  { id: 'hard', name: '挑戰', description: '偏重較難演的短詞與成語，不靠冷知識刁難' }
]

export function validateCharadesSetup(setup: CharadesSetup): string[] {
  const errors: string[] = []
  const names = setup.playerNames.map((name) => name.trim())
  if (names.length < 4 || names.length > 16) errors.push('爆笑猜詞需要 4–16 位玩家。')
  if (names.some((name) => !name)) errors.push('每位玩家都需要名稱。')
  if (new Set(names).size !== names.length) errors.push('玩家名稱不可重複。')
  const teamNames = setup.teamNames.map((name) => name.trim())
  if (teamNames.some((name) => !name)) errors.push('兩隊都需要隊伍名稱。')
  if (teamNames[0] === teamNames[1]) errors.push('兩隊名稱不可相同。')
  if (setup.teamAssignments.length !== names.length) errors.push('分隊資料與玩家人數不一致，請重新分隊。')
  const teamSizes = [setup.teamAssignments.filter((team) => team === 0).length, setup.teamAssignments.filter((team) => team === 1).length]
  if (teamSizes.some((size) => size < 2)) errors.push('兩隊都至少需要 2 人；可以手動調整或按「打亂重分」。')
  if (![24, 32, 40].includes(setup.deckSize)) errors.push('請選擇有效的牌庫張數。')
  if (![30, 45, 60, 90].includes(setup.turnSeconds)) errors.push('請選擇有效的回合時間。')
  if (!['quick', 'classic'].includes(setup.mode)) errors.push('請選擇有效的遊戲模式。')
  if (!['acting', 'describe'].includes(setup.clueStyle)) errors.push('請選擇有效的提示方式。')
  if (![1, 2, 3].includes(setup.turnsPerTeam)) errors.push('每隊可玩 1–3 次。')
  if (!['easy', 'normal', 'hard'].includes(setup.difficulty)) errors.push('請選擇有效的難度。')
  if (!cardsForCategory(setup.category, setup.difficulty).length) errors.push('這個主題沒有符合難度的題目。')
  return errors
}

export function cardsForCategory(category: CharadesCategory, difficulty: CharadesDifficulty = 'normal') {
  return charadesCards.filter(card =>
    (category === 'mixed' || card.category === category) &&
    (difficulty === 'easy' ? card.difficulty === 'easy' : difficulty === 'normal' ? card.difficulty !== 'hard' : card.difficulty !== 'easy')
  )
}

export function selectCharadesDeck(setup: CharadesSetup, random: () => number = Math.random) {
  const cards = cardsForCategory(setup.category, setup.difficulty)
  if (!cards.length) throw new Error('No matching charades cards')
  // Quick play uses the whole filtered pool; classic uses a smaller shared deck.
  return shuffleItems(cards, random).slice(0, setup.mode === 'quick' ? cards.length : Math.min(setup.deckSize, cards.length))
}

export function rebuildRoundDeck(cardIds: readonly string[], random: () => number = Math.random): string[] {
  return shuffleItems(cardIds, random)
}

export function roundsForSettings(settings: CharadesMatchSettings) {
  if (settings.mode === 'classic') return classicGuessingRounds
  const rule = settings.clueStyle === 'acting' ? classicGuessingRounds[2]! : classicGuessingRounds[0]!
  return Array.from({ length: settings.turnsPerTeam }, (_, index) => ({
    ...rule, number: index + 1, name: settings.clueStyle === 'acting' ? '比手畫腳' : '自由描述'
  }))
}

export function quickPlaySeconds(settings: CharadesMatchSettings): number {
  return settings.turnsPerTeam * 2 * settings.turnSeconds
}
