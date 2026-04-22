# 0001. 現在の GTD ドメインとプラグイン設計

日付: 2026-04-22

ステータス: 採用

## コンテキスト

Next Level GTD は、通常の Markdown ノートの上に小さな GTD ワークフロー層を追加する Obsidian プラグインである。現在の実装では、ノートの分類には Obsidian の frontmatter を使い、next action の抽出には Markdown のタスクチェックボックスを使っている。

この ADR は、2026-04-22 時点の実装と設計を記録する。新しい振る舞いを提案するものではなく、現状を追認するための基準記録である。

## 決定

### ノート状態は frontmatter から決まる

ノートの GTD 状態は `NoteState` が frontmatter から導出する。

- frontmatter がない、`classification` がない、または未知の `classification` は inbox として扱う。
- `classification: Reference` は reference として扱う。
- `classification: Actionable` には有効な `status` が必要である。
- 有効な status は `進行中`、`保留`、`完了`、`廃止` である。
- `classification: Actionable` で `status` がない、または不正な場合は invalid として扱う。

プラグインは `NoteEditor` を通してこの状態を編集し、Obsidian の `fileManager.processFrontMatter` を使う。ノート状態のトグルは raw frontmatter の編集ではなく、Reference と 4 つの actionable status だけを UI として公開する。

### アラートは状態と next action から導出する

`GTDNote` は `NoteState` と `NextActionCollection` を組み合わせ、UI で使うアラートを公開する。

現在のアラート規則は次のとおりである。

- inbox または invalid のノートは `frontmatterInvalid` を出す。
- reference のノートに next action がある場合は `referenceHasNextAction` を出す。
- actionable `進行中` のノートに next action がない場合は `actionableInProgressNoNextAction` を出す。
- actionable `完了` または `廃止` のノートに next action がある場合は `actionableDoneHasNextAction` を出す。
- actionable `保留` のノートには、現在は専用のアラート規則がない。

アラートの表示は `BannerRenderer` が担当する。除外フォルダごとのアラートバナー表示可否は UI 設定として扱い、ドメイン上のアラート規則は `NoteState` に集約する。

### next action は Markdown の未完了チェックボックスである

`NextActionCollection` は Markdown のリスト項目から next action を抽出する。

- `- [ ]`、`* [ ]`、`+ [ ]`、番号付きリストの未完了チェックボックスを next action として扱う。
- `[x]`、`[X]`、`[-]` は next action として扱わない。
- フェンスコードブロック内またはインラインコード内のチェックボックスは無視する。
- 厳密な `#temp` タグを含むタスクは無視する。
- タスク本文中のタグは `#temp` を除いて context として扱う。
- `⏳ YYYY-MM-DD` は `scheduled` として抽出する。
- `📅 YYYY-MM-DD` は `due` として抽出する。
- `⏳` と `📅` が両方ある場合は scheduled を優先し、due は無視する。
- 同種の日付が複数ある場合は最初の 1 つだけを採用する。

各 next action は、元ノート、タスク本文、blocked フラグ、scheduled、due、contexts を持つ。日付は `YYYY-MM-DD` 文字列として保持し、辞書順比較で判定する。

### 構造的な blocked 判定は任意だが既定で有効にする

プラグインは、タスクリストの構造を依存関係のシグナルとして扱える。

`evaluateStructuralNextActionBlocking` が有効な場合は、次のように判定する。

- 子孫にチェックボックスを持つ未完了タスクは blocked になる。
- 番号付きリストのタスクは、前に未完了の番号付き兄弟タスクがある場合に blocked になる。
- 箇条書きリストの兄弟同士は互いに block しない。
- 異なる親の下にあるタスク同士は互いに block しない。

この設定が無効な場合、構造による blocked 判定はしない。ただし未来の scheduled 日付を持つタスクは引き続き available にならない。

### Next Actions view はキャッシュ済みノートへのクエリである

`NextActionsView` は、除外されていない Markdown ファイルを `GTDNote` としてスキャンし、ノートキャッシュを持つ。ファイル変更、vault の modify/delete/rename、active leaf の変更、設定変更に応じて更新する。

ビューは次の入力から `NextActionsQuery` を組み立てる。

- キャッシュ済みノートに含まれるすべての next action。
- 設定済み environment contexts に基づく `ContextClassifier`。
- 設定済み context order に基づく `ContextOrder`。
- ビュー上の日付フィルタで制御される `DateVisibility`。
- ピン留めされた action の設定。

表示対象になるのは、blocked ではなく、日付表示設定で許可される action だけである。

表示グループは次の順である。

1. pinned actions。
2. dated actions。
3. environment context も property context も持たない default actions。
4. context groups。

1 つの action は複数グループに表示されうる。グループ内では、ピン留め、日付、設定済み context の優先度、未設定 context 名、タスク本文の順で並べる。

### context はタグであり、environment context は設定で区別する

タスク内のタグを context として扱う。`ContextClassifier` は context を次の 2 種類に分ける。

- 設定済み environment context に一致するタグは environment context。
- それ以外のタグは property context。

この区別は表示スタイルと default group への所属に影響する。どちらの種類の context でも context group は作られる。

`ContextOrder` は、設定済み context を trim、小文字化、先頭 `#` の除去、空文字の除外、重複排除によって正規化する。設定済み context は先に表示し、未設定 context はその後に名前順で表示する。

### File view はトリアージとナビゲーションの画面である

`FileView` は、除外されていない Markdown ファイルを同じ `GTDNote` 抽象としてスキャンし、ファイル指向のタブを提供する。

- inbox: inbox ノートとアラートを持つノート。
- all: スキャン済みのすべてのノート。
- recent: プラグインが記録した最近開いたファイル。
- in progress: status が `進行中` の actionable ノート。

ピン留めファイルの並び順は inbox、all、in progress に適用する。recent は recent history の順序を維持する。

### 設定は plugin data に永続化する

プラグインは Obsidian の plugin data に設定を保存する。

- 除外フォルダと、除外フォルダごとのアラートバナー表示可否。
- 構造的な next action blocking。
- context order。
- environment contexts。
- ピン留めファイル名。
- ピン留め action。
- 最近開いたファイルパス。

`loadSettings` は古い保存値との互換処理を持つ。文字列だけの excluded folders や、明示的な context order がない場合に environment contexts から context order を導出する処理が含まれる。

### プラグイン連携はイベント駆動である

`NextLevelGtdPlugin` は file view、next-actions view、リボンアイコン、ファイルメニューコマンド、Obsidian workspace/vault events を登録する。

metadata、editor content、vault files、active leaves が変わったとき、プラグインは開いている view と banner renderer に通知して UI を更新する。editor change は debounce してから banner と next action を更新する。

## 結果

- frontmatter はノート状態の source of truth であり、Markdown のタスク行は next action の source of truth である。
- ドメインの振る舞いは `NoteState`、`GTDNote`、`NextActionCollection`、`NextActionsQuery`、`ContextClassifier`、`ContextOrder` などの小さなクラスに集約する。
- UI クラスは Obsidian 連携、描画、キャッシュ、設定保存を担当し、ドメイン判断はドメインクラスに委譲する。
- 新しいユーザー向けラベルは引き続き `t()` を通し、英語と日本語の両方を追加する。
- テストは引き続き日本語でドメインの振る舞いを記述する。特に note state parsing、alert rules、next action extraction、query grouping、context handling を対象にする。

## 既知のフォローアップ

- `NoteState.computeAlerts` は `hasTodayOrFutureScheduledNextAction` 引数を受け取るが、現在のアラート規則では使っていない。
- ピン留めファイルはファイル名で照合し、ピン留め action は元ファイル名とタスク本文で照合する。そのため rename や同名ファイルはピン留めの挙動に影響しうる。
- next action の日付パースは、現在の emoji date forms と `YYYY-MM-DD` のみに対応する。
