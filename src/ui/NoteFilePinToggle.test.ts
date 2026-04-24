import { describe, expect, it, vi, type Mock } from 'vitest';
import { TFile, MarkdownView, type App, type PluginManifest, type WorkspaceLeaf } from 'obsidian';
import NextLevelGtdPlugin from '../main';
import { NoteFilePinToggle } from './NoteFilePinToggle';
import { DEFAULT_SETTINGS } from '../settings';

type PluginWithWorkspace = NextLevelGtdPlugin & {
	readonly app: {
		readonly workspace: {
			readonly getActiveViewOfType: Mock;
		};
	};
};

function pluginWithSettings() {
	const manifest: PluginManifest = {
		id: 'obsidian-next-level-gtd',
		name: 'Next Level GTD',
		author: 'test',
		version: '1.0.0',
		minAppVersion: '1.0.0',
		description: 'test',
	};
	const plugin = new NextLevelGtdPlugin({} as App, manifest) as PluginWithWorkspace;
	plugin.settings = {
		excludedFolders: [],
		environmentContexts: [],
		contextOrder: [],
		evaluateStructuralNextActionBlocking: true,
		pinnedFileNames: [],
		pinnedActionPins: [],
		recentFilePaths: DEFAULT_SETTINGS.recentFilePaths,
		_placeholder: null,
	};
	return plugin;
}

function markdownFile(path: string, name: string) {
	const file = new TFile();
	file.path = path;
	file.name = name;
	file.basename = name.replace(/\.md$/, '');
	file.extension = 'md';
	return file;
}

function addActionMock(view: MarkdownView): Mock {
	return (view as unknown as { readonly addAction: Mock }).addAction;
}

function markdownView(file: TFile): MarkdownView {
	const view = new MarkdownView({} as WorkspaceLeaf);
	view.file = file;
	return view;
}

describe('ノートビューのファイルピン', () => {
	it('ファイルビュー対象のノートに現在のピン状態を表示する', () => {
		const plugin = pluginWithSettings();
		const file = markdownFile('projects/action.md', 'action.md');
		const view = markdownView(file);
		plugin.settings = { ...plugin.settings, pinnedFileNames: ['action.md'] };
		plugin.app.workspace.getActiveViewOfType.mockReturnValue(view);
		const toggle = new NoteFilePinToggle(plugin);

		toggle.renderForActiveView();

		const addAction = addActionMock(view);
		expect(addAction).toHaveBeenCalledWith('pin', 'Unpin file', expect.any(Function));
		const action = addAction.mock.results[0]?.value as HTMLElement | undefined;
		expect(action?.getAttribute('aria-pressed')).toBe('true');
		expect(action?.getAttribute('aria-label')).toBe('Unpin file');
		expect(action?.hasClass('is-pinned')).toBe(true);
	});

	it('除外フォルダのノートではピン操作を表示しない', () => {
		const plugin = pluginWithSettings();
		const file = markdownFile('archive/action.md', 'action.md');
		const view = markdownView(file);
		plugin.settings = {
			...plugin.settings,
			excludedFolders: [{ folder: 'archive', showAlertBanner: true }],
		};
		plugin.app.workspace.getActiveViewOfType.mockReturnValue(view);
		const toggle = new NoteFilePinToggle(plugin);

		toggle.renderForActiveView();

		const addAction = addActionMock(view);
		expect(addAction).not.toHaveBeenCalled();
	});

	it('ノートビューから既存のファイルピン状態を切り替える', async () => {
		const plugin = pluginWithSettings();
		const file = markdownFile('projects/action.md', 'action.md');
		const view = markdownView(file);
		plugin.app.workspace.getActiveViewOfType.mockReturnValue(view);
		const toggle = new NoteFilePinToggle(plugin);

		toggle.renderForActiveView();
		const addAction = addActionMock(view);
		const onClick = addAction.mock.calls[0]?.[2] as (() => void) | undefined;
		onClick?.();
		await vi.waitFor(() => {
			expect(plugin.settings.pinnedFileNames).toEqual(['action.md']);
		});

		const action = addAction.mock.results[0]?.value as HTMLElement | undefined;
		await vi.waitFor(() => {
			expect(action?.getAttribute('aria-pressed')).toBe('true');
		});
		expect(action?.getAttribute('aria-label')).toBe('Unpin file');
	});
});
