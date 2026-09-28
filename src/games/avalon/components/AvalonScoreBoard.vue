<script setup lang="ts">
import { computed } from 'vue'
import { Check, Shield, Skull, UsersRound, X } from '@lucide/vue'
import type { AvalonGameplayState } from '../types'
import { getMissionTeamSize, getRequiredFails } from '../logic/flow'

const props = defineProps<{ state: AvalonGameplayState; playerCount: number }>()

const completedMissions = computed(() => props.state.proposals.filter((proposal) => proposal.outcome))

function outcomeFor(round: number) {
  return completedMissions.value.find((mission) => mission.round === round)?.outcome
}

function requiresTwoFails(round: number): boolean {
  return getRequiredFails(props.playerCount, round) === 2
}
</script>

<template>
  <aside class="avalon-board" aria-label="阿瓦隆計分板">
    <div class="mission-track" :class="{ 'mission-track--special': playerCount >= 7 }">
      <div
        v-for="round in 5"
        :key="round"
        class="mission-node"
        :class="[
          `mission-node--${outcomeFor(round) ?? 'pending'}`,
          {
            'mission-node--current': state.round === round && !state.winner,
            'mission-node--two-fails': requiresTwoFails(round)
          }
        ]"
        :aria-label="`第 ${round} 回合，${getMissionTeamSize(playerCount, round)} 人${requiresTwoFails(round) ? '，需要兩張失敗牌才會失敗' : ''}`"
      >
        <em v-if="requiresTwoFails(round)"><Skull :size="9" />需 2 敗</em>
        <span>任務 {{ round }}</span>
        <strong>{{ getMissionTeamSize(playerCount, round) }}</strong>
        <small><UsersRound :size="10" />任務人數</small>
        <component v-if="outcomeFor(round)" class="mission-node__status" :is="outcomeFor(round) === 'success' ? Check : X" :size="13" />
      </div>
    </div>
    <div v-if="playerCount >= 7" class="special-mission-note"><Skull :size="17" /><span><strong>第 4 回合</strong>需 <strong>2 張失敗牌</strong>才會失敗</span></div>
    <div class="board-score">
      <span><Shield :size="17" /> 正義 {{ completedMissions.filter((mission) => mission.outcome === 'success').length }}</span>
      <span><Skull :size="17" /> 邪惡 {{ completedMissions.filter((mission) => mission.outcome === 'fail').length }}</span>
    </div>
    <div class="vote-track">
      <span>連續否決</span>
      <div><i v-for="count in 5" :key="count" :class="{ active: count <= state.rejectionCount }">{{ count }}</i></div>
      <small>第 5 次否決，邪惡直接獲勝</small>
    </div>
  </aside>
</template>
