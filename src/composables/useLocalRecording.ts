import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { saveRecording, type LocalRecording } from '@/utils/localRecordings'

export function recordingMimeType(api: Pick<typeof MediaRecorder, 'isTypeSupported'>): string | undefined {
  return ['video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm'].find(type => api.isTypeSupported(type))
}

export function useLocalRecording() {
  const recording = ref(false)
  const pending = ref(false)
  const message = ref('')
  const clip = shallowRef<LocalRecording | null>(null)
  let stream: MediaStream | undefined
  let recorder: MediaRecorder | undefined
  let disposed = false
  let generation = 0
  let completion: Promise<void> | undefined
  let startedAt = 0

  function releaseCamera(): void {
    stream?.getTracks().forEach(track => track.stop())
    stream = undefined
  }

  async function prepare(withAudio: boolean): Promise<boolean> {
    if (pending.value) return false
    clip.value = null
    message.value = ''
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      message.value = '錄影需要 HTTPS 與相機支援；這回合不錄影，遊戲仍可進行。'
      return false
    }
    if (typeof MediaRecorder === 'undefined') {
      message.value = '此瀏覽器不支援錄影；這回合不錄影。'
      return false
    }
    pending.value = true
    const token = ++generation
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
        audio: withAudio
      })
      if (disposed || token !== generation) { acquired.getTracks().forEach(track => track.stop()); return false }
      stream = acquired
      const mimeType = recordingMimeType(MediaRecorder)
      recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 1_000_000 })
      return true
    } catch {
      releaseCamera()
      message.value = '未取得相機／麥克風，或錄影不可用。這回合不錄影；可調整權限後重試。'
      return false
    } finally { if (token === generation) pending.value = false }
  }

  function start(label: string): void {
    if (!recorder || recorder.state !== 'inactive' || !stream) return
    const instance = recorder
    const chunks: Blob[] = []
    startedAt = Date.now()
    completion = new Promise(resolve => {
      instance.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      instance.onerror = () => {
        message.value = '錄影中斷；若有完整片段會保留下來。'
        recording.value = false
        releaseCamera()
        resolve()
      }
      instance.onstop = async () => {
        recording.value = false
        releaseCamera()
        const blob = new Blob(chunks, { type: instance.mimeType || chunks[0]?.type || 'video/webm' })
        if (!blob.size) { message.value = '沒有可儲存的錄影片段。'; resolve(); return }
        const saved: LocalRecording = { id: crypto.randomUUID(), createdAt: startedAt, label, blob, durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)) }
        clip.value = saved
        try {
          await saveRecording(saved)
          message.value = '已保存在此裝置；不會上傳。重要片段請下載備份。'
        } catch {
          message.value = '裝置空間不足或儲存不可用；離開前請先下載這段影片。'
        }
        resolve()
      }
      try { instance.start(1000); recording.value = true }
      catch { message.value = '錄影無法開始；遊戲繼續，不錄影。'; releaseCamera(); resolve() }
    })
  }

  async function stop(): Promise<void> {
    if (recorder?.state === 'recording' || recorder?.state === 'paused') {
      try { recorder.stop() } catch { releaseCamera() }
      releaseCamera()
    } else if (!completion) releaseCamera()
    await completion
    recorder = undefined
    completion = undefined
  }

  function cancelPreparation(): void {
    ++generation
    pending.value = false
    releaseCamera()
    recorder = undefined
  }

  onBeforeUnmount(() => {
    disposed = true
    ++generation
    void stop()
  })
  return { recording, pending, message, clip, prepare, start, stop, cancelPreparation }
}
