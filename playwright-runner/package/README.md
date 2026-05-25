# Fast Target Clicker Playwright Runner

? Fast Target Clicker ??Playwright ???雿輻??蝔桀?甇仿? JSON 瘚??澆?嚗??芸楛?葫閰衣???函頂蝯望??迂?芸???蝬脩?銝銵?
甇斤??砌?? stealth plugin嚗?銝?靘??輻雯蝡皜祆?憸冽???賬?
## 摰?

```powershell
cd playwright-runner/package
npm install
npx playwright install chromium
```

## ?瑁?蝺渡?蝡?靘?
?撠??寧???璈葫閰衣?嚗?
```powershell
..\..\test-site\start-test-site.bat
```

## 雿輻 UI

```powershell
npm run ui
```

?亥???嚗?
```text
http://127.0.0.1:4280
```

UI ?臭誑憛?URL?票 workflow JSON?身摰?摰??絲憪郊撽lowMo?eadless嚗蒂?亦?瘥?甇亙銵???
?銵?Playwright runner嚗?
```powershell
cd playwright-runner/package
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json
```

## 雿輻 config 瑼?
```powershell
npm start -- --config examples/config.example.json
```

## ??????

```powershell
npm start -- --url https://futeeeen.github.io/Fast-Target-Clicker/practice/ --workflow examples/practice-flow.json --start-at "2026-05-25 14:30:00"
```

## 敺?摰郊撽?憪?
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

## 瘜冽?

Playwright ???湔??銝? Playwright ?批?汗?刻?蝒?銝 Chrome extension side panel?雿?閬?芸楛?桀????????葉??嚗?雿輻 `dom-js-runner/extension` ???
