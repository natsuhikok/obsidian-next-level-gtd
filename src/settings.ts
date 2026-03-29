import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';
import { t } from './i18n';

// TODO: rename / delete this sample — add your own settings here
export interface MyPluginSettings {
	sampleSetting: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	sampleSetting: 'default',
};

export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// TODO: rename / delete this sample setting
		new Setting(containerEl)
			.setName(t('sampleSettingName'))
			.setDesc(t('sampleSettingDesc'))
			.addText((text) =>
				text
					.setPlaceholder('...')
					.setValue(this.plugin.settings.sampleSetting)
					.onChange(async (value) => {
						this.plugin.settings.sampleSetting = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
