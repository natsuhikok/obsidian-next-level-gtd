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
	describe('initial()', () => {
		it('すべての環境が選択された状態で初期化される', () => {
			const f = NextActionsFilter.initial(['home', 'office']);
			expect(f.isAllEnvironmentsSelected).toBe(true);
		});

		it('性質フィルタは未選択', () => {
			const f = NextActionsFilter.initial(['home']);
			expect(f.selectedProperties).toEqual([]);
		});

		it('日付モードは actionable', () => {
			const f = NextActionsFilter.initial(['home']);
			expect(f.dateMode).toBe('actionable');
		});

		it('environmentContexts は lowercase に正規化される', () => {
			const f = NextActionsFilter.initial(['Home', 'OFFICE']);
			expect(f.environmentContexts).toEqual(['home', 'office']);
		});
	});

	describe('isAllEnvironmentsSelected', () => {
		it('anywhere と全環境が選択されていれば true', () => {
			const f = new NextActionsFilter(['home'], ['anywhere', 'home'], [], 'actionable');
			expect(f.isAllEnvironmentsSelected).toBe(true);
		});

		it('一部の環境が未選択なら false', () => {
			const f = new NextActionsFilter(
				['home', 'office'],
				['anywhere', 'home'],
				[],
				'actionable',
			);
			expect(f.isAllEnvironmentsSelected).toBe(false);
		});

		it('environmentContexts が空のとき anywhere だけ選択されていれば true', () => {
			const f = new NextActionsFilter([], ['anywhere'], [], 'actionable');
			expect(f.isAllEnvironmentsSelected).toBe(true);
		});
	});

	describe('environmentTagsOf / propertyTagsOf', () => {
		it('設定済み環境タグは environmentTagsOf に含まれる', () => {
			const f = NextActionsFilter.initial(['home']);
			const a = action({ context: ['home', 'quick'] });
			expect(f.environmentTagsOf(a)).toEqual(['home']);
		});

		it('環境設定にないタグは propertyTagsOf に含まれる', () => {
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

	describe('isAnywhere', () => {
		it('環境タグが1つもない場合は anywhere', () => {
			const f = NextActionsFilter.initial(['home']);
			expect(f.isAnywhere(action({ context: ['quick'] }))).toBe(true);
		});

		it('環境タグがある場合は anywhere ではない', () => {
			const f = NextActionsFilter.initial(['home']);
			expect(f.isAnywhere(action({ context: ['home'] }))).toBe(false);
		});
	});

	describe('passesDateFilter', () => {
		it('blocked なタスクは常に false', () => {
			const f = NextActionsFilter.initial([]);
			expect(f.passesDateFilter(action({ blocked: true }), TODAY)).toBe(false);
		});

		describe('actionable モード', () => {
			it('日付なしは通る', () => {
				const f = NextActionsFilter.initial([]);
				expect(f.passesDateFilter(action(), TODAY)).toBe(true);
			});

			it('scheduled が今日以前なら通る', () => {
				const f = NextActionsFilter.initial([]);
				expect(f.passesDateFilter(action({ scheduled: '2026-04-01' }), TODAY)).toBe(true);
			});

			it('scheduled が未来なら通らない', () => {
				const f = NextActionsFilter.initial([]);
				expect(f.passesDateFilter(action({ scheduled: '2026-04-02' }), TODAY)).toBe(false);
			});

			it('due のみありは通る', () => {
				const f = NextActionsFilter.initial([]);
				expect(f.passesDateFilter(action({ due: '2026-05-01' }), TODAY)).toBe(true);
			});
		});

		describe('withDate モード', () => {
			it('scheduled あり（未来）は通る', () => {
				const f = new NextActionsFilter([], ['anywhere'], [], 'withDate');
				expect(f.passesDateFilter(action({ scheduled: '2026-12-31' }), TODAY)).toBe(true);
			});

			it('due あり は通る', () => {
				const f = new NextActionsFilter([], ['anywhere'], [], 'withDate');
				expect(f.passesDateFilter(action({ due: '2026-05-01' }), TODAY)).toBe(true);
			});

			it('日付なしは通らない', () => {
				const f = new NextActionsFilter([], ['anywhere'], [], 'withDate');
				expect(f.passesDateFilter(action(), TODAY)).toBe(false);
			});
		});
	});

	describe('passesEnvironmentFilter', () => {
		it('すべての環境選択時は全タスクが通る', () => {
			const f = NextActionsFilter.initial(['home']);
			expect(f.passesEnvironmentFilter(action({ context: ['home'] }))).toBe(true);
			expect(f.passesEnvironmentFilter(action({ context: ['quick'] }))).toBe(true);
			expect(f.passesEnvironmentFilter(action({ context: [] }))).toBe(true);
		});

		it('home のみ選択時: home タグを持つタスクが通る', () => {
			const f = new NextActionsFilter(['home'], ['home'], [], 'actionable');
			expect(f.passesEnvironmentFilter(action({ context: ['home'] }))).toBe(true);
		});

		it('home のみ選択時: anywhere タスクは通らない', () => {
			const f = new NextActionsFilter(['home'], ['home'], [], 'actionable');
			expect(f.passesEnvironmentFilter(action({ context: [] }))).toBe(false);
		});

		it('anywhere のみ選択時: 環境タグなしタスクが通る', () => {
			const f = new NextActionsFilter(['home'], ['anywhere'], [], 'actionable');
			expect(f.passesEnvironmentFilter(action({ context: ['quick'] }))).toBe(true);
		});

		it('anywhere のみ選択時: home タスクは通らない', () => {
			const f = new NextActionsFilter(['home'], ['anywhere'], [], 'actionable');
			expect(f.passesEnvironmentFilter(action({ context: ['home'] }))).toBe(false);
		});

		it('home と anywhere 両方選択: 両方通る', () => {
			const f = new NextActionsFilter(['home'], ['home', 'anywhere'], [], 'actionable');
			expect(f.passesEnvironmentFilter(action({ context: ['home'] }))).toBe(true);
			expect(f.passesEnvironmentFilter(action({ context: [] }))).toBe(true);
		});
	});

	describe('passesPropertyFilter', () => {
		it('性質フィルタ未選択は全て通る', () => {
			const f = NextActionsFilter.initial(['home']);
			expect(f.passesPropertyFilter(action({ context: ['home'] }))).toBe(true);
		});

		it('quick 選択時: quick を持つタスクが通る', () => {
			const f = new NextActionsFilter(
				['home'],
				['anywhere', 'home'],
				['quick'],
				'actionable',
			);
			expect(f.passesPropertyFilter(action({ context: ['home', 'quick'] }))).toBe(true);
		});

		it('quick 選択時: quick を持たないタスクは通らない', () => {
			const f = new NextActionsFilter(
				['home'],
				['anywhere', 'home'],
				['quick'],
				'actionable',
			);
			expect(f.passesPropertyFilter(action({ context: ['home'] }))).toBe(false);
		});

		it('quick と deep 両方選択時: 両方持つタスクのみ通る (AND)', () => {
			const f = new NextActionsFilter(
				['home'],
				['anywhere', 'home'],
				['quick', 'deep'],
				'actionable',
			);
			expect(f.passesPropertyFilter(action({ context: ['home', 'quick', 'deep'] }))).toBe(
				true,
			);
			expect(f.passesPropertyFilter(action({ context: ['home', 'quick'] }))).toBe(false);
		});

		it('タグ比較は case-insensitive', () => {
			const f = new NextActionsFilter(['home'], ['anywhere'], ['quick'], 'actionable');
			expect(f.passesPropertyFilter(action({ context: ['Quick'] }))).toBe(true);
		});
	});

	describe('propertyCandidates', () => {
		it('環境・日付フィルタ後の性質タグ候補を返す', () => {
			const f = new NextActionsFilter(['home'], ['home'], [], 'actionable');
			const actions = [
				action({ context: ['home', 'quick'] }),
				action({ context: ['home', 'deep'] }),
				action({ context: ['quick'] }),
			];
			expect(f.propertyCandidates(actions, TODAY)).toEqual(['deep', 'quick']);
		});

		it('選択済み性質フィルタの影響を受けない（自身は候補生成に使わない）', () => {
			const f = new NextActionsFilter(['home'], ['home'], ['quick'], 'actionable');
			const actions = [
				action({ context: ['home', 'quick'] }),
				action({ context: ['home', 'deep'] }),
			];
			expect(f.propertyCandidates(actions, TODAY)).toEqual(['deep', 'quick']);
		});

		it('blocked なタスクの性質タグは候補に含まれない', () => {
			const f = NextActionsFilter.initial(['home']);
			const actions = [
				action({ context: ['quick'], blocked: true }),
				action({ context: ['deep'] }),
			];
			expect(f.propertyCandidates(actions, TODAY)).toEqual(['deep']);
		});

		it('重複した性質タグは1つにまとめられる', () => {
			const f = NextActionsFilter.initial([]);
			const actions = [action({ context: ['quick'] }), action({ context: ['quick'] })];
			expect(f.propertyCandidates(actions, TODAY)).toEqual(['quick']);
		});
	});

	describe('sort', () => {
		it('due あり → scheduled あり → 日付なし の順になる', () => {
			const actions = [
				action({ text: '日付なし' }),
				action({ text: 'scheduled あり', scheduled: '2026-04-05' }),
				action({ text: 'due あり', due: '2026-04-10' }),
			];
			const f = NextActionsFilter.initial([]);
			const sorted = f.sort(actions).map((a) => a.text);
			expect(sorted).toEqual(['due あり', 'scheduled あり', '日付なし']);
		});

		it('同一区分内は日付昇順になる', () => {
			const actions = [
				action({ text: 'due2', due: '2026-04-10' }),
				action({ text: 'due1', due: '2026-04-05' }),
			];
			const f = NextActionsFilter.initial([]);
			const sorted = f.sort(actions).map((a) => a.text);
			expect(sorted).toEqual(['due1', 'due2']);
		});

		it('due の overdue は due 群内で先頭になる', () => {
			const actions = [
				action({ text: '未来の due', due: '2026-12-31' }),
				action({ text: '過去の due (overdue)', due: '2026-01-01' }),
			];
			const f = NextActionsFilter.initial([]);
			const sorted = f.sort(actions).map((a) => a.text);
			expect(sorted[0]).toBe('過去の due (overdue)');
		});
	});

	describe('withEnvironmentToggled', () => {
		it('未選択環境を選択状態にする', () => {
			const f = new NextActionsFilter(
				['home', 'office'],
				['anywhere', 'home'],
				[],
				'actionable',
			);
			const updated = f.withEnvironmentToggled('office');
			expect(updated.selectedEnvironments).toContain('office');
		});

		it('選択済み環境を解除する', () => {
			const f = NextActionsFilter.initial(['home']);
			const updated = f.withEnvironmentToggled('home');
			expect(updated.selectedEnvironments).not.toContain('home');
		});
	});

	describe('withAllEnvironmentsSelected', () => {
		it('全環境が選択状態になる', () => {
			const f = new NextActionsFilter(['home', 'office'], ['home'], [], 'actionable');
			const updated = f.withAllEnvironmentsSelected();
			expect(updated.isAllEnvironmentsSelected).toBe(true);
		});
	});

	describe('withPropertyToggled', () => {
		it('未選択性質を選択状態にする', () => {
			const f = NextActionsFilter.initial(['home']);
			const updated = f.withPropertyToggled('quick');
			expect(updated.selectedProperties).toContain('quick');
		});

		it('選択済み性質を解除する', () => {
			const f = new NextActionsFilter(
				['home'],
				['anywhere', 'home'],
				['quick'],
				'actionable',
			);
			const updated = f.withPropertyToggled('quick');
			expect(updated.selectedProperties).not.toContain('quick');
		});
	});

	describe('withDateMode', () => {
		it('日付モードを切り替えられる', () => {
			const f = NextActionsFilter.initial([]);
			expect(f.withDateMode('withDate').dateMode).toBe('withDate');
			expect(f.withDateMode('actionable').dateMode).toBe('actionable');
		});
	});

	describe('受け入れ条件', () => {
		it('#home #quick と #home のタスクがあるとき、環境=home・性質=quick で前者のみ表示', () => {
			const f = new NextActionsFilter(['home'], ['home'], ['quick'], 'actionable');
			const actions = [
				action({ text: '#home #quick タスク', context: ['home', 'quick'] }),
				action({ text: '#home のみタスク', context: ['home'] }),
			];
			const result = f.filter(actions, TODAY).map((a) => a.text);
			expect(result).toEqual(['#home #quick タスク']);
		});

		it('#quick のみのタスクは anywhere として扱われる', () => {
			const f = NextActionsFilter.initial(['home']);
			const a = action({ context: ['quick'] });
			expect(f.isAnywhere(a)).toBe(true);
		});

		it('home のみ選択時に anywhere タスクは表示しない', () => {
			const f = new NextActionsFilter(['home'], ['home'], [], 'actionable');
			const a = action({ context: ['quick'] });
			expect(f.passesEnvironmentFilter(a)).toBe(false);
		});

		it('すべての環境選択時に anywhere を含む全環境タスクを表示', () => {
			const f = NextActionsFilter.initial(['home']);
			expect(f.passesEnvironmentFilter(action({ context: ['home'] }))).toBe(true);
			expect(f.passesEnvironmentFilter(action({ context: [] }))).toBe(true);
			expect(f.passesEnvironmentFilter(action({ context: ['quick'] }))).toBe(true);
		});

		it('性質を2つ選択した場合、両方を持つタスクのみ表示', () => {
			const f = new NextActionsFilter([], ['anywhere'], ['quick', 'deep'], 'actionable');
			expect(f.passesPropertyFilter(action({ context: ['quick', 'deep'] }))).toBe(true);
			expect(f.passesPropertyFilter(action({ context: ['quick'] }))).toBe(false);
		});

		it('日付ありのみ では scheduled または due を持つタスクのみ表示', () => {
			const f = new NextActionsFilter([], ['anywhere'], [], 'withDate');
			expect(f.passesDateFilter(action({ scheduled: '2026-05-01' }), TODAY)).toBe(true);
			expect(f.passesDateFilter(action({ due: '2026-05-01' }), TODAY)).toBe(true);
			expect(f.passesDateFilter(action(), TODAY)).toBe(false);
		});

		it('実行可能のみ では future scheduled タスクは表示しない', () => {
			const f = NextActionsFilter.initial([]);
			expect(f.passesDateFilter(action({ scheduled: '2026-12-31' }), TODAY)).toBe(false);
		});
	});
});
