import { ExcludedFoldersManager } from 'ExcludedFoldersManager';
import { t } from 'i18n';
import { InboxInitializer } from 'InboxInitializer';
import NextLevelGtdPlugin from 'main';
import { MockNoteBuilder } from 'MockNoteBuilder';
import { App, Notice, PluginSettingTab, Setting, TextComponent } from 'obsidian';
import { ExcludedFolder } from 'types';
import { ConfirmModal } from 'ui/ConfirmModal';
import { FolderSuggest } from 'ui/FolderSuggest';
import { InboxView, VIEW_TYPE_INBOX } from 'ui/InboxView';

export interface NextLevelGtdSettings {
	_placeholder: null;
	excludedFolders: readonly ExcludedFolder[];
}

export const DEFAULT_SETTINGS: NextLevelGtdSettings = {
	_placeholder: null,
	excludedFolders: [],
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
		this.renderInitSection(containerEl);
		this.renderExcludedFoldersSection(containerEl);
		this.renderDevSection(containerEl);
	}

	private renderInitSection(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t('settingInitSectionName'))
			.setDesc(t('settingInitSectionDesc'))
			.addButton((btn) =>
				btn.setButtonText(t('settingInitButtonLabel')).onClick(() => {
					const initializer = new InboxInitializer(
						this.app,
						this.plugin.settings.excludedFolders.map((ef) => ef.folder),
					);
					const targets = initializer.findTargets();
					const count = targets.length;
					const message = `${count} ${t('settingInitConfirmMessage')}`;
					new ConfirmModal(this.app, message, () => {
						void initializer.initializeAll(targets).then(() => {
							new Notice(`${count} ${t('settingInitSuccessNotice')}`);
						});
					}).open();
				}),
			);
	}

	private renderExcludedFoldersSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(t('settingExcludedFoldersSectionName')).setHeading();
		new Setting(containerEl).setDesc(t('settingExcludedFoldersSectionDesc'));

		const manager = new ExcludedFoldersManager(this.plugin);
		for (const ef of manager.getAll()) {
			new Setting(containerEl)
				.setName(ef.folder)
				.addToggle((toggle) =>
					toggle
						.setValue(ef.showAlertBanner)
						.setTooltip(t('settingExcludedFoldersShowAlertBannerToggle'))
						.onChange(async (value) => {
							await manager.setShowAlertBanner(ef.folder, value);
						}),
				)
				.addExtraButton((btn) =>
					btn
						.setIcon('trash')
						.setTooltip(t('settingExcludedFoldersRemoveButton'))
						.onClick(async () => {
							await manager.remove(ef.folder);
							this.refreshInboxView();
							this.display();
						}),
				);
		}

		let inputText: TextComponent;
		const addSetting = new Setting(containerEl).addText((text) => {
			inputText = text;
			text.setPlaceholder(t('settingExcludedFoldersPlaceholder'));
			new FolderSuggest(this.app, text.inputEl);
		});
		addSetting.addButton((btn) =>
			btn.setButtonText(t('settingExcludedFoldersAddButton')).onClick(async () => {
				const raw = inputText
					.getValue()
					.trim()
					.replace(/^\/|\/$/, '');
				if (raw === '' || manager.includes(raw)) return;
				await manager.add(raw);
				this.refreshInboxView();
				this.display();
			}),
		);
	}

	private renderDevSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(t('settingDevHeading')).setHeading();

		new Setting(containerEl)
			.setName(t('settingGenerateMockSectionName'))
			.setDesc(t('settingGenerateMockSectionDesc'))
			.addButton((btn) =>
				btn.setButtonText(t('settingGenerateMockButtonLabel')).onClick(async () => {
					const count = await new MockNoteBuilder(this.app).build();
					new Notice(`${count} ${t('settingGenerateMockSuccessNotice')}`);
				}),
			);
	}

	private refreshInboxView(): void {
		this.app.workspace.getLeavesOfType(VIEW_TYPE_INBOX).forEach((leaf) => {
			(leaf.view as InboxView).refresh().catch(console.error);
		});
	}
}
