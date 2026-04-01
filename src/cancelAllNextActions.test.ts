import { describe, expect, it, vi } from 'vitest';
import { App, TFile } from 'obsidian';
import { cancelAllNextActions, cancelAllNextActionsInFile } from './cancelAllNextActions';

describe('cancelAllNextActions', () => {
	it('コードブロック外の未完了チェックボックスを [-] に変換する', () => {
		expect(cancelAllNextActions('- [ ] タスク')).toBe('- [-] タスク');
	});

	it('複数の未完了チェックボックスをすべて変換する', () => {
		const input = '- [ ] タスク1\n- [ ] タスク2';
		expect(cancelAllNextActions(input)).toBe('- [-] タスク1\n- [-] タスク2');
	});

	it('完了チェックボックス [x] は変換しない', () => {
		expect(cancelAllNextActions('- [x] 完了タスク')).toBe('- [x] 完了タスク');
	});

	it('中止チェックボックス [-] は変換しない', () => {
		expect(cancelAllNextActions('- [-] 中止タスク')).toBe('- [-] 中止タスク');
	});

	it('フェンスコードブロック内の未完了チェックボックスは変換しない', () => {
		const input = '```\n- [ ] コードブロック内\n```';
		expect(cancelAllNextActions(input)).toBe(input);
	});

	it('フェンスコードブロック外のチェックボックスは変換する', () => {
		const input = '```\n- [ ] 内側\n```\n- [ ] 外側';
		expect(cancelAllNextActions(input)).toBe('```\n- [ ] 内側\n```\n- [-] 外側');
	});

	it('~~~ フェンスコードブロック内の未完了チェックボックスは変換しない', () => {
		const input = '~~~\n- [ ] コードブロック内\n~~~';
		expect(cancelAllNextActions(input)).toBe(input);
	});

	it('インラインコード内の未完了チェックボックスは変換しない', () => {
		const input = '説明 `- [ ] インラインコード内` テキスト';
		expect(cancelAllNextActions(input)).toBe(input);
	});

	it('インデントされたチェックボックスも変換する', () => {
		expect(cancelAllNextActions('  - [ ] インデントタスク')).toBe('  - [-] インデントタスク');
	});

	it('数字リスト形式のチェックボックスも変換する', () => {
		expect(cancelAllNextActions('1. [ ] 番号付きタスク')).toBe('1. [-] 番号付きタスク');
	});

	it('空文字列はそのまま返す', () => {
		expect(cancelAllNextActions('')).toBe('');
	});
});

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
