<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, ArrowRight, Clock3, Layers3, Plus, Shuffle, Trash2, UsersRound } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import SetupFlow from '@/components/game/SetupFlow.vue'
import CategoryPicker from '@/components/game/CategoryPicker.vue'
import PlayerRosterHistory from '@/components/player/PlayerRosterHistory.vue'
import RecordingGallery from '@/components/game/RecordingGallery.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { createRandomTeamAssignments, createTeamsFromAssignments } from '@/engine/teamManager'
import { normalizeRosterForGame, playerRosterStore } from '@/stores/playerRosters'
import { charadesCategories } from '../data/cards'
import { cardsForCategory, charadesDifficulties, quickPlaySeconds, validateCharadesSetup } from '../logic/game'
import { charadesSession, startCharadesGame } from '../stores/session'

const router = useRouter()
const errors = computed(() => validateCharadesSetup(charadesSession.setup))
const setup = charadesSession.setup
const availableCount = computed(() => cardsForCategory(setup.category, setup.difficulty).length)
const actualDeckSize = computed(() => Math.min(setup.deckSize, availableCount.value))
const categoryOptions = computed(() => charadesCategories.map(category => ({
  ...category,
  name: `${category.name} · ${cardsForCategory(category.id, setup.difficulty).length} 題`,
  description: category.description
})))
const licenseBase = `${import.meta.env.BASE_URL}licenses/`
const estimatedMinutes = computed(() => {
  const seconds = quickPlaySeconds(setup)
  return seconds % 60 ? `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒` : `${seconds / 60} 分鐘`
})
const summary = computed(() => `${setup.playerNames.length} 人 · ${charadesDifficulties.find(item => item.id === setup.difficulty)?.name} · ${setup.mode === 'quick' ? `每隊 ${setup.turnsPerTeam} 次・約 ${estimatedMinutes.value}` : `記憶三輪・${actualDeckSize.value} 張`}`)
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
  if (Math.min(firstSize, secondSize) >= 2) return
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
    <GameHeader title="爆笑猜詞" step="遊戲設定" />
    <div class="setup-layout page-container page-container--game">
      <section class="setup-intro charades-intro">
        <span class="eyebrow"><Shuffle :size="15" /> SHORT WORDS. BIG LAUGHS.</span>
        <h1>不用演三輪，<br /><em>一樣笑翻全場。</em></h1>
        <p>選難度、分好隊就能玩。每次限時猜短詞，時間到換隊；想挑戰記憶，再開啟原本的三輪玩法。</p>
        <details class="undercover-rules-details">
          <summary>查看完整規則</summary>
          <ol>
            <li><strong>自由分隊：</strong>預設交錯分隊，也能手動選隊、改隊名，或按「打亂重分」。每隊至少 2 人。</li>
            <li><strong>限時猜牌：</strong>時間內猜對越多越好；猜對一張得 1 分，也可以先跳過。</li>
            <li><strong>輪流提示：</strong>每位隊員都當過提示者後，才會輪回同一位玩家。</li>
            <li><strong>快節奏隊伍賽：</strong>兩隊交替，每隊玩設定的 1–3 次，每次時間相同。不必猜完整副牌；跳過不扣分、直接換新題，題庫用完才重洗。</li>
            <li><strong>提示方式：</strong>比手畫腳只能用動作，不能說話、寫字或比出答案文字；自由描述可以說話，但不能講出答案或答案中的字。</li>
            <li><strong>記憶三輪：</strong>可選的舊玩法。整副牌猜完才換輪，依序用自由描述、一個詞、無聲動作，重用同一副牌。</li>
            <li><strong>決定勝負：</strong>猜對一題得 1 分，總分較高者獲勝。快節奏模式保證兩隊的出場次數相同。</li>
            <li><strong>題庫來源：</strong>中華民國教育部《成語典》2020_20260929、《國語辭典簡編本》2014_20260929，詞目依原文核對；分類、難度與表演適合度由 Party Box 自行整理，非教育部評定。<a :href="`${licenseBase}moe-idioms-public-license.pdf`" target="_blank" rel="noopener">成語典使用說明</a>、<a :href="`${licenseBase}moe-concised-public-license.pdf`" target="_blank" rel="noopener">簡編本使用說明</a>。其他角色、名人與生活題目由編輯選取，不代表皆收在辭典。</li>
          </ol>
        </details>
        <details class="undercover-rules-details"><summary>裝置錄影中心</summary><RecordingGallery /></details>
      </section>

      <SetupFlow :steps="['玩家分隊', '題庫難度', '更多玩法']" :visible-steps="[0, 2]" :values="[setup.teamNames.join(' vs '), '', setup.mode === 'quick' ? '快節奏隊伍賽' : '記憶三輪']" :player-count="setup.playerNames.length" :min-players="4" :max-players="16" :summary="summary" @add-player="addPlayer" @remove-player="removePlayer(setup.playerNames.length - 1)" @submit="start">
        <template #quick>
          <CategoryPicker v-model="setup.category" :options="categoryOptions" compact />
          <div class="setup-inline-grid">
            <label>難度<select v-model="setup.difficulty" aria-label="題目難度"><option v-for="difficulty in charadesDifficulties" :key="difficulty.id" :value="difficulty.id">{{ difficulty.name }}</option></select></label>
            <label>時間<select v-model.number="setup.turnSeconds" aria-label="每次時間"><option v-for="seconds in [30, 45, 60, 90]" :key="seconds" :value="seconds">{{ seconds }} 秒</option></select></label>
            <label v-if="setup.mode === 'quick'">提示方式<select v-model="setup.clueStyle" aria-label="提示方式"><option value="acting">比手畫腳</option><option value="describe">自由描述</option></select></label>
            <label v-if="setup.mode === 'quick'">每隊出場<select v-model.number="setup.turnsPerTeam" aria-label="每隊出場"><option v-for="count in [1, 2, 3]" :key="count" :value="count">{{ count }} 次</option></select></label>
          </div>
        </template>
        <section class="setup-panel">
          <header class="setup-panel__header"><div><span>01</span><h2>玩家與隊伍</h2><small>{{ charadesSession.setup.playerNames.length }} / 16</small></div><UsersRound :size="22" /></header>
          <div class="player-inputs">
            <label v-for="(_, index) in charadesSession.setup.playerNames" :key="index" class="player-input charades-player-input">
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <input v-model.trim="charadesSession.setup.playerNames[index]" type="text" maxlength="18" :aria-label="`玩家 ${index + 1} 名稱`" autocomplete="off" />
              <select v-model.number="setup.teamAssignments[index]" :aria-label="`玩家 ${index + 1} 隊伍`"><option :value="0">A 隊</option><option :value="1">B 隊</option></select>
              <button type="button" :disabled="charadesSession.setup.playerNames.length <= 4" :aria-label="`移除玩家 ${index + 1}`" @click="removePlayer(index)"><Trash2 :size="17" /></button>
            </label>
          </div>
          <button v-if="charadesSession.setup.playerNames.length < 16" class="add-player" type="button" @click="addPlayer"><Plus :size="18" /> 新增玩家</button>
          <div class="charades-team-toolbar"><strong>隊伍設定</strong><button type="button" @click="reshuffleTeams"><Shuffle :size="16" />打亂重分</button></div>
          <div class="charades-team-preview">
            <article v-for="team in teamPreview" :key="team.id" :class="`charades-team-preview--${team.id}`">
              <label><span>{{ team.id === 'team-a' ? 'A 隊' : 'B 隊' }} · {{ team.playerIds.length }} 人</span><input v-model.trim="charadesSession.setup.teamNames[team.id === 'team-a' ? 0 : 1]" type="text" maxlength="12" :aria-label="team.id === 'team-a' ? '第一隊隊名' : '第二隊隊名'" /></label>
              <span>{{ team.playerIds.map((id) => charadesSession.setup.playerNames[Number(id)]).join('、') }}</span>
            </article>
          </div>
          <p class="undercover-setup-note">隨機分隊會盡量平均；也能在名字旁自行選隊。每隊至少 2 人，出場次數相同。</p>
          <PlayerRosterHistory @select="applyRoster" />
        </section>

        <section class="setup-panel">
          <header class="setup-panel__header"><div><span>02</span><h2>題目主題</h2></div><Layers3 :size="21" /></header>
          <fieldset class="charades-settings-field"><legend>題目難度</legend><div class="charades-option-grid">
            <button v-for="difficulty in charadesDifficulties" :key="difficulty.id" type="button" :aria-pressed="setup.difficulty === difficulty.id" :class="{ active: setup.difficulty === difficulty.id }" @click="setup.difficulty = difficulty.id">{{ difficulty.name }}</button>
          </div><p>{{ charadesDifficulties.find(item => item.id === setup.difficulty)?.description }}</p></fieldset>
          <CategoryPicker v-model="setup.category" :options="categoryOptions" />
          <p class="undercover-setup-note">{{ availableCount }} 題短詞，不出長句情境；難度與主題都會影響抽題。</p>
        </section>

        <section class="setup-panel">
          <header class="setup-panel__header"><div><span>03</span><h2>節奏設定</h2></div><Clock3 :size="21" /></header>
          <fieldset class="charades-settings-field"><legend>遊戲模式</legend><div class="charades-mode-picker">
            <button type="button" :aria-pressed="setup.mode === 'quick'" :class="{ active: setup.mode === 'quick' }" @click="setup.mode = 'quick'"><strong>快節奏隊伍賽</strong><small>限時換隊，不必清空牌庫</small></button>
            <button type="button" :aria-pressed="setup.mode === 'classic'" :class="{ active: setup.mode === 'classic' }" @click="setup.mode = 'classic'"><strong>記憶三輪</strong><small>描述 → 一個詞 → 動作</small></button>
          </div></fieldset>
          <fieldset v-if="setup.mode === 'quick'" class="charades-settings-field"><legend>提示方式</legend><div class="charades-option-grid charades-option-grid--two">
            <button type="button" :aria-pressed="setup.clueStyle === 'acting'" :class="{ active: setup.clueStyle === 'acting' }" @click="setup.clueStyle = 'acting'">比手畫腳</button>
            <button type="button" :aria-pressed="setup.clueStyle === 'describe'" :class="{ active: setup.clueStyle === 'describe' }" @click="setup.clueStyle = 'describe'">自由描述</button>
          </div><p>{{ setup.clueStyle === 'acting' ? '不能說話，只能比動作。' : '可以說話，但不能講出答案或答案中的字。' }}</p></fieldset>
          <div class="charades-settings-row">
            <label>每次時間<select v-model.number="setup.turnSeconds" aria-label="每次時間"><option v-for="seconds in [30, 45, 60, 90]" :key="seconds" :value="seconds">{{ seconds }} 秒</option></select></label>
            <label v-if="setup.mode === 'quick'">每隊出場<select v-model.number="setup.turnsPerTeam" aria-label="每隊出場"><option v-for="count in [1, 2, 3]" :key="count" :value="count">{{ count }} 次</option></select></label>
          </div>
          <p v-if="setup.mode === 'quick'" class="charades-duration-note"><Clock3 :size="18" />純遊玩約 {{ estimatedMinutes }}，不含交棒與討論</p>
          <fieldset v-else class="charades-settings-field"><legend>共用牌庫張數</legend><div class="charades-option-grid">
            <button v-for="size in [24, 32, 40]" :key="size" type="button" :aria-pressed="setup.deckSize === size" :class="{ active: setup.deckSize === size }" @click="setup.deckSize = size">{{ size }} 張</button>
          </div><p>實際使用 {{ actualDeckSize }} 張；若主題題量較少，使用全部符合難度的詞。整副牌會重用三輪。</p></fieldset>
        </section>

        <template #feedback><div v-if="errors.length" class="validation-box validation-box--error"><AlertTriangle :size="20" /><div><p v-for="error in errors" :key="error">{{ error }}</p></div></div></template>
        <template #action><GameButton type="submit" block :disabled="Boolean(errors.length)">建立牌庫並分隊<template #trailing><ArrowRight :size="20" /></template></GameButton></template>
      </SetupFlow>
    </div>
  </div>
</template>
