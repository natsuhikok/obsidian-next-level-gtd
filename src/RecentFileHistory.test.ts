import { TFile } from 'obsidian';
import { describe, expect, it } from 'vitest';
import { RecentFileHistory } from './RecentFileHistory';

function file(path: string): TFile {
	return Object.assign(new TFile(), { path });
}

describe('最近開いたファイル履歴', () => {
	it('開いたファイルを先頭に追加する', () => {
		const history = new RecentFileHistory(['projects/next.md']);

		expect(history.record(file('inbox/task.md')).filePaths).toEqual([
			'inbox/task.md',
			'projects/next.md',
		]);
	});

	it('既存のファイルを開いた場合は重複させず先頭に移動する', () => {
		const history = new RecentFileHistory([
			'projects/next.md',
			'inbox/task.md',
			'archive/done.md',
		]);

		expect(history.record(file('inbox/task.md')).filePaths).toEqual([
			'inbox/task.md',
			'projects/next.md',
			'archive/done.md',
		]);
	});

	it('開いたファイルは最新の30件だけを保持する', () => {
		const history = new RecentFileHistory(
			Array.from({ length: 30 }, (_, index) => `projects/${index + 1}.md`),
		);

		expect(history.record(file('inbox/task.md')).filePaths).toEqual([
			'inbox/task.md',
			...Array.from({ length: 29 }, (_, index) => `projects/${index + 1}.md`),
		]);
	});

	it('保存値から空文字と重複を除いた履歴を復元する', () => {
		const history = RecentFileHistory.fromStoredValue([
			' inbox/task.md ',
			'',
			'inbox/task.md',
			42,
			'projects/next.md',
		]);

		expect(history.filePaths).toEqual(['inbox/task.md', 'projects/next.md']);
	});

	it('保存値から最新の30件だけを復元する', () => {
		const history = RecentFileHistory.fromStoredValue(
			Array.from({ length: 31 }, (_, index) => `projects/${index + 1}.md`),
		);

		expect(history.filePaths).toEqual(
			Array.from({ length: 30 }, (_, index) => `projects/${index + 1}.md`),
		);
	});

	it('不正な履歴では作成できない', () => {
		expect(() => new RecentFileHistory(['inbox/task.md', 'inbox/task.md'])).toThrow(
			'最近開いたファイル履歴が不正です',
		);
	});

	it('31件以上の履歴では作成できない', () => {
		expect(
			() =>
				new RecentFileHistory(
					Array.from({ length: 31 }, (_, index) => `projects/${index + 1}.md`),
				),
		).toThrow('最近開いたファイル履歴が多すぎます');
	});
});
