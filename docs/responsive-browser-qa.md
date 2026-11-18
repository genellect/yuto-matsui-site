# レスポンシブとブラウザーの確認

対象：`/`、`/en/`、`/contact/`。2026-11-18にこのrepository向けに書き直しました（旧版はCOMPASSのrunbookの複製で、存在しないroute・commandを含んでいました）。

どこまで確認するかは [開発と保守](development.md) の「段階ごとの確認」に従います。局所的な変更では、対象のDesktop/Mobileと変更した境界・操作を選び、無関係な全routeを繰り返しません。

## CSS viewportで確かめる理由

物理解像度ではなく、CSS viewportで再現します。1920px級の画面でも、Windowsの150%表示とbrowser chromeによってCSS viewportが約 `1275×553` になり、高さの条件で縮小ruleが発火した不具合がありました。`1024×768` を直接試すだけでは再現できません。

物理画面で報告するときは、`innerWidth/innerHeight`、`devicePixelRatio`、`visualViewport.scale`、Windowsの拡大率、browserのzoomを併記します。

## Viewport

| CSS viewport | 意味 | 使う場所 |
|---|---|---|
| `390×844` | 基準のiPhone | 比較・E2E |
| `1024×768` | Laptopの境界 | 比較・一部のE2E |
| `1280×720` | Windows 150%相当 | 比較 |
| `1275×553` | Windowsの拡大率＋browser chrome | 比較 |
| `1536×672` | Windows 125%相当 | 比較 |
| `1440×900` | Desktopの代表 | E2E |

layoutの境界（`900/901px`、`640/641px`、高さ `720px`・`600px`）を変えた場合は、その前後の幅・高さも確認します（[デザイン言語](design-language.md)）。

## 自動の確認

- **比較**（`npm run compare -- check <origin>`）：「比較」の5 viewport × JP/ENで、DOM、計算済みstyle、画面、通信を本番の基準と比べます。方法と許容した例外は [migration.md](migration.md)。
- **E2E**（`tests/e2e/`）：Contactの入力・送信・失敗時の経路、写真フィルムとMobileフィルムの操作とWebGL失敗時の代替、製品カードの配置・リンク・JavaScript前の表示、ENのHero、言語切替とlinkerのURL、カードの初期描画。`tests/support/responsive-fixture.ts` が解析、外部フォーム、`/api/contact` への送信を遮断します。

## コマンド

```sh
npm run build
npm run serve                                  # 127.0.0.1:8798
npx playwright test tests/e2e/<対象>.spec.ts    # 対象だけ
npm run test:e2e                               # 全件
npm run compare -- check http://127.0.0.1:8798
```

Previewに対しては、`RESPONSIVE_BASE_URL=<Preview URL> npx playwright test …` と `npm run compare -- check <Preview URL>` を使います。読み取りだけを行い、フォーム送信や実メールは行いません。

## 写真・本文の初期描画

画像の `complete`・`naturalWidth` やDOMの可視性だけでは、3D合成面に内容が隠れる不具合を検出できません。写真・本文の描画やtransformを変えた場合は、対象カードをタップする前のscreenshotで内容も確認します。Safari系へ影響する変更はMobile WebKitを含め、portfolioの検証では `PORTFOLIO_WEBKIT=1` を指定できます。

## 失敗したとき

失敗時は `test-results/` と `playwright-report/` にscreenshotとPlaywright traceが残ります。CIでは `browser-evidence-<shard>` として14日間保存されます。証拠を見ずに閾値を緩めたり、基準を撮り直したりしません。

## 人の確認

Hero、navigation、書体、breakpoint、動きを変えた場合は、自動の確認の後もPreviewを実機またはbrowserのresponsive modeで確認します。報告には、URL、CSS viewport、DPR、commit SHA、実施しなかった確認を書きます。
