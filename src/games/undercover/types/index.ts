export type UndercoverRole = 'civilian' | 'undercover'
export type WordCategoryId =
  | 'food'
  | 'daily'
  | 'campus'
  | 'transport'
  | 'leisure'
  | 'taiwan'
  | 'awkward'
  | 'relationship'
  | 'workplace'
  | 'internet'
export type WordCategorySelection = WordCategoryId | 'mixed' | 'funny'

export interface WordCategory {
  id: WordCategoryId
  name: string
  description: string
}

export interface WordPair {
  id: string
  category: WordCategoryId
  words: readonly [string, string]
}

export interface UndercoverSetup {
  playerNames: string[]
  category: WordCategorySelection
  undercoverCount: number
}

export interface UndercoverPlayer {
  id: string
  name: string
  role: UndercoverRole
  word: string
  alive: boolean
}

export interface EliminationRecord {
  round: number
  playerId: string
  role: UndercoverRole
}

export type UndercoverWinner = 'civilian' | 'undercover' | null
export type UndercoverPhase = 'discussion' | 'elimination' | 'elimination-result' | 'result'

export interface UndercoverGameplayState {
  phase: UndercoverPhase
  round: number
  startingSpeakerId: string
  selectedEliminationId?: string
  lastEliminatedId?: string
  eliminations: EliminationRecord[]
  winner: UndercoverWinner
  winReason: string
  civilianWord: string
  undercoverWord: string
  category: WordCategoryId
}

export interface UndercoverValidationResult {
  valid: boolean
  errors: string[]
}
