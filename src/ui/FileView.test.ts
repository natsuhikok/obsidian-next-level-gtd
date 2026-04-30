import { describe, expect, it, vi, type Mock } from 'vitest';
import { Keymap, TFile, WorkspaceLeaf } from 'obsidian';
import { FileView } from './FileView';
import { DEFAULT_SETTINGS } from '../settings';

type PluginForFileView = {
	readonly settings: typeof DEFAULT_SETTINGS;
	readonly fileParticipatesInFileView: Mock;
	readonly isFilePinned: Mock;
	readonly toggleFilePin: Mock;
};

function createPlugin(): PluginForFileView {
	return {
		settings: DEFAULT_SETTINGS,
		fileParticipatesInFileView: vi.fn(() => true),
		isFilePinned: vi.fn(() => false),
		toggleFilePin: vi.fn(() => Promise.resolve()),
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

function invokeOpenNote(view: FileView, file: TFile, event: MouseEvent) {
	const openNote = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(view), 'openNote')
		?.value as
		| ((this: FileView, targetFile: TFile, clickEvent: MouseEvent) => void)
		| undefined;
	openNote?.call(view, file, event);
}

function renderFileList(view: FileView) {
	const render = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(view), 'renderFileList')
		?.value as ((this: FileView) => void) | undefined;
	render?.call(view);
}

function renderTabs(view: FileView, contentEl: HTMLElement) {
	const render = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(view), 'renderTabs')
		?.value as ((this: FileView, targetElement: HTMLElement) => void) | undefined;
	render?.call(view, contentEl);
}

describe('ファイルビューのファイルオープン', () => {
	it('フィルター付きの一覧から開くとフィルターを解除してから対象ファイルを開く', () => {
		const plugin = createPlugin();
		const view = new FileView(new WorkspaceLeaf(), plugin as never);
		const openFile = vi.fn();
		const getLeaf = vi.fn(() => ({ openFile }));
		const render = vi
			.spyOn(view as unknown as { render: () => void }, 'render')
			.mockImplementation(() => {});
		const event = {} as MouseEvent;
		const file = createFile('projects/alpha.md');
		(view.app.workspace as unknown as { getLeaf: Mock }).getLeaf = getLeaf;
		(view as unknown as { filterText: string }).filterText = 'alpha';
		const isModEvent = vi.spyOn(Keymap, 'isModEvent').mockReturnValue(false);

		invokeOpenNote(view, file, event);

		expect((view as unknown as { filterText: string }).filterText).toBe('');
		expect(render).toHaveBeenCalledOnce();
		expect(getLeaf).toHaveBeenCalledWith(false);
		expect(isModEvent).toHaveBeenCalledWith(event);
		expect(openFile).toHaveBeenCalledWith(file);
	});

	it('修飾キーで別リーフに開く場合もフィルターを解除する', () => {
		const plugin = createPlugin();
		const view = new FileView(new WorkspaceLeaf(), plugin as never);
		const openFile = vi.fn();
		const getLeaf = vi.fn(() => ({ openFile }));
		const render = vi
			.spyOn(view as unknown as { render: () => void }, 'render')
			.mockImplementation(() => {});
		const file = createFile('projects/beta.md');
		(view.app.workspace as unknown as { getLeaf: Mock }).getLeaf = getLeaf;
		(view as unknown as { filterText: string }).filterText = 'beta';
		const isModEvent = vi.spyOn(Keymap, 'isModEvent').mockReturnValue(true);

		invokeOpenNote(view, file, {} as MouseEvent);

		expect((view as unknown as { filterText: string }).filterText).toBe('');
		expect(render).toHaveBeenCalledOnce();
		expect(getLeaf).toHaveBeenCalledWith(true);
		expect(isModEvent).toHaveBeenCalled();
		expect(openFile).toHaveBeenCalledWith(file);
	});
});

describe('ファイルビューのタブ表示', () => {
	it('最近タブだけ件数バッジを表示しない', () => {
		const plugin = createPlugin();
		const view = new FileView(new WorkspaceLeaf(), plugin as never);

		renderTabs(view, view.contentEl);

		const tabBar = (view.contentEl.createDiv as Mock).mock.results[0]?.value as
			| HTMLElement
			| undefined;
		const buttons = ((tabBar?.createEl as Mock | undefined)?.mock.results ?? []).map(
			(result) => result.value as HTMLElement,
		);

		const inboxCreateSpan = Reflect.get(buttons[0] as object, 'createSpan') as Mock;
		const allCreateSpan = Reflect.get(buttons[1] as object, 'createSpan') as Mock;
		const recentCreateSpan = Reflect.get(buttons[2] as object, 'createSpan') as Mock;
		const inProgressCreateSpan = Reflect.get(buttons[3] as object, 'createSpan') as Mock;

		expect(buttons).toHaveLength(4);
		expect(inboxCreateSpan).toHaveBeenCalledWith({
			cls: 'gtd-tab-badge',
			text: '0',
		});
		expect(allCreateSpan).toHaveBeenCalledWith({
			cls: 'gtd-tab-badge',
			text: '0',
		});
		expect(recentCreateSpan).not.toHaveBeenCalledWith(
			expect.objectContaining({ cls: 'gtd-tab-badge' }),
		);
		expect(inProgressCreateSpan).toHaveBeenCalledWith({
			cls: 'gtd-tab-badge',
			text: '0',
		});
	});
});

describe('ファイルビューのファイルピン', () => {
	it('ピン済みファイルでも同じボタン操作を保ったまま現在状態を表示する', () => {
		const plugin = createPlugin();
		plugin.isFilePinned.mockReturnValue(true);
		const view = new FileView(new WorkspaceLeaf(), plugin as never);
		const listContainer = view.contentEl.createDiv({ cls: 'nav-files-container' });
		const file = createFile('projects/pinned.md');
		(view as unknown as { listContainer: HTMLElement | null }).listContainer = listContainer;
		(
			view as unknown as { selectedTabId: 'inbox' | 'all' | 'recent' | 'inProgress' }
		).selectedTabId = 'all';
		(
			view as unknown as {
				noteCache: Record<
					string,
					{
						readonly file: TFile;
						readonly isInbox: boolean;
						readonly alerts: readonly [];
						readonly hasActionableStatus: Mock;
					}
				>;
			}
		).noteCache = {
			[file.path]: {
				file,
				isInbox: false,
				alerts: [],
				hasActionableStatus: vi.fn(() => false),
			},
		};

		renderFileList(view);

		const row = (listContainer.createDiv as Mock).mock.results[0]?.value as
			| HTMLElement
			| undefined;
		const title = (row?.createDiv as Mock | undefined)?.mock.results[0]?.value as
			| HTMLElement
			| undefined;
		const createEl =
			title == null ? undefined : (Reflect.get(title, 'createEl') as Mock | undefined);
		const pinButton = createEl?.mock.results[0]?.value as HTMLElement | undefined;

		expect(createEl).toHaveBeenCalledWith('button', {
			cls: 'gtd-file-pin is-pinned',
		});
		expect(pinButton?.getAttribute('aria-label')).toBe('Unpin file');
		expect(pinButton?.getAttribute('aria-pressed')).toBe('true');
	});
});
