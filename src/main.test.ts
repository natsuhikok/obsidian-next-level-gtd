import { describe, expect, it, type Mock } from 'vitest';
import type { App, PluginManifest } from 'obsidian';
import NextLevelGtdPlugin from './main';
import { FileView } from './ui/FileView';
import { VIEW_TYPE_NEXT_ACTIONS } from './ui/NextActionsView';

type PluginRegistrationSpies = {
	readonly addCommand: Mock;
	readonly registerView: Mock;
	readonly addRibbonIcon: Mock;
	readonly addSettingTab: Mock;
	readonly app: {
		readonly workspace: {
			readonly on: Mock;
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
});
