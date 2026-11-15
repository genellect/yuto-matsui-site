# 文言・設定の編集

日本語は `src/content/ja.ts`、英語は `src/content/en.ts` に、表示文言、写真、製品、経歴を置いています。`src/site.ts` は公開ドメイン、COMPASSのorigin、GA4 measurement IDです。秘密情報は置きません。

JSXの改行、span/strong/wbr、条件分岐、イベント処理は各componentに残しています。例えば製品カードのInteractive見出しは`productCopy.interactiveLead`と`interactiveEmphasis`です。既存の未使用`products[].title`を表示につなぎ直していません。

継承CSSと初期化scriptは変更していません。文言移動の対応記録は `content-extraction.json`、移植元の対応記録は `source-map.json` です。

`npm run verify` はliteral参照に加えて、両言語contentを評価して組み立てた画像path・srcSetの全候補も検査します。画面に見えない候補も対象です。画面と操作の等価性は別途 `npm run test:e2e` と `npm run compare -- check <origin>` で確認します。
