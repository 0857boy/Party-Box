import { defineCards } from './defineCards'

// Familiarity changes with age and interests. These are editorial choices,
// not popularity rankings. Review annually; keep short official stage names.
export const celebrityCards = defineCards('celebrities', [
  { difficulty: 'easy', tags: ['華語藝人'], entries: `
    n001:周杰倫 n002:蔡依林 n003:伍思凱 n004:張惠妹 n005:劉德華 n006:成龍 n007:周星馳 n008:鄧麗君 n009:林志玲 n010:白冰冰
    n011:豬哥亮 n012:小S n013:林俊傑 n014:蕭煌奇 n015:張學友 n016:郭富城 n017:吳宗憲 n018:徐乃麟 n019:許效舜 n020:曾國城` },
  { difficulty: 'easy', tags: ['體育', '歷史人物'], entries: `
    n021:李小龍 n022:林書豪 n023:大谷翔平 n024:戴資穎 n025:王建民 n026:愛因斯坦 n027:牛頓 n028:貝多芬 n029:卓別林 n030:麥可傑克森` },
  { difficulty: 'normal', tags: ['華語藝人'], entries: `
    n031:蕭敬騰 n032:伍佰 n033:蔡健雅 n034:田馥甄 n035:孫燕姿 n036:楊丞琳 n037:張韶涵 n038:梁靜茹 n039:徐懷鈺 n040:陳綺貞
    n041:徐佳瑩 n042:阿信 n043:吳青峰 n044:盧廣仲 n045:蘇慧倫 n046:李宗盛 n047:任賢齊 n048:周華健 n049:張宇 n050:費玉清
    n051:費翔 n052:庾澄慶 n053:黃渤 n054:彭于晏 n055:陳漢典 n056:沈玉琳 n057:吳姍儒 n058:韋禮安 n059:阿雅 n060:康康
    n061:郭子乾 n062:納豆 n063:浩子 n064:阿翔 n065:許富凱 n066:江蕙 n067:黃小琥 n068:羅時豐 n069:陳雷 n070:劉若英` },
  { difficulty: 'normal', tags: ['運動員'], entries: `
    n071:郭婞淳 n072:李洋 n073:王齊麟 n074:陳傑憲 n075:彭政閔 n076:陳金鋒 n077:林智勝 n078:王貞治 n079:鈴木一朗 n080:喬丹` },
  { difficulty: 'hard', tags: ['國際藝人', '歷史人物'], entries: `
    n081:泰勒絲 n082:碧昂絲 n083:女神卡卡 n084:瑪丹娜 n085:貓王 n086:莎士比亞 n087:達文西 n088:莫札特 n089:梵谷 n090:畢卡索
    n091:瑪麗蓮夢露 n092:奧黛麗赫本 n093:湯姆克魯斯 n094:布萊德彼特 n095:李奧納多 n096:湯姆漢克斯 n097:梅西 n098:C羅 n099:費德勒 n100:博爾特` }
])
