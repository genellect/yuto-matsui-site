# 実測結果

`relocation-final.json` と `content-final.json` は、2026-11-15に実行したlocal全10組・32検査の生結果です。DOM・computed styleは全件一致し、失敗request・runtime error・COMPASSへのresource requestは0件でした。22画面のうちEN mobileのinitial/scrolledだけ、同じ座標の赤成分1段階の差があります。

これらの実行時点では差分0の判定だったため、`passed: false`を改変せず保存しています。`production-repeat.json`は、変更していない本番同士でも同じ揺れが発生した記録です。その後、オーナーがこの1ピクセル差を明示的に許容しました。以降の比較は`docs/migration.md`に記した限定条件だけを許容します。

撮影条件・viewport・実行時刻・基準の本番commitは各JSONにあります。本番のドメイン切替の安全性を示す結果ではありません。
