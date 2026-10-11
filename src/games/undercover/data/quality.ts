import type { WordPair } from '../types'

export function normalizeUndercoverWord(word: string): string {
  return word.normalize('NFKC').replace(/\s+/gu, '').toLocaleLowerCase('zh-TW')
}

export function undercoverPairKey(words: readonly string[]): string {
  return words.map(normalizeUndercoverWord).sort().join('|')
}

// Regression list, not an automated semantic oracle. New entries still need
// editorial checking of their common ground, objective distinctions and scope.
export const rejectedUndercoverPairs = [
  ['合作社', '福利社'], ['迷因', '梗圖'], ['YouTuber', '直播主'],
  ['好人卡', '朋友卡'], ['老師', '補習班老師'], ['仙人掌', '多肉植物'],
  ['暗戀', '單戀'], ['拖鞋', '室內鞋'], ['演員', '替身演員'],
  ['博物館', '美術館'], ['遊樂園', '兒童樂園'], ['計程車', '多元計程車'],
  ['海豚', '虎鯨'], ['鄉民', '網友'], ['報帳', '核銷'], ['麻糬', '大福'],
  ['可樂', '汽水'], ['翻譯員', '口譯員'], ['週一症候群', '收假症候群'],
  ['部門會議', '晨間會議'], ['颱風假', '補班日'], ['爆雷', '暴雷警告'],
  ['和好', '復合'], ['曖昧對象', '單戀對象'], ['升旗', '朝會'],
  ['農場', '牧場'], ['編劇', '作家'], ['超車', '換車道'], ['爆胎', '拋錨']
] as const

export function validateUndercoverPairs(pairs: readonly WordPair[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const keys = new Set<string>()
  const rejected = new Set(rejectedUndercoverPairs.map(undercoverPairKey))
  const categories = new Set(['food', 'daily', 'campus', 'transport', 'leisure', 'taiwan', 'awkward', 'relationship', 'workplace', 'internet', 'animals', 'objects', 'people', 'places'])
  for (const pair of pairs) {
    if (!/^[a-z]+-\d{2,}$/u.test(pair.id) || ids.has(pair.id)) errors.push(`無效或重複 ID：${pair.id}`)
    ids.add(pair.id)
    if (!categories.has(pair.category)) errors.push(`無效分類：${pair.id}`)
    if (!['easy', 'normal', 'hard'].includes(pair.difficulty)) errors.push(`無效難度：${pair.id}`)
    if (pair.status !== 'reviewed') errors.push(`未完成編輯審查：${pair.id}`)
    if (pair.words.length !== 2 || pair.words.some(word => !word.trim() || word !== word.trim()
      || [...word].length > 7 || /[，。！？「」：；]/u.test(word))) errors.push(`空白、過長或句子型題目：${pair.id}`)
    if (pair.words.every(word => normalizeUndercoverWord(word) === normalizeUndercoverWord(pair.words[0]))) errors.push(`兩詞相同：${pair.id}`)
    const key = undercoverPairKey(pair.words)
    if (keys.has(key)) errors.push(`詞組重複（含反向）：${pair.id}`)
    if (rejected.has(key)) errors.push(`已淘汰配對回歸：${pair.id}`)
    keys.add(key)
    if (!pair.tags.length || pair.tags.some(tag => !tag.trim())) errors.push(`缺少標籤：${pair.id}`)
    if (!pair.sharedTraits.length || pair.sharedTraits.some(trait => trait.trim().length < 2) || pair.sharedTraits.join('').length < 8) errors.push(`缺少有效共同點：${pair.id}`)
    if (!pair.differences.length || pair.differences.some(difference => difference.trim().length < 3) || pair.differences.join('').length < 8) errors.push(`缺少有效差異：${pair.id}`)
    if (pair.sharedTraits.length && pair.sharedTraits.join() === pair.differences.join()) errors.push(`共同點與差異相同：${pair.id}`)
    if (/[见气强洁规较经现损关紧发讨历内换论学运铁铃钞]/u.test([...pair.words, ...pair.sharedTraits, ...pair.differences].join())) errors.push(`疑似簡體字：${pair.id}`)
    if (pair.category === 'animals' && pair.words.some(word => /葉|仙人掌|多肉|彩虹|極光|颱風|龍捲風/u.test(word))) errors.push(`非動物混入：${pair.id}`)
  }
  return errors
}
