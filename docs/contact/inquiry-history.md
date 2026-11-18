# Contactの問い合わせ履歴

2026-11-18、オーナーの指示により追加した。受付完了の条件を、メール通知が成功したことから、**問い合わせが履歴に記録されたこと**に改める。

## 1. 経緯と要件

これまでは、メール通知だけで運用できるとしていた。受け付けた問い合わせを、管理者があとから確かめられることは要件に入れていなかった。このため、フォームが送信を止めたり、通知に失敗したりすると、問い合わせは何も残らなかった。

| # | 要件 |
|---|---|
| R1 | 受付完了（200）は、問い合わせをD1に保存できたときだけ返す |
| R2 | 管理者は、履歴から本文・返信先・受付日時・種類・所属・学年を確かめられる |
| R3 | メール通知に失敗しても、履歴は残る。失敗したことも履歴で分かる |
| R4 | 黙って捨てる経路を作らない。honeypotに値がある送信も記録する |
| R5 | 個人データは、D1と通知メールにだけ置く。repo、log、PRには出さない |

オーナーが決めたこと：

- 履歴はCloudflareの管理画面（D1のconsole）で見る。
- 保存期間は無期限とする。
- フォームの文言は変えない。

## 2. 構成

```text
POST /api/contact（Functionは今と同じ1本。_routes.jsonも変えない）
  1. method / Content-Type / 設定（D1のbindingを含む）/ Origin / bodyの大きさ / schema
  2. Turnstileのsiteverify
  3. D1にINSERT ──失敗──▶ 503 storage（受付完了にしない）
  4. 200 { ok: true }                                  ← 受付の確定
  5. waitUntilでメールを送り、その結果を同じ行にUPDATEする
```

- **binding**：`CONTACT_DB`。ProductionとPreviewに、別々のDBを付ける。
  - bindingがない場合は、`send` でも `mock` でも503 `configuration` を返す。
- **Previewの扱い**：Preview（`mock`）では、Preview用のDBに保存し、メールは送らない（`notify_status = 'skipped'`）。
- **honeypot**：Turnstileを通ったあとで判定する。値がある送信は `spam` / `skipped` として保存し、メールは送らない。応答は200のままにする。
- **同じ送信が2回届いたとき**：画面が送信ごとに作る `requestId` を主キーにする。同じ送信が再び届いても1行のままで、200を返し、通知は再送しない。
- **押し直したとき**：失敗のあとで訪問者が押し直すと、新しい `requestId` になり、同じ内容が2行残ることがある。重複は消えるより安全なので、許容する。

## 3. 表

[`migrations/0001_contact_inquiries.sql`](../../migrations/0001_contact_inquiries.sql) が正本。

| 列 | 内容 |
|---|---|
| `id` | `requestId`（UUID） |
| `received_at` | 受付日時（ISO 8601、UTC） |
| `topic` / `grade` / `affiliation` / `name` / `email` / `details` | 検証と正規化を済ませた入力。`email` は返信先で、Reply-Toと同じ値 |
| `disposition` | `accepted` または `spam` |
| `notify_status` | `pending`、`sent`、`failed`、`skipped` |
| `notify_detail` | 失敗の分類（`timeout`、`recipient_rejected`、`http_403_errors_10102` など）。個人データは入れない |
| `notified_at` | 通知の結果を書いた日時 |

IP、Turnstileのtoken、User-Agentは保存しない。

## 4. 状態ごとの応答と記録

| 状況 | 応答 | 履歴 |
|---|---|---|
| 入力の誤り、Origin、大きさ、Turnstileの失敗 | 4xx（画面にエラーが出る） | 残さない |
| honeypotに値がある | 200 | `spam` / `skipped` |
| D1への保存に失敗 | 503 `storage`（画面は失敗文と連絡先を出す） | 残らない |
| 保存は成功、通知も成功 | 200 | `accepted` / `sent` |
| 保存は成功、通知に失敗 | 200 | `accepted` / `failed` と `notify_detail` |
| 保存は成功、通知の結果を書けなかった | 200 | `accepted` / `pending`。logに `notify_record_failed` が出る |

logには `id`（ランダムなUUID）と outcome を出す。outcome は `stored`、`stored_spam`、`duplicate`、`storage`、`notify_sent`、`notify_failed`、`notify_record_failed` のいずれか。名前、メールアドレス、本文はlogに出さない。

## 5. 管理者の確認方法

Cloudflareダッシュボード → D1 → `yuto-matsui-contact` → Console で、次のSQLを実行する。

```sql
-- 新しい順の問い合わせ
SELECT received_at, topic, name, email, affiliation, grade, details, notify_status
FROM inquiries WHERE disposition = 'accepted'
ORDER BY received_at DESC LIMIT 50;

-- メール通知が届いていない可能性があるもの（定期的に確認する）
SELECT received_at, name, email, notify_status, notify_detail
FROM inquiries WHERE disposition = 'accepted' AND notify_status <> 'sent'
ORDER BY received_at DESC;

-- honeypotで止めた送信（人の自動入力で誤って止まっていないか）
SELECT received_at, name, email, details
FROM inquiries WHERE disposition = 'spam'
ORDER BY received_at DESC LIMIT 50;
```

保存期間は無期限なので、自動では削除しない。削除が必要になったときは、consoleで `DELETE FROM inquiries WHERE id = '…'` を実行する。

## 6. 導入の順序

**コードがbindingを必須にするので、bindingを付ける前にmergeすると、本番のContactが503になる。** 必ず次の順で行う。

1. D1を2つ作る：`yuto-matsui-contact`（本番）と `yuto-matsui-contact-preview`。それぞれに migration を適用する。
2. Pages `yuto-matsui-site` のProductionとPreviewに、D1のbinding `CONTACT_DB` を付ける。
   - 使われないbindingは無害なので、mergeより先に付けてよい。
   - APIで付ける場合は、変更の前後でenv_varsの名前と型の一覧を照合する。1つでも変わっていたら止める。
   - **ProjectをAPIでPATCHすると、送らなかったenv_vars（secretを含む）が消える事例がある。** secretの値はあとから読めないので、消えると元に戻せない。
   - secret（`CONTACT_EMAIL_API_TOKEN`、`CONTACT_TURNSTILE_SECRET_KEY`）の値を手元に用意できない場合は、APIを使わずダッシュボード（Settings → Bindings）で付ける。
3. 実装PRのPreviewで1回送信し、Preview用のDBに `accepted` / `skipped` の行が入ることを確かめる。
4. merge後、本番で1回送信し、次の3点を確かめる。結果を `docs/deployments/` に記録する。
   - D1に `accepted` / `sent` の行がある
   - Gmailに着信する
   - Reply-Toが入力値と一致する

## 7. 切り戻し

PRをrevertすると、メールだけの受付に戻る。D1とbindingは残しても無害で、履歴もそのまま残る。

## 8. 残るリスク

- **通知の失敗には、管理者が気づけない。** 失敗は `failed` として履歴に残るが、気づくには5節の2つ目のSQLを定期的に見る必要がある。
  - 自動で再送するには、定期実行のWorkerという新しいdeploy先が要るので、今回の範囲に入れていない。
- **重複が残ることがある。** 押し直しで、同じ内容が2行残ることがある。
