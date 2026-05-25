# Fast Target Clicker

Fast Target Clicker 是一組可設定 JSON workflow 的自動化工具，目前拆成兩條產品線：

- `dom-js-runner`: Chrome/Edge 擴充功能版，透過 DOM / JavaScript 事件在目前分頁執行。
- `playwright-runner`: Playwright 版，透過 CLI 或本機 Web UI 開啟 Playwright browser 執行。
- `test-site`: 本機練習站，提供多頁流程、文字條件、表格 selector、數字開頭 id、延遲載入與表單操作情境。

## 資料夾結構

```text
Fast-Target-Clicker/
├─ dom-js-runner/
│  ├─ extension/   Chrome/Edge 擴充功能本體
│  └─ docs/        DOM/JS 版產品介紹頁
├─ playwright-runner/
│  ├─ package/     Playwright CLI runner
│  ├─ ui/          Playwright Runner UI
│  └─ docs/        Playwright 版文件
├─ test-site/      本機練習站
├─ README.md
└─ history.md
```

## DOM / JavaScript Extension

安裝：

1. 打開 Chrome 或 Edge。
2. 進入 `chrome://extensions` 或 `edge://extensions`。
3. 開啟「開發人員模式」。
4. 點「載入未封裝項目」。
5. 選擇 `C:\futen\Project\Auto-click\dom-js-runner\extension`。

安裝後點工具列圖示，會在瀏覽器右側開啟 Side Panel，可以貼 workflow JSON、設定指定時間、立刻測試、查看流程狀態。

## Playwright Runner UI

第一次安裝：

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

UI 可以設定目標 URL、workflow JSON、指定開始時間、起始步驟、slowMo、headless，並顯示目前執行狀態。

## Playwright CLI

```powershell
cd C:\futen\Project\Auto-click\playwright-runner\package
npm start -- --url http://127.0.0.1:4173/test-site/index.html --workflow examples/practice-flow.json
```

指定時間：

```powershell
npm start -- --url http://127.0.0.1:4173/test-site/index.html --workflow examples/practice-flow.json --start-at "2026-05-25 14:30:00"
```

## 本機練習站

啟動：

```powershell
cd C:\futen\Project\Auto-click\test-site
.\start-test-site.bat
```

網址：

```text
http://127.0.0.1:4173/test-site/index.html
```

## Workflow JSON

兩個 runner 都使用相近的 JSON workflow 概念：

```json
[
  { "type": "click", "selector": "#firstButton" },
  { "type": "click", "text": "趕快點我" },
  {
    "type": "click",
    "selector": "div.seat-item",
    "textIncludes": ["特C區", "5990"],
    "textExcludes": ["已售完"],
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
- `textIncludes`: 陣列內為 AND
- `textIncludes_1`, `textIncludes_2`: 多組 OR，組內 AND
- `textExcludes`: OR，出現任一排除字就跳過
- `waitForMs`: 最多等待時間
- `pollMs`: 檢查間隔
- `nextDelayMs`: 成功完成該步驟後額外等待

## GitHub Pages

GitHub Pages 目前部署 `dom-js-runner/docs`：

```text
https://futeeeen.github.io/Fast-Target-Clicker/
```
