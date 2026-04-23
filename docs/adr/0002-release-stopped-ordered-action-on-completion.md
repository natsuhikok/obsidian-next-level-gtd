# 0002. 完了時に次の番号付き中止タスクを解放する

日付: 2026-04-22

ステータス: 採用

## コンテキスト

番号付きチェックリストは、GTD の順番付き action list として使われる。既存の next action 抽出では、`[ ]` は実行可能、`[-]` は中止または停止中として扱い、番号付きリストでは前の未完了 sibling が後続 action を block する。

一方で、ユーザーが Obsidian のノートビューで現在の action を完了しても、直後に準備済みの `[-]` action はそのまま残り、次の実行可能 action として表示されない。

## 決定

Obsidian の `editor-change` イベントで、同じ Markdown view の前回内容と現在内容を比較し、番号付きタスクが `[ ]` から `[x]` または `[X]` に変わった場合だけ、同じ番号付きリスト内の直後の stopped sibling を `[-]` から `[ ]` に変更する。

テキストの変換規則は `NoteContent` に置く。プラグイン本体は Obsidian editor から前回内容と現在内容を渡し、変更が必要な場合だけ editor content を更新する。

## 代替案

- next action 抽出時に `[-]` を条件付きで実行可能扱いする案は採用しない。ノート本文が更新されず、ユーザーが期待する checklist state と plugin-visible state がずれるため。
- vault modify や metadata change でファイル全体を後処理する案は採用しない。要求されている通常の note-view checkbox 操作に対して遅く、直接編集していないファイルも対象にしやすいため。
- すべての後続 `[-]` を解放する案は採用しない。順番付き action list の予測可能性を壊し、無関係な stopped action を変更するため。

## 影響

- 対象は番号付き checklist に限定する。
- 箇条書きリスト、別リスト、コードブロック内、直後ではない stopped action は変更しない。
- `[x]` と `[X]` はどちらも完了として扱う。
- 既存の next action 抽出規則は変更しない。

## 結果

番号付き action list で現在の item を完了すると、次の stopped item が note content 上でも `[ ]` になり、Next Actions view でも実行可能 action として扱われる。
