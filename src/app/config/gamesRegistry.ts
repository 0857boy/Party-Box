import { Crown, Fingerprint, MapPin, Paintbrush, Sparkles, Theater } from '@lucide/vue'
import type { PartyGame } from '@/types/game'

export const gamesRegistry: readonly PartyGame[] = [
  {
    id: 'avalon',
    name: '阿瓦隆',
    eyebrow: '身份推理 · 5–10 人',
    description: '在忠誠與背叛之間辨認盟友。梅林知道真相，但邪惡勢力正伺機刺殺。',
    minPlayers: 5,
    maxPlayers: 10,
    theme: 'avalon',
    icon: Crown,
    routeName: 'avalon-setup',
    available: true,
    accent: '金焰'
  },
  {
    id: 'undercover',
    name: '誰是臥底',
    eyebrow: '詞語推理 · 4–12 人',
    description: '用一句話藏住自己的詞，從細節找出人群中的臥底。',
    minPlayers: 4,
    maxPlayers: 12,
    theme: 'undercover',
    icon: Fingerprint,
    routeName: 'undercover-setup',
    available: true,
    accent: '霓虹紫'
  },
  {
    id: 'charades',
    name: '爆笑猜詞',
    eyebrow: '團隊猜詞 · 4–16 人',
    description: '同一副牌連玩三輪：自由描述、一字提示，最後只能靠肢體演到隊友懂。',
    minPlayers: 4,
    maxPlayers: 16,
    theme: 'charades',
    icon: Theater,
    routeName: 'charades-setup',
    available: true,
    accent: '珊瑚橘'
  },
  {
    id: 'fake-artist',
    name: '誰是假畫家',
    eyebrow: '共同畫圖 · 5–10 人',
    description: '所有人一起畫同一題，只有假畫家不知道答案。畫得太清楚，反而可能害了全隊。',
    minPlayers: 5,
    maxPlayers: 10,
    theme: 'fake-artist',
    icon: Paintbrush,
    routeName: 'fake-artist-setup',
    available: true,
    accent: '畫布青'
  },
  {
    id: 'spyfall',
    name: 'Spyfall',
    eyebrow: '地點推理 · 即將推出',
    description: '所有人都知道地點，除了一位間諜。問對問題，別暴露太多。',
    minPlayers: 3,
    maxPlayers: 12,
    theme: 'spyfall',
    icon: MapPin,
    available: false,
    accent: '冰川藍'
  },
  {
    id: 'secret-mission',
    name: 'Secret Mission',
    eyebrow: '秘密任務 · 即將推出',
    description: '每個人都有不能說的任務。觀察、行動，然後若無其事。',
    minPlayers: 4,
    maxPlayers: 12,
    theme: 'secret-mission',
    icon: Sparkles,
    available: false,
    accent: '電光綠'
  }
]
