<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const emit = defineEmits<{ left: []; right: [] }>()
const props = defineProps<{ resetKey?: string }>()
const startX = ref<number | null>(null)
let startY = 0
let axisX = 1
let axisY = 0
const offsetX = ref(0)
const dragging = ref(false)
const style = computed(() => ({ transform: `translateX(${offsetX.value}px) rotate(${offsetX.value / 25}deg)` }))

function pointerDown(event: PointerEvent): void {
  startX.value = event.clientX
  startY = event.clientY
  // Project screen movement onto the card's local horizontal axis. The
  // landscape fallback rotates the entire stage, not the device viewport.
  let matrix = new DOMMatrix()
  let parent = (event.currentTarget as HTMLElement).parentElement
  while (parent) {
    const transform = getComputedStyle(parent).transform
    if (transform !== 'none') matrix = new DOMMatrix(transform).multiply(matrix)
    parent = parent.parentElement
  }
  const inverse = matrix.inverse()
  axisX = inverse.a
  axisY = inverse.c
  dragging.value = true
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function pointerMove(event: PointerEvent): void {
  if (startX.value === null) return
  const distance = (event.clientX - startX.value) * axisX + (event.clientY - startY) * axisY
  offsetX.value = Math.max(-130, Math.min(130, distance))
}

function pointerUp(): void {
  if (offsetX.value <= -80) emit('left')
  if (offsetX.value >= 80) emit('right')
  resetGesture()
}

function resetGesture(): void {
  startX.value = null
  offsetX.value = 0
  dragging.value = false
}

watch(() => props.resetKey, resetGesture)

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
    @pointercancel="resetGesture"
    @keydown="keydown"
  >
    <span class="swipe-card__hint swipe-card__hint--left">跳過</span>
    <span class="swipe-card__hint swipe-card__hint--right">猜對</span>
    <slot />
  </div>
</template>
