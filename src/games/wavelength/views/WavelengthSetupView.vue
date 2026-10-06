<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, ArrowRight, Plus, Radio, Shuffle, Trash2, UsersRound } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import SetupFlow from '@/components/game/SetupFlow.vue'
import PlayerRosterHistory from '@/components/player/PlayerRosterHistory.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { normalizeRosterForGame, playerRosterStore } from '@/stores/playerRosters'
import { validateWavelengthSetup } from '../logic/game'
import { alternatingAssignments, reshuffleWavelengthTeams, startWavelengthGame, wavelengthSession } from '../stores/session'

const router = useRouter()
const setup = wavelengthSession.setup
const mode = computed(() => setup.playerNames.length <= 3 ? 'co-op' : 'teams')
const errors = computed(() => validateWavelengthSetup(setup))
const teams = computed(() => [0, 1].map((team) => setup.playerNames.filter((_, index) => setup.teamAssignments[index] === team).join('、')))

function addPlayer(): void {
  if (setup.playerNames.length >= 12) return
  setup.playerNames.push(`玩家 ${setup.playerNames.length + 1}`)
  setup.teamAssignments = alternatingAssignments(setup.playerNames.length)
}

function removePlayer(index: number): void {
  if (setup.playerNames.length <= 2) return
  setup.playerNames.splice(index, 1)
  setup.teamAssignments = alternatingAssignments(setup.playerNames.length)
}

function applyRoster(names: string[]): void {
  setup.playerNames = normalizeRosterForGame(names, 2, 12)
  setup.teamAssignments = alternatingAssignments(setup.playerNames.length)
}

function start(): void {
  if (errors.value.length) return
  startWavelengthGame()
  void router.push({ name: 'wavelength-play' })
}

onMounted(() => {
  if (playerRosterStore.currentNames.length && playerRosterStore.currentNames.join('\u0000') !== setup.playerNames.join('\u0000')) applyRoster(playerRosterStore.currentNames)
})
</script>

<template>
  <div class="game-page wavelength-page">
    <GameHeader title="遊戲設定" step="SAME FREQUENCY · SETUP" />
    <div class="setup-layout page-container page-container--game">
      <section class="setup-intro wavelength-intro">
        <span class="eyebrow"><Radio :size="16" /> FIND THE SAME FREQUENCY</span>
        <h1>你說的那個，<br /><em>到底有多那個？</em></h1>
        <p>提示者看到藏在兩個極端之間的目標，再用一個有趣的例子傳遞感覺。大家討論，把指針停在心目中的位置。</p>
        <div class="wavelength-preview"><span>便宜</span><div><i /></div><span>超貴</span></div>
        <div class="undercover-rule-card"><strong>一分鐘學會</strong><span>① 提示者私下看目標，給一個線索</span><span>② 隊友討論並鎖定指針</span><span>③ 對手猜左右，揭曉並計分</span></div>
        <details class="undercover-rules-details">
          <summary>查看完整規則</summary>
          <ol>
            <li>2–3 人為合作模式，玩 6 回合，以 15 分為共同目標；4–12 人分成兩隊。</li>
            <li>提示者獨自看目標，說一個落在兩端概念之間的事物。不能用數字、比例、題目原字或多重線索暗示位置。</li>
            <li>給完線索後，提示者不再說話，也不要用表情提示。隊友拖動指針並鎖定。</li>
            <li>對戰時，另一隊猜真正中心在指針左邊或右邊；隊友若命中最核心區，對手無法得分。</li>
            <li>距離目標中心 4 格內得 4 分、9 格內得 3 分、16 格內得 2 分；其餘 0 分。對手猜對方向得 1 分。</li>
            <li>兩隊輪流出題，兩隊回合數相同且有人達到 12 分後，較高分獲勝；平分則繼續加賽一組回合。</li>
          </ol>
        </details>
      </section>

      <SetupFlow :steps="['玩家', '隊伍']" :summary="`${setup.playerNames.length} 人 · ${mode === 'co-op' ? '合作挑戰 6 回合' : '兩隊對戰・12 分獲勝'}`" @submit="start">
        <section class="setup-panel">
          <header class="setup-panel__header"><div><span>01</span><h2>玩家</h2><small>{{ setup.playerNames.length }} / 12</small></div><UsersRound :size="22" /></header>
          <div class="player-inputs">
            <label v-for="(_, index) in setup.playerNames" :key="index" class="player-input"><span>{{ String(index + 1).padStart(2, '0') }}</span><input v-model.trim="setup.playerNames[index]" type="text" maxlength="18" :aria-label="`玩家 ${index + 1} 名稱`" autocomplete="off" /><button type="button" :disabled="setup.playerNames.length <= 2" :aria-label="`移除玩家 ${index + 1}`" @click="removePlayer(index)"><Trash2 :size="17" /></button></label>
          </div>
          <button v-if="setup.playerNames.length < 12" class="add-player" type="button" @click="addPlayer"><Plus :size="18" /> 新增玩家</button>
          <PlayerRosterHistory @select="applyRoster" />
        </section>

        <section class="setup-panel">
          <header class="setup-panel__header"><div><span>02</span><h2>{{ mode === 'co-op' ? '合作模式' : '隊伍設定' }}</h2></div><Radio :size="22" /></header>
          <p v-if="mode === 'co-op'" class="undercover-setup-note">大家一起挑戰 6 回合、總分 15 分。輪流當提示者。</p>
          <template v-else>
            <button class="wavelength-shuffle" type="button" @click="reshuffleWavelengthTeams"><Shuffle :size="17" /> 打亂重分</button>
            <div class="charades-team-preview">
              <article v-for="team in [0, 1]" :key="team" :class="`charades-team-preview--team-${team === 0 ? 'a' : 'b'}`"><label><span class="sr-only">{{ team === 0 ? '第一隊' : '第二隊' }}隊名</span><input v-model.trim="setup.teamNames[team]" type="text" maxlength="12" :aria-label="team === 0 ? '第一隊隊名' : '第二隊隊名'" /></label><span>{{ teams[team] }}</span></article>
            </div>
          </template>
        </section>
        <div v-if="errors.length" class="validation-box validation-box--error"><AlertTriangle :size="20" /><div><p v-for="error in errors" :key="error">{{ error }}</p></div></div>
        <template #action><GameButton type="submit" block :disabled="Boolean(errors.length)">開始調頻<template #trailing><ArrowRight :size="20" /></template></GameButton></template>
      </SetupFlow>
    </div>
  </div>
</template>
