import { spectrumCards } from '../data/spectra'
import type { SpectrumCard, WavelengthGame, WavelengthSetup } from '../types'

export function clampPosition(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function scoreGuess(target: number, guess: number): number {
  const distance = Math.abs(clampPosition(target) - clampPosition(guess))
  if (distance <= 4) return 4
  if (distance <= 9) return 3
  if (distance <= 16) return 2
  return 0
}

export function scoreDirection(target: number, guess: number, direction: 'left' | 'right' | null, earned: number): number {
  if (!direction || earned === 4 || target === guess) return 0
  return (target < guess ? 'left' : 'right') === direction ? 1 : 0
}

export function isWavelengthGameOver(game: WavelengthGame): boolean {
  if (game.round.earned < 0) return false
  if (game.mode === 'co-op') return game.round.number >= 6
  return game.round.number % 2 === 0 && Math.max(...game.scores) >= 12 && game.scores[0] !== game.scores[1]
}

export function selectSpectrumCard(usedIds: readonly string[], random: () => number): SpectrumCard {
  const available = spectrumCards.filter((card) => !usedIds.includes(card.id))
  const deck = available.length ? available : spectrumCards
  return deck[Math.floor(random() * deck.length)]!
}

export function validateWavelengthSetup(setup: WavelengthSetup): string[] {
  const names = setup.playerNames.map((name) => name.trim())
  const errors: string[] = []
  if (names.length < 2 || names.length > 12) errors.push('請設定 2–12 位玩家。')
  if (names.some((name) => !name)) errors.push('每位玩家都需要名稱。')
  if (new Set(names.map((name) => name.toLocaleLowerCase('zh-TW'))).size !== names.length) errors.push('玩家名稱不能重複。')
  if (names.length >= 4) {
    if (setup.teamNames.some((name) => !name.trim())) errors.push('兩隊都需要隊名。')
    if (setup.teamAssignments.length !== names.length || [0, 1].some((team) => setup.teamAssignments.filter((value) => value === team).length < 2)) errors.push('每隊至少需要 2 人。')
  }
  return errors
}
