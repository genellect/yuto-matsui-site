# GA4 linkerのURL整理

移植・文言抽出とは別の、オーナーから指示された不具合修正。
従来はJPだけがlazyOnloadで `_gl` を削除し、ENには処理がなかった。またENリンクが本番の絶対URLだったためPreviewから本番へ移動していた。

両言語のheadで共通処理を読み込み、既存の `gtag('config', 'G-EHKJ8B8N0Y')` の後に `client_id` と `session_id` の取得を待つ。受け取り後にだけ `_gl` を削除する。GA4のID、config、クロスドメイン設定、外部リンクの装飾は変更しない。

ページ内リンク、同じhashの再クリック、hashchange、戻る・進む、pageshowでも処理する。消すのはqueryの `_gl` だけで、他のqueryの文字列表現、hash、history.state、履歴件数を保持する。Googleタグがhistoryを監視する前のreplaceStateを使い、URL整理だけによる追加page_viewを発生させない。言語リンクは `/` と `/en/` に統一し、Preview内に留める。canonical/OGの本番URLは保持する。

受信linkerをGA4より先に捨てないため、タグがブロックされた場合やIDを取得できない場合は削除しない。タグ読み込み前の受信URLを最初から消す実装にはしていない。

## 検証

- `tests/e2e/linker-url.spec.ts`: 読み込み遅延、取得失敗、query/hash/history保持、JP↔EN、PC/スマートフォンのページ内リンク、同一hash再クリック。
- `node scripts/verify-live-linker.mjs`: 実際のGoogleタグを読み込み、COMPASS→EN→JP→ENを検証。サイト自体はPlaywright内のfixtureで配信し、GA4への収集requestは全件遮断する。修正前後とも4 page_view、同じclient/sessionを維持。修正前ENは `_gl` が残り、修正後は消える。実際のGA4管理画面への受信は検証しない。
- 基準buildとの比較例: `SITE_BUILD_ROOT=/path/to/baseline/out EXPECT_LINKER_CLEANUP=persist ANALYTICS_REPORT=comparison-results/analytics-before.json node scripts/verify-live-linker.mjs`。

参照: [Google cross-domain measurement](https://developers.google.com/tag-platform/devguides/cross-domain)、[gtag get](https://developers.google.com/tag-platform/gtagjs/reference)、[GA4 cross-domain setup](https://support.google.com/analytics/answer/10071811)。
