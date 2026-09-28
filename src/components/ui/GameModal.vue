<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ open: boolean; title: string; closeLabel?: string }>(), {
  closeLabel: '關閉'
})
const emit = defineEmits<{ close: [] }>()

function onKeydown(event: KeyboardEvent): void {
  if (props.open && event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" role="presentation" @click.self="$emit('close')">
        <section class="game-modal" role="dialog" aria-modal="true" :aria-label="title">
          <header class="game-modal__header">
            <div>
              <span class="eyebrow">PARTY BOX</span>
              <h2>{{ title }}</h2>
            </div>
            <button class="icon-button" :aria-label="closeLabel" @click="$emit('close')"><X :size="22" /></button>
          </header>
          <div class="game-modal__body"><slot /></div>
          <footer v-if="$slots.footer" class="game-modal__footer"><slot name="footer" /></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
