<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Check, EyeOff, Radio, RotateCcw, Sparkles, Target, Trophy } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import HoldToReveal from '@/components/game/HoldToReveal.vue'
import PassDevice from '@/components/game/PassDevice.vue'
import GameButton from '@/components/ui/GameButton.vue'
import SpectrumDial from '../components/SpectrumDial.vue'
import { isWavelengthGameOver } from '../logic/game'
import {
  beginWavelengthPeek,
  chooseWavelengthDirection,
  currentClueGiver,
  finishWavelengthPeek,
  lockWavelengthGuess,
  nextWavelengthRound,
  revealWavelengthTarget,
  submitWavelengthClue,
  updateWavelengthGuess,
  wavelengthSession
} from '../stores/session'

const router = useRouter()
const game = computed(() => wavelengthSession.game)
const clueDraft = ref('')
const privateOpen = ref(false)
const activeName = computed(() => game.value?.mode === 'co-op' ? '大家' : game.value?.teamNames[game.value.round.activeTeam])
const opponentName = computed(() => game.value?.teamNames[game.value.round.activeTeam === 0 ? 1 : 0])
const heading = computed(() => {
  switch (game.value?.phase) {
    case 'pass': case 'peek': return '秘密目標'
    case 'clue': return '給出線索'
    case 'discuss': return '討論並調整指針'
    case 'opponent': return '另一隊猜方向'
    case 'reveal': return '揭曉目標'
    default: return '最終結果'
  }
})

function sendClue(): void {
  if (!clueDraft.value.trim()) return
  submitWavelengthClue(clueDraft.value)
  clueDraft.value = ''
}

function nextRound(): void {
  nextWavelengthRound()
  privateOpen.value = false
}

function restart(): void {
  wavelengthSession.game = null
  void router.replace({ name: 'wavelength-setup' })
}
</script>

<template>
  <div v-if="game" class="game-page wavelength-page">
    <GameHeader :title="heading" :step="`SAME FREQUENCY · ${game.phase === 'finished' ? 'FINALE' : `ROUND ${game.round.number}`}`" />

    <main v-if="game.phase === 'pass' && currentClueGiver" class="wavelength-centered page-container page-container--game">
      <PassDevice :player-name="currentClueGiver.name" :current="game.round.number" :total="game.mode === 'co-op' ? 6 : game.round.number" :progress-text="`第 ${game.round.number} 回合`" :message="`${activeName}的提示者將私下查看目標。其他人先別看螢幕。`" privacy-text="看完目標後，畫面會先隱藏再交回桌中央" @ready="beginWavelengthPeek" />
    </main>

    <main v-else-if="game.phase === 'peek'" class="wavelength-stage page-container page-container--game">
      <div class="wavelength-kicker"><EyeOff :size="17" /> 只有 {{ currentClueGiver?.name }} 可以看</div>
      <h1>先看位置，<em>再想一個好例子。</em></h1>
      <p class="wavelength-helper">提示者看完後交回裝置，其他玩家就可以一起討論。</p>
      <section class="wavelength-instrument wavelength-instrument--private">
        <div class="wavelength-spectrum-title"><span>{{ game.round.card.category }}</span><strong>{{ game.round.card.left }} <i>↔</i> {{ game.round.card.right }}</strong></div>
        <SpectrumDial :reveal="privateOpen" :target="game.round.target" :show-guess="false" />
        <div class="wavelength-scale"><strong>{{ game.round.card.left }}</strong><strong>{{ game.round.card.right }}</strong></div>
        <div v-if="privateOpen" class="wavelength-target-readout"><Target :size="19" /> 目標就在亮色區域中央</div>
        <div v-else class="wavelength-hidden"><EyeOff :size="18" /> 目標已遮住</div>
      </section>
      <HoldToReveal v-if="!privateOpen" label="按住查看目標" @revealed="privateOpen = true" />
      <GameButton v-else block @click="privateOpen = false; finishWavelengthPeek()"><template #icon><EyeOff :size="19" /></template>我記住了，隱藏目標</GameButton>
    </main>

    <main v-else-if="game.phase === 'clue'" class="wavelength-stage page-container page-container--game">
      <span class="eyebrow"><Sparkles :size="16" /> ONE CLUE, MANY OPINIONS</span>
      <h1>把你的感覺，<em>交給大家。</em></h1>
      <section class="wavelength-clue-card"><small>本回合光譜</small><strong>{{ game.round.card.left }} <span>↔</span> {{ game.round.card.right }}</strong></section>
      <form class="wavelength-clue-form" @submit.prevent="sendClue"><label for="wavelength-clue">你的線索</label><input id="wavelength-clue" v-model.trim="clueDraft" maxlength="50" autocomplete="off" placeholder="例如：珍珠奶茶" /><p>說出一個具體的人、事、物。不要說數字或解釋位置；送出後請保持安靜。</p><GameButton type="submit" block :disabled="!clueDraft.trim()">公開線索，交給隊友<template #trailing><ArrowRight :size="20" /></template></GameButton></form>
    </main>

    <main v-else-if="game.phase === 'discuss'" class="wavelength-board page-container page-container--game">
      <div class="wavelength-board__intro"><span class="eyebrow"><Radio :size="16" /> TUNE TOGETHER</span><h1>{{ activeName }}，來調頻。</h1><p>提示者請保持沉默。大家討論線索應該落在光譜哪裡，再拖動指針。</p></div>
      <section class="wavelength-instrument">
        <div class="wavelength-spectrum-title"><span>{{ game.round.card.category }} · {{ game.round.number.toString().padStart(2, '0') }}</span><strong>{{ game.round.card.left }} <i>↔</i> {{ game.round.card.right }}</strong></div>
        <div class="wavelength-clue-display"><small>提示者說</small><strong>「{{ game.round.clue }}」</strong></div>
        <SpectrumDial :guess="game.round.guess" />
        <div class="wavelength-scale"><strong>{{ game.round.card.left }}</strong><strong>{{ game.round.card.right }}</strong></div>
        <div class="wavelength-slider"><input type="range" min="0" max="100" step="1" :value="game.round.guess" aria-label="調整指針" @input="updateWavelengthGuess(Number(($event.target as HTMLInputElement).value))" /></div>
        <p class="wavelength-range-hint">拖動滑桿，或用方向鍵微調位置</p>
      </section>
      <GameButton block @click="lockWavelengthGuess"><template #icon><Check :size="19" /></template>鎖定指針<template #trailing><ArrowRight :size="20" /></template></GameButton>
      <div class="wavelength-scores"><span v-if="game.mode === 'co-op'">合作得分 <strong>{{ game.scores[0] }} / 15</strong></span><template v-else><span>{{ game.teamNames[0] }} <strong>{{ game.scores[0] }}</strong></span><span>{{ game.teamNames[1] }} <strong>{{ game.scores[1] }}</strong></span></template></div>
    </main>

    <main v-else-if="game.phase === 'opponent'" class="wavelength-stage page-container page-container--game">
      <span class="eyebrow"><ArrowLeft :size="16" /> LEFT OR RIGHT?</span>
      <h1>{{ opponentName }}，<em>你們怎麼看？</em></h1>
      <p class="wavelength-helper">{{ activeName }} 已經鎖定指針。猜真正目標的中心在指針左邊還是右邊？猜對可得 1 分。</p>
      <section class="wavelength-instrument"><div class="wavelength-spectrum-title"><strong>{{ game.round.card.left }} <i>↔</i> {{ game.round.card.right }}</strong></div><div class="wavelength-clue-display"><small>本回合線索</small><strong>「{{ game.round.clue }}」</strong></div><SpectrumDial :guess="game.round.guess" /><div class="wavelength-scale"><strong>{{ game.round.card.left }}</strong><strong>{{ game.round.card.right }}</strong></div></section>
      <div class="wavelength-direction-actions"><button type="button" @click="chooseWavelengthDirection('left')"><ArrowLeft :size="25" /><strong>目標在左邊</strong></button><button type="button" @click="chooseWavelengthDirection('right')"><strong>目標在右邊</strong><ArrowRight :size="25" /></button></div>
    </main>

    <main v-else-if="game.phase === 'reveal'" class="wavelength-board page-container page-container--game">
      <div class="wavelength-board__intro"><span class="eyebrow"><Target :size="16" /> THE REVEAL</span><h1>{{ game.round.earned < 0 ? '這次有對上頻率嗎？' : game.round.earned === 4 ? '完美同頻！' : game.round.earned ? '接近了！' : '頻率跑掉了！' }}</h1><p>「{{ game.round.clue }}」· {{ game.round.card.left }} ↔ {{ game.round.card.right }}</p></div>
      <section class="wavelength-instrument wavelength-instrument--result"><SpectrumDial :guess="game.round.guess" :target="game.round.target" :reveal="game.round.earned >= 0" /><div class="wavelength-scale"><strong>{{ game.round.card.left }}</strong><strong>{{ game.round.card.right }}</strong></div><div v-if="game.round.earned >= 0" class="wavelength-awards"><div><small>{{ activeName }}</small><strong>+{{ game.round.earned }}</strong></div><div v-if="game.mode === 'teams'"><small>{{ opponentName }} · 猜{{ game.round.opponentGuess === 'left' ? '左' : '右' }}</small><strong>+{{ game.round.bonus }}</strong></div></div><div v-else class="wavelength-hidden"><EyeOff :size="18" /> 真正目標尚未揭曉</div></section>
      <GameButton v-if="game.round.earned < 0" block @click="revealWavelengthTarget"><template #icon><Target :size="20" /></template>揭曉目標</GameButton>
      <GameButton v-else block @click="nextRound"><template #icon><ArrowRight :size="20" /></template>{{ isWavelengthGameOver(game) ? '查看最終結果' : '下一回合' }}</GameButton>
      <div class="wavelength-scores"><span v-if="game.mode === 'co-op'">合作得分 <strong>{{ game.scores[0] }} / 15</strong></span><template v-else><span>{{ game.teamNames[0] }} <strong>{{ game.scores[0] }}</strong></span><span>{{ game.teamNames[1] }} <strong>{{ game.scores[1] }}</strong></span></template></div>
    </main>

    <main v-else-if="game.phase === 'finished'" class="wavelength-finale page-container page-container--game">
      <span class="eyebrow"><Trophy :size="17" /> SIGNAL LOCKED</span>
      <h1 v-if="game.mode === 'co-op'">{{ game.scores[0] >= 15 ? '你們真的很有默契！' : '下次再對上頻率！' }}</h1>
      <h1 v-else>{{ game.teamNames[game.scores[0] > game.scores[1] ? 0 : 1] }}同頻獲勝！</h1>
      <p>{{ game.mode === 'co-op' ? '六回合的共同挑戰已完成。' : '雙方都完成相同數量的回合。' }}</p>
      <div class="wavelength-final-scores"><div><small>{{ game.mode === 'co-op' ? '合作總分' : game.teamNames[0] }}</small><strong>{{ game.scores[0] }}</strong></div><div v-if="game.mode === 'teams'"><small>{{ game.teamNames[1] }}</small><strong>{{ game.scores[1] }}</strong></div></div>
      <section class="wavelength-history"><h2>每回合復盤</h2><article v-for="round in game.history" :key="round.number"><span>{{ String(round.number).padStart(2, '0') }}</span><div><strong>{{ round.card.left }} ↔ {{ round.card.right }}</strong><small>{{ game.players.find((player) => player.id === round.clueGiverId)?.name }}：「{{ round.clue }}」</small><small>指針 {{ round.guess }} · 目標 {{ round.target }}{{ game.mode === 'teams' ? ` · 對手猜${round.opponentGuess === 'left' ? '左' : '右'}` : '' }}</small></div><b>+{{ round.earned }}</b></article></section>
      <GameButton block @click="restart"><template #icon><RotateCcw :size="19" /></template>再玩一局</GameButton>
    </main>
  </div>
</template>
