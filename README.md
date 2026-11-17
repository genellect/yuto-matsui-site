# Yuto Matsui portfolio

`yuto-matsui.com` の日本語 `/`・英語 `/en/` を管理する専用repositoryです。
2026-11-15に専用Cloudflare Pages `yuto-matsui-site` へ本番を切り替えました。JP `/`・EN `/en/` はこのrepositoryから配信されます。

## 開発

Nodeは `.node-version`、依存は `package-lock.json` に固定します。Linux・macOS・Windowsで同じnpm commandを使います。

```sh
bash scripts/dev-bootstrap.sh
npm run dev
npm run typecheck
npm run build
npm run verify
npm run test:e2e
node --test tests/contact-function.test.ts
```

静的出力は `out/`、local配信は `npm run serve`（127.0.0.1:8798）です。
Playwrightはbundled Chromiumを使います。OS依存が不足するLinuxでは `npx playwright install --with-deps chromium` を実行します。

## 構成と変更の境界

- `src/app/(ja)/`・`src/app/(en)/en/`: 言語ごとのroot layoutとページ。
- `src/ja/`・`src/en/`: 各言語の部品。
- `src/shared/`: 製品カード、写真フィルム、portfolioの共通部品。
- `src/inherited/`: 現行表示に必要なCSS・初期化script。移植中は内容と読み込み順を保持。
- `public/images/`: 現行URLを保持した画像と動画。
- `src/app/(contact)/contact/`・`src/contact/`: 個人Contact（`/contact/`）の画面、文言、入力検証。
- `functions/api/contact.ts`: このサイトで唯一のPages Function（`POST /api/contact`）。`public/_routes.json` でこのpathだけを対象にする。
- `scripts/contact-entry/`: Contact入室演出の生成・差し替えscript。設計・設定・残作業は [Contact実装案](docs/contact/implementation-plan.md)。
- `tests/compare/baseline/`: 本番から取得した比較基準。

権利条件は [LICENSE](LICENSE)、素材の出典は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) と [画像の出典](docs/founder-image-credits.md) にあります。
元ソースと移動先・SHA-256は [source-map.json](docs/source-map.json) に記録しています。
開発PRではCloudflare PreviewとCIを確認し、CI `verify` 成功後にmainへmergeします。mainは自動build・公開され、`Production verification` が本番ドメインのcommitとHTTPを確認します。

[本番切替の実績・インフラ設定・復元手順](docs/deployments/2026-11-15-cutover.md) と [比較方法](docs/migration.md) を参照してください。
