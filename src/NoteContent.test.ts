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

	it('番号付きリストの直後の中止アクションを未完了に戻す', () => {
		const content = '1. [ ] タスクA 📅 2026-04-01\n2. [-] タスクB #home\n';
		expect(new NoteContent(content).completeNextAction('タスクA 📅 2026-04-01').value).toBe(
			'1. [x] タスクA 📅 2026-04-01\n2. [ ] タスクB #home\n',
		);
	});

	it('番号付きリストの直後以外の中止アクションは未完了に戻さない', () => {
		const content = '1. [ ] タスクA\n2. [-] タスクB\n3. [-] タスクC\n';
		expect(new NoteContent(content).completeNextAction('タスクA').value).toBe(
			'1. [x] タスクA\n2. [ ] タスクB\n3. [-] タスクC\n',
		);
	});

	it('同じ階層ではない中止アクションは未完了に戻さない', () => {
		const childContent = '1. [ ] タスクA\n  1. [-] 子タスク\n';
		expect(new NoteContent(childContent).completeNextAction('タスクA').value).toBe(
			'1. [x] タスクA\n  1. [-] 子タスク\n',
		);

		const parentContent = '  1. [ ] 子タスク\n1. [-] 親タスク\n';
		expect(new NoteContent(parentContent).completeNextAction('子タスク').value).toBe(
			'  1. [x] 子タスク\n1. [-] 親タスク\n',
		);
	});

	it('リスト外の内容で分かれた中止アクションは未完了に戻さない', () => {
		const content = '1. [ ] タスクA\n説明\n2. [-] タスクB\n';
		expect(new NoteContent(content).completeNextAction('タスクA').value).toBe(
			'1. [x] タスクA\n説明\n2. [-] タスクB\n',
		);
	});

	it('直後が中止以外の状態なら変更しない', () => {
		const uncheckedContent = '1. [ ] タスクA\n2. [ ] タスクB\n';
		expect(new NoteContent(uncheckedContent).completeNextAction('タスクA').value).toBe(
			'1. [x] タスクA\n2. [ ] タスクB\n',
		);

		const checkedContent = '1. [ ] タスクA\n2. [X] タスクB\n';
		expect(new NoteContent(checkedContent).completeNextAction('タスクA').value).toBe(
			'1. [x] タスクA\n2. [X] タスクB\n',
		);
	});

	it('箇条書きリストの中止アクションは未完了に戻さない', () => {
		const content = '- [ ] タスクA\n- [-] タスクB\n';
		expect(new NoteContent(content).completeNextAction('タスクA').value).toBe(
			'- [x] タスクA\n- [-] タスクB\n',
		);
	});
});
