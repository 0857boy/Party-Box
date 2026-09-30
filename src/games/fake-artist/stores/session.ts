import { computed, reactive, watch } from 'vue'
import { getSharedPlayerNames, rememberPlayerRoster } from '@/stores/playerRosters'
import { loadVersioned, saveVersioned } from '@/utils/storage'
import type { DrawingPoint } from '@/types/drawing'
import { createDrawingOrder, selectFakeArtistPrompt, selectFakePlayerId } from '../logic/game'
import type { FakeArtistGameState, FakeArtistRoundWinner, FakeArtistSessionState, FakeArtistSetup } from '../types'

const STORAGE_KEY = 'party-box:fake-artist:setup'
const VERSION = 1
const fallback: FakeArtistSetup = {
  playerNames: ['玩家 1', '玩家 2', '玩家 3', '玩家 4', '玩家 5', '玩家 6'],
  category: 'mixed',
  targetScore: 5
}
const saved = loadVersioned<FakeArtistSetup>(STORAGE_KEY, VERSION, fallback)
const colors = ['#ef5d60', '#4f9de8', '#40b982', '#f4a340', '#9b72e8', '#ed6fb1', '#24a8a8', '#80634d', '#667080', '#d5b328']

export const fakeArtistSession = reactive<FakeArtistSessionState>({
  setup: {
    playerNames: getSharedPlayerNames(saved.playerNames, 5, 10),
    category: saved.category,
    targetScore: saved.targetScore
  },
  players: [],
  currentRevealIndex: 0,
  game: null
})

export const currentFakeArtistRevealPlayer = computed(() => fakeArtistSession.players[fakeArtistSession.currentRevealIndex])
export const currentDrawingPlayer = computed(() => {
  const game = fakeArtistSession.game
  if (!game) return undefined
  const id = game.drawingOrder[game.drawStep % game.drawingOrder.length]
  return fakeArtistSession.players.find((player) => player.id === id)
})
export const currentDrawingPass = computed(() => {
  const game = fakeArtistSession.game
  return game ? Math.floor(game.drawStep / game.drawingOrder.length) + 1 : 1
})
export const fakeArtistPlayer = computed(() => fakeArtistSession.players.find((player) => player.id === fakeArtistSession.game?.fakePlayerId))

watch(() => fakeArtistSession.setup, () => saveVersioned(STORAGE_KEY, VERSION, fakeArtistSession.setup), { deep: true })

export function startFakeArtistGame(): void {
  rememberPlayerRoster(fakeArtistSession.setup.playerNames)
  fakeArtistSession.players = fakeArtistSession.setup.playerNames.map((name, index) => ({
    id: `fake-artist-player-${index + 1}`,
    name: name.trim(),
    color: colors[index]!,
    score: 0
  }))
  fakeArtistSession.currentRevealIndex = 0
  fakeArtistSession.game = createRoundState(1, [])
  saveVersioned(STORAGE_KEY, VERSION, fakeArtistSession.setup)
}

export function advanceFakeArtistReveal(): void {
  const game = requireGame()
  if (game.phase !== 'reveal') return
  if (fakeArtistSession.currentRevealIndex < fakeArtistSession.players.length - 1) {
    fakeArtistSession.currentRevealIndex += 1
    return
  }
  fakeArtistSession.currentRevealIndex = 0
  game.phase = 'draw-pass'
}

export function beginDrawingTurn(): void {
  const game = requireGame()
  if (game.phase === 'draw-pass') game.phase = 'drawing'
}

export function submitFakeArtistStroke(points: DrawingPoint[]): void {
  const game = requireGame()
  const player = currentDrawingPlayer.value
  if (game.phase !== 'drawing' || !player || !points.length) return
  game.strokes.push({ id: `round-${game.round}-stroke-${game.drawStep + 1}`, playerId: player.id, color: player.color, points: [...points] })
  game.drawStep += 1
  game.phase = game.drawStep >= game.drawingOrder.length * 2 ? 'vote' : 'draw-pass'
}

export function selectFakeArtistSuspect(playerId?: string): void {
  const game = requireGame()
  if (game.phase !== 'vote') return
  game.tiedVote = playerId === undefined
  game.selectedSuspectId = playerId
}

export function resolveFakeArtistVote(): void {
  const game = requireGame()
  if (game.phase !== 'vote' || (!game.tiedVote && !game.selectedSuspectId)) return
  if (game.tiedVote) {
    finishRound('fake', '最高票平票，偽畫家成功藏在人群中。')
    return
  }
  if (game.selectedSuspectId !== game.fakePlayerId) {
    finishRound('fake', '大家抓錯人，偽畫家成功蒙混過關。')
    return
  }
  game.phase = 'guess-pass'
}

export function beginFakeArtistGuess(): void {
  const game = requireGame()
  if (game.phase === 'guess-pass') game.phase = 'guess'
}

export function submitFakeArtistGuess(guess: string): void {
  const game = requireGame()
  if (game.phase !== 'guess' || !guess.trim()) return
  game.fakeGuess = guess.trim()
  game.phase = 'adjudicate'
}

export function adjudicateFakeArtistGuess(correct: boolean): void {
  const game = requireGame()
  if (game.phase !== 'adjudicate') return
  finishRound(correct ? 'fake' : 'artists', correct
    ? '偽畫家被抓到，但成功猜中題目，漂亮翻盤。'
    : '偽畫家被抓到且沒有猜中題目，真正畫家守住答案。')
}

export function startNextFakeArtistRound(): void {
  const game = requireGame()
  if (game.phase !== 'round-result') return
  fakeArtistSession.currentRevealIndex = 0
  fakeArtistSession.game = createRoundState(game.round + 1, game.history, game.fakePlayerId, game.prompt.id)
}

export function hasFakeArtistSession(): boolean {
  return fakeArtistSession.players.length >= 5 && fakeArtistSession.game !== null
}

export function resetFakeArtistSession(): void {
  fakeArtistSession.players = []
  fakeArtistSession.currentRevealIndex = 0
  fakeArtistSession.game = null
}

function finishRound(winner: FakeArtistRoundWinner, reason: string): void {
  const game = requireGame()
  game.roundWinner = winner
  game.roundReason = reason
  if (winner === 'fake') {
    const fake = fakeArtistSession.players.find((player) => player.id === game.fakePlayerId)
    if (fake) fake.score += 2
  } else {
    fakeArtistSession.players.filter((player) => player.id !== game.fakePlayerId).forEach((player) => { player.score += 1 })
  }
  game.history.push({
    round: game.round,
    categoryName: game.prompt.categoryName,
    answer: game.prompt.answer,
    fakePlayerId: game.fakePlayerId,
    suspectedPlayerId: game.selectedSuspectId,
    tiedVote: game.tiedVote,
    fakeGuess: game.fakeGuess || undefined,
    winner,
    reason,
    strokes: game.strokes.map((stroke) => ({ ...stroke, points: [...stroke.points] }))
  })
  game.phase = fakeArtistSession.players.some((player) => player.score >= fakeArtistSession.setup.targetScore) ? 'result' : 'round-result'
}

function createRoundState(
  round: number,
  history: FakeArtistGameState['history'],
  previousFakePlayerId?: string,
  previousPromptId?: string
): FakeArtistGameState {
  const playerIds = fakeArtistSession.players.map((player) => player.id)
  return {
    phase: 'reveal',
    round,
    prompt: selectFakeArtistPrompt(fakeArtistSession.setup.category, previousPromptId, cryptoRandom),
    fakePlayerId: selectFakePlayerId(playerIds, previousFakePlayerId, cryptoRandom),
    previousFakePlayerId,
    drawingOrder: createDrawingOrder(playerIds, cryptoRandom),
    drawStep: 0,
    strokes: [],
    tiedVote: false,
    fakeGuess: '',
    roundReason: '',
    history
  }
}

function requireGame(): FakeArtistGameState {
  if (!fakeArtistSession.game) throw new Error('Fake artist game has not started')
  return fakeArtistSession.game
}

function cryptoRandom(): number {
  return (crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) / 0x1_0000_0000
}
