import type { CharadesCard } from '../types'
import sourceChecks from './source-checks.json'

interface SourceCheck {
  term: string
  source: string
  row: number
}

const verifiedTerms: Readonly<Record<string, SourceCheck>> = sourceChecks.entries
const categories = new Set(['animals', 'food', 'life', 'jobs', 'sports', 'things', 'characters', 'idioms', 'emotions', 'celebrities'])
const difficulties = new Set(['easy', 'normal', 'hard'])

// Only editorially reviewed aliases are merged. Similar concepts (e.g. 仰式
// and 蛙式) remain distinct; no aggressive fuzzy matching of Chinese names.
const aliases: Readonly<Record<string, string>> = {
  '紅豆餅': '車輪餅', '天婦羅': '甜不辣', '哆啦美': '小叮鈴',
  '小熊維尼': '維尼', '小飛俠': '彼得潘', '小木偶': '匹諾曹', '皮諾丘': '匹諾曹', '酷斯拉': '哥吉拉',
  '嫉妒': '忌妒', '害臊': '害羞', '疑惑': '困惑', '做瑜珈': '瑜珈', '做瑜伽': '瑜珈',
  '瑜伽': '瑜珈', '自行車': '腳踏車', '多啦a夢': '哆啦a夢'
}

export function normalizeCharadesLabel(label: string): string {
  const normalized = label.normalize('NFKC').replace(/\s+/gu, '').toLowerCase()
  return aliases[normalized] ?? normalized
}

// Regression guards for ambiguous boundaries. These are admission checks,
// not a claim that a regex can assess familiarity, acting quality or taxonomy.
const categoryGuards: Readonly<Record<string, CharadesCard['category']>> = Object.fromEntries([
  ...['貓', '狗', '螞蟻', '蝴蝶', '螳螂', '蜜蜂', '螢火蟲', '金魚', '海豚', '企鵝', '鴨', '變色龍', '蜘蛛'].map(word => [word, 'animals']),
  ...['雞排', '珍珠奶茶', '臭豆腐', '蚵仔煎', '牛肉麵', '芒果冰'].map(word => [word, 'food']),
  ...['刷牙', '洗澡', '拖地', '晾衣服', '追垃圾車', '等公車'].map(word => [word, 'life']),
  ...['老師', '醫生', '警察', '牙醫', '消防員', '廚師', '外送員', '空服員', '魔術師', '太空人', '機器人工程師'].map(word => [word, 'jobs']),
  ...['游泳', '跑步', '滑雪', '攀岩', '打籃球', '踢足球', '瑜珈', '伏地挺身', '仰臥起坐', '釣魚'].map(word => [word, 'sports']),
  ...['手機', '電風扇', '沙發', '鬧鐘', '吉他', '滅火器', '電鍋'].map(word => [word, 'things']),
  ...['皮卡丘', '哆啦A夢', '蜘蛛人', '白雪公主', '孫悟空', '木乃伊', '吸血鬼'].map(word => [word, 'characters']),
  ...['開心', '生氣', '害羞', '緊張', '難過', '得意', '哈哈大笑', '嚇一跳'].map(word => [word, 'emotions']),
  ...['周杰倫', '蔡依林', '李小龍', '卓別林', '愛因斯坦', '牛頓', '林書豪', '大谷翔平'].map(word => [word, 'celebrities'])
]) as Record<string, CharadesCard['category']>

export function validateCharadesCards(cards: readonly CharadesCard[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const labels = new Set<string>()
  for (const card of cards) {
    const label = card.label.trim()
    const normalized = normalizeCharadesLabel(label)
    if (!/^charades-[a-z]\d{3}$/u.test(card.id)) errors.push(`無效固定 ID：${card.id}`)
    if (ids.has(card.id)) errors.push(`ID 重複：${card.id}`)
    ids.add(card.id)
    if (!label || label !== card.label) errors.push(`空白或多餘空格：${card.id}`)
    if (labels.has(normalized)) errors.push(`題目或別名重複：${label}`)
    labels.add(normalized)
    if (!categories.has(card.category)) errors.push(`無效分類（不可屬於 mixed）：${label}`)
    if (!difficulties.has(card.difficulty)) errors.push(`無效難度：${label}`)
    if ([...label].length > 6 || !/^[\p{Script=Han}A-Za-z0-9]+$/u.test(label)) errors.push(`題目應為六字內短詞，不含空白、標點或句子：${label}`)
    // Targeted script/terminology regressions, not a complete Chinese converter.
    if (/[丧撑龙鸟鱼车门马书画开卫纸医师学无云风头发观欢忧气猫]/u.test(label) || /^(?:自行车|出租车|打印机|酸奶|卫生纸|空调)$/u.test(label)) errors.push(`非臺灣繁體用語：${label}`)
    if (!card.tags?.length || card.tags.some(tag => !tag.trim())) errors.push(`缺少細分類標籤：${label}`)
    const expected = categoryGuards[label]
    if (expected && card.category !== expected) errors.push(`分類錯誤：${label} 應為 ${expected}`)
    const verification = verifiedTerms[card.id]
    if (verification && verification.term !== label) errors.push(`來源紀錄需重新核對：${card.id} ${label}`)
    if (card.category === 'idioms' && (!verification || verification.source !== 'moe-idioms' || verification.term !== label)) errors.push(`成語未經教育部來源驗證：${label}`)
  }
  return errors
}
