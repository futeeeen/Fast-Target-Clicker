# Playwright Runner Docs

## 摰?

```powershell
cd C:\futen\Project\Auto-click\playwright-runner\package
npm install
npx playwright install chromium
```

## 雿輻 UI

```powershell
cd C:\futen\Project\Auto-click\playwright-runner\package
npm run ui
```

?? `http://127.0.0.1:4280`??
UI 甈?嚗?
- `?格? URL`: Playwright 閬??????- `Workflow JSON`: 憭郊撽?蝔?- `??????`: ?唳????銵??征撠望蝡?瑁???- `敺洵撟暹郊??`: 1-based 韏瑕?甇仿???- `slowMo`: 瘥?Playwright action 憿??暹?神蝘??- `headless`: 銝＊蝷箇汗?具?- `摰?敺??汗?灼: workflow 蝯?敺????Playwright browser??
?身 URL ?荔?

```text
https://futeeeen.github.io/Fast-Target-Clicker/practice/
```

???亦毀蝧?蝭???頛?臬??毀蝧??瑁???JSON??
## 雿輻 CLI

```powershell
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json
```

????嚗?
```powershell
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json --start-at "2026-05-25 14:30:00"
```

敺洵 3 甇仿?憪?

```powershell
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json --start-step 3
```

## ?舀甈?

- `type`: `click`?select`?check`?fill`
- `selector`: CSS selector
- `text`: ??摰蝚血?
- `ariaLabel`: 靘?`aria-label` / `title` / `name` ??
- `textIncludes`: ??蝯??AND
- `textIncludes_1`, `textIncludes_2`: 憭?銋???OR嚗??抒雁??AND
- `textExcludes`: OR嚗?曆遙銝?摮停頝喲?
- `waitForMs`: ?憭?敺????身 `10000`
- `pollMs`: 瑼Ｘ??嚗?閮?`500`
- `nextDelayMs`: ??摰?閰脫郊撽?憿?蝑?

