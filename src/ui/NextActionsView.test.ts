import { describe, expect, it, vi } from 'vitest';
import { TFile, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS } from '../settings';
import { NextAction } from '../NextActionCollection';
import { NextActionsView } from './NextActionsView';

class MockElement {
	readonly children: MockElement[] = [];
	readonly attributes: Record<string, string> = {};
	readonly listeners: Record<string, ((event: Event) => void)[]> = {};
	text = '';

	constructor(
		readonly tagName: string,
		readonly className = '',
	) {}

	empty() {
		this.children.splice(0);
		this.text = '';
	}

	createDiv(options?: { cls?: string; text?: string }) {
		return this.appendChild(new MockElement('div', options?.cls ?? ''), options?.text);
	}

	createEl(tagName: string, options?: { cls?: string; text?: string }) {
		return this.appendChild(new MockElement(tagName, options?.cls ?? ''), options?.text);
	}

	createSpan(options?: { cls?: string; text?: string }) {
		return this.createEl('span', options);
	}

	addEventListener(type: string, listener: (event: Event) => void) {
		this.listeners[type] = [...(this.listeners[type] ?? []), listener];
	}

	setAttribute(name: string, value: string) {
		this.attributes[name] = value;
	}

	findByClass(className: string): readonly MockElement[] {
		const ownClasses = this.className.split(' ').filter((value) => value !== '');
		const matches = ownClasses.includes(className) ? [this] : [];
		return [...matches, ...this.children.flatMap((child) => child.findByClass(className))];
	}

	private appendChild(child: MockElement, text?: string) {
		if (text != null) child.text = text;
		this.children.push(child);
		return child;
	}
}

type PluginForNextActionsView = {
	readonly settings: typeof DEFAULT_SETTINGS;
	readonly isActionPinned: ReturnType<typeof vi.fn>;
	readonly replacePinnedActionPins: ReturnType<typeof vi.fn>;
	readonly toggleActionPin: ReturnType<typeof vi.fn>;
};

function createPlugin(): PluginForNextActionsView {
	return {
		settings: DEFAULT_SETTINGS,
		isActionPinned: vi.fn(() => false),
		replacePinnedActionPins: vi.fn(() => Promise.resolve()),
		toggleActionPin: vi.fn(() => Promise.resolve()),
	};
}

function createFile(path: string) {
	const file = new TFile();
	file.path = path;
	file.name = path.split('/').at(-1) ?? path;
	file.basename = file.name.replace(/\.md$/, '');
	file.extension = 'md';
	return file;
}

function createAction(
	filePath: string,
	text: string,
	overrides: {
		readonly due?: string | null;
		readonly scheduled?: string | null;
		readonly context?: readonly string[];
	} = {},
) {
	return new NextAction(
		createFile(filePath),
		text,
		false,
		overrides.scheduled ?? null,
		overrides.due ?? null,
		overrides.context ?? [],
	);
}

function renderView(actions: readonly NextAction<TFile>[], pinnedTexts: readonly string[] = []) {
	const plugin = createPlugin();
	plugin.isActionPinned.mockImplementation((action: NextAction<TFile>) =>
		pinnedTexts.includes(action.text),
	);
	const view = new NextActionsView(new WorkspaceLeaf(), plugin as never);
	const contentEl = new MockElement('div');
	(view as unknown as { contentEl: MockElement }).contentEl = contentEl;
	(
		view as unknown as {
			noteCache: Record<string, { readonly nextActions: readonly NextAction<TFile>[] }>;
		}
	).noteCache = {
		'note.md': { nextActions: actions },
	};
	const render = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(view), 'render')?.value as
		| ((this: NextActionsView) => void)
		| undefined;

	render?.call(view);

	return contentEl;
}

describe('ネクストアクションビューのグループ見出し', () => {
	it('表示される各グループ名の横に件数バッジを表示する', () => {
		const contentEl = renderView(
			[
				createAction('note.md', '重複', { due: '2026-04-03', context: ['home'] }),
				createAction('note.md', '既定'),
			],
			['重複'],
		);

		expect(
			contentEl.findByClass('gtd-next-action-group-title-text').map((node) => node.text),
		).toEqual(['Pinned', 'Dated', 'Default', '#home']);
		expect(
			contentEl.findByClass('gtd-next-action-group-count-badge').map((node) => node.text),
		).toEqual(['1', '1', '1', '1']);
	});

	it('カテゴリ別バッジを表示するときは従来の集計フッターを表示しない', () => {
		const contentEl = renderView([createAction('note.md', '単独')]);

		expect(contentEl.findByClass('gtd-next-action-group-count-badge')).toHaveLength(1);
		expect(contentEl.findByClass('gtd-next-action-count')).toHaveLength(0);
	});
});
