import { computed, reactive, watch } from 'vue'
import { createRandomTeamAssignments } from '@/engine/teamManager'
import { getSharedPlayerNames, rememberPlayerRoster } from '@/stores/playerRosters'
import { loadVersioned, saveVersioned } from '@/utils/storage'
import { clampPosition, isWavelengthGameOver, scoreDirection, scoreGuess, selectSpectrumCard, validateWavelengthSetup } from '../logic/game'
import type { WavelengthGame, WavelengthRound, WavelengthSetup } from '../types'

const STORAGE_KEY = 'party-box:wavelength:setup'
const VERSION = 1
const fallback: WavelengthSetup = {
  playerNames: ['玩家 1', '玩家 2', '玩家 3', '玩家 4', '玩家 5', '玩家 6'],
  teamNames: ['電波隊', '腦波隊'],
  teamAssignments: [0, 1, 0, 1, 0, 1]
}
const saved = loadVersioned<WavelengthSetup>(STORAGE_KEY, VERSION, fallback)
const initialNames = getSharedPlayerNames(saved.playerNames, 2, 12)

export const wavelengthSession = reactive<{ setup: WavelengthSetup; game: WavelengthGame | null }>({
  setup: {
    playerNames: initialNames,
    teamNames: [...saved.teamNames],
    teamAssignments: saved.teamAssignments.length === initialNames.length
      ? [...saved.teamAssignments]
      : alternatingAssignments(initialNames.length)
  },
  game: null
})

export const currentClueGiver = computed(() => wavelengthSession.game?.players.find((player) => player.id === wavelengthSession.game?.round.clueGiverId))

watch(() => wavelengthSession.setup, () => saveVersioned(STORAGE_KEY, VERSION, wavelengthSession.setup), { deep: true })

export function alternatingAssignments(count: number): Array<0 | 1> {
  return Array.from({ length: count }, (_, index) => index % 2 as 0 | 1)
}

export function reshuffleWavelengthTeams(): void {
  const setup = wavelengthSession.setup
  const old = setup.teamAssignments.join('')
  let next = createRandomTeamAssignments(setup.playerNames.length)
  if (next.join('') === old) {
    const a = next.indexOf(0)
    const b = next.indexOf(1)
    if (a >= 0 && b >= 0) [next[a], next[b]] = [next[b]!, next[a]!]
  }
  setup.teamAssignments = next
}

export function startWavelengthGame(): void {
  const setup = wavelengthSession.setup
  if (validateWavelengthSetup(setup).length) return
  rememberPlayerRoster(setup.playerNames)
  const mode = setup.playerNames.length <= 3 ? 'co-op' : 'teams'
  const players = setup.playerNames.map((name, index) => ({
    id: `wavelength-${index + 1}`,
    name: name.trim(),
    team: mode === 'co-op' ? 0 as const : setup.teamAssignments[index]!
  }))
  const game: WavelengthGame = {
    mode,
    phase: 'pass',
    players,
    teamNames: [...setup.teamNames],
    scores: [0, 0],
    round: createRound(1, players[0]!.id, 0, []),
    history: [],
    usedCardIds: []
  }
  game.usedCardIds.push(game.round.card.id)
  wavelengthSession.game = game
}

export function beginWavelengthPeek(): void {
  const game = requireGame()
  if (game.phase === 'pass') game.phase = 'peek'
}

export function finishWavelengthPeek(): void {
  const game = requireGame()
  if (game.phase === 'peek') game.phase = 'clue'
}

export function submitWavelengthClue(clue: string): void {
  const game = requireGame()
  if (game.phase !== 'clue' || !clue.trim()) return
  game.round.clue = clue.trim()
  game.phase = 'discuss'
}

export function updateWavelengthGuess(value: number): void {
  const game = requireGame()
  if (game.phase === 'discuss') game.round.guess = clampPosition(value)
}

export function lockWavelengthGuess(): void {
  const game = requireGame()
  if (game.phase === 'discuss') game.phase = game.mode === 'teams' ? 'opponent' : 'reveal'
}

export function chooseWavelengthDirection(direction: 'left' | 'right'): void {
  const game = requireGame()
  if (game.phase !== 'opponent') return
  game.round.opponentGuess = direction
  game.phase = 'reveal'
}

export function revealWavelengthTarget(): void {
  const game = requireGame()
  if (game.phase !== 'reveal' || game.round.earned !== -1) return
  const round = game.round
  round.earned = scoreGuess(round.target, round.guess)
  round.bonus = game.mode === 'teams' ? scoreDirection(round.target, round.guess, round.opponentGuess, round.earned) : 0
  game.scores[round.activeTeam] += round.earned
  if (game.mode === 'teams') game.scores[round.activeTeam === 0 ? 1 : 0] += round.bonus
  game.history.push({ ...round, card: { ...round.card } })
}

export function nextWavelengthRound(): void {
  const game = requireGame()
  if (game.phase !== 'reveal' || game.round.earned < 0) return
  if (isWavelengthGameOver(game)) {
    game.phase = 'finished'
    return
  }
  const nextNumber = game.round.number + 1
  const activeTeam = game.mode === 'co-op' ? 0 : (nextNumber - 1) % 2 as 0 | 1
  const teamPlayers = game.players.filter((player) => player.team === activeTeam)
  const previous = [...game.history].reverse().find((round) => round.activeTeam === activeTeam)?.clueGiverId
  const previousIndex = teamPlayers.findIndex((player) => player.id === previous)
  const clueGiver = teamPlayers[(previousIndex + 1) % teamPlayers.length]!
  game.round = createRound(nextNumber, clueGiver.id, activeTeam, game.usedCardIds)
  game.usedCardIds.push(game.round.card.id)
  game.phase = 'pass'
}

export function hasWavelengthSession(): boolean {
  return wavelengthSession.game !== null
}

function createRound(number: number, clueGiverId: string, activeTeam: 0 | 1, usedIds: readonly string[]): WavelengthRound {
  return {
    number,
    card: selectSpectrumCard(usedIds, cryptoRandom),
    target: 12 + Math.floor(cryptoRandom() * 77),
    guess: 50,
    clue: '',
    clueGiverId,
    activeTeam,
    opponentGuess: null,
    earned: -1,
    bonus: 0
  }
}

function requireGame(): WavelengthGame {
  if (!wavelengthSession.game) throw new Error('Wavelength game has not started')
  return wavelengthSession.game
}

function cryptoRandom(): number {
  return (crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) / 0x1_0000_0000
}
