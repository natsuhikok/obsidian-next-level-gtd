import { describe, expect, it } from 'vitest';
import { ContextClassifier } from './ContextClassifier';
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
		pinnedTexts?: readonly string[];
	} = {},
): NextActionsQuery<string> {
	const pinnedTexts = overrides.pinnedTexts ?? [];
	return new NextActionsQuery(
		overrides.classifier ?? new ContextClassifier(['home', 'office']),
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
	});

	describe('グループ構成', () => {
		it('ピン留め、日付あり、コンテキストの順に表示する', () => {
			const result = query(
				[
					action({ text: 'ピン留め', context: ['quick'] }),
					action({ text: '日付あり', due: '2026-04-03' }),
					action({ text: '環境', context: ['home'] }),
				],
				{ pinnedTexts: ['ピン留め'] },
			).displayGroups.map((group) => group.title);

			expect(result).toEqual(['pinned', 'dated', '#home', '#quick', 'default']);
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
	});

	describe('コンテキストグループ', () => {
		it('環境コンテキストと性質コンテキストごとに表示する', () => {
			const result = query([
				action({ text: 'home quick', context: ['home', 'quick'] }),
				action({ text: 'office deep', context: ['office', 'deep'] }),
			]).displayGroups.map((group) => ({
				title: group.title,
				texts: group.actions.map((a) => a.text),
			}));

			expect(result).toEqual([
				{ title: '#home', texts: ['home quick'] },
				{ title: '#office', texts: ['office deep'] },
				{ title: '#deep', texts: ['office deep'] },
				{ title: '#quick', texts: ['home quick'] },
			]);
		});

		it('意味のあるコンテキストを持たないタスクはデフォルトに表示する', () => {
			const result = query([action({ text: 'デフォルト' })]).displayGroups;
			expect(result).toEqual([
				{ title: 'default', actions: [action({ text: 'デフォルト' })] },
			]);
		});
	});

	describe('対象外タスク', () => {
		it('ブロックされたタスクはどのグループにも表示しない', () => {
			const result = query([
				action({ text: 'ブロック', blocked: true, due: '2026-04-02', context: ['home'] }),
			]).displayGroups;

			expect(result).toHaveLength(0);
		});
	});
});
