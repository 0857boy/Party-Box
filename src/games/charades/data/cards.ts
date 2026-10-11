import type { CharadesCard, CharadesCategory, CharadesDifficulty } from '../types'

export const charadesCategories: readonly { id: CharadesCategory; name: string; description: string }[] = [
  { id: 'mixed', name: '歡樂混合', description: '常見動物、動作、美食與角色一起玩' },
  { id: 'animals', name: '動物世界', description: '從貓狗到企鵝，看誰模仿得最像' },
  { id: 'food', name: '美食飲料', description: '早餐、夜市與大家熟悉的食物' },
  { id: 'life', name: '動作職業', description: '日常動作、運動與常見職業' },
  { id: 'things', name: '日常物品', description: '家裡、學校與街上看得到的東西' },
  { id: 'characters', name: '經典角色', description: '卡通、童話與大眾熟悉的人物' },
  { id: 'idioms', name: '成語表情', description: '短短幾個字，也能演得很有戲' }
]

// Curated short words, not sentence templates. A hard card is still a common
// term; its difficulty comes from acting it out, not specialist trivia.
const groups: readonly { category: CharadesCard['category']; difficulty: CharadesDifficulty; words: string }[] = [
  { category: 'animals', difficulty: 'easy', words:
    '貓 狗 兔子 老鼠 大象 長頸鹿 猴子 熊貓 企鵝 獅子 老虎 斑馬 河馬 犀牛 袋鼠 無尾熊 北極熊 海豚 鯊魚 鯨魚 烏龜 鱷魚 蛇 青蛙 雞 鴨 鵝 豬 牛 羊 馬 鹿 松鼠 蝙蝠 蝴蝶 蜜蜂 螞蟻 蚊子 蜘蛛 螃蟹 章魚 魷魚 蝸牛 金魚 麻雀 貓頭鷹' },
  { category: 'animals', difficulty: 'normal', words:
    '孔雀 火雞 鴕鳥 鸚鵡 海豹 海獅 海龜 海星 海馬 水母 刺蝟 浣熊 狐狸 野豬 駱駝 驢子 水牛 螳螂 蟋蟀 螢火蟲 獨角仙 蜈蚣' },
  { category: 'animals', difficulty: 'hard', words:
    '變色龍 樹懶 土撥鼠 穿山甲 鴨嘴獸 蜥蜴 電鰻 鯰魚 食蟻獸' },
  { category: 'food', difficulty: 'easy', words:
    '雞排 臭豆腐 蚵仔煎 滷肉飯 蛋餅 饅頭 包子 油條 飯糰 豆漿 珍珠奶茶 咖啡 果汁 可樂 冰淇淋 芒果冰 豆花 紅豆湯 地瓜球 車輪餅 鹽酥雞 牛肉麵 泡麵 水餃 小籠包 炒飯 炒麵 火鍋 披薩 漢堡 薯條 熱狗 壽司 拉麵 咖哩飯 炸雞 爆米花 巧克力 生日蛋糕 餅乾 吐司 蘋果 香蕉 西瓜 葡萄 草莓 鳳梨 榴槤' },
  { category: 'food', difficulty: 'normal', words:
    '刈包 碗粿 肉圓 甜不辣 米血糕 燒仙草 愛玉 檸檬汁 冬瓜茶 烏龍茶 鐵板燒 關東煮 涼麵 春捲 潤餅 粽子 蘿蔔糕 茶葉蛋 可頌 鬆餅 布丁 優格 起司 烤地瓜 糖葫蘆' },
  { category: 'food', difficulty: 'hard', words:
    '棺材板 薑母鴨 麻油雞 三杯雞 佛跳牆 皮蛋豆腐 鳳梨酥 蛋黃酥 雪花冰 舒芙蕾 提拉米蘇 黑糖粉粿' },
  { category: 'life', difficulty: 'easy', words:
    '打噴嚏 打哈欠 打嗝 咳嗽 放屁 睡覺 打呼 刷牙 洗臉 洗頭 洗澡 吹頭髮 刮鬍子 化妝 擦口紅 穿鞋 綁鞋帶 撐傘 掃地 拖地 洗碗 煮飯 切菜 吃飯 喝水 拍照 打電話 唱歌 跳舞 跑步 游泳 騎腳踏車 開車 釣魚 打籃球 踢足球 打棒球 跳繩 爬樓梯 搬家 拔河 老師 醫生 警察 廚師 司機 農夫 郵差' },
  { category: 'life', difficulty: 'normal', words:
    '倒車入庫 追垃圾車 搭電梯 搭公車 拜拜 抽籤 鞠躬 敬禮 擦玻璃 晾衣服 熨衣服 遛狗 餵魚 踩蟑螂 打蚊子 做瑜珈 舉重 打保齡球 溜冰 滑雪 衝浪 爬山 攀岩 牙醫 護理師 消防員 理髮師 外送員 健身教練 魔術師' },
  { category: 'life', difficulty: 'hard', words:
    '指揮交通 指揮家 空服員 救生員 裁判 水電工 保全 攝影師 踩高蹺 跳水 走鋼索 伏地挺身 仰臥起坐 憋氣 裝傻' },
  { category: 'things', difficulty: 'easy', words:
    '手機 電視 電腦 平板 耳機 相機 眼鏡 雨傘 雨衣 安全帽 帽子 圍巾 手套 襪子 拖鞋 皮鞋 書包 行李箱 鑰匙 鬧鐘 手錶 鏡子 梳子 牙刷 牙膏 毛巾 肥皂 吹風機 馬桶 沙發 椅子 桌子 枕頭 棉被 電風扇 冰箱 洗衣機 掃把 垃圾桶 筷子 湯匙 叉子 杯子 水壺 鍋子 剪刀 鉛筆 橡皮擦 籃球 足球 吉他 鋼琴' },
  { category: 'things', difficulty: 'normal', words:
    '電蚊拍 馬桶吸把 遙控器 行動電源 自拍棒 保溫杯 體重計 刮鬍刀 訂書機 迴紋針 曬衣夾 耳溫槍 門禁卡 吸塵器 印表機 電鍋 烤箱 微波爐 電熱毯 望遠鏡 放大鏡 小提琴 喇叭 滑板 摩天輪' },
  { category: 'things', difficulty: 'hard', words:
    '掃地機器人 除濕機 空氣清淨機 飲水機 滅火器 捕蚊燈 指南針 顯微鏡 三腳架 縫紉機 打字機 收音機 留聲機 夾娃娃機 印章' },
  { category: 'characters', difficulty: 'easy', words:
    '皮卡丘 哆啦A夢 蠟筆小新 小丸子 蜘蛛人 蝙蝠俠 超人 鋼鐵人 美國隊長 哈利波特 小小兵 海綿寶寶 孫悟空 豬八戒 唐三藏 白雪公主 灰姑娘 小紅帽 美人魚 米老鼠 唐老鴨 維尼 跳跳虎 史努比 加菲貓 湯姆貓 傑利鼠 聖誕老人 忍者 海盜 吸血鬼 殭屍' },
  { category: 'characters', difficulty: 'normal', words:
    '瑪利歐 柯南 史瑞克 功夫熊貓 胡迪 巴斯光年 艾莎 安娜 龍貓 無臉男 波妞 胖虎 大雄 靜香 神燈精靈 彼得潘 福爾摩斯 科學怪人 木乃伊 狼人 機器人 太空人 女巫 美少女戰士' },
  { category: 'characters', difficulty: 'hard', words:
    '周杰倫 蔡依林 李小龍 卓別林 愛因斯坦 牛頓 貝多芬 達文西 哪吒 二郎神 林書豪 大谷翔平' },
  { category: 'idioms', difficulty: 'easy', words:
    '開心 生氣 難過 害羞 緊張 驚訝 害怕 得意 愛哭 貪吃 手忙腳亂 目瞪口呆 哈哈大笑 哭笑不得 東張西望 大吃一驚 雞同鴨講 狼吞虎嚥 大搖大擺 偷偷摸摸' },
  { category: 'idioms', difficulty: 'normal', words:
    '張牙舞爪 抓耳撓腮 擠眉弄眼 垂頭喪氣 七上八下 心花怒放 怒氣沖沖 嚇一跳 愁眉苦臉 垂涎三尺 裝模作樣 橫衝直撞 一手遮天 畫蛇添足 井底之蛙 守株待兔 對牛彈琴 亡羊補牢 掩耳盜鈴 刻舟求劍 畫龍點睛 自言自語 左顧右盼 搖頭晃腦' },
  { category: 'idioms', difficulty: 'hard', words:
    '聞雞起舞 盲人摸象 杯弓蛇影 狐假虎威 鸚鵡學舌 騎虎難下 雪中送炭 火上加油 貓哭耗子 雞飛狗跳 指鹿為馬 胸有成竹 望梅止渴 如魚得水 馬馬虎虎 一箭雙鵰 愚公移山 黔驢技窮 喜極而泣 強顏歡笑 咬牙切齒 忐忑不安 心不在焉 難以啟齒' }
]

export const charadesCards: readonly CharadesCard[] = groups.flatMap(({ category, difficulty, words }) =>
  words.trim().split(/\s+/u).map(label => ({
    id: `charades-${category}-${label}`,
    category,
    difficulty,
    label
  }))
)
