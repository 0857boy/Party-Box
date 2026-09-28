import { computed } from 'vue'
import { preferences } from '@/stores/preferences'

type SoundChannel = 'music' | 'sfx' | 'voice'

const contexts = new Map<SoundChannel, HTMLAudioElement>()

function effectiveVolume(channel: SoundChannel): number {
  if (preferences.audio.muted) return 0
  const channelVolume = channel === 'music'
    ? preferences.audio.musicVolume
    : channel === 'voice'
      ? preferences.audio.voiceVolume
      : preferences.audio.sfxVolume
  return preferences.audio.masterVolume * channelVolume
}

export function useAudioManager() {
  const isMuted = computed(() => preferences.audio.muted)

  function toggleMute(): void {
    preferences.audio.muted = !preferences.audio.muted
    contexts.forEach((audio, channel) => { audio.volume = effectiveVolume(channel) })
  }

  function play(src: string, channel: SoundChannel = 'sfx'): void {
    const audio = new Audio(src)
    audio.volume = effectiveVolume(channel)
    contexts.set(channel, audio)
    void audio.play().catch(() => undefined)
  }

  function haptic(pattern: number | number[] = 35): void {
    if ('vibrate' in navigator) navigator.vibrate(pattern)
  }

  return { isMuted, toggleMute, play, haptic, preferences }
}
