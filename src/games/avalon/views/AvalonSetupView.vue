<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, ArrowRight, Plus, Shield, Skull, Trash2, UsersRound } from 'lucide-vue-next'
import GameHeader from '@/components/game/GameHeader.vue'
import GameButton from '@/components/ui/GameButton.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import { selectableRoles } from '../data/roles'
import { getDefaultEnabledRoles, teamComposition, validateRoleConfig } from '../logic/game'
import { avalonSession, startAvalonGame } from '../stores/session'
import type { RoleId } from '../types'

const router = useRouter()
const validation = computed(() => validateRoleConfig(avalonSession.setup))
const composition = computed(() => teamComposition[avalonSession.setup.playerNames.length])

function addPlayer(): void {
  if (avalonSession.setup.playerNames.length >= 10) return
  avalonSession.setup.playerNames.push(`玩家 ${avalonSession.setup.playerNames.length + 1}`)
  if (avalonSession.setup.playerNames.length === 7 && !avalonSession.setup.enabledRoles.includes('mordred')) {
    avalonSession.setup.enabledRoles.push('mordred')
  }
}

function removePlayer(index: number): void {
  if (avalonSession.setup.playerNames.length <= 5) return
  avalonSession.setup.playerNames.splice(index, 1)
}

function updateRole(id: RoleId, enabled: boolean): void {
  const roles = avalonSession.setup.enabledRoles
  if (enabled && !roles.includes(id)) roles.push(id)
  if (!enabled) {
    const index = roles.indexOf(id)
    if (index >= 0) roles.splice(index, 1)
  }
}

function resetRecommended(): void {
  avalonSession.setup.enabledRoles = getDefaultEnabledRoles(avalonSession.setup.playerNames.length)
}

function start(): void {
  if (!validation.value.valid) return
  startAvalonGame()
  void router.push({ name: 'avalon-reveal' })
}
</script>

<template>
  <div class="game-page setup-page">
    <GameHeader title="遊戲設定" step="AVALON · SETUP" />
    <div class="setup-layout page-container page-container--game">
      <section class="setup-intro">
        <span class="eyebrow">THE RESISTANCE: AVALON</span>
        <h1>召集你的<br /><em>圓桌騎士</em></h1>
        <p>輸入玩家名稱並選擇特殊角色。身份會在開始後隨機分配。</p>
        <div class="team-balance" v-if="composition">
          <div><Shield :size="20" /><span><small>正義</small><strong>{{ composition.good }}</strong></span></div>
          <i />
          <div><Skull :size="20" /><span><small>邪惡</small><strong>{{ composition.evil }}</strong></span></div>
        </div>
      </section>

      <form class="setup-form" @submit.prevent="start">
        <section class="setup-panel">
          <header class="setup-panel__header">
            <div><span>01</span><h2>玩家</h2><small>{{ avalonSession.setup.playerNames.length }} / 10</small></div>
            <UsersRound :size="22" />
          </header>
          <div class="player-inputs">
            <label v-for="(_, index) in avalonSession.setup.playerNames" :key="index" class="player-input">
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <input v-model.trim="avalonSession.setup.playerNames[index]" type="text" maxlength="18" :aria-label="`玩家 ${index + 1} 名稱`" autocomplete="off" />
              <button type="button" :disabled="avalonSession.setup.playerNames.length <= 5" :aria-label="`移除玩家 ${index + 1}`" @click="removePlayer(index)"><Trash2 :size="17" /></button>
            </label>
          </div>
          <button v-if="avalonSession.setup.playerNames.length < 10" class="add-player" type="button" @click="addPlayer"><Plus :size="18" /> 新增玩家</button>
        </section>

        <section class="setup-panel role-setup">
          <header class="setup-panel__header">
            <div><span>02</span><h2>特殊角色</h2></div>
            <button type="button" class="text-button" @click="resetRecommended">套用推薦</button>
          </header>
          <div class="role-toggle-list">
            <ToggleSwitch
              v-for="role in selectableRoles"
              :key="role.id"
              :model-value="avalonSession.setup.enabledRoles.includes(role.id)"
              :label="role.displayName"
              :description="`${role.team === 'good' ? '正義' : '邪惡'} · ${role.ability}`"
              :disabled="role.required"
              @update:model-value="updateRole(role.id, $event)"
            />
          </div>
        </section>

        <div v-if="validation.errors.length || validation.warnings.length" class="validation-box" :class="{ 'validation-box--error': validation.errors.length }">
          <AlertTriangle :size="20" />
          <div><p v-for="message in [...validation.errors, ...validation.warnings]" :key="message">{{ message }}</p></div>
        </div>

        <GameButton type="submit" block :disabled="!validation.valid">
          洗牌並分配身份
          <template #trailing><ArrowRight :size="20" /></template>
        </GameButton>
        <p class="setup-privacy">身份只會短暫顯示在螢幕上，不會儲存在裝置中。</p>
      </form>
    </div>
  </div>
</template>
