<script setup lang="ts">
import { ref } from 'vue'
import ActionDock from './ActionDock.vue'

defineProps<{ steps: string[]; summary?: string }>()
defineEmits<{ submit: [] }>()
const selectedStep = ref(0)
</script>

<template>
  <form class="setup-form setup-flow" :data-step="selectedStep" @submit.prevent="$emit('submit')">
    <nav class="setup-flow__nav" aria-label="設定分頁">
      <button v-for="(step, index) in steps" :key="step" type="button" :aria-pressed="selectedStep === index" @click="selectedStep = index">
        <span>{{ String(index + 1).padStart(2, '0') }}</span>{{ step }}
      </button>
    </nav>
    <slot />
    <slot name="feedback" />
    <slot name="extra" />
    <ActionDock :hint="summary"><slot name="action" /></ActionDock>
    <slot name="note" />
  </form>
</template>
