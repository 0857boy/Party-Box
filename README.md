# Party Box

以手機與平板為主要裝置、local-first 的多人派對遊戲 PWA。平台首頁由遊戲 registry 產生，目前可遊玩 Avalon／阿瓦隆、誰是臥底、爆笑猜詞與誰是假畫家。

## 功能

- Party Box 遊戲首頁與可擴充的遊戲 registry
- 支援時第一次有效點擊自動進入全螢幕；首頁可手動切換，退出後不會強制重進
- PWA 優先全螢幕啟動，依瀏覽器能力退回獨立視窗；停用雙擊縮放、保留雙指縮放
- 5–10 人 Avalon 玩家與特殊角色設定
- 資料驅動的角色牌組、陣營比例驗證與隨機分配
- Pass Device → 長按揭露 → 翻牌 → 安全蓋牌流程
- Merlin、Percival、Morgana、Assassin、Mordred、Oberon 的正確情報規則
- 完整五回合流程：領袖選隊、桌上同步表決、任務秘密出牌與領袖輪替
- 依人數切換任務人數，並支援 7 人以上第 4 回合需要兩張失敗牌
- 五次連續否決、三次任務成敗、刺客最終刺殺與正／邪勝負結算
- 完成對局會在本機保留最近 20 局身份、表決結果、任務與湖中女神復盤
- 8 人以上可選的湖中女神忠誠檢視流程
- 4–12 人誰是臥底：秘密抽詞、可選白板、輪流描述、實體同步指認、淘汰與勝負結算
- 300 組原創詞組，題材涵蓋生活、世界與搞笑情境，統一採用台灣常用詞彙
- 跨遊戲共用玩家名單，並在 localStorage 保留最近使用的 5 組名單
- 4–16 人爆笑猜詞：快節奏隊伍賽、自選難度、手動／隨機分隊、改隊名與限時計分
- 483 題大眾短詞，分成動物、美食、動作職業、日常物品、經典角色與成語表情；不使用長句情境
- 預設每隊 2 次、每次 45 秒，可改為每隊 1–3 次、每次 30／45／60／90 秒，兩隊交替且出場次數相同
- 純動作／自由描述二選一；猜對加 1 分、跳過不扣分，按鈕或左右滑操作，結束後可看各次得分與題目
- 記憶三輪保留為選用玩法：同一副牌依序用自由描述、一字提示與無聲演出
- 額頭猜題／手持提示兩種拿法；明確授權後以向下翻猜對、向上翻跳過，須回正才可再次判定
- 開局 3 秒倒數（不消耗回合時間）、綠／紅色框與文字回饋；支援裝置附加震動，iPhone Safari 不支援網頁震動
- 翻轉採 80ms 回正／60ms 穩定判定，無固定冷卻；倒數期間可先回正就緒，換題沿用同一畫布，色框顯示 220ms 不阻擋輸入
- 啟用翻轉後，倒數與遊玩固定橫向；可用時請求全螢幕／系統橫向鎖定，否則以旋轉橫向畫面備援，回合結束恢復正常方向
- 可選前鏡頭錄影與收音；影片保存在本機 IndexedDB，錄影中心可回看、下載、分享及刪除，不上傳
- 5–10 人誰是假畫家：秘密題目、兩輪一筆畫、共同觸控畫布、同步指認與假畫家反猜
- 100 組適合繪畫的原創題目，並支援單局、3 分或原版 5 分賽制
- 手機直向、平板直向與平板橫向的流動式排版
- 共用 Theme token、RoleCard、GameButton、PlayerChip、GameHeader 與 AudioControl
- 版本化 localStorage（玩家、角色偏好、音量與主題偏好）
- PWA manifest、更新提示、service worker 與完整必要資源預快取
- `prefers-reduced-motion`、鍵盤 focus、ARIA 與至少 44px 觸控目標

## 開發

```bash
npm install
npm run dev
```

## 驗證

```bash
npm run test
npm run build
npm run test:e2e
```

`test:e2e` 會先建立正式版本，再以本機 Chrome 驗證 390×844 與 768×1024 版面、完整五人身份輪替，以及 service worker 快取後的離線流程。

### 手機翻轉與錄影

網頁載入時不能直接要求全螢幕，須先有使用者操作。Party Box 在第一次一般點擊時嘗試進入；輸入欄位與感測／錄影／分享操作不會觸發，以免干擾權限。若 iPhone 瀏覽器無法直接全螢幕，可將網站加入主畫面再開啟。雙擊不會縮放，仍保留雙指縮放；實際 Safari 與 PWA 表現需真機確認。

請使用 HTTPS（例如下方 GitHub Pages），或在電腦使用 localhost。手機透過區網 `http://192.168...` 開啟時，感測／相機可能無法使用，仍可按鈕或滑動遊玩。每回合錄影在開始前明確選取，相機權限等待期間可取消；3 秒倒數後才錄影與計時。請先取得在場朋友同意。切換 App 或鎖定螢幕會提前結束回合並停止錄影，避免背景錄製。

影片只保存在該裝置、該瀏覽器的 IndexedDB，不使用 localStorage 儲存影片；清除網站資料或瀏覽器回收儲存空間可能使影片遺失，重要片段請下載備份。分享依瀏覽器支援程度，不能直接分享時可下載後自行分享。iPhone 的實際感測靈敏度、相機方向及分享面板仍需真機驗收；瀏覽器自動測試涵蓋模擬翻轉、權限拒絕、取消、真實 MediaRecorder 搭配合成畫面與本機影片儲存。

## 架構

- `src/app`：路由、layout、遊戲 registry
- `src/components`：跨遊戲 UI、玩家、音訊與遊戲元件
- `src/games/avalon`：Avalon 專屬資料、純邏輯、型別、session 與畫面
- `src/stores`：版本化平台偏好
- `src/styles`：共用設計系統與 game theme token
- `tests/e2e`：正式 PWA 的響應式、共享裝置與離線流程

新遊戲應在 `src/games/<game-id>` 內自成模組，並只需新增一筆 `gamesRegistry` 定義即可出現在首頁；共用互動元件不應放進特定遊戲資料夾。

## 部署

`npm run build` 會輸出純靜態內容至 `dist/`。路由使用 hash history，`base` 為相對路徑，可部署至 GitHub Pages、Cloudflare Pages 或 Vercel。部署平台的 build command 設為 `npm run build`，output directory 設為 `dist`。

### GitHub Pages（GitHub Actions）

部署流程位於 `.github/workflows/deploy-pages.yml`，使用 GitHub 官方 Pages artifact 部署，不需要 `gh-pages` 分支或額外的 token。

1. 到 repository 的 **Settings → Pages → Build and deployment**，將 **Source** 設為 **GitHub Actions**。
2. 將變更推送到 `main`；也可以在 **Actions → Deploy Party Box to GitHub Pages → Run workflow** 手動執行。
3. 流程使用 Node.js 24 與 `npm ci` 安裝鎖定的套件，通過單元測試後建置並部署 `dist/`。

網站網址：<https://0857boy.github.io/Party-Box/>

Actions 會依 Pages 設定自動傳入 Vite 的 `--base`，使 JS、CSS、圖片、manifest 與 service worker 都使用正確的專案子路徑；本機開發仍沿用相對路徑。未來新增自訂網域時，也會自動調整至根目錄。

部署機制參考 [GitHub Pages 官方文件](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 註解
Party Box is an unofficial, non-commercial fan-made project for personal use.
Game names and trademarks belong to their respective owners. This project is not affiliated with or endorsed by the original publishers.
