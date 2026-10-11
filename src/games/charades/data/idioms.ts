import { defineCards } from './defineCards'

// Admission requires an exact headword match in the MOE idiom workbook.
// Dictionary definitions/examples are not copied into the game.
export const idiomCards = defineCards('idioms', [
  { difficulty: 'easy', tags: ['表情', '動作'], entries: `
    i001:手忙腳亂 i002:目瞪口呆 i008:張牙舞爪 i011:垂頭喪氣 i013:愁眉苦臉 i014:垂涎三尺 i015:裝模作樣 i017:左顧右盼 i019:眉開眼笑 i021:咬牙切齒 i024:歡天喜地 i027:手舞足蹈 i028:交頭接耳 i072:汗流浹背 i073:目不轉睛 i075:呆若木雞 i076:面紅耳赤 i077:笑逐顏開 i079:怒髮衝冠 i080:張口結舌 i085:大驚小怪 i100:眼高手低 ` },
  { difficulty: 'normal', tags: ['故事', '具象'], entries: `
    i031:畫蛇添足 i032:井底之蛙 i033:守株待兔 i034:對牛彈琴 i035:亡羊補牢 i036:掩耳盜鈴 i037:刻舟求劍 i038:畫龍點睛 i039:聞雞起舞 i040:盲人摸象
    i041:狐假虎威 i043:指鹿為馬 i044:望梅止渴 i045:愚公移山 i047:鶴立雞群 i049:龍飛鳳舞 i050:一箭雙鵰
    i051:如魚得水 i052:騎虎難下 i053:杯弓蛇影 i054:一手遮天 i056:雪中送炭 i058:打草驚蛇 i059:殺雞取卵 i060:緣木求魚` },
  { difficulty: 'normal', tags: ['動作', '表情'], entries: `
    i062:七上八下 i063:心花怒放 i069:心不在焉      i078:愁眉不展  
    i083:心驚膽戰 i084:驚弓之鳥  i097:趾高氣揚 i098:冷眼旁觀 ` },
  { difficulty: 'hard', tags: ['故事', '動作挑戰'], entries: `
    i101:胸有成竹 i102:黔驢技窮 i105:葉公好龍 i106:草木皆兵 i107:破釜沉舟 i108:背水一戰 i109:負荊請罪 i110:臥薪嘗膽
    i111:投鼠忌器 i112:班門弄斧 i113:塞翁失馬 i115:走馬看花 i117:風聲鶴唳 i118:滄海一粟 i119:杯水車薪 i121:螳臂當車 i122:螳螂捕蟬 i123:坐井觀天 i124:水落石出 i129:精衛填海 i131:天衣無縫 i135:虎頭蛇尾 i137:雞鳴狗盜 i139:龍潭虎穴 i141:揚眉吐氣 i143:眉飛色舞 i148:樂不可支 i149:得意忘形 i154:坐立不安 i155:望穿秋水 i156:望眼欲穿 i158:幸災樂禍 i163:拍案叫絕 i169:披星戴月 i171:快馬加鞭 i173:逃之夭夭 i174:一蹶不振 i177:迎刃而解 i178:一毛不拔 i179:掩人耳目 ` }
])
