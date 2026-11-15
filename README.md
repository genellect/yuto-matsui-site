# Yuto Matsui portfolio

`yuto-matsui.com` の日本語 `/`・英語 `/en/` を管理する専用repositoryです。
現行COMPASSからの移植と文言抽出はDraft PRで検証済みです。独自ドメインの配信はまだ切り替えていません。

## 開発

Nodeは `.node-version`、依存は `package-lock.json` に固定します。Linux・macOS・Windowsで同じnpm commandを使います。

```sh
bash scripts/dev-bootstrap.sh
npm run dev
npm run typecheck
npm run build
npm run verify
npm run test:e2e
```

静的出力は `out/`、local配信は `npm run serve`（127.0.0.1:8798）です。
Playwrightはbundled Chromiumを使います。OS依存が不足するLinuxでは `npx playwright install --with-deps chromium` を実行します。

## 構成と変更の境界

- `src/app/(ja)/`・`src/app/(en)/en/`: 言語ごとのroot layoutとページ。
- `src/ja/`・`src/en/`: 各言語の部品。
- `src/shared/`: 製品カード、写真フィルム、portfolioの共通部品。
- `src/inherited/`: 現行表示に必要なCSS・初期化script。移植中は内容と読み込み順を保持。
- `public/images/`: 現行URLを保持した画像と動画。
- `tests/compare/baseline/`: 本番から取得した比較基準。

権利条件は [LICENSE](LICENSE)、素材の出典は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) と [画像の出典](docs/founder-image-credits.md) にあります。
元ソースと移動先・SHA-256は [source-map.json](docs/source-map.json) に記録しています。
本番切替は [移行手順](docs/migration.md) の別工程です。
