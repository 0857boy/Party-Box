<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Fingerprint, Home, RotateCcw, Tag, Trophy, UsersRound } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { categoryName, resetUndercoverSession, startUndercoverGame, undercoverSession } from '../stores/session'

const router = useRouter()
const game = computed(() => undercoverSession.gameplay)

function replay(): void {
  startUndercoverGame()
  void router.replace({ name: 'undercover-reveal' })
}

function goHome(): void {
  resetUndercoverSession()
  void router.push({ name: 'home' })
}
</script>

<template>
  <div v-if="game" class="game-page undercover-page result-page">
    <GameHeader title="遊戲復盤" step="UNDERCOVER · GAME OVER" />
    <main class="result-content page-container page-container--game">
      <section class="winner-hero undercover-winner-hero" :class="`winner-hero--${game.winner === 'civilian' ? 'good' : 'evil'}`">
        <div class="winner-hero__icon"><UsersRound v-if="game.winner === 'civilian'" :size="46" /><Fingerprint v-else :size="46" /></div>
        <span class="eyebrow"><Trophy :size="15" /> MYSTERY SOLVED</span>
        <h1><em>{{ game.winner === 'civilian' ? '平民' : '臥底' }}</em>陣營獲勝</h1>
        <p>{{ game.winReason }}</p>
      </section>

      <section class="undercover-word-reveal">
        <header><Tag :size="22" /><div><small>{{ categoryName(game.category) }}</small><h2>本局詞語</h2></div></header>
        <div><article><span>平民詞</span><strong>{{ game.civilianWord }}</strong></article><article><span>臥底詞</span><strong>{{ game.undercoverWord }}</strong></article></div>
      </section>

      <section class="review-section">
        <header><span>01</span><div><small>IDENTITY REVIEW</small><h2>身份揭曉</h2></div></header>
        <div class="undercover-role-review">
          <article v-for="player in undercoverSession.players" :key="player.id" :class="`undercover-role-review--${player.role}`"><span><Fingerprint v-if="player.role === 'undercover'" :size="20" /><UsersRound v-else :size="20" /></span><div><strong>{{ player.name }}</strong><small>{{ player.role === 'undercover' ? '臥底' : '平民' }} · {{ player.word }}</small></div><em>{{ player.alive ? '存活' : `第 ${game.eliminations.find((item) => item.playerId === player.id)?.round} 輪淘汰` }}</em></article>
        </div>
      </section>

      <section class="review-section">
        <header><span>02</span><div><small>ELIMINATION TIMELINE</small><h2>淘汰紀錄</h2></div></header>
        <div class="undercover-timeline"><div v-for="record in game.eliminations" :key="record.playerId"><span>第 {{ record.round }} 輪</span><strong>{{ undercoverSession.players.find((player) => player.id === record.playerId)?.name }}</strong><em>{{ record.role === 'undercover' ? '臥底' : '平民' }}</em></div></div>
      </section>

      <div class="result-actions"><GameButton block @click="replay"><template #icon><RotateCcw :size="19" /></template>使用相同設定再玩一次</GameButton><GameButton block variant="secondary" @click="goHome"><template #icon><Home :size="19" /></template>回 Party Box</GameButton></div>
    </main>
  </div>
</template>
