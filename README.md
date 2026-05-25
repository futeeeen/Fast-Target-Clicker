# Fast Target Clicker

Fast Target Clicker 是一套可設定 JSON workflow 的自動化流程工具，主要整理成兩種版本：

- `dom-js-runner`: Chrome / Edge 擴充功能，透過目前分頁的 DOM / JavaScript 事件模擬執行流程。
- `playwright-runner`: Playwright CLI 與本機 Web UI，透過 Playwright browser 執行同一份 workflow JSON。
- `test-site`: 本機練習站來源，用來測試多頁流程、相同文字按鈕、座位狀態、下拉選單、checkbox 與延遲載入。
- `project-site`: GitHub Pages 的專案入口網站，可選擇 DOM Extension 或 Playwright Runner 版本。

## 資料夾結構

```text
Fast-Target-Clicker/
├─ project-site/          GitHub Pages 入口網站
├─ dom-js-runner/
│  ├─ extension/          Chrome / Edge 擴充功能本體
│  └─ docs/               DOM Extension 介紹頁與公開練習站
├─ playwright-runner/
│  ├─ package/            Playwright CLI runner
│  ├─ ui/                 Playwright Runner Web UI
│  └─ docs/               Playwright Runner 介紹頁與文件
├─ test-site/             本機練習站
├─ README.md
└─ history.md
```

## 公開頁面

GitHub Pages 會部署成：

```text
https://futeeeen.github.io/Fast-Target-Clicker/
```

部署後路徑：

- `/`: 專案入口網站
- `/dom-js-runner/`: DOM / JavaScript Extension 介紹頁
- `/playwright-runner/`: Playwright Runner 介紹頁
- `/practice/`: 公開練習站

## DOM / JavaScript Extension

適合已經手動開好目標網頁，想在目前分頁用右側 Side Panel 執行流程的情境。

安裝方式：

1. 打開 Chrome 或 Edge。
2. 進入 `chrome://extensions` 或 `edge://extensions`。
3. 開啟「開發人員模式」。
4. 點「載入未封裝項目」。
5. 選擇 `C:\futen\Project\Auto-click\dom-js-runner\extension`。

主要功能：

- 使用目前分頁執行 JSON workflow。
- 支援秒級指定時間、開始倒數、取消倒數。
- 支援從指定步驟開始。
- 支援 `click`、`select`、`check`、`fill`。
- 支援 selector、文字條件、排除文字、自動等待。

## Playwright Runner UI

適合需要 Playwright 啟動瀏覽器、固定測試環境、CLI 腳本化或本機 Web UI 操作的情境。

第一次使用：

```powershell
cd C:\futen\Project\Auto-click\playwright-runner\package
npm install
npx playwright install chromium
```

啟動 UI：

```powershell
npm run ui
```

開啟：

```text
http://127.0.0.1:4280
```

UI 可設定：

- 目標 URL
- Workflow JSON
- 從第幾步開始
- 指定開始時間與倒數
- `headless`
- `slowMo`
- 完成後是否關閉瀏覽器

## Playwright CLI

```powershell
cd C:\futen\Project\Auto-click\playwright-runner\package
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json
```

指定時間執行：

```powershell
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json --start-at "2026-05-25 14:30:00"
```

從第 3 步開始：

```powershell
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json --start-step 3
```

## 練習站

公開練習站：

```text
https://futeeeen.github.io/Fast-Target-Clicker/practice/
```

本機啟動：

```powershell
cd C:\futen\Project\Auto-click\test-site
.\start-test-site.bat
```

## Workflow JSON 範例

兩種 runner 使用同一套 JSON workflow 格式：

```json
[
  { "type": "click", "selector": "#firstButton" },
  { "type": "click", "selector": "#quickButtons .quick-button" },
  { "type": "click", "selector": "#secondButton" },
  {
    "type": "click",
    "selector": "div.seat-item",
    "textIncludes": ["5990"],
    "waitForMs": 10000,
    "pollMs": 500
  },
  { "type": "select", "selector": "#ticketCount", "value": "2" },
  { "type": "check", "selector": "#agreeTerms" },
  { "type": "click", "selector": "#finishButton" }
]
```

常用欄位：

- `type`: `click`、`select`、`check`、`fill`
- `selector`: CSS selector
- `text`: 文字完全符合
- `textIncludes`: 同一組內為 AND
- `textIncludes_1`, `textIncludes_2`: 多組條件為 OR，每組內仍為 AND
- `textExcludes`: OR，只要出現任一排除文字就不選
- `waitForMs`: 最多等待目標出現多久，預設 `10000`
- `pollMs`: 等待期間多久檢查一次，預設 `500`
- `nextDelayMs`: 此步驟完成後額外等待多久再進下一步

## 注意事項

本專案提供的是可設定流程執行工具與練習環境。請只在你有權操作、測試或授權的網站與流程中使用。
