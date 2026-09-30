import type { FakeArtistPrompt } from '../types'

const categoryNames = {
  animals: '動物',
  food: '食物',
  objects: '生活物品',
  places: '地點',
  characters: '人物角色'
} as const

const source = {
  animals: ['企鵝', '長頸鹿', '大象', '兔子', '烏龜', '章魚', '螃蟹', '蝴蝶', '蝸牛', '鱷魚', '袋鼠', '孔雀', '獨角獸', '貓頭鷹', '河馬', '刺蝟', '海豚', '駱駝', '松鼠', '恐龍'],
  food: ['珍珠奶茶', '雞排', '漢堡', '披薩', '蛋糕', '甜甜圈', '冰淇淋', '壽司', '火鍋', '水餃', '西瓜', '香蕉', '鳳梨', '荷包蛋', '爆米花', '熱狗', '薯條', '泡麵', '棒棒糖', '粽子'],
  objects: ['雨傘', '鬧鐘', '眼鏡', '牙刷', '剪刀', '鑰匙', '手機', '電風扇', '檯燈', '吉他', '相機', '吸塵器', '安全帽', '馬桶', '衣架', '行李箱', '遙控器', '吹風機', '平底鍋', '電蚊拍'],
  places: ['動物園', '遊樂園', '電影院', '學校', '醫院', '便利商店', '火車站', '機場', '海灘', '城堡', '燈塔', '圖書館', '健身房', '游泳池', '夜市', '露營區', '棒球場', '咖啡廳', '博物館', '太空站'],
  characters: ['蜘蛛人', '哈利波特', '超級瑪利歐', '哆啦A夢', '皮卡丘', '孫悟空', '白雪公主', '灰姑娘', '蝙蝠俠', '小美人魚', '聖誕老人', '海盜', '忍者', '魔術師', '太空人', '廚師', '醫師', '消防員', '偵探', '吸血鬼']
} as const

export const fakeArtistCategories = [
  { id: 'mixed', name: '全部混合', description: '五種題材隨機出題' },
  ...Object.entries(categoryNames).map(([id, name]) => ({ id, name, description: `只抽${name}題目` }))
] as const

export const fakeArtistPrompts: readonly FakeArtistPrompt[] = Object.entries(source).flatMap(([category, answers]) =>
  answers.map((answer, index) => ({
    id: `${category}-${String(index + 1).padStart(2, '0')}`,
    category: category as FakeArtistPrompt['category'],
    categoryName: categoryNames[category as keyof typeof categoryNames],
    answer
  }))
)
