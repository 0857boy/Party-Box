<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, ArrowRight, Check, HelpCircle, Palette, RotateCcw, UsersRound, Vote, X } from '@lucide/vue'
import DrawingCanvas from '@/components/game/DrawingCanvas.vue'
import GameHeader from '@/components/game/GameHeader.vue'
import PassDevice from '@/components/game/PassDevice.vue'
import GameButton from '@/components/ui/GameButton.vue'
import type { DrawingPoint } from '@/types/drawing'
import {
  adjudicateFakeArtistGuess,
  beginDrawingTurn,
  beginFakeArtistGuess,
  currentDrawingPass,
  currentDrawingPlayer,
  fakeArtistPlayer,
  fakeArtistSession,
  resolveFakeArtistVote,
  selectFakeArtistSuspect,
  startNextFakeArtistRound,
  submitFakeArtistGuess,
  submitFakeArtistStroke
} from '../stores/session'

const router = useRouter()
const game = computed(() => fakeArtistSession.game)
const draft = ref<DrawingPoint[] | null>(null)
const guess = ref('')
const totalDrawSteps = computed(() => fakeArtistSession.players.length * 2)

const title = computed(() => {
  switch (game.value?.phase) {
    case 'draw-pass': case 'drawing': return `共同作畫 · 第 ${currentDrawingPass.value} 輪`
    case 'vote': return '同步指認'
    case 'guess-pass': case 'guess': return '假畫家反猜'
    case 'adjudicate': return '判定答案'
    default: return '本輪結果'
  }
})

function submitStroke(): void {
  if (!draft.value?.length) return
  submitFakeArtistStroke(draft.value)
  draft.value = null
  navigator.vibrate?.(35)
}

function chooseSuspect(playerId?: string): void {
  selectFakeArtistSuspect(playerId)
}

function resolveVote(): void {
  resolveFakeArtistVote()
  routeIfFinished()
}

function submitGuess(): void {
  if (!guess.value.trim()) return
  submitFakeArtistGuess(guess.value)
}

function adjudicate(correct: boolean): void {
  adjudicateFakeArtistGuess(correct)
  routeIfFinished()
}

function nextRound(): void {
  startNextFakeArtistRound()
  void router.replace({ name: 'fake-artist-reveal' })
}

function routeIfFinished(): void {
  if (game.value?.phase === 'result') void router.replace({ name: 'fake-artist-result' })
}
</script>

<template>
  <div v-if="game" class="game-page fake-artist-page fake-artist-play-page">
    <GameHeader :title="title" :step="`FAKE ARTIST · ROUND ${game.round}`" />

    <main v-if="game.phase === 'draw-pass' && currentDrawingPlayer" class="page-container page-container--game fake-pass-stage">
      <PassDevice :player-name="currentDrawingPlayer.name" :current="game.drawStep + 1" :total="totalDrawSteps" :message="`第 ${currentDrawingPass} 輪，每位玩家只能畫一條不間斷的線。`" privacy-text="接過裝置後就能看到共同畫布" @ready="beginDrawingTurn" />
    </main>

    <main v-else-if="game.phase === 'drawing' && currentDrawingPlayer" class="fake-drawing-layout page-container page-container--game">
      <header class="fake-drawing-status"><div><span :style="{ background: currentDrawingPlayer.color }" /><small>現在作畫</small><strong>{{ currentDrawingPlayer.name }}</strong></div><p>第 {{ currentDrawingPass }} 輪 · 第 {{ (game.drawStep % fakeArtistSession.players.length) + 1 }} 位</p></header>
      <DrawingCanvas :key="game.drawStep" :strokes="game.strokes" :color="currentDrawingPlayer.color" @stroke-change="draft = $event" />
      <div class="fake-drawing-rule"><AlertTriangle :size="18" /><span>只能畫一筆；手指離開畫布後可以重畫，確認送出後就不能修改。</span></div>
      <GameButton block :disabled="!draft?.length" @click="submitStroke"><template #icon><Check :size="19" /></template>送出這一筆<template #trailing><ArrowRight :size="19" /></template></GameButton>
    </main>

    <main v-else-if="game.phase === 'vote'" class="fake-vote-layout page-container page-container--game">
      <section class="fake-vote-canvas"><DrawingCanvas :strokes="game.strokes" color="#111111" disabled /></section>
      <section class="phase-panel">
        <span class="eyebrow"><Vote :size="15" /> 3, 2, 1, POINT!</span>
        <h1>誰是<br /><em>假畫家？</em></h1>
        <p>所有人先在現實中同時指出一人，再由持機者登記唯一最高票。若最高票不只一人，請選平票。</p>
        <div class="fake-suspect-grid"><button v-for="player in fakeArtistSession.players" :key="player.id" type="button" :class="{ active: game.selectedSuspectId === player.id && !game.tiedVote }" @click="chooseSuspect(player.id)"><span :style="{ background: player.color }" /><strong>{{ player.name }}</strong><Check v-if="game.selectedSuspectId === player.id && !game.tiedVote" :size="18" /></button></div>
        <button type="button" class="fake-tie-button" :class="{ active: game.tiedVote }" @click="chooseSuspect(undefined)"><UsersRound :size="19" /><span><strong>最高票平票／沒有共識</strong><small>依原規則，平票視為假畫家沒有被抓到</small></span></button>
        <GameButton block :disabled="!game.selectedSuspectId && !game.tiedVote" @click="resolveVote">確認指認結果</GameButton>
      </section>
    </main>

    <main v-else-if="game.phase === 'guess-pass' && fakeArtistPlayer" class="page-container page-container--game fake-pass-stage">
      <PassDevice :player-name="fakeArtistPlayer.name" :current="1" :total="1" message="你被抓到了，但還有一次猜中共同題目的翻盤機會。" privacy-text="其他玩家請不要提示答案" @ready="beginFakeArtistGuess" />
    </main>

    <main v-else-if="game.phase === 'guess' && fakeArtistPlayer" class="fake-guess-layout page-container page-container--game">
      <section><span class="eyebrow"><HelpCircle :size="15" /> ONE LAST GUESS</span><h1>{{ fakeArtistPlayer.name }}，<br /><em>你猜畫的是什麼？</em></h1><p>類別是「{{ game.prompt.categoryName }}」。只能提交一次，其他玩家不可以給提示。</p><label><span>輸入你的答案</span><input v-model.trim="guess" type="text" maxlength="24" autocomplete="off" autofocus @keyup.enter="submitGuess" /></label><GameButton block :disabled="!guess.trim()" @click="submitGuess">鎖定答案<template #trailing><ArrowRight :size="19" /></template></GameButton></section>
      <DrawingCanvas :strokes="game.strokes" color="#111111" disabled />
    </main>

    <main v-else-if="game.phase === 'adjudicate'" class="fake-adjudicate page-container page-container--game">
      <section class="phase-panel phase-panel--center">
        <span class="eyebrow"><Palette :size="15" /> REVEAL THE ANSWER</span><h1>假畫家猜<br /><em>「{{ game.fakeGuess }}」</em></h1><div class="fake-answer-reveal"><small>真正題目</small><strong>{{ game.prompt.answer }}</strong><span>類別 · {{ game.prompt.categoryName }}</span></div><p>若是同義詞、俗稱或合理答案，請由全桌共同判定。</p><div class="modal-actions"><GameButton variant="danger" @click="adjudicate(false)"><template #icon><X :size="18" /></template>猜錯了</GameButton><GameButton @click="adjudicate(true)"><template #icon><Check :size="18" /></template>算猜對</GameButton></div>
      </section>
    </main>

    <main v-else-if="game.phase === 'round-result' && game.roundWinner" class="charades-stage page-container page-container--game">
      <section class="phase-panel phase-panel--center fake-round-result">
        <div class="result-emblem" :class="game.roundWinner === 'artists' ? 'result-emblem--success' : 'result-emblem--fail'"><Palette v-if="game.roundWinner === 'artists'" :size="42" /><HelpCircle v-else :size="42" /></div><span class="eyebrow">ROUND {{ game.round }} COMPLETE</span><h1><em>{{ game.roundWinner === 'artists' ? '真正畫家' : '假畫家' }}</em><br />本輪獲勝</h1><p>{{ game.roundReason }}</p><div class="fake-score-strip"><span v-for="player in [...fakeArtistSession.players].sort((a, b) => b.score - a.score)" :key="player.id"><i :style="{ background: player.color }" /><strong>{{ player.name }}</strong><em>{{ player.score }}</em></span></div><GameButton block @click="nextRound"><template #icon><RotateCcw :size="19" /></template>開始下一輪</GameButton>
      </section>
    </main>
  </div>
</template>
