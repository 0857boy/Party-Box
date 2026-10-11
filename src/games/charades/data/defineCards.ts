import type { CharadesCard, CharadesDifficulty } from '../types'

interface CardGroup {
  difficulty: CharadesDifficulty
  tags: string[]
  entries: string
}

// Explicit immutable IDs, not array positions or labels. Keep the ID when
// correcting a name or moving a card to another category. Retired IDs stay retired.
export function defineCards(category: CharadesCard['category'], groups: readonly CardGroup[]): CharadesCard[] {
  return groups.flatMap(group => group.entries.trim().split(/\s+/u).map(entry => {
    const separator = entry.indexOf(':')
    if (separator < 1) throw new Error(`Missing charades card ID: ${entry}`)
    return {
      id: `charades-${entry.slice(0, separator)}`,
      label: entry.slice(separator + 1),
      category,
      difficulty: group.difficulty,
      tags: [...group.tags]
    }
  }))
}
