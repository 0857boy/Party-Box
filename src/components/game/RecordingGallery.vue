<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { deleteRecording, listRecordings, recordingFilename, type LocalRecording } from '@/utils/localRecordings'

const props = defineProps<{ current?: LocalRecording | null }>()
const clips = ref<LocalRecording[]>([])
const selected = ref<LocalRecording | null>(null)
const previewUrl = ref('')
const message = ref('')
const loading = ref(true)
let disposed = false

async function refresh(): Promise<void> {
  try {
    const saved = await listRecordings()
    if (disposed) return
    clips.value = props.current && !saved.some(clip => clip.id === props.current?.id) ? [props.current, ...saved] : saved
  } catch {
    if (disposed) return
    clips.value = props.current ? [props.current] : []
    message.value = '無法讀取裝置錄影；可下載本回合片段。'
  } finally { loading.value = false }
}

function choose(clip: LocalRecording | null): void {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  selected.value = clip
  previewUrl.value = clip ? URL.createObjectURL(clip.blob) : ''
}

function download(): void {
  if (!selected.value) return
  const link = document.createElement('a')
  link.href = previewUrl.value
  link.download = recordingFilename(selected.value)
  link.click()
}

async function share(): Promise<void> {
  if (!selected.value) return
  const file = new File([selected.value.blob], recordingFilename(selected.value), { type: selected.value.blob.type })
  if (!navigator.canShare?.({ files: [file] })) { message.value = '此瀏覽器無法直接分享影片，請先下載。'; return }
  try { await navigator.share({ files: [file], title: 'Party Box 聚會片段' }) }
  catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) message.value = '分享未完成；可改用下載。' }
}

async function remove(): Promise<void> {
  if (!selected.value || !window.confirm('刪除此裝置的這段錄影？此操作無法復原。')) return
  const id = selected.value.id
  try {
    await deleteRecording(id)
    choose(null)
    clips.value = clips.value.filter(clip => clip.id !== id)
    message.value = '錄影已從此裝置刪除。'
  } catch { message.value = '刪除失敗，請稍後重試。' }
}

watch(() => props.current, () => { void refresh() })
onMounted(() => { void refresh() })
onBeforeUnmount(() => { disposed = true; choose(null) })
</script>

<template>
  <section class="recording-gallery" aria-label="裝置錄影中心">
    <h3>錄影中心 <small>{{ clips.length }} 段</small></h3>
    <p>只存在此瀏覽器，不會上傳。清除網站資料可能遺失，重要片段請下載備份。</p>
    <p v-if="loading">正在讀取…</p><p v-else-if="!clips.length">還沒有錄影。下一回合可在準備畫面開啟。</p>
    <select v-if="clips.length" aria-label="選擇錄影片段" :value="selected?.id ?? ''" @change="choose(clips.find(clip => clip.id === ($event.target as HTMLSelectElement).value) ?? null)">
      <option value="">選擇要觀看的片段</option>
      <option v-for="clip in clips" :key="clip.id" :value="clip.id">{{ new Date(clip.createdAt).toLocaleString('zh-TW') }} · {{ clip.label }} · {{ clip.durationSeconds }} 秒</option>
    </select>
    <template v-if="selected"><video :key="previewUrl" :src="previewUrl" controls playsinline preload="metadata" /><div class="recording-gallery__actions"><button type="button" @click="download">下載影片</button><button type="button" @click="share">分享影片</button><button type="button" @click="remove">刪除片段</button></div></template>
    <p v-if="message" role="status">{{ message }}</p>
  </section>
</template>
