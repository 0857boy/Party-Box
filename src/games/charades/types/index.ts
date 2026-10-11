import type { PartyTeam, TeamScore, WordDeckCard } from '@/types/gameplay'

export type CharadesCategory = 'mixed' | 'animals' | 'food' | 'life' | 'jobs' | 'sports' | 'things' | 'characters' | 'idioms' | 'emotions' | 'celebrities'
export type CharadesDifficulty = 'easy' | 'normal' | 'hard'
export type CharadesMode = 'quick' | 'classic'
export type CharadesClueStyle = 'acting' | 'describe'
export type CharadesPhase = 'turn-ready' | 'playing' | 'turn-result' | 'round-result' | 'result'

export interface CharadesMatchSettings {
  mode: CharadesMode
  difficulty: CharadesDifficulty
  clueStyle: CharadesClueStyle
  turnsPerTeam: 1 | 2 | 3
  turnSeconds: number
}

export interface CharadesSetup extends CharadesMatchSettings {
  playerNames: string[]
  teamNames: [string, string]
  teamAssignments: Array<0 | 1>
  category: CharadesCategory
  deckSize: number
}

export interface CharadesCard extends WordDeckCard {
  category: Exclude<CharadesCategory, 'mixed'>
  difficulty: CharadesDifficulty
  tags?: string[]
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
  skippedCardIds: string[]
}

export interface CharadesGameState {
  phase: CharadesPhase
  settings: CharadesMatchSettings
  roundIndex: number
  currentTeamIndex: number
  currentClueGiverIds: Record<string, string>
  selectedCards: CharadesCard[]
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
