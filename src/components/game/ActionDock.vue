<script setup lang="ts">
defineProps<{ hint?: string }>()
</script>

<template>
  <div class="action-dock">
    <p v-if="hint" class="action-dock__hint">{{ hint }}</p>
    <slot />
  </div>
</template>
