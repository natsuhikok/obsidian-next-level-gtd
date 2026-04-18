import { describe, it, expect, vi, beforeEach } from 'vitest';
import { moment } from 'obsidian';
import { t } from './i18n';

describe('t()', () => {
	beforeEach(() => {
		vi.mocked(moment.locale).mockReturnValue('en');
	});

	it('英語ロケールで英語文字列を返す', () => {
		expect(t('openFileViewCommand')).toBe('Open File View');
		expect(t('classificationInbox')).toBe('Inbox');
		expect(t('classificationReference')).toBe('Reference');
		expect(t('classificationActionable')).toBe('Actionable');
	});

	it('日本語ロケールで日本語文字列を返す', () => {
		vi.mocked(moment.locale).mockReturnValue('ja');
		expect(t('openFileViewCommand')).toBe('ファイルビューを開く');
	});

	it('未知のロケールは英語にフォールバックする', () => {
		vi.mocked(moment.locale).mockReturnValue('fr');
		expect(t('openFileViewCommand')).toBe('Open File View');
	});
});
