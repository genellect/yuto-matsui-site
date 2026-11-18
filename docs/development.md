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
  - 既存の画像・動画の中身を差し替えるときは、ファイル名も変える（例：`name-20261118.png`）。画像は `max-age=14400` で配信されるため、同じURLのまま中身だけ変えると、以前ページを開いたブラウザーには最大4時間古い画像が出る。
  - 本番の確認は、merge前の本番を一度開いてキャッシュを残したブラウザーで行い、merge後に新しい画像へ切り替わることを確かめる。
- `src/app/(contact)/contact/`・`src/contact/`: 個人Contact（`/contact/`）の画面、文言、入力検証。
- `functions/api/contact.ts`: このサイトで唯一のPages Function（`POST /api/contact`）。`public/_routes.json` でこのpathだけを対象にする。
- Contactの設計・設定・経緯は [Contact実装案](contact/implementation-plan.md)。
- 受け付けた問い合わせは、D1（binding `CONTACT_DB`）に記録してから受付完了を返す。表は `migrations/`、確認方法と導入の順序は [問い合わせ履歴](contact/inquiry-history.md)。
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

### Cloudflareのtokenとcloud環境

Contactの作業をcloudのセッションで完結させるための設定。tokenの値はrepo・文書・PRに書かない。

- **環境**：このrepoのセッションは、cloud環境 `yuto-matsui-site` で始める。Default環境で始まったセッションは、途中でこの環境に移れない。
- **token**：`api.cloudflare.com` のNetwork secretsに置く（`Authorization: Bearer`）。対象は、本番切替の記録にあるaccountと、zone `yuto-matsui.com` だけに絞る。

| 範囲 | 権限 | 使い道 |
|---|---|---|
| Account | Account Settings: Read | account一覧 |
| Account | Cloudflare Pages: Edit | binding、deployment、環境変数の名前 |
| Account | D1: Edit | DBの作成、migration、履歴の確認 |
| Account | Account Analytics: Read | Functionの呼び出し記録 |
| Account | Email Routing Addresses: Read | 確認済み受信先 |
| Account | Turnstile: Read | 本番用widgetのhostnameとsitekey |
| Zone | Zone: Read、Analytics: Read、Email Routing Rules: Read、DNS: Read、Zone WAF: Read、Single Redirect: Read | zoneの設定と記録の確認 |

- **D1: Edit について**：この権限で、セッションは履歴の本文と返信先を読める。報告には件数と状態だけを書く。
- **通信先**：環境の許可リストに、次の3つを入れる。
  - `*.yuto-matsui-site.pages.dev`：branchのPreviewを確かめるため
  - `cdn.playwright.dev`、`playwright.download.prss.microsoft.com`：E2E用のブラウザーを入れるため

## CI・本番

CIは、ブラウザー不要の検査（`build`）とE2E（`e2e`）を同時に走らせ、両方が通ると `verify` が成功します。E2Eの範囲はPRの変更fileで決まります。

- Markdown（rootと `docs/`）、`.claude/`、PR templateだけ：E2Eを省く。
- Contactの範囲（`src/contact/`、`src/app/(contact)/`、`functions/`、Contactのテスト、`docs/contact/`）だけ：ContactのE2Eだけ。
- それ以外のPRと、mainへのpush：全E2Eを3分割で実行。

mainは自動build・公開され、`Production verification` が本番ドメインのcommitとHTTPを確認します。

### Contactの本番確認（Cloudflare、読み取りのみ）

Contact（`src/contact/`、`src/app/(contact)/`、`functions/`、`docs/contact/`）に関わる作業や不具合調査では、コードを読む前に本番の状態をCloudflare APIで確かめる。tokenは読み取り専用で、repo・文書・PR・logには値を書かない。

1. account IDは [本番切替の記録](deployments/2026-11-15-cutover.md) にある。今のtokenでは `GET /accounts` と `GET /zones` が空を返すので、そこから取らない。
2. `GET /accounts/{id}/pages/projects/yuto-matsui-site` で、Productionの環境変数の**名前**と、`CONTACT_MODE` が `send` であることを確かめる。値（特に `CONTACT_TO`）は報告に書かない。
3. Email Routingの確認済み受信先（`GET /accounts/{id}/email/routing/addresses`）に、`CONTACT_TO` の受信先が `verified` で含まれていることを確かめる。
4. 直近の本番deploymentが最新のmainであることを確かめる。
5. 送信が届かないときは、GraphQL `pagesFunctionsInvocationsAdaptiveGroups` で、production関数の分単位の呼び出し数とsubrequest数を見る。subrequestは、Turnstileとメール送信APIの呼び出しで、送信1件につき2回になる。
   - 呼び出しがない：送信が画面で止まっている。
   - subrequestが0回：送信前に終わった（honeypot、または早い段階での拒否）。
   - subrequestが2回：送信APIまで進んでいる。
   - account側の `emailSendingAdaptive` は、届いた送信も0件と返すので、判断に使わない。

外からも次のことは判別できる（メールは送られない）。

- `POST https://yuto-matsui.com/api/contact` に、Origin `https://yuto-matsui.com` と空のJSONを送ると422 `validation` が返る。503 `configuration` が返る場合は、設定が不足している。
- `yuto-matsui-site.pages.dev/api/contact` に、同じoriginから空のJSONを送ると、`send` では403 `origin`、`mock` では422が返る。

- `GET /accounts/{id}/d1/database/{uuid}` と `POST …/query`（`SELECT` だけ）で、履歴の件数と通知の状態を確かめる。行の本文や返信先は報告に書かない。

Pages・D1・環境変数の変更は、オーナーがそのセッションで直接指示した範囲だけで行う。Pagesの設定をAPIで変えるときは、変更の前後でProduction・Previewのenv_varsの名前と型の一覧を照合し、差があればそこで止めて報告する。

フォームからの実送信（実メール）は、オーナーの指示があるときだけ行う。

[本番切替の実績・インフラ設定・復元手順](deployments/2026-11-15-cutover.md) と [比較方法](migration.md) を参照してください。
