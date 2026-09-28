<script setup lang="ts">
import { ref } from 'vue'
import { SlidersHorizontal, Volume2, VolumeX, X } from '@lucide/vue'
import { useAudioManager } from '@/composables/useAudioManager'

const panelOpen = ref(false)
const { isMuted, toggleMute, preferences } = useAudioManager()
</script>

<template>
  <aside class="audio-control" :class="{ 'audio-control--open': panelOpen }">
    <button class="audio-control__main" :aria-label="isMuted ? '開啟聲音' : '靜音'" @click="toggleMute">
      <VolumeX v-if="isMuted" :size="20" />
      <Volume2 v-else :size="20" />
    </button>
    <button class="audio-control__settings" aria-label="音訊設定" @click="panelOpen = !panelOpen">
      <X v-if="panelOpen" :size="18" />
      <SlidersHorizontal v-else :size="18" />
    </button>
    <div v-if="panelOpen" class="audio-panel">
      <strong>音訊設定</strong>
      <label>主音量 <input v-model.number="preferences.audio.masterVolume" type="range" min="0" max="1" step="0.05" /></label>
      <label>音樂 <input v-model.number="preferences.audio.musicVolume" type="range" min="0" max="1" step="0.05" /></label>
      <label>音效 <input v-model.number="preferences.audio.sfxVolume" type="range" min="0" max="1" step="0.05" /></label>
      <label>語音 <input v-model.number="preferences.audio.voiceVolume" type="range" min="0" max="1" step="0.05" /></label>
    </div>
  </aside>
</template>
