# Playwright Runner Docs

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

開啟 `http://127.0.0.1:4280`。

UI 欄位：

- `目標 URL`: Playwright 要開啟的頁面。
- `Workflow JSON`: 多步驟流程。
- `指定開始時間`: 到時間後才執行，留空就是立即執行。
- `從第幾步開始`: 1-based 起始步驟。
- `slowMo`: 每個 Playwright action 額外放慢的毫秒數。
- `headless`: 不顯示瀏覽器。
- `完成後關閉瀏覽器`: workflow 結束後自動關閉 Playwright browser。

## 使用 CLI

```powershell
npm start -- --url http://127.0.0.1:4173/test-site/index.html --workflow examples/practice-flow.json
```

指定時間：

```powershell
npm start -- --url http://127.0.0.1:4173/test-site/index.html --workflow examples/practice-flow.json --start-at "2026-05-25 14:30:00"
```

從第 3 步開始：

```powershell
npm start -- --url http://127.0.0.1:4173/test-site/index.html --workflow examples/practice-flow.json --start-step 3
```

## 支援欄位

- `type`: `click`、`select`、`check`、`fill`
- `selector`: CSS selector
- `text`: 文字完全符合
- `ariaLabel`: 依 `aria-label` / `title` / `name` 搜尋
- `textIncludes`: 同一組內為 AND
- `textIncludes_1`, `textIncludes_2`: 多組之間為 OR，組內維持 AND
- `textExcludes`: OR，出現任一排除字就跳過
- `waitForMs`: 最多等待時間，預設 `10000`
- `pollMs`: 檢查間隔，預設 `500`
- `nextDelayMs`: 成功完成該步驟後額外等待
