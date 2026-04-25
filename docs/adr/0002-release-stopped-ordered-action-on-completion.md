# 0002. 完了時に次の番号付き中止タスクを解放する

日付: 2026-04-22

ステータス: 採用

## コンテキスト

番号付きチェックリストは、GTD の順番付き action list として使われる。既存の next action 抽出では、`[ ]` は実行可能、`[-]` は中止または停止中として扱い、番号付きリストでは前の未完了 sibling が後続 action を block する。

一方で、ユーザーが Obsidian のノートビューで現在の action を完了しても、直後に準備済みの `[-]` action はそのまま残り、次の実行可能 action として表示されない。

その後の実装で、Live Preview の checkbox click 後に editor content 全体を `setValue` で書き戻すと、スクロール位置が先頭へ戻り、heading ベースの fold 状態も展開される回帰が起きた。求められているのは checklist state の補正だけであり、一時的な editor session state を壊してはいけない。

## 決定

Obsidian の `editor-change` イベントで、同じ Markdown view の前回内容と現在内容を比較し、番号付きタスクが `[ ]` から `[x]` または `[X]` に変わった場合だけ、同じ番号付きリスト内の直後の stopped sibling を `[-]` から `[ ]` に変更する。

テキストの変換規則は `NoteContent` に置く。プラグイン本体は Obsidian editor から前回内容と現在内容を渡し、変更が必要な場合でも editor 全文の再設定は行わず、対象 checkbox 文字だけを range edit で更新する。

この feature の不変条件として、Live Preview で ordered-task auto-release が動いても、editor session state は維持されなければならない。具体的には、スクロール位置と heading ベースの collapse state を保持しつつ、必要な checkbox state だけを更新する。

## 代替案

- next action 抽出時に `[-]` を条件付きで実行可能扱いする案は採用しない。ノート本文が更新されず、ユーザーが期待する checklist state と plugin-visible state がずれるため。
- vault modify や metadata change でファイル全体を後処理する案は採用しない。要求されている通常の note-view checkbox 操作に対して遅く、直接編集していないファイルも対象にしやすいため。
- すべての後続 `[-]` を解放する案は採用しない。順番付き action list の予測可能性を壊し、無関係な stopped action を変更するため。
- Live Preview の更新を `setValue` のような全文書き換えで行う案は採用しない。checkbox click 後の editor scroll と heading fold を壊し、ユーザーの作業位置を失わせるため。

## 影響

- 対象は番号付き checklist に限定する。
- 箇条書きリスト、別リスト、コードブロック内、直後ではない stopped action は変更しない。
- `[x]` と `[X]` はどちらも完了として扱う。
- 既存の next action 抽出規則は変更しない。
- Live Preview では対象の checkbox token だけを書き換え、scroll position と heading collapse state を保持する。

## 結果

番号付き action list で現在の item を完了すると、次の stopped item が note content 上でも `[ ]` になり、Next Actions view でも実行可能 action として扱われる。
