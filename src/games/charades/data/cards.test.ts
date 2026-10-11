import { describe, expect, it } from 'vitest'
import { charadesCards, charadesCategories, getCharadesCards, normalizeCharadesCategory } from './cards'
import { defineCards } from './defineCards'
import { normalizeCharadesLabel, validateCharadesCards } from './quality'
import sourceChecks from './source-checks.json'
import { cardsForCategory } from '../logic/game'
import type { CharadesCard } from '../types'

describe('charades content quality', () => {
  it('ships ten real categories and a derived mixed pool of over 1,200 reviewed short words', () => {
    expect(charadesCategories).toHaveLength(11)
    expect(charadesCards.length).toBeGreaterThanOrEqual(1200)
    expect(validateCharadesCards(charadesCards)).toEqual([])
    expect(getCharadesCards('mixed')).toEqual(charadesCards)
    expect(getCharadesCards('mixed')).not.toBe(charadesCards)
    for (const category of charadesCategories.filter(item => item.id !== 'mixed')) {
      const pool = getCharadesCards(category.id)
      expect(pool.length, category.id).toBeGreaterThanOrEqual(70)
      for (const difficulty of ['easy', 'normal', 'hard'] as const) {
        expect(cardsForCategory(category.id, difficulty).length, `${category.id}/${difficulty}`).toBeGreaterThanOrEqual(20)
      }
    }
  })

  it('preserves classification boundaries for animals, actions, jobs, sports, emotions and people', () => {
    const expected = {
      '螞蟻': 'animals', '螳螂': 'animals', '企鵝': 'animals', '金魚': 'animals',
      '醫生': 'jobs', '警察': 'jobs', '空服員': 'jobs', '太空人': 'jobs',
      '游泳': 'sports', '滑雪': 'sports', '攀岩': 'sports', '伏地挺身': 'sports',
      '刷牙': 'life', '洗澡': 'life', '追垃圾車': 'life', '晾衣服': 'life',
      '開心': 'emotions', '嚇一跳': 'emotions', '哈哈大笑': 'emotions',
      '手忙腳亂': 'idioms', '目瞪口呆': 'idioms', '井底之蛙': 'idioms', '守株待兔': 'idioms',
      '周杰倫': 'celebrities', '蔡依林': 'celebrities', '愛因斯坦': 'celebrities', '牛頓': 'celebrities',
      '皮卡丘': 'characters', '白雪公主': 'characters', '電風扇': 'things', '沙發': 'things'
    }
    for (const [label, category] of Object.entries(expected)) {
      expect(charadesCards.find(card => card.label === label)?.category, label).toBe(category)
    }
  })

  it('keeps independent immutable IDs when names or categories are corrected', () => {
    const group = { difficulty: 'easy' as const, tags: ['測試'], entries: 'x001:貓' }
    const before = defineCards('animals', [group])[0]!
    const after = defineCards('things', [{ ...group, entries: 'x001:手機' }])[0]!
    expect(before.id).toBe(after.id)
    expect(before.id).not.toContain(before.label)
    expect(() => defineCards('animals', [{ ...group, entries: '缺少ID' }])).toThrow()
  })

  it('detects NFKC, whitespace, letter-case and reviewed alias duplicates across categories', () => {
    expect(normalizeCharadesLabel('哆啦Ａ夢')).toBe(normalizeCharadesLabel('哆啦a夢'))
    expect(normalizeCharadesLabel('  紅豆餅 ')).toBe(normalizeCharadesLabel('車輪餅'))
    expect(normalizeCharadesLabel('皮諾丘')).toBe(normalizeCharadesLabel('匹諾曹'))
    const cards = defineCards('food', [{ difficulty: 'easy', tags: ['小吃'], entries: 'x001:紅豆餅 x002:車輪餅' }])
    expect(validateCharadesCards(cards)).toContain('題目或別名重複：車輪餅')
    expect(validateCharadesCards([cards[0]!, cards[0]!]).some(error => error.startsWith('ID 重複'))).toBe(true)
  })

  it('rejects unverified idioms, wrong classifications, mixed records, long sentences and simplified characters', () => {
    const card = charadesCards.find(item => item.label === '刷牙')!
    const bad = [
      { ...card, category: 'idioms', label: '哈哈大笑' },
      { ...card, category: 'life', label: '醫生' },
      { ...card, category: 'mixed' },
      { ...card, label: '下雨天趕快追垃圾車' },
      { ...card, label: '开心' },
      { ...card, difficulty: 'impossible', tags: [] }
    ] as CharadesCard[]
    for (const invalid of bad) expect(validateCharadesCards([invalid]).length).toBeGreaterThan(0)
  })

  it('covers every idiom with an exact headword and keeps all recorded source IDs live', () => {
    const entries = sourceChecks.entries
    expect(Object.keys(entries).length).toBeGreaterThan(600)
    for (const [id, check] of Object.entries(entries)) {
      expect(charadesCards.find(card => card.id === id)?.label, id).toBe(check.term)
      expect(check.row).toBeGreaterThan(1)
    }
    for (const card of getCharadesCards('idioms')) {
      expect((entries as Record<string, { term: string; source: string }>)[card.id]).toMatchObject({ term: card.label, source: 'moe-idioms' })
    }
  })

  it('keeps existing preferences and safely normalizes unknown saved categories', () => {
    for (const category of charadesCategories) expect(normalizeCharadesCategory(category.id)).toBe(category.id)
    expect(normalizeCharadesCategory('life')).toBe('life')
    expect(normalizeCharadesCategory('removed-deck')).toBe('mixed')
    expect(normalizeCharadesCategory(null)).toBe('mixed')
  })
})
