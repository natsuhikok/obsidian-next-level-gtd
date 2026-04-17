import { describe, expect, it } from 'vitest';
import { NextActionCollection } from './NextActionCollection';

const TODAY = '2026-04-01';
const SRC = 'test-source';

function entry(content: string, source: string = SRC) {
	return { source, content };
}

describe('NextActionCollection', () => {
	describe('基本的なチェックボックス検出', () => {
		it('未完了チェックボックス [ ] は next action になる', () => {
			const c = new NextActionCollection([entry('- [ ] タスクA')], TODAY);
			expect(c.nextActions).toHaveLength(1);
			expect(c.nextActions[0]!.text).toBe('タスクA');
		});

		it('完了 [x] は next action ではない', () => {
			expect(
				new NextActionCollection([entry('- [x] 完了タスク')], TODAY).nextActions,
			).toHaveLength(0);
		});

		it('完了 [X] (大文字) は next action ではない', () => {
			expect(
				new NextActionCollection([entry('- [X] 完了タスク')], TODAY).nextActions,
			).toHaveLength(0);
		});

		it('中止 [-] は next action ではない', () => {
			expect(
				new NextActionCollection([entry('- [-] 中止タスク')], TODAY).nextActions,
			).toHaveLength(0);
		});

		it('チェックボックスがなければ nextActions は空になる', () => {
			expect(
				new NextActionCollection([entry('普通のテキスト\n# 見出し')], TODAY).nextActions,
			).toHaveLength(0);
		});

		it('数字リスト形式のチェックボックスも対象になる', () => {
			const c = new NextActionCollection([entry('1. [ ] 番号付きタスク')], TODAY);
			expect(c.nextActions).toHaveLength(1);
		});

		it('インデントされたチェックボックスも対象になる', () => {
			const c = new NextActionCollection([entry('  - [ ] インデントタスク')], TODAY);
			expect(c.nextActions).toHaveLength(1);
		});
	});

	describe('#temp タグ', () => {
		it('#temp 付きチェックボックスは next action ではない', () => {
			expect(
				new NextActionCollection([entry('- [ ] 一時タスク #temp')], TODAY).nextActions,
			).toHaveLength(0);
		});

		it('#temp が行中にあっても除外する', () => {
			expect(
				new NextActionCollection([entry('- [ ] #temp メモ')], TODAY).nextActions,
			).toHaveLength(0);
		});

		it('#temporary は厳密一致しないため next action として扱う', () => {
			const c = new NextActionCollection([entry('- [ ] #temporary タスク')], TODAY);
			expect(c.nextActions).toHaveLength(1);
		});
	});

	describe('コードスパン除外', () => {
		it('フェンスコードブロック内のチェックボックスは無視する', () => {
			expect(
				new NextActionCollection([entry('```\n- [ ] コード内\n```')], TODAY).nextActions,
			).toHaveLength(0);
		});

		it('~~~ フェンスコードブロック内のチェックボックスは無視する', () => {
			expect(
				new NextActionCollection([entry('~~~\n- [ ] コード内\n~~~')], TODAY).nextActions,
			).toHaveLength(0);
		});

		it('インラインコード内のチェックボックスは無視する', () => {
			expect(
				new NextActionCollection([entry('説明 `- [ ] インラインコード内` テキスト')], TODAY)
					.nextActions,
			).toHaveLength(0);
		});

		it('コードブロック外のチェックボックスは検出される', () => {
			const c = new NextActionCollection([entry('```\n- [ ] 内側\n```\n- [ ] 外側')], TODAY);
			expect(c.nextActions).toHaveLength(1);
			expect(c.nextActions[0]!.text).toBe('外側');
		});
	});

	describe('日付抽出', () => {
		it('⏳ YYYY-MM-DD を scheduled として抽出する', () => {
			const c = new NextActionCollection([entry('- [ ] タスク ⏳ 2026-04-05')], TODAY);
			expect(c.nextActions[0]!.scheduled).toBe('2026-04-05');
			expect(c.nextActions[0]!.due).toBeNull();
		});

		it('📅 YYYY-MM-DD を due として抽出する', () => {
			const c = new NextActionCollection([entry('- [ ] タスク 📅 2026-04-10')], TODAY);
			expect(c.nextActions[0]!.due).toBe('2026-04-10');
			expect(c.nextActions[0]!.scheduled).toBeNull();
		});

		it('⏳ と 📅 の両方がある場合は scheduled のみ採用し due は null になる', () => {
			const c = new NextActionCollection(
				[entry('- [ ] タスク ⏳ 2026-04-05 📅 2026-04-10')],
				TODAY,
			);
			expect(c.nextActions[0]!.scheduled).toBe('2026-04-05');
			expect(c.nextActions[0]!.due).toBeNull();
		});

		it('同種の日付記法が複数ある場合は最初の1つだけ採用する', () => {
			const c = new NextActionCollection(
				[entry('- [ ] タスク ⏳ 2026-04-01 ⏳ 2026-05-01')],
				TODAY,
			);
			expect(c.nextActions[0]!.scheduled).toBe('2026-04-01');
		});

		it('日付記法がない場合は scheduled も due も null になる', () => {
			const c = new NextActionCollection([entry('- [ ] タスク')], TODAY);
			expect(c.nextActions[0]!.scheduled).toBeNull();
			expect(c.nextActions[0]!.due).toBeNull();
		});
	});

	describe('blocked (親子関係)', () => {
		it('子チェックボックスを持つ親は blocked になる', () => {
			const c = new NextActionCollection([entry('- [ ] 親タスク\n  - [ ] 子タスク')], TODAY);
			const parent = c.nextActions.find((a) => a.text === '親タスク');
			expect(parent!.blocked).toBe(true);
		});

		it('子にチェックボックスがなければ blocked にならない', () => {
			const c = new NextActionCollection(
				[entry('- [ ] 親タスク\n  - 通常リスト項目')],
				TODAY,
			);
			expect(c.nextActions[0]!.blocked).toBe(false);
		});

		it('孫にチェックボックスがある場合も blocked になる', () => {
			const c = new NextActionCollection(
				[entry('- [ ] 親タスク\n  - リスト項目\n    - [ ] 孫タスク')],
				TODAY,
			);
			const parent = c.nextActions.find((a) => a.text === '親タスク');
			expect(parent!.blocked).toBe(true);
		});

		it('子チェックボックスが完了でも親は blocked になる', () => {
			const c = new NextActionCollection(
				[entry('- [ ] 親タスク\n  - [x] 完了した子')],
				TODAY,
			);
			expect(c.nextActions[0]!.blocked).toBe(true);
		});
	});

	describe('blocked (順序リスト)', () => {
		it('順序リストで前に未完了チェックボックスがあれば blocked になる', () => {
			const c = new NextActionCollection(
				[entry('1. [ ] 最初のタスク\n2. [ ] 次のタスク')],
				TODAY,
			);
			const second = c.nextActions.find((a) => a.text === '次のタスク');
			expect(second!.blocked).toBe(true);
		});

		it('順序リストの最初のタスクは兄弟によって blocked にならない', () => {
			const c = new NextActionCollection(
				[entry('1. [ ] 最初のタスク\n2. [ ] 次のタスク')],
				TODAY,
			);
			const first = c.nextActions.find((a) => a.text === '最初のタスク');
			expect(first!.blocked).toBe(false);
		});

		it('前のチェックボックスが完了済みなら blocked にならない', () => {
			const c = new NextActionCollection(
				[entry('1. [x] 完了タスク\n2. [ ] 次のタスク')],
				TODAY,
			);
			expect(c.nextActions[0]!.blocked).toBe(false);
		});

		it('前のチェックボックスが中止なら blocked にならない', () => {
			const c = new NextActionCollection(
				[entry('1. [-] 中止タスク\n2. [ ] 次のタスク')],
				TODAY,
			);
			expect(c.nextActions[0]!.blocked).toBe(false);
		});

		it('箇条書きリストの兄弟同士は blocked にならない', () => {
			const c = new NextActionCollection([entry('- [ ] タスクA\n- [ ] タスクB')], TODAY);
			expect(c.nextActions.every((a) => !a.blocked)).toBe(true);
		});

		it('異なる親の下の順序リストは互いに block しない', () => {
			const c = new NextActionCollection(
				[entry('- 親A\n  1. [ ] A-1\n- 親B\n  1. [ ] B-1')],
				TODAY,
			);
			expect(c.nextActions.every((a) => !a.blocked)).toBe(true);
		});
	});

	describe('構造的な blocked 判定の設定', () => {
		it('無効の場合は子チェックボックスを持つ親も blocked にならない', () => {
			const c = new NextActionCollection(
				[entry('- [ ] 親タスク\n  - [x] 完了した子')],
				TODAY,
				false,
			);

			expect(c.nextActions[0]!.blocked).toBe(false);
			expect(c.nextActions[0]!.isAvailable(TODAY)).toBe(true);
		});

		it('無効の場合は順序リストの後続タスクも available になる', () => {
			const c = new NextActionCollection(
				[entry('1. [ ] 最初のタスク\n2. [ ] 次のタスク')],
				TODAY,
				false,
			);
			const second = c.nextActions.find((a) => a.text === '次のタスク');

			expect(second!.blocked).toBe(false);
			expect(second!.isAvailable(TODAY)).toBe(true);
		});

		it('無効の場合も未来の scheduled は available にならない', () => {
			const c = new NextActionCollection(
				[entry('1. [ ] 最初のタスク\n2. [ ] 次のタスク ⏳ 2026-04-05')],
				TODAY,
				false,
			);
			const second = c.nextActions.find((a) => a.text === '次のタスク ⏳ 2026-04-05');

			expect(second!.blocked).toBe(false);
			expect(second!.isAvailable(TODAY)).toBe(false);
		});
	});

	describe('available action', () => {
		it('blocked でなく日付なしは available になる', () => {
			const c = new NextActionCollection([entry('- [ ] タスク')], TODAY);
			expect(c.nextActions[0]!.isAvailable(TODAY)).toBe(true);
		});

		it('blocked でなく scheduled が今日以前なら available になる', () => {
			const c = new NextActionCollection([entry('- [ ] タスク ⏳ 2026-04-01')], '2026-04-01');
			expect(c.nextActions[0]!.isAvailable('2026-04-01')).toBe(true);
		});

		it('blocked でなく scheduled が過去なら available になる', () => {
			const c = new NextActionCollection([entry('- [ ] タスク ⏳ 2026-03-01')], '2026-04-01');
			expect(c.nextActions[0]!.isAvailable('2026-04-01')).toBe(true);
		});

		it('blocked でなく scheduled が未来なら available にならない', () => {
			const c = new NextActionCollection([entry('- [ ] タスク ⏳ 2026-04-05')], '2026-04-01');
			expect(c.nextActions[0]!.isAvailable('2026-04-01')).toBe(false);
		});

		it('blocked でなく due ありは available になる', () => {
			const c = new NextActionCollection([entry('- [ ] タスク 📅 2026-05-01')], TODAY);
			expect(c.nextActions[0]!.isAvailable(TODAY)).toBe(true);
		});

		it('blocked なら日付に関わらず available にならない', () => {
			const c = new NextActionCollection(
				[entry('1. [ ] 最初\n2. [ ] ブロックされたタスク')],
				TODAY,
			);
			const blocked = c.nextActions.find((a) => a.text === 'ブロックされたタスク');
			expect(blocked!.isAvailable(TODAY)).toBe(false);
		});

		it('blocked かつ scheduled でも available にならない', () => {
			const c = new NextActionCollection(
				[entry('1. [ ] 最初\n2. [ ] タスク ⏳ 2026-03-01')],
				TODAY,
			);
			const blocked = c.nextActions.find((a) => a.text === 'タスク ⏳ 2026-03-01');
			expect(blocked!.isAvailable(TODAY)).toBe(false);
		});
	});

	describe('hasNextAction', () => {
		it('next action があれば true を返す', () => {
			expect(new NextActionCollection([entry('- [ ] タスク')], TODAY).hasNextAction).toBe(
				true,
			);
		});

		it('next action がなければ false を返す', () => {
			expect(new NextActionCollection([entry('- [x] 完了タスク')], TODAY).hasNextAction).toBe(
				false,
			);
		});

		it('空文字列は false を返す', () => {
			expect(new NextActionCollection([entry('')], TODAY).hasNextAction).toBe(false);
		});

		it('完了と未完了が混在する場合は true を返す', () => {
			expect(
				new NextActionCollection([entry('- [x] 完了\n- [ ] 未完了')], TODAY).hasNextAction,
			).toBe(true);
		});

		it('#temp と通常タスクが混在する場合は true を返す', () => {
			expect(
				new NextActionCollection([entry('- [ ] 通常タスク\n- [ ] 一時 #temp')], TODAY)
					.hasNextAction,
			).toBe(true);
		});
	});

	describe('availableActions', () => {
		it('available な next action のみ返される', () => {
			const c = new NextActionCollection(
				[entry('- [ ] 通常タスク\n- [ ] 予定タスク ⏳ 2026-05-01')],
				TODAY,
			);
			expect(c.availableActions).toHaveLength(1);
			expect(c.availableActions[0]!.text).toBe('通常タスク');
		});
	});

	describe('複合ケース', () => {
		it('ネストされた順序リストで正しく blocked 判定される', () => {
			const content = ['- 親タスク', '  1. [ ] サブタスク1', '  2. [ ] サブタスク2'].join(
				'\n',
			);
			const c = new NextActionCollection([entry(content)], TODAY);
			const sub1 = c.nextActions.find((a) => a.text === 'サブタスク1');
			const sub2 = c.nextActions.find((a) => a.text === 'サブタスク2');
			expect(sub1!.blocked).toBe(false);
			expect(sub2!.blocked).toBe(true);
		});

		it('完了・中止を挟む順序リストで正しく blocked 判定される', () => {
			const content = ['1. [x] 完了タスク', '2. [-] 中止タスク', '3. [ ] 未完了タスク'].join(
				'\n',
			);
			const c = new NextActionCollection([entry(content)], TODAY);
			expect(c.nextActions).toHaveLength(1);
			expect(c.nextActions[0]!.blocked).toBe(false);
		});

		it('blocked と scheduled は両立する', () => {
			const c = new NextActionCollection(
				[entry('1. [ ] 最初\n2. [ ] タスク ⏳ 2026-03-01')],
				TODAY,
			);
			const second = c.nextActions.find((a) => a.text === 'タスク ⏳ 2026-03-01');
			expect(second!.blocked).toBe(true);
			expect(second!.scheduled).toBe('2026-03-01');
		});

		it('blocked と due は両立する', () => {
			const c = new NextActionCollection(
				[entry('1. [ ] 最初\n2. [ ] タスク 📅 2026-04-10')],
				TODAY,
			);
			const second = c.nextActions.find((a) => a.text === 'タスク 📅 2026-04-10');
			expect(second!.blocked).toBe(true);
			expect(second!.due).toBe('2026-04-10');
		});

		it('複数のコンテンツを渡した場合それぞれ独立してパースされる', () => {
			const c = new NextActionCollection(
				[entry('- [ ] 文書1のタスク', 'doc1'), entry('- [ ] 文書2のタスク', 'doc2')],
				TODAY,
			);
			expect(c.nextActions).toHaveLength(2);
		});

		it('nextAction の source から元のコンテンツを特定できる', () => {
			const c = new NextActionCollection(
				[entry('- [ ] 文書1のタスク', 'doc1'), entry('- [ ] 文書2のタスク', 'doc2')],
				TODAY,
			);
			expect(c.nextActions[0]!.source).toBe('doc1');
			expect(c.nextActions[1]!.source).toBe('doc2');
		});

		it('異なる文書間ではネスト・順序の関係は影響しない', () => {
			const c = new NextActionCollection(
				[entry('1. [ ] 文書1のタスク', 'doc1'), entry('1. [ ] 文書2のタスク', 'doc2')],
				TODAY,
			);
			expect(c.nextActions.every((a) => !a.blocked)).toBe(true);
		});
	});

	describe('独立したリストの分離', () => {
		it('空行で区切られた順序リストは互いに block しない', () => {
			const c = new NextActionCollection(
				[entry('1. [ ] リストAのタスク\n\n1. [ ] リストBのタスク')],
				TODAY,
			);
			expect(c.nextActions).toHaveLength(2);
			expect(c.nextActions.every((a) => !a.blocked)).toBe(true);
		});

		it('見出しで区切られた順序リストは互いに block しない', () => {
			const c = new NextActionCollection(
				[entry('1. [ ] タスクA\n# セクション\n1. [ ] タスクB')],
				TODAY,
			);
			expect(c.nextActions.every((a) => !a.blocked)).toBe(true);
		});

		it('テキスト行で区切られた順序リストは互いに block しない', () => {
			const c = new NextActionCollection(
				[entry('1. [ ] タスクA\n説明テキスト\n1. [ ] タスクB')],
				TODAY,
			);
			expect(c.nextActions.every((a) => !a.blocked)).toBe(true);
		});

		it('連続した順序リストは同一リストとして block する', () => {
			const c = new NextActionCollection([entry('1. [ ] タスクA\n2. [ ] タスクB')], TODAY);
			const b = c.nextActions.find((a) => a.text === 'タスクB');
			expect(b!.blocked).toBe(true);
		});

		it('空行で区切られたリストの親子関係は分離される', () => {
			const c = new NextActionCollection(
				[entry('- [ ] 親タスク\n\n  - [ ] 子に見えるが独立したタスク')],
				TODAY,
			);
			expect(c.nextActions).toHaveLength(2);
			expect(c.nextActions.every((a) => !a.blocked)).toBe(true);
		});
	});

	describe('context (タグ抽出)', () => {
		it('タグがない場合は空配列になる', () => {
			const c = new NextActionCollection([entry('- [ ] タスク')], TODAY);
			expect(c.nextActions[0]!.context).toEqual([]);
		});

		it('タグを context として抽出する', () => {
			const c = new NextActionCollection([entry('- [ ] タスク #仕事')], TODAY);
			expect(c.nextActions[0]!.context).toEqual(['仕事']);
		});

		it('複数タグをすべて抽出する', () => {
			const c = new NextActionCollection([entry('- [ ] タスク #仕事 #電話')], TODAY);
			expect(c.nextActions[0]!.context).toEqual(['仕事', '電話']);
		});

		it('#temp タグは context に含まれない', () => {
			const c = new NextActionCollection([entry('- [ ] タスク #仕事 #temporary')], TODAY);
			expect(c.nextActions[0]!.context).not.toContain('temp');
		});

		it('#temporary は #temp とは別なので context に含まれる', () => {
			const c = new NextActionCollection([entry('- [ ] タスク #temporary')], TODAY);
			expect(c.nextActions[0]!.context).toEqual(['temporary']);
		});

		it('日付記法の絵文字に続くタグも抽出する', () => {
			const c = new NextActionCollection([entry('- [ ] タスク ⏳ 2026-04-05 #仕事')], TODAY);
			expect(c.nextActions[0]!.context).toEqual(['仕事']);
		});

		it('テキスト直後の # は context に含まれない', () => {
			const c = new NextActionCollection([entry('- [ ] タスク#仕事')], TODAY);
			expect(c.nextActions[0]!.context).toEqual([]);
		});

		it('先頭の # はスタンドアロンタグとして context に含まれる', () => {
			const c = new NextActionCollection([entry('- [ ] #仕事 タスク')], TODAY);
			expect(c.nextActions[0]!.context).toEqual(['仕事']);
		});
	});
});
