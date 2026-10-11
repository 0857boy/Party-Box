<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, ArrowRight, Fingerprint, Plus, Sparkles, Trash2, UsersRound } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import SetupFlow from '@/components/game/SetupFlow.vue'
import CategoryPicker from '@/components/game/CategoryPicker.vue'
import GameButton from '@/components/ui/GameButton.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import GameModal from '@/components/ui/GameModal.vue'
import PlayerRosterHistory from '@/components/player/PlayerRosterHistory.vue'
import { normalizeRosterForGame, playerRosterStore } from '@/stores/playerRosters'
import { wordCategories } from '../data/words'
import { undercoverReferences } from '../data/references'
import { validateUndercoverSetup } from '../logic/game'
import { availableUndercoverPairs, remainingUndercoverPairs, resetUndercoverDrawHistory, startUndercoverGame, syncRecommendedUndercoverCount, undercoverSession } from '../stores/session'
import type { WordCategorySelection } from '../types'

const router = useRouter()
const resetConfirmationOpen = ref(false)
const validation = computed(() => validateUndercoverSetup(undercoverSession.setup))
const categoryOptions: readonly { id: WordCategorySelection; name: string; description: string }[] = [
  { id: 'funny', name: '爆笑混合', description: '尷尬、感情、職場與網路修羅場' },
  { id: 'mixed', name: '綜合題庫', description: '各種題材，以台灣常用詞彙呈現' },
  ...wordCategories
]

function addPlayer(): void {
  if (undercoverSession.setup.playerNames.length >= 12) return
  undercoverSession.setup.playerNames.push(`玩家 ${undercoverSession.setup.playerNames.length + 1}`)
  syncRecommendedUndercoverCount()
}

function removePlayer(index: number): void {
  if (undercoverSession.setup.playerNames.length <= 4) return
  undercoverSession.setup.playerNames.splice(index, 1)
  if (undercoverSession.setup.playerNames.length < 5) undercoverSession.setup.blankEnabled = false
  syncRecommendedUndercoverCount()
}

onMounted(() => {
  if (playerRosterStore.currentNames.length && playerRosterStore.currentNames.join('\u0000') !== undercoverSession.setup.playerNames.join('\u0000')) {
    applyRecentRoster(playerRosterStore.currentNames)
  }
})

function applyRecentRoster(names: string[]): void {
  undercoverSession.setup.playerNames = normalizeRosterForGame(names, 4, 12)
  syncRecommendedUndercoverCount()
}

function start(): void {
  if (!validation.value.valid || !startUndercoverGame()) return
  void router.push({ name: 'undercover-reveal' })
}

function resetDeck(): void {
  resetUndercoverDrawHistory()
  resetConfirmationOpen.value = false
}
</script>

<template>
  <div class="game-page undercover-page undercover-setup-page">
    <GameHeader title="誰是臥底" step="遊戲設定" />
    <div class="setup-layout page-container page-container--game">
      <section class="setup-intro undercover-intro">
        <span class="eyebrow"><Fingerprint :size="15" /> WHO IS UNDERCOVER?</span>
        <h1>一句提示，<br /><em>誰露出了破綻？</em></h1>
        <p>多數人拿到相同詞語，臥底拿到相近但不同的詞。描述得夠像自己人，也別把答案直接送給對方。</p>
        <div class="undercover-rule-card">
          <strong>快速規則</strong>
          <span>① 偷偷看詞</span><span>② 每人描述一句</span><span>③ 同步指認並淘汰</span>
        </div>
        <details class="undercover-rules-details">
          <summary>查看完整規則</summary>
          <ol>
            <li><strong>秘密抽詞：</strong>平民拿到相同詞語，臥底拿到相近但不同的詞；只有選用的白板會知道自己沒有詞。</li>
            <li><strong>輪流描述：</strong>每人用一句話描述自己的詞，不能說出詞中的字、直接念答案、說謊或完全重複別人的提示。</li>
            <li><strong>自由討論：</strong>所有人描述完後可互相追問，但不要直接公開自己的詞。</li>
            <li><strong>同步指認：</strong>存活玩家同時指出最可疑的人，最高票淘汰；平票時只讓同票玩家接受重投。</li>
            <li><strong>平民勝利：</strong>找出並淘汰所有臥底與白板。</li>
            <li><strong>潛伏方勝利：</strong>存活臥底與白板總數不少於存活平民人數。</li>
          </ol>
          <p>詞義與候選來源（配對與難度由 Party Box 編輯）：
            <a v-for="source in undercoverReferences.slice(0, 3)" :key="source.url" :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }}；</a>
            <a href="./licenses/moe-concised-public-license.pdf" target="_blank" rel="noopener noreferrer">教育部原始公眾授權說明</a>
          </p>
        </details>
      </section>

      <SetupFlow :steps="['玩家', '主題', '進階規則']" :visible-steps="[0, 2]" :values="['改名字・使用最近名單', '', `${undercoverSession.setup.undercoverCount} 名臥底${undercoverSession.setup.blankEnabled ? '＋白板' : '・無白板'}`]" :player-count="undercoverSession.setup.playerNames.length" :min-players="4" :max-players="12" :summary="`${undercoverSession.setup.playerNames.length} 人 · ${categoryOptions.find(option => option.id === undercoverSession.setup.category)?.name} · ${undercoverSession.setup.undercoverCount} 名臥底${undercoverSession.setup.blankEnabled ? '＋白板' : ''}`" @add-player="addPlayer" @remove-player="removePlayer(undercoverSession.setup.playerNames.length - 1)" @submit="start">
        <template #quick>
          <div class="setup-inline-grid">
            <CategoryPicker v-model="undercoverSession.setup.category" :options="categoryOptions" compact />
            <label>配對難度
              <select v-model="undercoverSession.setup.difficulty" aria-label="配對難度">
                <option value="all">全部難度</option><option value="easy">簡單・差異明顯</option>
                <option value="normal">普通・相近可辨</option><option value="hard">困難・細節推理</option>
              </select>
            </label>
          </div>
          <p class="setup-mode-hint" role="status">此設定還有 {{ remainingUndercoverPairs }} / {{ availableUndercoverPairs.length }} 組未玩；優先避開用過的詞。</p>
        </template>
        <section class="setup-panel">
          <header class="setup-panel__header">
            <div><span>01</span><h2>玩家</h2><small>{{ undercoverSession.setup.playerNames.length }} / 12</small></div>
            <UsersRound :size="22" />
          </header>
          <div class="player-inputs">
            <label v-for="(_, index) in undercoverSession.setup.playerNames" :key="index" class="player-input">
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <input v-model.trim="undercoverSession.setup.playerNames[index]" type="text" maxlength="18" :aria-label="`玩家 ${index + 1} 名稱`" autocomplete="off" />
              <button type="button" :disabled="undercoverSession.setup.playerNames.length <= 4" :aria-label="`移除玩家 ${index + 1}`" @click="removePlayer(index)"><Trash2 :size="17" /></button>
            </label>
          </div>
          <button v-if="undercoverSession.setup.playerNames.length < 12" class="add-player" type="button" @click="addPlayer"><Plus :size="18" /> 新增玩家</button>
          <PlayerRosterHistory @select="applyRecentRoster" />
        </section>

        <section class="setup-panel">
          <header class="setup-panel__header"><div><span>02</span><h2>詞語主題</h2></div><Sparkles :size="21" /></header>
          <CategoryPicker v-model="undercoverSession.setup.category" :options="categoryOptions" />
        </section>

        <section class="setup-panel">
          <header class="setup-panel__header"><div><span>03</span><h2>臥底人數</h2><small>9 人以上建議 2 名</small></div><Fingerprint :size="21" /></header>
          <div class="undercover-count-picker" role="group" aria-label="臥底人數">
            <button type="button" :class="{ active: undercoverSession.setup.undercoverCount === 1 }" @click="undercoverSession.setup.undercoverCount = 1">1 名臥底</button>
            <button type="button" :disabled="undercoverSession.setup.playerNames.length < 6" :class="{ active: undercoverSession.setup.undercoverCount === 2 }" @click="undercoverSession.setup.undercoverCount = 2">2 名臥底</button>
          </div>
          <div class="undercover-blank-toggle">
            <ToggleSwitch v-model="undercoverSession.setup.blankEnabled" label="加入白板" description="白板沒有詞，只能從其他人的描述即興推理；至少需要 5 人。" :disabled="undercoverSession.setup.playerNames.length < 5" />
          </div>
          <p class="undercover-setup-note">臥底彼此不知道對方身分；除白板外，每位玩家只會看到自己的詞，不會直接看到陣營。</p>
        </section>

        <template #feedback>
          <div v-if="validation.errors.length" class="validation-box validation-box--error"><AlertTriangle :size="20" /><div><p v-for="error in validation.errors" :key="error">{{ error }}</p></div></div>
          <div v-if="availableUndercoverPairs.length && !remainingUndercoverPairs" class="undercover-deck-exhausted">
            <p role="status">這份題庫都玩過了。換主題或難度，或確認重洗後再抽。</p>
            <GameButton variant="secondary" @click="resetConfirmationOpen = true">重新洗這份題庫</GameButton>
          </div>
        </template>
        <template #action><GameButton type="submit" block :disabled="!validation.valid || !remainingUndercoverPairs">抽詞並分配<template #trailing><ArrowRight :size="20" /></template></GameButton></template>
        <template #note><p class="setup-privacy">身份只留在記憶體；抽題紀錄保存在這台裝置。</p></template>
      </SetupFlow>
    </div>
    <GameModal :open="resetConfirmationOpen" title="重新洗這份題庫？" @close="resetConfirmationOpen = false">
      <p>只清除目前主題與難度的抽題紀錄，其他題庫不受影響。重洗後可能再次遇到玩過的詞。</p>
      <template #footer><div class="modal-actions"><GameButton variant="secondary" @click="resetConfirmationOpen = false">先不要</GameButton><GameButton @click="resetDeck">確認重洗</GameButton></div></template>
    </GameModal>
  </div>
</template>
