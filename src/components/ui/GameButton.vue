<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'

withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'default' | 'compact'
  type?: 'button' | 'submit'
  disabled?: boolean
  loading?: boolean
  block?: boolean
}>(), {
  variant: 'primary',
  size: 'default',
  type: 'button',
  disabled: false,
  loading: false,
  block: false
})
</script>

<template>
  <button
    :type="type"
    class="game-button"
    :class="[`game-button--${variant}`, `game-button--${size}`, { 'game-button--block': block }]"
    :disabled="disabled || loading"
  >
    <LoaderCircle v-if="loading" :size="18" class="spin" aria-hidden="true" />
    <slot name="icon" />
    <span><slot /></span>
    <slot name="trailing" />
  </button>
</template>
