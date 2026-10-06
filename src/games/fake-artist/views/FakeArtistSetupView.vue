<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, ArrowRight, Palette, Plus, Target, Trash2, UsersRound } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import SetupFlow from '@/components/game/SetupFlow.vue'
import CategoryPicker from '@/components/game/CategoryPicker.vue'
import PlayerRosterHistory from '@/components/player/PlayerRosterHistory.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { normalizeRosterForGame, playerRosterStore } from '@/stores/playerRosters'
import { fakeArtistCategories } from '../data/prompts'
import { validateFakeArtistSetup } from '../logic/game'
import { fakeArtistSession, startFakeArtistGame } from '../stores/session'
import type { FakeArtistCategory } from '../types'

const router = useRouter()
const errors = computed(() => validateFakeArtistSetup(fakeArtistSession.setup))
const categoryOptions = fakeArtistCategories.map(category => ({ ...category, id: category.id as FakeArtistCategory }))

function addPlayer(): void {
  if (fakeArtistSession.setup.playerNames.length >= 10) return
  fakeArtistSession.setup.playerNames.push(`玩家 ${fakeArtistSession.setup.playerNames.length + 1}`)
}

function removePlayer(index: number): void {
  if (fakeArtistSession.setup.playerNames.length <= 5) return
  fakeArtistSession.setup.playerNames.splice(index, 1)
}

function applyRoster(names: string[]): void {
  fakeArtistSession.setup.playerNames = normalizeRosterForGame(names, 5, 10)
}

function start(): void {
  if (errors.value.length) return
  startFakeArtistGame()
  void router.push({ name: 'fake-artist-reveal' })
}

onMounted(() => {
  if (playerRosterStore.currentNames.length && playerRosterStore.currentNames.join('\u0000') !== fakeArtistSession.setup.playerNames.join('\u0000')) applyRoster(playerRosterStore.currentNames)
})
</script>

<template>
  <div class="game-page fake-artist-page">
    <GameHeader title="遊戲設定" step="FAKE ARTIST · SETUP" />
    <div class="setup-layout page-container page-container--game">
      <section class="setup-intro fake-artist-intro">
        <span class="eyebrow"><Palette :size="15" /> ONE CANVAS. ONE IMPOSTOR.</span>
        <h1>大家都會畫，<br /><em>只有一個人不知道。</em></h1>
        <p>每人輪流在共同畫布上留下一筆。真正畫家要證明自己知道答案，卻又不能畫得太明顯。</p>
        <div class="undercover-rule-card"><strong>快速規則</strong><span>① 偷看題目或假畫家身份</span><span>② 每人一筆，共畫兩輪</span><span>③ 同步指認，假畫家反猜答案</span></div>
        <details class="undercover-rules-details">
          <summary>查看完整規則</summary>
          <ol>
            <li><strong>系統出題：</strong>Party Box 代替原版出題者，所有玩家都能參與作畫。</li>
            <li><strong>秘密身份：</strong>真正畫家看到類別與答案；假畫家只知道類別。</li>
            <li><strong>共同作畫：</strong>玩家依序各畫一條不間斷的線，完整進行兩輪。</li>
            <li><strong>同步指認：</strong>畫完後所有人同時指出假畫家；最高票平票視為沒抓到。</li>
            <li><strong>最後反猜：</strong>假畫家若被唯一最高票抓到，仍有一次猜答案的翻盤機會。</li>
            <li><strong>計分：</strong>假畫家逃脫或猜中得 2 分；否則每位真正畫家得 1 分。</li>
          </ol>
        </details>
      </section>

      <SetupFlow :steps="['玩家', '主題', '勝利分數']" :summary="`${fakeArtistSession.setup.playerNames.length} 人 · ${categoryOptions.find(option => option.id === fakeArtistSession.setup.category)?.name} · ${fakeArtistSession.setup.targetScore === 1 ? '單局決勝' : `先得 ${fakeArtistSession.setup.targetScore} 分`}`" @submit="start">
        <section class="setup-panel">
          <header class="setup-panel__header"><div><span>01</span><h2>玩家</h2><small>{{ fakeArtistSession.setup.playerNames.length }} / 10</small></div><UsersRound :size="22" /></header>
          <div class="player-inputs">
            <label v-for="(_, index) in fakeArtistSession.setup.playerNames" :key="index" class="player-input"><span>{{ String(index + 1).padStart(2, '0') }}</span><input v-model.trim="fakeArtistSession.setup.playerNames[index]" type="text" maxlength="18" :aria-label="`玩家 ${index + 1} 名稱`" autocomplete="off" /><button type="button" :disabled="fakeArtistSession.setup.playerNames.length <= 5" :aria-label="`移除玩家 ${index + 1}`" @click="removePlayer(index)"><Trash2 :size="17" /></button></label>
          </div>
          <button v-if="fakeArtistSession.setup.playerNames.length < 10" class="add-player" type="button" @click="addPlayer"><Plus :size="18" />新增玩家</button>
          <PlayerRosterHistory @select="applyRoster" />
        </section>

        <section class="setup-panel">
          <header class="setup-panel__header"><div><span>02</span><h2>題目類別</h2></div><Palette :size="21" /></header>
          <CategoryPicker v-model="fakeArtistSession.setup.category" :options="categoryOptions" />
        </section>

        <section class="setup-panel">
          <header class="setup-panel__header"><div><span>03</span><h2>勝利分數</h2></div><Target :size="21" /></header>
          <div class="charades-option-grid"><button v-for="option in [{ score: 1, label: '單局決勝' }, { score: 3, label: '先得 3 分' }, { score: 5, label: '先得 5 分' }]" :key="option.score" type="button" :class="{ active: fakeArtistSession.setup.targetScore === option.score }" @click="fakeArtistSession.setup.targetScore = option.score">{{ option.label }}</button></div>
          <p class="undercover-setup-note">原版以先得 5 分獲勝；聚會時間較短時可選單局或 3 分。</p>
        </section>

        <div v-if="errors.length" class="validation-box validation-box--error"><AlertTriangle :size="20" /><div><p v-for="error in errors" :key="error">{{ error }}</p></div></div>
        <template #action><GameButton type="submit" block :disabled="Boolean(errors.length)">抽題並分配身份<template #trailing><ArrowRight :size="20" /></template></GameButton></template>
      </SetupFlow>
    </div>
  </div>
</template>
