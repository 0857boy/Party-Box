import { describe, expect, it } from 'vitest'
import { recordingMimeType } from './useLocalRecording'
import { recordingFilename } from '@/utils/localRecordings'

describe('portable local recording formats', () => {
  it('prefers Safari-friendly MP4 and falls back to WebM or the browser default', () => {
    expect(recordingMimeType({ isTypeSupported: type => type === 'video/mp4' })).toBe('video/mp4')
    expect(recordingMimeType({ isTypeSupported: type => type.startsWith('video/webm') })).toBe('video/webm;codecs=vp8,opus')
    expect(recordingMimeType({ isTypeSupported: () => false })).toBeUndefined()
  })
  it('downloads with a filename matching the actual recorded format', () => {
    const base = { id: 'clip', createdAt: 123, label: 'test', durationSeconds: 30 }
    expect(recordingFilename({ ...base, blob: new Blob([], { type: 'video/mp4' }) })).toBe('PartyBox-123.mp4')
    expect(recordingFilename({ ...base, blob: new Blob([], { type: 'video/webm;codecs=vp8,opus' }) })).toBe('PartyBox-123.webm')
  })
})
