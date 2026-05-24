# 專案推送變更紀錄

## 2026.05.24_17:33:26
* 建立 Fast Target Clicker Chrome/Edge 擴充功能，可用 CSS selector、按鈕文字、aria-label/title/name 設定目標並自動點擊。
* 新增指定開始時間與倒數功能，時間到後才開始掃描並點擊目標。
* 新增進階多步驟流程，可跨頁執行 click/select/check/fill，並支援重設流程進度。
* 建立三頁測試網站，模擬第一個按鈕、三個「趕快點我」、多個 `div.seat-item`、下拉選單與 checkbox。
* 新增 `start-test-site.bat`，方便以 localhost 測試，避免 Chrome `file://` 權限限制。
* 新增 GitHub Actions Pages workflow，推到 `main` 後自動部署 `test-site` 到 GitHub Pages。
* 更新 README，補充安裝、測試網站、GitHub Pages 部署、時間到未執行的排查方式。
* Validation: ran `node --check content.js`, `node --check popup.js`, and parsed `manifest.json`.
