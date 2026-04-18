import { describe, expect, it, vi } from 'vitest';
import { EnvironmentContexts } from './EnvironmentContexts';
import type NextLevelGtdPlugin from './main';

function environmentContexts(contexts: readonly string[]) {
	const saveSettings = vi.fn(async () => undefined);
	const plugin = {
		settings: {
			_placeholder: null,
			evaluateStructuralNextActionBlocking: true,
			excludedFolders: [],
			environmentContexts: contexts,
		},
		saveSettings,
	} as unknown as NextLevelGtdPlugin;

	return {
		manager: new EnvironmentContexts(plugin),
		plugin,
		saveSettings,
	};
}

describe('EnvironmentContexts', () => {
	it('追加したコンテキストを末尾に配置する', async () => {
		const { manager, plugin, saveSettings } = environmentContexts(['home']);

		await manager.add('Office');

		expect(plugin.settings.environmentContexts).toEqual(['home', 'office']);
		expect(saveSettings).toHaveBeenCalledOnce();
	});

	it('既存のコンテキストを前後に移動できる', async () => {
		const { manager, plugin } = environmentContexts(['home', 'office', 'phone']);

		await manager.moveEarlier('phone');
		await manager.moveLater('home');

		expect(plugin.settings.environmentContexts).toEqual(['phone', 'home', 'office']);
	});

	it('削除したコンテキストだけを順序リストから取り除く', async () => {
		const { manager, plugin } = environmentContexts(['home', 'office', 'phone']);

		await manager.remove('office');

		expect(plugin.settings.environmentContexts).toEqual(['home', 'phone']);
	});
});
