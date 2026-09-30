export interface SpectrumCard {
  id: string
  left: string
  right: string
  category: string
}

export type WavelengthMode = 'co-op' | 'teams'
export type WavelengthPhase = 'pass' | 'peek' | 'clue' | 'discuss' | 'opponent' | 'reveal' | 'finished'

export interface WavelengthSetup {
  playerNames: string[]
  teamNames: [string, string]
  teamAssignments: Array<0 | 1>
}

export interface WavelengthRound {
  number: number
  card: SpectrumCard
  target: number
  guess: number
  clue: string
  clueGiverId: string
  activeTeam: 0 | 1
  opponentGuess: 'left' | 'right' | null
  earned: number
  bonus: number
}

export interface WavelengthGame {
  mode: WavelengthMode
  phase: WavelengthPhase
  players: Array<{ id: string; name: string; team: 0 | 1 }>
  teamNames: [string, string]
  scores: [number, number]
  round: WavelengthRound
  history: WavelengthRound[]
  usedCardIds: string[]
}
