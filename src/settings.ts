import { ExcludedFolders } from './ExcludedFolders';
import { ContextOrderSetting } from './ContextOrderSetting';
import { EnvironmentContexts } from './EnvironmentContexts';
import { t } from './i18n';
import { InboxInitializer } from './InboxInitializer';
import NextLevelGtdPlugin from './main';
import { MockNoteBuilder } from './MockNoteBuilder';
import type { NextActionPin } from './NextActionPin';
import { App, Notice, PluginSettingTab, Setting, TextComponent } from 'obsidian';
import { ExcludedFolder } from './types';
import { ConfirmModal } from './ui/ConfirmModal';
import { FileView } from './ui/FileView';
import { FolderSuggest } from './ui/FolderSuggest';
import { NextActionsView, VIEW_TYPE_NEXT_ACTIONS } from './ui/NextActionsView';

export interface NextLevelGtdSettings {
	_placeholder: null;
	evaluateStructuralNextActionBlocking: boolean;
	excludedFolders: readonly ExcludedFolder[];
	contextOrder: readonly string[];
	environmentContexts: readonly string[];
	pinnedFileNames: readonly string[];
	pinnedActionPins: readonly NextActionPin[];
}

export const DEFAULT_SETTINGS: NextLevelGtdSettings = {
	_placeholder: null,
	evaluateStructuralNextActionBlocking: true,
	excludedFolders: [],
	contextOrder: [],
	environmentContexts: [],
	pinnedFileNames: [],
	pinnedActionPins: [],
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
		this.renderNextActionsSection(containerEl);
		this.renderExcludedFoldersSection(containerEl);
		this.renderContextOrderSection(containerEl);
		this.renderEnvironmentContextsSection(containerEl);
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

	private renderNextActionsSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(t('settingNextActionsSectionName')).setHeading();
		new Setting(containerEl)
			.setName(t('settingEvaluateStructuralBlockingName'))
			.setDesc(t('settingEvaluateStructuralBlockingDesc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.evaluateStructuralNextActionBlocking)
					.onChange(async (value) => {
						this.plugin.settings = {
							...this.plugin.settings,
							evaluateStructuralNextActionBlocking: value,
						};
						await this.plugin.saveSettings();
						this.refreshNextActionsView();
					}),
			);
	}

	private renderExcludedFoldersSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(t('settingExcludedFoldersSectionName')).setHeading();
		new Setting(containerEl).setDesc(t('settingExcludedFoldersSectionDesc'));

		const manager = new ExcludedFolders(this.plugin);
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
							this.refreshFileView();
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
				this.refreshFileView();
				this.display();
			}),
		);
	}

	private renderContextOrderSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(t('settingContextOrderSectionName')).setHeading();
		new Setting(containerEl).setDesc(t('settingContextOrderSectionDesc'));

		const manager = new ContextOrderSetting(this.plugin);
		for (const ctx of manager.getAll()) {
			new Setting(containerEl)
				.setName('#' + ctx)
				.addExtraButton((btn) =>
					btn
						.setIcon('arrow-up')
						.setTooltip(t('settingContextOrderMoveUpButton'))
						.onClick(async () => {
							await manager.moveUp(ctx);
							this.refreshNextActionsView();
							this.display();
						}),
				)
				.addExtraButton((btn) =>
					btn
						.setIcon('arrow-down')
						.setTooltip(t('settingContextOrderMoveDownButton'))
						.onClick(async () => {
							await manager.moveDown(ctx);
							this.refreshNextActionsView();
							this.display();
						}),
				)
				.addExtraButton((btn) =>
					btn
						.setIcon('trash')
						.setTooltip(t('settingContextOrderRemoveButton'))
						.onClick(async () => {
							await manager.remove(ctx);
							this.refreshNextActionsView();
							this.display();
						}),
				);
		}

		let inputText: TextComponent;
		const addSetting = new Setting(containerEl).addText((text) => {
			inputText = text;
			text.setPlaceholder(t('settingContextOrderPlaceholder'));
		});
		addSetting.addButton((btn) =>
			btn.setButtonText(t('settingContextOrderAddButton')).onClick(async () => {
				const raw = inputText.getValue().trim().toLowerCase().replace(/^#/, '');
				if (raw === '' || manager.includes(raw)) return;
				await manager.add(raw);
				this.refreshNextActionsView();
				this.display();
			}),
		);
	}

	private renderEnvironmentContextsSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(t('settingEnvContextsSectionName')).setHeading();
		new Setting(containerEl).setDesc(t('settingEnvContextsSectionDesc'));

		const manager = new EnvironmentContexts(this.plugin);
		for (const ctx of manager.getAll()) {
			new Setting(containerEl).setName('#' + ctx).addExtraButton((btn) =>
				btn
					.setIcon('trash')
					.setTooltip(t('settingEnvContextsRemoveButton'))
					.onClick(async () => {
						await manager.remove(ctx);
						this.display();
					}),
			);
		}

		let inputText: TextComponent;
		const addSetting = new Setting(containerEl).addText((text) => {
			inputText = text;
			text.setPlaceholder(t('settingEnvContextsPlaceholder'));
		});
		addSetting.addButton((btn) =>
			btn.setButtonText(t('settingEnvContextsAddButton')).onClick(async () => {
				const raw = inputText.getValue().trim().toLowerCase().replace(/^#/, '');
				if (raw === '' || raw === 'anywhere' || manager.includes(raw)) return;
				await manager.add(raw);
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

	private refreshFileView(): void {
		this.app.workspace.getLeavesOfType(FileView.viewType).forEach((leaf) => {
			(leaf.view as FileView).refresh().catch(console.error);
		});
	}

	private refreshNextActionsView(): void {
		this.app.workspace.getLeavesOfType(VIEW_TYPE_NEXT_ACTIONS).forEach((leaf) => {
			(leaf.view as NextActionsView).refresh().catch(console.error);
		});
	}
}
