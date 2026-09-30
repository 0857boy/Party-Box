<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  guess?: number
  target?: number
  reveal?: boolean
  showGuess?: boolean
}>(), { guess: 50, target: 50, reveal: false, showGuess: true })

function point(position: number, radius: number): { x: number; y: number } {
  const angle = Math.PI * (1 - Math.max(0, Math.min(100, position)) / 100)
  return { x: 200 + radius * Math.cos(angle), y: 191 - radius * Math.sin(angle) }
}

function arc(start: number, end: number, radius = 151): string {
  const from = point(start, radius)
  const to = point(end, radius)
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 0 1 ${to.x} ${to.y}`
}

const bands = computed(() => {
  if (!props.reveal) return []
  return [
    { start: -16, end: -9, color: '#50c9f2' },
    { start: -9, end: -4, color: '#9d8aff' },
    { start: -4, end: 4, color: '#ffe18b' },
    { start: 4, end: 9, color: '#9d8aff' },
    { start: 9, end: 16, color: '#50c9f2' }
  ].map((band) => ({ ...band, path: arc(props.target + band.start, props.target + band.end) }))
})
const needle = computed(() => point(props.guess, 119))
const targetPoint = computed(() => point(props.target, 115))
</script>

<template>
  <svg class="spectrum-dial" viewBox="0 0 400 224" role="img" :aria-label="reveal ? `指針位置 ${guess}，目標位置 ${target}` : '隱藏的目標轉盤'">
    <defs><filter id="spectrum-glow"><feGaussianBlur stdDeviation="7" /></filter></defs>
    <path :d="arc(0, 100)" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="45" stroke-linecap="round" />
    <path :d="arc(0, 100)" fill="none" stroke="rgba(197,214,255,.23)" stroke-width="29" stroke-linecap="round" />
    <g v-if="reveal">
      <path v-for="(band, index) in bands" :key="`${index}-glow`" :d="band.path" fill="none" :stroke="band.color" stroke-width="31" stroke-linecap="butt" opacity=".45" filter="url(#spectrum-glow)" />
      <path v-for="(band, index) in bands" :key="index" :d="band.path" fill="none" :stroke="band.color" stroke-width="29" stroke-linecap="butt" />
      <circle :cx="targetPoint.x" :cy="targetPoint.y" r="5" fill="#fff4c5" />
    </g>
    <path :d="arc(0, 100, 91)" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1" stroke-dasharray="2 8" />
    <line v-if="showGuess" x1="200" y1="191" :x2="needle.x" :y2="needle.y" stroke="#f8f6ff" stroke-width="5" stroke-linecap="round" class="spectrum-dial__needle" />
    <circle cx="200" cy="191" r="15" fill="#f8f6ff" />
    <circle cx="200" cy="191" r="7" fill="#4b3d7b" />
  </svg>
</template>
