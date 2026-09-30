# Party Box

以手機與平板為主要裝置、local-first 的多人派對遊戲 PWA。平台首頁由遊戲 registry 產生，目前可遊玩 Avalon／阿瓦隆、誰是臥底、爆笑猜詞與誰是假畫家。

## 功能

- Party Box 遊戲首頁與可擴充的遊戲 registry
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
- 4–16 人爆笑猜詞：自動分隊、共用牌庫、60 秒計時、滑動判定與三輪累積計分
- 120 張原創猜詞卡；三輪依序使用自由描述、一字提示與無聲演出
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


## 註解
Party Box is an unofficial, non-commercial fan-made project for personal use.
Game names and trademarks belong to their respective owners. This project is not affiliated with or endorsed by the original publishers.
