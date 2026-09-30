<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Check, EyeOff, Fingerprint, HelpCircle, Tag } from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import HoldToReveal from '@/components/game/HoldToReveal.vue'
import PassDevice from '@/components/game/PassDevice.vue'
import GameButton from '@/components/ui/GameButton.vue'
import { categoryName, currentUndercoverPlayer, undercoverSession } from '../stores/session'

type RevealStage = 'pass' | 'hold' | 'revealed'
const stage = ref<RevealStage>('pass')
const router = useRouter()
const currentNumber = computed(() => undercoverSession.currentRevealIndex + 1)
const isLast = computed(() => undercoverSession.currentRevealIndex === undercoverSession.players.length - 1)
const category = computed(() => undercoverSession.gameplay ? categoryName(undercoverSession.gameplay.category) : '')

function hideAndContinue(): void {
  stage.value = 'pass'
  if (isLast.value) {
    void router.replace({ name: 'undercover-play' })
    return
  }
  undercoverSession.currentRevealIndex += 1
}
</script>

<template>
  <div class="game-page undercover-page">
    <GameHeader title="秘密抽詞" :step="`UNDERCOVER · ${currentNumber}/${undercoverSession.players.length}`" />
    <main v-if="currentUndercoverPlayer" class="reveal-main page-container page-container--game">
      <Transition name="reveal-stage" mode="out-in">
        <PassDevice
          v-if="stage === 'pass'"
          :key="`undercover-pass-${currentUndercoverPlayer.id}`"
          :player-name="currentUndercoverPlayer.name"
          :current="currentNumber"
          :total="undercoverSession.players.length"
          message="其他玩家請移開視線。你只會看到自己的詞，不會知道自己是不是臥底。"
          privacy-text="記住詞語後不要念出來"
          @ready="stage = 'hold'"
        />
        <section v-else :key="`undercover-word-${currentUndercoverPlayer.id}`" class="undercover-reveal-stage">
          <div class="identity-owner"><span>現在查看</span><strong>{{ currentUndercoverPlayer.name }}</strong></div>
          <div class="secret-word-card" :class="{ 'secret-word-card--revealed': stage === 'revealed' }">
            <div v-if="stage !== 'revealed'" class="secret-word-card__back"><Fingerprint :size="74" /><strong>你的詞藏在這裡</strong><small>按住下方按鈕揭露</small></div>
            <div v-else class="secret-word-card__front"><span><Tag :size="16" />{{ category }}</span><small>你的秘密詞語</small><h1>{{ currentUndercoverPlayer.word }}</h1><p><HelpCircle :size="17" />你不知道自己是平民還是臥底</p></div>
          </div>
          <HoldToReveal v-if="stage === 'hold'" @revealed="stage = 'revealed'" />
          <template v-else>
            <div class="hide-warning"><EyeOff :size="18" /><span>確認記住詞語後，系統會立即隱藏。</span></div>
            <GameButton block @click="hideAndContinue"><template #icon><Check :size="20" /></template>{{ isLast ? '我記住了，開始遊戲' : '我記住了，交給下一位' }}</GameButton>
          </template>
        </section>
      </Transition>
    </main>
  </div>
</template>
