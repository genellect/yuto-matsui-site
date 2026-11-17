# 個人サイトの Contact 本番切り替え — 2026-11-17

2026年11月17日 21:03 JSTごろ、`yuto-matsui.com/contact/` の配信を COMPASS への転送から個人サイトの Cloudflare Pages プロジェクトへ切り替えた。Blenderの入室演出を再利用し、フォームの受付は個人サイトの Pages Function、通知メールの配送は Cloudflare Email Service が担当する。

## 本番に反映した変更

- `yuto-matsui.com` のみを許可する本番用 Turnstile ウィジェットを作成した。Cloudflare Pages の Production に送信用・ビルド用の変数を保存し、メール送信用トークンと Turnstile の検証キーは Secret とした。設定項目と型は [実装方針 §7.1](../contact/implementation-plan.md#71-環境変数) を参照。
- WAF に、URI Path が `/api/contact` と完全に一致するときだけ適用するレート制限 `Personal Contact API rate limit` を1本追加した。適用前の GET 確認では、`www` は apex に転送され、ゾーン内の他の確認対象ホストは404を返した。
- [PR #8](https://github.com/genellect/yuto-matsui-site/pull/8) を main にマージし、Cloudflare Pages の本番デプロイ、[main CI](https://github.com/genellect/yuto-matsui-site/actions/runs/44078953043)、[Production verification](https://github.com/genellect/yuto-matsui-site/actions/runs/44078953036) の成功を確認した。デプロイしたコミットは `7da5efb9deb9041b430ca97edf8961741da9dee3`。
- `Return COMPASS routes to pages.dev` の元の条件に `/contact/`、`/contact`、`/api/contact` の完全一致除外を追加した。既存の転送先、301、クエリ文字列の保持は継続する。

## 切り替え後の確認

| 確認対象 | 結果 |
|---|---|
| GET `/contact/` | 200。応答ヘッダーのコミットが本番コミットと一致 |
| GET `/contact` | 308で同一ドメインの `/contact/` へ |
| GET `/api/contact` | 405、`Allow: POST` |
| `/`・`/en/`、入室演出のデスクトップ・モバイル用ポスター | 200 |
| `/manifesto/`・`/community/` | 以前と同じ COMPASS のURLへ301。クエリを保持 |
| COMPASS の `/contact/` | 200 |
| 本番フォームの承認済み試験1件（21:04 JSTごろ） | 「メッセージを承りました」を表示し、本人の受信トレイに1通着信。差出人は `contact@yuto-matsui.com`。メールの `Reply-To` はフォーム入力値と一致 |

## 復元する場合

1. Contact の公開や配送に問題がある場合は、Cloudflare の Redirect Rules で `Return COMPASS routes to pages.dev` を編集する。この切り替えで足した `http.request.uri.path ne "/contact/"`、`http.request.uri.path ne "/contact"`、`http.request.uri.path ne "/api/contact"` の3条件だけを取り除いて保存する。既存の条件・転送先・301・クエリ保持を維持する。
2. 新しいリクエストで `/contact/` と `/api/contact` が COMPASS の同じパスへ301を返し、COMPASS のフォーム画面が200で開くことを確認する。あわせて個人サイトの `/`・`/en/` と既存の COMPASS 転送を確認する。
3. WAF が原因と確認できた場合は `Personal Contact API rate limit` だけを無効にする。Pages のコードにも復元が必要なら、Pages の Deployments で直前の正常な Production デプロイ（コミット `3932155c78839871be62cb2c6050cd6cefcdfcde`）へ戻す。ロールバック後に本番URLを再確認し、次の自動公開前に必要な修正を main に反映する。
