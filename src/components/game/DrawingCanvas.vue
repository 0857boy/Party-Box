<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { Undo2 } from '@lucide/vue'
import type { DrawingPoint, DrawingStroke } from '@/types/drawing'

const props = withDefaults(defineProps<{
  strokes: readonly DrawingStroke[]
  color: string
  disabled?: boolean
}>(), { disabled: false })
const emit = defineEmits<{ 'stroke-change': [points: DrawingPoint[] | null] }>()
const svg = ref<SVGSVGElement>()
const patternId = `drawing-grid-${useId().replaceAll(':', '')}`
const draft = ref<DrawingPoint[]>([])
const drawing = ref(false)
const hasDraft = computed(() => draft.value.length > 0)

watch(() => props.color, clearDraft)

function pointerDown(event: PointerEvent): void {
  if (props.disabled || hasDraft.value || !svg.value) return
  drawing.value = true
  draft.value = [eventPoint(event)]
  svg.value.setPointerCapture(event.pointerId)
}

function pointerMove(event: PointerEvent): void {
  if (!drawing.value) return
  const point = eventPoint(event)
  const previous = draft.value[draft.value.length - 1]
  if (!previous || Math.hypot(point.x - previous.x, point.y - previous.y) >= 3) draft.value.push(point)
}

function pointerUp(): void {
  if (!drawing.value) return
  drawing.value = false
  emit('stroke-change', [...draft.value])
}

function clearDraft(): void {
  draft.value = []
  drawing.value = false
  emit('stroke-change', null)
}

function eventPoint(event: PointerEvent): DrawingPoint {
  const rect = svg.value!.getBoundingClientRect()
  return {
    x: Math.round(Math.max(0, Math.min(1000, ((event.clientX - rect.left) / rect.width) * 1000))),
    y: Math.round(Math.max(0, Math.min(700, ((event.clientY - rect.top) / rect.height) * 700)))
  }
}

function points(value: readonly DrawingPoint[]): string {
  if (value.length === 1) return `${value[0]!.x},${value[0]!.y} ${value[0]!.x + 0.1},${value[0]!.y + 0.1}`
  return value.map((point) => `${point.x},${point.y}`).join(' ')
}
</script>

<template>
  <div class="drawing-canvas" :class="{ 'drawing-canvas--disabled': disabled }">
    <svg
      ref="svg"
      viewBox="0 0 1000 700"
      role="img"
      aria-label="共同畫布"
      @pointerdown="pointerDown"
      @pointermove="pointerMove"
      @pointerup="pointerUp"
      @pointercancel="pointerUp"
    >
      <pattern :id="patternId" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" stroke-width="1" /></pattern>
      <rect width="1000" height="700" :fill="`url(#${patternId})`" class="drawing-canvas__grid" />
      <polyline v-for="stroke in strokes" :key="stroke.id" :points="points(stroke.points)" :stroke="stroke.color" />
      <polyline v-if="draft.length" :points="points(draft)" :stroke="color" class="drawing-canvas__draft" />
    </svg>
    <button v-if="hasDraft && !disabled" type="button" class="drawing-canvas__retry" @click="clearDraft"><Undo2 :size="17" />重畫這一筆</button>
    <span v-else-if="!disabled" class="drawing-canvas__instruction">從畫布任意位置開始，手指離開就完成一筆</span>
  </div>
</template>
