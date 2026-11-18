# 開発と保守

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
- Contactの設計・設定・経緯は [Contact実装案](contact/implementation-plan.md)。
- `tests/compare/baseline/`: 本番から取得した比較基準。
- `README.md`・`assets/`: GitHubプロフィールREADMEの複製（`genellect/genellect` のmain、commit `c68518a91d4a77b1257b097b162dd3e198f1e75d` から取得）。サイトには含めず、更新時は同じ取得元から README.md と参照画像だけをそのまま取り直す。

## 権利と出典

権利条件は [LICENSE](../LICENSE)、素材の出典は [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) と [画像の出典](founder-image-credits.md) にあります。
元ソースと移動先・SHA-256は [source-map.json](source-map.json) に記録しています。

## Gitワークフロー

GitHub Flowで、小さいPRを速く回します。規則の要約は [AGENTS.md](../AGENTS.md) にあります。

1. mainの最新から、1つの目的につき1本の短命branchを切る（`<type>/<topic>`、agentは環境が指定するprefix）。
2. commitとPR titleは `type(scope): 日本語の要約`。PRはsquash mergeするので、PR titleがそのままmainの履歴になる。
3. Draft PRを作り、[PR template](../.github/pull_request_template.md) に段階（T0〜T3）と確認範囲を書く。
4. CI `verify` が通ったらReadyにする。T2はPreviewでオーナーが目視で承認する。
5. mergeするとmainが自動でbuild・公開され、`Production verification` が本番を確認する。
6. T2が本番に出たら、比較基準を本番から撮り直す別PR（T1）を作る（[比較方法](migration.md)）。

### 段階ごとの確認

| 段階 | 例 | ローカル | CI | Preview |
|---|---|---|---|---|
| T0 | 文書、`AGENTS.md`、`CLAUDE.md`、`.claude/`、PR template | リンク先の存在 | buildだけ（E2Eは省く） | 不要 |
| T1 | refactor、テスト、`scripts/`、CI、依存 | typecheck・build・verify・関係するE2E・`compare` の差分なし | 全件 | 必要に応じて |
| T2 | 見た目・文言・挙動・画像 | T1＋Desktop/Mobileの実描画と、意図した比較差分の確認 | 全件 | 必須（URLとscreenshotをPRに載せる） |
| T3 | `functions/`、`_headers`、`_routes.json`、ドメイン・DNS・redirect、secret、解析 | T1・T2＋復元手順 | 全件 | 必須 |

見た目に触る作業は [デザイン言語](design-language.md) を先に読みます。Claude Codeでは `.claude/skills/` の `ship-change` と `portfolio-design` が、この手順を作業ごとに案内します（[CLAUDE.md](../CLAUDE.md)）。

## CI・本番

CIは、ブラウザー不要の検査（`build`）とE2E（`e2e`）を同時に走らせ、両方が通ると `verify` が成功します。E2Eの範囲はPRの変更fileで決まります。

- Markdown（rootと `docs/`）、`.claude/`、PR templateだけ：E2Eを省く。
- Contactの範囲（`src/contact/`、`src/app/(contact)/`、`functions/`、Contactのテスト、`docs/contact/`）だけ：ContactのE2Eだけ。
- それ以外のPRと、mainへのpush：全E2Eを3分割で実行。

mainは自動build・公開され、`Production verification` が本番ドメインのcommitとHTTPを確認します。

[本番切替の実績・インフラ設定・復元手順](deployments/2026-11-15-cutover.md) と [比較方法](migration.md) を参照してください。
