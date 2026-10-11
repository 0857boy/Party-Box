<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, Minus, Plus, X } from '@lucide/vue'
import ActionDock from './ActionDock.vue'

const props = defineProps<{
  steps: string[]; summary?: string; values?: string[]; visibleSteps?: number[]
  playerCount: number; minPlayers: number; maxPlayers: number
}>()
const emit = defineEmits<{ submit: []; addPlayer: []; removePlayer: [] }>()
const selectedStep = ref(0)
const dialog = ref<HTMLDialogElement>()
const titleId = useId()
const route = useRoute()
const router = useRouter()
const remainingSteps = computed(() => (props.visibleSteps ?? props.steps.map((_, index) => index)).filter(index => index !== 0))
let previousOverflow = ''
let disposed = false

function open(index: number): void {
  void router.push({ query: { ...route.query, setupPanel: String(index) } })
}
function close(): void {
  if (route.query.setupPanel !== undefined) router.back()
}
async function syncDialog(): Promise<void> {
  const index = Number(route.query.setupPanel)
  const editing = route.query.setupPanel !== undefined && Number.isInteger(index) && index >= 0 && index < props.steps.length
  if (editing) selectedStep.value = index
  await nextTick()
  if (disposed || !dialog.value) return
  if (editing && !dialog.value.open) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.value.showModal()
  } else if (!editing && dialog.value.open) {
    dialog.value.close()
    document.body.style.overflow = previousOverflow
  }
}
function backdrop(event: MouseEvent): void {
  if (event.target !== dialog.value) return
  const rect = dialog.value.getBoundingClientRect()
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close()
}
function submit(): void {
  // Enter while editing confirms the edit, never starts a game accidentally.
  if (dialog.value?.open) close()
  else emit('submit')
}
watch(() => route.query.setupPanel, syncDialog, { flush: 'post' })
onMounted(syncDialog)
onBeforeUnmount(() => {
  disposed = true
  if (dialog.value?.open) {
    dialog.value.close()
    document.body.style.overflow = previousOverflow
  }
})
</script>

<template>
  <form class="setup-form setup-flow" @submit.prevent="submit">
    <section class="setup-overview" aria-label="快速設定">
      <div class="setup-players-row">
        <button class="setup-edit-row" type="button" :aria-label="`編輯${steps[0]}`" @click="open(0)"><span><small>{{ steps[0] }}</small><strong>{{ playerCount }} 人</strong><em v-if="values?.[0]">{{ values[0] }}</em></span><ChevronRight :size="20" /></button>
        <div class="setup-count-control" role="group" aria-label="玩家人數"><button type="button" aria-label="減少玩家" :disabled="playerCount <= minPlayers" @click="emit('removePlayer')"><Minus :size="20" /></button><button type="button" aria-label="新增玩家" :disabled="playerCount >= maxPlayers" @click="emit('addPlayer')"><Plus :size="20" /></button></div>
      </div>
      <div v-if="$slots.quick" class="setup-quick-options"><slot name="quick" /></div>
      <nav v-if="remainingSteps.length" class="setup-detail-links" aria-label="設定細項">
        <button v-for="index in remainingSteps" :key="index" class="setup-edit-row" type="button" @click="open(index)"><span><small>{{ steps[index] }}</small><strong>{{ values?.[index] || '調整設定' }}</strong></span><ChevronRight :size="20" /></button>
      </nav>
      <slot name="feedback" />
      <slot name="extra" />
    </section>
    <dialog ref="dialog" class="setup-editor" :aria-labelledby="titleId" @cancel.prevent="close" @click="backdrop">
      <header class="setup-editor__header"><h2 :id="titleId">{{ steps[selectedStep] }}</h2><button type="button" class="icon-button" aria-label="關閉設定" autofocus @click="close"><X :size="22" /></button></header>
      <div class="setup-editor__body" :data-step="selectedStep"><slot /></div>
      <footer class="setup-editor__footer"><button type="button" @click="close">完成</button></footer>
    </dialog>
    <ActionDock :hint="summary"><slot name="action" /></ActionDock>
    <slot name="note" />
  </form>
</template>
