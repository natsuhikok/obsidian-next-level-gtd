import { describe, expect, it, vi } from 'vitest';
import { App, TFile } from 'obsidian';
import { cancelAllNextActionsInFile } from './cancelAllNextActionsInFile';

describe('cancelAllNextActionsInFile', () => {
	it('ファイル内容を読み込んで変換し書き戻す', async () => {
		const readMock = vi.fn().mockResolvedValue('- [ ] タスク1\n- [ ] タスク2\n');
		const modifyMock = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
		const app = { vault: { read: readMock, modify: modifyMock } } as unknown as App;
		// eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast
		const file = { path: 'test.md' } as TFile;
		await cancelAllNextActionsInFile(app, file);
		expect(readMock).toHaveBeenCalledWith(file);
		expect(modifyMock).toHaveBeenCalledWith(file, '- [-] タスク1\n- [-] タスク2\n');
	});
});
