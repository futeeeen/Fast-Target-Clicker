# Playwright Runner Docs

這份文件說明 Fast Target Clicker 的 Playwright Runner 版本。此版本會透過 Playwright 啟動瀏覽器並執行 JSON workflow，適合固定環境測試、CLI 腳本化與本機 Web UI 操作。

## 安裝

```powershell
cd C:\futen\Project\Auto-click\playwright-runner\package
npm install
npx playwright install chromium
```

## 使用 UI

```powershell
cd C:\futen\Project\Auto-click\playwright-runner\package
npm run ui
```

開啟：

```text
http://127.0.0.1:4280
```

UI 欄位：

- `目標 URL`: Playwright 要開啟的頁面。
- `Workflow JSON`: 多步驟流程設定。
- `指定開始時間`: 設定後不會自動執行，必須按「開始倒數」才會排程。
- `從第幾步開始`: 1-based 起始步驟。
- `slowMo`: 放慢 Playwright action，方便觀察。
- `headless`: 不顯示瀏覽器視窗。
- `完成後關閉瀏覽器`: workflow 結束後關閉 Playwright browser。

預設目標 URL：

```text
https://futeeeen.github.io/Fast-Target-Clicker/practice/
```

按「載入練習站範例」會載入可直接用在公開練習站的 JSON。

## 使用 CLI

```powershell
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json
```

指定時間：

```powershell
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json --start-at "2026-05-25 14:30:00"
```

從第 3 步開始：

```powershell
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json --start-step 3
```

## 步驟欄位

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
