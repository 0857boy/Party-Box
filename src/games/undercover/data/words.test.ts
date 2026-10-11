import { describe, expect, it } from 'vitest'
import { definePairs } from './definePairs'
import { undercoverPairKey, validateUndercoverPairs } from './quality'
import { getUndercoverPairs, normalizeUndercoverCategory, normalizeUndercoverDifficulty, undercoverWordPairs, wordCategories } from './words'
import sourceChecks from './source-checks.json'
import charadesSourceChecks from '../../charades/data/source-checks.json'

describe('undercover vocabulary quality', () => {
  it('ships fourteen editorially checked categories and derives both mixes without duplicate data', () => {
    expect(wordCategories).toHaveLength(14)
    expect(undercoverWordPairs.length).toBeGreaterThanOrEqual(480)
    expect(validateUndercoverPairs(undercoverWordPairs)).toEqual([])
    expect(getUndercoverPairs('mixed')).toEqual(undercoverWordPairs)
    expect(getUndercoverPairs('mixed')).not.toBe(undercoverWordPairs)
    expect(getUndercoverPairs('funny').every(pair => ['awkward', 'relationship', 'workplace', 'internet'].includes(pair.category))).toBe(true)
    for (const category of wordCategories) {
      expect(getUndercoverPairs(category.id).length, category.id).toBeGreaterThanOrEqual(32)
      for (const difficulty of ['easy', 'normal', 'hard'] as const) {
        expect(getUndercoverPairs(category.id, difficulty).length, `${category.id}/${difficulty}`).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('preserves good legacy IDs, relocates nature and sports, and shortens comedy phrases', () => {
    expect(undercoverWordPairs.find(pair => pair.id === 'food-01')?.words).toEqual(['雞排', '鹽酥雞'])
    expect(undercoverWordPairs.find(pair => pair.id === 'food-06')?.words).toEqual(['鍋貼', '水餃'])
    expect(undercoverWordPairs.find(pair => pair.id === 'people-01')?.words).toEqual(['醫師', '獸醫師'])
    expect(undercoverWordPairs.find(pair => pair.id === 'animals-19')).toMatchObject({ category: 'places', tags: ['自然現象'] })
    expect(undercoverWordPairs.find(pair => pair.id === 'sports-20')?.category).toBe('leisure')
    expect(undercoverWordPairs.find(pair => pair.id === 'daily-03')?.category).toBe('objects')
    expect(undercoverWordPairs.find(pair => pair.words.includes('福利社'))?.words).toEqual(['福利社', '便利商店'])
    expect(undercoverWordPairs.find(pair => pair.words.includes('主管退件'))?.words).toEqual(['主管退件', '客戶退件'])
    expect(undercoverWordPairs.find(pair => pair.words.includes('前任'))?.difficulty).toBe('easy')
    expect(undercoverWordPairs.some(pair => pair.words.includes('孔明車'))).toBe(false)
  })

  it('detects reversed, NFKC, whitespace and letter-case duplicates, but allows words in different pairs', () => {
    expect(undercoverPairKey([' ＡＢＣ ', '雞排'])).toBe(undercoverPairKey(['雞排', 'abc']))
    const pair = undercoverWordPairs[0]!
    expect(validateUndercoverPairs([pair, { ...pair, id: 'test-01', words: [pair.words[1], pair.words[0]] }])).toContain('詞組重複（含反向）：test-01')
    expect(validateUndercoverPairs([pair, { ...pair, id: 'test-02', words: [pair.words[0], '炸魚'] }])).toEqual([])
  })

  it('rejects aliases, strong containment, invalid categories, draft entries and missing quality notes', () => {
    const pair = undercoverWordPairs[0]!
    for (const words of [['合作社', '福利社'], ['多肉植物', '仙人掌'], ['暗戀', '單戀']] as const) {
      expect(validateUndercoverPairs([{ ...pair, words }])).toContain(`已淘汰配對回歸：${pair.id}`)
    }
    expect(validateUndercoverPairs([{ ...pair, words: ['雞排', '雞排'] }])).toContain(`兩詞相同：${pair.id}`)
    expect(validateUndercoverPairs([{ ...pair, sharedTraits: [], differences: [], tags: [], status: 'draft' }])).toHaveLength(4)
    expect(validateUndercoverPairs([{ ...pair, category: 'animals', words: ['彩虹', '極光'] }])).toContain(`非動物混入：${pair.id}`)
    expect(validateUndercoverPairs([{ ...pair, words: ['主管說再改一下吧', '客户說不喜歡'] }]).length).toBeGreaterThan(0)
    expect(() => definePairs('food', [], 'test-01|Z|貓|狗|都是寵物|叫聲不同')).toThrow()
    expect(() => definePairs('food', [], 'missing-columns')).toThrow()
  })

  it('migrates sports and rejects unknown saved themes/levels without expanding the schema', () => {
    expect(normalizeUndercoverCategory('sports')).toBe('leisure')
    expect(normalizeUndercoverCategory('food')).toBe('food')
    expect(normalizeUndercoverCategory('removed')).toBe('funny')
    expect(normalizeUndercoverCategory(null)).toBe('funny')
    expect(normalizeUndercoverDifficulty(undefined)).toBe('all')
    expect(normalizeUndercoverDifficulty('hard')).toBe('hard')
    expect(normalizeUndercoverDifficulty('impossible')).toBe('all')
  })

  it('keeps exact MOE headwords traceable to the already checked original workbook rows', () => {
    const terms = new Set(undercoverWordPairs.flatMap(pair => [...pair.words]))
    const original = new Map(Object.values(charadesSourceChecks.entries).map(check => [check.term, check]))
    expect(sourceChecks.source).toEqual(charadesSourceChecks.sources['moe-concised'])
    expect(Object.keys(sourceChecks.entries).length).toBeGreaterThan(150)
    for (const [term, check] of Object.entries(sourceChecks.entries)) {
      expect(terms.has(term), term).toBe(true)
      expect(original.get(term), term).toMatchObject(check)
    }
  })
})
