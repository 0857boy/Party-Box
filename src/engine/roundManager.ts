import type { RoundDefinition, TeamScore } from '../types/gameplay'
import { totalScore } from './scoreManager'

export const classicGuessingRounds: readonly RoundDefinition[] = [
  { number: 1, name: '自由描述', shortRule: '什麼都能說，不能講答案', instruction: '可以用完整句子、聲音與動作提示，但不能說出答案或答案中的字。' },
  { number: 2, name: '一字提示', shortRule: '每張牌只能說一個詞', instruction: '每張牌只能選一個提示詞，可以重複，但不能補充第二個詞、聲音或動作。' },
  { number: 3, name: '無聲演出', shortRule: '不能說話，只能比動作', instruction: '全程不能發出提示聲音，只能用表情、姿勢與動作讓隊友猜中。' }
]

export function lowerScoringTeamIndex(scores: readonly TeamScore[], fallbackIndex: number): number {
  if (scores.length !== 2) return fallbackIndex
  const first = totalScore(scores[0]!)
  const second = totalScore(scores[1]!)
  if (first === second) return fallbackIndex
  return first < second ? 0 : 1
}
