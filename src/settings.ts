import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import NextLevelGtdPlugin from './main';
import { t } from './i18n';
import { isInbox } from './inbox';
import { setClassification } from './frontmatter';
import { ConfirmModal } from './ui/ConfirmModal';

export interface NextLevelGtdSettings {
	_placeholder: null;
}

export const DEFAULT_SETTINGS: NextLevelGtdSettings = {
	_placeholder: null,
};

export class NextLevelGtdSettingTab extends PluginSettingTab {
	readonly plugin: NextLevelGtdPlugin;

	constructor(app: App, plugin: NextLevelGtdPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName(t('settingInitSectionName'))
			.setDesc(t('settingInitSectionDesc'))
			.addButton((btn) =>
				btn.setButtonText(t('settingInitButtonLabel')).onClick(() => {
					const targets = this.app.vault
						.getMarkdownFiles()
						.filter((f) =>
							isInbox(this.app.metadataCache.getFileCache(f)?.frontmatter ?? null),
						);
					const count = targets.length;
					const message = `${count} ${t('settingInitConfirmMessage')}`;
					new ConfirmModal(this.app, message, () => {
						void Promise.all(
							targets.map((f) => setClassification(this.app, f, 'Reference')),
						).then(() => {
							new Notice(`${count} ${t('settingInitSuccessNotice')}`);
						});
					}).open();
				}),
			);
	}
}
