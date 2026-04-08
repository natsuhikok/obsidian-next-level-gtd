import { describe, expect, it } from 'vitest';
import { NextActionsQuery } from './NextActionsQuery';
import { NextAction } from './NextAction';
import { FilterSelection } from './FilterSelection';

const TODAY = '2026-04-01';

function action(
	overrides: Partial<{
		text: string;
		blocked: boolean;
		scheduled: string | null;
		due: string | null;
		context: readonly string[];
	}> = {},
): NextAction<string> {
	return new NextAction(
		'test',
		overrides.text ?? 'タスク',
		overrides.blocked ?? false,
		overrides.scheduled ?? null,
		overrides.due ?? null,
		overrides.context ?? [],
	);
}

function query(
	selection: FilterSelection,
	actions: readonly NextAction<string>[],
	today: string = TODAY,
): NextActionsQuery<string> {
	return new NextActionsQuery(selection, selection.environmentContexts, actions, today);
}

describe('NextActionsQuery', () => {
	describe('日付フィルタ', () => {
		it('ブロックされたタスクは表示しない', () => {
			const s = FilterSelection.initial([]);
			const result = query(s, [action({ blocked: true })]).filteredActions;
			expect(result).toHaveLength(0);
		});

		describe('actionable モード', () => {
			it('日付なしのタスクは表示する', () => {
				const s = FilterSelection.initial([]);
				expect(query(s, [action()]).filteredActions).toHaveLength(1);
			});

			it('スケジュール日が今日以前のタスクは表示する', () => {
				const s = FilterSelection.initial([]);
				expect(
					query(s, [action({ scheduled: '2026-04-01' })]).filteredActions,
				).toHaveLength(1);
			});

			it('スケジュール日が未来のタスクは表示しない', () => {
				const s = FilterSelection.initial([]);
				expect(
					query(s, [action({ scheduled: '2026-04-02' })]).filteredActions,
				).toHaveLength(0);
			});

			it('期限のみのタスクは表示する', () => {
				const s = FilterSelection.initial([]);
				expect(query(s, [action({ due: '2026-05-01' })]).filteredActions).toHaveLength(1);
			});
		});

		describe('withDate モード', () => {
			it('スケジュール日が未来のタスクも表示する', () => {
				const s = new FilterSelection([], [], true, [], true, 'withDate');
				expect(
					query(s, [action({ scheduled: '2026-12-31' })]).filteredActions,
				).toHaveLength(1);
			});

			it('期限ありのタスクは表示する', () => {
				const s = new FilterSelection([], [], true, [], true, 'withDate');
				expect(query(s, [action({ due: '2026-05-01' })]).filteredActions).toHaveLength(1);
			});

			it('日付なしのタスクは表示しない', () => {
				const s = new FilterSelection([], [], true, [], true, 'withDate');
				expect(query(s, [action()]).filteredActions).toHaveLength(0);
			});

			it('ブロックされたタスクは日付ありでも表示しない', () => {
				const s = new FilterSelection([], [], true, [], true, 'withDate');
				expect(
					query(s, [action({ blocked: true, scheduled: '2026-05-01' })]).filteredActions,
				).toHaveLength(0);
			});
		});
	});

	describe('環境フィルタ', () => {
		it('初期状態では環境コンテキストなしのタスクのみ表示する', () => {
			const s = FilterSelection.initial(['home']);
			const q = new NextActionsQuery(
				s,
				['home'],
				[action({ context: ['home'] }), action({ context: [] })],
				TODAY,
			);
			expect(q.filteredActions).toHaveLength(1);
			expect(q.filteredActions[0]!.context).not.toContain('home');
		});

		it('全環境が選択されていても環境コンテキストなしが未選択なら環境タグなしタスクは表示しない', () => {
			const s = new FilterSelection(['home'], ['home'], false, [], true, 'actionable');
			const q = new NextActionsQuery(
				s,
				['home'],
				[
					action({ context: ['home'] }),
					action({ context: [] }),
					action({ context: ['quick'] }),
				],
				TODAY,
			);
			const texts = q.filteredActions.map((a) => a.context);
			expect(q.filteredActions).toHaveLength(1);
			expect(texts[0]).toContain('home');
		});

		it('home のみ選択時: home タグを持つタスクを表示する', () => {
			const s = new FilterSelection(['home'], ['home'], false, [], true, 'actionable');
			const q = new NextActionsQuery(s, ['home'], [action({ context: ['home'] })], TODAY);
			expect(q.filteredActions).toHaveLength(1);
		});

		it('環境コンテキストなしのみ選択時: 環境タグなしタスクを表示する', () => {
			const s = new FilterSelection(['home'], [], true, [], true, 'actionable');
			const q = new NextActionsQuery(
				s,
				['home'],
				[action({ context: [] }), action({ context: ['home'] })],
				TODAY,
			);
			expect(q.filteredActions).toHaveLength(1);
			expect(q.filteredActions[0]!.context).toEqual([]);
		});

		it('home と環境コンテキストなし両方選択: 両方表示する', () => {
			const s = new FilterSelection(['home'], ['home'], true, [], true, 'actionable');
			const q = new NextActionsQuery(
				s,
				['home'],
				[action({ context: ['home'] }), action({ context: [] })],
				TODAY,
			);
			expect(q.filteredActions).toHaveLength(2);
		});
	});

	describe('性質フィルタ', () => {
		it('初期状態では性質タグなしのタスクのみ表示する', () => {
			const s = FilterSelection.initial(['home']);
			const q = new NextActionsQuery(
				s,
				['home'],
				[action({ context: [] }), action({ context: ['quick'] })],
				TODAY,
			);
			expect(q.filteredActions).toHaveLength(1);
			expect(q.filteredActions[0]!.context).not.toContain('quick');
		});

		it('quick 選択時: quick を持つタスクを表示する', () => {
			const s = new FilterSelection(['home'], ['home'], true, ['quick'], false, 'actionable');
			const q = new NextActionsQuery(
				s,
				['home'],
				[action({ context: ['home', 'quick'] }), action({ context: ['home'] })],
				TODAY,
			);
			expect(q.filteredActions).toHaveLength(1);
			expect(q.filteredActions[0]!.context).toContain('quick');
		});

		it('複数の性質を選択した場合はすべてを満たすタスクのみ表示する', () => {
			const s = new FilterSelection(
				['home'],
				['home'],
				true,
				['quick', 'deep'],
				false,
				'actionable',
			);
			const q = new NextActionsQuery(
				s,
				['home'],
				[
					action({ context: ['home', 'quick', 'deep'] }),
					action({ context: ['home', 'quick'] }),
				],
				TODAY,
			);
			expect(q.filteredActions).toHaveLength(1);
		});

		it('タグ比較は case-insensitive', () => {
			const s = new FilterSelection(['home'], [], true, ['quick'], false, 'actionable');
			const q = new NextActionsQuery(s, ['home'], [action({ context: ['Quick'] })], TODAY);
			expect(q.filteredActions).toHaveLength(1);
		});

		it('性質コンテキストなし選択時: 性質タグなしタスクを表示する', () => {
			const s = new FilterSelection(['home'], ['home'], true, [], true, 'actionable');
			const q = new NextActionsQuery(s, ['home'], [action({ context: ['home'] })], TODAY);
			expect(q.filteredActions).toHaveLength(1);
		});

		it('性質コンテキストなし選択時: 性質タグありタスクは表示しない', () => {
			const s = new FilterSelection(['home'], ['home'], true, [], true, 'actionable');
			const q = new NextActionsQuery(
				s,
				['home'],
				[action({ context: ['home', 'quick'] })],
				TODAY,
			);
			expect(q.filteredActions).toHaveLength(0);
		});

		it('quick と性質コンテキストなし両方選択: 両方表示する', () => {
			const s = new FilterSelection(['home'], ['home'], true, ['quick'], true, 'actionable');
			const q = new NextActionsQuery(
				s,
				['home'],
				[action({ context: ['home', 'quick'] }), action({ context: ['home'] })],
				TODAY,
			);
			expect(q.filteredActions).toHaveLength(2);
		});

		it('quick と性質コンテキストなし両方選択: 別の性質タグのみのタスクは表示しない', () => {
			const s = new FilterSelection(['home'], ['home'], true, ['quick'], true, 'actionable');
			const q = new NextActionsQuery(
				s,
				['home'],
				[action({ context: ['home', 'deep'] })],
				TODAY,
			);
			expect(q.filteredActions).toHaveLength(0);
		});
	});

	describe('性質タグの候補', () => {
		it('環境・日付フィルタを通過したタスクの性質タグが候補になる', () => {
			const s = new FilterSelection(['home'], ['home'], false, [], false, 'actionable');
			const q = new NextActionsQuery(
				s,
				['home'],
				[
					action({ context: ['home', 'quick'] }),
					action({ context: ['home', 'deep'] }),
					action({ context: ['quick'] }),
				],
				TODAY,
			);
			expect(q.propertyCandidates).toEqual(['deep', 'quick']);
		});

		it('選択中の性質で候補が絞り込まれない', () => {
			const s = new FilterSelection(
				['home'],
				['home'],
				false,
				['quick'],
				false,
				'actionable',
			);
			const q = new NextActionsQuery(
				s,
				['home'],
				[action({ context: ['home', 'quick'] }), action({ context: ['home', 'deep'] })],
				TODAY,
			);
			expect(q.propertyCandidates).toEqual(['deep', 'quick']);
		});

		it('ブロックされたタスクの性質タグは候補に含まれない', () => {
			const s = new FilterSelection(['home'], ['home'], true, [], false, 'actionable');
			const q = new NextActionsQuery(
				s,
				['home'],
				[
					action({ context: ['home', 'quick'], blocked: true }),
					action({ context: ['home', 'deep'] }),
				],
				TODAY,
			);
			expect(q.propertyCandidates).toEqual(['deep']);
		});

		it('重複した性質タグは1つにまとめられる', () => {
			const s = new FilterSelection([], [], true, [], false, 'actionable');
			const q = new NextActionsQuery(
				s,
				[],
				[action({ context: ['quick'] }), action({ context: ['quick'] })],
				TODAY,
			);
			expect(q.propertyCandidates).toEqual(['quick']);
		});
	});

	describe('性質タグなし候補', () => {
		it('環境・日付フィルタを通過したタスクに性質タグなしのものがあれば true', () => {
			const s = new FilterSelection(['home'], ['home'], false, [], true, 'actionable');
			const q = new NextActionsQuery(
				s,
				['home'],
				[action({ context: ['home'] }), action({ context: ['home', 'quick'] })],
				TODAY,
			);
			expect(q.hasPropertylessCandidate).toBe(true);
		});

		it('環境・日付フィルタを通過したタスクがすべて性質タグありなら false', () => {
			const s = new FilterSelection(['home'], ['home'], false, [], true, 'actionable');
			const q = new NextActionsQuery(
				s,
				['home'],
				[action({ context: ['home', 'quick'] })],
				TODAY,
			);
			expect(q.hasPropertylessCandidate).toBe(false);
		});
	});

	describe('並び順', () => {
		it('期限あり → スケジュールあり → 日付なし の順に並ぶ', () => {
			const s = new FilterSelection([], [], true, [], true, 'actionable');
			const q = new NextActionsQuery(
				s,
				[],
				[
					action({ text: '日付なし' }),
					action({ text: 'scheduled あり', scheduled: '2026-03-01' }),
					action({ text: 'due あり', due: '2026-04-10' }),
				],
				TODAY,
			);
			const sorted = q.sortedFilteredActions.map((a) => a.text);
			expect(sorted).toEqual(['due あり', 'scheduled あり', '日付なし']);
		});

		it('同じ区分では日付が近い順に並ぶ', () => {
			const s = new FilterSelection([], [], true, [], true, 'actionable');
			const q = new NextActionsQuery(
				s,
				[],
				[
					action({ text: 'due2', due: '2026-04-10' }),
					action({ text: 'due1', due: '2026-04-05' }),
				],
				TODAY,
			);
			const sorted = q.sortedFilteredActions.map((a) => a.text);
			expect(sorted).toEqual(['due1', 'due2']);
		});

		it('期限切れのタスクは期限ありの先頭に並ぶ', () => {
			const s = new FilterSelection([], [], true, [], true, 'actionable');
			const q = new NextActionsQuery(
				s,
				[],
				[
					action({ text: '未来の due', due: '2026-12-31' }),
					action({ text: '過去の due (overdue)', due: '2026-01-01' }),
				],
				TODAY,
			);
			expect(q.sortedFilteredActions[0]!.text).toBe('過去の due (overdue)');
		});
	});

	describe('選択状態の正規化', () => {
		it('環境コンテキスト設定から除外された環境タグは選択状態から取り除かれる', () => {
			const staleSelection = new FilterSelection(
				['home', 'office'],
				['home', 'office'],
				true,
				[],
				true,
				'actionable',
			);
			const q = new NextActionsQuery(staleSelection, ['home'], [], TODAY);
			expect(q.normalizedSelection.selectedEnvironments).toEqual(['home']);
			expect(q.normalizedSelection.environmentContexts).toEqual(['home']);
		});

		it('存在しなくなった性質タグは選択状態から取り除かれる', () => {
			const s = new FilterSelection([], [], true, ['quick', 'deep'], false, 'actionable');
			const q = new NextActionsQuery(s, [], [action({ context: ['deep'] })], TODAY);
			expect(q.normalizedSelection.selectedProperties).toEqual(['deep']);
		});

		it('現在のアクションに存在する性質タグは選択状態を維持する', () => {
			const s = new FilterSelection([], [], true, ['quick'], false, 'actionable');
			const q = new NextActionsQuery(s, [], [action({ context: ['quick'] })], TODAY);
			expect(q.normalizedSelection.selectedProperties).toContain('quick');
		});
	});

	describe('受け入れ条件', () => {
		it('#home #quick と #home のタスクがあるとき、環境=home・性質=quick で前者のみ表示', () => {
			const s = new FilterSelection(
				['home'],
				['home'],
				false,
				['quick'],
				false,
				'actionable',
			);
			const q = new NextActionsQuery(
				s,
				['home'],
				[
					action({ text: '#home #quick タスク', context: ['home', 'quick'] }),
					action({ text: '#home のみタスク', context: ['home'] }),
				],
				TODAY,
			);
			expect(q.filteredActions.map((a) => a.text)).toEqual(['#home #quick タスク']);
		});

		it('日付ありのみ では scheduled または due を持つタスクのみ表示', () => {
			const s = new FilterSelection([], [], true, [], true, 'withDate');
			const q = new NextActionsQuery(
				s,
				[],
				[action({ scheduled: '2026-05-01' }), action({ due: '2026-05-01' }), action()],
				TODAY,
			);
			expect(q.filteredActions).toHaveLength(2);
		});

		it('実行可能のみ では future scheduled タスクは表示しない', () => {
			const s = FilterSelection.initial([]);
			const q = new NextActionsQuery(s, [], [action({ scheduled: '2026-12-31' })], TODAY);
			expect(q.filteredActions).toHaveLength(0);
		});
	});
});
