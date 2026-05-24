# Fast Target Clicker

這是一個可設定的 Chrome/Edge 擴充功能，用來在目標按鈕出現時立刻點擊。適合比賽當天早上才知道按鈕條件的情境。

## 安裝

1. 打開 Chrome 或 Edge。
2. 進入 `chrome://extensions` 或 `edge://extensions`。
3. 開啟「開發人員模式」。
4. 選「載入未封裝項目」。
5. 選擇這個資料夾：`C:\futen\Project\Auto-click`

## 比賽當天設定

優先使用 CSS selector，因為最快也最準：

```text
#submit
.buy-button
button[data-action="start"]
button[aria-label="submit"]
```

如果不知道 selector，就填「按鈕文字」，例如：

```text
立即搶點
送出
購買
開始
```

也可以填 `aria-label / title / name`，例如：

```text
race-go
submit
buy
```

設定後打開右上角開關，按「儲存設定」。頁面上符合條件的目標一出現，擴充功能就會點擊。

## 指定時間開始

如果比賽會統一在某個時間開始：

1. 先打開比賽頁面，並確認目標按鈕已經能被設定條件找到。
2. 在擴充功能填好 `CSS selector`、按鈕文字或 `aria-label`。
3. 在「指定開始時間」選擇比賽開始的日期與時間。
4. 打開右上角啟用開關。
5. 按「儲存設定」。
6. 保持比賽分頁開著，最好讓它停在前景分頁，倒數到 0 時會立刻開始尋找並點擊。

「立刻測試」會忽略倒數和啟用開關，直接對目前頁面測一次，方便你在正式開始前確認設定正確。正式比賽前也要確認電腦系統時間是準的。

## 測試

1. 先載入擴充功能。
2. 如果要直接測本機 HTML，在擴充功能詳細資料裡開啟「允許存取檔案網址」。
3. 用瀏覽器打開 `C:\futen\Project\Auto-click\test-page.html`。
4. 擴充功能設定：
   - CSS selector: `.race-target`
   - 啟用開關: 開
5. 按測試頁的「產生目標按鈕」。
6. 看到「已點擊成功」就代表自動點擊正常。

## 多頁流程測試網站

完整流程測試頁在：

```text
C:\futen\Project\Auto-click\test-site\index.html
```

建議用 localhost 開，不要直接開 `C:\...index.html`。直接開本機檔案時，Chrome 會需要額外打開「允許存取檔案網址」，容易測到一半被權限卡住。

啟動方式：

```text
C:\futen\Project\Auto-click\start-test-site.bat
```

開啟後使用：

```text
http://127.0.0.1:4173/test-site/index.html
```

推上 GitHub 後會透過 GitHub Actions 自動部署測試網站。部署完成後可用：

```text
https://futeeeen.github.io/Fast-Target-Clicker/
```

如果第一次部署還看不到頁面，請到 GitHub repo 的 `Actions` 分頁確認 `Deploy test site to GitHub Pages` 是否完成，並到 `Settings` -> `Pages` 確認來源為 `GitHub Actions`。

流程：

1. 首頁點「第一個按鈕」。
2. 會出現三個「趕快點我」，任一個都會到第二頁。
3. 第二頁點「第二個按鈕」。
4. 會出現多個 `div.seat-item`，任一個都會到第三頁。
5. 第三頁有數量下拉選單與確認 checkbox。

如果要測整個流程，打開擴充功能的「進階多步驟流程」，按「載入範例」，再按「重設進度」與「儲存設定」。範例步驟如下：

```json
[
  { "type": "click", "selector": "#firstButton" },
  { "type": "click", "text": "趕快點我" },
  { "type": "click", "selector": "#secondButton" },
  { "type": "click", "selector": "div.seat-item" },
  { "type": "select", "selector": "#ticketCount", "value": "2" },
  { "type": "check", "selector": "#agreeTerms" },
  { "type": "click", "selector": "#finishButton" }
]
```

比賽當天如果才知道下拉選單要選幾，只要改第 5 步的 `"value"`。

按「立刻測試」時會先儲存目前設定、把流程進度重設到第 1 步，然後立刻執行。指定開始時間到時也會使用同一套立即執行流程，所以每次到點都會從第 1 步開始跑。如果沒有找到目標，彈窗會顯示卡住原因，例如 `step-target-not-found`。

流程進度會存在目前頁面的 `sessionStorage`，不再依賴擴充功能自己的 storage。這可以避免更新擴充功能後，舊頁面出現 `Extension context invalidated` 造成流程中斷。

按鈕行為：

- 「載入範例」只會把範例 JSON 填進欄位，不會執行。
- 「儲存設定」只會保存設定並安排指定時間，不會執行。
- 「立刻測試」才會從第 1 步立即執行。
- 指定時間到時由背景 service worker 的 `chrome.alarms` 觸發，會對儲存時所在的分頁從第 1 步執行。

進階流程下方會顯示「流程狀態」，包含正在執行第幾步、最後完成第幾步、卡住原因，以及目前步驟使用的 selector/text/value。

## 時間到了沒有執行時

先照這個順序檢查：

1. 如果網址列是 `C:\...` 或 `file:///...`，先改用 `start-test-site.bat` 開 localhost 測試。
2. 到 `chrome://extensions` 按這個擴充功能的重新整理。
3. 回到測試或比賽頁面，重新整理頁面一次。
4. 打開擴充功能，確認右上角啟用開關是開的。
5. 按「重設進度」。
6. 按「儲存設定」。
7. 如果畫面顯示「時間已到，正在執行」，再按一次「儲存設定」會立刻補掃描目前分頁。

這版也會在儲存時自動確認目前分頁有執行器；如果分頁是在擴充功能更新前就開著，會自動補注入。

## 建議策略

- 最快：用精準 CSS selector。
- 最穩：selector 搭配按鈕文字或 aria-label。
- 如果頁面會動態載入按鈕，不需要重整，程式會自動監看新增元素。
- 比賽前先在測試頁練一次設定流程，把要填哪個欄位練熟。
