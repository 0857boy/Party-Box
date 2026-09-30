<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{ left: []; right: [] }>()
const startX = ref<number | null>(null)
const offsetX = ref(0)
const dragging = ref(false)
const style = computed(() => ({ transform: `translateX(${offsetX.value}px) rotate(${offsetX.value / 25}deg)` }))

function pointerDown(event: PointerEvent): void {
  startX.value = event.clientX
  dragging.value = true
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function pointerMove(event: PointerEvent): void {
  if (startX.value === null) return
  offsetX.value = Math.max(-130, Math.min(130, event.clientX - startX.value))
}

function pointerUp(): void {
  if (offsetX.value <= -80) emit('left')
  if (offsetX.value >= 80) emit('right')
  startX.value = null
  offsetX.value = 0
  dragging.value = false
}

function keydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowLeft') emit('left')
  if (event.key === 'ArrowRight') emit('right')
}
</script>

<template>
  <div
    class="swipe-card"
    :class="{ 'swipe-card--dragging': dragging }"
    :style="style"
    role="group"
    tabindex="0"
    aria-label="猜詞卡；向左跳過，向右猜對"
    @pointerdown="pointerDown"
    @pointermove="pointerMove"
    @pointerup="pointerUp"
    @pointercancel="pointerUp"
    @keydown="keydown"
  >
    <span class="swipe-card__hint swipe-card__hint--left">跳過</span>
    <span class="swipe-card__hint swipe-card__hint--right">猜對</span>
    <slot />
  </div>
</template>
