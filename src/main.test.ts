import { describe, expect, it, vi, type Mock } from 'vitest';
import {
	TFile,
	WorkspaceLeaf,
	type App,
	type Editor,
	type MarkdownFileInfo,
	type MarkdownView,
	type PluginManifest,
} from 'obsidian';
import NextLevelGtdPlugin from './main';
import { FileView } from './ui/FileView';
import { VIEW_TYPE_NEXT_ACTIONS } from './ui/NextActionsView';

type PluginRegistrationSpies = {
	readonly addCommand: Mock;
	readonly registerView: Mock;
	readonly registerEditorExtension: Mock;
	readonly addRibbonIcon: Mock;
	readonly addSettingTab: Mock;
	readonly saveData: Mock;
	readonly app: {
		readonly workspace: {
			readonly on: Mock;
			readonly getActiveViewOfType: Mock;
		};
		readonly metadataCache: {
			readonly on: Mock;
		};
		readonly vault: {
			readonly on: Mock;
		};
	};
};

describe('プラグインの起動', () => {
	it('コマンドパレットに操作を登録せず既存のUI経路を登録する', async () => {
		const manifest: PluginManifest = {
			id: 'obsidian-next-level-gtd',
			name: 'Next Level GTD',
			author: 'test',
			version: '1.0.0',
			minAppVersion: '1.0.0',
			description: 'test',
		};
		const plugin = new NextLevelGtdPlugin({} as App, manifest) as NextLevelGtdPlugin &
			PluginRegistrationSpies;

		await plugin.onload();

		expect(plugin.addCommand).not.toHaveBeenCalled();
		expect(plugin.registerView).toHaveBeenCalledWith(FileView.viewType, expect.any(Function));
		expect(plugin.registerView).toHaveBeenCalledWith(
			VIEW_TYPE_NEXT_ACTIONS,
			expect.any(Function),
		);
		expect(plugin.registerEditorExtension).toHaveBeenCalledWith(expect.anything());
		expect(plugin.addRibbonIcon).toHaveBeenCalledWith(
			'folder-open',
			'Open GTD Files',
			expect.any(Function),
		);
		expect(plugin.addRibbonIcon).toHaveBeenCalledWith(
			'list-checks',
			'Open GTD Next Actions',
			expect.any(Function),
		);
		expect(plugin.addSettingTab).toHaveBeenCalledWith(expect.any(Object));
		expect(plugin.app.workspace.on).toHaveBeenCalledWith('file-menu', expect.any(Function));
		expect(plugin.app.workspace.on).toHaveBeenCalledWith(
			'active-leaf-change',
			expect.any(Function),
		);
		expect(plugin.app.workspace.on).toHaveBeenCalledWith('file-open', expect.any(Function));
		expect(plugin.app.workspace.on).toHaveBeenCalledWith('layout-change', expect.any(Function));
		expect(plugin.app.workspace.on).toHaveBeenCalledWith('editor-change', expect.any(Function));
		expect(plugin.app.metadataCache.on).toHaveBeenCalledWith('changed', expect.any(Function));
		expect(plugin.app.vault.on).toHaveBeenCalledWith('modify', expect.any(Function));
		expect(plugin.app.vault.on).toHaveBeenCalledWith('delete', expect.any(Function));
		expect(plugin.app.vault.on).toHaveBeenCalledWith('rename', expect.any(Function));
	});

	it('ファイルオープンイベントだけでは最近開いた履歴を更新しない', async () => {
		const manifest: PluginManifest = {
			id: 'obsidian-next-level-gtd',
			name: 'Next Level GTD',
			author: 'test',
			version: '1.0.0',
			minAppVersion: '1.0.0',
			description: 'test',
		};
		const plugin = new NextLevelGtdPlugin({} as App, manifest) as NextLevelGtdPlugin &
			PluginRegistrationSpies;
		const file = new TFile();
		file.path = 'projects/action.md';
		file.extension = 'md';

		await plugin.onload();
		const fileOpenCall = plugin.app.workspace.on.mock.calls.find(
			(call: readonly unknown[]) => call[0] === 'file-open',
		);
		const fileOpen = fileOpenCall?.[1] as ((openedFile: TFile) => void) | undefined;
		fileOpen?.(file);

		expect(plugin.settings.recentFilePaths.filePaths).toEqual([]);
		expect(plugin.saveData).not.toHaveBeenCalled();
		plugin.onunload();
	});

	it('実際にファイルを開いたときだけ最近開いた履歴を更新する', async () => {
		const manifest: PluginManifest = {
			id: 'obsidian-next-level-gtd',
			name: 'Next Level GTD',
			author: 'test',
			version: '1.0.0',
			minAppVersion: '1.0.0',
			description: 'test',
		};
		const plugin = new NextLevelGtdPlugin({} as App, manifest) as NextLevelGtdPlugin &
			PluginRegistrationSpies;
		const file = new TFile();
		file.path = 'projects/action.md';
		file.extension = 'md';

		await plugin.onload();
		await new WorkspaceLeaf().openFile(file);

		expect(plugin.settings.recentFilePaths.filePaths).toEqual(['projects/action.md']);
		expect(plugin.saveData).toHaveBeenCalled();
		plugin.onunload();
	});
});

describe('ノート編集時の番号付きタスク更新', () => {
	it('チェックボックス操作で完了した番号付きタスクの次の中止タスクを未完了にする', async () => {
		vi.useFakeTimers();
		const manifest: PluginManifest = {
			id: 'obsidian-next-level-gtd',
			name: 'Next Level GTD',
			author: 'test',
			version: '1.0.0',
			minAppVersion: '1.0.0',
			description: 'test',
		};
		const plugin = new NextLevelGtdPlugin({} as App, manifest) as NextLevelGtdPlugin &
			PluginRegistrationSpies;
		const file = new TFile();
		file.path = 'projects/action.md';
		file.extension = 'md';
		let editorValue = '1. [ ] 最初\n2. [-] 次';
		const setValue = vi.fn((value: string) => {
			editorValue = value;
		});
		const replaceRange = vi.fn(
			(
				replacement: string,
				from: { readonly line: number; readonly ch: number },
				to?: { readonly line: number; readonly ch: number },
			) => {
				const lines = editorValue.split('\n');
				const line = lines[from.line] ?? '';
				lines[from.line] =
					line.slice(0, from.ch) + replacement + line.slice(to?.ch ?? from.ch);
				editorValue = lines.join('\n');
			},
		);
		const editor = {
			getValue: vi.fn(() => editorValue),
			setValue,
			replaceRange,
		} as unknown as Editor;
		const view = {
			file,
			editor,
			addAction: vi.fn(() => ({
				addClass: vi.fn(),
				removeClass: vi.fn(),
				setAttribute: vi.fn(),
			})),
		} as unknown as MarkdownView;
		plugin.app.workspace.getActiveViewOfType.mockReturnValue(view);

		await plugin.onload();
		editorValue = '1. [x] 最初\n2. [-] 次';
		const editorChangeCall = plugin.app.workspace.on.mock.calls.find(
			(call: readonly unknown[]) => call[0] === 'editor-change',
		);
		const editorChange = editorChangeCall?.[1] as
			| ((changedEditor: Editor, info: MarkdownView | MarkdownFileInfo) => void)
			| undefined;

		editorChange?.(editor, view);

		expect(replaceRange).toHaveBeenCalledWith(' ', { line: 1, ch: 4 }, { line: 1, ch: 5 });
		expect(setValue).not.toHaveBeenCalled();
		expect(editorValue).toBe('1. [x] 最初\n2. [ ] 次');
		vi.useRealTimers();
	});

	it('アクションピンを切り替えると同じ保存状態を更新する', async () => {
		const manifest: PluginManifest = {
			id: 'obsidian-next-level-gtd',
			name: 'Next Level GTD',
			author: 'test',
			version: '1.0.0',
			minAppVersion: '1.0.0',
			description: 'test',
		};
		const plugin = new NextLevelGtdPlugin({} as App, manifest) as NextLevelGtdPlugin &
			PluginRegistrationSpies;
		await plugin.loadSettings();
		const file = new TFile();
		file.path = 'projects/action.md';
		file.name = 'action.md';
		file.extension = 'md';

		await plugin.toggleActionPin(file, '次にやること');

		expect(plugin.settings.pinnedActionPins).toEqual([
			expect.objectContaining({
				fileName: 'action.md',
				actionName: '次にやること',
			}),
		]);
		expect(plugin.saveData).toHaveBeenCalled();

		await plugin.toggleActionPin(file, '次にやること');

		expect(plugin.settings.pinnedActionPins).toEqual([]);
	});
});
