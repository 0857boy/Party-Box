<script setup lang="ts">
import { User } from 'lucide-vue-next'
defineProps<{ name: string; index?: number; active?: boolean }>()
</script>

<template>
  <span class="player-chip" :class="{ 'player-chip--active': active }">
    <span class="player-chip__avatar"><User :size="14" /><span v-if="index !== undefined">{{ index + 1 }}</span></span>
    {{ name }}
  </span>
</template>
