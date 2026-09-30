<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Check, Clock3, Layers3, Play, RotateCcw, Sparkles, UsersRound } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import SwipeCard from '@/components/game/SwipeCard.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { useCountdownTimer } from '@/composables/useCountdownTimer'
import { totalScore } from '@/engine/scoreManager'
import {
  beginCharadesTurn,
  beginNextRound,
  cardsRemaining,
  charadesSession,
  continueAfterTurn,
  currentCharadesCard,
  currentClueGiver,
  currentRound,
  currentTeam,
  endCharadesTurn,
  guessCurrentCard,
  skipCurrentCard
} from '../stores/session'

const router = useRouter()
const game = computed(() => charadesSession.game)
const timer = useCountdownTimer(charadesSession.setup.turnSeconds, () => endCharadesTurn())
const timerText = computed(() => `${String(Math.floor(timer.secondsLeft.value / 60)).padStart(2, '0')}:${String(timer.secondsLeft.value % 60).padStart(2, '0')}`)
const turnScore = computed(() => game.value?.turnGuessedCardIds.length ?? 0)

function playerName(id: string): string {
  return charadesSession.players.find((player) => player.id === id)?.name ?? ''
}

function startTurn(): void {
  beginCharadesTurn()
  void nextTick(() => timer.start())
}

function correct(): void {
  const outcome = guessCurrentCard()
  navigator.vibrate?.(35)
  if (outcome !== 'continue') timer.stop()
  if (game.value?.phase === 'result') void router.replace({ name: 'charades-result' })
}

function skip(): void {
  const outcome = skipCurrentCard()
  if (outcome === 'turn-ended') timer.stop()
}
</script>

<template>
  <div v-if="game && currentRound && currentTeam" class="game-page charades-page charades-play-page">
    <GameHeader :title="currentRound.name" :step="`PARTY CHARADES · ROUND ${currentRound.number}/3`" />

    <main v-if="game.phase === 'turn-ready'" class="charades-stage page-container page-container--game">
      <section class="charades-ready-card" :class="`charades-ready-card--${currentTeam.id}`">
        <span class="eyebrow"><UsersRound :size="15" /> {{ currentTeam.name }}的回合</span>
        <div class="charades-clue-giver"><small>本次提示者</small><h1>{{ currentClueGiver?.name }}</h1></div>
        <div class="charades-rule-banner"><span>{{ currentRound.number }}</span><div><strong>{{ currentRound.shortRule }}</strong><small>{{ currentRound.instruction }}</small></div></div>
        <div class="charades-ready-stats"><span><Clock3 :size="17" />{{ charadesSession.setup.turnSeconds }} 秒</span><span><Layers3 :size="17" />剩下 {{ cardsRemaining }} 張</span></div>
        <p>把手機交給提示者並讓隊友看得到畫面。準備好後立即開始倒數。</p>
        <GameButton block @click="startTurn"><template #icon><Play :size="20" /></template>開始計時</GameButton>
      </section>
    </main>

    <main v-else-if="game.phase === 'playing' && currentCharadesCard" class="charades-live page-container page-container--game">
      <header class="charades-live__header">
        <div class="charades-timer" :class="{ 'charades-timer--urgent': timer.secondsLeft.value <= 10 }"><Clock3 :size="20" /><strong>{{ timerText }}</strong><span>剩餘時間</span></div>
        <div class="charades-live-score"><small>{{ currentTeam.name }}</small><strong>+{{ turnScore }}</strong></div>
      </header>
      <div class="charades-progress"><span :style="{ width: `${timer.progress.value * 100}%` }" /></div>
      <SwipeCard :key="currentCharadesCard.id" @left="skip" @right="correct">
        <div class="charades-word-card">
          <span class="charades-word-card__category">{{ currentCharadesCard.category === 'characters' ? '人物角色' : currentCharadesCard.category === 'life' ? '生活鬧劇' : '物品食物' }}</span>
          <strong aria-hidden="true">{{ currentCharadesCard.emoji }}</strong>
          <h1>{{ currentCharadesCard.label }}</h1>
          <small>{{ currentRound.shortRule }}</small>
        </div>
      </SwipeCard>
      <div class="charades-live-actions">
        <button type="button" class="charades-skip" @click="skip"><ArrowLeft :size="22" /><span>跳過</span></button>
        <button type="button" class="charades-correct" @click="correct"><span>猜對</span><ArrowRight :size="22" /></button>
      </div>
      <p class="charades-swipe-help">也可以向左滑跳過、向右滑猜對</p>
    </main>

    <main v-else-if="game.phase === 'turn-result'" class="charades-stage page-container page-container--game">
      <section class="phase-panel phase-panel--center charades-turn-result">
        <div class="result-emblem result-emblem--success"><Check :size="42" /></div>
        <span class="eyebrow">TIME'S UP</span>
        <h1>這回合猜對<br /><em>{{ turnScore }} 張</em></h1>
        <p>跳過與尚未猜中的牌已洗回牌庫，下隊會繼續挑戰。</p>
        <GameButton block @click="continueAfterTurn">換下一隊<template #trailing><ArrowRight :size="19" /></template></GameButton>
      </section>
    </main>

    <main v-else-if="game.phase === 'round-result'" class="charades-stage page-container page-container--game">
      <section class="phase-panel phase-panel--center charades-round-result">
        <span class="eyebrow"><Sparkles :size="15" /> ROUND {{ currentRound.number }} COMPLETE</span>
        <h1><em>{{ currentRound.name }}</em><br />完成</h1>
        <p>同一副牌即將重新洗牌。大家已經看過答案，下一輪會更快、更荒謬。</p>
        <div class="charades-score-cards">
          <article v-for="team in charadesSession.teams" :key="team.id" :class="`charades-score-card--${team.id}`"><span>{{ team.name }}</span><strong>{{ totalScore(game.scores.find((score) => score.teamId === team.id)!) }}</strong><small>{{ team.playerIds.map(playerName).join('、') }}</small></article>
        </div>
        <GameButton block @click="beginNextRound"><template #icon><RotateCcw :size="19" /></template>進入第 {{ currentRound.number + 1 }} 輪</GameButton>
      </section>
    </main>
  </div>
</template>
