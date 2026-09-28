<script setup lang="ts">
import { Shield, Skull } from 'lucide-vue-next'
import type { Role } from '@/games/avalon/types'
import roleAtlas from '@/assets/avalon-role-atlas.png'

withDefaults(defineProps<{ role?: Role; revealed?: boolean; compact?: boolean }>(), {
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
      <article v-if="role" class="role-card__face role-card__front" :class="`role-card__front--${role.team}`">
        <div
          class="role-card__art"
          role="img"
          :aria-label="`${role.displayName}角色插畫`"
          :style="{ backgroundImage: `url(${roleAtlas})`, backgroundPosition: role.atlasPosition }"
        />
        <div class="role-card__content">
          <span class="role-card__team"><component :is="role.team === 'good' ? Shield : Skull" :size="14" /> {{ role.team === 'good' ? '正義陣營' : '邪惡陣營' }}</span>
          <h2>{{ role.displayName }}</h2>
          <span class="role-card__english">{{ role.name }}</span>
          <p>{{ role.description }}</p>
        </div>
      </article>
    </div>
  </div>
</template>
