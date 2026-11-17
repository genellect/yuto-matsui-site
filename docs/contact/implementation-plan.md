# 個人Contact 実装案

正本: [Issue #7](https://github.com/genellect/yuto-matsui-site/issues/7)。この文書は実装前の設計で、本番の表示・挙動・Cloudflare設定はまだ変更していない。

## 1. 目的（Issue #7の要約）

`https://yuto-matsui.com/contact/` を、COMPASSの代表・公式窓口との二択ではない、Yuto Matsui個人の連絡窓口にする。入室演出→入力→受付完了を個人サイト内で完結させる。

- 既存のBlender空間・個人側の入室動画・フォームの見た目・Cloudflare Pages・既存の受信箱を再利用する。
- 最小化の対象はコード量だけでなく、事業者・契約・アカウント・deploy先・認証情報・保管データ。
- 新しいフォーム事業者、DB、OTP、自動返信、別サーバー、GAS依存を作らない。

## 2. 確認した現状

| 対象 | 確認内容 | 出典 |
|---|---|---|
| 個人サイト | Next.js static export、`trailingSlash: true`、route は `/` と `/en/` の2つ | `next.config.ts`、`scripts/verify-build.mjs` |
| 静的限定の検査 | `functions/`・`out/_worker.js`・`out/_routes.json` の存在をbuild検証で禁止している | `scripts/verify-build.mjs` 21行目 |
| JPの導線 | Contactの「Contact form」リンクは `https://compass-official.pages.dev/contact/` を直接指す | `src/app/(ja)/page.tsx` 291行目 |
| ENの導線 | フォームへのリンクはなく、メールアドレスを表示するだけ | `src/app/(en)/en/page.tsx` |
| 転送規則 | `Return COMPASS routes` は、host=`yuto-matsui.com` で除外対象に当たらないpathを、COMPASSへ301（query保持）で転送する。`/contact/`・`/api/contact` は除外されていない | `docs/deployments/2026-11-15-after.json` `returnRule` |
| 素材の配置 | `/images/` は転送の除外対象。COMPASSの `/media/contact-entry/` と同じpathに置くと転送されてしまう | 同上 |
| テストの遮断 | E2E fixtureは `/api/contact` への変更系methodと解析通信をすでに遮断している | `tests/support/responsive-fixture.ts` |
| 移植元 | COMPASS `6bb78ff`（Issueが指定した版と同じ）の `src/app/(official)/contact/` 一式、`src/lib/contact-schema.ts`、`functions/api/contact.ts`、`scripts/contact-entry/`、`public/media/contact-entry/`、`docs/contact-door-entry.md` | genellect/compass |

COMPASS側のContactは、二択、Turnstile、6桁のOTP、HMACのproof、GASへの中継、受付メールの自動送信でできている。個人用に残すのは、入室演出、入力欄の見た目、Turnstile、honeypot、Origin検証、bodyの上限だけ。

## 3. 全体構成

```text
yuto-matsui.com (既存Pages: yuto-matsui-site)
 ├─ /contact/                       static export（新route group）
 ├─ /images/contact-entry/*         静止画・動画（新規、再出力分）
 └─ POST /api/contact               Pages Function 1つ（_routes.jsonでこのpathだけを対象にする）
      1. method / Content-Type / body size
      2. host と Origin が正規hostと一致するか
      3. 入力schema（画面と共通のvalidator）
      4. Turnstile siteverify（hostname・action・idempotency_key）
      5. Cloudflare Email Service REST API を1回だけ呼ぶ
         POST /client/v4/accounts/{account_id}/email/sending/send
         to = 固定の確認済み受信先 1件 / from = routing domainの固定アドレス / reply_to = 投稿者
      6. result.delivered または queued に受信先が含まれる場合だけ 200
```

使わないもの：Next.jsのサーバー、別のPages project、中継Worker、メールbinding、DB、KV、Queue、OTP、自動返信。

仕様の根拠（2026-11-17に公式文書で確認）：

- REST API の endpoint は `POST /accounts/{account_id}/email/sending/send`。項目は `from`・`to`・`subject`・`text`・`reply_to`。応答の `result` には `delivered`・`queued`・`permanent_bounces`・`suppressed_recipients`・`message_id` がある。[REST API](https://developers.cloudflare.com/email-service/api/send-emails/rest-api/)、[API reference](https://developers.cloudflare.com/api/resources/email_sending/methods/send/)
- sending domainを登録しなくても、確認済み受信先には送信できる。プランを問わず無料で、送信quotaにも数えられない。From は routing domain に限られる。[確認済み受信先](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/)、[制限](https://developers.cloudflare.com/email-service/platform/limits/)

**未検証**：このアカウントのtokenとrouting domainで実際に受信箱へ届くか。これは段階1（§10）の最初に確かめる。

## 4. 画面

### 4.1 route と layout

- `src/app/(contact)/contact/` を新しいroot layoutにする。metadataはContact専用にする。本番のCOMPASS Contactは継承CSS 9本の上に作られているため、見た目を本番と同じに保つよう、JPと同じ9本を同じ順序で読み込む（このrepoの `src/inherited/styles/` はCOMPASSの同名ファイルとSHA-256が一致することを確認済み）。
- metadata: title・descriptionは§4.3のとおり。canonical `https://yuto-matsui.com/contact/`、`robots: { index: false, follow: true }`（COMPASS Contactと同じ公開方針）、sitemapには追加しない。
- 解析：JPと同じGA4 measurement IDでpage viewだけを送る（D4）。フォームの内容・入力イベントは送らない。

### 4.2 移植するファイルと変更点

| 移植元（COMPASS） | 移植先 | 変更 |
|---|---|---|
| `ContactEntrance.tsx` | `src/contact/ContactEntrance.tsx` | `Target` 型と二択を削除。扉は個人側（左）だけにし、右扉のbuttonと「COMPASSへのお問い合わせ」を削除。見出しと扉のラベルは§4.3のとおりにする。動画は1本（`entry-{layout}.mp4`）。800msの読み込み期限、2.7秒の全体期限、reduced motion、Save-Data、hidden tab、skip、`onError` はそのまま残す |
| `ContactForm.tsx` | `src/contact/ContactForm.tsx` | 宛先選択、`TargetCard`、`messagePrefix`、OTPの全state（`challengeId`・`verificationCode`・`verificationProof`・`challengeExpiresAt`・`invalidateChallenge`）、`requestCode`・`verifyCode` を削除。Turnstileは送信ボタンの直前に置き、送信のたびにtokenを使い切ってresetする |
| `ContactChrome.tsx` | `src/contact/ContactChrome.tsx` | headerのリンクを、JP `/`、EN `/en/` の個人サイトだけにする。COMPASSのPlatform／Interactiveへのリンクと、parent brandの表示を外す。CONTACTのwordmarkと「入口へ戻る」イベントは残す |
| `contact*.module.css`、`parent-brand.module.css` の使用部分 | `src/contact/*.module.css` 本番のカスケードを崩さないよう、内容と順序はそのまま複製し、未使用になったOTP・target cardのruleも残す（画像pathだけ `/images/contact-entry/` に変更）。個人用の追加ruleは末尾に追記する |
| `contact-door-projection.json` | `src/contact/contact-door-projection.json` | 再出力で生成される `{desktop,mobile}.entry` の1扉分 |
| `contact-entry-events.ts` | `src/contact/contact-entry-events.ts` | 変更なし |
| `src/lib/contact-schema.ts`（zod） | `src/contact/schema.ts` | 依存を増やさないため、zodを使わない小さなvalidatorにする（§5）。画面とFunctionで同じものをimportする |

### 4.3 文言

#### 方針

- 一人の研究者・開発者が、相手を迎えて話を伺う窓口として書く。丁寧な敬語で短く書き、温かさと品位を保つ。
- **COMPASSへの分岐や案内は、画面に一切出さない。** 本文、見出し、ボタン、aria-label、metadata、エラー文のどれにも入れない。
- 仕組みや内部の事情（自動返信の有無、確認コード、送信先、mock、受付処理など）を説明する文や、「〜はありません」のように相手を突き放す事務的な言い切りを書かない。
- エラーでは相手を責めない。まずお詫びし、入力が残っていることと次にできることを、穏やかに伝える。
- 入力欄の見出し、ラベル、helper、検証エラー（「正しい形式で入力してください」）など、COMPASSですでに使われていて、この方針に沿う文言はそのまま使う。

#### 確定する文言

| 箇所 | 文言 |
|---|---|
| title | `Contact | Yuto Matsui / 松井優知` |
| description（meta／OG） | 生命科学研究とAIネイティブ開発に取り組むYuto Matsui / 松井優知へのご連絡はこちらから。共同研究や開発のご相談、講演のご依頼、意見交換など、お気軽にお寄せください。 |
| 見出し（h1） | お問い合わせ（既存のまま） |
| 導入 | 研究・開発・教育に関するご相談やご依頼を承っています。 |
| 導入2 | 学生・教職員・研究者の方、団体・企業の方など、さまざまな方とのご縁を歓迎しています。（既存のまま） |
| 入口の見出し（h2） | Yuto Matsuiへのご連絡（本番の「どちらへのご連絡ですか？」の位置。宛先の名前をそのまま示す本番の書き方に合わせる） |
| 扉（aria-label） | 執務室 Yuto Matsui — メッセージを書く（本番の「執務室 Yuto Matsui — 代表へのご連絡」と同じ形） |
| 扉の代わりのボタン | メッセージを書く ↗（本番の「代表へのご連絡 ↗」と同じ形） |
| 演出を省くボタン | 演出なしで入力へ →（既存のまま） |
| 入室中（status） | Yuto Matsui — 入室しています（既存の形のまま） |
| 対象パネルの見出し | Yuto Matsuiへのご連絡（本番の「代表へのご連絡」と同じ位置づけ。kickerの `WHO THIS IS FOR` と4区分は本番のまま） |
| 所属 | ラベルの横に、「必須」と同じ形の「任意」badgeを付ける。helperは既存のまま |
| 送信前の一文 | いただいたメッセージは私自身が拝読し、ご記入のメールアドレス宛にお返事いたします。 |
| 送信ボタン | メッセージを送信 → ／送信中：送信しています… |
| 完了 kicker | MESSAGE RECEIVED（本番のまま） |
| 完了 見出し | メッセージを承りました |
| 完了 本文 | ご連絡いただき、ありがとうございます。内容を拝読のうえ、{email} 宛にご連絡いたします。お返事まで少しお時間をいただく場合がございますが、どうぞよろしくお願いいたします。 |
| 完了 リンク | トップページへ（本番のまま） |

#### 送信できなかったときの文言（`role="alert"`、入力はすべて残す）

| 状況 | 文言 |
|---|---|
| 通信失敗、502、503、timeout、JSON以外の応答 | 申し訳ありません。ただいまメッセージをお送りできませんでした。ご入力いただいた内容はそのまま残っていますので、少し時間をおいて、もう一度お試しください。 |
| 429（連続送信） | 申し訳ありません。続けてお送りいただいたため、少し時間をおいてから、もう一度お試しください。ご入力いただいた内容はそのまま残っています。 |
| 送信時のTurnstile検証の失敗 | 確認が完了しませんでした。お手数ですが、もう一度お試しください。 |
| 画面のTurnstileが読み込めない、または確認を15秒待っても完了しない | 送信に必要な確認が完了していません。ご入力いただいた内容はそのまま残っています。既存のメール連絡先を別タブで開ける。確認が完了すればフォームから送信できる。 |
| 通信・配送エラーまたは429が2回以上あったとき（追記） | お急ぎの場合は、[トップページ](/#contact-cta)に記載のメールアドレスからもご連絡いただけます。 |

文言は `src/contact/copy.ts` にまとめる。E2Eでは、二択・確認コード・自動返信・「代表」・「COMPASS」がDOMにもaria属性にも含まれないことを検査する（§11）。

### 4.4 状態と操作

- 入力stateはContactFormが持ち、演出・skip・「入口へ戻る」・送信失敗のどれでも消さない（COMPASSと同じ構造）。
- 状態は `idle | submitting | success` の3つ。`submitting` の間はボタンを無効にして、連打を防ぐ。
- 応答はまずtextで受け取ってからJSONとして解釈し、失敗したら汎用エラーとして扱う。WAFの429、HTMLの5xx、ネットワーク断でも画面が壊れないようにする。
- 自動再送はしない。手動で再試行したときに重複する可能性は受け入れる（Issueのとおり）。

### 4.5 JPトップの導線

`src/app/(ja)/page.tsx` の `${COMPASS_ORIGIN}/contact/` を `/contact/` に変える。本番の見た目は変わらないがhrefが変わるので、比較scriptでは `/en/` と同じように、この1属性を本番での遷移先が同じ例外として明示的に扱う。閾値は緩めない。ENは変更しない（新しい英語フォームは作らない）。

## 5. 入力仕様

| 項目 | 必須 | 規則 | 備考 |
|---|---|---|---|
| name | ✓ | trim後 2–20文字、CR/LF/制御文字は不可 | COMPASSと同じ長さ |
| affiliation | 任意 | 空、またはtrim後 2–20文字、制御文字は不可 | COMPASSの必須を任意に変える（Issueの指定） |
| email | ✓ | trim後 5–50文字、`local@domain.tld` 形式、CR/LF不可、小文字化 | `reply_to` に入れる |
| details | ✓ | trim後 10–1000文字、改行可、改行と`\t`以外の制御文字は不可 | 宛先prefixがなくなるので、上限を980から1000に戻す（D3） |
| turnstileToken | ✓ | 1–2048文字 | |
| requestId | ✓ | UUID | Turnstileの `idempotency_key` に使う |
| website | ✓ | 空文字（honeypot） | 値があれば成功を装って送信しない |

未知の項目は拒否する（strict）。サーバーは画面と同じvalidatorを使い、加えてbodyを16KiBに制限する。

## 6. API仕様（`functions/api/contact.ts`）

### 6.1 処理順と応答

| 順 | 判定 | 失敗時 |
|---|---|---|
| 1 | `POST` 以外 | 405 + `Allow: POST` |
| 2 | Content-Type が `application/json` でない | 415 |
| 3 | 設定の不足（§7のどれか1つでも欠けている） | 503 `configuration`（送信しないで失敗を返す） |
| 4 | host ≠ `CONTACT_ALLOWED_HOST`、または Origin ≠ `https://` + 同host（mockでは request URL と同じorigin） | 403 `origin` |
| 5 | Content-Lengthが16 KiBを超える、または本文の読み取り中に16 KiBを超える | 読み取りを打ち切り、413 |
| 6 | JSONとして不正、またはschema違反 | 400 / 422（`fieldErrors`付き） |
| 7 | honeypot に値がある | 200（送信しない） |
| 8 | Turnstileが `success`・`hostname`・`action` のどれかで失敗、または通信失敗 | 422 `turnstile` |
| 9 | REST送信が10秒で打ち切り、非2xx、`success:false` | 502 `delivery` |
| 10 | 受信先が `delivered` にも `queued` にもない、または `permanent_bounces` か `suppressed_recipients` にある | 502 `delivery` |
| — | 成功 | 200 `{ ok: true }` |

応答はすべて `Cache-Control: no-store`、`Content-Type: application/json; charset=utf-8`、`X-Content-Type-Options: nosniff`。

### 6.2 通知メール

- `to`: `[CONTACT_TO]`（固定、1件）／`from`: `CONTACT_FROM`（固定）／`reply_to`: 検証済みのemail
- `subject`: `[yuto-matsui.com] Contact`（固定。投稿者の入力は件名に入れない）
- `text`: 受付日時（JST）、お名前、所属、メールアドレス、本文。HTMLは送らない。
- Cloudflareのtokenは `Authorization: Bearer` で送る。権限はEmail Sendingの送信だけに絞り、対象はこのaccountだけにする。

### 6.3 ログ

出すのは `code`・HTTP status・Cloudflareのerror code・所要時間だけ。名前・メール・本文・IP・token・message_idは出さない。

### 6.4 型と実行

`@cloudflare/workers-types` は追加せず、COMPASSと同じく `PagesContext` の最小型をファイル内に定義する。unit testは、Node 24のtype strippingを使って `node --test` で `.ts` を直接動かす（依存は増やさない）。

## 7. Cloudflare設定（オーナーの指示を受けてから実施）

### 7.1 Pages環境変数

| 名前 | Production | Preview | 種別 |
|---|---|---|---|
| `CONTACT_MODE` | `send` | `mock` | 平文 |
| `CONTACT_ALLOWED_HOST` | `yuto-matsui.com` | 未設定（mockのときは request URL のhostと同じoriginならよい） | 平文 |
| `CONTACT_ACCOUNT_ID` | 既存のaccount | 未設定 | 平文 |
| `CONTACT_FROM` / `CONTACT_TO` | routing domainのアドレス／確認済みの本人受信先 | 未設定 | 非公開記録 |
| `CONTACT_EMAIL_API_TOKEN` | 送信専用token | **設定しない** | Secret |
| `CONTACT_TURNSTILE_SECRET_KEY` | 個人用widgetのsecret | Cloudflareのテスト用secret | Secret |
| `NEXT_PUBLIC_CONTACT_TURNSTILE_SITE_KEY`（build） | 個人用widgetのsitekey | Cloudflareのテスト用sitekey | 平文 |

- `mock` のときは、REST APIを呼ばずに200を返す。Turnstileのテスト鍵は実際のhostnameとactionを返さないので、mockでは `success` だけを検証する。`send` の検証条件は緩めない。`send` のときに必要な値が1つでも欠けていれば503にする。Previewには本番の送信権限を一切渡さない。
- 本番のFunctionは `yuto-matsui-site.pages.dev`（production alias）でもproduction環境として動く。§6.1の3のhost検証により、ここからの送信は拒否する。WAFのrate limitはzone `yuto-matsui.com` にしか効かないので、この検証で迂回をふさぐ。

### 7.2 Turnstile

個人用widgetを新しく作る（hostnameは `yuto-matsui.com` だけ、actionは `personal_contact`）。COMPASSの鍵は使い回さない。

### 7.3 転送規則

`Return COMPASS routes` の条件に次の3つを追加する。他の条件、301、query保持は変えない。

```text
and http.request.uri.path ne "/contact/"
and http.request.uri.path ne "/contact"
and http.request.uri.path ne "/api/contact"
```

素材は、すでに除外されている `/images/contact-entry/` に置くので、規則の追加は要らない。`/contact` はPagesが `/contact/` へ正規化する。POSTの `/api/contact` が301されると、ブラウザーがGETに変えてしまうので、除外が必須になる。

### 7.4 連続アクセスの制限

Cloudflare FreeのWAF rate limiting ruleを1本使い、条件はURI Pathが `/api/contact` と一致することに絞る。Freeの計数条件はIPで、HostとMethodはルール式に指定できない。正式ホスト・同一Origin・POSTの判定はPages Functionが行う。パスだけで一致するため、適用前に同じゾーンの他のホストでこのパスを使用していないことを確認する。閾値と動作は非公開の記録で管理する。[プラン別の制限](https://developers.cloudflare.com/waf/rate-limiting-rules/#availability)

### 7.5 `_routes.json`

`public/_routes.json` を `{"version":1,"include":["/api/contact"],"exclude":[]}` にする。静的配信ではFunctionsを呼ばない。

## 8. 素材（看板の差し替え）

全体を描き直すと、描画環境の違いで承認済みの見た目から離れてしまう。そこで、承認済みの映像（COMPASS `6bb78ff` の `representative-{desktop,mobile}.mp4` と `lobby-*.webp`）はそのまま使い、右の部屋の札（会議室・COMPASS）が映っていた画素だけを差し替える。

1. `render.py`（個人用に修正済み）は、右の部屋の札を作らない。建物、家具、照明、左扉、カメラ移動、執務室の札は変えない。
2. `render-plate.py` は、`render.py --bake-only` で作った場面から、札があった範囲だけをコマごとに描く（承認済み映像と同じ16 sample、同じdenoise）。
3. `patch-signage.mjs` は次の処理を行う。
   - 承認済みファイルのSHA-256を確かめる。
   - 映像をコマに分け、差し替え画像の位置を±2pxの範囲で合わせる。
   - 周りの壁から色の対応を最小二乗で求め、文字の画素だけを境目をぼかして置き換える。
   - 開始画像（`lobby-*.webp`）も同じ方法で差し替え、映像はH.264（crf 18）に戻して書き出す。manifestも作る。
4. 実施環境：このcloud環境のBlender 4.5.9 LTSで、Vulkan（ソフトウェア描画）を使った。描くのは差し替える範囲だけで、そこには日本語の文字が含まれないため、ライセンス済みfontは不要。
5. 確認：開始画像と動画の1コマ目を拡大して、文字が残っていないこと、壁の質感と目地がつながっていることを確かめた。札が映るのは、PCでは1〜29コマ目、モバイルでは1〜27コマ目。執務室の札を含む、その他の画素は変えていない。

## 9. 既存の契約に対する意図した変更

技術的な整理のついでではなく、Issue #7の目的として変える点を列挙する。

| 契約 | 変更 |
|---|---|
| `verify-build.mjs` の静的限定の検査 | 「Functionsなし」を「Functionsは `functions/api/contact.ts` の1本だけ、`_routes.json` は上記の内容と完全に一致」に置き換える。`/contact/index.html` のroute検査も追加する |
| `compare.mjs` | JPのContactリンクのhrefを、`/en/` と同じ方式の例外として扱う。それ以外のDOM・style・画面の閾値は変えない |
| `http-contract.mjs` | 既存の6 URLは変えない。`/contact/` の200とnoindex、`/api/contact` のGETに405を返すことを別途検査する |
| `public/_headers` | Contact用のpreload Linkを追加するかはbuild後に判断する。既存の `/` と `/en/` の行は変えない |

## 10. 作業順とPR

> 2026-11-17 更新：オーナーの指示により、段階2〜4（素材の差し替えを含む）はすべてPR #8にまとめた。素材はオーナーのPCではなく、このcloud環境で差し替えた（§8）。残りの段階は§15で管理する。

| 段階 | 内容 | 成果 | 承認 |
|---|---|---|---|
| 0 | この設計（本PR） | docsだけ | 済（作成の依頼） |
| 1 | 送信の疎通確認。送信専用tokenで、本人宛てにREST API 1通を手動で送り、`result` と受信箱を確かめる。成立しなければ、ここで止めて原因と代わりの案を整理する | 非公開の記録 | **必要：tokenの作成と実メール1通** |
| 2 | Function・validator・unit test。`_routes.json` と `verify-build` の更新 | Draft PR、Previewのmock送信 | — |
| 3 | 素材の再出力と取り込み | Draft PR（オーナーのPCでrenderした結果をcommit） | — |
| 4 | UIの移植、JP導線の変更、E2E（Desktop／Mobile）、比較 | Draft PR、Preview | — |
| 5 | Cloudflare設定（§7）をPreviewで確かめ、本番の値を登録 | 非公開の設定記録 | **必要** |
| 6 | merge、転送規則の変更、本番の受入（承認済みの実メール1通） | 公開記録 | **必要** |

段階2〜4のPRは、mainへのmergeを段階6まで待つ。mainへmergeすると自動で公開され、`yuto-matsui-site.pages.dev/contact/` が先に見えてしまうため。

## 11. テスト計画

- unit（`node --test`）：validatorの境界値と制御文字。Functionでは、405、415、403（host・Origin）、413（headerと実body）、400、422、503（設定不足）、honeypot、Turnstileの失敗・hostname不一致・action不一致・通信失敗、REST APIのtimeout・非2xx・`success:false`・bounce・suppressed・受信先がない場合、成功時のpayload（`to` が固定、`reply_to`、件名にユーザー入力が入らない）、ログに個人情報が出ないこと。`fetch` はすべてmockする。
- E2E（Desktop／Mobile、既存fixtureで解析と送信を遮断）：扉を選ぶ、動画の再生、skip、reduced motion、Save-Data、動画の失敗、800msの期限、キーボード操作とfocus、入口へ戻っても下書きが残る、`/api/contact` をrouteでmockして成功・422・429（HTML）・502・ネットワーク断を返し、それぞれで入力が残る、二択・OTP・COMPASSの文字・「代表」がDOMに残っていない、COMPASSのhostへのrequestが0件。
- 回帰：`/`・`/en/` の比較32件（JPのhrefの例外だけ）、HTTP契約、既存のE2E 33件、typecheck、build、verify、CI。
- 本番：オーナーの指示があってから、実メール1通、Reply-To、受付画面、COMPASS ContactとCommunityが正常に動くこと。

## 12. 切り戻し

1. 転送規則に追加した3条件を外す（Contactは再びCOMPASSへ転送される）。
2. 必要なら、Pagesの直前の正常なproduction deploymentへrollbackする。
3. DNSでサイト全体をCOMPASSに戻すことはしない。GASとCOMPASS Contactには手を付けないので、すぐに旧窓口へ戻せる。

## 13. 決定事項

2026-11-17、オーナーの指示（COMPASSへの分岐は画面に出さない、それ以外は一任）により決定。

| ID | 内容 | 決定 |
|---|---|---|
| D1 | 右の部屋の札（`会議室`） | 消す。COMPASSの文字だけを消すと、2つ目の行き先があるように見えるため。右の部屋は背景として残す |
| D2 | COMPASS Contactへの案内 | 置かない。画面・metadata・aria属性のどこにもCOMPASSへの分岐や案内を出さない |
| D3 | 本文の上限 | 1000文字。COMPASSのserver上限と同じで、宛先prefixがなくなった分を戻す |
| D4 | ContactでのGA4 | JPと同じIDでpage viewだけを送る。フォームの内容・入力イベントは送らない |

## 14. 実装状況（2026-11-17）

PR #8 に、コードで実装できる範囲をすべて入れた。Cloudflareの設定と本番切替は、オーナーの承認を待っている。

| 項目 | 状況 |
|---|---|
| 受付Function、共通validator、`_routes.json` | 実装済み。unit test 20件 |
| 画面 | 実装済み。本番の「代表へのご連絡」側と同じCSS・構造。Contactを開くとすぐ入室演出を再生し、入力画面へ進む（宛先を選ぶ操作はない） |
| 本番にない部分 | 送信欄のTurnstile、任意badge、失敗時・受付後の文言を、本番の配色・書体・余白で追加 |
| 素材 | 右の部屋の札を消した映像と開始画像に差し替え済み（§8） |
| JPトップの導線 | `/contact/` に変更 |
| テスト | Contact E2E 17件（Desktop／Mobile）、build検証（Function 1本の境界、本番用Turnstile鍵の必須化） |
| Preview | branch Previewで、ページ・素材・`/api/contact` の405・設定なしの503、E2E 17件を確認 |

画面は、日本語フォントを入れた環境で、本番と並べて撮影して確認した。この作業環境は標準では日本語フォントを持たず、中国語フォントで描画されるので、フォントを入れない状態のスクリーンショットでは字形が崩れて見える。

## 15. 残るタスク

| # | タスク | 担当 | 前提 | 完了の条件 |
|---|---|---|---|---|
| T1 | Previewの見た目と操作をオーナーが確認する | オーナー | PR #8 のPreview | **済（2026-11-17）**。オーナーが確認を完了 |
| T2 | 送信専用API tokenを作る（Email Sendingの送信だけ、対象はこのaccountだけ） | オーナー | — | **済（2026-11-17）**。tokenは非公開で保管 |
| T3 | REST APIで本人宛てに1通送り、`result.delivered`／`queued` と受信箱を確かめる | オーナー | T2、送信元のrouting domainと確認済み受信先 | **済（2026-11-17）**。Cloudflare APIから試験メール1通を送信。配送結果は `delivered`。本人の受信トレイへの到着と、Reply-Toが指定どおりであることをオーナーが確認（送信元は `contact@yuto-matsui.com`、Reply-Toは `example.com` の試験アドレス）。受信先は非公開の記録に残す。本番フォームから受信箱までは T10 で確かめる |
| T4 | 個人用Turnstile widgetを作る（hostnameは `yuto-matsui.com`） | オーナー | — | sitekeyとsecret |
| T5 | Pages環境変数をPreview（mock、テスト鍵）に設定し、Previewで `/api/contact` まで通しで確かめる | オーナー | — | **済（2026-11-17）**。Previewのフォームで、Turnstileのテスト鍵とmockモードを使い、受付完了の画面まで到達することをオーナーが確認。Previewの `/api/contact` は、空の送信に設定済みの422を返す |
| T6 | Pages環境変数をProductionに設定する（§7.1） | 承認のもと実施 | T4（T2・T3は済） | 設定の記録 |
| T7 | WAFのrate limiting ruleを追加する（URI Pathの完全一致、§7.4） | 承認のもと実施 | 同じゾーンの他のホストでパスが重複しないこと | 閾値を非公開の記録に残す |
| T8 | PR #8 をmergeし、本番deployを確かめる | オーナーの指示 | T5〜T7。mainのbuildは本番用sitekeyがないと失敗するので、T6を先に済ませる | `Production verification` が成功する |
| T9 | `Return COMPASS routes` に除外3条件を追加する（§7.3） | オーナーの指示 | T8 | `/contact/` が200、`/api/contact` へのGETが405。他の転送は維持 |
| T10 | 本番の受入：承認済みのテストで1通送り、Reply-Toと受付画面を確かめる | オーナーの指示 | T9 | 公開記録（`docs/deployments/`）を作る |
| T11 | 切替記録と復元手順を文書化する | 実装担当 | T10 | 機密を含まない記録 |

## 16. ロードマップ

```text
済  設計（Issue #7）→ 実装・素材差し替え・Preview確認（PR #8）
済  T2/T3 送信疎通（API → 受信トレイ、Reply-To）、T5 Preview通し確認（mock）
済  T1 オーナー確認
次  T4 本番用Turnstile → T6/T7 本番設定
後  T8 merge → T9 転送除外 → T10 本番受入 → T11 記録
以降（別PR・別判断）
    - Production verificationとHTTP契約に /contact/ と /api/contact を追加
    - Next.jsのsecurity更新（buildが既知の脆弱性を警告している）
    - COMPASS側の旧Contact・GASの扱い（停止や改変は別の判断）
```

## 17. 課題とリスク

| 区分 | 内容 | 対応 |
|---|---|---|
| 確認範囲 | REST APIから本人の受信トレイへの到着とReply-Toは、Cloudflare APIを直接呼ぶ試験で確認済み（T3）。本番のフォームとFunctionを通した到着は、まだ確かめていない | 切替後のT10で確かめる |
| 順序 | mainのbuildは、本番用Turnstile sitekeyがないと失敗する（誤ってテスト鍵で公開しないための安全策） | T6をT8より先に行う |
| 公開範囲 | mainへmergeすると `yuto-matsui-site.pages.dev/contact/` が先に公開される。送信はhost検証で拒否されるが、画面は見える | T8とT9を間を空けずに行う。ページはnoindex |
| 依存 | Next.js 16.4.3にはbuild時に既知の脆弱性の警告が出る | 別PRで更新を検討する |
| 素材 | 差し替えた範囲は、承認済みの映像とは別の描画環境（ソフトウェア描画）で描いた。色は周りの壁に合わせてある。映像は再圧縮している（crf 18） | T1で、オーナーが実機で見て確かめる |
| 表示 | 日本語は端末のフォントで表示する（Noto Sans JP、ヒラギノ、游ゴシック）。日本語フォントのない環境では代わりのフォントになる | 本番と同じ仕様。変えない |
| 動画 | H.264だけを用意している。再生できない環境では演出を省いて入力画面を出す | 仕様どおり |
| 検証環境 | この作業環境では、本番比較の基準画像とフォントが違い、JPの文字幅に差が出る。mainでも同じ差なので、変更による差ではない | 基準は更新しない |
| E2E | `founder-mobile-hero` が並列実行時に1回だけ失敗した。単独と反復では成功する | 既存テストの安定性として別途調べる |
| 範囲外 | 英語のContact、問い合わせDB、自動返信、COMPASSの旧Contact・GAS・Communityの変更 | Issue #7の対象外 |

## 18. 画面の再設計（2026-11-17、本番切替後）

切替後、オーナーの指示により、Contactを「対象を絞った、プロフェッショナルな連絡窓口」として作り直した。ポートフォリオ本体（JP・ENページ、共通部品、継承CSS）は変更していない。

| 課題 | 変更 |
|---|---|
| 最初の入力欄が遠い（導入文2行、対象者4区分パネル、カード5枚） | 演出のあとは見出し「お問い合わせ」と白い紙面1枚だけにした。導入文、対象者パネル、英字の小見出し、入力済みのチェックマークを削除 |
| 誰に向けた窓口かを文章で説明していた | 紙面の先頭に「ご用件」（お仕事のご相談／取材・講演／学生の方）の3択を置いた。選んだ用件に応じて、メッセージ欄に書いてほしいことを1行だけ示す。用件は通知メールの件名にも入る（`[yuto-matsui.com] お仕事のご相談` など） |
| 押せない理由が分からない送信ボタン、一律のエラー文 | 送信ボタンは常に押せる（送信中だけ無効）。押したときに欄ごとの具体的な文言でエラーを示し、最初の欄へフォーカスを移す |
| 通常の入力を拒む制限 | 名前1〜50文字、会社名・学校名0〜50文字、メールアドレス254文字まで、本文1〜1000文字 |
| 常に表示されるTurnstile | `appearance: "interaction-only"`。確認が必要な人にだけ表示し、それ以外は場所も取らない |
| 送信後に手元に何も残らない | 受付画面に「送信した内容」（ご用件、お名前、メールアドレス、会社名・学校名、メッセージ）を表示する |
| 個人サイトとのつながりが弱い | ヘッダーを「Yuto Matsui」（トップへのリンク）だけにし、COMPASS由来のマークを外した。フッターにポートフォリオ（日本語・英語）へのリンクを置いた |
| 戻るたびに2秒待たされる | 入室演出は同じタブで1回だけ再生する（`sessionStorage`）。使えない環境では従来どおり毎回再生する |

受付APIは `topic`（`work`・`media`・`student`）を必須にした。画面と同じ検証（`src/contact/schema.ts`）を使う。

### 18.1 対象の2択とポートフォリオと同じ枠（2026-11-17）

最初に決めた方向（対象を「経営者・エンジニアなどからの仕事の連絡」と「学生からの相談」に絞り、プロフェッショナルな画面にする）に沿って、次のように改めた。用件の一覧、選択欄、例文は置かず、何の連絡かは連絡する側が自分の言葉で書く。

| 項目 | 内容 |
|---|---|
| 入口 | 見出しの下に「お仕事のご依頼」「学生からの相談」の2択。最初は「お仕事のご依頼」を選んだ状態で、フォーム全体を表示する |
| お仕事のご依頼 | 会社名・所属（必須）、お名前、メールアドレス、ご用件 |
| 学生からの相談 | 大学名（必須）、学年（選択式：1年〜6年、大学院）、お名前、メールアドレス、ご相談内容 |
| 切り替え | お名前・メールアドレス・本文は残し、所属は入口ごとに保持する |
| ヘッダー・フッター | トップページと同じもの。`src/ja/founder.module.css` と `MobileExternalMenu` を読み込んで使い、本体のファイルは変更しない。フッターの画像クレジットは本体の写真に対するものなので置かない |
| 書体・色 | ポートフォリオ本体と同じ |
| 入力途中の離脱 | ブラウザ標準の確認を出す |
| 演出 | 演出中の「Yuto Matsuiへのご連絡」「入室しています」を削除 |
| 通知メール | 件名 `[yuto-matsui.com] お仕事のご依頼` など。本文に種類、所属（学生は大学名・学年）、名前、メールアドレス、ご用件／ご相談内容 |

受付APIは `topic`（`work`・`student`）と `grade`（学生は必須、仕事は空文字）を受け取り、所属は必須にした。
