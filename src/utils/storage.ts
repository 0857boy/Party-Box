import type { VersionedData } from '@/types/game'

export function loadVersioned<T>(key: string, version: number, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<VersionedData<T>>
    return parsed.version === version && parsed.data !== undefined ? parsed.data : fallback
  } catch {
    return fallback
  }
}

export function saveVersioned<T>(key: string, version: number, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ version, data } satisfies VersionedData<T>))
  } catch {
    // The app remains fully playable when storage is unavailable.
  }
}
