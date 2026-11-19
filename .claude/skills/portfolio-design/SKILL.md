---
name: portfolio-design
description: yuto-matsui.comの見た目に触る作業の入口。JP/ENページやContactのlayout、CSS、色、書体、余白、画像、写真、動き、3D、レスポンシブ、新しいセクションやカードを作る・直す・見直すときは、コードを書く前に必ず使う。既存のデザイン言語を読み、必要なplugin skill（frontend-design、design-critique、accessibility-review、ux-copy、design-system）へ順に渡す。
---

# portfolio-design

このsiteの見た目は、オーナーが承認した本番そのものが基準です。新しい美観を足すことより、既存の言語を一貫して延長することを優先します。

## 1. 読む（コードを書く前）

1. `docs/design-language.md`：言語ごとのテーマ、書体、色、余白、breakpoint、動きの原則。
2. `docs/portfolio-card-design.md`：Expertise・Experience・Off hoursのカードの情報設計。
3. 対象のmodule CSSと、それを使うcomponent、関係するE2E（`tests/e2e/`）。
4. `src/inherited/` に触る場合は、AGENTS.mdの保持規則を確認し、触らずに済む方法を先に探す。

## 2. 決める

- 変更の段階を判定する。見た目・文言が変わるならT2（`ship-change` skill）。
- 変えるもの・変えないもの（JP/EN、Desktop/Mobile、隣接するセクション）を、作業前に1〜3行で書き出す。
- 新しい値（色・余白・書体サイズ）を足す前に、既存のCSS変数と近い値を探して再利用する。

## 3. 作る

- 新しいUIや作り直しでは `frontend-design:frontend-design` を呼ぶ。ただし方向性は docs/design-language.md の範囲に限り、「独自性のための新しい美観」は提案として出すにとどめ、オーナーの承認なしに実装しない。
- 文言が必要なら `design:ux-copy` で案を作り、確定文言はオーナーに確認する。JPとENは直訳せず、それぞれの文体に合わせる。
- 色・余白・部品の整理は `design:design-system` の観点で、命名と重複を確認する。
- `prefers-reduced-motion`、keyboard操作、`:focus-visible`、タッチ端末（`hover: none`）を最初から含める。

## 4. 確かめる（PRをReadyにする前）

1. ローカルでDesktopとMobileを実描画する（`npm run build && npm run serve`、主要な幅は390、1024、1280、1275×553、1536）。
2. `design:design-critique` で階層・一貫性・既存との差を、`design:accessibility-review` でコントラスト・操作・読み上げを自己レビューする。指摘と対応をPRに書く。
3. `npx playwright test tests/e2e/accessibility.spec.ts` を実行する。新しい違反は直す。既知の違反を直したら、同じfileの `known` から消す。
4. `src/shared/`・`src/inherited/` など両言語に効く部品に触れたときは、`npm run compare -- check http://127.0.0.1:8798` で、変えるつもりのない言語に差が出ていないことを確かめる（AGENTS.mdの「比較を使うとき」）。片方の言語だけを意図して変えるときは使わない。
5. Cloudflare PreviewのURLで同じ画面を確認し、Desktop/Mobileのscreenshotを2倍の解像度でPRに添える。

plugin skillが環境にない場合は、同じ観点を手で確認し、PRに「skill未使用」と書く。
