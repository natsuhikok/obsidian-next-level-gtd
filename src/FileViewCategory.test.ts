import { TFile } from 'obsidian';
import { describe, expect, it } from 'vitest';
import { FileViewCategory } from './FileViewCategory';
import { GTDNote } from './GTDNote';

function note(frontmatter: Record<string, unknown> | null): GTDNote {
	const file = new TFile();
	file.name = 'note.md';
	file.path = 'note.md';
	file.basename = 'note';
	file.extension = 'md';
	return GTDNote.from(file, frontmatter, '');
}

describe('FileViewCategory', () => {
	it('Inbox は未分類ノートだけに一致する', () => {
		expect(FileViewCategory.inbox().matches(note(null))).toBe(true);
		expect(FileViewCategory.inbox().matches(note({ classification: 'Reference' }))).toBe(false);
	});

	it('進行中は Actionable の進行中だけに一致する', () => {
		expect(
			FileViewCategory.inProgress().matches(
				note({ classification: 'Actionable', status: '進行中' }),
			),
		).toBe(true);
		expect(
			FileViewCategory.inProgress().matches(
				note({ classification: 'Actionable', status: '保留' }),
			),
		).toBe(false);
	});

	it('保留は Actionable の保留だけに一致する', () => {
		expect(
			FileViewCategory.onHold().matches(
				note({ classification: 'Actionable', status: '保留' }),
			),
		).toBe(true);
		expect(
			FileViewCategory.onHold().matches(
				note({ classification: 'Actionable', status: '完了' }),
			),
		).toBe(false);
	});

	it('Reference は Reference ノートだけに一致する', () => {
		expect(FileViewCategory.reference().matches(note({ classification: 'Reference' }))).toBe(
			true,
		);
		expect(
			FileViewCategory.reference().matches(
				note({ classification: 'Actionable', status: '進行中' }),
			),
		).toBe(false);
	});

	it('All は状態に関係なくすべての読み込み済みノートに一致する', () => {
		expect(FileViewCategory.all().matches(note(null))).toBe(true);
		expect(FileViewCategory.all().matches(note({ classification: 'Reference' }))).toBe(true);
		expect(
			FileViewCategory.all().matches(note({ classification: 'Actionable', status: '完了' })),
		).toBe(true);
	});
});
