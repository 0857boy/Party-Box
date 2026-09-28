import { reactive, watch } from 'vue'
import { loadVersioned, saveVersioned } from '@/utils/storage'

export interface AudioPreferences {
  muted: boolean
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  voiceVolume: number
}

interface Preferences {
  audio: AudioPreferences
  reduceDecorativeMotion: boolean
  themePreference: 'dark'
}

const STORAGE_KEY = 'party-box:preferences'
const VERSION = 2

const defaults: Preferences = {
  audio: { muted: false, masterVolume: 0.75, musicVolume: 0.5, sfxVolume: 0.85, voiceVolume: 0.85 },
  reduceDecorativeMotion: false,
  themePreference: 'dark'
}

export const preferences = reactive(loadVersioned(STORAGE_KEY, VERSION, defaults))

watch(preferences, (value) => saveVersioned(STORAGE_KEY, VERSION, value), { deep: true })
