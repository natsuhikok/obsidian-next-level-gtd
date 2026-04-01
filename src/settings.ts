import { buildMockNotes, MOCK_FOLDER } from 'buildMockNotes';
import { t } from 'i18n';
import NextLevelGtdPlugin from 'main';
import { NoteState } from 'NoteState';
import { App, Notice, PluginSettingTab, Setting, TextComponent } from 'obsidian';
import { setNoteState } from 'setNoteState';
import { ConfirmModal } from 'ui/ConfirmModal';
import { FolderSuggest } from 'ui/FolderSuggest';
import { InboxView, VIEW_TYPE_INBOX } from 'ui/InboxView';

export interface NextLevelGtdSettings {
	_placeholder: null;
	excludedFolders: readonly string[];
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

		new Setting(containerEl)
			.setName(t('settingInitSectionName'))
			.setDesc(t('settingInitSectionDesc'))
			.addButton((btn) =>
				btn.setButtonText(t('settingInitButtonLabel')).onClick(() => {
					const { excludedFolders } = this.plugin.settings;
					const targets = this.app.vault
						.getMarkdownFiles()
						.filter(
							(f) =>
								!excludedFolders.some((ef) => f.path.startsWith(ef + '/')) &&
								NoteState.parse(
									this.app.metadataCache.getFileCache(f)?.frontmatter ?? null,
								).isInbox,
						);
					const count = targets.length;
					const message = `${count} ${t('settingInitConfirmMessage')}`;
					new ConfirmModal(this.app, message, () => {
						void Promise.all(
							targets.map((f) => setNoteState(this.app, f, 'reference')),
						).then(() => {
							new Notice(`${count} ${t('settingInitSuccessNotice')}`);
						});
					}).open();
				}),
			);

		// Excluded folders section
		new Setting(containerEl).setName(t('settingExcludedFoldersSectionName')).setHeading();
		new Setting(containerEl).setDesc(t('settingExcludedFoldersSectionDesc'));

		for (const folder of this.plugin.settings.excludedFolders) {
			new Setting(containerEl).setName(folder).addExtraButton((btn) =>
				btn
					.setIcon('trash')
					.setTooltip(t('settingExcludedFoldersRemoveButton'))
					.onClick(async () => {
						this.plugin.settings = {
							...this.plugin.settings,
							excludedFolders: this.plugin.settings.excludedFolders.filter(
								(f) => f !== folder,
							),
						};
						await this.plugin.saveSettings();
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
				if (raw === '' || this.plugin.settings.excludedFolders.includes(raw)) return;
				this.plugin.settings = {
					...this.plugin.settings,
					excludedFolders: [...this.plugin.settings.excludedFolders, raw],
				};
				await this.plugin.saveSettings();
				this.refreshInboxView();
				this.display();
			}),
		);

		new Setting(containerEl).setName(t('settingDevHeading')).setHeading();

		new Setting(containerEl)
			.setName(t('settingGenerateMockSectionName'))
			.setDesc(t('settingGenerateMockSectionDesc'))
			.addButton((btn) =>
				btn.setButtonText(t('settingGenerateMockButtonLabel')).onClick(async () => {
					const folderExists = await this.app.vault.adapter.exists(MOCK_FOLDER);
					if (!folderExists) await this.app.vault.createFolder(MOCK_FOLDER);
					const notes = buildMockNotes();
					await Promise.all(
						notes.map(async ({ path, content }) => {
							const exists = await this.app.vault.adapter.exists(path);
							if (!exists) await this.app.vault.create(path, content);
						}),
					);
					new Notice(`${notes.length} ${t('settingGenerateMockSuccessNotice')}`);
				}),
			);
	}

	private refreshInboxView(): void {
		this.app.workspace.getLeavesOfType(VIEW_TYPE_INBOX).forEach((leaf) => {
			(leaf.view as InboxView).refresh().catch(console.error);
		});
	}
}
