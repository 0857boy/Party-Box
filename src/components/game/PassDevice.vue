<script setup lang="ts">
import { LockKeyhole, Smartphone } from '@lucide/vue'
import GameButton from '@/components/ui/GameButton.vue'

withDefaults(defineProps<{
  playerName: string
  current: number
  total: number
  message?: string
  privacyText?: string
  actionLabel?: string
}>(), {
  message: '其他玩家請移開視線。裝置上的下一步只屬於你。',
  privacyText: '請確認只有指定玩家能看見畫面',
  actionLabel: ''
})
defineEmits<{ ready: [] }>()
</script>

<template>
  <section class="pass-device">
    <div class="pass-device__icon"><Smartphone :size="42" /></div>
    <span class="step-kicker">玩家 {{ current }} / {{ total }}</span>
    <h1>請將裝置交給<br /><em>{{ playerName }}</em></h1>
    <p>{{ message }}</p>
    <div class="privacy-note"><LockKeyhole :size="17" /><span>{{ privacyText }}</span></div>
    <GameButton block @click="$emit('ready')">{{ actionLabel || `我是 ${playerName}，繼續` }}</GameButton>
  </section>
</template>
