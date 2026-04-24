import { describe, expect, it, vi, type Mock } from 'vitest';
import { TFile, WorkspaceLeaf } from 'obsidian';
import { NextAction } from '../NextActionCollection';
import { NextActionsView } from './NextActionsView';

function markdownFile(path: string, name: string) {
	const file = new TFile();
	file.path = path;
	file.name = name;
	file.basename = name.replace(/\.md$/, '');
	file.extension = 'md';
	return file;
}

function action(
	file: TFile,
	overrides: {
		text: string;
		scheduled?: string | null;
		due?: string | null;
		context?: readonly string[];
	} = { text: 'タスク' },
) {
	return new NextAction(
		file,
		overrides.text,
		false,
		overrides.scheduled ?? null,
		overrides.due ?? null,
		overrides.context ?? [],
	);
}

function groupTitleSnapshot(section: HTMLElement) {
	const titleIndex = (section.createDiv as Mock).mock.calls.findIndex(
		(call: readonly unknown[]) =>
			(call[0] as { readonly cls?: string } | undefined)?.cls ===
			'gtd-next-action-group-title',
	);
	const title = (section.createDiv as Mock).mock.results[titleIndex]?.value as
		| HTMLElement
		| undefined;
	return (
		(title?.createSpan as Mock | undefined)?.mock.calls.map(
			(call: readonly unknown[]) =>
				call[0] as { readonly cls?: string; readonly text?: string } | undefined,
		) ?? []
	);
}

describe('NextActionsView', () => {
	it('表示中の各グループ見出しに件数バッジを表示し総数フッターを出さない', () => {
		const firstFile = markdownFile('projects/alpha.md', 'alpha.md');
		const secondFile = markdownFile('projects/beta.md', 'beta.md');
		const plugin = {
			settings: {
				environmentContexts: ['home'],
				contextOrder: ['home'],
				pinnedActionPins: [],
			},
			isActionPinned: vi.fn((nextAction: NextAction<TFile>) =>
				['ピン留め', '重複'].includes(nextAction.text),
			),
			replacePinnedActionPins: vi.fn(() => Promise.resolve()),
			toggleActionPin: vi.fn(() => Promise.resolve()),
		};
		const view = new NextActionsView(
			new WorkspaceLeaf(),
			plugin as unknown as ConstructorParameters<typeof NextActionsView>[1],
		);

		(
			view as unknown as {
				noteCache: Record<string, { readonly nextActions: readonly NextAction<TFile>[] }>;
			}
		).noteCache = {
			[firstFile.path]: {
				nextActions: [
					action(firstFile, { text: 'ピン留め', context: ['quick'] }),
					action(firstFile, { text: '期限つき', due: '2026-04-03' }),
					action(firstFile, { text: '重複', due: '2026-04-03', context: ['home'] }),
				],
			},
			[secondFile.path]: {
				nextActions: [action(secondFile, { text: 'デフォルト' })],
			},
		};

		(view as unknown as { render: () => void }).render();

		const rootCalls = (view.contentEl.createDiv as Mock).mock.calls.map(
			(call: readonly unknown[]) => call[0] as { readonly cls?: string } | undefined,
		);
		expect(rootCalls).not.toContainEqual(
			expect.objectContaining({ cls: 'gtd-next-action-count' }),
		);

		const containerIndex = rootCalls.findIndex(
			(options) => options?.cls === 'nav-files-container',
		);
		const container = (view.contentEl.createDiv as Mock).mock.results[containerIndex]
			?.value as HTMLElement;
		const sections = (container.createDiv as Mock).mock.results
			.map((result) => result.value as HTMLElement | undefined)
			.filter((section): section is HTMLElement => section != null);

		expect(sections.map((section) => groupTitleSnapshot(section))).toEqual([
			[
				{ cls: 'gtd-next-action-group-label', text: 'Pinned' },
				{ cls: 'gtd-next-action-group-count', text: '2' },
			],
			[
				{ cls: 'gtd-next-action-group-label', text: 'Dated' },
				{ cls: 'gtd-next-action-group-count', text: '2' },
			],
			[
				{ cls: 'gtd-next-action-group-label', text: 'Default' },
				{ cls: 'gtd-next-action-group-count', text: '2' },
			],
			[
				{ cls: 'gtd-next-action-group-label', text: '#home' },
				{ cls: 'gtd-next-action-group-count', text: '1' },
			],
			[
				{ cls: 'gtd-next-action-group-label', text: '#quick' },
				{ cls: 'gtd-next-action-group-count', text: '1' },
			],
		]);
	});
});
