# 專案推送變更紀錄

## 2026.05.25_10:30:35
* 將原本 DOM / JavaScript 事件模擬的 Chrome/Edge 擴充功能版移到 `packages/dom-js-extension`，作為獨立可安裝產品資料夾。
* 新增 `packages/playwright-runner`，提供標準 Playwright CLI 版，支援同樣的 JSON workflow、指定 URL、指定時間、起始步驟、等待目標與文字條件。
* Playwright 版明確不包含 stealth plugin，也不提供規避網站偵測或風控的能力。
* 更新產品介紹頁與 README，補充兩種 package 的定位、安裝路徑與使用方式。
* Validation: parsed `packages/dom-js-extension/manifest.json`, ran `node --check` for extension scripts, docs scripts, and Playwright runner, and generated Playwright runner package lock.

## 2026.05.25_01:19:39
* 新增公開練習測試站 `docs/practice`，提供多頁流程、文字條件、表格 selector、數字開頭 id、延遲載入與表單操作情境。
* 產品介紹頁新增練習站入口與情境說明，讓使用者能直接從首頁進入測試站實作。
* 根目錄 `test-site` 同步更新為新版練習站，移除舊的分頁式測試檔案。
* README 補充 GitHub Pages 練習站網址與可練習的功能範圍。
* Validation: ran `node --check` for practice scripts and docs script, parsed `extension/manifest.json`, and reviewed local practice pages.

## 2026.05.25_01:10:48
* 將可安裝的擴充功能本體整理到 `extension` 資料夾，根目錄保留文件、產品介紹頁與測試資源。
* 新增 `extension/README.md`，讓使用者拿到產品資料夾後可直接依說明用「載入未封裝項目」安裝。
* 更新產品介紹頁，新增安裝方式、專案結構與指定時間觸發流程說明。
* 更新根目錄 README，將安裝路徑改為 `C:\futen\Project\Auto-click\extension`。
* Validation: parsed `extension/manifest.json`, ran `node --check` for extension scripts and docs script, and reviewed local docs rendering.

## 2026.05.25_00:47:22
* 新增 `docs` 產品介紹頁，包含響應式首頁、功能說明、操作流程、欄位指南與互動式 JSON 範例切換。
* 將 GitHub Pages workflow 部署來源從 `test-site` 改為 `docs`，讓 Pages 首頁成為正式產品介紹頁。
* 更新 README，補充產品介紹頁網址與內容定位。
* Validation: checked static files with Node, parsed `manifest.json`, and reviewed local rendering plus responsive layout rules.

## 2026.05.25_00:36:31
* 新增 Chrome Side Panel 模式，點工具列圖示會在瀏覽器右側開啟 Fast Target Clicker。
* 移除 action popup 入口，改用右側固定面板呈現設定、倒數與流程狀態。
* 調整 popup/side panel 寬度樣式，讓同一個畫面在右側面板中更自然。
* Validation: ran `node --check background.js`, `node --check popup.js`, `node --check content.js`, and parsed `manifest.json`.

## 2026.05.25_00:31:34
* 新增勝利獎盃風格的擴充功能 icon，提供 16/32/48/128 px PNG。
* 更新 manifest 的 extension icon 與 action toolbar icon 設定。
* Validation: parsed `manifest.json` and confirmed generated icon files.

## 2026.05.25_00:27:39
* 簡化 popup 介面，移除較少使用的單步 selector/text/aria/checkbox/delay 欄位。
* popup 現在聚焦在指定開始時間、多步驟 JSON、起始步驟、流程狀態與操作按鈕。
* 多步驟流程在 UI 中固定啟用，底層單步設定仍保留安全預設以避免破壞既有程式邏輯。
* Validation: ran `node --check popup.js`, `node --check content.js`, and `node --check background.js`.

## 2026.05.25_00:20:47
* 新增每一步的 `waitForMs` 與 `pollMs`，目標尚未出現時會持續等待並輪詢。
* 未設定等待參數時預設最多等待 `10000` ms、每 `500` ms 檢查一次。
* 等待期間 popup 顯示「正在等待」，超時仍找不到目標時顯示 `step-target-not-found`，原本 `nextDelayMs` 仍保留為成功後延遲下一步。
* Validation: ran `node --check content.js`, `node --check popup.js`, and `node --check background.js`.

## 2026.05.25_00:10:47
* 新增 `textIncludes_1`, `textIncludes_2` 等多組文字條件，同組內維持 AND，不同組之間改為 OR。
* 保留原本 `textIncludes` 用法，並可與編號群組一起使用。
* 無 selector 的文字搜尋會優先選真正可互動元素，再退到 `li/label` 與一般容器，降低誤點外層區塊的機率。
* Validation: ran `node --check content.js`, `node --check popup.js`, and `node --check background.js`.

## 2026.05.24_23:52:50
* 新增 `textIncludes` 與 `textExcludes` 條件，支援同一步必須包含多個文字並排除指定狀態。
* 有 selector 時會在 selector 結果中再做文字條件篩選；沒有 selector 時會掃描常見可點擊元素並優先選文字較貼近的目標。
* 更新 README，加入依狀態文字選擇區域的設定範例。
* Validation: ran `node --check content.js`, `node --check popup.js`, and `node --check background.js`.

## 2026.05.24_23:35:18
* 修正 `nextDelayMs` 在點擊後跳頁時可能失效的問題；現在會先保存下一步與恢復時間，讓新頁面載入後接續執行。
* workflow resume 狀態改由 `sessionStorage` 記錄 active/resumeAt，避免舊頁面 timer 被導航清掉後流程中斷。
* Validation: ran `node --check content.js`, `node --check popup.js`, and `node --check background.js`.

## 2026.05.24_23:00:58
* 新增「從第幾步開始」設定，可從指定步驟往下執行，方便單獨測後半段流程。
* 修正「重設進度」會觸發執行的問題，現在只重設流程進度，不會掃描或點擊。
* 進階流程在非明確觸發時不會自動執行，避免儲存設定或 DOM 變動誤觸流程。
* Validation: ran `node --check content.js`, `node --check popup.js`, and `node --check background.js`.

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
