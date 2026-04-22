import { describe, expect, it } from 'vitest';
import { NoteContent } from './NoteContent';

describe('NoteContent.cancelAllNextActions', () => {
	it('コードブロック外の未完了チェックボックスを [-] に変換する', () => {
		expect(new NoteContent('- [ ] タスク').cancelAllNextActions().value).toBe('- [-] タスク');
	});

	it('複数の未完了チェックボックスをすべて変換する', () => {
		const input = '- [ ] タスク1\n- [ ] タスク2';
		expect(new NoteContent(input).cancelAllNextActions().value).toBe(
			'- [-] タスク1\n- [-] タスク2',
		);
	});

	it('完了チェックボックス [x] は変換しない', () => {
		expect(new NoteContent('- [x] 完了タスク').cancelAllNextActions().value).toBe(
			'- [x] 完了タスク',
		);
	});

	it('中止チェックボックス [-] は変換しない', () => {
		expect(new NoteContent('- [-] 中止タスク').cancelAllNextActions().value).toBe(
			'- [-] 中止タスク',
		);
	});

	it('フェンスコードブロック内の未完了チェックボックスは変換しない', () => {
		const input = '```\n- [ ] コードブロック内\n```';
		expect(new NoteContent(input).cancelAllNextActions().value).toBe(input);
	});

	it('フェンスコードブロック外のチェックボックスは変換する', () => {
		const input = '```\n- [ ] 内側\n```\n- [ ] 外側';
		expect(new NoteContent(input).cancelAllNextActions().value).toBe(
			'```\n- [ ] 内側\n```\n- [-] 外側',
		);
	});

	it('~~~ フェンスコードブロック内の未完了チェックボックスは変換しない', () => {
		const input = '~~~\n- [ ] コードブロック内\n~~~';
		expect(new NoteContent(input).cancelAllNextActions().value).toBe(input);
	});

	it('インラインコード内の未完了チェックボックスは変換しない', () => {
		const input = '説明 `- [ ] インラインコード内` テキスト';
		expect(new NoteContent(input).cancelAllNextActions().value).toBe(input);
	});

	it('インデントされたチェックボックスも変換する', () => {
		expect(new NoteContent('  - [ ] インデントタスク').cancelAllNextActions().value).toBe(
			'  - [-] インデントタスク',
		);
	});

	it('数字リスト形式のチェックボックスも変換する', () => {
		expect(new NoteContent('1. [ ] 番号付きタスク').cancelAllNextActions().value).toBe(
			'1. [-] 番号付きタスク',
		);
	});

	it('空文字列はそのまま返す', () => {
		expect(new NoteContent('').cancelAllNextActions().value).toBe('');
	});
});
