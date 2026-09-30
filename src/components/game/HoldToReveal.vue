<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Eye, Fingerprint } from '@lucide/vue'

const emit = defineEmits<{ revealed: [] }>()
withDefaults(defineProps<{ label?: string }>(), { label: '按住以揭露身份' })
const progress = ref(0)
const holding = ref(false)
let frame = 0
let startedAt = 0
const duration = 650

const progressStyle = computed(() => ({ '--hold-progress': `${progress.value * 100}%` }))

function startHold(): void {
  if (holding.value) return
  holding.value = true
  startedAt = performance.now() - progress.value * duration
  frame = requestAnimationFrame(tick)
}

function tick(now: number): void {
  if (!holding.value) return
  progress.value = Math.min(1, (now - startedAt) / duration)
  if (progress.value >= 1) {
    holding.value = false
    if ('vibrate' in navigator) navigator.vibrate([35, 25, 55])
    emit('revealed')
    return
  }
  frame = requestAnimationFrame(tick)
}

function cancelHold(): void {
  holding.value = false
  cancelAnimationFrame(frame)
  progress.value = 0
}

function onKeydown(event: KeyboardEvent): void {
  if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
    event.preventDefault()
    startHold()
  }
}

function onKeyup(event: KeyboardEvent): void {
  if (event.key === ' ' || event.key === 'Enter') cancelHold()
}

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <button
    class="hold-button"
    :class="{ 'hold-button--active': holding }"
    :style="progressStyle"
    @pointerdown.prevent="startHold"
    @pointerup="cancelHold"
    @pointercancel="cancelHold"
    @pointerleave="cancelHold"
    @keydown="onKeydown"
    @keyup="onKeyup"
  >
    <span class="hold-button__progress" />
    <Fingerprint v-if="!holding" :size="23" />
    <Eye v-else :size="23" />
    <span>{{ holding ? '繼續按住…' : label }}</span>
  </button>
</template>
