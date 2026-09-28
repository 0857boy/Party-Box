<script setup lang="ts">
import { Download, WifiOff, X } from 'lucide-vue-next'
import GameButton from './GameButton.vue'

defineProps<{ needRefresh: boolean; offlineReady: boolean }>()
defineEmits<{ close: []; update: [] }>()
</script>

<template>
  <Transition name="toast">
    <aside v-if="needRefresh || offlineReady" class="update-toast" role="status">
      <component :is="needRefresh ? Download : WifiOff" :size="21" aria-hidden="true" />
      <div class="update-toast__copy">
        <strong>{{ needRefresh ? '新版本已準備好' : '已可離線遊玩' }}</strong>
        <span>{{ needRefresh ? '立即更新以取得最新內容。' : '沒有網路也能繼續開啟 Party Box。' }}</span>
      </div>
      <GameButton v-if="needRefresh" size="compact" @click="$emit('update')">更新</GameButton>
      <button class="icon-button" aria-label="關閉通知" @click="$emit('close')"><X :size="18" /></button>
    </aside>
  </Transition>
</template>
