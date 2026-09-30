import { computed, reactive, watch } from 'vue'
import { createScoreboard, awardPoint, totalScore } from '@/engine/scoreManager'
import { classicGuessingRounds, lowerScoringTeamIndex } from '@/engine/roundManager'
import { createAlternatingTeams, nextTeamMember } from '@/engine/teamManager'
import { getSharedPlayerNames, rememberPlayerRoster } from '@/stores/playerRosters'
import { loadVersioned, saveVersioned } from '@/utils/storage'
import { rebuildRoundDeck, selectCharadesDeck } from '../logic/game'
import type { CharadesGameState, CharadesSessionState, CharadesSetup } from '../types'

const STORAGE_KEY = 'party-box:charades:setup'
const VERSION = 1
const fallback: CharadesSetup = {
  playerNames: ['玩家 1', '玩家 2', '玩家 3', '玩家 4', '玩家 5', '玩家 6'],
  category: 'mixed',
  deckSize: 32,
  turnSeconds: 60
}
const saved = loadVersioned<CharadesSetup>(STORAGE_KEY, VERSION, fallback)

export const charadesSession = reactive<CharadesSessionState>({
  setup: {
    playerNames: getSharedPlayerNames(saved.playerNames, 4, 16),
    category: saved.category,
    deckSize: saved.deckSize,
    turnSeconds: saved.turnSeconds
  },
  players: [],
  teams: [],
  game: null
})

export const currentRound = computed(() => classicGuessingRounds[charadesSession.game?.roundIndex ?? 0])
export const currentTeam = computed(() => charadesSession.teams[charadesSession.game?.currentTeamIndex ?? 0])
export const currentClueGiver = computed(() => {
  const team = currentTeam.value
  const id = team && charadesSession.game ? charadesSession.game.currentClueGiverIds[team.id] : undefined
  return charadesSession.players.find((player) => player.id === id)
})
export const currentCharadesCard = computed(() => charadesSession.game?.selectedCards.find((card) => card.id === charadesSession.game?.currentCardId))
export const cardsRemaining = computed(() => {
  const game = charadesSession.game
  if (!game) return 0
  return game.remainingCardIds.length + game.skippedCardIds.length + (game.currentCardId ? 1 : 0)
})

watch(() => charadesSession.setup, () => saveVersioned(STORAGE_KEY, VERSION, charadesSession.setup), { deep: true })

export function startCharadesGame(): void {
  rememberPlayerRoster(charadesSession.setup.playerNames)
  charadesSession.players = charadesSession.setup.playerNames.map((name, index) => ({ id: `charades-player-${index + 1}`, name: name.trim() }))
  charadesSession.teams = createAlternatingTeams(charadesSession.players.map((player) => player.id))
  const selectedCards = selectCharadesDeck(charadesSession.setup, cryptoRandom)
  const currentClueGiverIds = Object.fromEntries(charadesSession.teams.map((team) => [team.id, team.playerIds[0]!]))
  charadesSession.game = {
    phase: 'turn-ready',
    roundIndex: 0,
    currentTeamIndex: Math.floor(cryptoRandom() * 2),
    currentClueGiverIds,
    selectedCards,
    remainingCardIds: rebuildRoundDeck(selectedCards.map((card) => card.id), cryptoRandom),
    skippedCardIds: [],
    turnGuessedCardIds: [],
    scores: createScoreboard(charadesSession.teams.map((team) => team.id), classicGuessingRounds.length),
    turns: []
  }
  saveVersioned(STORAGE_KEY, VERSION, charadesSession.setup)
}

export function beginCharadesTurn(): void {
  const game = requireGame()
  if (game.phase !== 'turn-ready') return
  game.turnGuessedCardIds = []
  game.skippedCardIds = []
  game.currentCardId = game.remainingCardIds.shift()
  game.phase = 'playing'
}

export function guessCurrentCard(): 'continue' | 'turn-ended' | 'round-ended' {
  const game = requireGame()
  const team = currentTeam.value
  if (game.phase !== 'playing' || !game.currentCardId || !team) return 'continue'
  game.turnGuessedCardIds.push(game.currentCardId)
  awardPoint(game.scores, team.id, game.roundIndex)
  game.currentCardId = game.remainingCardIds.shift()
  if (game.currentCardId) return 'continue'
  if (game.skippedCardIds.length) {
    endCharadesTurn()
    return 'turn-ended'
  }
  finishRound()
  return 'round-ended'
}

export function skipCurrentCard(): 'continue' | 'turn-ended' {
  const game = requireGame()
  if (game.phase !== 'playing' || !game.currentCardId) return 'continue'
  game.skippedCardIds.push(game.currentCardId)
  game.currentCardId = game.remainingCardIds.shift()
  if (game.currentCardId) return 'continue'
  endCharadesTurn()
  return 'turn-ended'
}

export function endCharadesTurn(): void {
  const game = requireGame()
  if (game.phase !== 'playing') return
  const team = currentTeam.value
  const clueGiver = currentClueGiver.value
  if (!team || !clueGiver) return
  const returnedIds = [game.currentCardId, ...game.skippedCardIds].filter((id): id is string => Boolean(id))
  game.remainingCardIds = rebuildRoundDeck([...game.remainingCardIds, ...returnedIds], cryptoRandom)
  game.currentCardId = undefined
  game.skippedCardIds = []
  recordTurn(game, team.id, clueGiver.id)
  game.currentClueGiverIds[team.id] = nextTeamMember(team, clueGiver.id)
  game.phase = 'turn-result'
}

export function continueAfterTurn(): void {
  const game = requireGame()
  if (game.phase !== 'turn-result') return
  game.currentTeamIndex = (game.currentTeamIndex + 1) % charadesSession.teams.length
  game.phase = 'turn-ready'
}

export function beginNextRound(): void {
  const game = requireGame()
  if (game.phase !== 'round-result' || game.roundIndex >= classicGuessingRounds.length - 1) return
  game.roundIndex += 1
  game.currentTeamIndex = lowerScoringTeamIndex(game.scores, (game.currentTeamIndex + 1) % 2)
  game.remainingCardIds = rebuildRoundDeck(game.selectedCards.map((card) => card.id), cryptoRandom)
  game.turnGuessedCardIds = []
  game.phase = 'turn-ready'
}

export function teamScore(teamId: string): number {
  const score = charadesSession.game?.scores.find((item) => item.teamId === teamId)
  return score ? totalScore(score) : 0
}

export function hasCharadesSession(): boolean {
  return charadesSession.players.length >= 4 && charadesSession.game !== null
}

export function resetCharadesSession(): void {
  charadesSession.players = []
  charadesSession.teams = []
  charadesSession.game = null
}

function finishRound(): void {
  const game = requireGame()
  const team = currentTeam.value
  const clueGiver = currentClueGiver.value
  if (team && clueGiver) {
    recordTurn(game, team.id, clueGiver.id)
    game.currentClueGiverIds[team.id] = nextTeamMember(team, clueGiver.id)
  }
  game.currentCardId = undefined
  game.skippedCardIds = []
  game.phase = game.roundIndex === classicGuessingRounds.length - 1 ? 'result' : 'round-result'
}

function recordTurn(game: CharadesGameState, teamId: string, clueGiverId: string): void {
  game.turns.push({ round: game.roundIndex + 1, teamId, clueGiverId, guessedCardIds: [...game.turnGuessedCardIds] })
}

function requireGame(): CharadesGameState {
  if (!charadesSession.game) throw new Error('Charades game has not started')
  return charadesSession.game
}

function cryptoRandom(): number {
  return (crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) / 0x1_0000_0000
}
