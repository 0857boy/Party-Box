# 爆笑猜詞題庫

目前共 **1,335 題**，10 個正式分類加上自動組合的歡樂混合。每題只屬於一個正式分類，沒有另外維護混合資料。分類顯示在原本的主題下拉選單，旁邊的題數隨難度更新，不增加設定步驟。

| 分類 | ID | 題數 |
| --- | --- | ---: |
| 動物世界 | animals | 180 |
| 美食飲料 | food | 180 |
| 日常生活 | life | 180 |
| 職業達人 | jobs | 100 |
| 運動挑戰 | sports | 100 |
| 日常物品 | things | 180 |
| 經典角色 | characters | 140 |
| 成語挑戰 | idioms | 95 |
| 表情情緒 | emotions | 80 |
| 名人明星 | celebrities | 100 |

## 來源與核對方式

1. 中華民國教育部（Ministry of Education, R.O.C.）。[《成語典》](https://dict.idioms.moe.edu.tw/)（版本 2020_20260929）：從[官方下載頁](https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/dict_idiomsdict_download.html)取得原始 ZIP／XLSX，對照「成語」欄的完整詞目。95 題全部精確對上，不以四個字或只在例句中出現作為通過條件。原始[公眾授權使用說明](../public/licenses/moe-idioms-public-license.pdf)完整保留。
2. 中華民國教育部（Ministry of Education, R.O.C.）。[《國語辭典簡編本》](https://dict.concised.moe.edu.tw/)（版本 2014_20260929）：從[官方下載頁](https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/dict_concised_download.html)核對「字詞名」欄。609 題精確對上，保留原始詞目、不複製釋義或例句。原始[公眾授權使用說明](../public/licenses/moe-concised-public-license.pdf)完整保留。
3. 臺灣料理另參照[交通部觀光署〈小吃飲品〉](https://www.taiwan.net.tw/m1.aspx?page=1&sno=0000072)，例如雞排、芒果冰、木瓜牛奶、油飯、芋圓及棺材板。沒有複製介紹文或照片。
4. 動物名稱及分類參照教育部常用詞、[臺北市立動物園動物圖鑑](https://www.zoo.gov.taipei/News.aspx?n=89722D9C422EDE5F&sms=EC306C3AB67422E3)與 [TaiCOL 臺灣物種名錄](https://taicol.tw/)。遊戲採常見名稱而非每題嚴格對應一個物種；昆蟲、鳥類、魚類等都屬動物世界。沒有大量匯入 GBIF 學名或冷門物種來湊數。
5. 運動項目用語參照中華奧林匹克委員會，例如[擊劍](https://www.tpenoc.net/sport/fencing/)、[跳水](https://www.tpenoc.net/sport/aquatic-diving/)及[跆拳道](https://www.tpenoc.net/sport/taekwondo/)。球場動作與健身活動另外由編輯整理。
6. 部分角色名稱參照[台灣寶可夢官方圖鑑](https://tw.portal-pokemon.com/pokedex/0025/)、[台灣迪士尼](https://www.disney.com.tw/disney-brand)及[皮克斯角色介紹](https://www.disney.com.tw/pixar-brand)。其他角色及名人為編輯整理的短名稱，不宣稱每題都有辭典詞條、官方熱度排名或外部逐題查核。真人只進名人類，樂團不當成真人角色。

分類、難度與是否適合表演為 Party Box 的編輯判斷，不是教育部或上述機構評定。來源僅作詞目／名稱核對，不使用辭典內容改寫成遊戲說明。授權為 CC BY-ND 3.0 TW 的教育部原始使用說明，遊戲內完整規則可查看，也納入離線快取。

`source-checks.json` 記錄 704 個精確詞目對照（固定 ID、原詞目、來源、Excel 列號），以及下載版本、ZIP 的 SHA-256。完整辭典只放在被 Git 忽略的 `.artifacts/charades-sources`，不部署到網站。一般自動測試不連線。

未出現在這版《成語典》下載詞目欄的候選詞，先不放進嚴格成語類；這不代表它必然不是成語。`哈哈大笑`、`嚇一跳`保留在表情情緒。沒有為達到原規劃的 180 題而補入未核對的成語。

## 資料與固定 ID

各類資料獨立於 `src/games/charades/data/*.ts`。`defineCards` 將明確指定的固定編號、短詞、難度及細分類標籤轉為 `CharadesCard`：

```ts
{ id: 'charades-a001', category: 'animals', difficulty: 'easy', label: '貓', tags: ['哺乳類'] }
```

編號不是陣列位置，也不從名稱產生。修改文字或搬動分類時保留原 ID；刪除的編號不再重用。前綴只代表首次建立的編號命名空間，不是日後的分類判斷依據。遊戲進行中不持久化，舊 localStorage 的玩家、隊名、模式與難度保留；原 `life` 設定對應新的日常生活，未知主題回到混合。

簡單只取 easy；標準取 easy＋normal；挑戰取 normal＋hard，沿用既有規則。每個分類、每個難度都至少有 20 題可抽取。短詞以六字內為上限，不靠完整情境句撐題數。

## 品質檢查

```sh
npm run check:charades
```

這個檢查也在 `npm run build` 前與 GitHub Actions 的 `npm test` 中執行。不通過就不能建置或部署：

- 固定 ID 唯一，標籤經 NFKC、空白、大小寫正規化後不得重複。
- 經編輯確認的別名不得重複，例如紅豆餅／車輪餅、皮諾丘／匹諾曹、小叮鈴／哆啦美、嫉妒／忌妒。
- 每題有正式分類、合法難度、細分類標籤；禁止直接建立 mixed 題目。
- 六字內、無句子標點或空白，檢查已知簡體字與非臺灣用語回歸。
- 成語必須對上教育部驗證紀錄；修改核對過的題目必須重新驗證來源。
- 防止職業、運動、真人、情緒等已知邊界案例放錯分類，檢查全部類別／難度皆有可用題目。

程式不能完全判斷所有簡繁異體、熟悉度、抽象詞是否好演，或自動理解所有分類邊界。這些仍要透過編輯檢視與真實聚會試玩；名人及角色尤其應定期按玩家年齡、興趣及認知度整理。避免使用過度模糊的相似度演算法，誤刪不同但相關的題目，例如不同泳式。

要重新從官方原始檔核對，先將上述兩個 ZIP 放在 `.artifacts/charades-sources/`，使用 PowerShell 7：

```powershell
pwsh -NoProfile -File scripts/check-charades-sources.ps1
```

此腳本唯讀解析原始工作簿，不啟動 Excel、不改寫官方檔案、不自行連線。更新資料後，使用 `-SnapshotPatch` 產生差異 patch，經檢視後套用；它不直接覆寫驗證檔。新增成語未精確匹配就會失敗；正常重驗亦檢查校驗碼、列號、文字與紀錄是否過期。
