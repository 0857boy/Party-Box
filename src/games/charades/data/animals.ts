import { defineCards } from './defineCards'

export const animalCards = defineCards('animals', [
  { difficulty: 'easy', tags: ['哺乳類'], entries: `
    a001:貓 a002:狗 a003:兔子 a004:老鼠 a005:大象 a006:長頸鹿 a007:猴子 a008:熊貓 a009:獅子 a010:老虎
    a011:斑馬 a012:河馬 a013:犀牛 a014:袋鼠 a015:無尾熊 a016:北極熊 a017:豬 a018:牛 a019:羊 a020:馬
    a021:鹿 a022:松鼠 a023:蝙蝠 a024:狐狸 a025:駱駝 a026:猩猩 a027:狼 a028:黑熊 a029:山羊 a030:驢子` },
  { difficulty: 'easy', tags: ['鳥類'], entries: `
    a031:企鵝 a032:雞 a033:鴨 a034:鵝 a035:麻雀 a036:貓頭鷹 a037:鸚鵡 a038:孔雀 a039:鴕鳥 a040:鴿子` },
  { difficulty: 'easy', tags: ['昆蟲'], entries: `
    a041:蝴蝶 a042:蜜蜂 a043:螞蟻 a044:蚊子 a045:蟑螂 a046:蒼蠅 a047:螳螂 a048:蜻蜓 a049:瓢蟲 a050:毛毛蟲` },
  { difficulty: 'easy', tags: ['水中生物'], entries: `
    a051:海豚 a052:鯊魚 a053:鯨魚 a054:金魚 a055:螃蟹 a056:章魚 a057:魷魚 a058:蝦子 a059:海星 a060:水母
    a061:海馬 a062:海豹 a063:海獅 a064:海龜 a065:龍蝦` },
  { difficulty: 'easy', tags: ['其他動物'], entries: `
    a066:烏龜 a067:鱷魚 a068:蛇 a069:青蛙 a070:蜘蛛 a071:蝸牛 a072:蚯蚓` },
  { difficulty: 'normal', tags: ['哺乳類'], entries: `
    a073:刺蝟 a074:浣熊 a075:野豬 a076:水牛 a077:土撥鼠 a078:樹懶 a079:水獺 a080:海獺 a081:天竺鼠 a082:倉鼠
    a083:貂 a084:黃鼠狼 a085:豪豬 a086:河狸 a087:綿羊 a088:羚羊 a089:水豚 a090:梅花鹿 a091:長臂猿 a092:狒狒
    a093:小熊貓 a094:北極狐 a095:獵豹 a096:豹 a097:黑猩猩 a098:大猩猩 a099:斑鬣狗 a100:野牛` },
  { difficulty: 'normal', tags: ['鳥類'], entries: `
    a101:火雞 a102:啄木鳥 a103:老鷹 a104:烏鴉 a105:喜鵲 a106:燕子 a107:天鵝 a108:白鷺鷥 a109:鵜鶘 a110:紅鶴
    a111:翠鳥 a112:八哥 a113:海鷗 a114:鵪鶉 a115:鷓鴣` },
  { difficulty: 'normal', tags: ['昆蟲'], entries: `
    a116:蟋蟀 a117:螢火蟲 a118:獨角仙 a119:蟬 a120:蚱蜢 a121:鍬形蟲 a122:蛾 a123:蠶 a124:白蟻 a125:虎頭蜂
    a126:水黽 a127:竹節蟲 a128:糞金龜 a129:蝗蟲` },
  { difficulty: 'normal', tags: ['水中生物'], entries: `
    a130:海象 a131:河豚 a132:飛魚 a133:鯉魚 a134:鮭魚 a135:鮪魚 a136:旗魚 a137:小丑魚 a138:寄居蟹 a139:海膽
    a140:海參 a141:牡蠣 a142:蛤蜊 a143:烏賊 a144:鰻魚 a145:鯰魚 a146:鱟 a147:吳郭魚` },
  { difficulty: 'normal', tags: ['其他動物'], entries: `
    a148:蜥蜴 a149:壁虎 a150:蟾蜍 a151:蜈蚣 a152:蠍子 a153:眼鏡蛇 a154:蟒蛇 a155:螞蝗` },
  { difficulty: 'hard', tags: ['哺乳類'], entries: `
    a156:穿山甲 a157:鴨嘴獸 a158:食蟻獸 a159:狐獴 a160:馬來貘 a161:儒艮 a162:海牛 a163:狐猴 a164:大耳狐 a165:鼴鼠` },
  { difficulty: 'hard', tags: ['水中生物'], entries: `
    a166:電鰻 a167:魟魚 a168:鯨鯊 a169:翻車魚 a170:比目魚 a171:彈塗魚 a172:鬼頭刀 a173:鱔魚` },
  { difficulty: 'hard', tags: ['其他動物'], entries: `
    a174:變色龍 a175:哈士奇 a176:柴犬 a177:恐龍 a178:吉娃娃 a179:暴龍 a180:劍龍` }
])
