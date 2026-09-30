import { reactive } from 'vue'
import { loadVersioned, saveVersioned } from '@/utils/storage'

export interface SavedPlayerRoster {
  id: string
  names: string[]
  usedAt: string
}

interface StoredPlayerRosters {
  currentNames: string[]
  recent: SavedPlayerRoster[]
}

const STORAGE_KEY = 'party-box:player-rosters'
const VERSION = 1
const defaults: StoredPlayerRosters = { currentNames: [], recent: [] }
const saved = loadVersioned<StoredPlayerRosters>(STORAGE_KEY, VERSION, defaults)

export const playerRosterStore = reactive<StoredPlayerRosters>({
  currentNames: [...saved.currentNames],
  recent: saved.recent.map((roster) => ({ ...roster, names: [...roster.names] }))
})

export function getSharedPlayerNames(fallback: readonly string[], minPlayers: number, maxPlayers: number): string[] {
  const source = playerRosterStore.currentNames.length ? playerRosterStore.currentNames : fallback
  const names = source.slice(0, maxPlayers).map((name) => name.trim()).filter(Boolean)
  while (names.length < minPlayers) names.push(nextDefaultName(names))
  return names
}

export function normalizeRosterForGame(names: readonly string[], minPlayers: number, maxPlayers: number): string[] {
  const normalized = names.slice(0, maxPlayers).map((name) => name.trim()).filter(Boolean)
  while (normalized.length < minPlayers) normalized.push(nextDefaultName(normalized))
  return normalized
}

export function rememberPlayerRoster(names: readonly string[]): void {
  const normalized = names.map((name) => name.trim()).filter(Boolean)
  if (!normalized.length) return
  const signature = normalized.map((name) => name.toLocaleLowerCase('zh-TW')).join('\u0000')
  const roster: SavedPlayerRoster = {
    id: signature,
    names: normalized,
    usedAt: new Date().toISOString()
  }
  playerRosterStore.currentNames = [...normalized]
  playerRosterStore.recent = [roster, ...playerRosterStore.recent.filter((item) => item.id !== signature)].slice(0, 5)
  saveVersioned(STORAGE_KEY, VERSION, playerRosterStore)
}

function nextDefaultName(existing: readonly string[]): string {
  let number = existing.length + 1
  while (existing.includes(`玩家 ${number}`)) number += 1
  return `玩家 ${number}`
}
