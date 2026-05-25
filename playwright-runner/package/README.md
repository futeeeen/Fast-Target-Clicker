# Fast Target Clicker Playwright Runner

Playwright Runner 會用 Playwright 啟動瀏覽器，並依照 JSON workflow 執行點擊、選取、勾選與輸入流程。此版本不包含 stealth plugin。

## 安裝

```powershell
cd playwright-runner/package
npm install
npx playwright install chromium
```

## 啟動 Web UI

```powershell
npm run ui
```

開啟：

```text
http://127.0.0.1:4280
```

UI 預設目標 URL：

```text
https://futeeeen.github.io/Fast-Target-Clicker/practice/
```

## CLI 執行

```powershell
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json
```

使用 config：

```powershell
npm start -- --config examples/config.example.json
```

指定時間：

```powershell
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json --start-at "2026-05-25 14:30:00"
```

從指定步驟開始：

```powershell
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json --start-step 3
```

## Workflow JSON

```json
[
  { "type": "click", "selector": "#firstButton" },
  { "type": "click", "selector": "#quickButtons .quick-button" },
  {
    "type": "click",
    "selector": "div.seat-item",
    "textIncludes": ["5990"],
    "waitForMs": 10000
  },
  { "type": "select", "selector": "#ticketCount", "value": "2" },
  { "type": "check", "selector": "#agreeTerms" },
  { "type": "click", "selector": "#finishButton" }
]
```

## 支援欄位

- `type`: `click`、`select`、`check`、`fill`
- `selector`: CSS selector
- `text`: 文字完全符合
- `ariaLabel`: 比對 `aria-label`、`title`、`name`
- `textIncludes`: 同一組內為 AND
- `textIncludes_1`, `textIncludes_2`: 多組為 OR，每組內為 AND
- `textExcludes`: OR，只要出現任一排除文字就不選
- `waitForMs`: 最多等待目標出現多久，預設 `10000`
- `pollMs`: 等待期間多久檢查一次，預設 `500`
- `nextDelayMs`: 此步驟完成後額外等待多久再進下一步
