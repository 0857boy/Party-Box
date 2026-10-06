<script setup lang="ts">
import { ArrowLeft, Home } from '@lucide/vue'
import { useRouter } from 'vue-router'
import AudioControl from '@/components/audio/AudioControl.vue'

withDefaults(defineProps<{ title: string; step?: string; back?: boolean }>(), { back: true })
const router = useRouter()
</script>

<template>
  <header class="game-header">
    <button v-if="back" class="icon-button" aria-label="返回" @click="router.back()"><ArrowLeft :size="22" /></button>
    <RouterLink v-else class="brand-mark brand-mark--small" to="/" aria-label="Party Box 首頁"><span>PB</span></RouterLink>
    <div class="game-header__title"><span v-if="step">{{ step }}</span><strong>{{ title }}</strong></div>
    <div class="game-header__actions"><AudioControl compact /><RouterLink class="icon-button" to="/" aria-label="回首頁"><Home :size="21" /></RouterLink></div>
  </header>
</template>
