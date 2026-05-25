# Fast Target Clicker

Fast Target Clicker ?臭?蝯閮剖? JSON workflow ???撌亙嚗???璇??嚗?
- `dom-js-runner`: Chrome/Edge ?游?????? DOM / JavaScript 鈭辣?函???銵?- `playwright-runner`: Playwright ???? CLI ?璈?Web UI ?? Playwright browser ?瑁???- `test-site`: ?祆?蝺渡?蝡???憭?瘚???摮?隞嗚”??selector?摮???id?辣?脰??亥?銵典??????
## 鞈?憭曄?瑽?
```text
Fast-Target-Clicker/
?? dom-js-runner/
?? ?? extension/   Chrome/Edge ?游???祇?
?? ?? docs/        DOM/JS ???蝝寥?
?? playwright-runner/
?? ?? package/     Playwright CLI runner
?? ?? ui/          Playwright Runner UI
?? ?? docs/        Playwright ??隞??? test-site/      ?祆?蝺渡?蝡??? README.md
?? history.md
```

## DOM / JavaScript Extension

摰?嚗?
1. ?? Chrome ??Edge??2. ?脣 `chrome://extensions` ??`edge://extensions`??3. ?????潔犖?⊥芋撘?4. 暺??交撠????5. ?豢? `C:\futen\Project\Auto-click\dom-js-runner\extension`??
摰?敺?撌亙??蝷綽???汗?典?湧???Side Panel嚗隞亥票 workflow JSON?身摰?摰????餅葫閰艾??蝔???
## Playwright Runner UI

蝚砌?甈∪?鋆?

```powershell
cd C:\futen\Project\Auto-click\playwright-runner\package
npm install
npx playwright install chromium
```

?? UI嚗?
```powershell
npm run ui
```

??嚗?
```text
http://127.0.0.1:4280
```

UI ?臭誑閮剖??格? URL?orkflow JSON??摰?憪??絲憪郊撽lowMo?eadless嚗蒂憿舐內?桀??瑁????
## Playwright CLI

```powershell
cd C:\futen\Project\Auto-click\playwright-runner\package
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json
```

????嚗?
```powershell
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json --start-at "2026-05-25 14:30:00"
```

## ?祆?蝺渡?蝡?
??嚗?
```powershell
cd C:\futen\Project\Auto-click\test-site
.\start-test-site.bat
```

蝬脣?嚗?
```text
https://futeeeen.github.io/Fast-Target-Clicker/practice/
```

## Workflow JSON

?拙?runner ?賭蝙?函餈? JSON workflow 璁艙嚗?
```json
[
  { "type": "click", "selector": "#firstButton" },
  { "type": "click", "selector": "#quickButtons .quick-button" },
  {
    "type": "click",
    "selector": "div.seat-item",
    "textIncludes": ["5990"],
    "waitForMs": 10000,
    "pollMs": 500
  },
  { "type": "select", "selector": "#ticketCount", "value": "2" },
  { "type": "check", "selector": "#agreeTerms" },
  { "type": "click", "selector": "#finishButton" }
]
```

撣貊甈?嚗?
- `type`: `click`?select`?check`?fill`
- `selector`: CSS selector
- `text`: ??摰蝚血?
- `textIncludes`: ????抒 AND
- `textIncludes_1`, `textIncludes_2`: 憭? OR嚗???AND
- `textExcludes`: OR嚗?曆遙銝?摮停頝喲?
- `waitForMs`: ?憭?敺???- `pollMs`: 瑼Ｘ??
- `nextDelayMs`: ??摰?閰脫郊撽?憿?蝑?

## GitHub Pages

GitHub Pages ?桀??函蔡 `dom-js-runner/docs`嚗?
```text
https://futeeeen.github.io/Fast-Target-Clicker/
```

