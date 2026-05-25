# Fast Target Clicker Playwright Runner

這是 Fast Target Clicker 的 Playwright 版本。它使用同一種多步驟 JSON 流程格式，適合在自己的測試站、內部系統或允許自動化的網站上執行。

此版本不包含 stealth plugin，也不提供規避網站偵測或風控的功能。

## 安裝

```powershell
cd playwright-runner/package
npm install
npx playwright install chromium
```

## 執行練習站範例

先在專案根目錄啟動本機測試站：

```powershell
..\..\test-site\start-test-site.bat
```

## 使用 UI

```powershell
npm run ui
```

接著開啟：

```text
http://127.0.0.1:4280
```

UI 可以填 URL、貼 workflow JSON、設定指定時間、起始步驟、slowMo、headless，並查看每一步執行狀態。

再執行 Playwright runner：

```powershell
cd playwright-runner/package
npm start -- --url http://127.0.0.1:4173/test-site/index.html --workflow examples/practice-flow.json
```

## 使用 config 檔

```powershell
npm start -- --config examples/config.example.json
```

## 指定時間啟動

```powershell
npm start -- --url http://127.0.0.1:4173/test-site/index.html --workflow examples/practice-flow.json --start-at "2026-05-25 14:30:00"
```

## 從指定步驟開始

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

## 注意

Playwright 版會直接開啟一個由 Playwright 控制的瀏覽器視窗，不是 Chrome extension side panel。若你需要在自己目前手動開啟的分頁中操作，請使用 `dom-js-runner/extension` 版本。
