---
name: ship-change
description: yuto-matsui-siteで変更を始めてからPRを出すまでの手順。コード・文書・設定を変更する依頼、commit・push・PR作成、CIやPreviewの確認、mergeの準備をするときに最初に使う。変更の段階（T0〜T3）を判定し、それに見合う確認だけを行って小さいPRを速く出す。
---

# ship-change

AGENTS.md の「Gitワークフロー」と「変更の段階」を実行する手順です。詳しい背景は docs/development.md にあります。

## 1. 始める

1. `git status` で未commitの作業を確認し、消さない。
2. mainの最新から短命branchを切る（環境がbranch名を指定していればそれに従う）。1 branch＝1目的。
3. 変更する予定のfileから段階を判定する。複数にまたがるときは最も上の段階を採る。
   - T0：`docs/**/*.md`、`README.md`、`AGENTS.md`、`CLAUDE.md`、`.claude/`、`.github/pull_request_template.md`
   - T1：見た目が変わらないsource、テスト、`scripts/`、`.github/workflows/`、依存
   - T2：見た目・文言・挙動・画像が変わるもの → `portfolio-design` skillも使う
   - T3：`functions/`、`public/_headers`、`public/_routes.json`、Pages・ドメイン・DNS・redirect、secret、解析設定 → オーナーの明示指示がなければ止めて確認する

## 2. 確認する（段階に応じて）

| 段階 | ローカルで実行するもの |
|---|---|
| T0 | 文書のリンク先が存在すること。CIに任せてよい |
| T1 | `npm run typecheck`、`npm run build`、`npm run verify`、関係するE2E（`npx playwright test tests/e2e/<対象>.spec.ts`）。`npm run compare` はAGENTS.mdの「比較を使うとき」だけ |
| T2 | T1に加え、`portfolio-design` skillの「確かめる」 |
| T3 | T1・T2に加え、PRに復元手順を書く |

Contactを変えたら `node --test tests/contact-function.test.ts` も実行する。失敗したら原因を直す。閾値の緩和、skip、基準の撮り直しで通さない。

## 3. PRを出す

1. commitは `type(scope): 日本語の要約`。PR titleも同じ形式（squash時にそのままmainのcommitになる）。
2. pushしてDraft PRを作り、`.github/pull_request_template.md` の見出しを埋める。段階、確認したこと、確認していないことを分けて書く。
3. CI `verify` が通ったらReadyにする。T2はPreviewのURLとscreenshotを載せ、オーナーの目視承認を待つ。
4. mergeは行わない。ユーザーがchatで明示した場合だけ行う。

## 4. merge後

- 本番に出たら、`Production verification` の成功を確認する。
- 報告では、local・CI・Preview・本番のどこで何を確認したかを分ける。
