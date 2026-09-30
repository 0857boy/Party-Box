import { computed, reactive, watch } from 'vue'
import { loadVersioned, saveVersioned } from '@/utils/storage'
import { wordCategories } from '../data/words'
import {
  assignUndercoverPlayers,
  getUndercoverWinner,
  nextAlivePlayerId,
  recommendedUndercoverCount,
  selectWordPair
} from '../logic/game'
import type {
  UndercoverGameplayState,
  UndercoverPlayer,
  UndercoverSetup,
  WordCategoryId
} from '../types'

const STORAGE_KEY = 'party-box:undercover:setup'
const VERSION = 2
const fallbackNames = ['玩家 1', '玩家 2', '玩家 3', '玩家 4', '玩家 5']
const saved = loadVersioned<UndercoverSetup>(STORAGE_KEY, VERSION, {
  playerNames: fallbackNames,
  category: 'funny',
  undercoverCount: 1
})

interface UndercoverSessionState {
  setup: UndercoverSetup
  players: UndercoverPlayer[]
  currentRevealIndex: number
  gameplay: UndercoverGameplayState | null
}

export const undercoverSession = reactive<UndercoverSessionState>({
  setup: {
    playerNames: [...saved.playerNames],
    category: saved.category,
    undercoverCount: saved.undercoverCount
  },
  players: [],
  currentRevealIndex: 0,
  gameplay: null
})

export const currentUndercoverPlayer = computed(() => undercoverSession.players[undercoverSession.currentRevealIndex])
export const aliveUndercoverPlayers = computed(() => undercoverSession.players.filter((player) => player.alive))
export const currentSpeaker = computed(() => undercoverSession.players.find((player) => player.id === undercoverSession.gameplay?.startingSpeakerId))
export const lastEliminatedPlayer = computed(() => undercoverSession.players.find((player) => player.id === undercoverSession.gameplay?.lastEliminatedId))
export const currentWordCategory = computed(() => wordCategories.find((category) => category.id === undercoverSession.gameplay?.category))

watch(() => undercoverSession.setup, () => {
  saveVersioned(STORAGE_KEY, VERSION, undercoverSession.setup)
}, { deep: true })

export function syncRecommendedUndercoverCount(): void {
  undercoverSession.setup.undercoverCount = recommendedUndercoverCount(undercoverSession.setup.playerNames.length)
}

export function startUndercoverGame(): void {
  const pair = selectWordPair(undercoverSession.setup, cryptoRandom)
  undercoverSession.players = assignUndercoverPlayers(undercoverSession.setup, pair, cryptoRandom)
  undercoverSession.currentRevealIndex = 0
  const firstSpeaker = undercoverSession.players[Math.floor(cryptoRandom() * undercoverSession.players.length)]!
  const civilianWord = undercoverSession.players.find((player) => player.role === 'civilian')?.word ?? pair.words[0]
  const undercoverWord = undercoverSession.players.find((player) => player.role === 'undercover')?.word ?? pair.words[1]
  undercoverSession.gameplay = {
    phase: 'discussion',
    round: 1,
    startingSpeakerId: firstSpeaker.id,
    eliminations: [],
    winner: null,
    winReason: '',
    civilianWord,
    undercoverWord,
    category: pair.category
  }
  saveVersioned(STORAGE_KEY, VERSION, undercoverSession.setup)
}

export function beginUndercoverElimination(): void {
  const game = requireGameplay()
  game.selectedEliminationId = undefined
  game.phase = 'elimination'
}

export function selectUndercoverElimination(playerId: string): void {
  const game = requireGameplay()
  if (game.phase !== 'elimination' || !undercoverSession.players.some((player) => player.id === playerId && player.alive)) return
  game.selectedEliminationId = playerId
}

export function confirmUndercoverElimination(): void {
  const game = requireGameplay()
  const player = undercoverSession.players.find((candidate) => candidate.id === game.selectedEliminationId && candidate.alive)
  if (game.phase !== 'elimination' || !player) return
  player.alive = false
  game.lastEliminatedId = player.id
  game.eliminations.push({ round: game.round, playerId: player.id, role: player.role })
  const winner = getUndercoverWinner(undercoverSession.players)
  if (winner) {
    game.winner = winner
    game.winReason = winner === 'civilian'
      ? '所有臥底都已被找出，平民陣營獲勝。'
      : '存活臥底人數已不少於平民，臥底陣營成功潛伏到最後。'
  }
  game.phase = 'elimination-result'
}

export function continueUndercoverGame(): void {
  const game = requireGameplay()
  if (game.phase !== 'elimination-result') return
  if (game.winner) {
    game.phase = 'result'
    return
  }
  game.round += 1
  game.startingSpeakerId = nextAlivePlayerId(undercoverSession.players, game.startingSpeakerId)
  game.selectedEliminationId = undefined
  game.lastEliminatedId = undefined
  game.phase = 'discussion'
}

export function hasUndercoverSession(): boolean {
  return undercoverSession.players.length >= 4 && undercoverSession.gameplay !== null
}

export function resetUndercoverSession(): void {
  undercoverSession.players = []
  undercoverSession.currentRevealIndex = 0
  undercoverSession.gameplay = null
}

export function categoryName(id: WordCategoryId): string {
  return wordCategories.find((category) => category.id === id)?.name ?? '綜合題庫'
}

function requireGameplay(): UndercoverGameplayState {
  if (!undercoverSession.gameplay) throw new Error('Undercover gameplay has not been initialized')
  return undercoverSession.gameplay
}

function cryptoRandom(): number {
  return (crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) / 0x1_0000_0000
}
