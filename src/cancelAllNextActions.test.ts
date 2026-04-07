import { describe, expect, it } from 'vitest';
import { cancelAllNextActions } from './cancelAllNextActions';

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
