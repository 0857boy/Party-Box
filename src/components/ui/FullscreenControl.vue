<script setup lang="ts">
import { Maximize, Minimize } from '@lucide/vue'
import { useAppFullscreen } from '@/composables/useAppFullscreen'

const { fullscreen, installed, pending, message, toggle } = useAppFullscreen()
</script>

<template>
  <div v-if="!installed" class="fullscreen-control">
    <button type="button" class="icon-button" :aria-label="fullscreen ? '退出全螢幕' : '進入全螢幕'" :title="fullscreen ? '退出全螢幕' : '進入全螢幕'" :aria-pressed="fullscreen" :disabled="pending" @click="toggle"><Minimize v-if="fullscreen" :size="20" /><Maximize v-else :size="20" /></button>
    <div v-if="message" class="fullscreen-control__message" role="status"><p>{{ message }}</p><button type="button" aria-label="關閉全螢幕提示" @click="message = ''">我知道了</button></div>
  </div>
</template>
