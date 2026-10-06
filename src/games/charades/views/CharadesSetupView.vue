<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, ArrowRight, Clock3, Layers3, Plus, Shuffle, Trash2, UsersRound } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import SetupFlow from '@/components/game/SetupFlow.vue'
import CategoryPicker from '@/components/game/CategoryPicker.vue'
import PlayerRosterHistory from '@/components/player/PlayerRosterHistory.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { createRandomTeamAssignments, createTeamsFromAssignments } from '@/engine/teamManager'
import { normalizeRosterForGame, playerRosterStore } from '@/stores/playerRosters'
import { charadesCategories } from '../data/cards'
import { validateCharadesSetup } from '../logic/game'
import { charadesSession, startCharadesGame } from '../stores/session'

const router = useRouter()
const errors = computed(() => validateCharadesSetup(charadesSession.setup))
const teamPreview = computed(() => createTeamsFromAssignments(
  charadesSession.setup.playerNames.map((_, index) => String(index)),
  charadesSession.setup.teamAssignments,
  charadesSession.setup.teamNames
))

function addPlayer(): void {
  if (charadesSession.setup.playerNames.length >= 16) return
  charadesSession.setup.playerNames.push(`玩家 ${charadesSession.setup.playerNames.length + 1}`)
  const firstTeamSize = charadesSession.setup.teamAssignments.filter((team) => team === 0).length
  const secondTeamSize = charadesSession.setup.teamAssignments.filter((team) => team === 1).length
  charadesSession.setup.teamAssignments.push(firstTeamSize <= secondTeamSize ? 0 : 1)
}

function removePlayer(index: number): void {
  if (charadesSession.setup.playerNames.length <= 4) return
  charadesSession.setup.playerNames.splice(index, 1)
  charadesSession.setup.teamAssignments.splice(index, 1)
  rebalanceTeams()
}

function applyRoster(names: string[]): void {
  charadesSession.setup.playerNames = normalizeRosterForGame(names, 4, 16)
  charadesSession.setup.teamAssignments = alternatingAssignments(charadesSession.setup.playerNames.length)
}

function reshuffleTeams(): void {
  const current = charadesSession.setup.teamAssignments.join('')
  const next = createRandomTeamAssignments(charadesSession.setup.playerNames.length)
  if (next.join('') === current) {
    const first = next.findIndex((team) => team === 0)
    const second = next.findIndex((team) => team === 1)
    if (first >= 0 && second >= 0) [next[first], next[second]] = [next[second]!, next[first]!]
  }
  charadesSession.setup.teamAssignments = next
}

function alternatingAssignments(playerCount: number): Array<0 | 1> {
  return Array.from({ length: playerCount }, (_, index) => index % 2 as 0 | 1)
}

function rebalanceTeams(): void {
  const assignments = charadesSession.setup.teamAssignments
  const firstSize = assignments.filter((team) => team === 0).length
  const secondSize = assignments.length - firstSize
  if (Math.abs(firstSize - secondSize) <= 1) return
  const largerTeam: 0 | 1 = firstSize > secondSize ? 0 : 1
  const index = assignments.lastIndexOf(largerTeam)
  if (index >= 0) assignments[index] = largerTeam === 0 ? 1 : 0
}

function start(): void {
  if (errors.value.length) return
  startCharadesGame()
  void router.push({ name: 'charades-play' })
}

onMounted(() => {
  if (playerRosterStore.currentNames.length && playerRosterStore.currentNames.join('\u0000') !== charadesSession.setup.playerNames.join('\u0000')) {
    applyRoster(playerRosterStore.currentNames)
  }
})
</script>

<template>
  <div class="game-page charades-page">
    <GameHeader title="遊戲設定" step="PARTY CHARADES · SETUP" />
    <div class="setup-layout page-container page-container--game">
      <section class="setup-intro charades-intro">
        <span class="eyebrow"><Shuffle :size="15" /> THREE ROUNDS. SAME CARDS.</span>
        <h1>同一個答案，<br /><em>越猜越荒謬。</em></h1>
        <p>兩隊輪流派人提示。同一副牌會玩三次，從自由描述一路進化成完全不能說話的肢體劇場。</p>
        <div class="charades-round-preview">
          <div><span>1</span><strong>自由描述</strong><small>不能說出答案</small></div>
          <div><span>2</span><strong>一字提示</strong><small>每張只能一個詞</small></div>
          <div><span>3</span><strong>無聲演出</strong><small>只能比動作</small></div>
        </div>
        <details class="undercover-rules-details">
          <summary>查看完整規則</summary>
          <ol>
            <li><strong>自由分隊：</strong>預設依玩家順序交錯分隊，也可以按「打亂重分」隨機分組。</li>
            <li><strong>限時猜牌：</strong>時間內猜對越多越好；猜對一張得 1 分，也可以先跳過。</li>
            <li><strong>輪流提示：</strong>每位隊員都當過提示者後，才會輪回同一位玩家。</li>
            <li><strong>清空牌庫：</strong>整副牌猜完才結束該輪，接著把同一副牌洗牌重玩。</li>
            <li><strong>三輪限制：</strong>依序使用自由描述、一個詞、無聲動作。</li>
            <li><strong>決定勝負：</strong>三輪累積總分較高的隊伍獲勝。</li>
          </ol>
        </details>
      </section>

      <SetupFlow :steps="['玩家分隊', '主題', '節奏']" :summary="`${charadesSession.setup.playerNames.length} 人 · ${charadesSession.setup.deckSize} 張 · 每次 ${charadesSession.setup.turnSeconds} 秒`" @submit="start">
        <section class="setup-panel">
          <header class="setup-panel__header"><div><span>01</span><h2>玩家與隊伍</h2><small>{{ charadesSession.setup.playerNames.length }} / 16</small></div><UsersRound :size="22" /></header>
          <div class="player-inputs">
            <label v-for="(_, index) in charadesSession.setup.playerNames" :key="index" class="player-input">
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <input v-model.trim="charadesSession.setup.playerNames[index]" type="text" maxlength="18" :aria-label="`玩家 ${index + 1} 名稱`" autocomplete="off" />
              <button type="button" :disabled="charadesSession.setup.playerNames.length <= 4" :aria-label="`移除玩家 ${index + 1}`" @click="removePlayer(index)"><Trash2 :size="17" /></button>
            </label>
          </div>
          <button v-if="charadesSession.setup.playerNames.length < 16" class="add-player" type="button" @click="addPlayer"><Plus :size="18" /> 新增玩家</button>
          <div class="charades-team-toolbar"><strong>隊伍設定</strong><button type="button" @click="reshuffleTeams"><Shuffle :size="16" />打亂重分</button></div>
          <div class="charades-team-preview">
            <article v-for="team in teamPreview" :key="team.id" :class="`charades-team-preview--${team.id}`">
              <label><span class="sr-only">{{ team.id === 'team-a' ? '第一隊' : '第二隊' }}隊名</span><input v-model.trim="charadesSession.setup.teamNames[team.id === 'team-a' ? 0 : 1]" type="text" maxlength="12" :aria-label="team.id === 'team-a' ? '第一隊隊名' : '第二隊隊名'" /></label>
              <span>{{ team.playerIds.map((id) => charadesSession.setup.playerNames[Number(id)]).join('、') }}</span>
            </article>
          </div>
          <PlayerRosterHistory @select="applyRoster" />
        </section>

        <section class="setup-panel">
          <header class="setup-panel__header"><div><span>02</span><h2>題目主題</h2></div><Layers3 :size="21" /></header>
          <CategoryPicker v-model="charadesSession.setup.category" :options="charadesCategories" />
        </section>

        <section class="setup-panel">
          <header class="setup-panel__header"><div><span>03</span><h2>節奏設定</h2></div><Clock3 :size="21" /></header>
          <label class="charades-setting-label">每次提示時間</label>
          <div class="charades-option-grid charades-option-grid--four">
            <button v-for="seconds in [30, 45, 60, 90]" :key="seconds" type="button" :class="{ active: charadesSession.setup.turnSeconds === seconds }" @click="charadesSession.setup.turnSeconds = seconds">{{ seconds }} 秒</button>
          </div>
          <label class="charades-setting-label">本局牌數</label>
          <div class="charades-option-grid">
            <button v-for="size in [24, 32, 40]" :key="size" type="button" :class="{ active: charadesSession.setup.deckSize === size }" @click="charadesSession.setup.deckSize = size">{{ size }} 張</button>
          </div>
          <p class="undercover-setup-note">官方玩法建議約 40–50 張；第一次玩可先用 24 或 32 張熟悉節奏。</p>
        </section>

        <div v-if="errors.length" class="validation-box validation-box--error"><AlertTriangle :size="20" /><div><p v-for="error in errors" :key="error">{{ error }}</p></div></div>
        <template #action><GameButton type="submit" block :disabled="Boolean(errors.length)">建立牌庫並分隊<template #trailing><ArrowRight :size="20" /></template></GameButton></template>
      </SetupFlow>
    </div>
  </div>
</template>
