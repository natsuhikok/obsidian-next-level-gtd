import { moment } from 'obsidian';

interface PluginStrings {
	// TODO: rename / delete this sample — replace with your own keys
	sampleCommandName: string;
	sampleCommandNotice: string;
	sampleSettingName: string;
	sampleSettingDesc: string;
}

const en: PluginStrings = {
	sampleCommandName: 'Sample command',
	sampleCommandNotice: 'Sample command executed!',
	sampleSettingName: 'Sample setting',
	sampleSettingDesc: 'A sample text setting.',
};

const ja: PluginStrings = {
	sampleCommandName: 'サンプルコマンド',
	sampleCommandNotice: 'サンプルコマンドを実行しました',
	sampleSettingName: 'サンプル設定',
	sampleSettingDesc: 'サンプルのテキスト設定です。',
};

export function t<K extends keyof PluginStrings>(key: K): PluginStrings[K] {
	const locale = moment.locale();
	return ({ en, ja }[locale] ?? en)[key];
}
