# 本番を保つ移行

正本: https://github.com/genellect/compass/issues/186

## 現状

元repositoryは `genellect/compass`、参照commitは `6bb78ff59837c61fbf3322b7c4a3d43d1b5ab884`。
現行本番は `compass-official` に接続されたままです。この実装では既存の配信設定を変更しません。
新repositoryと新Pages projectは検証用です。独自ドメインは接続しません。

## 比較

```sh
npm run serve
npm run compare -- check http://127.0.0.1:8798
# Previewでも同じcommandでoriginだけ差し替える
```

基準の取り直しは通常の修正手順ではありません。本番commit・取得日時・ブラウザーを明記し、差分原因を調べる前に基準を更新しません。
DOM・全要素の計算済みstyle・画面・通信と、操作テストを別々に記録します。
CSS viewportは390×844、1024×768、1280×720、1275×553、1536×672。
比較条件は同じLinux・同じbundled Chromium・DPR 1・日本語locale・reduced motion・ソフトウェア合成（GPUのditherを抑止）です。
3D canvasは撮影時だけvisibilityを隠して画面差分の対象外とし、操作テストと実表示で確認します。CDPのcaptureBeyondViewportで、viewportを変更せずに撮影します。
Next.jsのRSC転送script・build asset用linkは別途原文を保存します。移動に伴いchunk構成が変わるため、ページの意味的DOMと区別します。metadata・JSON-LD・本文・属性は比較対象です。
生成class名とfont識別子は元の名前へ対応付け、computed styleと画面でも一致を確認します。
画像URL例外は `/habitat/night-v1/top.webp` から `/images/founder-products/compass/top.webp` への変更だけです。
解析送信はテスト内で抑止します。COMPASSへの通常の外部リンクは保持します。
inline styleはブラウザーのCSSOM表現で比較し、空のstyle属性と改行だけの空白text nodeは正規化します。文言、要素の順序、属性値、計算済みstyleは保持します。

2026-11-15にオーナーが許容した例外: EN 390×844のinitial/scrolled画像にある座標(43,202)の赤成分1段階だけの差。本番同士の再取得でも再現した描画の揺れです。比較scriptはこの座標と成分を検証し、異なる場所や2ピクセル以上の差を許容しません。DOM・style・通信の許容差はありません。

HTTPは `node scripts/http-contract.mjs check <Preview URL>` で、6URLのstatus・Location・Content-Type・Cache-Control・CORS・security policy・Linkと、robots/sitemap/IndexNowの本文SHA-256を比較します。Date、CF-Ray、Report-To等のリクエスト固有情報、転送圧縮・接続ヘッダー、CDNのcache診断は生値を保存しますが同値判定の対象にしません。Preview限定のnoindexも記録します。
本番が返す画像preloadのLinkヘッダーを `public/_headers` に保持しています。画像の変更時はHTMLとこのヘッダーを一緒に見直してください。

新Pagesは `yuto-matsui-site`。mainの自動deployを無効にし、build commandにもmain拒否を設定しています。Previewは `codex/**` branchから確認します。独自ドメイン未接続です。


## 本番操作前のgate（今回は実行しない）

1. 新Previewの比較とCIを完了する。
2. `Verifying`の扱いと切替方式を決め、同じhost条件の検証環境で切替・切り戻しの両方を実測する。
3. 本番deployment ID・commit、DNS record、Single/Bulk Redirectの写し、custom domain状態、新repositoryのcommitを記録する。
4. オーナーの明示指示を得た日時にだけ切り替える。

非200が受入時間を超えた場合、比較で未解決の差が出た場合、失敗requestが出た場合は切り戻す。
付け替え方式は元projectへのドメイン再接続とDNS復元、中継方式は元deployment復元。操作順と所要時間は予行で確定する。
切り戻すと切替時点の内容になる。以降の更新は新repositoryの記録commitとの差分で追跡する。

## COMPASSの整理（今回は実行しない）

切替後、オーナーが切り戻し不要と判断してから別PRで行う。画像とCOMPASS共通CSSは残す。
ドメイン付け替えならFounder Functionsと関連middlewareを外し、_routesをAPI 3件にする。中継なら中継Functionsと全assetを含むrouteを維持する。
Functions inventoryの3か所の検査を同時に更新し、旧URL 6件の301とquery、COMPASSの主要ページ・フォーム・APIを確認する。
Bulk Redirect元hostは全件 `https://compass-official.pages.dev`。founder 3件はquery保持、en 3件はquery破棄。

## 既存テストの更新根拠

2026-11-15に現行本番で、旧製品リンク数4件の期待値が実際の日本語6件と一致せず、Mobile portraitの旧寸法期待値も失敗することを確認した。製品の補助GitHubリンク2件、JP Cytellect画像2560px、外部menuの2リンクは現行sourceと照合した。
画面のcodeを旧テストに合わせて変更せず、リンクと画像の期待値を現在の本番に合わせた。heroの5viewport×3枚の寸法は `tests/compare/baseline/hero-geometry.json` に実測を保存した。
写真フィルムのテスト末尾に残っていた旧製品CTAの検査は、現行製品のdestination検査に置き換えた。フィルムの3D操作・pause・fallbackの検査は維持した。
元COMPASSのbootstrapはWeb依存とChromium導入に成功し、現行22routeのbuildも成功した。対象外のLibrary Python環境はuv未導入でbootstrap全体のdoctorは未完了。専用repositoryはLibrary/Python環境に依存しない。
