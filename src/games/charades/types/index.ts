import type { PartyTeam, TeamScore, WordDeckCard } from '@/types/gameplay'

export type CharadesCategory = 'mixed' | 'characters' | 'life' | 'things'
export type CharadesPhase = 'turn-ready' | 'playing' | 'turn-result' | 'round-result' | 'result'

export interface CharadesSetup {
  playerNames: string[]
  teamNames: [string, string]
  teamAssignments: Array<0 | 1>
  category: CharadesCategory
  deckSize: number
  turnSeconds: number
}

export interface CharadesPlayer {
  id: string
  name: string
}

export interface CharadesTurnRecord {
  round: number
  teamId: string
  clueGiverId: string
  guessedCardIds: string[]
}

export interface CharadesGameState {
  phase: CharadesPhase
  roundIndex: number
  currentTeamIndex: number
  currentClueGiverIds: Record<string, string>
  selectedCards: WordDeckCard[]
  remainingCardIds: string[]
  skippedCardIds: string[]
  currentCardId?: string
  turnGuessedCardIds: string[]
  scores: TeamScore[]
  turns: CharadesTurnRecord[]
}

export interface CharadesSessionState {
  setup: CharadesSetup
  players: CharadesPlayer[]
  teams: PartyTeam[]
  game: CharadesGameState | null
}
