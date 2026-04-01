import { describe, expect, it } from 'vitest';
import { completeNextAction } from './completeNextAction';

describe('completeNextAction', () => {
	it('対象のチェックボックスを [x] に変換する', () => {
		const content = '- [ ] タスクA\n- [ ] タスクB\n';
		expect(completeNextAction(content, 'タスクA')).toBe('- [x] タスクA\n- [ ] タスクB\n');
	});

	it('インデントがあっても変換できる', () => {
		const content = '- [ ] 親\n  - [ ] 子タスク\n';
		expect(completeNextAction(content, '子タスク')).toBe('- [ ] 親\n  - [x] 子タスク\n');
	});

	it('日付メタデータを含む行を変換できる', () => {
		const content = '- [ ] タスク 📅 2026-04-01\n';
		expect(completeNextAction(content, 'タスク 📅 2026-04-01')).toBe(
			'- [x] タスク 📅 2026-04-01\n',
		);
	});

	it('同じテキストが複数あるとき最初の1件だけ変換する', () => {
		const content = '- [ ] タスク\n- [ ] タスク\n';
		expect(completeNextAction(content, 'タスク')).toBe('- [x] タスク\n- [ ] タスク\n');
	});

	it('コードブロック内は変換しない', () => {
		const content = '```\n- [ ] タスク\n```\n- [ ] タスク\n';
		expect(completeNextAction(content, 'タスク')).toBe(
			'```\n- [ ] タスク\n```\n- [x] タスク\n',
		);
	});

	it('既に完了済みのチェックボックスは変更しない', () => {
		const content = '- [x] タスク\n';
		expect(completeNextAction(content, 'タスク')).toBe('- [x] タスク\n');
	});

	it('対象のテキストが存在しない場合はそのまま返す', () => {
		const content = '- [ ] 別のタスク\n';
		expect(completeNextAction(content, '存在しないタスク')).toBe('- [ ] 別のタスク\n');
	});

	it('正規表現特殊文字を含むテキストも正しく変換する', () => {
		const content = '- [ ] タスク (重要) [A]\n';
		expect(completeNextAction(content, 'タスク (重要) [A]')).toBe('- [x] タスク (重要) [A]\n');
	});
});
