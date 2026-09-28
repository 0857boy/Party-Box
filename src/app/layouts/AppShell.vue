<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import AudioControl from '@/components/audio/AudioControl.vue'

const route = useRoute()
const theme = computed(() => String(route.meta.theme ?? 'party-box'))

watchEffect(() => document.documentElement.setAttribute('data-theme', theme.value))
</script>

<template>
  <div class="app-shell" :data-theme="theme">
    <div class="ambient ambient--one" />
    <div class="ambient ambient--two" />
    <main class="app-main">
      <slot />
    </main>
    <AudioControl />
  </div>
</template>
