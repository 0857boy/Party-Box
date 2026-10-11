<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Check, Clock3, Layers3, Play, RotateCcw, Sparkles, UsersRound } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import ActionDock from '@/components/game/ActionDock.vue'
import SwipeCard from '@/components/game/SwipeCard.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { useCountdownTimer } from '@/composables/useCountdownTimer'
import { useDeviceTilt } from '@/composables/useDeviceTilt'
import { useLocalRecording } from '@/composables/useLocalRecording'
import { useLandscapeStage } from '@/composables/useLandscapeStage'
import RecordingGallery from '@/components/game/RecordingGallery.vue'
import { loadVersioned, saveVersioned } from '@/utils/storage'
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
  gameRounds,
  guessCurrentCard,
  skipCurrentCard
} from '../stores/session'
import { charadesCategories } from '../data/cards'
import { charadesDifficulties } from '../logic/game'

const router = useRouter()
const game = computed(() => charadesSession.game)
const timer = useCountdownTimer(game.value?.settings.turnSeconds ?? 45, finishTurn)
const playStyle = ref<'forehead' | 'performer'>(loadVersioned('party-box:charades:device', 1, { style: 'forehead' as 'forehead' | 'performer' }).style)
const recordEnabled = ref(false) // Always opt in for this visit; never remember camera consent.
const recordAudio = ref(true)
const countdown = ref(0)
const preparing = ref(false)
const finalizing = ref(false)
const interruption = ref('')
const feedback = ref<'correct' | 'skip' | null>(null)
const recording = useLocalRecording()
const tilt = useDeviceTilt(action => action === 'correct' ? correct() : skip())
const landscape = useLandscapeStage()
let countdownId: number | undefined
let feedbackId: number | undefined
let startToken = 0
let disposed = false
watch(playStyle, style => {
  saveVersioned('party-box:charades:device', 1, { style })
  if (style === 'performer') tilt.disable()
})
const turnScore = computed(() => game.value?.turnGuessedCardIds.length ?? 0)
const quick = computed(() => game.value?.settings.mode === 'quick')
const lastTurn = computed(() => game.value?.turns.at(-1))
const matchComplete = computed(() => quick.value && (game.value?.turns.length ?? 0) >= (game.value?.settings.turnsPerTeam ?? 0) * 2)
const categoryName = computed(() => charadesCategories.find(category => category.id === currentCharadesCard.value?.category)?.name)
const difficultyName = computed(() => charadesDifficulties.find(item => item.id === game.value?.settings.difficulty)?.name)
const step = computed(() => quick.value
  ? `隊伍賽 · 第 ${(game.value?.roundIndex ?? 0) + 1}/${gameRounds.value.length} 次出場`
  : `PARTY CHARADES · ROUND ${currentRound.value?.number}/3`)

function playerName(id: string): string {
  return charadesSession.players.find((player) => player.id === id)?.name ?? ''
}

async function startTurn(): Promise<void> {
  if (preparing.value || countdown.value || game.value?.phase !== 'turn-ready') return
  const token = ++startToken
  interruption.value = ''
  recording.clip.value = null
  recording.message.value = ''
  preparing.value = true
  if (playStyle.value === 'forehead' && tilt.enabled.value) landscape.start()
  if (recordEnabled.value) await recording.prepare(recordAudio.value)
  if (disposed || token !== startToken || document.hidden) return
  preparing.value = false
  countdown.value = 3
  countdownId = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value > 0) return
    window.clearInterval(countdownId)
    countdownId = undefined
    if (document.hidden) { cancelCountdown(); return }
    beginCharadesTurn()
    recording.start(`${currentTeam.value?.name} · ${currentClueGiver.value?.name}`)
    tilt.setActive(playStyle.value === 'forehead' && tilt.enabled.value)
    timer.start()
  }, 1000)
}

function cancelCountdown(): void {
  landscape.stop()
  ++startToken
  if (countdownId !== undefined) window.clearInterval(countdownId)
  countdownId = undefined
  countdown.value = 0
  preparing.value = false
  recordEnabled.value = false
  recording.cancelPreparation()
}

function showFeedback(kind: 'correct' | 'skip'): void {
  feedback.value = kind
  if (feedbackId !== undefined) window.clearTimeout(feedbackId)
  feedbackId = window.setTimeout(() => { feedback.value = null }, 220)
  try { navigator.vibrate?.(kind === 'correct' ? 45 : [30, 45, 30]) } catch { /* Optional hardware feedback. */ }
}

function finishTurn(): void {
  landscape.stop()
  tilt.setActive(false)
  endCharadesTurn()
  void finishRecording()
}

async function finishRecording(): Promise<void> {
  finalizing.value = true
  await recording.stop()
  finalizing.value = false
}

function correct(): void {
  if (!timer.running.value) return
  showFeedback('correct')
  const outcome = guessCurrentCard()
  if (outcome !== 'continue') {
    landscape.stop()
    timer.stop()
    tilt.setActive(false)
    void finishRecording().then(() => {
      if (!disposed && game.value?.phase === 'result') void router.replace({ name: 'charades-result' })
    })
  }
}

function skip(): void {
  if (!timer.running.value) return
  showFeedback('skip')
  const outcome = skipCurrentCard()
  if (outcome === 'turn-ended') { landscape.stop(); timer.stop(); tilt.setActive(false); void finishRecording() }
}

function nextTeam(): void {
  if (finalizing.value) return
  feedback.value = null
  continueAfterTurn()
  if (game.value?.phase === 'result') void router.replace({ name: 'charades-result' })
}

function cardLabels(ids: readonly string[]): string {
  return ids.map(id => game.value?.selectedCards.find(card => card.id === id)?.label).filter(Boolean).join('、') || '沒有'
}

function visibilityChanged(): void {
  if (!document.hidden) return
  if (countdown.value || preparing.value) cancelCountdown()
  if (game.value?.phase === 'playing') {
    interruption.value = '切換 App 或鎖定螢幕，本回合已提前結束。'
    timer.stop()
    finishTurn()
  }
}

onMounted(() => document.addEventListener('visibilitychange', visibilityChanged))
onBeforeUnmount(() => {
  disposed = true
  ++startToken
  if (countdownId !== undefined) window.clearInterval(countdownId)
  if (feedbackId !== undefined) window.clearTimeout(feedbackId)
  document.removeEventListener('visibilitychange', visibilityChanged)
  tilt.setActive(false)
  if (game.value?.phase === 'playing') endCharadesTurn()
})
</script>

<template>
  <div v-if="game && currentRound && currentTeam" class="game-page charades-page charades-play-page" :class="{ 'charades-play-page--live': game.phase === 'playing' || countdown > 0, 'charades-play-page--forehead': playStyle === 'forehead', 'charades-play-page--landscape': landscape.active.value && (game.phase === 'playing' || countdown > 0) }" :style="{ '--stage-rotation': `${landscape.rotation.value}deg` }">
    <template v-if="countdown > 0">
      <main class="charades-countdown" aria-live="assertive"><span class="eyebrow">{{ currentTeam.name }} · {{ currentClueGiver?.name }}</span><p>{{ playStyle === 'forehead' ? '手機橫拿放額頭，螢幕朝隊友' : '提示者看題目，隊友猜答案' }}</p><strong :key="countdown">{{ countdown }}</strong><span>準備開始</span><button type="button" @click="cancelCountdown">取消倒數</button></main>
    </template>
    <template v-else>
    <GameHeader :title="currentRound.name" :step="step" />
    <div class="charades-match-strip page-container page-container--game" aria-label="兩隊目前分數">
      <span v-for="team in charadesSession.teams" :key="team.id" :class="{ active: team.id === currentTeam.id }"><strong>{{ team.name }}</strong><em>{{ totalScore(game.scores.find(score => score.teamId === team.id)!) }}</em></span>
    </div>

    <main v-if="game.phase === 'turn-ready'" class="charades-stage page-container page-container--game">
      <section class="charades-ready-card" :class="`charades-ready-card--${currentTeam.id}`">
        <span class="eyebrow"><UsersRound :size="15" /> {{ currentTeam.name }}的回合</span>
        <div class="charades-clue-giver"><small>{{ playStyle === 'forehead' ? '本次猜題者' : '本次提示者' }}</small><h1>{{ currentClueGiver?.name }}</h1></div>
        <div class="charades-rule-banner"><span>{{ currentRound.number }}</span><div><strong>{{ currentRound.shortRule }}</strong><small>{{ currentRound.instruction }}</small></div></div>
        <div class="charades-ready-stats"><span><Clock3 :size="17" />{{ game.settings.turnSeconds }} 秒</span><span><Layers3 :size="17" />{{ quick ? difficultyName : `剩下 ${cardsRemaining} 張` }}</span></div>
        <div class="charades-device-options">
          <label>手機怎麼拿<select v-model="playStyle" aria-label="手機玩法" :disabled="preparing"><option value="forehead">放額頭 · 隊友提示，我來猜</option><option value="performer">拿手上 · 我來提示，隊友猜</option></select></label>
          <template v-if="playStyle === 'forehead'"><button type="button" class="charades-enable-tilt" :disabled="tilt.pending.value || tilt.enabled.value || preparing" @click="tilt.enable">{{ tilt.enabled.value ? '翻轉已啟用' : tilt.pending.value ? '等待權限…' : '啟用翻轉操作' }}</button><p>手機橫拿。螢幕向下翻＝猜對，向上翻＝跳過；回正即可接下一題。翻轉模式的畫面會固定橫向，仍可用按鈕操作。</p><p v-if="tilt.message.value" role="status">{{ tilt.message.value }}</p></template>
          <label class="charades-record-toggle"><input v-model="recordEnabled" type="checkbox" :disabled="preparing" />錄影本回合（前鏡頭）</label>
          <template v-if="recordEnabled"><label class="charades-record-toggle"><input v-model="recordAudio" type="checkbox" :disabled="preparing" />一併錄製聲音</label><p>會請求相機{{ recordAudio ? '與麥克風' : '' }}權限。請先取得在場朋友同意；只存在此裝置、不上傳。</p></template>
          <p v-if="recording.message.value" role="status">{{ recording.message.value }}</p>
          <small v-if="playStyle === 'forehead'">支援的裝置會震動；iPhone Safari 以色框與文字回饋。</small>
        </div>
        <ActionDock><GameButton block :disabled="preparing" @click="startTurn"><template #icon><Play :size="20" /></template>{{ preparing ? '等待相機權限…' : '開始計時' }}</GameButton><button v-if="preparing" type="button" @click="cancelCountdown">不錄影，取消等待</button><small v-else>先倒數 3 秒，再開始計時</small></ActionDock>
      </section>
    </main>

    <main v-else-if="game.phase === 'playing' && currentCharadesCard" class="charades-live page-container page-container--game">
      <header class="charades-live__header"><button type="button" aria-label="提前結束回合" @click="timer.finish"><ArrowLeft :size="24" /></button><div class="charades-timer-ring" :class="{ 'charades-timer--urgent': timer.secondsLeft.value <= 10 }" :style="{ '--timer-progress': `${timer.progress.value * 360}deg` }" role="timer" :aria-label="`剩餘 ${timer.secondsLeft.value} 秒`"><strong>{{ timer.secondsLeft.value }}</strong><small>秒</small></div><span v-if="recording.recording.value" class="charades-rec" role="status">● REC</span><small v-else>{{ currentTeam.name }}</small></header>
      <SwipeCard :reset-key="currentCharadesCard.id" @left="skip" @right="correct">
        <div class="charades-word-card">
          <span class="charades-word-card__category">{{ categoryName }}</span>
          <h1 :class="{ 'charades-word--long': [...currentCharadesCard.label].length >= 5 }">{{ currentCharadesCard.label }}</h1>
          <small class="sr-only">{{ currentRound.shortRule }}</small>
          <div class="charades-card-score"><span>✓ {{ turnScore }}</span><span>× {{ game.skippedCardIds.length }}</span></div>
        </div>
      </SwipeCard>
      <ActionDock><div class="charades-live-actions">
        <button type="button" class="charades-skip" @click="skip"><ArrowLeft :size="22" /><span>跳過</span></button>
        <button type="button" class="charades-correct" @click="correct"><span>猜對</span><ArrowRight :size="22" /></button>
      </div><p class="charades-swipe-help">{{ playStyle === 'forehead' && tilt.enabled.value ? '向下猜對 · 向上跳過 · 翻完回正' : '左滑跳過 · 右滑猜對 · 跳過不扣分' }}</p></ActionDock>
    </main>

    <main v-else-if="game.phase === 'turn-result'" class="charades-stage page-container page-container--game">
      <section class="phase-panel phase-panel--center charades-turn-result">
        <div class="result-emblem result-emblem--success"><Check :size="42" /></div>
        <span class="eyebrow">TIME'S UP</span>
        <h1>這回合猜對<br /><em>{{ turnScore }} 張</em></h1>
        <p v-if="interruption" role="status">{{ interruption }}</p>
        <p v-if="recording.message.value" role="status">{{ recording.message.value }}</p>
        <details v-if="recording.clip.value" class="charades-turn-words"><summary>回看／分享這回合錄影</summary><RecordingGallery :current="recording.clip.value" /></details>
        <p>{{ quick ? `跳過 ${lastTurn?.skippedCardIds.length ?? 0} 題，不扣分。${matchComplete ? '兩隊都已完成相同次數，準備結算！' : '時間到就交棒，下隊接著挑戰新題。'}` : '跳過與尚未猜中的牌已洗回牌庫，下隊會繼續挑戰。' }}</p>
        <details v-if="lastTurn" class="charades-turn-words"><summary>看看這次的題目</summary><p><strong>猜對：</strong>{{ cardLabels(lastTurn.guessedCardIds) }}</p><p><strong>跳過：</strong>{{ cardLabels(lastTurn.skippedCardIds) }}</p></details>
        <ActionDock><GameButton block :disabled="finalizing" @click="nextTeam">{{ finalizing ? '正在儲存影片…' : matchComplete ? '查看最終結果' : '換下一隊' }}<template #trailing><ArrowRight :size="19" /></template></GameButton></ActionDock>
      </section>
    </main>

    <main v-else-if="game.phase === 'round-result'" class="charades-stage page-container page-container--game">
      <section class="phase-panel phase-panel--center charades-round-result">
        <span class="eyebrow"><Sparkles :size="15" /> ROUND {{ currentRound.number }} COMPLETE</span>
        <h1><em>{{ currentRound.name }}</em><br />完成</h1>
        <p>同一副牌即將重新洗牌。大家已經看過答案，下一輪會更快、更荒謬。</p>
        <p v-if="recording.message.value" role="status">{{ recording.message.value }}</p>
        <details v-if="recording.clip.value" class="charades-turn-words"><summary>回看／分享這回合錄影</summary><RecordingGallery :current="recording.clip.value" /></details>
        <div class="charades-score-cards">
          <article v-for="team in charadesSession.teams" :key="team.id" :class="`charades-score-card--${team.id}`"><span>{{ team.name }}</span><strong>{{ totalScore(game.scores.find((score) => score.teamId === team.id)!) }}</strong><small>{{ team.playerIds.map(playerName).join('、') }}</small></article>
        </div>
        <ActionDock><GameButton block :disabled="finalizing" @click="beginNextRound"><template #icon><RotateCcw :size="19" /></template>進入第 {{ currentRound.number + 1 }} 輪</GameButton></ActionDock>
      </section>
    </main>
    </template>
    <div v-if="feedback && game.phase === 'playing'" class="charades-feedback" :class="`charades-feedback--${feedback}`" role="status"><span>{{ feedback === 'correct' ? '✓ 猜對 +1' : '× 跳過' }}</span></div>
  </div>
</template>
