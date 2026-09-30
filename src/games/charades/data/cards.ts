import type { WordDeckCard } from '@/types/gameplay'
import type { CharadesCategory } from '../types'

type CardGroup = Exclude<CharadesCategory, 'mixed'>

export const charadesCategories: readonly { id: CharadesCategory; name: string; description: string }[] = [
  { id: 'mixed', name: '爆笑混合', description: '人物、生活與物品全部洗在一起' },
  { id: 'characters', name: '人物角色', description: '名人、歷史人物與虛構角色' },
  { id: 'life', name: '生活鬧劇', description: '動作與那些越演越尷尬的情境' },
  { id: 'things', name: '物品食物', description: '常見東西與光想就餓的食物' }
]

const rawCards: readonly [CardGroup, string, string][] = [
  ['characters', '哈利波特', '🧙'], ['characters', '蜘蛛人', '🕷️'], ['characters', '超級瑪利歐', '🍄'], ['characters', '皮卡丘', '⚡'],
  ['characters', '哆啦A夢', '🔔'], ['characters', '孫悟空', '🐒'], ['characters', '白雪公主', '🍎'], ['characters', '灰姑娘', '👠'],
  ['characters', '福爾摩斯', '🔍'], ['characters', '小美人魚', '🧜'], ['characters', '蝙蝠俠', '🦇'], ['characters', '鋼鐵人', '🤖'],
  ['characters', '美國隊長', '🛡️'], ['characters', '小小兵', '🍌'], ['characters', '櫻桃小丸子', '🌸'], ['characters', '蠟筆小新', '🖍️'],
  ['characters', '名偵探柯南', '👓'], ['characters', '湯姆貓', '🐱'], ['characters', '傑利鼠', '🐭'], ['characters', '功夫熊貓', '🐼'],
  ['characters', '愛因斯坦', '🧠'], ['characters', '牛頓', '🍎'], ['characters', '貝多芬', '🎼'], ['characters', '達文西', '🎨'],
  ['characters', '卓別林', '🎩'], ['characters', '李小龍', '🥋'], ['characters', '麥可傑克森', '🕺'], ['characters', '周杰倫', '🎤'],
  ['characters', '蔡依林', '💃'], ['characters', '林書豪', '🏀'], ['characters', '大谷翔平', '⚾'], ['characters', '珍珠奶茶店員', '🧋'],
  ['characters', '健身教練', '🏋️'], ['characters', '婚禮主持人', '🎙️'], ['characters', '魔術師', '🎩'], ['characters', '牙醫師', '🦷'],
  ['characters', '忍者', '🥷'], ['characters', '海盜船長', '🏴‍☠️'], ['characters', '太空人', '🚀'], ['characters', '吸血鬼', '🧛'],

  ['life', '打噴嚏', '🤧'], ['life', '踩到樂高', '🧱'], ['life', '被蚊子叮', '🦟'], ['life', '手機摔到臉', '📱'],
  ['life', '倒車入庫', '🚗'], ['life', '追垃圾車', '🗑️'], ['life', '趕末班車', '🚉'], ['life', '偷偷放屁', '💨'],
  ['life', '假裝沒看到熟人', '🙈'], ['life', '唱歌破音', '🎤'], ['life', '走錯廁所', '🚻'], ['life', '視訊忘記關麥克風', '🎧'],
  ['life', '吃麵燙到舌頭', '🍜'], ['life', '喝珍奶噎到珍珠', '🧋'], ['life', '雨傘被風吹翻', '☂️'], ['life', '拉鍊沒拉', '🤐'],
  ['life', '電梯夾到包包', '🛗'], ['life', '認錯人還打招呼', '👋'], ['life', '上台忘詞', '😶'], ['life', '穿拖鞋跑步', '🩴'],
  ['life', '搶最後一塊雞排', '🍗'], ['life', '半夜偷吃泡麵', '🍜'], ['life', '考試偷看隔壁', '📝'], ['life', '老闆突然走過來', '👔'],
  ['life', '鬧鐘按掉又睡著', '⏰'], ['life', '在公車上睡過站', '🚌'], ['life', '鑰匙鎖在屋內', '🔑'], ['life', '排隊排錯邊', '🚶'],
  ['life', '紅包拿錯包', '🧧'], ['life', '自拍開到前鏡頭', '🤳'], ['life', '用吸管吸不到珍珠', '🥤'], ['life', '戴安全帽講電話', '🪖'],
  ['life', '追劇看到天亮', '📺'], ['life', '假裝聽懂英文', '🔤'], ['life', '躲避前任', '🫣'], ['life', '外送送錯地址', '🛵'],
  ['life', '洗澡洗到沒熱水', '🚿'], ['life', '面試遲到', '💼'], ['life', '網路突然斷線', '📡'], ['life', '搶演唱會門票', '🎫'],

  ['things', '馬桶吸把', '🪠'], ['things', '電蚊拍', '⚡'], ['things', '自拍棒', '🤳'], ['things', '行動電源', '🔋'],
  ['things', '迴紋針', '📎'], ['things', '安全帽', '🪖'], ['things', '遙控器', '📺'], ['things', '保溫杯', '🥤'],
  ['things', '吹風機', '💨'], ['things', '體重計', '⚖️'], ['things', '捕蚊燈', '💡'], ['things', '菜刀', '🔪'],
  ['things', '掃地機器人', '🤖'], ['things', '曬衣夾', '🧺'], ['things', '刮鬍刀', '🪒'], ['things', '門禁卡', '💳'],
  ['things', '雨衣', '🧥'], ['things', '垃圾袋', '🗑️'], ['things', '訂書機', '📎'], ['things', '耳溫槍', '🌡️'],
  ['things', '珍珠奶茶', '🧋'], ['things', '雞排', '🍗'], ['things', '臭豆腐', '⬜'], ['things', '蚵仔煎', '🦪'],
  ['things', '小籠包', '🥟'], ['things', '火鍋', '🍲'], ['things', '蛋餅', '🥚'], ['things', '滷肉飯', '🍚'],
  ['things', '芒果冰', '🥭'], ['things', '泡麵', '🍜'], ['things', '披薩', '🍕'], ['things', '漢堡', '🍔'],
  ['things', '壽司', '🍣'], ['things', '爆米花', '🍿'], ['things', '生日蛋糕', '🎂'], ['things', '巧克力', '🍫'],
  ['things', '榴槤', '🟡'], ['things', '地瓜球', '🟠'], ['things', '車輪餅', '🫘'], ['things', '鹽酥雞', '🍗']
]

export const charadesCards: readonly WordDeckCard[] = rawCards.map(([category, label, emoji], index) => ({
  id: `charades-${String(index + 1).padStart(3, '0')}`,
  category,
  label,
  emoji
}))
