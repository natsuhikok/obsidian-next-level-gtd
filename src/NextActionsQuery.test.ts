import { describe, expect, it } from 'vitest';
import { ContextClassifier } from './ContextClassifier';
import { FilterSelection } from './FilterSelection';
import { NextAction } from './NextActionCollection';
import { NextActionsQuery } from './NextActionsQuery';

const TODAY = '2026-04-01';

function action(
	overrides: {
		source?: string;
		text?: string;
		blocked?: boolean;
		scheduled?: string | null;
		due?: string | null;
		context?: readonly string[];
	} = {},
): NextAction<string> {
	return new NextAction(
		overrides.source ?? 'test',
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
	classifier = new ContextClassifier(['home']),
): NextActionsQuery<string> {
	return new NextActionsQuery(classifier, selection, actions, TODAY);
}

describe('NextActionsQuery', () => {
	describe('日付フィルタ', () => {
		it('ブロックされたタスクは表示しない', () => {
			const s = FilterSelection.initial();
			const result = query(s, [action({ blocked: true })]).filteredActions;
			expect(result).toHaveLength(0);
		});

		describe('actionable モード', () => {
			it('日付なしのタスクは表示する', () => {
				const s = FilterSelection.initial();
				expect(query(s, [action()]).filteredActions).toHaveLength(1);
			});

			it('スケジュール日が今日以前のタスクは表示する', () => {
				const s = FilterSelection.initial();
				expect(
					query(s, [action({ scheduled: '2026-04-01' })]).filteredActions,
				).toHaveLength(1);
			});

			it('スケジュール日が未来のタスクは表示しない', () => {
				const s = FilterSelection.initial();
				expect(
					query(s, [action({ scheduled: '2026-04-02' })]).filteredActions,
				).toHaveLength(0);
			});

			it('期限のみのタスクは表示する', () => {
				const s = FilterSelection.initial();
				expect(query(s, [action({ due: '2026-05-01' })]).filteredActions).toHaveLength(1);
			});
		});

		describe('withDate モード', () => {
			it('スケジュール日が未来のタスクも表示する', () => {
				const s = new FilterSelection([], true, [], false, 'withDate');
				expect(
					query(s, [action({ scheduled: '2026-12-31' })]).filteredActions,
				).toHaveLength(1);
			});

			it('期限ありのタスクは表示する', () => {
				const s = new FilterSelection([], true, [], false, 'withDate');
				expect(query(s, [action({ due: '2026-05-01' })]).filteredActions).toHaveLength(1);
			});

			it('日付なしのタスクは表示しない', () => {
				const s = new FilterSelection([], true, [], false, 'withDate');
				expect(query(s, [action()]).filteredActions).toHaveLength(0);
			});
		});
	});

	describe('環境フィルタ', () => {
		it('初期状態では環境コンテキストなしのタスクのみ表示する', () => {
			const s = new FilterSelection([], true, [], false, 'actionable');
			expect(query(s, [action({ context: ['home'] })]).filteredActions).toHaveLength(0);
			expect(query(s, [action({ context: ['quick'] })]).filteredActions).toHaveLength(1);
			expect(query(s, [action({ context: [] })]).filteredActions).toHaveLength(1);
		});

		it('home のみ選択時: home タグを持つタスクを表示する', () => {
			const s = new FilterSelection(['home'], false, [], false, 'actionable');
			expect(query(s, [action({ context: ['home'] })]).filteredActions).toHaveLength(1);
		});

		it('home のみ選択時: 環境コンテキストなしタスクは表示しない', () => {
			const s = new FilterSelection(['home'], false, [], false, 'actionable');
			expect(query(s, [action({ context: [] })]).filteredActions).toHaveLength(0);
		});

		it('home と環境コンテキストなし両方選択: 両方表示する', () => {
			const s = new FilterSelection(['home'], true, [], false, 'actionable');
			const actions = [action({ context: ['home'] }), action({ context: [] })];
			expect(query(s, actions).filteredActions).toHaveLength(2);
		});
	});

	describe('性質フィルタ', () => {
		it('初期状態では性質タグなしのタスクのみ表示する', () => {
			const s = FilterSelection.initial();
			// 性質タグあり（環境コンテキストなし） → 非表示
			expect(query(s, [action({ context: ['quick'] })]).filteredActions).toHaveLength(0);
			// 性質タグなし・環境コンテキストなし → 表示
			expect(query(s, [action({ context: [] })]).filteredActions).toHaveLength(1);
		});

		it('quick 選択時: quick を持つタスクを表示する', () => {
			const s = new FilterSelection(['home'], true, ['quick'], false, 'actionable');
			expect(query(s, [action({ context: ['home', 'quick'] })]).filteredActions).toHaveLength(
				1,
			);
		});

		it('複数の性質を選択した場合はすべてを満たすタスクのみ表示する', () => {
			const s = new FilterSelection(['home'], true, ['quick', 'deep'], false, 'actionable');
			const actions = [
				action({ context: ['home', 'quick', 'deep'] }),
				action({ context: ['home', 'quick'] }),
			];
			const result = query(s, actions).filteredActions;
			expect(result).toHaveLength(1);
			expect(result[0]!.context).toContain('deep');
		});

		it('性質コンテキストなし選択時: 性質タグなしタスクを表示する', () => {
			const s = new FilterSelection(['home'], true, [], true, 'actionable');
			expect(query(s, [action({ context: ['home'] })]).filteredActions).toHaveLength(1);
		});

		it('性質コンテキストなし選択時: 性質タグありタスクは表示しない', () => {
			const s = new FilterSelection(['home'], true, [], true, 'actionable');
			expect(query(s, [action({ context: ['home', 'quick'] })]).filteredActions).toHaveLength(
				0,
			);
		});
	});

	describe('性質タグの候補', () => {
		it('環境・日付フィルタを通過したタスクの性質タグが有効候補になる', () => {
			const s = new FilterSelection(['home'], false, [], false, 'actionable');
			const actions = [
				action({ context: ['home', 'quick'] }),
				action({ context: ['home', 'deep'] }),
				action({ context: ['quick'] }),
			];
			const q = query(s, actions);
			expect(q.enabledPropertyCandidates).toEqual(new Set(['deep', 'quick']));
		});

		it('ブロックされたタスクの性質タグは有効候補に含まれない', () => {
			const s = new FilterSelection(['home'], true, [], false, 'actionable');
			const actions = [
				action({ context: ['home', 'quick'], blocked: true }),
				action({ context: ['home', 'deep'] }),
			];
			expect(query(s, actions).enabledPropertyCandidates).toEqual(new Set(['deep']));
		});

		it('全タスクの性質タグが allPropertyCandidates に含まれる', () => {
			const s = new FilterSelection(['home'], false, [], false, 'actionable');
			const actions = [
				action({ context: ['home', 'quick'] }),
				action({ context: ['home', 'deep'] }),
				action({ context: ['quick'] }),
			];
			expect(query(s, actions).allPropertyCandidates).toEqual(['deep', 'quick']);
		});

		it('重複した性質タグは1つにまとめられる', () => {
			const s = new FilterSelection([], true, [], false, 'actionable');
			const classifier = new ContextClassifier([]);
			const actions = [action({ context: ['quick'] }), action({ context: ['quick'] })];
			expect(
				new NextActionsQuery(classifier, s, actions, TODAY).allPropertyCandidates,
			).toEqual(['quick']);
		});

		it('性質コンテキストなし候補: 環境・日付フィルタを通過した性質タグなしタスクがある場合 true', () => {
			const s = new FilterSelection(['home'], true, [], false, 'actionable');
			const actions = [action({ context: [] }), action({ context: ['home', 'quick'] })];
			expect(query(s, actions).hasPropertylessCandidate).toBe(true);
		});

		it('性質コンテキストなし候補: すべてのタスクが性質タグを持つ場合 false', () => {
			const s = new FilterSelection(['home'], true, [], false, 'actionable');
			const actions = [action({ context: ['home', 'quick'] })];
			expect(query(s, actions).hasPropertylessCandidate).toBe(false);
		});
	});

	describe('選択状態の正規化', () => {
		it('存在しない環境コンテキストは選択から除去される', () => {
			const classifier = new ContextClassifier(['home']);
			const s = new FilterSelection(['home', 'office'], true, [], false, 'actionable');
			const q = new NextActionsQuery(classifier, s, [], TODAY);
			expect(q.normalizedSelection.selectedEnvironments).toEqual(['home']);
		});

		it('存在しなくなった性質タグは選択から除去される', () => {
			const s = new FilterSelection([], true, ['quick', 'deep'], false, 'actionable');
			const actions = [action({ context: ['deep'] })];
			const classifier = new ContextClassifier([]);
			const q = new NextActionsQuery(classifier, s, actions, TODAY);
			expect(q.normalizedSelection.selectedProperties).toEqual(['deep']);
		});
	});

	describe('並び順', () => {
		it('期限日とスケジュール日は区別せず日付が近い順に並ぶ', () => {
			const s = new FilterSelection([], true, [], false, 'actionable');
			const classifier = new ContextClassifier([]);
			const actions = [
				action({ text: '日付なし' }),
				action({ text: 'scheduled あり', scheduled: '2026-04-01' }),
				action({ text: 'due あり', due: '2026-04-10' }),
			];
			const result = new NextActionsQuery(classifier, s, actions, TODAY).filteredActions.map(
				(a) => a.text,
			);
			expect(result).toEqual(['scheduled あり', 'due あり', '日付なし']);
		});

		it('同じ区分では日付が近い順に並ぶ', () => {
			const s = new FilterSelection([], true, [], false, 'actionable');
			const classifier = new ContextClassifier([]);
			const actions = [
				action({ text: 'due2', due: '2026-04-10' }),
				action({ text: 'due1', due: '2026-04-05' }),
			];
			const result = new NextActionsQuery(classifier, s, actions, TODAY).filteredActions.map(
				(a) => a.text,
			);
			expect(result).toEqual(['due1', 'due2']);
		});

		it('期限切れのタスクは期限ありの先頭に並ぶ', () => {
			const s = new FilterSelection([], true, [], false, 'actionable');
			const classifier = new ContextClassifier([]);
			const actions = [
				action({ text: '未来の due', due: '2026-12-31' }),
				action({ text: '過去の due (overdue)', due: '2026-01-01' }),
			];
			const result = new NextActionsQuery(classifier, s, actions, TODAY).filteredActions;
			expect(result[0]!.text).toBe('過去の due (overdue)');
		});
	});

	describe('受け入れ条件', () => {
		it('#home #quick と #home のタスクがあるとき、環境=home・性質=quick で前者のみ表示', () => {
			const s = new FilterSelection(['home'], false, ['quick'], false, 'actionable');
			const actions = [
				action({ text: '#home #quick タスク', context: ['home', 'quick'] }),
				action({ text: '#home のみタスク', context: ['home'] }),
			];
			const result = query(s, actions).filteredActions.map((a) => a.text);
			expect(result).toEqual(['#home #quick タスク']);
		});

		it('#quick のみのタスクは環境コンテキストなしとして扱われる', () => {
			const classifier = new ContextClassifier(['home']);
			const a = action({ context: ['quick'] });
			expect(classifier.isNoEnvironmentContext(a)).toBe(true);
		});

		it('性質を2つ選択した場合、両方を持つタスクのみ表示', () => {
			const s = new FilterSelection([], true, ['quick', 'deep'], false, 'actionable');
			const classifier = new ContextClassifier([]);
			const actions = [
				action({ context: ['quick', 'deep'] }),
				action({ context: ['quick'] }),
			];
			const result = new NextActionsQuery(classifier, s, actions, TODAY).filteredActions;
			expect(result).toHaveLength(1);
		});

		it('実行可能のみ では future scheduled タスクは表示しない', () => {
			const s = FilterSelection.initial();
			const classifier = new ContextClassifier([]);
			const result = new NextActionsQuery(
				classifier,
				s,
				[action({ scheduled: '2026-12-31' })],
				TODAY,
			).filteredActions;
			expect(result).toHaveLength(0);
		});
	});
});
