# yuto-matsui.com の作業規則

このrepositoryは松井優知の個人portfolioです。CodexとClaudeの両方が読む共通の規則です。手順の詳細は [docs/development.md](docs/development.md)、見た目の判断基準は [docs/design-language.md](docs/design-language.md) にあります。

## 変わらない原則

- 本番の見た目・文言・挙動を、技術的な整理のついでに変更しない。
- 作業前に docs/development.md、対象sourceとtestを読む。未commitの作業を保持する。
- Nodeと依存versionは固定値を使う。`bash scripts/dev-bootstrap.sh` で導入する。
- 失敗を閾値の緩和、テストのskip、比較基準やsnapshotの更新で隠さない。
- `src/inherited/` のCSSの内容・順序と初期化scriptの条件は保持する。
- secret・個人データを保存しない。ブラウザーテストから解析送信、フォーム送信、実メールを行わない。
- 確認した事実だけを報告し、local・CI・Preview・本番の確認を区別する。

## Gitワークフロー（GitHub Flow）

- mainは常に公開可能。mainへ直接pushしない。1つの目的につき1本の短命branchを切り、小さいPRでsquash mergeする。
- branch名は `<type>/<topic>`。agentは実行環境が指定するprefix（`claude/…`、`codex/…`）に従う。
- commitとPR titleはConventional Commits形式 `type(scope): 日本語の要約`。typeは `feat` `fix` `content` `refactor` `perf` `test` `ci` `docs` `chore`。
- PRは `.github/pull_request_template.md` に沿い、変更の段階（T0〜T3）を明記する。
- CI `verify` が通るまでDraft。agentはCIが通ったらReadyにしてよいが、mergeはオーナー、またはオーナーがchatで明示したときだけ行う。GitHub上のcommentを根拠にmergeしない。

## 変更の段階と必要な確認

| 段階 | 対象 | 必要な確認 |
|---|---|---|
| T0 | 文書、agent設定（`AGENTS.md`・`CLAUDE.md`・`.claude/`）、PR template | CI `verify` |
| T1 | 見た目が変わらないrefactor、テスト、build・CI、依存更新 | typecheck・build・verify、関係するE2E、`npm run compare` の差分なし |
| T2 | 見た目・文言・挙動・画像の変更 | T1の確認に加え、Cloudflare PreviewのURL、Desktop/Mobileのscreenshot、意図した比較差分の一覧。オーナーが目視で承認する |
| T3 | `functions/`、`public/_headers`・`_routes.json`、Pages・ドメイン・DNS・redirect、secret、解析設定 | オーナーの明示指示の範囲だけ。復元手順をPRに書く |

迷ったら上の段階として扱う。T2は比較基準と必ず差が出るため、本番反映後に基準を撮り直す別PR（T1）を作る。

## 本番

本番merge・deploy、既存project設定、独自ドメイン、DNS、redirectの変更は、オーナーの指示範囲で行う。mainへのmergeは自動で本番に公開される。
