# Contactの問い合わせ履歴（D1）導入記録 — 2026-11-18

[PR #24](https://github.com/genellect/yuto-matsui-site/pull/24) で、Contactの受付完了の条件を、問い合わせがD1に記録されたことに改めた。設計は [docs/contact/inquiry-history.md](../contact/inquiry-history.md) にある。導入は、同書 §6 の順序で行った。Cloudflareの変更は、オーナーがそのセッションで出した指示の範囲で行った。

この記録には、件数と状態だけを書く。問い合わせの本文・名前・返信先は書かない。

## インフラの変更（Cloudflare API）

| 対象 | 変更後 |
|---|---|
| D1 `yuto-matsui-contact`（本番） | 新規作成。uuid `4ed99fe7-17d5-4e8f-979a-351e50e3c942` |
| D1 `yuto-matsui-contact-preview` | 新規作成。uuid `a987c224-bb3b-4967-8045-9fedd9eda38d` |
| migration | 両DBに `migrations/0001_contact_inquiries.sql` を適用した。`sqlite_master` で表 `inquiries` と索引 `inquiries_received_at` を確かめた |
| Pages Preview binding | `CONTACT_DB` → `yuto-matsui-contact-preview` |
| Pages Production binding | `CONTACT_DB` → `yuto-matsui-contact` |

### bindingを付けた方法

- Pages projectへのPATCHでは、`deployment_configs.<env>.d1_databases` だけを送った。
- 先にPreviewで行い、次の一覧が変わらないことを確かめてから、Productionで行った。
  - Production・Previewのenv_varsの名前と型
  - plain_textの値
- Productionの後も、名前と型（secret 2件を含む）、plain_textの値が、変更前と一致した。

## 確認

| 段階 | 確認 | 結果 |
|---|---|---|
| binding後（merge前） | 本番 `/api/contact` に空のJSON | 422 `validation`（設定不足なし） |
| Preview（PR #24、888c161を再deploy） | 空のJSON | 422（bindingなしなら503 `configuration`） |
| Preview | フォームからmockで1回送信（ダミーの値） | 200・完了画面。Preview用DBに `accepted` / `skipped` が1件。本番DBは0件 |
| 本番（7087ea6） | deploy | 成功 |
| 本番 | オーナーがフォームから1回送信（2026-11-18 18:02 JST） | D1に `accepted` / `sent` が1件。`notify_detail` は空、`notified_at` は記録あり |
| 本番 | 受信先への着信 | オーナーが受信を確認した |
| 本番 | Reply-To | D1に保存した返信先が、通知メールに表示された送信者のアドレスと一致した。Functionは同じ値を `reply_to` に渡す。Reply-Toのheader自体は、この記録では直接読んでいない |

- Agentのheadless browserから本番のフォームで送信を試みたが、本番のTurnstileで止まり、requestは出なかった。

## 復元手順

- PR #24をrevertすると、メールだけで受け付ける形に戻る。
- D1とbindingは残しても無害で、記録した履歴もそのまま残る。
- bindingも外す場合は、Pages → Settings → Bindings で `CONTACT_DB` を削除する。
