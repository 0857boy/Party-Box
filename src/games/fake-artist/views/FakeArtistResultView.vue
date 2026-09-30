<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Home, Palette, RotateCcw, Trophy } from '@lucide/vue'
import DrawingCanvas from '@/components/game/DrawingCanvas.vue'
import GameHeader from '@/components/game/GameHeader.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { fakeArtistSession, resetFakeArtistSession, startFakeArtistGame } from '../stores/session'

const router = useRouter()
const game = computed(() => fakeArtistSession.game)
const rankedPlayers = computed(() => [...fakeArtistSession.players].sort((a, b) => b.score - a.score))
const bestScore = computed(() => rankedPlayers.value[0]?.score ?? 0)
const winners = computed(() => rankedPlayers.value.filter((player) => player.score === bestScore.value))
const winnerTitle = computed(() => winners.value.length > 2 ? '真正畫家陣營' : winners.value.map((player) => player.name).join('、'))

function playerName(id?: string): string {
  return fakeArtistSession.players.find((player) => player.id === id)?.name ?? '平票'
}

function replay(): void {
  startFakeArtistGame()
  void router.replace({ name: 'fake-artist-reveal' })
}

function home(): void {
  resetFakeArtistSession()
  void router.push({ name: 'home' })
}
</script>

<template>
  <div v-if="game" class="game-page fake-artist-page result-page">
    <GameHeader title="最終結果" step="FAKE ARTIST · GAME OVER" />
    <main class="result-content page-container page-container--game">
      <section class="winner-hero fake-artist-winner-hero"><div class="winner-hero__icon"><Trophy :size="46" /></div><span class="eyebrow"><Palette :size="15" /> EXHIBITION COMPLETE</span><h1><em>{{ winnerTitle }}</em><br />獲勝</h1><p>{{ winners.length > 2 ? `${winners.map((player) => player.name).join('、')}共同守住了題目。` : `以 ${bestScore} 分成為今晚最會畫、也最會演的人。` }}</p></section>

      <section class="review-section"><header><span>01</span><div><small>FINAL SCORE</small><h2>玩家得分</h2></div></header><div class="fake-final-scores"><article v-for="(player, index) in rankedPlayers" :key="player.id"><span>{{ index + 1 }}</span><i :style="{ background: player.color }" /><strong>{{ player.name }}</strong><em>{{ player.score }} 分</em></article></div></section>

      <section class="review-section"><header><span>02</span><div><small>GALLERY REVIEW</small><h2>畫作復盤</h2></div></header><div class="fake-gallery"><article v-for="record in game.history" :key="record.round"><DrawingCanvas :strokes="record.strokes" color="#111111" disabled /><div><span>第 {{ record.round }} 輪 · {{ record.categoryName }}</span><h3>{{ record.answer }}</h3><p>假畫家：<strong>{{ playerName(record.fakePlayerId) }}</strong> · 指認：{{ record.tiedVote ? '平票' : playerName(record.suspectedPlayerId) }}</p><small>{{ record.reason }}</small></div></article></div></section>

      <div class="result-actions"><GameButton block @click="replay"><template #icon><RotateCcw :size="19" /></template>相同設定再玩一次</GameButton><GameButton block variant="secondary" @click="home"><template #icon><Home :size="19" /></template>回 Party Box</GameButton></div>
    </main>
  </div>
</template>
