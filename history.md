# 專案推送變更紀錄

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
