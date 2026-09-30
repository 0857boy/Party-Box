<script setup lang="ts">
import { Clock3, UsersRound } from '@lucide/vue'
import { playerRosterStore } from '@/stores/playerRosters'

defineEmits<{ select: [names: string[]] }>()
</script>

<template>
  <div v-if="playerRosterStore.recent.length" class="roster-history">
    <header><Clock3 :size="16" /><strong>最近玩家名單</strong><small>最多保留 5 組</small></header>
    <div>
      <button v-for="roster in playerRosterStore.recent" :key="roster.id" type="button" @click="$emit('select', [...roster.names])">
        <UsersRound :size="17" />
        <span><strong>{{ roster.names.length }} 人</strong><small>{{ roster.names.join('、') }}</small></span>
      </button>
    </div>
  </div>
</template>
