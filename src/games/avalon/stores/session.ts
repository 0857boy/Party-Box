import { computed, reactive } from 'vue'
import type { AssignedPlayer, AvalonSetup, RoleId } from '../types'
import { assignRoles, getDefaultEnabledRoles } from '../logic/game'
import { loadVersioned, saveVersioned } from '@/utils/storage'

interface StoredSetup { playerNames: string[]; enabledRoles: RoleId[] }

const STORAGE_KEY = 'party-box:avalon:setup'
const VERSION = 1
const fallbackNames = ['玩家 1', '玩家 2', '玩家 3', '玩家 4', '玩家 5']
const saved = loadVersioned<StoredSetup>(STORAGE_KEY, VERSION, {
  playerNames: fallbackNames,
  enabledRoles: getDefaultEnabledRoles(5)
})

interface SessionState {
  setup: AvalonSetup
  players: AssignedPlayer[]
  currentRevealIndex: number
}

export const avalonSession = reactive<SessionState>({
  setup: { playerNames: [...saved.playerNames], enabledRoles: [...saved.enabledRoles] },
  players: [],
  currentRevealIndex: 0
})

export const currentPlayer = computed(() => avalonSession.players[avalonSession.currentRevealIndex])

export function saveSetup(): void {
  saveVersioned(STORAGE_KEY, VERSION, avalonSession.setup)
}

export function startAvalonGame(): void {
  avalonSession.players = assignRoles(avalonSession.setup)
  avalonSession.currentRevealIndex = 0
  saveSetup()
}

export function hasAvalonSession(): boolean {
  return avalonSession.players.length >= 5
}

export function resetAvalonSession(): void {
  avalonSession.players = []
  avalonSession.currentRevealIndex = 0
}
