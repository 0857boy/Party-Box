import type { Role, RoleId } from '../types'

export const roles: readonly Role[] = [
  {
    id: 'merlin', name: 'Merlin', displayName: '梅林', team: 'good', selectable: true, required: true,
    atlasPosition: '0% 0%', description: '亞瑟王最睿智的守護者。你知道多數邪惡勢力是誰。',
    ability: '看得見所有邪惡玩家，但看不見莫德雷德。隱藏你的洞察，別讓刺客找到你。'
  },
  {
    id: 'percival', name: 'Percival', displayName: '派西維爾', team: 'good', selectable: true,
    atlasPosition: '50% 0%', description: '忠誠而敏銳的圓桌騎士，肩負辨認梅林的使命。',
    ability: '你會看見梅林與摩甘娜，但不知道兩者誰才是真正的梅林。'
  },
  {
    id: 'loyal-servant', name: 'Loyal Servant', displayName: '亞瑟的忠臣', team: 'good', selectable: false,
    atlasPosition: '0% 50%', description: '不掌握額外情報，卻是王國最可靠的力量。',
    ability: '觀察言行、建立信任，協助正義陣營完成三次任務。'
  },
  {
    id: 'morgana', name: 'Morgana', displayName: '摩甘娜', team: 'evil', selectable: true,
    atlasPosition: '100% 0%', description: '善於偽裝的女巫，在派西維爾眼中與梅林難以分辨。',
    ability: '你會偽裝成梅林出現在派西維爾的情報中，並認得多數邪惡盟友。'
  },
  {
    id: 'assassin', name: 'Assassin', displayName: '刺客', team: 'evil', selectable: true, required: true,
    atlasPosition: '50% 100%', description: '潛伏於陰影中的終結者，等待辨認梅林的最後機會。',
    ability: '正義完成三次任務後，你可以刺殺梅林；成功便讓邪惡逆轉獲勝。'
  },
  {
    id: 'mordred', name: 'Mordred', displayName: '莫德雷德', team: 'evil', selectable: true,
    atlasPosition: '100% 50%', description: '深藏不露的叛逆之王，就連梅林也看不見他的真面目。',
    ability: '梅林無法在情報中看見你；其他邪惡玩家仍然知道你的身份。'
  },
  {
    id: 'oberon', name: 'Oberon', displayName: '奧伯倫', team: 'evil', selectable: true,
    atlasPosition: '0% 100%', description: '孤立的邪惡勢力，不認識同伴，也不被同伴所知。',
    ability: '你不會看見邪惡盟友；邪惡盟友也不會在情報中看見你。'
  },
  {
    id: 'minion', name: 'Minion of Mordred', displayName: '爪牙', team: 'evil', selectable: false,
    atlasPosition: '100% 100%', description: '忠於莫德雷德的黑暗爪牙，與同伴共同破壞任務。',
    ability: '你認得除奧伯倫以外的邪惡盟友。隱藏身份，讓三次任務失敗。'
  }
] as const

export const roleById = Object.fromEntries(roles.map((role) => [role.id, role])) as Record<RoleId, Role>
export const selectableRoles = roles.filter((role) => role.selectable)
