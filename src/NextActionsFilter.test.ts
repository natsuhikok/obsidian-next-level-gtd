import { describe, expect, it } from 'vitest';
import { NextActionsFilter } from './NextActionsFilter';
import type { NextAction } from './NextActionCollection';

const TODAY = '2026-04-01';

function action(
	overrides: Partial<Omit<NextAction<string>, 'source'>> & { source?: string } = {},
): NextAction<string> {
	return {
		source: 'test',
		text: 'タスク',
		blocked: false,
		scheduled: null,
		due: null,
		available: true,
		context: [],
		...overrides,
	};
}

describe('NextActionsFilter', () => {
	describe('初期状態', () => {
		it('環境コンテキストなしのみが選択された状態で初期化される', () => {
			const f = NextActionsFilter.initial(['home', 'office']);
			expect(f.noContextSelected).toBe(true);
			expect(f.selectedEnvironments).toEqual([]);
			expect(f.isAllEnvironmentsSelected).toBe(false);
		});

		it('性質コンテキストなしのみが選択された状態で初期化される', () => {
			const f = NextActionsFilter.initial(['home']);
			expect(f.noPropertySelected).toBe(true);
			expect(f.selectedProperties).toEqual([]);
		});

		it('日付モードは actionable', () => {
			const f = NextActionsFilter.initial(['home']);
			expect(f.dateMode).toBe('actionable');
		});

		it('環境コンテキスト名の大文字小文字を区別しない', () => {
			const f = NextActionsFilter.initial(['Home', 'OFFICE']);
			expect(f.environmentContexts).toEqual(['home', 'office']);
		});
	});

	describe('すべての環境の選択判定', () => {
		it('全環境と環境コンテキストなしが選択されていればすべての環境が選択された状態', () => {
			const f = new NextActionsFilter(['home'], ['home'], true, [], false, 'actionable');
			expect(f.isAllEnvironmentsSelected).toBe(true);
		});

		it('全環境が選択されていても環境コンテキストなしが未選択ならすべての環境が選択された状態ではない', () => {
			const f = new NextActionsFilter(['home'], ['home'], false, [], false, 'actionable');
			expect(f.isAllEnvironmentsSelected).toBe(false);
		});

		it('一部の環境が未選択なら false', () => {
			const f = new NextActionsFilter(
				['home', 'office'],
				['home'],
				true,
				[],
				false,
				'actionable',
			);
			expect(f.isAllEnvironmentsSelected).toBe(false);
		});

		it('環境設定が空でも環境コンテキストなしが選択されていればすべての環境が選択された状態', () => {
			const f = new NextActionsFilter([], [], true, [], false, 'actionable');
			expect(f.isAllEnvironmentsSelected).toBe(true);
		});

		it('環境設定が空でも環境コンテキストなしが未選択ならすべての環境が選択された状態ではない', () => {
			const f = new NextActionsFilter([], [], false, [], false, 'actionable');
			expect(f.isAllEnvironmentsSelected).toBe(false);
		});
	});

	describe('コンテキストタグの分類', () => {
		it('設定済み環境に一致するタグは環境タグとして分類される', () => {
			const f = NextActionsFilter.initial(['home']);
			const a = action({ context: ['home', 'quick'] });
			expect(f.environmentTagsOf(a)).toEqual(['home']);
		});

		it('環境設定にないタグは性質タグとして分類される', () => {
			const f = NextActionsFilter.initial(['home']);
			const a = action({ context: ['home', 'quick'] });
			expect(f.propertyTagsOf(a)).toEqual(['quick']);
		});

		it('タグ比較は case-insensitive', () => {
			const f = NextActionsFilter.initial(['home']);
			const a = action({ context: ['Home', 'QUICK'] });
			expect(f.environmentTagsOf(a)).toEqual(['Home']);
			expect(f.propertyTagsOf(a)).toEqual(['QUICK']);
		});
	});

	describe('環境コンテキストなし判定', () => {
		it('環境タグが1つもない場合は no context', () => {
			const f = NextActionsFilter.initial(['home']);
			expect(f.isNoContext(action({ context: ['quick'] }))).toBe(true);
		});

		it('環境タグがある場合は no context ではない', () => {
			const f = NextActionsFilter.initial(['home']);
			expect(f.isNoContext(action({ context: ['home'] }))).toBe(false);
		});
	});

	describe('日付フィルタ', () => {
		it('ブロックされたタスクは表示しない', () => {
			const f = NextActionsFilter.initial([]);
			expect(f.passesDateFilter(action({ blocked: true }), TODAY)).toBe(false);
		});

		describe('actionable モード', () => {
			it('日付なしのタスクは表示する', () => {
				const f = NextActionsFilter.initial([]);
				expect(f.passesDateFilter(action(), TODAY)).toBe(true);
			});

			it('スケジュール日が今日以前のタスクは表示する', () => {
				const f = NextActionsFilter.initial([]);
				expect(f.passesDateFilter(action({ scheduled: '2026-04-01' }), TODAY)).toBe(true);
			});

			it('スケジュール日が未来のタスクは表示しない', () => {
				const f = NextActionsFilter.initial([]);
				expect(f.passesDateFilter(action({ scheduled: '2026-04-02' }), TODAY)).toBe(false);
			});

			it('期限のみのタスクは表示する', () => {
				const f = NextActionsFilter.initial([]);
				expect(f.passesDateFilter(action({ due: '2026-05-01' }), TODAY)).toBe(true);
			});
		});

		describe('withDate モード', () => {
			it('スケジュール日が未来のタスクも表示する', () => {
				const f = new NextActionsFilter([], [], true, [], false, 'withDate');
				expect(f.passesDateFilter(action({ scheduled: '2026-12-31' }), TODAY)).toBe(true);
			});

			it('期限ありのタスクは表示する', () => {
				const f = new NextActionsFilter([], [], true, [], false, 'withDate');
				expect(f.passesDateFilter(action({ due: '2026-05-01' }), TODAY)).toBe(true);
			});

			it('日付なしのタスクは表示しない', () => {
				const f = new NextActionsFilter([], [], true, [], false, 'withDate');
				expect(f.passesDateFilter(action(), TODAY)).toBe(false);
			});
		});
	});

	describe('環境フィルタ', () => {
		it('初期状態では環境コンテキストなしのタスクのみ表示する', () => {
			const f = NextActionsFilter.initial(['home']);
			expect(f.passesEnvironmentFilter(action({ context: ['home'] }))).toBe(false);
			expect(f.passesEnvironmentFilter(action({ context: ['quick'] }))).toBe(true);
			expect(f.passesEnvironmentFilter(action({ context: [] }))).toBe(true);
		});

		it('全環境が選択されていても環境コンテキストなしが未選択なら環境タグなしタスクは表示しない', () => {
			const f = new NextActionsFilter(['home'], ['home'], false, [], false, 'actionable');
			expect(f.passesEnvironmentFilter(action({ context: ['home'] }))).toBe(true);
			expect(f.passesEnvironmentFilter(action({ context: [] }))).toBe(false);
			expect(f.passesEnvironmentFilter(action({ context: ['quick'] }))).toBe(false);
		});

		it('home のみ選択時: home タグを持つタスクを表示する', () => {
			const f = new NextActionsFilter(['home'], ['home'], false, [], false, 'actionable');
			expect(f.passesEnvironmentFilter(action({ context: ['home'] }))).toBe(true);
		});

		it('home のみ選択時: 環境コンテキストなしタスクは表示しない', () => {
			const f = new NextActionsFilter(['home'], ['home'], false, [], false, 'actionable');
			expect(f.passesEnvironmentFilter(action({ context: [] }))).toBe(false);
		});

		it('環境コンテキストなしのみ選択時: 環境タグなしタスクを表示する', () => {
			const f = new NextActionsFilter(['home'], [], true, [], false, 'actionable');
			expect(f.passesEnvironmentFilter(action({ context: ['quick'] }))).toBe(true);
		});

		it('環境コンテキストなしのみ選択時: 環境タグありタスクは表示しない', () => {
			const f = new NextActionsFilter(['home'], [], true, [], false, 'actionable');
			expect(f.passesEnvironmentFilter(action({ context: ['home'] }))).toBe(false);
		});

		it('home と環境コンテキストなし両方選択: 両方表示する', () => {
			const f = new NextActionsFilter(['home'], ['home'], true, [], false, 'actionable');
			expect(f.passesEnvironmentFilter(action({ context: ['home'] }))).toBe(true);
			expect(f.passesEnvironmentFilter(action({ context: [] }))).toBe(true);
		});
	});

	describe('性質フィルタ', () => {
		it('初期状態では性質タグなしのタスクのみ表示する', () => {
			const f = NextActionsFilter.initial(['home']);
			expect(f.passesPropertyFilter(action({ context: ['home'] }))).toBe(true);
			expect(f.passesPropertyFilter(action({ context: ['home', 'quick'] }))).toBe(false);
		});

		it('quick 選択時: quick を持つタスクを表示する', () => {
			const f = new NextActionsFilter(
				['home'],
				['home'],
				true,
				['quick'],
				false,
				'actionable',
			);
			expect(f.passesPropertyFilter(action({ context: ['home', 'quick'] }))).toBe(true);
		});

		it('quick 選択時: quick を持たないタスクは表示しない', () => {
			const f = new NextActionsFilter(
				['home'],
				['home'],
				true,
				['quick'],
				false,
				'actionable',
			);
			expect(f.passesPropertyFilter(action({ context: ['home'] }))).toBe(false);
		});

		it('複数の性質を選択した場合はすべてを満たすタスクのみ表示する', () => {
			const f = new NextActionsFilter(
				['home'],
				['home'],
				true,
				['quick', 'deep'],
				false,
				'actionable',
			);
			expect(f.passesPropertyFilter(action({ context: ['home', 'quick', 'deep'] }))).toBe(
				true,
			);
			expect(f.passesPropertyFilter(action({ context: ['home', 'quick'] }))).toBe(false);
		});

		it('タグ比較は case-insensitive', () => {
			const f = new NextActionsFilter(['home'], [], true, ['quick'], false, 'actionable');
			expect(f.passesPropertyFilter(action({ context: ['Quick'] }))).toBe(true);
		});

		it('性質コンテキストなし選択時: 性質タグなしタスクを表示する', () => {
			const f = new NextActionsFilter(['home'], ['home'], true, [], true, 'actionable');
			expect(f.passesPropertyFilter(action({ context: ['home'] }))).toBe(true);
		});

		it('性質コンテキストなし選択時: 性質タグありタスクは表示しない', () => {
			const f = new NextActionsFilter(['home'], ['home'], true, [], true, 'actionable');
			expect(f.passesPropertyFilter(action({ context: ['home', 'quick'] }))).toBe(false);
		});

		it('quick と性質コンテキストなし両方選択: 両方表示する', () => {
			const f = new NextActionsFilter(
				['home'],
				['home'],
				true,
				['quick'],
				true,
				'actionable',
			);
			expect(f.passesPropertyFilter(action({ context: ['home', 'quick'] }))).toBe(true);
			expect(f.passesPropertyFilter(action({ context: ['home'] }))).toBe(true);
		});

		it('quick と性質コンテキストなし両方選択: 別の性質タグのみのタスクは表示しない', () => {
			const f = new NextActionsFilter(
				['home'],
				['home'],
				true,
				['quick'],
				true,
				'actionable',
			);
			expect(f.passesPropertyFilter(action({ context: ['home', 'deep'] }))).toBe(false);
		});
	});

	describe('性質タグの候補', () => {
		it('環境・日付フィルタを通過したタスクの性質タグが候補になる', () => {
			const f = new NextActionsFilter(['home'], ['home'], false, [], false, 'actionable');
			const actions = [
				action({ context: ['home', 'quick'] }),
				action({ context: ['home', 'deep'] }),
				action({ context: ['quick'] }),
			];
			expect(f.propertyCandidates(actions, TODAY)).toEqual(['deep', 'quick']);
		});

		it('選択中の性質で候補が絞り込まれない', () => {
			const f = new NextActionsFilter(
				['home'],
				['home'],
				false,
				['quick'],
				false,
				'actionable',
			);
			const actions = [
				action({ context: ['home', 'quick'] }),
				action({ context: ['home', 'deep'] }),
			];
			expect(f.propertyCandidates(actions, TODAY)).toEqual(['deep', 'quick']);
		});

		it('ブロックされたタスクの性質タグは候補に含まれない', () => {
			const f = new NextActionsFilter(['home'], ['home'], true, [], false, 'actionable');
			const actions = [
				action({ context: ['home', 'quick'], blocked: true }),
				action({ context: ['home', 'deep'] }),
			];
			expect(f.propertyCandidates(actions, TODAY)).toEqual(['deep']);
		});

		it('重複した性質タグは1つにまとめられる', () => {
			const f = new NextActionsFilter([], [], true, [], false, 'actionable');
			const actions = [action({ context: ['quick'] }), action({ context: ['quick'] })];
			expect(f.propertyCandidates(actions, TODAY)).toEqual(['quick']);
		});
	});

	describe('性質の選択状態の正規化', () => {
		it('存在しなくなった性質タグは選択状態から取り除かれる', () => {
			const f = new NextActionsFilter(
				['home'],
				['home'],
				true,
				['quick', 'deep'],
				true,
				'actionable',
			);
			const updated = f.withSelectedPropertiesPruned(['deep']);
			expect(updated.selectedProperties).toEqual(['deep']);
		});

		it('候補に残っている性質タグは選択状態を維持する', () => {
			const f = new NextActionsFilter(
				['home'],
				['home'],
				true,
				['quick'],
				false,
				'actionable',
			);
			const updated = f.withSelectedPropertiesPruned(['quick', 'deep']);
			expect(updated.selectedProperties).toEqual(['quick']);
			expect(updated.noPropertySelected).toBe(false);
		});
	});

	describe('並び順', () => {
		it('期限あり → スケジュールあり → 日付なし の順に並ぶ', () => {
			const actions = [
				action({ text: '日付なし' }),
				action({ text: 'scheduled あり', scheduled: '2026-04-05' }),
				action({ text: 'due あり', due: '2026-04-10' }),
			];
			const f = NextActionsFilter.initial([]);
			const sorted = f.sort(actions).map((a) => a.text);
			expect(sorted).toEqual(['due あり', 'scheduled あり', '日付なし']);
		});

		it('同じ区分では日付が近い順に並ぶ', () => {
			const actions = [
				action({ text: 'due2', due: '2026-04-10' }),
				action({ text: 'due1', due: '2026-04-05' }),
			];
			const f = NextActionsFilter.initial([]);
			const sorted = f.sort(actions).map((a) => a.text);
			expect(sorted).toEqual(['due1', 'due2']);
		});

		it('期限切れのタスクは期限ありの先頭に並ぶ', () => {
			const actions = [
				action({ text: '未来の due', due: '2026-12-31' }),
				action({ text: '過去の due (overdue)', due: '2026-01-01' }),
			];
			const f = NextActionsFilter.initial([]);
			const sorted = f.sort(actions).map((a) => a.text);
			expect(sorted[0]).toBe('過去の due (overdue)');
		});
	});

	describe('環境の選択切り替え', () => {
		it('未選択環境を選択状態にする', () => {
			const f = new NextActionsFilter(
				['home', 'office'],
				['home'],
				true,
				[],
				false,
				'actionable',
			);
			const updated = f.withEnvironmentToggled('office');
			expect(updated.selectedEnvironments).toContain('office');
		});

		it('選択済み環境を解除する', () => {
			const f = new NextActionsFilter(['home'], ['home'], true, [], false, 'actionable');
			const updated = f.withEnvironmentToggled('home');
			expect(updated.selectedEnvironments).not.toContain('home');
		});

		it('環境コンテキストなしの選択状態は変わらない', () => {
			const f = new NextActionsFilter(['home'], ['home'], true, [], false, 'actionable');
			expect(f.withEnvironmentToggled('home').noContextSelected).toBe(true);
		});
	});

	describe('すべての環境の選択切り替え', () => {
		it('全環境未選択時: すべての環境と環境コンテキストなしを選択する', () => {
			const f = new NextActionsFilter(['home', 'office'], [], false, [], false, 'actionable');
			const updated = f.withAllEnvironmentsToggled();
			expect(updated.isAllEnvironmentsSelected).toBe(true);
			expect(updated.noContextSelected).toBe(true);
		});

		it('全環境選択時: すべての環境と環境コンテキストなしを解除する', () => {
			const f = new NextActionsFilter(
				['home', 'office'],
				['home', 'office'],
				true,
				[],
				false,
				'actionable',
			);
			const updated = f.withAllEnvironmentsToggled();
			expect(updated.selectedEnvironments).toEqual([]);
			expect(updated.noContextSelected).toBe(false);
		});

		it('一部選択時: すべての環境と環境コンテキストなしを選択する', () => {
			const f = new NextActionsFilter(
				['home', 'office'],
				['home'],
				false,
				[],
				false,
				'actionable',
			);
			const updated = f.withAllEnvironmentsToggled();
			expect(updated.isAllEnvironmentsSelected).toBe(true);
			expect(updated.noContextSelected).toBe(true);
		});
	});

	describe('環境コンテキストなしの選択切り替え', () => {
		it('未選択から選択に切り替わる', () => {
			const f = new NextActionsFilter(['home'], ['home'], false, [], false, 'actionable');
			expect(f.withNoContextToggled().noContextSelected).toBe(true);
		});

		it('選択から未選択に切り替わる', () => {
			const f = new NextActionsFilter(['home'], ['home'], true, [], false, 'actionable');
			expect(f.withNoContextToggled().noContextSelected).toBe(false);
		});

		it('環境の選択状態は変わらない', () => {
			const f = new NextActionsFilter(['home'], ['home'], false, [], false, 'actionable');
			expect(f.withNoContextToggled().selectedEnvironments).toEqual(['home']);
		});
	});

	describe('性質の選択切り替え', () => {
		it('未選択性質を選択状態にする', () => {
			const f = NextActionsFilter.initial(['home']);
			const updated = f.withPropertyToggled('quick');
			expect(updated.selectedProperties).toContain('quick');
		});

		it('選択済み性質を解除する', () => {
			const f = new NextActionsFilter(
				['home'],
				['home'],
				true,
				['quick'],
				false,
				'actionable',
			);
			const updated = f.withPropertyToggled('quick');
			expect(updated.selectedProperties).not.toContain('quick');
		});
	});

	describe('性質コンテキストなしの選択切り替え', () => {
		it('未選択から選択に切り替わる', () => {
			const f = new NextActionsFilter(['home'], ['home'], true, [], false, 'actionable');
			expect(f.withNoPropertyToggled().noPropertySelected).toBe(true);
		});

		it('選択から未選択に切り替わる', () => {
			const f = new NextActionsFilter(['home'], ['home'], true, [], true, 'actionable');
			expect(f.withNoPropertyToggled().noPropertySelected).toBe(false);
		});

		it('性質の選択状態は変わらない', () => {
			const f = new NextActionsFilter(
				['home'],
				['home'],
				true,
				['quick'],
				false,
				'actionable',
			);
			expect(f.withNoPropertyToggled().selectedProperties).toEqual(['quick']);
		});
	});

	describe('日付モードの切り替え', () => {
		it('日付モードを切り替えられる', () => {
			const f = NextActionsFilter.initial([]);
			expect(f.withDateMode('withDate').dateMode).toBe('withDate');
			expect(f.withDateMode('actionable').dateMode).toBe('actionable');
		});
	});

	describe('受け入れ条件', () => {
		it('#home #quick と #home のタスクがあるとき、環境=home・性質=quick で前者のみ表示', () => {
			const f = new NextActionsFilter(
				['home'],
				['home'],
				false,
				['quick'],
				false,
				'actionable',
			);
			const actions = [
				action({ text: '#home #quick タスク', context: ['home', 'quick'] }),
				action({ text: '#home のみタスク', context: ['home'] }),
			];
			const result = f.filter(actions, TODAY).map((a) => a.text);
			expect(result).toEqual(['#home #quick タスク']);
		});

		it('#quick のみのタスクは環境コンテキストなしとして扱われる', () => {
			const f = NextActionsFilter.initial(['home']);
			const a = action({ context: ['quick'] });
			expect(f.isNoContext(a)).toBe(true);
		});

		it('home のみ選択時に環境コンテキストなしタスクは表示しない', () => {
			const f = new NextActionsFilter(['home'], ['home'], false, [], false, 'actionable');
			const a = action({ context: ['quick'] });
			expect(f.passesEnvironmentFilter(a)).toBe(false);
		});

		it('すべての環境選択時でも環境コンテキストなしが未選択なら環境タグなしタスクは表示しない', () => {
			const f = new NextActionsFilter(['home'], ['home'], false, [], false, 'actionable');
			expect(f.passesEnvironmentFilter(action({ context: ['home'] }))).toBe(true);
			expect(f.passesEnvironmentFilter(action({ context: [] }))).toBe(false);
			expect(f.passesEnvironmentFilter(action({ context: ['quick'] }))).toBe(false);
		});

		it('性質を2つ選択した場合、両方を持つタスクのみ表示', () => {
			const f = new NextActionsFilter([], [], true, ['quick', 'deep'], false, 'actionable');
			expect(f.passesPropertyFilter(action({ context: ['quick', 'deep'] }))).toBe(true);
			expect(f.passesPropertyFilter(action({ context: ['quick'] }))).toBe(false);
		});

		it('日付ありのみ では scheduled または due を持つタスクのみ表示', () => {
			const f = new NextActionsFilter([], [], true, [], false, 'withDate');
			expect(f.passesDateFilter(action({ scheduled: '2026-05-01' }), TODAY)).toBe(true);
			expect(f.passesDateFilter(action({ due: '2026-05-01' }), TODAY)).toBe(true);
			expect(f.passesDateFilter(action(), TODAY)).toBe(false);
		});

		it('実行可能のみ では future scheduled タスクは表示しない', () => {
			const f = NextActionsFilter.initial([]);
			expect(f.passesDateFilter(action({ scheduled: '2026-12-31' }), TODAY)).toBe(false);
		});

		it('すべての環境 → 環境コンテキストなしクリック: 環境コンテキストなしが解除されすべての環境が選択された状態ではなくなる', () => {
			const f = new NextActionsFilter(['home'], ['home'], true, [], false, 'actionable');
			const toggled = f.withNoContextToggled();
			expect(toggled.noContextSelected).toBe(false);
			expect(toggled.isAllEnvironmentsSelected).toBe(false);
		});

		it('すべての環境 → #home クリック: home が解除されすべての環境が選択された状態ではなくなる', () => {
			const f = new NextActionsFilter(
				['home', 'office'],
				['home', 'office'],
				true,
				[],
				false,
				'actionable',
			);
			const toggled = f.withEnvironmentToggled('home');
			expect(toggled.selectedEnvironments).toEqual(['office']);
			expect(toggled.isAllEnvironmentsSelected).toBe(false);
		});
	});
});
