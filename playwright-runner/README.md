# Playwright Runner

這是 Fast Target Clicker 的 Playwright 產品線。

## 資料夾

- `package`: CLI runner 與 workflow engine。
- `ui`: 本機 Web UI，用瀏覽器操作 Playwright runner。
- `docs`: Playwright runner 使用說明。

## 快速開始

```powershell
cd C:\futen\Project\Auto-click\playwright-runner\package
npm install
npx playwright install chromium
npm run ui
```

開啟：

```text
http://127.0.0.1:4280
```

UI 可以填 URL、貼 workflow JSON、設定指定時間、起始步驟、slowMo、headless，並查看執行狀態。預設 URL 是公開練習站 `https://futeeeen.github.io/Fast-Target-Clicker/practice/`。
