<script setup lang="ts">
import { LockKeyhole, Smartphone } from 'lucide-vue-next'
import GameButton from '@/components/ui/GameButton.vue'

defineProps<{ playerName: string; current: number; total: number }>()
defineEmits<{ ready: [] }>()
</script>

<template>
  <section class="pass-device">
    <div class="pass-device__icon"><Smartphone :size="42" /></div>
    <span class="step-kicker">玩家 {{ current }} / {{ total }}</span>
    <h1>請將裝置交給<br /><em>{{ playerName }}</em></h1>
    <p>其他玩家請移開視線。身份尚未揭露，裝置目前是安全的。</p>
    <div class="privacy-note"><LockKeyhole :size="17" /><span>只有 {{ playerName }} 可以按下繼續</span></div>
    <GameButton block @click="$emit('ready')">我是 {{ playerName }}，繼續</GameButton>
  </section>
</template>
