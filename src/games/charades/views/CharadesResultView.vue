<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Home, RotateCcw, Sparkles, Trophy } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { totalScore } from '@/engine/scoreManager'
import { classicGuessingRounds } from '@/engine/roundManager'
import { charadesSession, resetCharadesSession, startCharadesGame } from '../stores/session'

const router = useRouter()
const game = computed(() => charadesSession.game)
const rankedTeams = computed(() => charadesSession.teams.map((team) => ({
  ...team,
  score: game.value?.scores.find((item) => item.teamId === team.id),
  total: totalScore(game.value?.scores.find((item) => item.teamId === team.id) ?? { teamId: team.id, byRound: [] })
})).sort((a, b) => b.total - a.total))
const tied = computed(() => rankedTeams.value[0]?.total === rankedTeams.value[1]?.total)

function playerName(id: string): string {
  return charadesSession.players.find((player) => player.id === id)?.name ?? ''
}

function replay(): void {
  startCharadesGame()
  void router.replace({ name: 'charades-play' })
}

function home(): void {
  resetCharadesSession()
  void router.push({ name: 'home' })
}
</script>

<template>
  <div v-if="game" class="game-page charades-page result-page">
    <GameHeader title="最終結果" step="PARTY CHARADES · GAME OVER" />
    <main class="result-content page-container page-container--game">
      <section class="winner-hero charades-winner-hero">
        <div class="winner-hero__icon"><Trophy :size="46" /></div>
        <span class="eyebrow"><Sparkles :size="15" /> THREE ROUNDS COMPLETE</span>
        <h1 v-if="tied"><em>平手！</em></h1>
        <h1 v-else><em>{{ rankedTeams[0]?.name }}</em>獲勝</h1>
        <p>{{ tied ? `兩隊同為 ${rankedTeams[0]?.total} 分，今晚大家都很會演。` : `${rankedTeams[0]?.total} 比 ${rankedTeams[1]?.total}，笑到最後的就是贏家。` }}</p>
      </section>

      <section class="review-section">
        <header><span>01</span><div><small>SCORE BOARD</small><h2>三輪得分</h2></div></header>
        <div class="charades-final-scores">
          <article v-for="team in rankedTeams" :key="team.id" :class="`charades-final-score--${team.id}`">
            <header><div><strong>{{ team.name }}</strong><small>{{ team.playerIds.map(playerName).join('、') }}</small></div><em>{{ team.total }}</em></header>
            <div><span v-for="(round, index) in classicGuessingRounds" :key="round.number"><small>第 {{ round.number }} 輪 · {{ round.name }}</small><strong>{{ team.score?.byRound[index] ?? 0 }}</strong></span></div>
          </article>
        </div>
      </section>

      <section class="review-section">
        <header><span>02</span><div><small>TURN REVIEW</small><h2>提示者紀錄</h2></div></header>
        <div class="charades-turn-history">
          <div v-for="(turn, index) in game.turns" :key="`${turn.round}-${index}`"><span>第 {{ turn.round }} 輪</span><strong>{{ playerName(turn.clueGiverId) }}</strong><small>{{ charadesSession.teams.find((team) => team.id === turn.teamId)?.name }}</small><em>+{{ turn.guessedCardIds.length }}</em></div>
        </div>
      </section>

      <div class="result-actions"><GameButton block @click="replay"><template #icon><RotateCcw :size="19" /></template>相同設定再玩一次</GameButton><GameButton block variant="secondary" @click="home"><template #icon><Home :size="19" /></template>回 Party Box</GameButton></div>
    </main>
  </div>
</template>
