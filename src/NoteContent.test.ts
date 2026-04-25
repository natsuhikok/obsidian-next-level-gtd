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

describe('NoteContent.releaseNextStoppedOrderedAction', () => {
	it('完了した番号付きタスクの次の中止タスクを未完了にする', () => {
		const previous = new NoteContent('1. [ ] 最初\n2. [-] 次');
		const current = new NoteContent('1. [x] 最初\n2. [-] 次');

		expect(current.releaseNextStoppedOrderedAction(previous).value).toBe(
			'1. [x] 最初\n2. [ ] 次',
		);
	});

	it('大文字で完了した番号付きタスクの次の中止タスクを未完了にする', () => {
		const previous = new NoteContent('1. [ ] 最初\n2. [-] 次');
		const current = new NoteContent('1. [X] 最初\n2. [-] 次');

		expect(current.releaseNextStoppedOrderedAction(previous).value).toBe(
			'1. [X] 最初\n2. [ ] 次',
		);
	});

	it('直後の中止タスクだけを未完了にする', () => {
		const previous = new NoteContent('1. [ ] 最初\n2. [-] 次\n3. [-] さらに次');
		const current = new NoteContent('1. [x] 最初\n2. [-] 次\n3. [-] さらに次');

		expect(current.releaseNextStoppedOrderedAction(previous).value).toBe(
			'1. [x] 最初\n2. [ ] 次\n3. [-] さらに次',
		);
	});

	it('次の番号付きタスクが中止ではない場合は変更しない', () => {
		const previous = new NoteContent('1. [ ] 最初\n2. [ ] 次');
		const current = new NoteContent('1. [x] 最初\n2. [ ] 次');

		expect(current.releaseNextStoppedOrderedAction(previous).value).toBe(current.value);
	});

	it('箇条書きの中止タスクは変更しない', () => {
		const previous = new NoteContent('- [ ] 最初\n- [-] 次');
		const current = new NoteContent('- [x] 最初\n- [-] 次');

		expect(current.releaseNextStoppedOrderedAction(previous).value).toBe(current.value);
	});

	it('完了した番号付きタスクの子タスクは変更しない', () => {
		const previous = new NoteContent('1. [ ] 最初\n   - [-] 子\n2. [-] 次');
		const current = new NoteContent('1. [x] 最初\n   - [-] 子\n2. [-] 次');

		expect(current.releaseNextStoppedOrderedAction(previous).value).toBe(
			'1. [x] 最初\n   - [-] 子\n2. [ ] 次',
		);
	});

	it('別のリストにある中止タスクは変更しない', () => {
		const previous = new NoteContent('1. [ ] 最初\n\n1. [-] 次');
		const current = new NoteContent('1. [x] 最初\n\n1. [-] 次');

		expect(current.releaseNextStoppedOrderedAction(previous).value).toBe(current.value);
	});

	it('前回から新しく完了していない場合は変更しない', () => {
		const previous = new NoteContent('1. [x] 最初\n2. [-] 次');
		const current = new NoteContent('1. [x] 最初\n2. [-] 次');

		expect(current.releaseNextStoppedOrderedAction(previous).value).toBe(current.value);
	});

	it('コードブロック内の中止タスクは変更しない', () => {
		const previous = new NoteContent('1. [ ] 最初\n```\n2. [-] 次\n```');
		const current = new NoteContent('1. [x] 最初\n```\n2. [-] 次\n```');

		expect(current.releaseNextStoppedOrderedAction(previous).value).toBe(current.value);
	});
});

describe('NoteContent.releaseNextStoppedOrderedActionChange', () => {
	it('解放されるチェックボックスの最小変更範囲を返す', () => {
		const previous = new NoteContent('1. [ ] 最初\n2. [-] 次');
		const current = new NoteContent('1. [x] 最初\n2. [-] 次');

		expect(current.releaseNextStoppedOrderedActionChange(previous)).toEqual({
			content: new NoteContent('1. [x] 最初\n2. [ ] 次'),
			from: { line: 1, ch: 4 },
			to: { line: 1, ch: 5 },
			replacement: ' ',
		});
	});

	it('変更がないときは null を返す', () => {
		const previous = new NoteContent('1. [x] 最初\n2. [-] 次');
		const current = new NoteContent('1. [x] 最初\n2. [-] 次');

		expect(current.releaseNextStoppedOrderedActionChange(previous)).toBeNull();
	});
});
