<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Check, EyeOff, HelpCircle, Palette } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import ActionDock from '@/components/game/ActionDock.vue'
import HoldToReveal from '@/components/game/HoldToReveal.vue'
import PassDevice from '@/components/game/PassDevice.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { advanceFakeArtistReveal, currentFakeArtistRevealPlayer, fakeArtistSession } from '../stores/session'

type Stage = 'pass' | 'hold' | 'revealed'
const stage = ref<Stage>('pass')
const router = useRouter()
const game = computed(() => fakeArtistSession.game)
const currentNumber = computed(() => fakeArtistSession.currentRevealIndex + 1)
const isLast = computed(() => fakeArtistSession.currentRevealIndex === fakeArtistSession.players.length - 1)
const isFake = computed(() => currentFakeArtistRevealPlayer.value?.id === game.value?.fakePlayerId)

function continueReveal(): void {
  stage.value = 'pass'
  advanceFakeArtistReveal()
  if (game.value?.phase === 'draw-pass') void router.replace({ name: 'fake-artist-play' })
}
</script>

<template>
  <div v-if="game" class="game-page fake-artist-page">
    <GameHeader title="秘密題目" :step="`FAKE ARTIST · ${currentNumber}/${fakeArtistSession.players.length}`" />
    <main v-if="currentFakeArtistRevealPlayer" class="reveal-main page-container page-container--game">
      <Transition name="reveal-stage" mode="out-in">
        <PassDevice v-if="stage === 'pass'" :key="`fake-pass-${currentFakeArtistRevealPlayer.id}`" :player-name="currentFakeArtistRevealPlayer.name" :current="currentNumber" :total="fakeArtistSession.players.length" message="其他玩家請移開視線。等等不要說出看到的內容。" privacy-text="看完後會立即隱藏" @ready="stage = 'hold'" />
        <section v-else :key="`fake-role-${currentFakeArtistRevealPlayer.id}`" class="undercover-reveal-stage">
          <div class="identity-owner"><span>現在查看</span><strong>{{ currentFakeArtistRevealPlayer.name }}</strong></div>
          <div class="fake-role-card">
            <div v-if="stage !== 'revealed'" class="fake-role-card__back"><Palette :size="74" /><strong>你的題目藏在這裡</strong><small>按住下方按鈕揭露</small></div>
            <div v-else class="fake-role-card__front"><span>類別 · {{ game.prompt.categoryName }}</span><HelpCircle v-if="isFake" :size="72" /><Palette v-else :size="72" /><small>{{ isFake ? '你的身份' : '共同題目' }}</small><h1>{{ isFake ? '假畫家' : game.prompt.answer }}</h1><p>{{ isFake ? '觀察其他人的線條，假裝你知道答案' : '畫得讓同伴看懂，但別讓假畫家猜到' }}</p></div>
          </div>
          <ActionDock><HoldToReveal v-if="stage === 'hold'" @revealed="stage = 'revealed'" />
          <template v-else><div class="hide-warning"><EyeOff :size="18" /><span>記住內容，不要念出來。</span></div><GameButton block @click="continueReveal"><template #icon><Check :size="20" /></template>{{ isLast ? '我記住了，開始作畫' : '我記住了，交給下一位' }}</GameButton></template></ActionDock>
        </section>
      </Transition>
    </main>
  </div>
</template>
