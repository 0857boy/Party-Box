export interface WordDeckCard {
  id: string
  label: string
  category: string
  emoji?: string
}

export interface PartyTeam {
  id: string
  name: string
  playerIds: string[]
}

export interface RoundDefinition {
  number: number
  name: string
  shortRule: string
  instruction: string
}

export interface TeamScore {
  teamId: string
  byRound: number[]
}
