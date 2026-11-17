# yuto-matsui.com の作業規則

このrepositoryは松井優知の個人portfolioです。COMPASSとは独立した編集範囲です。

- 本番の見た目・文言・挙動を、技術的な整理のついでに変更しない。
- 作業前にdocs/development.md、docs/migration.md、対象sourceとtestを読む。未commitの作業を保持し、専用branchで作業する。
- 場所の移動と文言・設定値の抽出は別PRにする。
- Nodeと依存versionは固定値を使う。`bash scripts/dev-bootstrap.sh` で導入する。
- 変更に応じてtypecheck、build、verify、Desktop/Mobile E2Eと比較を実行する。失敗を閾値の緩和やsnapshot更新で隠さない。
- 継承CSSの内容・順序と初期化scriptの条件は保持する。画像を元repositoryから削除しない。
- secret・個人データを保存しない。ブラウザーテストから解析送信、フォーム送信、実メールを行わない。
- 実装依頼には専用branchへのcommit/push、Draft PR、非本番Previewと確認を含む。
- 本番merge・deploy、既存project設定、独自ドメイン、DNS、redirect変更はユーザーの指示範囲で行う。2026-11-15の移行では本番切替とCD整備が明示的に承認された。
- 事実として確認した範囲を報告し、local・CI・Previewと本番の確認を区別する。
