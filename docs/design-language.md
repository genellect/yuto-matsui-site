# デザイン言語

yuto-matsui.com の見た目を変えるときの判断基準です。正本は本番の表示で、この文書はそれを読み取れるようにまとめたものです。値はsourceから転記しています。食い違う場合はsourceと本番が正しく、この文書を直します。

## 原則

1. **既存を延長する**：新しい色・書体・動きを足す前に、同じ言語の既存の値と部品を再利用する。
2. **JPとENは別の紙面**：同じ内容でも、テーマ・書体・セクション順は言語ごとに異なる。片方の変更をもう片方へ機械的に写さない。
3. **写真と本文が主役**：装飾的な常時アニメーション、hoverでの拡大、カード全体の傾きは足さない（[カードの情報設計](portfolio-card-design.md)）。FRAGMENTSとProductsの既存3Dは保持する。
4. **静けさと可読性**：reduced motionでも本文とCTAが消えないこと、keyboardとタッチで同じことができることを最初から満たす。

## JP（`/`、`src/ja/founder.module.css`）

- テーマ：明るい紙面。`--paper #f7fbff`、`--ink #101c2b`、`--ink-soft #45566a`、`--line rgba(22,47,76,.14)`。
- アクセント：分野ごとに固定。`--bio #38a77f`（生命科学）、`--ai #4d72ed`（AI）、`--education #d28a38`（教育）。カードでは `data-accent` で切り替え、文字用には濃い色（例 `#24775d`、`#3458bd`、`#8d5922`）を使う。
- 補助色：`--cyan #19bad0`、`--blue #486ff0`、`--violet #8b69e8`。
- 書体：Inter と日本語のsystem font（Desktop、901px以上では Noto Sans JP を優先）。
- focus：`outline: 3px solid #316fd7; outline-offset: 4px`。
- セクション順：Hero → Expertise → FRAGMENTS → Story（essay） → Products → Experience → Credentials → Off hours → Contact CTA。

## EN（`/en/`、`src/en/english-founder.module.css`）

- テーマ：パール系の背景。`--pearl #f0eff4`、`--graphite #17161d`、`--ink #071310`、`--muted #5d5a68`。
- アクセント：`--biotic #b6ef7a`、`--signal #8b78f0`。
- 書体：本文は Manrope（`--font-en-sans`）、見出しは Newsreader（`--font-en-editorial`）、番号やラベルは等幅のsystem font。
- focus：`outline: 2px solid var(--signal); outline-offset: 4px`。
- セクション順：Hero → Expertise → Experience → FRAGMENTS → Statement → Work → Off hours → Contact。

## Contact（`/contact/`、`src/contact/`）

JPの紙面と同じ値を使う（`contact.module.css` の変数に、JPのどの値から来たかを注記している）。角丸は `--radius: 12px`、エラーは `--error #b3263b`。

## Layoutとbreakpoint

- 主な切り替えは `max-width: 900px`（Desktop→1列）と `640px`（Mobile）。補助に `1100px`、`700px`、`360px` と、高さの条件（`max-height: 720px`、`600px`）がある。
- 比較・確認に使うCSS viewport：390×844、1024×768、1280×720、1275×553（Windowsの拡大率＋browser chrome）、1536×672。
- 横方向のはみ出しは1px以内。iOSのsafe areaは `env(safe-area-inset-*)` で扱う。

## 動き

- `prefers-reduced-motion: reduce` で動きを止め、内容は表示したままにする。
- 3Dや映像は、読み込み前・失敗時の静止画（poster、fallback）を必ず持つ。

## 変更しない場所

`src/inherited/` のCSSは本番の見た目を支える移植元のままです。内容と読み込み順を変えず、上書きが必要なら言語ごとのmodule CSS側で行います。
