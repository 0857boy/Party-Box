import type { DrawingStroke } from '@/types/drawing'

export type FakeArtistCategory = 'mixed' | 'animals' | 'food' | 'objects' | 'places' | 'characters'
export type FakeArtistRole = 'artist' | 'fake'
export type FakeArtistPhase = 'reveal' | 'draw-pass' | 'drawing' | 'vote' | 'guess-pass' | 'guess' | 'adjudicate' | 'round-result' | 'result'
export type FakeArtistRoundWinner = 'artists' | 'fake'

export interface FakeArtistPrompt {
  id: string
  category: Exclude<FakeArtistCategory, 'mixed'>
  categoryName: string
  answer: string
}

export interface FakeArtistSetup {
  playerNames: string[]
  category: FakeArtistCategory
  targetScore: number
}

export interface FakeArtistPlayer {
  id: string
  name: string
  color: string
  score: number
}

export interface FakeArtistRoundHistory {
  round: number
  categoryName: string
  answer: string
  fakePlayerId: string
  suspectedPlayerId?: string
  tiedVote: boolean
  fakeGuess?: string
  winner: FakeArtistRoundWinner
  reason: string
  strokes: DrawingStroke[]
}

export interface FakeArtistGameState {
  phase: FakeArtistPhase
  round: number
  prompt: FakeArtistPrompt
  fakePlayerId: string
  previousFakePlayerId?: string
  drawingOrder: string[]
  drawStep: number
  strokes: DrawingStroke[]
  selectedSuspectId?: string
  tiedVote: boolean
  fakeGuess: string
  roundWinner?: FakeArtistRoundWinner
  roundReason: string
  history: FakeArtistRoundHistory[]
}

export interface FakeArtistSessionState {
  setup: FakeArtistSetup
  players: FakeArtistPlayer[]
  currentRevealIndex: number
  game: FakeArtistGameState | null
}
