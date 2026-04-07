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

describe('NoteContent.completeNextAction', () => {
	it('対象のチェックボックスを [x] に変換する', () => {
		const content = '- [ ] タスクA\n- [ ] タスクB\n';
		expect(new NoteContent(content).completeNextAction('タスクA').value).toBe(
			'- [x] タスクA\n- [ ] タスクB\n',
		);
	});

	it('インデントがあっても変換できる', () => {
		const content = '- [ ] 親\n  - [ ] 子タスク\n';
		expect(new NoteContent(content).completeNextAction('子タスク').value).toBe(
			'- [ ] 親\n  - [x] 子タスク\n',
		);
	});

	it('日付メタデータを含む行を変換できる', () => {
		const content = '- [ ] タスク 📅 2026-04-01\n';
		expect(new NoteContent(content).completeNextAction('タスク 📅 2026-04-01').value).toBe(
			'- [x] タスク 📅 2026-04-01\n',
		);
	});

	it('同じテキストが複数あるとき最初の1件だけ変換する', () => {
		const content = '- [ ] タスク\n- [ ] タスク\n';
		expect(new NoteContent(content).completeNextAction('タスク').value).toBe(
			'- [x] タスク\n- [ ] タスク\n',
		);
	});

	it('コードブロック内は変換しない', () => {
		const content = '```\n- [ ] タスク\n```\n- [ ] タスク\n';
		expect(new NoteContent(content).completeNextAction('タスク').value).toBe(
			'```\n- [ ] タスク\n```\n- [x] タスク\n',
		);
	});

	it('既に完了済みのチェックボックスは変更しない', () => {
		const content = '- [x] タスク\n';
		expect(new NoteContent(content).completeNextAction('タスク').value).toBe('- [x] タスク\n');
	});

	it('対象のテキストが存在しない場合はそのまま返す', () => {
		const content = '- [ ] 別のタスク\n';
		expect(new NoteContent(content).completeNextAction('存在しないタスク').value).toBe(
			'- [ ] 別のタスク\n',
		);
	});

	it('正規表現特殊文字を含むテキストも正しく変換する', () => {
		const content = '- [ ] タスク (重要) [A]\n';
		expect(new NoteContent(content).completeNextAction('タスク (重要) [A]').value).toBe(
			'- [x] タスク (重要) [A]\n',
		);
	});
});
