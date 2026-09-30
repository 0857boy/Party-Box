<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, ArrowRight, Fingerprint, MessageCircle, RotateCcw, Skull, UsersRound, Vote } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import GameButton from '@/components/ui/GameButton.vue'
import GameModal from '@/components/ui/GameModal.vue'
import {
  aliveUndercoverPlayers,
  beginUndercoverElimination,
  confirmUndercoverElimination,
  continueUndercoverGame,
  currentSpeaker,
  lastEliminatedPlayer,
  selectUndercoverElimination,
  undercoverSession
} from '../stores/session'

const router = useRouter()
const confirmationOpen = ref(false)
const game = computed(() => undercoverSession.gameplay)
const selectedPlayer = computed(() => undercoverSession.players.find((player) => player.id === game.value?.selectedEliminationId))
const speakingOrder = computed(() => {
  const alive = aliveUndercoverPlayers.value
  const start = alive.findIndex((player) => player.id === game.value?.startingSpeakerId)
  return start < 0 ? alive : [...alive.slice(start), ...alive.slice(0, start)]
})

function confirmElimination(): void {
  confirmationOpen.value = false
  confirmUndercoverElimination()
}

function nextRoundOrResult(): void {
  continueUndercoverGame()
  if (game.value?.phase === 'result') void router.replace({ name: 'undercover-result' })
}
</script>

<template>
  <div v-if="game" class="game-page undercover-page undercover-play-page">
    <GameHeader :title="game.phase === 'discussion' ? '描述與討論' : game.phase === 'elimination' ? '登記淘汰' : '淘汰結果'" :step="`UNDERCOVER · ROUND ${game.round}`" />
    <main class="undercover-play-layout page-container page-container--game">
      <aside class="undercover-status-board">
        <div><span>回合</span><strong>{{ game.round }}</strong></div>
        <div><span>存活</span><strong>{{ aliveUndercoverPlayers.length }}</strong></div>
        <div><span>臥底</span><strong>{{ undercoverSession.setup.undercoverCount }}</strong></div>
      </aside>

      <section v-if="game.phase === 'discussion'" class="phase-panel undercover-discussion">
        <span class="eyebrow"><MessageCircle :size="15" /> DESCRIBE & DISCUSS</span>
        <h1>從 <em>{{ currentSpeaker?.name }}</em><br />開始描述</h1>
        <p>依順序每人用一句話描述自己的詞。不能說出詞中的字、不能直接念答案，也不要重複別人的提示。</p>
        <div class="speaking-order">
          <div v-for="(player, index) in speakingOrder" :key="player.id" :class="{ active: index === 0 }"><span>{{ index + 1 }}</span><strong>{{ player.name }}</strong><small>{{ index === 0 ? '首先發言' : '接著發言' }}</small></div>
        </div>
        <div class="undercover-callout"><AlertTriangle :size="19" /><span>所有人描述完再自由討論；被淘汰的玩家不能繼續提示。</span></div>
        <GameButton block @click="beginUndercoverElimination"><template #icon><Vote :size="20" /></template>描述完成，開始指認</GameButton>
      </section>

      <section v-else-if="game.phase === 'elimination'" class="phase-panel">
        <span class="eyebrow"><Vote :size="15" /> TABLE VOTE</span>
        <h1>全員同步指認<br /><em>誰最可疑？</em></h1>
        <p>大家同時指出一名玩家。平票請在現實中重新投票，確定最高票後再由持機者登記。</p>
        <div class="elimination-grid">
          <button v-for="player in aliveUndercoverPlayers" :key="player.id" type="button" :class="{ active: game.selectedEliminationId === player.id }" @click="selectUndercoverElimination(player.id)"><span>{{ undercoverSession.players.indexOf(player) + 1 }}</span><strong>{{ player.name }}</strong><Fingerprint v-if="game.selectedEliminationId === player.id" :size="19" /></button>
        </div>
        <GameButton block variant="danger" :disabled="!game.selectedEliminationId" @click="confirmationOpen = true">確認淘汰 {{ selectedPlayer?.name }}</GameButton>
      </section>

      <section v-else-if="game.phase === 'elimination-result' && lastEliminatedPlayer" class="phase-panel phase-panel--center undercover-elimination-result">
        <div class="result-emblem" :class="lastEliminatedPlayer.role === 'undercover' ? 'result-emblem--fail' : 'result-emblem--success'"><Fingerprint v-if="lastEliminatedPlayer.role === 'undercover'" :size="42" /><UsersRound v-else :size="42" /></div>
        <span class="eyebrow">IDENTITY REVEALED</span>
        <h1>{{ lastEliminatedPlayer.name }} 是<br /><em>{{ lastEliminatedPlayer.role === 'undercover' ? '臥底' : '平民' }}</em></h1>
        <p v-if="!game.winner">詞語暫不公開，存活玩家繼續推理。</p>
        <div v-if="game.winner" class="undercover-win-preview"><Skull v-if="game.winner === 'undercover'" :size="20" /><UsersRound v-else :size="20" /><strong>{{ game.winner === 'undercover' ? '臥底陣營獲勝' : '平民陣營獲勝' }}</strong><span>{{ game.winReason }}</span></div>
        <GameButton block @click="nextRoundOrResult">{{ game.winner ? '查看完整結果' : '進入下一輪' }}<template #trailing><ArrowRight :size="19" /></template></GameButton>
      </section>
    </main>

    <GameModal :open="confirmationOpen" title="確認淘汰玩家" @close="confirmationOpen = false">
      <div class="undercover-confirm"><Fingerprint :size="38" /><p>確定本輪要淘汰 <strong>{{ selectedPlayer?.name }}</strong>？請先確認現實中的投票已完成，平票也已重投。</p></div>
      <template #footer><div class="modal-actions"><GameButton variant="secondary" @click="confirmationOpen = false"><template #icon><RotateCcw :size="18" /></template>重新選擇</GameButton><GameButton variant="danger" @click="confirmElimination">確認淘汰</GameButton></div></template>
    </GameModal>
  </div>
</template>
