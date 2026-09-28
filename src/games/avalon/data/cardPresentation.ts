import roleAtlas from '@/assets/avalon-role-atlas.png'
import type { SecretRoleCardData } from '@/types/game'
import type { Role } from '../types'

export function getAvalonRoleCard(role: Role): SecretRoleCardData {
  return {
    title: role.displayName,
    subtitle: role.name,
    factionLabel: role.team === 'good' ? '正義陣營' : '邪惡陣營',
    tone: role.team,
    description: role.description,
    imageUrl: roleAtlas,
    imagePosition: role.atlasPosition,
    imageAlt: `${role.displayName}角色插畫`
  }
}
