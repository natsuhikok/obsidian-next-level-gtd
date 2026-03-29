import { describe, it, expect, vi, beforeEach } from 'vitest';
import { moment } from 'obsidian';
import { t } from './i18n';

describe('t()', () => {
	beforeEach(() => {
		vi.mocked(moment.locale).mockReturnValue('en');
	});

	it('英語ロケールで英語文字列を返す', () => {
		expect(t('sampleCommandName')).toBe('Sample command');
		expect(t('sampleCommandNotice')).toBe('Sample command executed!');
		expect(t('sampleSettingName')).toBe('Sample setting');
		expect(t('sampleSettingDesc')).toBe('A sample text setting.');
	});

	it('日本語ロケールで日本語文字列を返す', () => {
		vi.mocked(moment.locale).mockReturnValue('ja');
		expect(t('sampleCommandName')).toBe('サンプルコマンド');
		expect(t('sampleCommandNotice')).toBe('サンプルコマンドを実行しました');
		expect(t('sampleSettingName')).toBe('サンプル設定');
		expect(t('sampleSettingDesc')).toBe('サンプルのテキスト設定です。');
	});

	it('未知のロケールは英語にフォールバックする', () => {
		vi.mocked(moment.locale).mockReturnValue('fr');
		expect(t('sampleCommandName')).toBe('Sample command');
	});
});
