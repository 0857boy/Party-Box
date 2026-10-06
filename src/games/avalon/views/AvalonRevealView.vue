<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Check, EyeOff, Info, ShieldCheck } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import ActionDock from '@/components/game/ActionDock.vue'
import HoldToReveal from '@/components/game/HoldToReveal.vue'
import PassDevice from '@/components/game/PassDevice.vue'
import RoleCard from '@/components/game/RoleCard.vue'
import GameButton from '@/components/ui/GameButton.vue'
import PlayerChip from '@/components/player/PlayerChip.vue'
import { getAvalonRoleCard } from '../data/cardPresentation'
import { getRoleInformation } from '../logic/game'
import { avalonSession, currentPlayer } from '../stores/session'

type Stage = 'pass' | 'hold' | 'revealed'
const stage = ref<Stage>('pass')
const router = useRouter()

const information = computed(() => currentPlayer.value ? getRoleInformation(currentPlayer.value, avalonSession.players) : null)
const visiblePlayers = computed(() => {
  const ids = new Set(information.value?.visiblePlayerIds ?? [])
  return avalonSession.players.filter((player) => ids.has(player.id))
})
const currentNumber = computed(() => avalonSession.currentRevealIndex + 1)
const isLast = computed(() => avalonSession.currentRevealIndex === avalonSession.players.length - 1)
const card = computed(() => currentPlayer.value ? getAvalonRoleCard(currentPlayer.value.role) : undefined)

function hideAndContinue(): void {
  stage.value = 'pass'
  if (isLast.value) {
    void router.replace({ name: 'avalon-ready' })
    return
  }
  avalonSession.currentRevealIndex += 1
}
</script>

<template>
  <div class="game-page reveal-page">
    <GameHeader title="身份分配" :step="`AVALON · ${currentNumber}/${avalonSession.players.length}`" />
    <main v-if="currentPlayer" class="reveal-main page-container page-container--game">
      <Transition name="reveal-stage" mode="out-in">
        <PassDevice
          v-if="stage === 'pass'"
          :key="`pass-${currentPlayer.id}`"
          :player-name="currentPlayer.name"
          :current="currentNumber"
          :total="avalonSession.players.length"
          @ready="stage = 'hold'"
        />
        <section v-else :key="`reveal-${currentPlayer.id}`" class="identity-layout" :class="{ 'identity-layout--revealed': stage === 'revealed' }">
          <div class="identity-card-area">
            <div class="identity-owner"><span>現在查看</span><strong>{{ currentPlayer.name }}</strong></div>
            <RoleCard :card="card" :revealed="stage === 'revealed'" />
            <ActionDock v-if="stage === 'hold'"><HoldToReveal @revealed="stage = 'revealed'" /></ActionDock>
          </div>
          <Transition name="role-info">
            <div v-if="stage === 'revealed' && information" class="identity-info">
              <div class="identity-current-player"><span>現在查看</span><strong>{{ currentPlayer.name }}</strong></div>
              <span class="eyebrow"><ShieldCheck :size="15" /> PRIVATE INFORMATION</span>
              <div class="identity-heading"><div v-if="card" class="identity-portrait" role="img" :aria-label="card.imageAlt" :style="{ backgroundImage: `url(${card.imageUrl})`, backgroundPosition: card.imagePosition ?? 'center' }" /><h1>你是<br /><em>{{ currentPlayer.role.displayName }}</em></h1></div>
              <p class="ability-copy">{{ currentPlayer.role.ability }}</p>
              <div class="intel-box">
                <header><Info :size="18" /><strong>{{ information.title }}</strong></header>
                <p>{{ information.summary }}</p>
                <div v-if="visiblePlayers.length" class="intel-players">
                  <PlayerChip v-for="player in visiblePlayers" :key="player.id" :name="player.name" />
                </div>
                <span v-else class="no-intel">沒有玩家名單</span>
                <small v-if="information.ambiguity">{{ information.ambiguity }}</small>
              </div>
              <details class="identity-details"><summary>角色能力與說明</summary><p class="ability-copy">{{ currentPlayer.role.ability }}</p></details>
              <ActionDock><div class="hide-warning"><EyeOff :size="18" /><span>記住身份與名單後，交給下一位。</span></div>
              <GameButton block @click="hideAndContinue">
                <template #icon><Check :size="20" /></template>
                {{ isLast ? '我看完了，開始遊戲' : '我看完了，交給下一位' }}
              </GameButton></ActionDock>
            </div>
          </Transition>
        </section>
      </Transition>
    </main>
  </div>
</template>
