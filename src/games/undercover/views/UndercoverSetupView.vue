<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, ArrowRight, Fingerprint, Plus, Sparkles, Trash2, UsersRound } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import GameButton from '@/components/ui/GameButton.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import PlayerRosterHistory from '@/components/player/PlayerRosterHistory.vue'
import { normalizeRosterForGame, playerRosterStore } from '@/stores/playerRosters'
import { wordCategories } from '../data/words'
import { validateUndercoverSetup } from '../logic/game'
import { startUndercoverGame, syncRecommendedUndercoverCount, undercoverSession } from '../stores/session'
import type { WordCategorySelection } from '../types'

const router = useRouter()
const validation = computed(() => validateUndercoverSetup(undercoverSession.setup))

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

function selectCategory(category: WordCategorySelection): void {
  undercoverSession.setup.category = category
}

function applyRecentRoster(names: string[]): void {
  undercoverSession.setup.playerNames = normalizeRosterForGame(names, 4, 12)
  syncRecommendedUndercoverCount()
}

function start(): void {
  if (!validation.value.valid) return
  startUndercoverGame()
  void router.push({ name: 'undercover-reveal' })
}
</script>

<template>
  <div class="game-page undercover-page undercover-setup-page">
    <GameHeader title="遊戲設定" step="UNDERCOVER · SETUP" />
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
        </details>
      </section>

      <form class="setup-form" @submit.prevent="start">
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
          <div class="word-category-grid">
            <button type="button" :class="{ active: undercoverSession.setup.category === 'funny' }" @click="selectCategory('funny')"><strong>爆笑混合</strong><small>尷尬、感情、職場與網路修羅場</small></button>
            <button type="button" :class="{ active: undercoverSession.setup.category === 'mixed' }" @click="selectCategory('mixed')"><strong>綜合題庫</strong><small>各種題材，以台灣常用詞彙呈現</small></button>
            <button v-for="category in wordCategories" :key="category.id" type="button" :class="{ active: undercoverSession.setup.category === category.id }" @click="selectCategory(category.id)"><strong>{{ category.name }}</strong><small>{{ category.description }}</small></button>
          </div>
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

        <div v-if="validation.errors.length" class="validation-box validation-box--error"><AlertTriangle :size="20" /><div><p v-for="error in validation.errors" :key="error">{{ error }}</p></div></div>
        <GameButton type="submit" block :disabled="!validation.valid">抽詞並分配<template #trailing><ArrowRight :size="20" /></template></GameButton>
        <p class="setup-privacy">詞語與身份只在本局記憶體中使用，重新整理會安全返回設定。</p>
      </form>
    </div>
  </div>
</template>
