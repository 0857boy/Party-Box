<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Crown, Home, RotateCcw, ShieldCheck, Sparkles, Swords } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import GameButton from '@/components/ui/GameButton.vue'
import PlayerChip from '@/components/player/PlayerChip.vue'
import {
  avalonSession,
  beginAvalonPlay,
  resetAvalonSession,
  setStartingLeader,
  startAvalonGame
} from '../stores/session'

const router = useRouter()
const gameplay = computed(() => avalonSession.gameplay)

function startPlay(): void {
  beginAvalonPlay()
  void router.push({ name: 'avalon-play' })
}

function playAgain(): void {
  startAvalonGame()
  void router.replace({ name: 'avalon-reveal' })
}

function goHome(): void {
  resetAvalonSession()
  void router.push({ name: 'home' })
}
</script>

<template>
  <div class="game-page ready-page">
    <GameHeader title="準備完成" step="AVALON · READY" />
    <main v-if="gameplay" class="ready-content page-container page-container--game">
      <div class="ready-seal"><Swords :size="48" /></div>
      <span class="eyebrow"><ShieldCheck :size="15" /> EVERY ROLE IS SECRET</span>
      <h1>所有身份<br /><em>已分配完成</em></h1>
      <p>把裝置放回桌中央。選擇起始領袖後，Party Box 會帶領任務與刺殺流程；投票則由所有玩家在桌上同步完成。</p>

      <section class="leader-picker">
        <header><Crown :size="19" /><span><small>STARTING LEADER</small><strong>誰是起始領袖？</strong></span></header>
        <p>依桌遊規則可選年紀最長的玩家，之後領袖會按玩家順序輪替。</p>
        <div class="leader-picker__grid">
          <button
            v-for="(player, index) in avalonSession.players"
            :key="player.id"
            type="button"
            :class="{ active: gameplay.leaderIndex === index }"
            @click="setStartingLeader(index)"
          >
            <Crown v-if="gameplay.leaderIndex === index" :size="15" />
            <span v-else>{{ index + 1 }}</span>
            {{ player.name }}
          </button>
        </div>
      </section>

      <div class="ready-roster">
        <PlayerChip v-for="(player, index) in avalonSession.players" :key="player.id" :name="player.name" :index="index" />
      </div>

      <div v-if="gameplay.ladyEnabled" class="expansion-note"><Sparkles :size="17" /> 湖中女神已啟用，將於第 2、3、4 次任務後發動。</div>

      <div class="ready-actions ready-actions--primary">
        <GameButton block @click="startPlay">開始第一回合<template #trailing><ArrowRight :size="19" /></template></GameButton>
        <GameButton block variant="secondary" @click="playAgain"><template #icon><RotateCcw :size="19" /></template>重新洗牌</GameButton>
        <GameButton block variant="ghost" @click="goHome"><template #icon><Home :size="19" /></template>回 Party Box</GameButton>
      </div>
    </main>
  </div>
</template>
