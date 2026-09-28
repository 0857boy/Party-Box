import { computed, reactive, watch } from 'vue'
import type {
  AssignedPlayer,
  AvalonGameplayState,
  AvalonHistoryEntry,
  AvalonSetup,
  MissionChoice,
  RoleId
} from '../types'
import { assignRoles, getDefaultEnabledRoles } from '../logic/game'
import {
  createGameplayState,
  evaluateMission,
  getAssassinationWinner,
  getMissionChoiceOrder,
  getMissionScore,
  getMissionTeamSize,
  getPostMissionState,
  isRejectionLoss,
  nextPlayerIndex,
  shouldUseLadyAfterRound
} from '../logic/flow'
import { loadVersioned, saveVersioned } from '@/utils/storage'

interface StoredSetup {
  playerNames: string[]
  enabledRoles: RoleId[]
  ladyOfLakeEnabled: boolean
}

const STORAGE_KEY = 'party-box:avalon:setup'
const HISTORY_STORAGE_KEY = 'party-box:avalon:history'
const VERSION = 2
const HISTORY_VERSION = 1
const HISTORY_LIMIT = 20
const fallbackNames = ['玩家 1', '玩家 2', '玩家 3', '玩家 4', '玩家 5']
const defaults: StoredSetup = {
  playerNames: fallbackNames,
  enabledRoles: getDefaultEnabledRoles(5),
  ladyOfLakeEnabled: false
}
const saved = loadVersioned<StoredSetup>(STORAGE_KEY, VERSION, defaults)
const savedHistory = loadVersioned<AvalonHistoryEntry[]>(HISTORY_STORAGE_KEY, HISTORY_VERSION, [])

interface SessionState {
  setup: AvalonSetup
  players: AssignedPlayer[]
  currentRevealIndex: number
  gameplay: AvalonGameplayState | null
}

export const avalonSession = reactive<SessionState>({
  setup: {
    playerNames: [...saved.playerNames],
    enabledRoles: [...saved.enabledRoles],
    ladyOfLakeEnabled: saved.ladyOfLakeEnabled
  },
  players: [],
  currentRevealIndex: 0,
  gameplay: null
})
export const avalonHistory = reactive<AvalonHistoryEntry[]>(savedHistory)

export const currentPlayer = computed(() => avalonSession.players[avalonSession.currentRevealIndex])
export const currentLeader = computed(() => {
  const game = avalonSession.gameplay
  return game ? avalonSession.players[game.leaderIndex] : undefined
})
export const currentMissionPlayer = computed(() => {
  const game = avalonSession.gameplay
  if (!game) return undefined
  const playerId = game.missionOrderIds[game.missionIndex]
  return avalonSession.players.find((player) => player.id === playerId)
})
export const assassinPlayer = computed(() => avalonSession.players.find((player) => player.role.id === 'assassin'))
export const assassinationCandidates = computed(() => avalonSession.players.filter((player) => player.role.team === 'good'))
export const ladyHolder = computed(() => {
  const holderId = avalonSession.gameplay?.ladyHolderId
  return avalonSession.players.find((player) => player.id === holderId)
})
export const missionScore = computed(() => avalonSession.gameplay
  ? getMissionScore(avalonSession.gameplay)
  : { success: 0, fail: 0 })
export const requiredTeamSize = computed(() => avalonSession.gameplay
  ? getMissionTeamSize(avalonSession.players.length, avalonSession.gameplay.round)
  : 0)

export function saveSetup(): void {
  saveVersioned(STORAGE_KEY, VERSION, avalonSession.setup)
}

watch(() => avalonSession.setup, saveSetup, { deep: true })

export function startAvalonGame(): void {
  avalonSession.players = assignRoles(avalonSession.setup)
  avalonSession.currentRevealIndex = 0
  avalonSession.gameplay = createGameplayState()
  avalonSession.gameplay.ladyEnabled = avalonSession.setup.ladyOfLakeEnabled && avalonSession.players.length >= 8
  saveSetup()
}

export function setStartingLeader(index: number): void {
  const game = requireGameplay()
  if (index >= 0 && index < avalonSession.players.length) game.leaderIndex = index
}

export function beginAvalonPlay(): void {
  const game = requireGameplay()
  game.phase = 'team-selection'
  if (game.ladyEnabled) {
    const holderIndex = (game.leaderIndex - 1 + avalonSession.players.length) % avalonSession.players.length
    game.ladyHolderId = avalonSession.players[holderIndex]?.id
  }
}

export function toggleTeamPlayer(playerId: string): void {
  const game = requireGameplay()
  if (game.phase !== 'team-selection') return
  const index = game.selectedTeamIds.indexOf(playerId)
  if (index >= 0) {
    game.selectedTeamIds.splice(index, 1)
    return
  }
  if (game.selectedTeamIds.length < requiredTeamSize.value) game.selectedTeamIds.push(playerId)
}

export function beginVoting(): void {
  const game = requireGameplay()
  if (game.selectedTeamIds.length !== requiredTeamSize.value) return
  game.phase = 'voting'
}

export function recordVoteResult(approved: boolean): void {
  const game = requireGameplay()
  if (game.phase !== 'voting') return
  game.proposals.push({
    round: game.round,
    leaderId: currentLeader.value?.id ?? '',
    teamPlayerIds: [...game.selectedTeamIds],
    approved
  })
  game.rejectionCount = approved ? 0 : game.rejectionCount + 1
  game.phase = 'vote-result'
}

export function continueAfterVote(): void {
  const game = requireGameplay()
  const proposal = game.proposals.at(-1)
  if (!proposal) return
  if (!proposal.approved) {
    if (isRejectionLoss(game.rejectionCount)) {
      finishGame('evil', '連續五次組隊表決失敗，邪惡陣營直接獲勝。')
      return
    }
    rotateLeaderAndResetTeam(game)
    return
  }

  game.missionOrderIds = shuffled(game.selectedTeamIds)
  game.missionChoices = []
  game.missionIndex = 0
  game.phase = 'mission-pass'
}

export function showMissionChoice(): void {
  const game = requireGameplay()
  if (game.phase === 'mission-pass') {
    game.missionChoiceOrder = getMissionChoiceOrder()
    game.phase = 'mission'
  }
}

export function submitMissionChoice(choice: MissionChoice): void {
  const game = requireGameplay()
  const player = currentMissionPlayer.value
  if (game.phase !== 'mission' || !player) return
  if (player.role.team === 'good' && choice === 'fail') return
  game.missionChoices.push(choice)

  if (game.missionIndex < game.missionOrderIds.length - 1) {
    game.missionIndex += 1
    game.phase = 'mission-pass'
    return
  }

  const evaluation = evaluateMission(game.missionChoices, avalonSession.players.length, game.round)
  const proposal = [...game.proposals].reverse().find((item) => item.approved && !item.outcome)
  if (!proposal) throw new Error('Approved mission proposal was not found')
  proposal.missionChoices = shuffled(game.missionChoices)
  proposal.outcome = evaluation.outcome
  proposal.requiredFails = evaluation.requiredFails
  game.phase = 'mission-result'
}

export function continueAfterMission(): void {
  const game = requireGameplay()
  const postMissionState = getPostMissionState(game)
  if (postMissionState === 'evil-wins') {
    finishGame('evil', '邪惡陣營讓三次任務失敗。')
    return
  }
  if (postMissionState === 'assassination') {
    game.phase = 'assassination-pass'
    return
  }
  if (game.ladyEnabled && shouldUseLadyAfterRound(game.round)) {
    game.phase = 'lady-select'
    return
  }
  advanceRound(game)
}

export function selectLadyTarget(playerId: string): void {
  const game = requireGameplay()
  if (game.phase !== 'lady-select' || playerId === game.ladyHolderId || game.ladySeenPlayerIds.includes(playerId)) return
  game.ladyTargetId = playerId
  game.phase = 'lady-pass'
}

export function showLadyResult(): void {
  const game = requireGameplay()
  if (game.phase === 'lady-pass') game.phase = 'lady-reveal'
}

export function completeLadyInspection(): void {
  const game = requireGameplay()
  const target = avalonSession.players.find((player) => player.id === game.ladyTargetId)
  if (!target || !game.ladyHolderId) return
  game.ladyHistory.push({ round: game.round, holderId: game.ladyHolderId, targetId: target.id, seenTeam: target.role.team })
  game.ladySeenPlayerIds.push(target.id)
  game.ladyHolderId = target.id
  game.ladyTargetId = undefined
  advanceRound(game)
}

export function showAssassination(): void {
  const game = requireGameplay()
  if (game.phase === 'assassination-pass') game.phase = 'assassination'
}

export function completeAssassination(targetId: string): void {
  const game = requireGameplay()
  const target = avalonSession.players.find((player) => player.id === targetId)
  if (game.phase !== 'assassination' || !target || target.role.team !== 'good') return
  game.assassinationTargetId = target.id
  const winner = getAssassinationWinner(target.role.id)
  if (winner === 'evil') finishGame('evil', `刺客成功刺殺 ${target.name}（梅林），邪惡陣營逆轉獲勝。`)
  else finishGame('good', `刺客誤判了 ${target.name}，梅林存活，正義陣營獲勝。`)
}

export function hasAvalonSession(): boolean {
  return avalonSession.players.length >= 5 && avalonSession.gameplay !== null
}

export function resetAvalonSession(): void {
  avalonSession.players = []
  avalonSession.currentRevealIndex = 0
  avalonSession.gameplay = null
}

export function loadAvalonHistoryEntry(id: string): boolean {
  const entry = avalonHistory.find((item) => item.id === id)
  if (!entry) return false
  avalonSession.players = clone(entry.players)
  avalonSession.currentRevealIndex = 0
  avalonSession.gameplay = clone(entry.gameplay)
  return true
}

function requireGameplay(): AvalonGameplayState {
  if (!avalonSession.gameplay) throw new Error('Avalon gameplay has not been initialized')
  return avalonSession.gameplay
}

function rotateLeaderAndResetTeam(game: AvalonGameplayState): void {
  game.leaderIndex = nextPlayerIndex(game.leaderIndex, avalonSession.players.length)
  game.selectedTeamIds = []
  game.phase = 'team-selection'
}

function advanceRound(game: AvalonGameplayState): void {
  game.round += 1
  game.rejectionCount = 0
  rotateLeaderAndResetTeam(game)
}

function finishGame(winner: 'good' | 'evil', reason: string): void {
  const game = requireGameplay()
  if (game.winner) return
  game.winner = winner
  game.winReason = reason
  game.phase = 'result'
  saveCompletedGame()
}

function saveCompletedGame(): void {
  const game = requireGameplay()
  const randomPart = crypto.getRandomValues(new Uint32Array(1))[0]?.toString(36) ?? '0'
  avalonHistory.unshift({
    id: `${Date.now()}-${randomPart}`,
    completedAt: new Date().toISOString(),
    players: clone(avalonSession.players),
    gameplay: clone(game)
  })
  if (avalonHistory.length > HISTORY_LIMIT) avalonHistory.splice(HISTORY_LIMIT)
  saveVersioned(HISTORY_STORAGE_KEY, HISTORY_VERSION, avalonHistory)
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function shuffled<T>(values: readonly T[]): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomValue = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0
    const swapIndex = randomValue % (index + 1)
    const current = result[index]
    const target = result[swapIndex]
    if (current !== undefined && target !== undefined) [result[index], result[swapIndex]] = [target, current]
  }
  return result
}
