import { describe, expect, it } from 'vitest';
import { isInbox, isValidClassification, isValidStatus } from './inbox';

describe('isValidClassification', () => {
	it('"Reference" は有効な分類である', () => {
		expect(isValidClassification('Reference')).toBe(true);
	});

	it('"Actionable" は有効な分類である', () => {
		expect(isValidClassification('Actionable')).toBe(true);
	});

	it('未定義値は無効な分類である', () => {
		expect(isValidClassification(undefined)).toBe(false);
	});

	it('空文字は無効な分類である', () => {
		expect(isValidClassification('')).toBe(false);
	});

	it('任意の文字列は無効な分類である', () => {
		expect(isValidClassification('Other')).toBe(false);
	});
});

describe('isValidStatus', () => {
	it('"進行中" は有効なステータスである', () => {
		expect(isValidStatus('進行中')).toBe(true);
	});

	it('"保留" は有効なステータスである', () => {
		expect(isValidStatus('保留')).toBe(true);
	});

	it('"完了" は有効なステータスである', () => {
		expect(isValidStatus('完了')).toBe(true);
	});

	it('"廃止" は有効なステータスである', () => {
		expect(isValidStatus('廃止')).toBe(true);
	});

	it('未定義値は無効なステータスである', () => {
		expect(isValidStatus(undefined)).toBe(false);
	});
});

describe('isInbox', () => {
	it('frontmatter が null の場合は Inbox である', () => {
		expect(isInbox(null)).toBe(true);
	});

	it('frontmatter が undefined の場合は Inbox である', () => {
		expect(isInbox(undefined)).toBe(true);
	});

	it('classification キーがない場合は Inbox である', () => {
		expect(isInbox({})).toBe(true);
	});

	it('classification が不正値の場合は Inbox である', () => {
		expect(isInbox({ classification: 'Invalid' })).toBe(true);
	});

	it('classification が "Reference" の場合は Inbox でない', () => {
		expect(isInbox({ classification: 'Reference' })).toBe(false);
	});

	it('classification が "Actionable" の場合は Inbox でない', () => {
		expect(isInbox({ classification: 'Actionable' })).toBe(false);
	});
});
