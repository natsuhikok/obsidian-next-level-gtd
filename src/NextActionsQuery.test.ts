import { describe, expect, it } from 'vitest';
import { ContextClassifier } from './ContextClassifier';
import { ContextOrder } from './ContextOrder';
import { DateVisibility } from './DateVisibility';
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
	actions: readonly NextAction<string>[],
	overrides: {
		visibility?: DateVisibility;
		classifier?: ContextClassifier;
		contextOrder?: ContextOrder;
		pinnedTexts?: readonly string[];
	} = {},
): NextActionsQuery<string> {
	const pinnedTexts = overrides.pinnedTexts ?? [];
	return new NextActionsQuery(
		overrides.classifier ?? new ContextClassifier(['home', 'office']),
		overrides.contextOrder ?? new ContextOrder(['home', 'office']),
		overrides.visibility ?? DateVisibility.initial(),
		actions,
		TODAY,
		(a) => pinnedTexts.includes(a.text),
	);
}

describe('NextActionsQuery', () => {
	describe('日付表示', () => {
		it('近い日付では未来の scheduled を持つタスクを表示しない', () => {
			const result = query([action({ scheduled: '2026-04-02' })]).displayGroups;
			expect(result).toHaveLength(0);
		});

		it('近い日付では期限つきタスクと日付なしタスクを表示する', () => {
			const result = query([
				action({ text: '期限あり', due: '2026-12-31' }),
				action({ text: '日付なし' }),
			]).displayGroups.flatMap((group) => group.actions.map((a) => a.text));
			expect(result).toContain('期限あり');
			expect(result).toContain('日付なし');
		});

		it('すべての日付では未来の scheduled を持つタスクを表示する', () => {
			const result = query([action({ text: '未来', scheduled: '2026-04-02' })], {
				visibility: new DateVisibility('all'),
			}).displayGroups.flatMap((group) => group.actions.map((a) => a.text));
			expect(result).toContain('未来');
		});

		it('総数は近い日付で表示できるタスクだけを数える', () => {
			const result = query([
				action({ text: '今日', scheduled: '2026-04-01' }),
				action({ text: '未来', scheduled: '2026-04-02' }),
				action({ text: '期限', due: '2026-12-31' }),
				action({ text: '日付なし' }),
			]).totalActionCount;

			expect(result).toBe(3);
		});

		it('総数はすべての日付で未来の scheduled を持つタスクも数える', () => {
			const result = query(
				[
					action({ text: '今日', scheduled: '2026-04-01' }),
					action({ text: '未来', scheduled: '2026-04-02' }),
				],
				{ visibility: new DateVisibility('all') },
			).totalActionCount;

			expect(result).toBe(2);
		});
	});

	describe('グループ構成', () => {
		it('ピン留め、日付あり、デフォルト、コンテキストの順に表示する', () => {
			const result = query(
				[
					action({ text: 'ピン留め', context: ['quick'] }),
					action({ text: '日付あり', due: '2026-04-03' }),
					action({ text: 'デフォルト' }),
					action({ text: '環境', context: ['home'] }),
				],
				{ pinnedTexts: ['ピン留め'] },
			).displayGroups.map((group) => group.title);

			expect(result).toEqual(['pinned', 'dated', 'default', '#home', '#quick']);
		});

		it('複数カテゴリに該当するタスクは各グループに表示する', () => {
			const result = query([action({ text: '重複', due: '2026-04-03', context: ['home'] })], {
				pinnedTexts: ['重複'],
			}).displayGroups.map((group) => ({
				title: group.title,
				texts: group.actions.map((a) => a.text),
			}));

			expect(result).toEqual([
				{ title: 'pinned', texts: ['重複'] },
				{ title: 'dated', texts: ['重複'] },
				{ title: '#home', texts: ['重複'] },
			]);
		});

		it('日付ありグループには scheduled または due を持つタスクだけを表示する', () => {
			const result = query([
				action({ text: 'scheduled', scheduled: '2026-04-01' }),
				action({ text: 'due', due: '2026-04-02' }),
				action({ text: '日付なし' }),
			])
				.displayGroups.find((group) => group.title === 'dated')
				?.actions.map((a) => a.text);

			expect(result).toEqual(['scheduled', 'due']);
		});

		it('各グループの件数はそのグループに表示されるアクション数と一致する', () => {
			const result = query(
				[
					action({ text: 'ピン留めのみ' }),
					action({ text: '期限つき', due: '2026-04-03' }),
					action({ text: 'デフォルト' }),
					action({ text: '重複', due: '2026-04-03', context: ['home'] }),
				],
				{ pinnedTexts: ['ピン留めのみ', '重複'] },
			).displayGroups.map((group) => ({
				title: group.title,
				count: group.actions.length,
			}));

			expect(result).toEqual([
				{ title: 'pinned', count: 2 },
				{ title: 'dated', count: 2 },
				{ title: 'default', count: 3 },
				{ title: '#home', count: 1 },
			]);
		});

		it('総数は複数グループに表示される同じタスクを一度だけ数える', () => {
			const result = query([action({ text: '重複', due: '2026-04-03', context: ['home'] })], {
				pinnedTexts: ['重複'],
			}).totalActionCount;

			expect(result).toBe(1);
		});

		it('総数は同じ本文を持つ別々のタスクを別件として数える', () => {
			const result = query([
				action({ source: 'alpha', text: '同じ本文' }),
				action({ source: 'beta', text: '同じ本文' }),
			]).totalActionCount;

			expect(result).toBe(2);
		});
	});

	describe('コンテキストグループ', () => {
		it('環境と性質の分類に関係なく設定された順序で表示する', () => {
			const result = query(
				[
					action({ text: 'home quick', context: ['home', 'quick'] }),
					action({ text: 'office deep', context: ['office', 'deep'] }),
				],
				{ contextOrder: new ContextOrder(['deep', 'office', 'quick']) },
			).displayGroups.map((group) => ({
				title: group.title,
				texts: group.actions.map((a) => a.text),
			}));

			expect(result).toEqual([
				{ title: '#deep', texts: ['office deep'] },
				{ title: '#office', texts: ['office deep'] },
				{ title: '#quick', texts: ['home quick'] },
				{ title: '#home', texts: ['home quick'] },
			]);
		});

		it('意味のあるコンテキストを持たないタスクはデフォルトに表示する', () => {
			const result = query([action({ text: 'デフォルト' })]).displayGroups;
			expect(result).toEqual([
				{ title: 'default', actions: [action({ text: 'デフォルト' })] },
			]);
		});

		it('設定されていないコンテキストは設定済みコンテキストの後に名前順で表示する', () => {
			const result = query(
				[
					action({ text: 'beta', context: ['beta'] }),
					action({ text: 'alpha', context: ['alpha'] }),
					action({ text: 'home', context: ['home'] }),
				],
				{ contextOrder: new ContextOrder(['home']) },
			).displayGroups.map((group) => group.title);

			expect(result).toEqual(['#home', '#alpha', '#beta']);
		});
	});

	describe('グループ内の並び順', () => {
		it('デフォルトグループ内でピン留め、日付あり、デフォルトの順に表示する', () => {
			const result = query(
				[
					action({ text: 'デフォルト' }),
					action({ text: '日付あり', due: '2026-04-03' }),
					action({ text: 'ピン留め' }),
				],
				{
					contextOrder: new ContextOrder(['office']),
					pinnedTexts: ['ピン留め'],
				},
			)
				.displayGroups.find((group) => group.title === 'default')
				?.actions.map((a) => a.text);

			expect(result).toEqual(['ピン留め', '日付あり', 'デフォルト']);
		});

		it('同じコンテキストグループ内でも設定されたコンテキストを優先して表示する', () => {
			const result = query(
				[
					action({ text: 'あと', context: ['shared'] }),
					action({ text: 'さき', context: ['office', 'shared'] }),
				],
				{ contextOrder: new ContextOrder(['office']) },
			)
				.displayGroups.find((group) => group.title === '#shared')
				?.actions.map((a) => a.text);

			expect(result).toEqual(['さき', 'あと']);
		});
	});

	describe('対象外タスク', () => {
		it('ブロックされたタスクはどのグループにも表示しない', () => {
			const result = query([
				action({ text: 'ブロック', blocked: true, due: '2026-04-02', context: ['home'] }),
			]).displayGroups;

			expect(result).toHaveLength(0);
		});

		it('総数はブロックされたタスクを数えない', () => {
			const result = query([
				action({ text: '表示', blocked: false }),
				action({ text: 'ブロック', blocked: true }),
			]).totalActionCount;

			expect(result).toBe(1);
		});
	});
});
