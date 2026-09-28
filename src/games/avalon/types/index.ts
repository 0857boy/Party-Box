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
