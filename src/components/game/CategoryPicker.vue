<script setup lang="ts" generic="T extends string">
import { computed, useId } from 'vue'

const props = defineProps<{
  modelValue: T
  options: readonly { id: T; name: string; description: string }[]
  label?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()
const selected = computed(() => props.options.find((option) => option.id === props.modelValue))
const inputId = useId()
</script>

<template>
  <div class="category-picker">
    <div class="category-picker__mobile">
      <label :for="inputId">{{ label || '選擇題目主題' }}</label>
      <select :id="inputId" :value="modelValue" @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value as T)">
        <option v-for="option in options" :key="option.id" :value="option.id">{{ option.name }}</option>
      </select>
      <p>{{ selected?.description }}</p>
    </div>
    <div class="word-category-grid">
      <button v-for="option in options" :key="option.id" type="button" :aria-pressed="modelValue === option.id" :class="{ active: modelValue === option.id }" @click="emit('update:modelValue', option.id)"><strong>{{ option.name }}</strong><small>{{ option.description }}</small></button>
    </div>
  </div>
</template>
