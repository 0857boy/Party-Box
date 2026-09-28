<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Check, Crown, Home, RotateCcw, Shield, Skull, Sparkles, Target, ThumbsDown, ThumbsUp, UsersRound, X } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { getAvalonRoleCard } from '../data/cardPresentation'
import { avalonSession, resetAvalonSession, startAvalonGame } from '../stores/session'
import type { AssignedPlayer } from '../types'

const router = useRouter()
const game = computed(() => avalonSession.gameplay)
const assassinationTarget = computed(() => avalonSession.players.find((player) => player.id === game.value?.assassinationTargetId))

function playerById(id: string): AssignedPlayer | undefined {
  return avalonSession.players.find((player) => player.id === id)
}

function replay(): void {
  startAvalonGame()
  void router.replace({ name: 'avalon-reveal' })
}

function goHome(): void {
  resetAvalonSession()
  void router.push({ name: 'home' })
}
</script>

<template>
  <div v-if="game" class="game-page result-page">
    <GameHeader title="遊戲復盤" step="AVALON · GAME OVER" />
    <main class="result-content page-container page-container--game">
      <section class="winner-hero" :class="`winner-hero--${game.winner}`">
        <div class="winner-hero__icon"><Shield v-if="game.winner === 'good'" :size="46" /><Skull v-else :size="46" /></div>
        <span class="eyebrow">THE QUEST IS OVER</span>
        <h1><em>{{ game.winner === 'good' ? '正義' : '邪惡' }}</em>陣營獲勝</h1>
        <p>{{ game.winReason }}</p>
        <small>本局復盤已儲存在此裝置</small>
      </section>

      <section v-if="game.assassinationTargetId" class="assassination-review">
        <Target :size="23" />
        <div><span>最終刺殺</span><strong>{{ assassinationTarget?.name }} · {{ assassinationTarget?.role.displayName }}</strong></div>
        <component :is="assassinationTarget?.role.id === 'merlin' ? Check : X" :size="23" />
      </section>

      <section class="review-section">
        <header><span>01</span><div><small>IDENTITY REVIEW</small><h2>身份揭曉</h2></div></header>
        <div class="role-review-grid">
          <article v-for="(player, index) in avalonSession.players" :key="player.id" class="role-review-card" :class="`role-review-card--${player.role.team}`">
            <div class="role-review-card__art" :style="{ backgroundImage: `url(${getAvalonRoleCard(player.role).imageUrl})`, backgroundPosition: player.role.atlasPosition }" />
            <div class="role-review-card__copy">
              <span>{{ String(index + 1).padStart(2, '0') }} · {{ player.role.team === 'good' ? '正義' : '邪惡' }}</span>
              <h3>{{ player.name }}</h3>
              <strong>{{ player.role.displayName }}</strong>
              <p>{{ player.role.ability }}</p>
            </div>
          </article>
        </div>
      </section>

      <section class="review-section">
        <header><span>02</span><div><small>MISSION TIMELINE</small><h2>任務與投票紀錄</h2></div></header>
        <div class="timeline-list">
          <article v-for="(proposal, index) in game.proposals" :key="index" class="timeline-card">
            <div class="timeline-card__marker" :class="proposal.outcome ? `marker--${proposal.outcome}` : 'marker--rejected'">
              <Shield v-if="proposal.outcome === 'success'" :size="20" />
              <Skull v-else-if="proposal.outcome === 'fail'" :size="20" />
              <ThumbsDown v-else :size="20" />
            </div>
            <div class="timeline-card__body">
              <header><span>第 {{ proposal.round }} 回合 · 提案 {{ index + 1 }}</span><strong>{{ proposal.outcome === 'success' ? '任務成功' : proposal.outcome === 'fail' ? '任務失敗' : '隊伍遭否決' }}</strong></header>
              <p><Crown :size="14" /> 領袖 {{ playerById(proposal.leaderId)?.name }}</p>
              <div class="timeline-team"><UsersRound :size="15" /><span v-for="playerId in proposal.teamPlayerIds" :key="playerId">{{ playerById(playerId)?.name }}</span></div>
              <div class="timeline-votes"><span><component :is="proposal.approved ? ThumbsUp : ThumbsDown" :size="14" /> 實體表決{{ proposal.approved ? '通過' : '否決' }}</span><span v-if="proposal.missionChoices"><Shield :size="14" /> {{ proposal.missionChoices.filter((choice) => choice === 'success').length }}</span><span v-if="proposal.missionChoices"><Skull :size="14" /> {{ proposal.missionChoices.filter((choice) => choice === 'fail').length }}</span></div>
            </div>
          </article>
        </div>
      </section>

      <section v-if="game.ladyHistory.length" class="review-section">
        <header><span>03</span><div><small>LADY OF THE LAKE</small><h2>忠誠檢視紀錄</h2></div></header>
        <div class="lady-history">
          <div v-for="inspection in game.ladyHistory" :key="inspection.round"><Sparkles :size="17" /><span>第 {{ inspection.round }} 回合</span><strong>{{ playerById(inspection.holderId)?.name }}</strong><small>檢視</small><strong>{{ playerById(inspection.targetId)?.name }}</strong><em>{{ inspection.seenTeam === 'good' ? '正義' : '邪惡' }}</em></div>
        </div>
      </section>

      <div class="result-actions">
        <GameButton block @click="replay"><template #icon><RotateCcw :size="19" /></template>使用相同設定再玩一次</GameButton>
        <GameButton block variant="secondary" @click="goHome"><template #icon><Home :size="19" /></template>回 Party Box</GameButton>
      </div>
    </main>
  </div>
</template>
