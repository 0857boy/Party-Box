<script setup lang="ts">
import { Shield, Skull } from '@lucide/vue'
import type { SecretRoleCardData } from '@/types/game'

withDefaults(defineProps<{ card?: SecretRoleCardData; revealed?: boolean; compact?: boolean }>(), {
  revealed: false,
  compact: false
})
</script>

<template>
  <div class="role-card-scene" :class="{ 'role-card-scene--compact': compact }">
    <div class="role-card" :class="{ 'role-card--revealed': revealed }">
      <article class="role-card__face role-card__back" aria-label="未揭露的身份卡">
        <div class="card-back__frame">
          <span class="card-back__rune">✦</span>
          <span class="card-back__title">PARTY BOX</span>
          <span class="card-back__subtitle">KEEP YOUR SECRET</span>
        </div>
      </article>
      <article v-if="card" class="role-card__face role-card__front" :class="`role-card__front--${card.tone}`">
        <div
          class="role-card__art"
          role="img"
          :aria-label="card.imageAlt"
          :style="{ backgroundImage: `url(${card.imageUrl})`, backgroundPosition: card.imagePosition ?? 'center' }"
        />
        <div class="role-card__content">
          <span class="role-card__team"><component :is="card.tone === 'evil' ? Skull : Shield" :size="14" /> {{ card.factionLabel }}</span>
          <h2>{{ card.title }}</h2>
          <span class="role-card__english">{{ card.subtitle }}</span>
          <p>{{ card.description }}</p>
        </div>
      </article>
    </div>
  </div>
</template>
