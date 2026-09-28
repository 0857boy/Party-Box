export type Team = 'good' | 'evil'

export type RoleId =
  | 'merlin'
  | 'percival'
  | 'loyal-servant'
  | 'morgana'
  | 'assassin'
  | 'mordred'
  | 'oberon'
  | 'minion'

export interface Role {
  id: RoleId
  name: string
  displayName: string
  team: Team
  description: string
  ability: string
  atlasPosition: string
  selectable: boolean
  required?: boolean
}

export interface AssignedPlayer {
  id: string
  name: string
  role: Role
}

export interface RoleInformation {
  title: string
  summary: string
  visiblePlayerIds: string[]
  ambiguity?: string
}

export interface AvalonSetup {
  playerNames: string[]
  enabledRoles: RoleId[]
  ladyOfLakeEnabled: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface TeamComposition {
  good: number
  evil: number
}

export type MissionChoice = 'success' | 'fail'
export type MissionOutcome = 'success' | 'fail'
export type GameWinner = Team | null

export type GameplayPhase =
  | 'team-selection'
  | 'voting'
  | 'vote-result'
  | 'mission-pass'
  | 'mission'
  | 'mission-result'
  | 'lady-select'
  | 'lady-pass'
  | 'lady-reveal'
  | 'assassination-pass'
  | 'assassination'
  | 'result'

export interface MissionRecord {
  round: number
  leaderId: string
  teamPlayerIds: string[]
  approved: boolean
  missionChoices?: MissionChoice[]
  outcome?: MissionOutcome
  requiredFails?: number
}

export interface LadyInspection {
  round: number
  holderId: string
  targetId: string
  seenTeam: Team
}

export interface AvalonGameplayState {
  phase: GameplayPhase
  round: number
  leaderIndex: number
  rejectionCount: number
  selectedTeamIds: string[]
  missionOrderIds: string[]
  missionIndex: number
  missionChoiceOrder: MissionChoice[]
  missionChoices: MissionChoice[]
  proposals: MissionRecord[]
  winner: GameWinner
  winReason: string
  assassinationTargetId?: string
  ladyEnabled: boolean
  ladyHolderId?: string
  ladyTargetId?: string
  ladySeenPlayerIds: string[]
  ladyHistory: LadyInspection[]
}

export interface AvalonHistoryEntry {
  id: string
  completedAt: string
  players: AssignedPlayer[]
  gameplay: AvalonGameplayState
}
