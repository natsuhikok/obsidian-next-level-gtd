import { describe, expect, it } from 'vitest';
import { hasNextAction } from './hasNextAction';

describe('hasNextAction', () => {
	it('未完了チェックボックスがあれば true を返す', () => {
		expect(hasNextAction('- [ ] タスク')).toBe(true);
	});

	it('完了チェックボックス [x] は next action として扱わない', () => {
		expect(hasNextAction('- [x] 完了タスク')).toBe(false);
	});

	it('完了チェックボックス [X] (大文字) は next action として扱わない', () => {
		expect(hasNextAction('- [X] 完了タスク')).toBe(false);
	});

	it('中止チェックボックス [-] は next action として扱わない', () => {
		expect(hasNextAction('- [-] 中止タスク')).toBe(false);
	});

	it('#temp 付きチェックボックスは next action として扱わない', () => {
		expect(hasNextAction('- [ ] 一時タスク #temp')).toBe(false);
	});

	it('#temp が行末以外にあっても除外する', () => {
		expect(hasNextAction('- [ ] #temp メモ的なもの')).toBe(false);
	});

	it('チェックボックスが一切なければ false を返す', () => {
		expect(hasNextAction('普通のテキスト\n# 見出し\n本文')).toBe(false);
	});

	it('完了と未完了が混在する場合は true を返す', () => {
		const content = '- [x] 完了\n- [ ] 未完了';
		expect(hasNextAction(content)).toBe(true);
	});

	it('#temp と通常タスクが混在する場合は true を返す', () => {
		const content = '- [ ] 通常タスク\n- [ ] 一時 #temp';
		expect(hasNextAction(content)).toBe(true);
	});

	it('数字リスト形式のチェックボックスも対象にする', () => {
		expect(hasNextAction('1. [ ] 番号付きタスク')).toBe(true);
	});

	it('インデントされたチェックボックスも対象にする', () => {
		expect(hasNextAction('  - [ ] インデントタスク')).toBe(true);
	});

	it('空文字列は false を返す', () => {
		expect(hasNextAction('')).toBe(false);
	});
});
