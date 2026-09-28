import { roleById } from '../data/roles'
import type { AssignedPlayer, AvalonSetup, Role, RoleId, RoleInformation, TeamComposition, ValidationResult } from '../types'

export const teamComposition: Readonly<Record<number, TeamComposition>> = {
  5: { good: 3, evil: 2 },
  6: { good: 4, evil: 2 },
  7: { good: 4, evil: 3 },
  8: { good: 5, evil: 3 },
  9: { good: 6, evil: 3 },
  10: { good: 6, evil: 4 }
}

export function validateRoleConfig(setup: AvalonSetup): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const names = setup.playerNames.map((name) => name.trim())
  const composition = teamComposition[names.length]

  if (!composition) errors.push('阿瓦隆需要 5–10 位玩家。')
  if (names.some((name) => !name)) errors.push('每位玩家都需要名字。')
  if (new Set(names.map((name) => name.toLocaleLowerCase())).size !== names.length) errors.push('玩家名稱不能重複。')
  if (!setup.enabledRoles.includes('merlin')) errors.push('梅林是必要角色。')
  if (!setup.enabledRoles.includes('assassin')) errors.push('刺客是必要角色。')

  if (composition) {
    const selected = setup.enabledRoles.map((id) => roleById[id]).filter(Boolean)
    const goodSpecials = selected.filter((role) => role.team === 'good').length
    const evilSpecials = selected.filter((role) => role.team === 'evil').length
    if (goodSpecials > composition.good) errors.push(`正義特殊角色超過 ${composition.good} 個名額。`)
    if (evilSpecials > composition.evil) errors.push(`邪惡特殊角色超過 ${composition.evil} 個名額。`)
  }

  if (setup.enabledRoles.includes('morgana') && !setup.enabledRoles.includes('percival')) {
    warnings.push('沒有派西維爾時，摩甘娜的偽裝能力不會生效。')
  }
  if (setup.enabledRoles.includes('oberon')) warnings.push('奧伯倫不認識邪惡盟友，也不會被他們看見。')

  return { valid: errors.length === 0, errors, warnings }
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = result[index]
    const target = result[swapIndex]
    if (current !== undefined && target !== undefined) [result[index], result[swapIndex]] = [target, current]
  }
  return result
}

export function buildRoleDeck(setup: AvalonSetup): Role[] {
  const composition = teamComposition[setup.playerNames.length]
  if (!composition) throw new Error('Invalid player count')

  const selected = setup.enabledRoles.map((id) => roleById[id])
  const goodRoles = selected.filter((role) => role.team === 'good')
  const evilRoles = selected.filter((role) => role.team === 'evil')
  while (goodRoles.length < composition.good) goodRoles.push(roleById['loyal-servant'])
  while (evilRoles.length < composition.evil) evilRoles.push(roleById.minion)
  return [...goodRoles, ...evilRoles]
}

export function assignRoles(setup: AvalonSetup, random: () => number = Math.random): AssignedPlayer[] {
  const validation = validateRoleConfig(setup)
  if (!validation.valid) throw new Error(validation.errors.join(' '))
  const deck = shuffle(buildRoleDeck(setup), random)
  return setup.playerNames.map((name, index) => ({
    id: `player-${index}-${crypto.randomUUID?.() ?? Date.now()}`,
    name: name.trim(),
    role: deck[index] as Role
  }))
}

export function getRoleInformation(player: AssignedPlayer, players: readonly AssignedPlayer[]): RoleInformation {
  const roleId = player.role.id
  if (roleId === 'merlin') {
    return {
      title: '你感受到黑暗的氣息',
      summary: '這些玩家屬於邪惡陣營。莫德雷德不會出現在此處。',
      visiblePlayerIds: players.filter((candidate) => candidate.role.team === 'evil' && candidate.role.id !== 'mordred').map((candidate) => candidate.id)
    }
  }
  if (roleId === 'percival') {
    return {
      title: '其中一位是梅林',
      summary: '你看見梅林的候選人，但摩甘娜可能混在其中。',
      visiblePlayerIds: players.filter((candidate) => candidate.role.id === 'merlin' || candidate.role.id === 'morgana').map((candidate) => candidate.id),
      ambiguity: '身份順序已隨機排列，無法從位置分辨。'
    }
  }
  if (player.role.team === 'evil' && roleId !== 'oberon') {
    return {
      title: '你的黑暗盟友',
      summary: '你們彼此知曉，但奧伯倫不會出現在任何邪惡玩家的情報中。',
      visiblePlayerIds: players.filter((candidate) => candidate.id !== player.id && candidate.role.team === 'evil' && candidate.role.id !== 'oberon').map((candidate) => candidate.id)
    }
  }
  return {
    title: roleId === 'oberon' ? '你獨自行動' : '你的判斷就是武器',
    summary: roleId === 'oberon' ? '你屬於邪惡陣營，但不知道其他邪惡玩家是誰。' : '你沒有額外的身份情報。仔細觀察每個人的選擇。',
    visiblePlayerIds: []
  }
}

export function getDefaultEnabledRoles(playerCount: number): RoleId[] {
  const defaults: RoleId[] = ['merlin', 'percival', 'morgana', 'assassin']
  if (playerCount >= 7) defaults.push('mordred')
  return defaults
}
