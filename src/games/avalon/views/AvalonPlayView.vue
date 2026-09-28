<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Crown,
  Eye,
  Flag,
  Shield,
  Skull,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  UsersRound,
  X
} from '@lucide/vue'
import GameHeader from '@/components/game/GameHeader.vue'
import PassDevice from '@/components/game/PassDevice.vue'
import PlayerChip from '@/components/player/PlayerChip.vue'
import GameButton from '@/components/ui/GameButton.vue'
import GameModal from '@/components/ui/GameModal.vue'
import AvalonScoreBoard from '../components/AvalonScoreBoard.vue'
import {
  assassinationCandidates,
  assassinPlayer,
  avalonSession,
  beginVoting,
  completeAssassination,
  completeLadyInspection,
  continueAfterMission,
  continueAfterVote,
  currentLeader,
  currentMissionPlayer,
  ladyHolder,
  recordVoteResult,
  requiredTeamSize,
  selectLadyTarget,
  showAssassination,
  showLadyResult,
  showMissionChoice,
  submitMissionChoice,
  toggleTeamPlayer
} from '../stores/session'
import type { AssignedPlayer } from '../types'
import type { MissionChoice } from '../types'

const router = useRouter()
const assassinationTargetId = ref('')
const assassinationConfirmOpen = ref(false)
const missionRuleNotice = ref(false)
const game = computed(() => avalonSession.gameplay)
const latestProposal = computed(() => game.value?.proposals.at(-1))
const latestMission = computed(() => [...(game.value?.proposals ?? [])].reverse().find((proposal) => proposal.outcome))
const ladyTarget = computed(() => avalonSession.players.find((player) => player.id === game.value?.ladyTargetId))
const assassinationTarget = computed(() => avalonSession.players.find((player) => player.id === assassinationTargetId.value))

const phaseTitle = computed(() => {
  const phase = game.value?.phase
  if (phase?.startsWith('vote')) return '隊伍表決'
  if (phase?.startsWith('mission')) return '執行任務'
  if (phase?.startsWith('lady')) return '湖中女神'
  if (phase?.startsWith('assassination')) return '最終刺殺'
  return '領袖選隊'
})

function playerById(id: string): AssignedPlayer | undefined {
  return avalonSession.players.find((player) => player.id === id)
}

function chooseMission(choice: MissionChoice): void {
  if (currentMissionPlayer.value?.role.team === 'good' && choice === 'fail') {
    missionRuleNotice.value = true
    window.setTimeout(() => { missionRuleNotice.value = false }, 1800)
    return
  }
  missionRuleNotice.value = false
  submitMissionChoice(choice)
}

function afterVote(): void {
  continueAfterVote()
  if (game.value?.phase === 'result') void router.replace({ name: 'avalon-result' })
}

function afterMission(): void {
  continueAfterMission()
  if (game.value?.phase === 'result') void router.replace({ name: 'avalon-result' })
}

async function finishAssassination(): Promise<void> {
  if (!assassinationTargetId.value) return
  assassinationConfirmOpen.value = false
  await nextTick()
  await new Promise((resolve) => window.setTimeout(resolve, 320))
  completeAssassination(assassinationTargetId.value)
  void router.replace({ name: 'avalon-result' })
}
</script>

<template>
  <div v-if="game" class="game-page play-page">
    <GameHeader :title="phaseTitle" :step="`AVALON · ROUND ${game.round}`" />
    <div class="play-layout page-container">
      <AvalonScoreBoard :state="game" :player-count="avalonSession.players.length" />

      <main class="play-stage">
        <section v-if="game.phase === 'team-selection'" class="phase-panel">
          <span class="eyebrow"><Crown :size="15" /> LEADER'S TURN</span>
          <h1><em>{{ currentLeader?.name }}</em><br />選擇任務隊伍</h1>
          <p>本回合需要選出 <strong>{{ requiredTeamSize }}</strong> 位玩家。領袖可以選擇自己。</p>
          <div class="selection-grid" role="group" aria-label="任務隊伍">
            <button
              v-for="(player, index) in avalonSession.players"
              :key="player.id"
              type="button"
              :aria-pressed="game.selectedTeamIds.includes(player.id)"
              :class="{ active: game.selectedTeamIds.includes(player.id) }"
              @click="toggleTeamPlayer(player.id)"
            >
              <span>{{ index + 1 }}</span>
              <strong>{{ player.name }}</strong>
              <Check v-if="game.selectedTeamIds.includes(player.id)" :size="18" />
            </button>
          </div>
          <div class="selection-status"><UsersRound :size="17" /> 已選 {{ game.selectedTeamIds.length }} / {{ requiredTeamSize }} 人</div>
          <GameButton block :disabled="game.selectedTeamIds.length !== requiredTeamSize" @click="beginVoting">
            確認隊伍，開始投票<template #trailing><ArrowRight :size="19" /></template>
          </GameButton>
        </section>

        <section v-else-if="game.phase === 'voting'" class="phase-panel phase-panel--center">
          <span class="eyebrow">TABLE VOTE</span>
          <h1>所有玩家<br /><em>同時表決</em></h1>
          <div class="proposed-team">
            <PlayerChip v-for="playerId in game.selectedTeamIds" :key="playerId" :name="playerById(playerId)?.name ?? ''" />
          </div>
          <p>請在現實中同時比出贊成或反對。贊成票必須過半；平票視為否決，再由領袖登記結果。</p>
          <div class="choice-grid">
            <button class="choice-card choice-card--approve" type="button" @click="recordVoteResult(true)"><ThumbsUp :size="32" /><strong>隊伍通過</strong><span>贊成票過半</span></button>
            <button class="choice-card choice-card--reject" type="button" @click="recordVoteResult(false)"><ThumbsDown :size="32" /><strong>隊伍否決</strong><span>平票或反對較多</span></button>
          </div>
        </section>

        <section v-else-if="game.phase === 'vote-result' && latestProposal" class="phase-panel phase-panel--center">
          <div class="result-emblem" :class="latestProposal.approved ? 'result-emblem--success' : 'result-emblem--fail'">
            <Check v-if="latestProposal.approved" :size="42" /><X v-else :size="42" />
          </div>
          <span class="eyebrow">VOTE RESULT</span>
          <h1>隊伍{{ latestProposal.approved ? '通過' : '遭到否決' }}</h1>
          <p>已登記本次實體同步表決結果。</p>
          <div v-if="!latestProposal.approved" class="rule-alert"><AlertTriangle :size="18" />已連續否決 {{ game.rejectionCount }} / 5 次</div>
          <GameButton block @click="afterVote">{{ latestProposal.approved ? '進入任務' : game.rejectionCount >= 5 ? '查看遊戲結果' : '交給下一位領袖' }}</GameButton>
        </section>

        <PassDevice
          v-else-if="game.phase === 'mission-pass' && currentMissionPlayer"
          :player-name="currentMissionPlayer.name"
          :current="game.missionIndex + 1"
          :total="game.missionOrderIds.length"
          message="你是本回合的任務成員。其他玩家請移開視線，任務牌是秘密資訊。"
          privacy-text="每張任務牌都會在提交後立即隱藏"
          @ready="showMissionChoice"
        />

        <section v-else-if="game.phase === 'mission' && currentMissionPlayer" class="phase-panel phase-panel--center">
          <span class="eyebrow"><Flag :size="15" /> SECRET MISSION</span>
          <h1>{{ currentMissionPlayer.name }}，<br /><em>提交任務牌</em></h1>
          <p v-if="currentMissionPlayer.role.team === 'good'">正義陣營必須讓任務成功。點選後卡牌會立即收起。</p>
          <p v-else>你可以讓任務成功以隱藏自己，或秘密破壞任務。</p>
          <div class="mission-choice-grid">
            <button
              v-for="choice in game.missionChoiceOrder"
              :key="choice"
              type="button"
              class="mission-card"
              :class="`mission-card--${choice}`"
              :aria-disabled="currentMissionPlayer.role.team === 'good' && choice === 'fail'"
              @click="chooseMission(choice)"
            >
              <component :is="choice === 'success' ? Shield : Skull" :size="36" />
              <strong>{{ choice === 'success' ? '任務成功' : '任務失敗' }}</strong>
              <span>{{ choice === 'success' ? 'SUCCESS' : 'FAIL' }}</span>
            </button>
          </div>
          <div v-if="missionRuleNotice" class="rule-alert"><AlertTriangle :size="18" />正義陣營不能提交任務失敗牌</div>
        </section>

        <section v-else-if="game.phase === 'mission-result' && latestMission" class="phase-panel phase-panel--center">
          <div class="result-emblem" :class="latestMission.outcome === 'success' ? 'result-emblem--success' : 'result-emblem--fail'">
            <Shield v-if="latestMission.outcome === 'success'" :size="42" /><Skull v-else :size="42" />
          </div>
          <span class="eyebrow">MISSION {{ game.round }} RESULT</span>
          <h1>任務{{ latestMission.outcome === 'success' ? '成功' : '失敗' }}</h1>
          <p>任務牌已洗混，只公開張數，不會揭露任何玩家的選擇。</p>
          <div class="mission-card-summary">
            <span v-for="(choice, index) in latestMission.missionChoices" :key="index" :class="`summary-card--${choice}`"><component :is="choice === 'success' ? Shield : Skull" :size="20" />{{ choice === 'success' ? '成功' : '失敗' }}</span>
          </div>
          <small v-if="latestMission.requiredFails === 2">本回合需要 2 張失敗牌才會讓任務失敗。</small>
          <GameButton block @click="afterMission">繼續<template #trailing><ArrowRight :size="19" /></template></GameButton>
        </section>

        <section v-else-if="game.phase === 'lady-select' && ladyHolder" class="phase-panel">
          <span class="eyebrow"><Sparkles :size="15" /> LADY OF THE LAKE</span>
          <h1><em>{{ ladyHolder.name }}</em><br />選擇檢視對象</h1>
          <p>你將秘密得知一名玩家的陣營。已被湖中女神檢視過的玩家不能再次被選擇。</p>
          <div class="selection-grid">
            <button
              v-for="player in avalonSession.players"
              :key="player.id"
              type="button"
              :disabled="player.id === game.ladyHolderId || game.ladySeenPlayerIds.includes(player.id)"
              @click="selectLadyTarget(player.id)"
            ><Eye :size="17" /><strong>{{ player.name }}</strong></button>
          </div>
        </section>

        <PassDevice
          v-else-if="game.phase === 'lady-pass' && ladyHolder"
          :player-name="ladyHolder.name"
          :current="1"
          :total="1"
          :message="`你即將查看 ${ladyTarget?.name ?? ''} 的真實陣營。其他玩家請移開視線。`"
          privacy-text="被檢視的玩家必須誠實提供陣營"
          @ready="showLadyResult"
        />

        <section v-else-if="game.phase === 'lady-reveal' && ladyTarget" class="phase-panel phase-panel--center">
          <span class="eyebrow"><Sparkles :size="15" /> LOYALTY REVEALED</span>
          <h1>{{ ladyTarget.name }}<br />屬於<em>{{ ladyTarget.role.team === 'good' ? '正義陣營' : '邪惡陣營' }}</em></h1>
          <p>你只知道陣營，不會得知具體角色。記住後請安全蓋牌。</p>
          <GameButton block @click="completeLadyInspection">我記住了，進入下一回合</GameButton>
        </section>

        <PassDevice
          v-else-if="game.phase === 'assassination-pass' && assassinPlayer"
          :player-name="assassinPlayer.name"
          :current="1"
          :total="1"
          message="正義已完成三次任務，但遊戲還沒結束。請將裝置交給刺客。"
          privacy-text="刺客將做出本局最後一次選擇"
          @ready="showAssassination"
        />

        <section v-else-if="game.phase === 'assassination' && assassinPlayer" class="phase-panel phase-panel--center assassination-panel">
          <span class="eyebrow"><Target :size="15" /> FINAL ASSASSINATION</span>
          <h1>找出<em>梅林</em></h1>
          <p>{{ assassinPlayer.name }}，選擇你認為是梅林的玩家。刺殺成功，邪惡將逆轉獲勝。</p>
          <div class="selection-grid">
            <button
            v-for="player in assassinationCandidates"
              :key="player.id"
              type="button"
              :class="{ active: assassinationTargetId === player.id }"
              @click="assassinationTargetId = player.id"
            ><Target :size="17" /><strong>{{ player.name }}</strong><Check v-if="assassinationTargetId === player.id" :size="17" /></button>
          </div>
          <GameButton block variant="danger" :disabled="!assassinationTargetId" @click="assassinationConfirmOpen = true">確認刺殺目標</GameButton>
        </section>
      </main>
    </div>

    <GameModal :open="assassinationConfirmOpen" title="確認最終刺殺" @close="assassinationConfirmOpen = false">
      <div class="confirm-assassination"><Target :size="38" /><p>刺客確定要刺殺 <strong>{{ assassinationTarget?.name }}</strong>？確認後會立即結算並公開所有身份。</p></div>
      <template #footer><div class="modal-actions"><GameButton variant="secondary" @click="assassinationConfirmOpen = false">再想一下</GameButton><GameButton variant="danger" @click="finishAssassination">確認刺殺</GameButton></div></template>
    </GameModal>
  </div>
</template>
