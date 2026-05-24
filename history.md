# 專案推送變更紀錄

## 2026.05.24_22:51:55
* 新增進階流程狀態顯示，可在 popup 看到正在執行第幾步、最後完成第幾步、卡住原因與目前目標。
* content script 每一步執行前後會回報 workflow status，background service worker 會暫存最新狀態供 popup 顯示。
* 「重設進度」會同步清除狀態顯示，方便重新測試。
* Validation: ran `node --check content.js`, `node --check popup.js`, and `node --check background.js`.

## 2026.05.24_17:58:55
* 釐清按鈕職責：「載入範例」只填入範例，「儲存設定」只保存與安排倒數，不再直接執行流程。
* 新增 `background.js` 與 `chrome.alarms` 排程，指定時間到時由背景 service worker 通知目標分頁從第 1 步執行。
* 移除 content script 自行等待指定時間的頁面 timer，避免與背景排程重複或失效。
* Validation: ran `node --check content.js`, `node --check popup.js`, `node --check background.js`, and parsed `manifest.json`.

## 2026.05.24_17:51:25
* 修正更新擴充功能後舊頁面可能出現 `Extension context invalidated` 的問題。
* 將多步驟流程進度改存到頁面的 `sessionStorage`，並保留目前文件的記憶體 fallback。
* 「載入範例」與「重設進度」改為通知目前分頁重設流程，避免 content script 依賴已失效的 extension storage。
* Validation: ran `node --check content.js` and `node --check popup.js`.

## 2026.05.24_17:48:52
* 優化多步驟流程觸發規則，新增共用的立即執行路徑，執行前一定重設到第 1 步。
* 「立刻測試」現在會先儲存設定、重設流程進度，再忽略倒數與啟用開關直接執行。
* 指定時間到時改為呼叫同一套立即執行邏輯，確保到點會從第 1 步開始跑。
* Validation: ran `node --check content.js` and `node --check popup.js`.

## 2026.05.24_17:40:56
* 修正進階多步驟流程測試回報太早的問題，現在會等待目前步驟實際執行結果後再回傳狀態。
* 「立刻測試」現在會顯示目前第幾步與卡住原因，方便判斷 selector、頁面或流程進度問題。
* 「載入範例」會同步重設流程進度，避免沿用上一輪測試做到中段或結束的狀態。
* Validation: ran `node --check content.js` and `node --check popup.js`.

## 2026.05.24_17:33:26
* 建立 Fast Target Clicker Chrome/Edge 擴充功能，可用 CSS selector、按鈕文字、aria-label/title/name 設定目標並自動點擊。
* 新增指定開始時間與倒數功能，時間到後才開始掃描並點擊目標。
* 新增進階多步驟流程，可跨頁執行 click/select/check/fill，並支援重設流程進度。
* 建立三頁測試網站，模擬第一個按鈕、三個「趕快點我」、多個 `div.seat-item`、下拉選單與 checkbox。
* 新增 `start-test-site.bat`，方便以 localhost 測試，避免 Chrome `file://` 權限限制。
* 新增 GitHub Actions Pages workflow，推到 `main` 後自動部署 `test-site` 到 GitHub Pages。
* 更新 README，補充安裝、測試網站、GitHub Pages 部署、時間到未執行的排查方式。
* Validation: ran `node --check content.js`, `node --check popup.js`, and parsed `manifest.json`.
