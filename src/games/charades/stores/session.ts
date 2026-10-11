import { computed, reactive, watch } from 'vue'
import { createScoreboard, awardPoint, totalScore } from '@/engine/scoreManager'
import { lowerScoringTeamIndex } from '@/engine/roundManager'
import { createTeamsFromAssignments, nextTeamMember } from '@/engine/teamManager'
import { getSharedPlayerNames, rememberPlayerRoster } from '@/stores/playerRosters'
import { loadVersioned, saveVersioned } from '@/utils/storage'
import { rebuildRoundDeck, roundsForSettings, selectCharadesDeck, validateCharadesSetup } from '../logic/game'
import type { CharadesGameState, CharadesSessionState, CharadesSetup } from '../types'

const STORAGE_KEY = 'party-box:charades:setup'
const VERSION = 3
const fallback: CharadesSetup = {
  playerNames: ['玩家 1', '玩家 2', '玩家 3', '玩家 4', '玩家 5', '玩家 6'],
  teamNames: ['閃電隊', '火箭隊'],
  teamAssignments: [0, 1, 0, 1, 0, 1],
  category: 'mixed',
  deckSize: 32,
  turnSeconds: 45,
  mode: 'quick',
  difficulty: 'easy',
  clueStyle: 'acting',
  turnsPerTeam: 2
}
// Keep names, teams and preferences from the three-round version, but make
// the shorter mode the new default. In-progress matches are never persisted.
const legacy = loadVersioned<Partial<CharadesSetup>>(STORAGE_KEY, 2, {})
const saved = loadVersioned<CharadesSetup>(STORAGE_KEY, VERSION, { ...fallback, ...legacy })
const initialNames = getSharedPlayerNames(saved.playerNames, 4, 16)
const initialAssignments = saved.teamAssignments.length === initialNames.length
  ? saved.teamAssignments
  : Array.from({ length: initialNames.length }, (_, index) => index % 2 as 0 | 1)

export const charadesSession = reactive<CharadesSessionState>({
  setup: {
    playerNames: initialNames,
    teamNames: [...saved.teamNames],
    teamAssignments: [...initialAssignments],
    category: saved.category,
    deckSize: saved.deckSize,
    turnSeconds: saved.turnSeconds,
    mode: saved.mode,
    difficulty: saved.difficulty,
    clueStyle: saved.clueStyle,
    turnsPerTeam: saved.turnsPerTeam
  },
  players: [],
  teams: [],
  game: null
})

export const gameRounds = computed(() => roundsForSettings(charadesSession.game?.settings ?? charadesSession.setup))
export const currentRound = computed(() => gameRounds.value[charadesSession.game?.roundIndex ?? 0])
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
  const errors = validateCharadesSetup(charadesSession.setup)
  if (errors.length) throw new Error(errors.join(' '))
  rememberPlayerRoster(charadesSession.setup.playerNames)
  charadesSession.players = charadesSession.setup.playerNames.map((name, index) => ({ id: `charades-player-${index + 1}`, name: name.trim() }))
  charadesSession.teams = createTeamsFromAssignments(
    charadesSession.players.map((player) => player.id),
    charadesSession.setup.teamAssignments,
    charadesSession.setup.teamNames.map((name) => name.trim()) as [string, string]
  )
  const selectedCards = selectCharadesDeck(charadesSession.setup, cryptoRandom)
  const currentClueGiverIds = Object.fromEntries(charadesSession.teams.map((team) => [team.id, team.playerIds[0]!]))
  charadesSession.game = {
    phase: 'turn-ready',
    settings: {
      mode: charadesSession.setup.mode,
      difficulty: charadesSession.setup.difficulty,
      clueStyle: charadesSession.setup.clueStyle,
      turnsPerTeam: charadesSession.setup.turnsPerTeam,
      turnSeconds: charadesSession.setup.turnSeconds
    },
    roundIndex: 0,
    currentTeamIndex: Math.floor(cryptoRandom() * 2),
    currentClueGiverIds,
    selectedCards,
    remainingCardIds: rebuildRoundDeck(selectedCards.map((card) => card.id), cryptoRandom),
    skippedCardIds: [],
    turnGuessedCardIds: [],
    scores: createScoreboard(charadesSession.teams.map((team) => team.id), roundsForSettings(charadesSession.setup).length),
    turns: []
  }
  saveVersioned(STORAGE_KEY, VERSION, charadesSession.setup)
}

export function beginCharadesTurn(): void {
  const game = requireGame()
  if (game.phase !== 'turn-ready') return
  game.turnGuessedCardIds = []
  game.skippedCardIds = []
  game.currentCardId = game.settings.mode === 'quick' ? drawQuickCard(game) : game.remainingCardIds.shift()
  game.phase = 'playing'
}

export function guessCurrentCard(): 'continue' | 'turn-ended' | 'round-ended' {
  const game = requireGame()
  const team = currentTeam.value
  if (game.phase !== 'playing' || !game.currentCardId || !team) return 'continue'
  game.turnGuessedCardIds.push(game.currentCardId)
  awardPoint(game.scores, team.id, game.roundIndex)
  if (game.settings.mode === 'quick') {
    game.currentCardId = drawQuickCard(game, game.currentCardId)
    return 'continue'
  }
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
  if (game.settings.mode === 'quick') {
    game.currentCardId = drawQuickCard(game, game.currentCardId)
    return 'continue'
  }
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
  if (game.settings.mode === 'classic') {
    const returnedIds = [game.currentCardId, ...game.skippedCardIds].filter((id): id is string => Boolean(id))
    game.remainingCardIds = rebuildRoundDeck([...game.remainingCardIds, ...returnedIds], cryptoRandom)
  }
  recordTurn(game, team.id, clueGiver.id)
  game.currentCardId = undefined
  game.skippedCardIds = []
  game.currentClueGiverIds[team.id] = nextTeamMember(team, clueGiver.id)
  game.phase = 'turn-result'
}

export function continueAfterTurn(): void {
  const game = requireGame()
  if (game.phase !== 'turn-result') return
  if (game.settings.mode === 'quick') {
    if (game.turns.length >= game.settings.turnsPerTeam * charadesSession.teams.length) {
      game.phase = 'result'
      return
    }
    game.roundIndex = Math.floor(game.turns.length / charadesSession.teams.length)
  }
  game.currentTeamIndex = (game.currentTeamIndex + 1) % charadesSession.teams.length
  game.phase = 'turn-ready'
}

export function beginNextRound(): void {
  const game = requireGame()
  if (game.phase !== 'round-result' || game.roundIndex >= gameRounds.value.length - 1) return
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
  game.phase = game.roundIndex === gameRounds.value.length - 1 ? 'result' : 'round-result'
}

function recordTurn(game: CharadesGameState, teamId: string, clueGiverId: string): void {
  game.turns.push({ round: game.roundIndex + 1, teamId, clueGiverId, guessedCardIds: [...game.turnGuessedCardIds], skippedCardIds: [...game.skippedCardIds] })
}

function drawQuickCard(game: CharadesGameState, previousId?: string): string | undefined {
  if (!game.remainingCardIds.length) {
    game.remainingCardIds = rebuildRoundDeck(game.selectedCards.map(card => card.id), cryptoRandom)
    // A small themed pool can cycle, but never show the same card twice in a row.
    if (game.remainingCardIds.length > 1 && game.remainingCardIds[0] === previousId) {
      [game.remainingCardIds[0], game.remainingCardIds[1]] = [game.remainingCardIds[1]!, game.remainingCardIds[0]!]
    }
  }
  return game.remainingCardIds.shift()
}

function requireGame(): CharadesGameState {
  if (!charadesSession.game) throw new Error('Charades game has not started')
  return charadesSession.game
}

function cryptoRandom(): number {
  return (crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) / 0x1_0000_0000
}
